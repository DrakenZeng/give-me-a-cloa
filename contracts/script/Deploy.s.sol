// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ZetaTipRouter.sol";

/**
 * @title Deploy
 * @notice Deployment script for ZetaTipRouter
 */
contract Deploy is Script {
    function run() external {
        // 从环境变量读取配置
        address gateway = vm.envAddress("GATEWAY");
        address universalApp = vm.envAddress("UNIVERSAL_APP");
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");
        uint256 platformFeeRate = vm.envUint("PLATFORM_FEE_RATE");

        // 读取部署者私钥
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("Deploying ZetaTipRouter with:");
        console.log("  Gateway:", gateway);
        console.log("  Universal App:", universalApp);
        console.log("  Fee Recipient:", feeRecipient);
        console.log("  Platform Fee Rate:", platformFeeRate);

        vm.startBroadcast(deployerPrivateKey);

        // 部署 ZetaTipRouter
        ZetaTipRouter tipRouter = new ZetaTipRouter(
            gateway,
            universalApp,
            feeRecipient,
            platformFeeRate
        );

        console.log("ZetaTipRouter deployed at:", address(tipRouter));

        vm.stopBroadcast();

        console.log("");
        console.log("Deployment complete!");
        console.log("Please verify the contract on block explorer:");
        console.log("forge verify-contract");
        console.log(address(tipRouter));
        console.log("src/ZetaTipRouter.sol:ZetaTipRouter");
    }
}
