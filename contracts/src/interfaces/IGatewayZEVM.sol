// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./Revert.sol";

/// @notice Struct for message context
/// @param sender Address of sender
/// @param chainID Source chain ID
struct MessageContext {
    bytes sender;
    uint256 chainID;
}

/// @title IGatewayZEVM
/// @notice Interface for ZetaChain Gateway (ZetaChain side)
interface IGatewayZEVM {
    /// @notice Withdraw ZRC20 tokens and call contract on connected chain
    /// @param receiver Receiver address on target chain
    /// @param amount Amount of tokens
    /// @param zrc20 ZRC20 token address
    /// @param message Encoded message for target contract
    /// @param revertOptions Revert options
    function withdrawAndCall(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        bytes calldata message,
        RevertOptions calldata revertOptions
    ) external;

    /// @notice Withdraw ZRC20 tokens
    /// @param receiver Receiver address
    /// @param amount Amount of tokens
    /// @param zrc20 ZRC20 token address
    /// @param revertOptions Revert options
    function withdraw(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        RevertOptions calldata revertOptions
    ) external;

    /// @notice Call contract on connected chain without asset transfer
    /// @param receiver Receiver address
    /// @param chainId Target chain ID
    /// @param message Encoded message
    /// @param revertOptions Revert options
    function call(
        bytes memory receiver,
        uint256 chainId,
        bytes calldata message,
        RevertOptions calldata revertOptions
    ) external;
}

/// @title UniversalContract
/// @notice Interface for contracts that can receive calls from Gateway on ZetaChain
interface UniversalContract {
    /// @notice Called by Gateway when a cross-chain call is received
    /// @param context Message context
    /// @param zrc20 Address of ZRC20 token (if any)
    /// @param amount Amount of tokens (if any)
    /// @param message Encoded message
    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external;

    /// @notice Called by Gateway when a cross-chain call is reverted
    /// @param revertContext Revert context
    function onRevert(RevertContext calldata revertContext) external;
}
