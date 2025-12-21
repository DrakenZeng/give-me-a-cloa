// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Revert.sol";

/// @notice Struct for message context
/// @param sender Address of sender for omnichain calls
struct MessageContext {
    address sender;
}

/// @title IGatewayEVM
/// @notice Interface for the Gateway contract for EVM chains
interface IGatewayEVM {
    /// @notice Emitted when a contract call is executed
    event Executed(
        address indexed destination,
        uint256 value,
        bytes data
    );

    /// @notice Emitted when a contract call with ERC20 is executed
    event ExecutedWithERC20(
        address indexed token,
        address indexed to,
        uint256 amount,
        bytes data
    );

    /// @notice Emitted when a call is reverted
    event Reverted(
        address indexed to,
        address indexed token,
        uint256 amount,
        bytes data,
        RevertContext revertContext
    );

    /// @notice Emitted when a deposit is made
    event Deposited(
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        address asset,
        bytes payload,
        RevertOptions revertOptions
    );

    /// @notice Emitted when a deposit and call is made
    event DepositedAndCalled(
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        address asset,
        bytes payload,
        RevertOptions revertOptions
    );

    /// @notice Emitted when an omnichain call is made
    event Called(
        address indexed sender,
        address indexed receiver,
        bytes payload,
        RevertOptions revertOptions
    );

    /// @notice Error for zero address input
    error ZeroAddress();

    /// @notice Error for execution failed
    error ExecutionFailed();

    /// @notice Error for insufficient ETH amount
    error InsufficientEVMAmount();

    /// @notice Error for insufficient ERC20 token amount
    error InsufficientERC20Amount();

    /// @notice Error for approval failed
    error ApprovalFailed();

    /// @notice Executes a call to a contract
    /// @param destination Address to call
    /// @param data Calldata to pass to the call
    /// @return bytes Return data from the call
    function execute(
        address destination,
        bytes calldata data
    ) external payable returns (bytes memory);

    /// @notice Executes a call to a contract with ERC20 tokens
    /// @param token Address of the ERC20 token
    /// @param to Address to call
    /// @param amount Amount of tokens to transfer
    /// @param data Calldata to pass to the call
    /// @return bytes Return data from the call
    function executeWithERC20(
        address token,
        address to,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes memory);

    /// @notice Deposits ETH to the Gateway
    /// @param receiver Address to receive the deposited funds on ZetaChain
    /// @param revertOptions Options for reverting the transaction
    function deposit(
        address receiver,
        RevertOptions calldata revertOptions
    ) external payable;

    /// @notice Deposits ERC20 tokens to the Gateway
    /// @param receiver Address to receive the deposited funds on ZetaChain
    /// @param amount Amount of tokens to deposit
    /// @param asset Address of the ERC20 token
    /// @param revertOptions Options for reverting the transaction
    function deposit(
        address receiver,
        uint256 amount,
        address asset,
        RevertOptions calldata revertOptions
    ) external;

    /// @notice Deposits ETH and calls a universal app
    /// @param receiver Address of the universal app contract on ZetaChain
    /// @param payload Encoded call data to pass to the universal app
    /// @param revertOptions Options for reverting the transaction
    function depositAndCall(
        address receiver,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external payable;

    /// @notice Deposits ERC20 tokens and calls a universal app
    /// @param receiver Address of the universal app contract on ZetaChain
    /// @param amount Amount of tokens to deposit
    /// @param asset Address of the ERC20 token
    /// @param payload Encoded call data to pass to the universal app
    /// @param revertOptions Options for reverting the transaction
    function depositAndCall(
        address receiver,
        uint256 amount,
        address asset,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external;

    /// @notice Calls a universal app without asset transfer
    /// @param receiver Address of the universal app contract on ZetaChain
    /// @param payload Encoded call data to pass to the universal app
    /// @param revertOptions Options for reverting the transaction
    function call(
        address receiver,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external;
}

/// @title UniversalContract
/// @notice Interface for contracts that can receive calls from the Gateway
interface UniversalContract {
    /// @notice Called by the Gateway when a cross-chain call is received
    /// @param context Message context containing sender information
    /// @param zrc20 Address of the ZRC20 token (if any)
    /// @param amount Amount of tokens transferred (if any)
    /// @param message Encoded message data
    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external;
}
