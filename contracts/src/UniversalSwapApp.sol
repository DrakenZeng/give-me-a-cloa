// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@zetachain/toolkit/contracts/shared/interfaces/IZRC20.sol";

import "./interfaces/IGatewayZEVM.sol";

interface IUniswapV2PairMinimal {
    function token0() external view returns (address);

    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external;
}

/**
 * @title UniversalSwapApp
 * @notice Universal App on ZetaChain: swaps incoming ZRC20 to a target ZRC20 and optionally withdraws to the target chain.
 * @dev Payload format: (address targetZRC20, bytes recipient, bool withdrawFlag)
 */
contract UniversalSwapApp is Ownable {
    IGatewayZEVM public gateway;
    address public uniswapRouter;
    uint256 public onRevertGasLimit;

    error OnlyGateway();
    error InvalidAddress();
    error ApprovalFailed();
    error TransferFailed();
    error InsufficientAmount();
    error WrongGasToken();
    error InvalidPair();

    event SwapAndSend(
        bytes sender,
        bytes indexed recipient,
        address indexed inputZRC20,
        address indexed targetZRC20,
        uint256 inputAmount,
        uint256 outputAmount,
        bool withdrawFlag
    );

    constructor(
        address gateway_,
        address uniswapRouter_,
        uint256 onRevertGasLimit_,
        address owner_
    ) Ownable(owner_) {
        if (gateway_ == address(0) || uniswapRouter_ == address(0)) {
            revert InvalidAddress();
        }
        gateway = IGatewayZEVM(gateway_);
        uniswapRouter = uniswapRouter_;
        onRevertGasLimit = onRevertGasLimit_;
    }

    function updateUniswapRouter(address newRouter) external onlyOwner {
        if (newRouter == address(0)) revert InvalidAddress();
        uniswapRouter = newRouter;
    }

    function updateGateway(address newGateway) external onlyOwner {
        if (newGateway == address(0)) revert InvalidAddress();
        gateway = IGatewayZEVM(newGateway);
    }

    function updateOnRevertGasLimit(uint256 newLimit) external onlyOwner {
        onRevertGasLimit = newLimit;
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external {
        if (msg.sender != address(gateway)) revert OnlyGateway();

        (address targetZRC20, bytes memory recipient, bool withdrawFlag) =
            abi.decode(message, (address, bytes, bool));

        (uint256 out, address gasZRC20, uint256 gasFee) =
            _handleGasAndSwap(zrc20, amount, targetZRC20, withdrawFlag);

        emit SwapAndSend(
            abi.encodePacked(context.sender),
            recipient,
            zrc20,
            targetZRC20,
            amount,
            out,
            withdrawFlag
        );

        _send(
            abi.encodePacked(context.sender),
            recipient,
            zrc20,
            targetZRC20,
            out,
            withdrawFlag,
            gasZRC20,
            gasFee
        );
    }

    function onRevert(RevertContext calldata context) external payable {
        if (msg.sender != address(gateway)) revert OnlyGateway();

        (bytes memory originalSender, address originalZRC20) =
            abi.decode(context.revertMessage, (bytes, address));

        (uint256 out,,) =
            _handleGasAndSwap(context.asset, context.amount, originalZRC20, true);

        gateway.withdraw(
            originalSender,
            out,
            originalZRC20,
            RevertOptions({
                revertAddress: address(bytes20(originalSender)),
                callOnRevert: false,
                abortAddress: address(0),
                revertMessage: "",
                onRevertGasLimit: onRevertGasLimit
            })
        );
    }

    function _handleGasAndSwap(
        address inputZRC20,
        uint256 amount,
        address targetZRC20,
        bool withdrawFlag
    ) internal returns (uint256 out, address gasZRC20, uint256 gasFee) {
        if (withdrawFlag) {
            (gasZRC20, gasFee) = IZRC20(targetZRC20).withdrawGasFee();
            if (gasZRC20 != targetZRC20) revert WrongGasToken();
        }

        uint256 totalOut = _swapViaPairs(inputZRC20, targetZRC20, amount);

        if (!withdrawFlag) {
            return (totalOut, address(0), 0);
        }

        if (totalOut <= gasFee) revert InsufficientAmount();
        return (totalOut - gasFee, gasZRC20, gasFee);
    }

    function _send(
        bytes memory originalSender,
        bytes memory recipient,
        address inputZRC20,
        address targetZRC20,
        uint256 out,
        bool withdrawFlag,
        address gasZRC20,
        uint256 gasFee
    ) internal {
        if (withdrawFlag) {
            if (gasZRC20 == targetZRC20) {
                if (!IZRC20(gasZRC20).approve(address(gateway), out + gasFee)) {
                    revert ApprovalFailed();
                }
            } else {
                if (!IZRC20(gasZRC20).approve(address(gateway), gasFee)) {
                    revert ApprovalFailed();
                }
                if (!IZRC20(targetZRC20).approve(address(gateway), out)) {
                    revert ApprovalFailed();
                }
            }

            gateway.withdraw(
                recipient,
                out,
                targetZRC20,
                RevertOptions({
                    revertAddress: address(this),
                    callOnRevert: true,
                    abortAddress: address(0),
                    revertMessage: abi.encode(originalSender, inputZRC20),
                    onRevertGasLimit: onRevertGasLimit
                })
            );
            return;
        }

        address recipientAddress = _bytesToAddress(recipient);
        if (!IZRC20(targetZRC20).transfer(recipientAddress, out)) {
            revert TransferFailed();
        }
    }

    function _swapViaPairs(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        if (tokenIn == tokenOut) return amountIn;

        address factory = IUniswapV2Router02(uniswapRouter).factory();
        address wzeta = IUniswapV2Router02(uniswapRouter).WETH();

        address directPair = SwapHelperLib.uniswapv2PairFor(
            factory,
            tokenIn,
            tokenOut
        );
        if (_hasReserves(directPair)) {
            return _swapPair(factory, tokenIn, tokenOut, amountIn);
        }

        if (tokenIn == wzeta || tokenOut == wzeta) revert InvalidPair();

        uint256 intermediateOut = _swapPair(factory, tokenIn, wzeta, amountIn);
        return _swapPair(factory, wzeta, tokenOut, intermediateOut);
    }

    function _hasReserves(address pair) internal view returns (bool) {
        (bool ok, bytes memory data) = pair.staticcall(
            abi.encodeWithSelector(IUniswapV2PairMinimal.getReserves.selector)
        );
        if (!ok || data.length < 96) return false;
        (uint112 r0, uint112 r1, ) = abi.decode(data, (uint112, uint112, uint32));
        return r0 > 0 && r1 > 0;
    }

    function _swapPair(
        address factory,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        address pair = SwapHelperLib.uniswapv2PairFor(factory, tokenIn, tokenOut);

        address token0 = IUniswapV2PairMinimal(pair).token0();
        (uint112 reserve0, uint112 reserve1, ) = IUniswapV2PairMinimal(pair).getReserves();
        if (reserve0 == 0 || reserve1 == 0) revert InvalidPair();

        (uint256 reserveIn, uint256 reserveOut) = tokenIn == token0
            ? (uint256(reserve0), uint256(reserve1))
            : (uint256(reserve1), uint256(reserve0));

        amountOut = _getAmountOut(amountIn, reserveIn, reserveOut);

        if (!IZRC20(tokenIn).transfer(pair, amountIn)) revert TransferFailed();

        (uint256 amount0Out, uint256 amount1Out) = tokenIn == token0
            ? (uint256(0), amountOut)
            : (amountOut, uint256(0));
        IUniswapV2PairMinimal(pair).swap(amount0Out, amount1Out, address(this), "");
    }

    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256) {
        if (amountIn == 0 || reserveIn == 0 || reserveOut == 0) revert InvalidPair();
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        return numerator / denominator;
    }

    function _bytesToAddress(bytes memory b) internal pure returns (address) {
        if (b.length != 20) revert InvalidAddress();
        address a;
        assembly {
            a := shr(96, mload(add(b, 32)))
        }
        return a;
    }
}
