// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UniversalTipApp.sol";

/**
 * @title DeployUniversalApp
 * @notice Deployment script for UniversalTipApp on ZetaChain
 */
contract DeployUniversalApp is Script {
    function run() external {
        // 从环境变量读取配置
        address gatewayZEVM = vm.envAddress("GATEWAY_ZEVM");

        // 读取部署者私钥
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("Deploying UniversalTipApp with:");
        console.log("  Gateway ZEVM:", gatewayZEVM);

        vm.startBroadcast(deployerPrivateKey);

        // 部署 UniversalTipApp
        UniversalTipApp app = new UniversalTipApp(gatewayZEVM);

        console.log("UniversalTipApp deployed at:", address(app));

        vm.stopBroadcast();

        console.log("");
        console.log("Deployment complete!");
        console.log("");
        console.log("Next steps:");
        console.log("1. Copy the Universal App address");
        console.log("2. Authorize routers from each chain:");
        console.log("   app.authorizeRouter(11155111, SEPOLIA_ROUTER_ADDRESS)");
        console.log("   app.authorizeRouter(97, BSC_TESTNET_ROUTER_ADDRESS)");
        console.log("3. Update .env files with UNIVERSAL_APP address");
        console.log("4. Redeploy ZetaTipRouter on source chains");
    }
}
