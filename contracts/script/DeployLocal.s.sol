// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ZetaTipRouter.sol";
import "../test/ZetaTipRouter.t.sol";

/**
 * @title DeployLocal
 * @notice 本地测试部署脚本 - 部署 Mock 合约和 TipRouter
 */
contract DeployLocal is Script {
    function run() external {
        // Anvil 默认私钥 (第一个账户)
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. 部署 Mock ERC20 (USDC)
        MockERC20 usdc = new MockERC20("USD Coin", "USDC", 6);
        console.log("Mock USDC deployed at:", address(usdc));

        // 2. 部署 Mock Gateway
        MockGatewayEVM gateway = new MockGatewayEVM();
        console.log("Mock Gateway deployed at:", address(gateway));

        // 3. 部署 ZetaTipRouter
        address universalApp = address(0x1234567890123456789012345678901234567890);
        address feeRecipient = deployer;
        uint256 platformFeeRate = 100; // 1%

        ZetaTipRouter tipRouter = new ZetaTipRouter(
            address(gateway),
            universalApp,
            feeRecipient,
            platformFeeRate
        );
        console.log("ZetaTipRouter deployed at:", address(tipRouter));

        // 4. 添加 USDC 到支持的代币列表
        tipRouter.addSupportedToken(address(usdc));
        console.log("USDC added to supported tokens");

        // 5. 给测试账户铸造一些 USDC
        address testUser = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Anvil 第二个账户
        usdc.mint(testUser, 10000 * 10 ** 6); // 10,000 USDC
        console.log("Minted 10,000 USDC to test user:", testUser);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("USDC:        ", address(usdc));
        console.log("Gateway:     ", address(gateway));
        console.log("TipRouter:   ", address(tipRouter));
        console.log("Test User:   ", testUser);
        console.log("");
        console.log("To interact with the contracts, use cast:");
        console.log("  cast call", address(tipRouter), "\"platformFeeRate()\"");
    }
}
