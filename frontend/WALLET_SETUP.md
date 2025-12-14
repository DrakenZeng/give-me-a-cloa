# 钱包连接配置指南

## 技术栈

- **viem**: 现代化的以太坊接口
- **wagmi**: React Hooks for Ethereum
- **ConnectKit**: 美观的钱包连接 UI

## 已配置的链

1. **Ethereum Mainnet** - 以太坊主网
2. **Sepolia Testnet** - Sepolia 测试网
3. **ZetaChain Athens Testnet** - ZetaChain 雅典测试网

## 支持的钱包

- **MetaMask** (Injected)
- **Coinbase Wallet**
- **WalletConnect** (200+ 钱包)

## 配置文件

### 1. Wagmi 配置 (`config/wagmi.ts`)

包含链配置、连接器配置和传输层配置。

### 2. Providers (`components/Providers.tsx`)

包装了 `WagmiProvider`、`QueryClientProvider` 和 `ConnectKitProvider`。

### 3. 环境变量 (`.env.local`)

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

**获取 WalletConnect Project ID:**
访问 https://cloud.walletconnect.com/ 创建免费项目。

## 使用方法

### 连接钱包按钮

已在 `Navbar` 组件中集成 `ConnectKitButton`：

```tsx
import { ConnectKitButton } from 'connectkit';

<ConnectKitButton />
```

### 使用 Wagmi Hooks

```tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi';

function MyComponent() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        Connected: {address}
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return connectors.map((connector) => (
    <button
      key={connector.id}
      onClick={() => connect({ connector })}
    >
      Connect with {connector.name}
    </button>
  ));
}
```

### 读取链上数据

```tsx
import { useBalance } from 'wagmi';

function Balance() {
  const { data, isError, isLoading } = useBalance({
    address: '0x...',
  });

  if (isLoading) return <div>Fetching balance...</div>;
  if (isError) return <div>Error fetching balance</div>;

  return (
    <div>
      Balance: {data?.formatted} {data?.symbol}
    </div>
  );
}
```

### 发送交易

```tsx
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

function SendTransaction() {
  const { data: hash, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  return (
    <div>
      <button
        onClick={() =>
          sendTransaction({
            to: '0x...',
            value: parseEther('0.01'),
          })
        }
      >
        Send Transaction
      </button>
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isSuccess && <div>Transaction confirmed!</div>}
    </div>
  );
}
```

## ConnectKit 主题定制

在 `components/Providers.tsx` 中已配置为暗黑主题：

```tsx
<ConnectKitProvider
  theme="midnight"  // "midnight" | "soft" | "rounded" | "minimal"
  mode="dark"       // "dark" | "light" | "auto"
>
  {children}
</ConnectKitProvider>
```

## 自定义配置

### 添加新链

在 `config/wagmi.ts` 中添加：

```tsx
import { avalanche } from 'wagmi/chains';

export const config = createConfig({
  chains: [mainnet, sepolia, zetachainAthensTestnet, avalanche],
  // ...
  transports: {
    // ...
    [avalanche.id]: http(),
  },
});
```

### 自定义 RPC

```tsx
import { http } from 'wagmi';

transports: {
  [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
}
```

## 故障排除

### SSR 警告

如果看到 `indexedDB is not defined` 警告，这是正常的。WalletConnect 尝试在服务端初始化，但不会影响客户端功能。

### Peer Dependencies 警告

ConnectKit 1.9.1 期望 Wagmi 2.x，但我们使用的是 3.x。这通常不会造成问题，但如果遇到兼容性问题，可以降级：

```bash
pnpm add wagmi@^2.12.0
```

## 开发模式

```bash
pnpm dev
```

访问 http://localhost:3000，点击右上角的连接钱包按钮。

## 生产部署

确保在生产环境中设置真实的 WalletConnect Project ID：

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-real-project-id
```

## 资源

- [Wagmi 文档](https://wagmi.sh/)
- [Viem 文档](https://viem.sh/)
- [ConnectKit 文档](https://docs.family.co/connectkit)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)
