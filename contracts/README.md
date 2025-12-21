# Give Me a Cola - 智能合约

> 基于 ZetaChain 的跨链打赏平台智能合约

## 概述

本项目包含两套智能合约实现：

1. **UniversalSwapApp** (当前使用) - 部署在 ZetaChain 上的通用应用，支持跨链代币交换和转账
2. **ZetaTipRouter** (备用方案) - 完整的打赏路由合约，支持同链和跨链打赏

## 当前架构

项目当前使用 **UniversalSwapApp + Gateway 直接调用** 的简化架构：

```
Source Chain (Sepolia)          ZetaChain                    Target Chain (Base Sepolia)
┌─────────────────┐            ┌──────────────────┐         ┌─────────────────┐
│  User Wallet    │            │ UniversalSwapApp │         │  Recipient      │
│                 │            │                  │         │                 │
│  depositAndCall │──────────►│   onCall()       │────────►│  receives funds │
│  (Gateway)      │  Gateway   │   swap & send    │ Gateway │                 │
└─────────────────┘            └──────────────────┘         └─────────────────┘
```

**优势：**
- ✅ 架构简单，易于理解和维护
- ✅ 无需在每条链上部署合约
- ✅ 直接使用 ZetaChain Gateway
- ✅ 支持代币交换（通过 Uniswap V2）

## 核心合约

### 1. UniversalSwapApp (当前使用)

**位置**: `src/UniversalSwapApp.sol`

**功能：**
- 接收跨链消息和资产
- 在 ZetaChain 上执行代币交换（通过 Uniswap V2）
- 将资产提款到目标链
- 处理失败回退（自动退款）

**关键方法：**
```solidity
// 接收跨链消息
function onCall(
    MessageContext calldata context,
    address zrc20,
    uint256 amount,
    bytes calldata message
) external override onlyGateway

// 处理失败回退
function onRevert(RevertContext calldata revertContext) external onlyGateway
```

**Payload 格式：**
```solidity
abi.encode(
    address targetZRC20,    // 目标 ZRC20 代币地址
    bytes recipient,        // 接收者地址
    bool withdrawFlag       // 是否提款到目标链
)
```

**部署脚本**: `script/DeployUniversalSwapApp.s.sol`

### 2. ZetaTipRouter (备用方案)

**位置**: `src/ZetaTipRouter.sol`

**功能：**
- 同链打赏（直接转账）
- 跨链打赏（通过 ZetaChain Gateway）
- 平台费用管理（可配置 0-5%）
- 代币白名单机制
- 暂停/恢复功能
- 跨链失败自动退款

**特点：**
- ✅ 完整的测试覆盖（21 个测试用例全部通过）
- ✅ 生产级安全机制
- ✅ Gas 优化
- ✅ 详细的事件日志

**注意**: 此合约保留作为未来扩展使用，当前项目使用 UniversalSwapApp。

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

# 运行 ZetaTipRouter 测试
forge test --match-contract ZetaTipRouterTest

# 运行测试并显示 gas 报告
forge test --gas-report
```

### 部署 UniversalSwapApp

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

**快速部署：**

```bash
# 1. 配置环境变量
export PRIVATE_KEY=your_private_key_here
export ZETA_TESTNET_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
export GATEWAY_ZEVM=0x6c533f7fe93fae114d0954697069df33c9b74fd7
export UNISWAP_ROUTER=0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe

# 2. 使用部署脚本
chmod +x scripts/deploy-universal-swap-app-athens.sh
./scripts/deploy-universal-swap-app-athens.sh

# 或者直接使用 Forge
forge script script/DeployUniversalSwapApp.s.sol:DeployUniversalSwapApp \
  --rpc-url $ZETA_TESTNET_RPC_URL \
  --broadcast
```

## 测试覆盖

### ZetaTipRouter 测试

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

运行测试：
```bash
forge test --match-contract ZetaTipRouterTest
```

## 项目结构

```
contracts/
├── src/
│   ├── UniversalSwapApp.sol      # 当前使用的通用应用
│   ├── ZetaTipRouter.sol         # 备用打赏路由合约
│   └── interfaces/
│       ├── IGatewayEVM.sol       # Gateway EVM 接口
│       ├── IGatewayZEVM.sol      # Gateway ZEVM 接口
│       └── Revert.sol            # 回滚机制
├── test/
│   └── ZetaTipRouter.t.sol       # ZetaTipRouter 测试用例
├── script/
│   └── DeployUniversalSwapApp.s.sol  # UniversalSwapApp 部署脚本
├── scripts/
│   └── deploy-universal-swap-app-athens.sh  # 部署 Shell 脚本
├── foundry.toml                  # Foundry 配置
├── DEPLOYMENT.md                 # 详细部署指南
└── README.md                     # 本文件
```

## 关键合约地址

### ZetaChain Athens Testnet
- Gateway ZEVM: `0x6c533f7fe93fae114d0954697069df33c9b74fd7`
- Uniswap V2 Router: `0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe`

### Ethereum Sepolia
- Gateway EVM: `0x0c487a766110c85d301d96e33579c5b317fa4995`

### Base Sepolia
- Gateway EVM: `0x0c487a766110c85d301d96e33579c5b317fa4995`

### BSC Testnet
- Gateway EVM: `0x0c487a766110c85d301d96e33579c5b317fa4995`

## 安全机制

### UniversalSwapApp
- ✅ Gateway 权限验证
- ✅ 失败自动回退
- ✅ Gas 费用自动处理
- ✅ 所有者权限控制

### ZetaTipRouter
- ✅ 重入保护 (ReentrancyGuard)
- ✅ 暂停机制 (Pausable)
- ✅ 金额验证 (0.1-10,000 USDC)
- ✅ 代币白名单
- ✅ 费率限制 (最高 5%)
- ✅ 自动退款机制

## 开发工具

### 代码格式化

```bash
# 格式化代码
forge fmt

# 检查代码格式
forge fmt --check
```

### Gas 报告

```bash
forge test --gas-report
```

### 覆盖率报告

```bash
forge coverage
```

## 技术栈

- **Solidity**: ^0.8.20
- **OpenZeppelin**: v5.x
- **Foundry**: 开发框架
- **ZetaChain**: 跨链基础设施
- **Uniswap V2**: 代币交换

## 架构选择

### 为什么使用 UniversalSwapApp？

1. **简化部署**: 只需在 ZetaChain 上部署一个合约
2. **降低成本**: 无需在每条链上部署和维护合约
3. **灵活性**: 支持任意代币对的交换
4. **可扩展**: 易于添加新链支持

### 何时使用 ZetaTipRouter？

如果需要以下功能，可以考虑使用 ZetaTipRouter：

- 平台费用收取
- 代币白名单管理
- 同链打赏优化
- 更细粒度的权限控制
- 详细的事件日志

## 文档

- [部署指南](./DEPLOYMENT.md) - 完整的部署步骤和配置说明
- [ZetaChain 文档](https://docs.zetachain.com/) - ZetaChain 官方文档
- [Gateway 文档](https://docs.zetachain.com/developers/omnichain/gateway/) - Gateway 使用指南

## 监控和调试

### 查看交易状态

1. **源链交易** (Sepolia): https://sepolia.etherscan.io/
2. **ZetaChain 跨链消息**: https://testnet.zetascan.com/
3. **目标链交易** (Base Sepolia): https://sepolia.basescan.org/

### UniversalSwapApp 事件

```solidity
event SwapExecuted(address indexed zrc20In, address indexed zrc20Out, uint256 amountIn, uint256 amountOut);
event WithdrawInitiated(address indexed zrc20, bytes recipient, uint256 amount);
event RevertHandled(address indexed zrc20, address indexed sender, uint256 amount);
```

## 故障排查

### 常见问题

1. **交易失败 - "Insufficient gas"**
   - 增加发送的 ETH 金额（至少 0.01 ETH）

2. **代币未到账**
   - 在 ZetaScan 查看跨链交易状态
   - 确认 UniversalSwapApp 地址配置正确
   - 等待 5-10 分钟

3. **Swap 失败**
   - 检查 Uniswap V2 池子流动性
   - 确认 ZRC20 地址正确

详细故障排查请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 许可证

MIT

## 贡献

欢迎提交 Pull Request！

## 支持

如有问题，请提交 Issue 或查看 [ZetaChain 官方文档](https://docs.zetachain.com/)。

---

Built with ❤️ on ZetaChain
