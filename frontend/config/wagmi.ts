import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, zetachainAthensTestnet, localhost } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID (replace with your own from cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// 自定义 localhost 链配置（Anvil 默认配置）
const anvilLocalhost = {
  ...localhost,
  id: 31337,
  name: 'Anvil Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
} as const;

export const config = createConfig({
  chains: [anvilLocalhost, mainnet, sepolia, zetachainAthensTestnet],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Give Me A Cola' }),
    // WalletConnect 暂时禁用（需要有效的 Project ID）
    // 如需启用，请在 .env.local 中设置 NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    // Only initialize WalletConnect on client-side to avoid indexedDB SSR errors
    ...(typeof window !== 'undefined' && projectId && projectId !== 'demo-project-id' ? [
      walletConnect({
        projectId,
        showQrModal: false,
      })
    ] : []),
  ],
  transports: {
    [anvilLocalhost.id]: http('http://127.0.0.1:8545'),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [zetachainAthensTestnet.id]: http(),
  },
  ssr: true, // Enable server-side rendering support
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
