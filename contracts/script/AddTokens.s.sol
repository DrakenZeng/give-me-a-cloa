// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ZetaTipRouter.sol";

/**
 * @title AddTokens
 * @notice Script to add supported tokens to ZetaTipRouter
 */
contract AddTokens is Script {
    function run() external {
        address tipRouterAddress = vm.envAddress("TIP_ROUTER_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // 常见稳定币地址 (Sepolia Testnet)
        address[] memory tokens = new address[](3);
        tokens[0] = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8; // USDC Sepolia
        tokens[1] = 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0; // USDT Sepolia
        tokens[2] = 0x68194a729C2450ad26072b3D33ADaCbcef39D574; // DAI Sepolia

        console.log("Adding supported tokens to TipRouter at:", tipRouterAddress);

        vm.startBroadcast(deployerPrivateKey);

        ZetaTipRouter tipRouter = ZetaTipRouter(payable(tipRouterAddress));

        for (uint256 i = 0; i < tokens.length; i++) {
            console.log("  Adding token:", tokens[i]);
            tipRouter.addSupportedToken(tokens[i]);
        }

        vm.stopBroadcast();

        console.log("");
        console.log("Tokens added successfully!");
    }
}
