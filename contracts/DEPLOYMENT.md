# 跨链打赏部署指南

## 概述

本指南将帮助你部署基于 ZetaChain Gateway 和 UniversalSwapApp 的跨链打赏功能。

## 当前架构

```
Source Chain (Sepolia)          ZetaChain                    Target Chain (Base Sepolia)
┌─────────────────┐            ┌──────────────────┐         ┌─────────────────┐
│  User Wallet    │            │ UniversalSwapApp │         │  Recipient      │
│                 │            │                  │         │                 │
│  depositAndCall │──────────►│   onCall()       │────────►│  receives funds │
│  (Gateway)      │  Gateway   │   swap & send    │ Gateway │                 │
└─────────────────┘            └──────────────────┘         └─────────────────┘
     Gateway                         Gateway                     Gateway
  (Sepolia)                        (ZetaChain)               (Base Sepolia)
```

**核心组件：**
- **Gateway EVM**: 部署在源链（如 Sepolia）的 ZetaChain 网关合约
- **UniversalSwapApp**: 部署在 ZetaChain 上的通用应用，处理代币交换和跨链路由
- **Gateway ZEVM**: ZetaChain 上的网关，处理跨链消息和提款

## 工作流程

1. 用户在源链（Sepolia）调用 Gateway 的 `depositAndCall()`
2. Gateway 将资产和消息发送到 ZetaChain
3. UniversalSwapApp 接收消息，执行代币交换（如需要）
4. UniversalSwapApp 通过 Gateway 将资产提款到目标链
5. 接收者在目标链（Base Sepolia）收到资金

## 部署步骤

### 步骤 1：准备环境

1. **安装依赖**：
```bash
cd contracts
forge install
```

2. **配置环境变量**：
```bash
# 创建 .env 文件
cat > .env << EOF
# RPC 节点
ZETA_TESTNET_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# 私钥（确保有测试网代币）
PRIVATE_KEY=your_private_key_here

# Gateway 地址（ZetaChain Athens Testnet）
GATEWAY_ZEVM=0x6c533f7fe93fae114d0954697069df33c9b74fd7

# Uniswap Router（ZetaChain Athens）
UNISWAP_ROUTER=0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe

# Revert Gas Limit
ON_REVERT_GAS_LIMIT=500000
EOF
```

### 步骤 2：部署 UniversalSwapApp 到 ZetaChain

使用提供的部署脚本：

```bash
# 方式 1: 使用 Shell 脚本（推荐）
cd contracts
chmod +x scripts/deploy-universal-swap-app-athens.sh
PRIVATE_KEY=your_private_key ./scripts/deploy-universal-swap-app-athens.sh
```

或者手动部署：

```bash
# 方式 2: 直接使用 Forge
source .env
forge script script/DeployUniversalSwapApp.s.sol:DeployUniversalSwapApp \
  --rpc-url $ZETA_TESTNET_RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY
```

**记录输出的合约地址**，例如：
```
UniversalSwapApp deployed at: 0x1234567890abcdef...
```

### 步骤 3：配置前端

更新前端环境变量 `frontend/.env.local`：

```bash
# UniversalSwapApp 地址（步骤 2 部署的地址）
NEXT_PUBLIC_UNIVERSAL_SWAP_APP_ADDRESS=0x1234567890abcdef...

# 接收者地址（Base Sepolia）
NEXT_PUBLIC_DEMO_RECIPIENT_BASE_SEPOLIA=0xYourRecipientAddress

# 目标 ZRC20 代币（Base Sepolia Gas Token）
NEXT_PUBLIC_TARGET_ZRC20_BASE_SEPOLIA=0x...

# Sepolia Gateway 地址
NEXT_PUBLIC_SEPOLIA_GATEWAY_ADDRESS=0x0c487a766110c85d301d96e33579c5b317fa4995
```

### 步骤 4：测试跨链打赏

1. **获取测试 ETH**：
   - Sepolia Faucet: https://sepoliafaucet.com/
   - 确保钱包有至少 0.02 ETH

2. **启动前端**：
```bash
cd frontend
pnpm install
pnpm dev
```

3. **测试流程**：
   - 访问 http://localhost:3000
   - 连接钱包（切换到 Sepolia 网络）
   - 打开 VendingMachine 组件
   - 点击 "PUSH" 按钮发送 demo 打赏
   - 等待交易确认（约 2-5 分钟）
   - 在 Base Sepolia 上检查接收者余额

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

## 费用说明

### 跨链打赏费用
- **源链 Gas**: ~0.002-0.005 ETH（Sepolia）
- **跨链费用**: 包含在发送的 ETH 中（约 0.01 ETH）
- **目标链 Gas**: 由 UniversalSwapApp 自动处理
- **接收者**: 无需支付任何费用

## 合约功能

### UniversalSwapApp

**主要功能：**
- 接收跨链消息和资产
- 在 ZetaChain 上执行代币交换（通过 Uniswap V2）
- 将资产提款到目标链
- 处理失败回退（自动退款）

**Payload 格式：**
```solidity
abi.encode(
    address targetZRC20,    // 目标 ZRC20 代币地址
    bytes recipient,        // 接收者地址
    bool withdrawFlag       // 是否提款到目标链
)
```

**支持的交换路径：**
1. 直接交换: ZRC20-A → ZRC20-B
2. 通过 WZETA: ZRC20-A → WZETA → ZRC20-B

## 故障排查

### 问题 1：交易失败 - "Insufficient gas"
**解决方案**: 增加发送的 ETH 金额（至少 0.01 ETH）

### 问题 2：代币未到账
**检查步骤**:
1. 在 ZetaScan 查看跨链交易状态: https://testnet.zetascan.com/
2. 确认 UniversalSwapApp 地址配置正确
3. 确认目标 ZRC20 地址正确
4. 等待 5-10 分钟（跨链需要时间）

### 问题 3：Swap 失败
**可能原因**:
- ZetaChain 上流动性不足
- ZRC20 地址错误
- Gas 费用不足

**解决方案**: 检查 Uniswap V2 池子流动性，或使用不同的代币对

### 问题 4：Revert 回调
如果跨链失败，UniversalSwapApp 会自动调用 `onRevert()` 将资金退回源链。检查源链钱包是否收到退款。

## 监控和调试

### 查看交易状态

1. **源链交易** (Sepolia):
   - Etherscan: https://sepolia.etherscan.io/

2. **ZetaChain 跨链消息**:
   - ZetaScan: https://testnet.zetascan.com/

3. **目标链交易** (Base Sepolia):
   - BaseScan: https://sepolia.basescan.org/

### 合约事件

UniversalSwapApp 发出的关键事件：
- `SwapExecuted`: 代币交换成功
- `WithdrawInitiated`: 提款到目标链
- `RevertHandled`: 失败回退处理

## 扩展功能

### 添加新的代币对

1. 确保 ZetaChain 上有对应的 ZRC20 代币
2. 确保 Uniswap V2 上有足够的流动性
3. 更新前端配置添加新代币选项

### 支持新的目标链

1. 确认 ZetaChain 支持该链
2. 获取该链的 Gateway 地址
3. 获取该链的 ZRC20 Gas Token 地址
4. 更新前端配置

## 安全注意事项

1. **私钥安全**: 永远不要将私钥提交到 Git
2. **测试网使用**: 当前配置仅用于测试网
3. **Gas 限制**: 设置合理的 `onRevertGasLimit` 避免回退失败
4. **金额限制**: 建议在生产环境添加最大金额限制

## 生产部署建议

在部署到主网前：

1. ✅ 完整的安全审计
2. ✅ 添加访问控制（Ownable/AccessControl）
3. ✅ 添加暂停机制（Pausable）
4. ✅ 设置合理的费用和限额
5. ✅ 监控和告警系统
6. ✅ 应急响应计划

## 参考资源

- ZetaChain 文档: https://docs.zetachain.com/
- ZetaChain Gateway: https://docs.zetachain.com/developers/omnichain/gateway/
- ZetaScan Explorer: https://testnet.zetascan.com/
- 项目 GitHub: https://github.com/your-repo

---

需要帮助？提交 Issue 或查看 ZetaChain 官方文档。
