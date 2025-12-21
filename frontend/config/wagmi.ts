import { http, createConfig } from 'wagmi';
import { sepolia, zetachainAthensTestnet, localhost } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

const rawWalletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
const walletConnectProjectId =
  rawWalletConnectProjectId &&
  rawWalletConnectProjectId !== 'demo-project-id' &&
  /^[0-9a-f]{32}$/i.test(rawWalletConnectProjectId)
    ? rawWalletConnectProjectId
    : undefined;

if (
  rawWalletConnectProjectId &&
  rawWalletConnectProjectId !== 'demo-project-id' &&
  !walletConnectProjectId
) {
  console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is set but invalid. WalletConnect will be disabled until you provide a valid key.');
}

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

const connectors = [
  injected(),
  coinbaseWallet({ appName: 'Give Me A Cola', chains: [sepolia] }),
  ...(typeof window !== 'undefined' && walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          showQrModal: false,
        }),
      ]
    : []),
];

export const config = createConfig({
  chains: [anvilLocalhost, sepolia, zetachainAthensTestnet],
  connectors,
  transports: {
    [anvilLocalhost.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(),
    [zetachainAthensTestnet.id]: http(),
  },
  ssr: true, // Enable server-side rendering support
});

config.setState((state) => ({
  ...state,
  chainId: sepolia.id,
}));

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

export { walletConnectProjectId };
