// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UniversalSwapApp.sol";

/**
 * @title DeployUniversalSwapApp
 * @notice Deploy UniversalSwapApp on ZetaChain Athens testnet
 * @dev Env:
 * - PRIVATE_KEY
 * - GATEWAY_ZEVM
 * - UNISWAP_ROUTER
 * - ON_REVERT_GAS_LIMIT (optional, default 500000)
 */
contract DeployUniversalSwapApp is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address gatewayZEVM = vm.envAddress("GATEWAY_ZEVM");
        address uniswapRouter = vm.envAddress("UNISWAP_ROUTER");
        uint256 onRevertGasLimit =
            vm.envOr("ON_REVERT_GAS_LIMIT", uint256(500000));

        vm.startBroadcast(deployerPrivateKey);

        UniversalSwapApp app = new UniversalSwapApp(
            gatewayZEVM,
            uniswapRouter,
            onRevertGasLimit,
            vm.addr(deployerPrivateKey)
        );

        console.log("UniversalSwapApp deployed at:", address(app));

        vm.stopBroadcast();
    }
}

