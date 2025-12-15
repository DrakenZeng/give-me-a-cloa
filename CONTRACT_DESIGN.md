# Give Me a Cola - 智能合约设计方案

> 基于 ZetaChain 的跨链打赏平台合约架构设计
>
> 设计日期：2025-12-14

## 目录

- [核心理念](#核心理念)
- [合约架构](#合约架构)
- [业务流程](#业务流程)
- [数据结构](#数据结构)
- [技术实现](#技术实现)
- [安全机制](#安全机制)
- [Gas 优化](#gas-优化)
- [部署计划](#部署计划)

---

## 核心理念

### 设计目标

**直接跨链打赏**：利用 ZetaChain 的跨链能力，将打赏资金直接发送到接收者在任意链上的钱包地址，无需提现操作。

### 核心优势

- ✅ **真正的小额友好**：没有提现门槛，1 美元也能立即到账
- ✅ **极致用户体验**：实时到账（3-5分钟），不需要"先存后取"
- ✅ **更低的成本**：只有一次跨链操作，无需在合约中存储余额
- ✅ **更高的安全性**：合约不托管资金，点对点转账
- ✅ **灵活的配置**：支持多链多地址，用户可随时更改收款配置

---

## 合约架构

### 1. UserProfile 合约（用户配置合约）

**职责**：管理用户的收款地址配置

**核心功能**：
- 注册用户身份
- 绑定多链收款地址
- 设置默认收款链
- 管理个人信息（用户名、简介、头像等）
- 地址所有权验证

**关键方法**：
```solidity
function register(string username, bytes metadata)
function addWithdrawAddress(uint256 chainId, address addr, bytes signature)
function setDefaultChain(uint256 chainId)
function getUserConfig(address user) returns (UserConfig)
function getDefaultAddress(address user) returns (address, uint256)
```

---

### 2. TipRouter 合约（打赏路由合约）

**职责**：路由和处理打赏请求

**核心功能**：
- 查询接收者的收款配置
- 验证目标链和地址有效性
- 路由同链/跨链打赏请求
- 计算和扣除手续费
- 发出打赏事件

**关键方法**：
```solidity
function tipSameChain(address recipient, address token, uint256 amount, string message)
function tipCrossChain(address recipient, address token, uint256 amount, uint256 targetChainId, string message)
function estimateCrossChainFee(uint256 targetChainId, address token, uint256 amount) returns (uint256)
```

---

### 3. ZetaConnector 合约（ZetaChain 连接器）

**职责**：对接 ZetaChain 跨链协议

**核心功能**：
- 实现 ZetaChain 的跨链接口
- 处理跨链消息编码/解码
- 管理跨链交易状态
- 处理回执和失败退款
- 管理流动性池交互

**关键方法**：
```solidity
function sendCrossChain(CrossChainMessage message) returns (bytes32 txId)
function onZetaMessage(ZetaInterfaces.ZetaMessage calldata message)
function onZetaRevert(ZetaInterfaces.ZetaRevert calldata revert)
function handleRefund(bytes32 txId)
```

---

### 4. TipRegistry 合约（记录合约）

**职责**：存储和查询打赏数据

**核心功能**：
- 记录所有打赏交易
- 提供多维度查询接口
- 生成统计数据
- 支持链下索引

**关键方法**：
```solidity
function recordTip(TipRecord record)
function recordCrossChainTip(CrossChainTipRecord record)
function getTipHistory(address user, uint256 limit, uint256 offset) returns (TipRecord[])
function getTotalTips(address user) returns (uint256)
function getTipsByChain(address user, uint256 chainId) returns (TipRecord[])
```

---

## 业务流程

### 流程 A：用户注册和配置

#### 1. 注册用户身份

```
步骤：
1. 用户访问平台，连接主钱包（如 Phantom - Solana）
2. 调用 UserProfile.register(username, metadata)
3. 合约分配唯一用户 ID
4. 记录主钱包地址
5. 触发 UserRegistered 事件

合约状态：
users[msg.sender] = User({
    userId: generateId(),
    username: username,
    mainWallet: msg.sender,
    defaultChain: currentChainId,
    registeredAt: block.timestamp
})
```

#### 2. 绑定多链收款地址

**配置示例**：
```
用户 @alice 的配置：
- 主身份：Solana 地址 sol1abc...（Phantom 钱包）
- 收款配置：
  {
    Solana: "sol1abc..." (默认)
    Ethereum: "0x123..."
    BSC: "0x456..."
    Base: "0x789..."
  }
- 默认链：Solana（优先接收到 Solana）
```

**绑定流程**：
```
1. 用户选择要绑定的链（如 Ethereum）
2. 连接对应链的钱包（如 MetaMask）
3. 签名验证消息证明地址所有权
   消息格式："Bind Ethereum wallet to Give Me a Cola user: @alice"
4. 调用 UserProfile.addWithdrawAddress(1, 0x123..., signature)
5. 合约验证签名有效性
6. 存储：userAddresses[userId][1] = 0x123...
7. 触发 AddressAdded 事件
```

---

### 流程 B：打赏流程（核心）

#### 场景 1：同链打赏（最简单）

**示例**：Solana 用户打赏给 Solana 收款地址

```
流程：
1. 打赏者在前端选择接收者（@alice）
2. 查询 UserProfile.getDefaultAddress(alice)
   返回：(sol1abc..., SOLANA_CHAIN_ID)
3. 打赏者选择金额（5 USDC）和代币
4. 前端检测：打赏者和接收者都在 Solana
5. 直接调用 Solana SPL Token 转账
   - Transfer 5 USDC to sol1abc...
6. 转账完成后调用 TipRegistry.recordTip()
7. 触发 TipSent 事件
8. 前端通知双方

特点：
- 速度：秒级确认
- Gas 费：极低（~0.000005 SOL）
- 不需要跨链
```

---

#### 场景 2：跨链打赏（重点）

**示例**：Ethereum 用户打赏给 Solana 收款地址

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
阶段 1：前端准备
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 打赏者（Ethereum 钱包）选择接收者 @alice

2. 前端查询：UserProfile.getUserConfig(alice)
   返回：{
     defaultChain: Solana (chainId: 7000)
     addresses: {
       Solana: "sol1abc..."
       Ethereum: "0x123..."
     }
   }

3. 前端提示：
   "@alice 主要收款地址在 Solana，将为你进行跨链打赏"

4. 显示费用预估：
   ┌─────────────────────────────────┐
   │ 打赏金额：5 USDC (Ethereum)      │
   │ 跨链费用：~0.3 USDC             │
   │ 平台费用：~0.05 USDC (1%)       │
   │ ─────────────────────────────   │
   │ 到账金额：~4.65 USDC (Solana)   │
   │ 预计时间：3-5 分钟              │
   └─────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
阶段 2：发起打赏
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. 打赏者确认，前端调用：
   TipRouter.tipCrossChain({
     recipient: alice (用户ID或地址)
     token: USDC_ADDRESS
     amount: 5 * 10^6 (5 USDC)
     targetChainId: SOLANA_CHAIN_ID
     message: "感谢你的开源贡献！"
   })

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
阶段 3：合约处理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. TipRouter 验证：
   ✓ recipient 存在
   ✓ Solana 地址已绑定
   ✓ amount >= MIN_TIP_AMOUNT (如 0.1 USDC)
   ✓ token 在白名单中
   ✓ 打赏者已 approve 足够的 USDC

7. TipRouter 接收资金：
   USDC.transferFrom(msg.sender, address(this), 5 * 10^6)

8. 计算费用：
   totalAmount = 5 USDC
   platformFee = 5 * 0.01 = 0.05 USDC
   crossChainFee = estimateCrossChainFee() = 0.3 USDC
   netAmount = 5 - 0.05 - 0.3 = 4.65 USDC

9. TipRouter 调用 ZetaConnector.sendCrossChain()：
   - 转账 4.65 USDC 到 ZetaConnector
   - 构造跨链消息

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
阶段 4：ZetaChain 跨链
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

10. ZetaConnector 发送消息到 ZetaChain：
    CrossChainMessage {
      sourceChain: Ethereum (chainId: 1)
      targetChain: Solana (chainId: 7000)
      sourceToken: USDC (Ethereum)
      targetToken: USDC-SPL (Solana)
      recipient: sol1abc...
      amount: 4.65 USDC
      metadata: {
        tipId: generateTipId()
        tipper: 0xaaa...
        message: "感谢你的开源贡献！"
        timestamp: block.timestamp
      }
    }

11. ZetaChain 验证节点处理：
    - 验证消息签名
    - 验证 Ethereum 上 USDC 已锁定
    - 多节点共识确认
    - 批准跨链请求

12. ZetaChain 路由到 Solana：
    - 调用 Solana 上的 ZetaConnector Program
    - 从 ZetaChain 流动性池释放 USDC-SPL
    - 执行 SPL Token 转账：
      transfer(USDC-SPL, sol1abc..., 4.65 USDC)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
阶段 5：确认和记录
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

13. Solana 转账成功，ZetaChain 发送回执到 Ethereum

14. Ethereum 的 ZetaConnector.onZetaMessage() 接收回执

15. ZetaConnector 调用 TipRegistry.recordCrossChainTip()：
    TipRecord {
      tipId: "0x123abc..."
      tipper: 0xaaa... (Ethereum)
      recipient: sol1abc... (Solana)
      sourceChain: 1 (Ethereum)
      targetChain: 7000 (Solana)
      token: USDC
      amount: 5 USDC
      amountReceived: 4.65 USDC
      fee: 0.35 USDC
      message: "感谢你的开源贡献！"
      status: Completed
      timestamp: block.timestamp
      txHash: "0xdef456..."
    }

16. 触发事件：
    emit CrossChainTipCompleted(tipId, tipper, recipient, amount)

17. 前端监听事件，实时通知：
    - 打赏者：
      "✓ 打赏已送达 @alice 的 Solana 钱包"
      "交易哈希：0xdef456..."

    - 接收者：
      "🎉 收到来自 @bob 的 4.65 USDC"
      "留言：感谢你的开源贡献！"
```

---

#### 场景 3：灵活选择目标链

**示例**：接收者绑定了多条链，打赏者可以选择

```
流程：

1. 接收者 @alice 绑定了：
   - Solana: sol1abc... (默认)
   - Ethereum: 0x123...
   - Base: 0x789...

2. 打赏者前端显示选项：
   ┌──────────────────────────────────────────┐
   │ 选择打赏到的链：                          │
   │                                          │
   │ ● Solana (默认)                          │
   │   预计费用：0.3 USDC                     │
   │   到账时间：3-5 分钟                     │
   │                                          │
   │ ○ Ethereum                               │
   │   预计费用：0.5 USDC                     │
   │   到账时间：即时（同链）                  │
   │                                          │
   │ ○ Base                                   │
   │   预计费用：0.15 USDC (推荐)             │
   │   到账时间：2-3 分钟                     │
   └──────────────────────────────────────────┘

3. 打赏者选择 Base（费用更低）

4. 执行跨链打赏到 Base 地址
   同样通过 ZetaChain 路由

5. 完成后通知接收者：
   "收到来自 @bob 的 4.8 USDC (Base 链)"
```

---

### 流程 C：失败处理和退款

#### 失败场景

- ZetaChain 跨链超时（>30 分钟无确认）
- 目标链网络拥堵导致交易失败
- 流动性池资金不足
- 接收地址格式错误或无效
- ZetaChain 验证失败

#### 退款流程

```
1. ZetaConnector 监测超时或接收失败消息
   if (block.timestamp - txTimestamp > 30 minutes) {
     status = Failed
   }

2. 标记交易为 Failed：
   pendingTips[tipId].status = Status.Failed

3. ZetaChain 发起退款流程：
   - 构造退款消息
   - 发送回源链

4. 源链 ZetaConnector.onZetaRevert() 处理退款：
   - 验证退款消息
   - 将资金退回打赏者
   USDC.transfer(originalTipper, refundAmount)

5. TipRegistry 更新记录：
   tips[tipId].status = Refunded
   tips[tipId].refundTx = txHash

6. 触发事件：
   emit TipRefunded(tipId, tipper, amount, reason)

7. 前端通知打赏者：
   "⚠️ 打赏失败，资金已退回"
   "原因：目标链网络拥堵"
   "退款金额：5 USDC"
   "交易哈希：0x..."
```

---

## 数据结构

### UserProfile 合约

```solidity
struct User {
    uint256 userId;              // 唯一用户ID
    string username;             // 用户名
    address mainWallet;          // 主钱包地址
    uint256 defaultChain;        // 默认收款链ID
    uint256 registeredAt;        // 注册时间
    bool verified;               // 是否验证身份
}

struct UserMetadata {
    string avatar;               // 头像 IPFS 链接
    string bio;                  // 个人简介
    string github;               // GitHub 用户名
    string twitter;              // Twitter 用户名
    string website;              // 个人网站
}

// 存储映射
mapping(address => User) public users;
mapping(uint256 => address) public userIdToAddress;
mapping(address => UserMetadata) public userMetadata;
mapping(address => mapping(uint256 => address)) public userAddresses;
// userAddresses[userAddress][chainId] = withdrawAddress
```

---

### TipRegistry 合约

```solidity
struct TipRecord {
    bytes32 tipId;               // 唯一打赏ID
    address tipper;              // 打赏者地址
    address recipient;           // 接收者地址
    uint256 sourceChain;         // 源链ID
    uint256 targetChain;         // 目标链ID
    address token;               // 代币地址（源链）
    uint256 amount;              // 打赏金额
    uint256 amountReceived;      // 实际到账金额
    uint256 fee;                 // 手续费
    string message;              // 留言
    uint256 timestamp;           // 时间戳
    TipStatus status;            // 状态
    bytes32 txHash;              // 交易哈希
}

enum TipStatus {
    Pending,                     // 待处理
    Processing,                  // 处理中
    Completed,                   // 已完成
    Failed,                      // 失败
    Refunded                     // 已退款
}

// 存储映射
mapping(bytes32 => TipRecord) public tips;
mapping(address => bytes32[]) public userTips;      // 用户打赏历史
mapping(address => bytes32[]) public receivedTips;  // 接收历史
mapping(address => uint256) public totalTipped;     // 总打赏金额
mapping(address => uint256) public totalReceived;   // 总接收金额
```

---

### ZetaConnector 合约

```solidity
struct CrossChainMessage {
    uint256 sourceChain;         // 源链ID
    uint256 targetChain;         // 目标链ID
    address sourceToken;         // 源链代币地址
    address targetToken;         // 目标链代币地址
    address recipient;           // 接收者地址
    uint256 amount;              // 金额
    bytes metadata;              // 元数据（tipId, message等）
}

struct PendingCrossChain {
    bytes32 tipId;
    address tipper;
    uint256 amount;
    uint256 timestamp;
    TipStatus status;
}

// 存储映射
mapping(bytes32 => PendingCrossChain) public pendingTips;
mapping(uint256 => address) public zetaTokenMapping;  // chainId => ZetaToken
mapping(uint256 => bool) public supportedChains;      // 支持的链
```

---

## 技术实现

### 1. ZetaChain 跨链消息格式

```solidity
// 发送跨链消息
function sendCrossChainTip(
    uint256 targetChainId,
    address recipient,
    address token,
    uint256 amount,
    bytes memory metadata
) external {
    // 编码消息
    bytes memory message = abi.encode(
        msg.sender,          // tipper
        recipient,           // recipient
        token,               // token
        amount,              // amount
        metadata             // metadata (tipId, message)
    );

    // 调用 ZetaChain 接口
    connector.send(
        ZetaInterfaces.SendInput({
            destinationChainId: targetChainId,
            destinationAddress: zetaConnectorOnTarget,
            destinationGasLimit: 500000,
            message: message,
            zetaValueAndGas: calculateZetaFee(targetChainId, amount),
            zetaParams: ""
        })
    );

    emit CrossChainTipInitiated(tipId, targetChainId, amount);
}

// 接收跨链消息
function onZetaMessage(
    ZetaInterfaces.ZetaMessage calldata zetaMessage
) external override {
    // 解码消息
    (
        address tipper,
        address recipient,
        address token,
        uint256 amount,
        bytes memory metadata
    ) = abi.decode(
        zetaMessage.message,
        (address, address, address, uint256, bytes)
    );

    // 执行转账
    IERC20(token).transfer(recipient, amount);

    // 记录
    tipRegistry.recordCrossChainTip(...);

    emit CrossChainTipCompleted(tipId, recipient, amount);
}

// 处理回滚
function onZetaRevert(
    ZetaInterfaces.ZetaRevert calldata zetaRevert
) external override {
    // 解码原始消息
    (address tipper, , , uint256 amount, ) = abi.decode(
        zetaRevert.message,
        (address, address, address, uint256, bytes)
    );

    // 退款
    IERC20(token).transfer(tipper, amount);

    emit TipRefunded(tipId, tipper, amount, "ZetaChain revert");
}
```

---

### 2. 地址验证机制

#### 方案 A：签名验证（推荐 - Gas 低）

```solidity
function addWithdrawAddress(
    uint256 chainId,
    address withdrawAddress,
    bytes memory signature
) external {
    // 构造验证消息
    bytes32 messageHash = keccak256(abi.encodePacked(
        "Bind address to Give Me a Cola:",
        msg.sender,
        chainId,
        withdrawAddress,
        nonces[msg.sender]
    ));

    bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

    // 验证签名
    address signer = ethSignedMessageHash.recover(signature);
    require(signer == withdrawAddress, "Invalid signature");

    // 存储
    userAddresses[msg.sender][chainId] = withdrawAddress;
    nonces[msg.sender]++;

    emit AddressAdded(msg.sender, chainId, withdrawAddress);
}
```

#### 方案 B：跨链验证（更安全）

```solidity
// Solana 侧：用户发起绑定交易
// Solana Program 发送跨链消息到 EVM 链

// EVM 侧：接收绑定消息
function onZetaMessage(
    ZetaInterfaces.ZetaMessage calldata zetaMessage
) external override {
    if (messageType == MessageType.BindAddress) {
        (address userAddress, address solanaAddress) = abi.decode(
            zetaMessage.message,
            (address, address)
        );

        // 验证消息来自 Solana ZetaConnector
        require(
            zetaMessage.sourceChainId == SOLANA_CHAIN_ID,
            "Invalid source chain"
        );

        // 绑定地址
        userAddresses[userAddress][SOLANA_CHAIN_ID] = solanaAddress;

        emit AddressAdded(userAddress, SOLANA_CHAIN_ID, solanaAddress);
    }
}
```

---

### 3. 费用计算

```solidity
function estimateCrossChainFee(
    uint256 targetChainId,
    address token,
    uint256 amount
) public view returns (
    uint256 zetaFee,
    uint256 platformFee,
    uint256 totalFee
) {
    // ZetaChain 协议费（动态）
    zetaFee = zetaConnector.getZetaFee(
        targetChainId,
        500000  // gasLimit
    );

    // 平台服务费（可选，如 1%）
    platformFee = (amount * platformFeeRate) / 10000;  // 基点

    // 总费用
    totalFee = zetaFee + platformFee;

    return (zetaFee, platformFee, totalFee);
}

function calculateNetAmount(
    uint256 amount,
    uint256 targetChainId
) internal view returns (uint256) {
    (,, uint256 totalFee) = estimateCrossChainFee(
        targetChainId,
        token,
        amount
    );

    require(amount > totalFee, "Amount too small");

    return amount - totalFee;
}
```

---

### 4. 代币映射管理

```solidity
struct TokenMapping {
    address sourceToken;         // 源链代币地址
    address targetToken;         // 目标链代币地址
    uint256 sourceChainId;
    uint256 targetChainId;
    bool active;
}

mapping(bytes32 => TokenMapping) public tokenMappings;
// mappingId = keccak256(sourceChainId, sourceToken, targetChainId)

function addTokenMapping(
    uint256 sourceChainId,
    address sourceToken,
    uint256 targetChainId,
    address targetToken
) external onlyOwner {
    bytes32 mappingId = keccak256(abi.encodePacked(
        sourceChainId,
        sourceToken,
        targetChainId
    ));

    tokenMappings[mappingId] = TokenMapping({
        sourceToken: sourceToken,
        targetToken: targetToken,
        sourceChainId: sourceChainId,
        targetChainId: targetChainId,
        active: true
    });

    emit TokenMappingAdded(sourceChainId, sourceToken, targetChainId, targetToken);
}

function getTargetToken(
    uint256 sourceChainId,
    address sourceToken,
    uint256 targetChainId
) public view returns (address) {
    bytes32 mappingId = keccak256(abi.encodePacked(
        sourceChainId,
        sourceToken,
        targetChainId
    ));

    TokenMapping memory mapping = tokenMappings[mappingId];
    require(mapping.active, "Token mapping not found");

    return mapping.targetToken;
}
```

---

## 安全机制

### 1. 访问控制

```solidity
// 使用 OpenZeppelin AccessControl
contract TipRouter is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // 只有管理员可以更新配置
    function updatePlatformFee(uint256 newFee)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(newFee <= 500, "Fee too high"); // 最大 5%
        platformFeeRate = newFee;
    }

    // 只有用户自己可以更新地址
    function updateDefaultChain(uint256 chainId) external {
        require(userAddresses[msg.sender][chainId] != address(0), "Address not bound");
        users[msg.sender].defaultChain = chainId;
    }
}
```

---

### 2. 重入保护

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TipRouter is ReentrancyGuard {
    function tipCrossChain(
        address recipient,
        address token,
        uint256 amount,
        uint256 targetChainId,
        string memory message
    ) external nonReentrant {
        // Checks
        require(amount >= MIN_TIP_AMOUNT, "Amount too small");
        require(supportedTokens[token], "Token not supported");

        // Effects
        tips[tipId] = TipRecord({
            // ... 更新状态
        });

        // Interactions
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        zetaConnector.sendCrossChain(...);
    }
}
```

---

### 3. 暂停机制

```solidity
import "@openzeppelin/contracts/security/Pausable.sol";

contract TipRouter is Pausable {
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function tipCrossChain(...) external whenNotPaused {
        // 只有在未暂停时才能执行
    }
}
```

---

### 4. 金额验证

```solidity
// 最小打赏金额（防止垃圾交易和 Gas 浪费）
uint256 public constant MIN_TIP_AMOUNT = 0.1 * 10**6;  // 0.1 USDC

// 最大单笔金额（可选，防止异常）
uint256 public constant MAX_TIP_AMOUNT = 10000 * 10**6;  // 10,000 USDC

function validateAmount(uint256 amount) internal pure {
    require(amount >= MIN_TIP_AMOUNT, "Amount too small");
    require(amount <= MAX_TIP_AMOUNT, "Amount too large");
}
```

---

### 5. 跨链安全

```solidity
// 防止重放攻击
mapping(bytes32 => bool) public processedMessages;

function onZetaMessage(
    ZetaInterfaces.ZetaMessage calldata zetaMessage
) external override {
    bytes32 messageId = keccak256(abi.encodePacked(
        zetaMessage.sourceChainId,
        zetaMessage.zetaTxSenderAddress,
        zetaMessage.message
    ));

    require(!processedMessages[messageId], "Message already processed");
    processedMessages[messageId] = true;

    // 处理消息...
}

// 超时机制
uint256 public constant CROSS_CHAIN_TIMEOUT = 30 minutes;

function checkTimeout(bytes32 tipId) external {
    PendingCrossChain storage pending = pendingTips[tipId];

    if (
        pending.status == TipStatus.Processing &&
        block.timestamp - pending.timestamp > CROSS_CHAIN_TIMEOUT
    ) {
        // 触发退款
        _refund(tipId);
    }
}
```

---

## Gas 优化

### 1. 存储优化

```solidity
// 使用紧凑的数据结构
struct TipRecordCompact {
    address tipper;              // 20 bytes
    uint96 amount;               // 12 bytes (足够大多数金额)
    // 总共 32 bytes，一个 slot

    address recipient;           // 20 bytes
    uint32 timestamp;            // 4 bytes (够用到 2106 年)
    uint8 status;                // 1 byte
    // 总共 25 bytes，仍然一个 slot（有 7 bytes 空余）
}

// 批量操作减少状态写入
function batchRecordTips(TipRecord[] calldata tips) external {
    for (uint256 i = 0; i < tips.length; i++) {
        _recordTip(tips[i]);
    }
}
```

---

### 2. 代理模式降低部署成本

```solidity
// 使用 EIP-1167 Clone 模式
// UserProfile 只需部署一次，后续用户通过 clone 创建

import "@openzeppelin/contracts/proxy/Clones.sol";

contract UserProfileFactory {
    address public implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function createUserProfile() external returns (address) {
        address clone = Clones.clone(implementation);
        UserProfile(clone).initialize(msg.sender);
        return clone;
    }
}
```

---

### 3. 事件代替存储

```solidity
// 对于历史数据，使用事件而不是存储
event TipSent(
    bytes32 indexed tipId,
    address indexed tipper,
    address indexed recipient,
    uint256 amount,
    uint256 timestamp,
    string message
);

// 链下索引服务监听事件，构建查询数据库
// 合约只存储必要的状态
```

---

### 4. 批量查询接口

```solidity
// 提供批量查询接口，减少前端调用次数
function getUserData(address user) external view returns (
    User memory userData,
    UserMetadata memory metadata,
    address[] memory addresses,
    uint256[] memory chainIds,
    uint256 totalTipped,
    uint256 totalReceived
) {
    userData = users[user];
    metadata = userMetadata[user];

    // 获取所有绑定的地址
    uint256 count = 0;
    for (uint256 i = 0; i < supportedChains.length; i++) {
        if (userAddresses[user][supportedChains[i]] != address(0)) {
            count++;
        }
    }

    addresses = new address[](count);
    chainIds = new uint256[](count);

    uint256 index = 0;
    for (uint256 i = 0; i < supportedChains.length; i++) {
        address addr = userAddresses[user][supportedChains[i]];
        if (addr != address(0)) {
            addresses[index] = addr;
            chainIds[index] = supportedChains[i];
            index++;
        }
    }

    totalTipped = userTotalTipped[user];
    totalReceived = userTotalReceived[user];
}
```

---

## 前端优化建议

### 1. 智能推荐

```javascript
// 前端逻辑示例
async function getTipRecommendation(tipper, recipient, amount) {
    const tipperChain = await detectChain(tipper);
    const recipientConfig = await getUserConfig(recipient);

    // 场景 1：同链
    if (tipperChain === recipientConfig.defaultChain) {
        return {
            type: 'same-chain',
            message: `你们都在 ${getChainName(tipperChain)}，建议直接转账`,
            fee: estimateDirectTransferFee(tipperChain),
            time: '即时',
            recommended: true
        };
    }

    // 场景 2：跨链但接收者有多个地址
    if (recipientConfig.addresses[tipperChain]) {
        return {
            type: 'multi-address',
            message: `@${recipient.username} 也有 ${getChainName(tipperChain)} 地址`,
            options: [
                {
                    chain: tipperChain,
                    fee: estimateDirectTransferFee(tipperChain),
                    time: '即时'
                },
                {
                    chain: recipientConfig.defaultChain,
                    fee: estimateCrossChainFee(tipperChain, recipientConfig.defaultChain),
                    time: '3-5 分钟'
                }
            ]
        };
    }

    // 场景 3：必须跨链
    return {
        type: 'cross-chain',
        message: `将通过 ZetaChain 跨链到 ${getChainName(recipientConfig.defaultChain)}`,
        fee: estimateCrossChainFee(tipperChain, recipientConfig.defaultChain),
        time: '3-5 分钟'
    };
}
```

---

### 2. 费用预警

```javascript
function checkFeeWarning(amount, fee) {
    const feePercentage = (fee / amount) * 100;

    if (feePercentage > 10) {
        return {
            level: 'high',
            message: `跨链费用较高（${feePercentage.toFixed(1)}%），建议：`,
            suggestions: [
                `增加打赏金额到至少 ${(fee / 0.05).toFixed(2)} USDC`,
                `等待累积更多打赏后一起操作`,
                `选择费用更低的链`
            ]
        };
    }

    if (feePercentage > 5) {
        return {
            level: 'medium',
            message: `跨链费用占比 ${feePercentage.toFixed(1)}%`
        };
    }

    return null;
}
```

---

### 3. 实时状态跟踪

```javascript
// 前端监听事件并显示进度
function trackTipStatus(tipId) {
    const statusUpdates = [
        { status: 'initiated', icon: '✓', text: '交易已发起' },
        { status: 'processing', icon: '⏳', text: 'ZetaChain 处理中（预计 2-3 分钟）' },
        { status: 'completed', icon: '✓', text: '已到账' }
    ];

    // 监听合约事件
    tipRouter.on('CrossChainTipInitiated', (id) => {
        if (id === tipId) updateProgress(0);
    });

    zetaConnector.on('ZetaMessageSent', (id) => {
        if (id === tipId) updateProgress(1);
    });

    tipRegistry.on('CrossChainTipCompleted', (id) => {
        if (id === tipId) {
            updateProgress(2);
            showNotification('打赏成功！');
        }
    });
}
```

---

### 4. 历史记录展示

```javascript
// 查询和展示打赏历史
async function getTipHistory(user, options = {}) {
    const { limit = 20, offset = 0, chainId = null } = options;

    // 调用合约批量查询
    const tips = await tipRegistry.getTipHistory(user, limit, offset);

    // 格式化显示
    return tips.map(tip => ({
        id: tip.tipId,
        from: tip.tipper,
        to: tip.recipient,
        amount: formatAmount(tip.amount, tip.token),
        chain: getChainName(tip.targetChain),
        message: tip.message,
        time: formatTime(tip.timestamp),
        status: tip.status,
        txUrl: getExplorerUrl(tip.txHash, tip.targetChain)
    }));
}

// 显示统计
async function getUserStats(user) {
    const stats = await tipRegistry.getUserStats(user);

    return {
        totalTipped: formatUSD(stats.totalTipped),
        totalReceived: formatUSD(stats.totalReceived),
        tipCount: stats.tipCount,
        receivedCount: stats.receivedCount,
        topChain: getChainName(stats.topChain),
        topToken: getTokenName(stats.topToken)
    };
}
```

---

## 部署计划

### 阶段 1：测试网部署（1-2 周）

#### 1.1 部署合约

```bash
# 网络：ZetaChain Athens Testnet + Ethereum Sepolia + BSC Testnet

# 1. 部署基础合约
forge create --rpc-url $SEPOLIA_RPC UserProfile
forge create --rpc-url $SEPOLIA_RPC TipRegistry
forge create --rpc-url $SEPOLIA_RPC ZetaConnector

# 2. 部署路由合约
forge create --rpc-url $SEPOLIA_RPC TipRouter \
  --constructor-args $USER_PROFILE_ADDR $TIP_REGISTRY_ADDR $ZETA_CONNECTOR_ADDR

# 3. 配置合约关系
cast send $TIP_ROUTER "setZetaConnector(address)" $ZETA_CONNECTOR_ADDR
cast send $ZETA_CONNECTOR "setTipRouter(address)" $TIP_ROUTER_ADDR
```

#### 1.2 配置支持的链和代币

```bash
# 添加支持的链
cast send $TIP_ROUTER "addSupportedChain(uint256)" 11155111  # Sepolia
cast send $TIP_ROUTER "addSupportedChain(uint256)" 97        # BSC Testnet
cast send $TIP_ROUTER "addSupportedChain(uint256)" 7001      # ZetaChain Athens

# 添加代币映射
# USDC Sepolia -> USDC BSC Testnet
cast send $TIP_ROUTER "addTokenMapping(uint256,address,uint256,address)" \
  11155111 $USDC_SEPOLIA 97 $USDC_BSC_TESTNET
```

#### 1.3 测试流程

- [ ] 单链打赏测试
- [ ] 跨链打赏测试（Sepolia -> BSC）
- [ ] 跨链打赏测试（BSC -> Sepolia）
- [ ] 失败回滚测试
- [ ] 费用计算测试
- [ ] 地址绑定测试
- [ ] 批量操作测试

---

### 阶段 2：安全审计（2-3 周）

#### 2.1 代码审计

- 聘请专业审计公司（如 CertiK, OpenZeppelin, Trail of Bits）
- 重点审计：
  - 跨链消息安全
  - 重入攻击防护
  - 访问控制
  - 资金安全

#### 2.2 漏洞修复

- 修复审计发现的问题
- 重新测试
- 二次审计（如需要）

---

### 阶段 3：主网部署（1 周）

#### 3.1 部署顺序

```
1. TipRegistry（记录合约）
   ↓
2. UserProfile（用户配置合约）
   ↓
3. ZetaConnector（ZetaChain 连接器）
   ↓
4. TipRouter（路由合约）
   ↓
5. 配置合约关系和权限
   ↓
6. 添加支持的链和代币
   ↓
7. 转移管理员权限到多签钱包
```

#### 3.2 支持的链（初期）

- Ethereum Mainnet
- BSC (Binance Smart Chain)
- Base
- Polygon
- Arbitrum
- Solana（通过 ZetaChain）

#### 3.3 支持的代币（初期）

- USDC（主要）
- USDT
- DAI
- 各链的原生代币（ETH, BNB, MATIC, SOL 等）

---

### 阶段 4：前端集成（并行进行）

#### 4.1 集成钱包

- MetaMask（EVM 链）
- WalletConnect（多链支持）
- Phantom（Solana）
- Coinbase Wallet

#### 4.2 集成 ZetaChain SDK

```javascript
import { ZetaChainClient } from '@zetachain/toolkit';

const zetaClient = new ZetaChainClient({
  network: 'mainnet',
  signer: signer
});

// 发送跨链打赏
await zetaClient.sendCrossChain({
  destinationChain: 'solana',
  recipient: 'sol1abc...',
  token: 'USDC',
  amount: '5000000'  // 5 USDC
});
```

#### 4.3 事件监听

```javascript
// 监听打赏事件
tipRouter.on('TipSent', (tipId, tipper, recipient, amount) => {
  console.log(`Tip sent: ${tipId}`);
  updateUI();
});

// 监听跨链状态
zetaConnector.on('CrossChainTipCompleted', (tipId) => {
  showNotification('打赏已送达！');
});
```

---

## 总结

### 核心亮点

1. **真正的点对点**：资金直接打到用户钱包，不需要提现
2. **跨链无感**：ZetaChain 处理所有跨链复杂性
3. **小额友好**：没有提现门槛，即打即得
4. **灵活配置**：支持多链多地址，用户自由选择
5. **安全可靠**：合约不托管资金，失败自动退款

### 下一步行动

1. ✅ 完成合约设计方案
2. [ ] 开始编写智能合约代码
3. [ ] 编写单元测试
4. [ ] 部署测试网
5. [ ] 前端集成
6. [ ] 安全审计
7. [ ] 主网部署

---

**最后更新**: 2025-12-14
**设计者**: Claude Code
**状态**: 方案已确认 ✅
