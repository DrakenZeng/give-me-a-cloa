# ZetaTipRouter 智能合约

> 基于 ZetaChain Gateway 的极简跨链打赏合约

## 概述

`ZetaTipRouter` 是一个极简的跨链打赏智能合约，专注于通过 ZetaChain Gateway 实现跨链转账功能。用户配置和历史记录由后端维护，合约只负责核心的资金转移和跨链操作。

## 特性

- ✅ 同链打赏（直接转账）
- ✅ 跨链打赏（通过 ZetaChain Gateway）
- ✅ 平台费用管理（可配置 0-5%）
- ✅ 代币白名单机制
- ✅ 暂停/恢复功能
- ✅ 跨链失败自动退款
- ✅ 完整的测试覆盖（21 个测试用例全部通过）
- ✅ Gas 优化

## 架构说明

### ZetaChain Gateway 架构

本合约使用 ZetaChain 的最新 **Gateway 架构**，而非旧版 Connector 模式：

```
Source Chain (Sepolia)          ZetaChain               Target Chain (BSC Testnet)
┌─────────────────┐            ┌──────────┐            ┌─────────────────┐
│ ZetaTipRouter   │            │ Universal│            │ ZetaTipRouter   │
│                 │            │   App    │            │                 │
│  tipCrossChain()│──────────▶│          │───────────▶│  (receive tip)  │
│                 │  Gateway   │  onCall()│   Gateway  │                 │
└─────────────────┘            └──────────┘            └─────────────────┘
```

**关键组件：**

1. **Gateway Contract**: 部署在每条链上的 ZetaChain 网关合约
2. **Universal App**: 部署在 ZetaChain 上的通用应用合约（处理跨链逻辑）
3. **ZetaTipRouter**: 部署在各链上的打赏合约

### 核心合约

- **ZetaTipRouter**: 主合约，处理所有打赏逻辑
- **IGatewayEVM**: ZetaChain Gateway 接口
- **Revert.sol**: 跨链失败回滚机制

### 关键方法

#### 用户方法

```solidity
// 同链打赏
function tipSameChain(
    address recipient,
    address token,
    uint256 amount,
    string calldata message
) external returns (bytes32 tipId)

// 跨链打赏
function tipCrossChain(
    address recipient,
    address token,
    uint256 amount,
    uint256 targetChainId,
    string calldata message
) external payable returns (bytes32 tipId)

// 费用估算
function estimateFees(
    uint256 targetChainId,
    uint256 amount
) external view returns (uint256 platformFee, uint256 netAmount)
```

#### 管理员方法

```solidity
function addSupportedToken(address token) external onlyOwner
function removeSupportedToken(address token) external onlyOwner
function updatePlatformFeeRate(uint256 newRate) external onlyOwner
function updateFeeRecipient(address newRecipient) external onlyOwner
function updateGateway(address newGateway) external onlyOwner
function updateUniversalApp(address newApp) external onlyOwner
function pause() external onlyOwner
function unpause() external onlyOwner
```

#### 回调方法

```solidity
// ZetaChain Gateway 回调（自动退款）
function onRevert(RevertContext calldata revertContext) external payable
```

## 快速开始

### 安装依赖

```bash
forge install
```

### 编译合约

```bash
forge build
```

### 运行测试

```bash
# 运行所有测试
forge test

# 运行测试并显示详细信息
forge test -vv

# 运行特定测试
forge test --match-test testTipSameChain

# 运行测试并显示 gas 报告
forge test --gas-report
```

### 部署合约

#### 1. 配置环境变量

复制环境变量模板并填入实际值：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# RPC 节点
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# 私钥
PRIVATE_KEY=your_private_key_here

# ZetaChain Gateway 地址（测试网）
GATEWAY_SEPOLIA=0x0c487a766110c85d301d96e33579c5b317fa4995
GATEWAY_BSC_TESTNET=0x0c487a766110c85d301d96e33579c5b317fa4995

# Universal App 地址（部署在 ZetaChain 后填入）
UNIVERSAL_APP_SEPOLIA=0x0000000000000000000000000000000000000000

# 平台费用接收地址
FEE_RECIPIENT=0xYourFeeRecipientAddress

# 平台费率（100 = 1%）
PLATFORM_FEE_RATE=100

# 部署脚本使用的变量
GATEWAY=${GATEWAY_SEPOLIA}
UNIVERSAL_APP=${UNIVERSAL_APP_SEPOLIA}
```

#### 2. 部署到测试网

**部署到 Sepolia：**

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

**部署到 BSC Testnet：**

```bash
# 更新 .env 中的 GATEWAY 和 UNIVERSAL_APP
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BSC_TESTNET_RPC_URL \
  --broadcast \
  --verify
```

#### 3. 添加支持的代币

```bash
# 设置已部署合约地址
export TIP_ROUTER_ADDRESS=0x...

# 运行脚本添加代币
forge script script/AddTokens.s.sol:AddTokens \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast
```

## 测试覆盖

| 测试类型 | 数量 | 状态 |
|---------|------|------|
| 同链打赏 | 5 | ✅ |
| 跨链打赏 | 2 | ✅ |
| 回滚测试 | 1 | ✅ |
| 费用管理 | 3 | ✅ |
| 代币管理 | 2 | ✅ |
| 配置管理 | 3 | ✅ |
| 权限控制 | 2 | ✅ |
| 应急提取 | 2 | ✅ |
| Fuzz 测试 | 1 | ✅ |
| **总计** | **21** | **✅ 全部通过** |

运行测试结果：

```
Ran 21 tests for test/ZetaTipRouter.t.sol:ZetaTipRouterTest
[PASS] testAddSupportedToken() (gas: 37625)
[PASS] testEmergencyWithdraw() (gas: 43033)
[PASS] testEmergencyWithdrawETH() (gas: 18702)
[PASS] testEstimateFees() (gas: 12399)
[PASS] testFuzzTipSameChain(uint256) (runs: 256, μ: 100957, ~: 100976)
[PASS] testOnRevert() (gas: 235791)
[PASS] testPauseUnpause() (gas: 17578)
[PASS] testRemoveSupportedToken() (gas: 16203)
[PASS] testTipCrossChain() (gas: 258898)
[PASS] testTipCrossChainSameChain() (gas: 54813)
[PASS] testTipSameChain() (gas: 107399)
[PASS] testTipSameChainAmountTooLow() (gas: 54805)
[PASS] testTipSameChainCannotTipSelf() (gas: 50450)
[PASS] testTipSameChainInvalidRecipient() (gas: 50360)
[PASS] testTipSameChainTokenNotSupported() (gas: 601636)
[PASS] testTipWhenPaused() (gas: 57530)
[PASS] testUpdateFeeRecipient() (gas: 20530)
[PASS] testUpdateGateway() (gas: 18823)
[PASS] testUpdatePlatformFeeRate() (gas: 18285)
[PASS] testUpdatePlatformFeeRateTooHigh() (gas: 10719)
[PASS] testUpdateUniversalApp() (gas: 18993)

Suite result: ok. 21 passed; 0 failed; 0 skipped
```

## 事件

合约触发以下事件供后端监听：

```solidity
// 打赏发送事件
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

// 跨链完成事件
event CrossChainTipCompleted(
    bytes32 indexed tipId,
    bool success
);

// 退款事件
event TipRefunded(
    bytes32 indexed tipId,
    address indexed tipper,
    uint256 amount,
    string reason
);
```

## 安全机制

1. **重入保护**: 使用 OpenZeppelin ReentrancyGuard
2. **暂停机制**: 紧急情况下可暂停合约
3. **金额验证**: 最小 0.1 USDC，最大 10,000 USDC
4. **代币白名单**: 只支持预先批准的代币
5. **费率限制**: 平台费率最高 5%
6. **自动退款**: 跨链失败时通过 `onRevert` 自动退款

## Gas 优化

- 使用紧凑的存储布局
- 事件代替链上存储
- 批量操作支持
- 优化的 SafeERC20 使用

## 合约地址

### 测试网

| 网络 | Gateway 地址 | ZetaTipRouter 地址 | 状态 |
|------|-------------|-------------------|------|
| Sepolia | `0x0c487a766110c85d301d96e33579c5b317fa4995` | TBD | ⏳ 待部署 |
| BSC Testnet | `0x0c487a766110c85d301d96e33579c5b317fa4995` | TBD | ⏳ 待部署 |
| ZetaChain Athens | N/A | TBD (Universal App) | ⏳ 待部署 |

### 主网

| 网络 | 地址 | 状态 |
|------|------|------|
| Ethereum | TBD | ⏳ 待部署 |
| BSC | TBD | ⏳ 待部署 |
| Base | TBD | ⏳ 待部署 |

## 支持的代币

### 测试网 USDC 地址

| 网络 | USDC 地址 |
|------|----------|
| Sepolia | `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8` |
| BSC Testnet | `0x64544969ed7EBf5f083679233325356EbE738930` |

## 开发

### 项目结构

```
contracts/
├── src/
│   ├── ZetaTipRouter.sol       # 主合约
│   └── interfaces/
│       ├── IGatewayEVM.sol     # Gateway 接口
│       └── Revert.sol          # 回滚机制
├── test/
│   └── ZetaTipRouter.t.sol     # 测试用例
├── script/
│   ├── Deploy.s.sol            # 部署脚本
│   └── AddTokens.s.sol         # 代币管理脚本
├── foundry.toml                # Foundry 配置
└── .env.example                # 环境变量模板
```

### 代码规范

```bash
# 格式化代码
forge fmt

# 检查代码
forge fmt --check
```

## 技术栈

- **Solidity**: ^0.8.20
- **OpenZeppelin**: v5.x
- **Foundry**: 开发框架
- **ZetaChain**: 跨链基础设施

## 注意事项

### 跨链打赏流程

1. 用户在源链调用 `tipCrossChain()`
2. 合约通过 Gateway 的 `depositAndCall()` 发起跨链
3. ZetaChain 上的 Universal App 接收并处理
4. 目标链的 Gateway 将代币发送给接收者
5. 如果失败，Gateway 会调用源链合约的 `onRevert()` 进行退款

### 关于 Universal App

目前合约配置了 Universal App 地址，但需要在 ZetaChain 上部署一个接收合约来处理跨链逻辑。简化方案：
- 同链打赏可以立即使用
- 跨链打赏需要完整的 Universal App 支持

### Demo 演示建议

对于快速演示，推荐使用**同链打赏**功能：
1. 在 Sepolia 上部署 ZetaTipRouter
2. 添加 USDC 到白名单
3. 演示同链打赏功能
4. 展示事件监听和后端集成

## 许可证

MIT

## 贡献

欢迎提交 Pull Request！

## 支持

如有问题，请提交 Issue。

---

Built with ❤️ on ZetaChain
