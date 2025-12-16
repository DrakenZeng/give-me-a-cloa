// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ZetaTipRouter.sol";
import "../src/interfaces/IGatewayEVM.sol";
import "../src/interfaces/Revert.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Mock ERC20 token for testing
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, 1000000 * 10 ** decimals_);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title MockGatewayEVM
 * @notice Mock Gateway for testing
 */
contract MockGatewayEVM is IGatewayEVM {
    event MockDepositAndCalled(
        address receiver,
        uint256 amount,
        address asset,
        bytes payload
    );

    function execute(
        address destination,
        bytes calldata data
    ) external payable returns (bytes memory) {
        return "";
    }

    function executeWithERC20(
        address token,
        address to,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes memory) {
        return "";
    }

    function deposit(
        address receiver,
        RevertOptions calldata revertOptions
    ) external payable {}

    function deposit(
        address receiver,
        uint256 amount,
        address asset,
        RevertOptions calldata revertOptions
    ) external {}

    function depositAndCall(
        address receiver,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external payable {}

    function depositAndCall(
        address receiver,
        uint256 amount,
        address asset,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external {
        emit MockDepositAndCalled(receiver, amount, asset, payload);
        // 模拟成功的跨链调用
    }

    function call(
        address receiver,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external {}

    // Helper function to simulate revert callback
    function simulateRevert(
        address target,
        address token,
        uint256 amount,
        bytes memory revertMessage
    ) external {
        RevertContext memory ctx = RevertContext({
            sender: address(this),
            asset: token,
            amount: amount,
            revertMessage: revertMessage
        });
        Revertable(target).onRevert(ctx);
    }
}

/**
 * @title ZetaTipRouterTest
 * @notice Test suite for ZetaTipRouter contract
 */
contract ZetaTipRouterTest is Test {
    ZetaTipRouter public tipRouter;
    MockERC20 public usdc;
    MockGatewayEVM public gateway;

    address public owner;
    address public feeRecipient;
    address public tipper;
    address public recipient;
    address public universalApp;

    uint256 public constant PLATFORM_FEE_RATE = 100; // 1%
    uint256 public constant MIN_TIP_AMOUNT = 0.1 * 10 ** 6; // 0.1 USDC

    // Allow contract to receive ETH
    receive() external payable {}

    function setUp() public {
        owner = address(this);
        feeRecipient = makeAddr("feeRecipient");
        tipper = makeAddr("tipper");
        recipient = makeAddr("recipient");
        universalApp = makeAddr("universalApp");

        // 部署 Mock 代币 (6 decimals for USDC)
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // 部署 Mock Gateway
        gateway = new MockGatewayEVM();

        // 部署 TipRouter
        tipRouter = new ZetaTipRouter(
            address(gateway),
            universalApp,
            feeRecipient,
            PLATFORM_FEE_RATE
        );

        // 添加支持的代币
        tipRouter.addSupportedToken(address(usdc));

        // 给 tipper 一些代币
        usdc.mint(tipper, 1000 * 10 ** 6); // 1000 USDC

        // 给 tipper 一些 ETH 用于跨链 gas
        vm.deal(tipper, 1 ether);
    }

    // ============ 同链打赏测试 ============

    function testTipSameChain() public {
        uint256 amount = 10 * 10 ** 6; // 10 USDC

        // 打赏者授权
        vm.startPrank(tipper);
        usdc.approve(address(tipRouter), amount);

        // 记录初始余额
        uint256 recipientBalanceBefore = usdc.balanceOf(recipient);
        uint256 feeRecipientBalanceBefore = usdc.balanceOf(feeRecipient);

        // 执行打赏
        bytes32 tipId = tipRouter.tipSameChain(
            recipient,
            address(usdc),
            amount,
            "Thanks for your work!"
        );

        vm.stopPrank();

        // 验证余额变化
        uint256 expectedNetAmount = amount - (amount * PLATFORM_FEE_RATE) / 10000;
        uint256 expectedFee = (amount * PLATFORM_FEE_RATE) / 10000;

        assertEq(
            usdc.balanceOf(recipient),
            recipientBalanceBefore + expectedNetAmount,
            "Recipient balance incorrect"
        );
        assertEq(
            usdc.balanceOf(feeRecipient),
            feeRecipientBalanceBefore + expectedFee,
            "Fee recipient balance incorrect"
        );

        // 验证 tipId 不为空
        assertTrue(tipId != bytes32(0), "TipId should not be zero");
    }

    function testTipSameChainInvalidRecipient() public {
        uint256 amount = 10 * 10 ** 6;

        vm.startPrank(tipper);
        usdc.approve(address(tipRouter), amount);

        vm.expectRevert("Invalid recipient");
        tipRouter.tipSameChain(
            address(0),
            address(usdc),
            amount,
            "test"
        );

        vm.stopPrank();
    }

    function testTipSameChainCannotTipSelf() public {
        uint256 amount = 10 * 10 ** 6;

        vm.startPrank(tipper);
        usdc.approve(address(tipRouter), amount);

        vm.expectRevert("Cannot tip yourself");
        tipRouter.tipSameChain(
            tipper,
            address(usdc),
            amount,
            "test"
        );

        vm.stopPrank();
    }

    function testTipSameChainTokenNotSupported() public {
        MockERC20 unsupportedToken = new MockERC20("Test", "TEST", 18);
        uint256 amount = 10 * 10 ** 18;

        unsupportedToken.mint(tipper, amount);

        vm.startPrank(tipper);
        unsupportedToken.approve(address(tipRouter), amount);

        vm.expectRevert("Token not supported");
        tipRouter.tipSameChain(
            recipient,
            address(unsupportedToken),
            amount,
            "test"
        );

        vm.stopPrank();
    }

    function testTipSameChainAmountTooLow() public {
        uint256 amount = MIN_TIP_AMOUNT - 1;

        vm.startPrank(tipper);
        usdc.approve(address(tipRouter), amount);

        vm.expectRevert("Invalid amount");
        tipRouter.tipSameChain(
            recipient,
            address(usdc),
            amount,
            "test"
        );

        vm.stopPrank();
    }

    // ============ 跨链打赏测试 ============

    function testTipCrossChain() public {
        uint256 amount = 10 * 10 ** 6; // 10 USDC
        uint256 targetChainId = 97; // BSC Testnet

        // 打赏者授权
        vm.startPrank(tipper);
        usdc.approve(address(tipRouter), amount);

        // 记录初始余额
        uint256 contractBalanceBefore = usdc.balanceOf(address(tipRouter));
        uint256 feeRecipientBalanceBefore = usdc.balanceOf(feeRecipient);

        // 执行跨链打赏
        bytes32 tipId = tipRouter.tipCrossChain(
            recipient,
            address(usdc),
            amount,
            targetChainId,
            "Cross-chain tip!"
        );

        vm.stopPrank();

        // 验证平台费用已收取
        uint256 expectedFee = (amount * PLATFORM_FEE_RATE) / 10000;
        assertEq(
            usdc.balanceOf(feeRecipient),
            feeRecipientBalanceBefore + expectedFee,
            "Fee not collected"
        );

        // 验证 tipId 不为空
        assertTrue(tipId != bytes32(0), "TipId should not be zero");

        // 验证 pending tip 已记录
        (address storedTipper, , uint256 storedAmount, , bool exists) = tipRouter
            .pendingTips(tipId);
        assertTrue(exists, "Pending tip should exist");
        assertEq(storedTipper, tipper, "Tipper address incorrect");
    }

    function testTipCrossChainSameChain() public {
        uint256 amount = 10 * 10 ** 6;

        vm.startPrank(tipper);
        usdc.approve(address(tipRouter), amount);

        vm.expectRevert("Use tipSameChain");
        tipRouter.tipCrossChain(
            recipient,
            address(usdc),
            amount,
            block.chainid, // Same chain
            "test"
        );

        vm.stopPrank();
    }

    // ============ Revert 测试 ============

    function testOnRevert() public {
        uint256 amount = 10 * 10 ** 6;
        uint256 targetChainId = 97;

        // 执行跨链打赏
        vm.startPrank(tipper);
        usdc.approve(address(tipRouter), amount);
        bytes32 tipId = tipRouter.tipCrossChain(
            recipient,
            address(usdc),
            amount,
            targetChainId,
            "test"
        );
        vm.stopPrank();

        // 记录打赏者初始余额
        uint256 tipperBalanceBefore = usdc.balanceOf(tipper);

        // 计算预期退款金额（扣除平台费后的金额）
        uint256 expectedRefund = amount - (amount * PLATFORM_FEE_RATE) / 10000;

        // 模拟 Gateway 调用 onRevert
        vm.startPrank(address(gateway));

        // 先将代币转给合约（模拟退款流程）
        usdc.mint(address(tipRouter), expectedRefund);

        gateway.simulateRevert(
            address(tipRouter),
            address(usdc),
            expectedRefund,
            abi.encode(tipId)
        );
        vm.stopPrank();

        // 验证退款
        assertEq(
            usdc.balanceOf(tipper),
            tipperBalanceBefore + expectedRefund,
            "Refund incorrect"
        );

        // 验证 pending tip 已删除
        (, , , , bool exists) = tipRouter.pendingTips(tipId);
        assertFalse(exists, "Pending tip should be deleted");
    }

    // ============ 管理功能测试 ============

    function testAddSupportedToken() public {
        address newToken = makeAddr("newToken");

        tipRouter.addSupportedToken(newToken);

        assertTrue(tipRouter.supportedTokens(newToken), "Token should be supported");
    }

    function testRemoveSupportedToken() public {
        tipRouter.removeSupportedToken(address(usdc));

        assertFalse(
            tipRouter.supportedTokens(address(usdc)),
            "Token should not be supported"
        );
    }

    function testUpdatePlatformFeeRate() public {
        uint256 newRate = 200; // 2%

        tipRouter.updatePlatformFeeRate(newRate);

        assertEq(tipRouter.platformFeeRate(), newRate, "Fee rate not updated");
    }

    function testUpdatePlatformFeeRateTooHigh() public {
        uint256 newRate = 600; // 6% (too high)

        vm.expectRevert("Fee too high");
        tipRouter.updatePlatformFeeRate(newRate);
    }

    function testUpdateFeeRecipient() public {
        address newRecipient = makeAddr("newRecipient");

        tipRouter.updateFeeRecipient(newRecipient);

        assertEq(tipRouter.feeRecipient(), newRecipient, "Fee recipient not updated");
    }

    function testUpdateGateway() public {
        address newGateway = makeAddr("newGateway");

        tipRouter.updateGateway(newGateway);

        assertEq(tipRouter.gateway(), newGateway, "Gateway not updated");
    }

    function testUpdateUniversalApp() public {
        address newApp = makeAddr("newApp");

        tipRouter.updateUniversalApp(newApp);

        assertEq(tipRouter.universalApp(), newApp, "Universal app not updated");
    }

    function testPauseUnpause() public {
        tipRouter.pause();
        assertTrue(tipRouter.paused(), "Contract should be paused");

        tipRouter.unpause();
        assertFalse(tipRouter.paused(), "Contract should be unpaused");
    }

    function testTipWhenPaused() public {
        uint256 amount = 10 * 10 ** 6;

        tipRouter.pause();

        vm.startPrank(tipper);
        usdc.approve(address(tipRouter), amount);

        vm.expectRevert();
        tipRouter.tipSameChain(
            recipient,
            address(usdc),
            amount,
            "test"
        );

        vm.stopPrank();
    }

    function testEmergencyWithdraw() public {
        uint256 amount = 100 * 10 ** 6;
        usdc.mint(address(tipRouter), amount);

        uint256 ownerBalanceBefore = usdc.balanceOf(owner);

        tipRouter.emergencyWithdraw(address(usdc), amount);

        assertEq(
            usdc.balanceOf(owner),
            ownerBalanceBefore + amount,
            "Emergency withdraw failed"
        );
    }

    function testEmergencyWithdrawETH() public {
        uint256 amount = 1 ether;
        vm.deal(address(tipRouter), amount);

        uint256 ownerBalanceBefore = owner.balance;

        tipRouter.emergencyWithdrawETH();

        assertEq(
            owner.balance,
            ownerBalanceBefore + amount,
            "Emergency ETH withdraw failed"
        );
    }

    // ============ 费用估算测试 ============

    function testEstimateFees() public {
        uint256 amount = 100 * 10 ** 6; // 100 USDC
        uint256 targetChainId = 97;

        (uint256 platformFee, uint256 netAmount) = tipRouter.estimateFees(
            targetChainId,
            amount
        );

        uint256 expectedFee = (amount * PLATFORM_FEE_RATE) / 10000;
        uint256 expectedNetAmount = amount - expectedFee;

        assertEq(platformFee, expectedFee, "Platform fee incorrect");
        assertEq(netAmount, expectedNetAmount, "Net amount incorrect");
    }

    // ============ Fuzz 测试 ============

    function testFuzzTipSameChain(uint256 amount) public {
        vm.assume(amount >= MIN_TIP_AMOUNT);
        vm.assume(amount <= 10000 * 10 ** 6); // MAX_TIP_AMOUNT
        vm.assume(amount <= usdc.balanceOf(tipper));

        vm.startPrank(tipper);
        usdc.approve(address(tipRouter), amount);

        bytes32 tipId = tipRouter.tipSameChain(
            recipient,
            address(usdc),
            amount,
            "fuzz test"
        );

        vm.stopPrank();

        assertTrue(tipId != bytes32(0), "TipId should not be zero");
    }
}
