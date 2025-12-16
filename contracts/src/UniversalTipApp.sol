// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IGatewayZEVM.sol";

/**
 * @title UniversalTipApp
 * @notice Universal App deployed on ZetaChain to handle cross-chain tips
 * @dev This contract receives cross-chain messages from source chains and forwards tips to target chains
 */
contract UniversalTipApp is Ownable {
    /// @notice ZetaChain Gateway contract
    IGatewayZEVM public gateway;

    /// @notice Mapping of source chain tip routers (for security)
    mapping(uint256 => address) public authorizedRouters;

    // ============ Events ============

    event TipReceived(
        bytes32 indexed tipId,
        address indexed tipper,
        address indexed recipient,
        uint256 sourceChainId,
        uint256 targetChainId,
        address token,
        uint256 amount,
        string message
    );

    event TipForwarded(
        bytes32 indexed tipId,
        uint256 targetChainId,
        address recipient,
        uint256 amount
    );

    // ============ Constructor ============

    constructor(address _gateway) Ownable(msg.sender) {
        require(_gateway != address(0), "Invalid gateway");
        gateway = IGatewayZEVM(_gateway);
    }

    // ============ Core Functions ============

    /**
     * @notice Called by ZetaChain Gateway when receiving cross-chain message
     * @param context Message context containing sender information
     * @param zrc20 Address of the ZRC20 token
     * @param amount Amount of tokens
     * @param message Encoded tip data
     */
    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external {
        require(msg.sender == address(gateway), "Only Gateway");

        // Decode tip information
        (
            bytes32 tipId,
            address tipper,
            address recipient,
            ,
            ,
            uint256 targetChainId,
            string memory tipMessage
        ) = abi.decode(
            message,
            (bytes32, address, address, address, uint256, uint256, string)
        );

        // Verify the source chain router is authorized
        uint256 sourceChainId = context.chainID;
        address sourceSender = abi.decode(context.sender, (address));
        require(
            authorizedRouters[sourceChainId] == sourceSender,
            "Unauthorized router"
        );

        emit TipReceived(
            tipId,
            tipper,
            recipient,
            sourceChainId,
            targetChainId,
            zrc20,
            amount,
            tipMessage
        );

        // Forward tip to target chain
        _forwardTip(
            tipId,
            recipient,
            zrc20,
            amount,
            targetChainId,
            tipMessage
        );
    }

    /**
     * @dev Forward tip to target chain
     */
    function _forwardTip(
        bytes32 tipId,
        address recipient,
        address zrc20,
        uint256 amount,
        uint256 targetChainId,
        string memory message
    ) internal {
        // Encode message for target chain
        bytes memory callData = abi.encode(tipId, recipient, amount, message);

        // Call ZetaChain Gateway to withdraw and call target chain
        gateway.withdrawAndCall(
            abi.encodePacked(recipient),
            amount,
            zrc20,
            callData,
            RevertOptions({
                revertAddress: address(this),
                callOnRevert: true,
                abortAddress: address(0),
                revertMessage: abi.encode(tipId),
                onRevertGasLimit: 500000
            })
        );

        emit TipForwarded(tipId, targetChainId, recipient, amount);
    }

    /**
     * @notice Called by Gateway when withdrawal fails
     * @param revertContext Revert context
     */
    function onRevert(RevertContext calldata revertContext) external {
        require(msg.sender == address(gateway), "Only Gateway");

        // Decode tipId
        bytes32 tipId = abi.decode(revertContext.revertMessage, (bytes32));

        // Log the failure - in production, you might want to refund to source chain
        // For now, we just emit an event
        emit TipForwarded(tipId, 0, address(0), 0);
    }

    // ============ Admin Functions ============

    /**
     * @notice Authorize a tip router on a specific chain
     * @param chainId Chain ID
     * @param router Router address
     */
    function authorizeRouter(
        uint256 chainId,
        address router
    ) external onlyOwner {
        require(router != address(0), "Invalid router");
        authorizedRouters[chainId] = router;
    }

    /**
     * @notice Remove authorization for a router
     * @param chainId Chain ID
     */
    function revokeRouter(uint256 chainId) external onlyOwner {
        delete authorizedRouters[chainId];
    }

    /**
     * @notice Update gateway address
     * @param newGateway New gateway address
     */
    function updateGateway(address newGateway) external onlyOwner {
        require(newGateway != address(0), "Invalid gateway");
        gateway = IGatewayZEVM(newGateway);
    }
}
