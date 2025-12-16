# 跨链打赏完整部署指南

## 概述

本指南将帮助你完成真实的跨链打赏功能部署，实现从 Sepolia 到 BSC Testnet 的跨链 USDC 打赏。

## 架构说明

```
Source Chain (Sepolia)          ZetaChain               Target Chain (BSC Testnet)
┌─────────────────┐            ┌──────────────────┐    ┌─────────────────┐
│ ZetaTipRouter   │            │ UniversalTipApp  │    │ ZetaTipRouter   │
│                 │            │                  │    │  (可选,接收端)  │
│  tipCrossChain()│──────────►│   onCall()       │───►│                 │
│                 │  Gateway   │   _forwardTip()  │    │                 │
└─────────────────┘            └──────────────────┘    └─────────────────┘
     Gateway                         Gateway                Gateway
  (Sepolia)                        (ZetaChain)            (BSC Testnet)
```

## 回答你的问题

### Q: 用户A在ETH Sepolia打赏USDC给用户B的BSC测试网，还需要准备BSC的代币吗？

**答：不需要！**

**流程：**

1. 用户 A 在 Sepolia 上：
   - 授权 10 USDC 给 ZetaTipRouter
   - 调用 `tipCrossChain()`，支付少量 ETH 作为跨链 Gas

2. ZetaChain 自动处理：
   - Sepolia USDC → ZRC-20 USDC（ZetaChain）→ BSC USDC
   - 用户 B 直接在 BSC 收到 USDC

3. 用户 B 无需任何操作：
   - ✅ 不需要提前有 BSC 的任何代币
   - ✅ 直接收到 BSC USDC 到钱包

**关键点：**
- Gas费：用户 A 在发起时支付（Sepolia ETH + 跨链费用约 0.01 ETH）
- 代币转换：ZetaChain 自动处理
- 用户 B：零成本接收

## 部署步骤

### 步骤 1：准备环境

1. **安装依赖**：
```bash
cd contracts
forge install
```

2. **配置环境变量**：
```bash
cp .env.example .env
```

编辑 `.env`：
```bash
# RPC 节点
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
ZETA_TESTNET_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# 私钥（确保有测试网ETH和代币）
PRIVATE_KEY=your_private_key

# Gateway 地址（已配置好）
GATEWAY_SEPOLIA=0x0c487a766110c85d301d96e33579c5b317fa4995
GATEWAY_BSC_TESTNET=0x0c487a766110c85d301d96e33579c5b317fa4995
GATEWAY_ZEVM=0x6c533f7fe93fae114d0954697069df33c9b74fd7

# 平台配置
FEE_RECIPIENT=0xYourAddress  # 平台费用接收地址
PLATFORM_FEE_RATE=100  # 1%
```

### 步骤 2：部署 Universal App 到 ZetaChain

```bash
# 设置环境变量
export GATEWAY=0x6c533f7fe93fae114d0954697069df33c9b74fd7

# 部署
forge script script/DeployUniversalApp.s.sol:DeployUniversalApp \
  --rpc-url $ZETA_TESTNET_RPC_URL \
  --broadcast

# 记录输出的 Universal App 地址
# 例如: UniversalTipApp deployed at: 0x1234...5678
```

### 步骤 3：部署 ZetaTipRouter 到 Sepolia

```bash
# 更新 .env
export GATEWAY=0x0c487a766110c85d301d96e33579c5b317fa4995
export UNIVERSAL_APP=0x1234...5678  # 步骤2的地址

# 部署到 Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify

# 记录 ZetaTipRouter 地址
# 例如: ZetaTipRouter deployed at: 0xAAAA...BBBB
```

### 步骤 4：部署 ZetaTipRouter 到 BSC Testnet（可选）

```bash
# 更新 .env
export GATEWAY=0x0c487a766110c85d301d96e33579c5b317fa4995

# 部署到 BSC Testnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BSC_TESTNET_RPC_URL \
  --broadcast \
  --verify

# 记录 ZetaTipRouter 地址
# 例如: ZetaTipRouter deployed at: 0xCCCC...DDDD
```

### 步骤 5：配置 Universal App

在 ZetaChain 上授权源链的 Router：

```bash
# 使用 cast 命令行工具
cast send 0x1234...5678 \  # Universal App 地址
  "authorizeRouter(uint256,address)" \
  11155111 \  # Sepolia Chain ID
  0xAAAA...BBBB \  # Sepolia ZetaTipRouter 地址
  --rpc-url $ZETA_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY

# 如果有 BSC Router，也授权
cast send 0x1234...5678 \
  "authorizeRouter(uint256,address)" \
  97 \  # BSC Testnet Chain ID
  0xCCCC...DDDD \  # BSC ZetaTipRouter 地址
  --rpc-url $ZETA_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 步骤 6：添加支持的代币

在 Sepolia Router 上添加 USDC：

```bash
export TIP_ROUTER_ADDRESS=0xAAAA...BBBB  # Sepolia Router

forge script script/AddTokens.s.sol:AddTokens \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast
```

### 步骤 7：测试跨链打赏

1. **获取测试 USDC**：
   - Sepolia USDC: `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8`
   - 可从 Faucet 获取

2. **授权**：
```bash
cast send 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8 \  # USDC
  "approve(address,uint256)" \
  0xAAAA...BBBB \  # ZetaTipRouter
  10000000 \  # 10 USDC (6 decimals)
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

3. **跨链打赏**：
```bash
cast send 0xAAAA...BBBB \  # ZetaTipRouter
  "tipCrossChain(address,address,uint256,uint256,string)" \
  0xRecipientAddress \  # 接收者地址
  0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8 \  # USDC
  10000000 \  # 10 USDC
  97 \  # BSC Testnet
  "Cross-chain tip!" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

4. **监控交易**：
   - 在 Sepolia Explorer 查看源交易
   - 在 ZetaChain Explorer 查看跨链消息
   - 在 BSC Explorer 查看目标交易

## 快速测试方案（仅同链）

如果只是演示，可以只部署同链版本：

```bash
# 1. 部署到 Sepolia（不需要 Universal App）
export GATEWAY=0x0c487a766110c85d301d96e33579c5b317fa4995
export UNIVERSAL_APP=0x0000000000000000000000000000000000000000

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast

# 2. 添加 USDC
export TIP_ROUTER_ADDRESS=0xYourDeployedAddress
forge script script/AddTokens.s.sol:AddTokens \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast

# 3. 测试同链打赏
cast send $TIP_ROUTER_ADDRESS \
  "tipSameChain(address,address,uint256,string)" \
  0xRecipient \
  0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8 \
  10000000 \
  "Same chain tip!" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

## 费用说明

### 同链打赏
- ✅ Gas 费：~0.001 ETH（Sepolia）
- ✅ 平台费：1%（可配置）

### 跨链打赏
- ✅ 源链 Gas：~0.002 ETH
- ✅ 跨链 Gas：由 Gateway 体系处理（当前合约不通过 msg.value 收取）
- ✅ 平台费：1%
- ✅ 接收者：无需支付任何费用

## 前端集成

更新前端配置文件 `frontend/contracts/config.ts`：

```typescript
export const CONTRACT_ADDRESSES = {
  sepolia: {
    ZetaTipRouter: '0xAAAA...BBBB',  # 你部署的地址
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
  },
  bscTestnet: {
    ZetaTipRouter: '0xCCCC...DDDD',  # 可选
    USDC: '0x64544969ed7EBf5f083679233325356EbE738930',
  },
}
```

## 故障排查

### 问题 1：跨链交易失败
- **检查**: Universal App 是否正确授权了源链 Router
- **检查**: msg.value 是否足够（至少 0.01 ETH）
- **检查**: ZetaChain 上是否有足够的流动性

### 问题 2：代币未到账
- **等待**: 跨链需要几分钟时间
- **检查**: ZetaChain Explorer 查看跨链状态
- **检查**: 接收地址是否正确

### 问题 3：授权失败
- **检查**: Universal App 地址是否正确配置在 ZetaTipRouter
- **检查**: authorizeRouter 是否正确调用

## 总结

✅ **最简方案**（仅同链，10分钟）：
- 部署 ZetaTipRouter 到一条链
- 添加支持的代币
- 立即可以打赏

✅ **完整方案**（跨链，30分钟）：
- 部署 UniversalTipApp 到 ZetaChain
- 部署 ZetaTipRouter 到源链和目标链
- 配置授权关系
- 实现真正跨链

🎯 **建议**：
- Hackathon 演示：使用同链方案
- 生产环境：使用完整跨链方案

---

需要帮助？提交 Issue 或查看 ZetaChain 文档。
