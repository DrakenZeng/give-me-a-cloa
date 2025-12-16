// 合约地址配置
export const CONTRACT_ADDRESSES = {
  // 测试网
  sepolia: {
    ZetaTipRouter: '0x0000000000000000000000000000000000000000', // TODO: 部署后填入
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
  },
  bscTestnet: {
    ZetaTipRouter: '0x0000000000000000000000000000000000000000', // TODO: 部署后填入
    USDC: '0x64544969ed7EBf5f083679233325356EbE738930',
  },
  // 主网（待部署）
  mainnet: {
    ZetaTipRouter: '0x0000000000000000000000000000000000000000',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  bsc: {
    ZetaTipRouter: '0x0000000000000000000000000000000000000000',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  },
} as const;

// 链 ID 映射
export const CHAIN_IDS = {
  sepolia: 11155111,
  bscTestnet: 97,
  mainnet: 1,
  bsc: 56,
} as const;

// 链名称映射
export const CHAIN_NAMES = {
  [CHAIN_IDS.sepolia]: 'Sepolia',
  [CHAIN_IDS.bscTestnet]: 'BSC Testnet',
  [CHAIN_IDS.mainnet]: 'Ethereum',
  [CHAIN_IDS.bsc]: 'BSC',
} as const;

// 平台费率（基点，100 = 1%）
export const PLATFORM_FEE_RATE = 100; // 1%

// 最小/最大打赏金额（USDC，6 decimals）
export const MIN_TIP_AMOUNT = 0.1 * 10 ** 6; // 0.1 USDC
export const MAX_TIP_AMOUNT = 10000 * 10 ** 6; // 10,000 USDC

// 跨链额外 native 费用（当前合约不收取 msg.value）
export const CROSS_CHAIN_GAS = 0;

// 支持的代币
export const SUPPORTED_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      [CHAIN_IDS.sepolia]: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
      [CHAIN_IDS.bscTestnet]: '0x64544969ed7EBf5f083679233325356EbE738930',
      [CHAIN_IDS.mainnet]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      [CHAIN_IDS.bsc]: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    },
  },
} as const;
