import { isAddress } from 'viem';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export const DEMO_TIP = {
  sourceChainId: 11155111, // Ethereum Sepolia
  targetChainId: 84532, // Base Sepolia
  amountEth: '0.01', // 增加到 0.01 ETH 以确保有足够的 gas 费用和交换金额
  recipientBaseSepolia: (process.env.NEXT_PUBLIC_DEMO_RECIPIENT_BASE_SEPOLIA || ZERO_ADDRESS) as `0x${string}`,
  universalSwapApp: (process.env.NEXT_PUBLIC_UNIVERSAL_SWAP_APP_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  targetZrc20BaseSepoliaGas: (process.env.NEXT_PUBLIC_TARGET_ZRC20_BASE_SEPOLIA || ZERO_ADDRESS) as `0x${string}`,
} as const;

export function validateDemoTipConfig() {
  const errors: string[] = [];

  if (!isAddress(DEMO_TIP.recipientBaseSepolia) || DEMO_TIP.recipientBaseSepolia === ZERO_ADDRESS) {
    errors.push('Missing NEXT_PUBLIC_DEMO_RECIPIENT_BASE_SEPOLIA');
  }
  if (!isAddress(DEMO_TIP.universalSwapApp) || DEMO_TIP.universalSwapApp === ZERO_ADDRESS) {
    errors.push('Missing NEXT_PUBLIC_UNIVERSAL_SWAP_APP_ADDRESS');
  }
  if (
    !isAddress(DEMO_TIP.targetZrc20BaseSepoliaGas) ||
    DEMO_TIP.targetZrc20BaseSepoliaGas === ZERO_ADDRESS
  ) {
    errors.push('Missing NEXT_PUBLIC_TARGET_ZRC20_BASE_SEPOLIA');
  }

  return { ok: errors.length === 0, errors } as const;
}

