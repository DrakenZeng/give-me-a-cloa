// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IGatewayEVM.sol";
import "./interfaces/Revert.sol";

/**
 * @title ZetaTipRouter
 * @notice 极简跨链打赏合约 - 基于 ZetaChain Gateway
 * @dev 只关注跨链交易，用户配置和历史记录由后端维护
 */
contract ZetaTipRouter is ReentrancyGuard, Pausable, Ownable, Revertable {
    using SafeERC20 for IERC20;

    // ============ 事件 ============

    /**
     * @notice 打赏发送事件
     * @param tipId 唯一打赏 ID
     * @param tipper 打赏者地址
     * @param recipient 接收者地址（目标链）
     * @param sourceChainId 源链 ID
     * @param targetChainId 目标链 ID
     * @param token 代币地址（源链）
     * @param amount 打赏金额（原始金额）
     * @param netAmount 实际发送金额（扣除平台费后）
     * @param message 留言
     * @param timestamp 时间戳
     */
    event TipSent(
        bytes32 indexed tipId,
        address indexed tipper,
        address recipient,
        uint256 sourceChainId,
        uint256 targetChainId,
        address token,
        uint256 amount,
        uint256 netAmount,
        string message,
        uint256 timestamp
    );

    /**
     * @notice 跨链打赏完成事件
     * @param tipId 打赏 ID
     * @param success 是否成功
     */
    event CrossChainTipCompleted(bytes32 indexed tipId, bool success);

    /**
     * @notice 打赏退款事件
     * @param tipId 打赏 ID
     * @param tipper 打赏者地址
     * @param amount 退款金额
     * @param reason 退款原因
     */
    event TipRefunded(
        bytes32 indexed tipId,
        address indexed tipper,
        uint256 amount,
        string reason
    );

    /**
     * @notice 代币支持状态变更事件
     */
    event TokenSupportUpdated(address indexed token, bool supported);

    /**
     * @notice 平台费率更新事件
     */
    event PlatformFeeRateUpdated(uint256 oldRate, uint256 newRate);

    /**
     * @notice 费用接收地址更新事件
     */
    event FeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );

    // ============ 状态变量 ============

    /// @notice ZetaChain Gateway 合约地址
    address public gateway;

    /// @notice Universal App 合约地址（部署在 ZetaChain）
    address public universalApp;

    /// @notice 支持的代币白名单
    mapping(address => bool) public supportedTokens;

    /// @notice 最小打赏金额（0.1 USDC，6 decimals）
    uint256 public constant MIN_TIP_AMOUNT = 0.1 * 10 ** 6;

    /// @notice 最大打赏金额（10,000 USDC，防止异常）
    uint256 public constant MAX_TIP_AMOUNT = 10000 * 10 ** 6;

    /// @notice 平台费率（基点，100 = 1%）
    uint256 public platformFeeRate;

    /// @notice 平台费用接收地址
    address public feeRecipient;

    /// @notice 待处理的跨链打赏
    mapping(bytes32 => PendingTip) public pendingTips;

    /// @notice 待处理打赏的数据结构
    struct PendingTip {
        address tipper;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool exists;
    }

    // ============ 构造函数 ============

    /**
     * @param _gateway ZetaChain Gateway 地址
     * @param _universalApp Universal App 地址（ZetaChain）
     * @param _feeRecipient 平台费用接收地址
     * @param _platformFeeRate 平台费率（基点）
     */
    constructor(
        address _gateway,
        address _universalApp,
        address _feeRecipient,
        uint256 _platformFeeRate
    ) Ownable(msg.sender) {
        require(_gateway != address(0), "Invalid Gateway");
        require(_universalApp != address(0), "Invalid UniversalApp");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_platformFeeRate <= 500, "Fee rate too high"); // 最大 5%

        gateway = _gateway;
        universalApp = _universalApp;
        feeRecipient = _feeRecipient;
        platformFeeRate = _platformFeeRate;
    }

    // ============ 核心功能 ============

    /**
     * @notice 同链打赏
     * @param recipient 接收者地址
     * @param token 代币地址
     * @param amount 打赏金额
     * @param message 留言
     * @return tipId 打赏 ID
     */
    function tipSameChain(
        address recipient,
        address token,
        uint256 amount,
        string calldata message
    ) external nonReentrant whenNotPaused returns (bytes32 tipId) {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot tip yourself");
        require(supportedTokens[token], "Token not supported");
        require(
            amount >= MIN_TIP_AMOUNT && amount <= MAX_TIP_AMOUNT,
            "Invalid amount"
        );

        // 生成 tipId
        tipId = _generateTipId(
            msg.sender,
            recipient,
            amount,
            block.chainid,
            block.chainid
        );

        // 计算费用
        uint256 platformFee = (amount * platformFeeRate) / 10000;
        uint256 netAmount = amount - platformFee;

        // 转账给接收者
        IERC20(token).safeTransferFrom(msg.sender, recipient, netAmount);

        // 收取平台费用
        if (platformFee > 0) {
            IERC20(token).safeTransferFrom(msg.sender, feeRecipient, platformFee);
        }

        // 触发事件
        emit TipSent(
            tipId,
            msg.sender,
            recipient,
            block.chainid,
            block.chainid,
            token,
            amount,
            netAmount,
            message,
            block.timestamp
        );

        return tipId;
    }

    /**
     * @notice 跨链打赏
     * @param recipient 接收者地址（目标链）
     * @param token 代币地址（源链）
     * @param amount 打赏金额
     * @param targetChainId 目标链 ID
     * @param message 留言
     * @return tipId 打赏 ID
     */
    function tipCrossChain(
        address recipient,
        address token,
        uint256 amount,
        uint256 targetChainId,
        string calldata message
    ) external nonReentrant whenNotPaused returns (bytes32 tipId) {
        require(recipient != address(0), "Invalid recipient");
        require(supportedTokens[token], "Token not supported");
        require(
            amount >= MIN_TIP_AMOUNT && amount <= MAX_TIP_AMOUNT,
            "Invalid amount"
        );
        require(targetChainId != block.chainid, "Use tipSameChain");

        // 生成 tipId
        tipId = _generateTipId(
            msg.sender,
            recipient,
            amount,
            block.chainid,
            targetChainId
        );

        // 计算费用
        uint256 platformFee = (amount * platformFeeRate) / 10000;
        uint256 netAmount = amount - platformFee;

        // 接收代币
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // 收取平台费用
        if (platformFee > 0) {
            IERC20(token).safeTransfer(feeRecipient, platformFee);
        }

        // 记录待处理的打赏
        pendingTips[tipId] = PendingTip({
            tipper: msg.sender,
            token: token,
            amount: netAmount,
            timestamp: block.timestamp,
            exists: true
        });

        // 调用 ZetaChain Gateway 跨链
        _sendCrossChain(
            recipient,
            token,
            netAmount,
            targetChainId,
            tipId,
            message
        );

        // 触发事件
        emit TipSent(
            tipId,
            msg.sender,
            recipient,
            block.chainid,
            targetChainId,
            token,
            amount,
            netAmount,
            message,
            block.timestamp
        );

        return tipId;
    }

    /**
     * @notice 估算跨链费用
     * @param targetChainId 目标链 ID
     * @param amount 打赏金额
     * @return platformFee 平台费用
     * @return netAmount 实际发送金额
     */
    function estimateFees(
        uint256 targetChainId,
        uint256 amount
    ) external view returns (uint256 platformFee, uint256 netAmount) {
        platformFee = (amount * platformFeeRate) / 10000;
        netAmount = amount - platformFee;
        return (platformFee, netAmount);
    }

    // ============ ZetaChain Gateway 集成 ============

    /**
     * @dev 发送跨链消息到 ZetaChain Gateway
     */
    function _sendCrossChain(
        address recipient,
        address token,
        uint256 amount,
        uint256 targetChainId,
        bytes32 tipId,
        string calldata message
    ) internal {
        // 批准 Gateway 使用代币
        IERC20(token).approve(gateway, amount);

        // 编码消息数据
        bytes memory payload = abi.encode(
            tipId,
            msg.sender,
            recipient,
            token,
            amount,
            targetChainId,
            message
        );

        // 配置 revert 选项
        RevertOptions memory revertOptions = RevertOptions({
            revertAddress: address(this),
            callOnRevert: true,
            abortAddress: address(0),
            revertMessage: abi.encode(tipId),
            onRevertGasLimit: 500000
        });

        // 调用 Gateway depositAndCall
        IGatewayEVM(gateway).depositAndCall(
            universalApp,      // Universal App 地址（ZetaChain）
            amount,            // 代币数量
            token,             // 代币地址
            payload,           // 跨链消息
            revertOptions      // 回滚选项
        );
    }

    /**
     * @notice Gateway 回调：跨链失败，退款
     * @dev 只能由 Gateway 调用
     * @param revertContext 回滚上下文
     */
    function onRevert(RevertContext calldata revertContext) external payable override {
        require(msg.sender == gateway, "Only Gateway");

        // 解码 tipId
        bytes32 tipId = abi.decode(revertContext.revertMessage, (bytes32));

        // 获取待处理的打赏信息
        PendingTip memory pending = pendingTips[tipId];
        require(pending.exists, "Tip not found");

        // 退款给打赏者
        IERC20(pending.token).safeTransfer(pending.tipper, pending.amount);

        // 删除待处理记录
        delete pendingTips[tipId];

        // 触发退款事件
        emit TipRefunded(
            tipId,
            pending.tipper,
            pending.amount,
            "Cross-chain failed"
        );
    }

    // ============ 管理功能 ============

    /**
     * @notice 添加支持的代币
     * @param token 代币地址
     */
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        supportedTokens[token] = true;
        emit TokenSupportUpdated(token, true);
    }

    /**
     * @notice 移除支持的代币
     * @param token 代币地址
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenSupportUpdated(token, false);
    }

    /**
     * @notice 批量添加支持的代币
     * @param tokens 代币地址数组
     */
    function addSupportedTokens(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token");
            supportedTokens[tokens[i]] = true;
            emit TokenSupportUpdated(tokens[i], true);
        }
    }

    /**
     * @notice 更新平台费率
     * @param newRate 新费率（基点）
     */
    function updatePlatformFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= 500, "Fee too high"); // 最大 5%
        uint256 oldRate = platformFeeRate;
        platformFeeRate = newRate;
        emit PlatformFeeRateUpdated(oldRate, newRate);
    }

    /**
     * @notice 更新费用接收地址
     * @param newRecipient 新的接收地址
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /**
     * @notice 更新 Gateway 地址
     * @param newGateway 新的 Gateway 地址
     */
    function updateGateway(address newGateway) external onlyOwner {
        require(newGateway != address(0), "Invalid gateway");
        gateway = newGateway;
    }

    /**
     * @notice 更新 Universal App 地址
     * @param newApp 新的 Universal App 地址
     */
    function updateUniversalApp(address newApp) external onlyOwner {
        require(newApp != address(0), "Invalid app");
        universalApp = newApp;
    }

    /**
     * @notice 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice 紧急提取代币（仅限管理员）
     * @param token 代币地址
     * @param amount 提取数量
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @notice 紧急提取 ETH（仅限管理员）
     */
    function emergencyWithdrawETH() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "ETH transfer failed");
    }

    // ============ 内部函数 ============

    /**
     * @dev 生成唯一的 tipId
     */
    function _generateTipId(
        address tipper,
        address recipient,
        uint256 amount,
        uint256 sourceChain,
        uint256 targetChain
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    tipper,
                    recipient,
                    amount,
                    sourceChain,
                    targetChain,
                    block.timestamp,
                    block.number
                )
            );
    }

    // Intentionally no `receive()`/`fallback()` to avoid accidental ETH deposits.
}
