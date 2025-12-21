// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Maximum allowed gas limit for revert operations.
uint256 constant MAX_REVERT_GAS_LIMIT = 2_000_000;

/// @notice Error indicating revert gas limit exceeds maximum allowed
/// @param provided The gas limit provided for revert operation.
/// @param maximum The maximum allowed gas limit for revert operation.
error RevertGasLimitExceeded(uint256 provided, uint256 maximum);

/// @notice Struct containing revert options
/// @param revertAddress Address to receive revert.
/// @param callOnRevert Flag if onRevert hook should be called.
/// @param abortAddress Address to receive funds if aborted.
/// @param revertMessage Arbitrary data sent back in onRevert.
/// @param onRevertGasLimit Gas limit for revert tx, unused on GatewayZEVM methods
struct RevertOptions {
    address revertAddress;
    bool callOnRevert;
    address abortAddress;
    bytes revertMessage;
    uint256 onRevertGasLimit;
}

/// @notice Struct containing revert context passed to onRevert.
/// @param sender Address of account that initiated smart contract call.
/// @param asset Address of asset. On a connected chain, it contains the fungible
/// token address or is empty if it's a gas token. On ZetaChain, it contains the
/// address of the ZRC20.
/// @param amount Amount specified with the transaction.
/// @param revertMessage Arbitrary data sent back in onRevert.
struct RevertContext {
    address sender;
    address asset;
    uint256 amount;
    bytes revertMessage;
}

/// @title Revertable
/// @notice Interface for contracts that support revertable calls.
interface Revertable {
    /// @notice Called when a revertable call is made.
    /// @param revertContext Revert context to pass to onRevert.
    function onRevert(RevertContext calldata revertContext) external payable;
}
