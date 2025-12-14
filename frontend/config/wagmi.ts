import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, zetachainAthensTestnet } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID (replace with your own from cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = createConfig({
  chains: [mainnet, sepolia, zetachainAthensTestnet],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Give Me A Cola' }),
    walletConnect({
      projectId,
      showQrModal: false, // Disable WalletConnect's built-in modal, use ConnectKit's UI instead
    }),
  ],
  transports: {
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
