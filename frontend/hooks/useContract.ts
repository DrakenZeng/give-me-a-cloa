'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import ZetaTipRouterABI from '../contracts/ZetaTipRouter.json';
import { CONTRACT_ADDRESSES, CHAIN_IDS } from '../contracts/config';

/**
 * Hook for interacting with ZetaTipRouter contract
 */
export function useZetaTipRouter(chainId?: number) {
  const currentChainId = chainId || CHAIN_IDS.sepolia;

  // 获取合约地址
  const getContractAddress = () => {
    switch (currentChainId) {
      case CHAIN_IDS.localhost:
        return CONTRACT_ADDRESSES.localhost.ZetaTipRouter;
      case CHAIN_IDS.sepolia:
        return CONTRACT_ADDRESSES.sepolia.ZetaTipRouter;
      case CHAIN_IDS.bscTestnet:
        return CONTRACT_ADDRESSES.bscTestnet.ZetaTipRouter;
      case CHAIN_IDS.mainnet:
        return CONTRACT_ADDRESSES.mainnet.ZetaTipRouter;
      case CHAIN_IDS.bsc:
        return CONTRACT_ADDRESSES.bsc.ZetaTipRouter;
      default:
        return CONTRACT_ADDRESSES.localhost.ZetaTipRouter;
    }
  };

  const contractAddress = getContractAddress();

  // Write hooks
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * 同链打赏
   */
  const tipSameChain = async (
    recipient: `0x${string}`,
    token: `0x${string}`,
    amount: string, // 格式化后的金额（如 "10"）
    message: string,
    decimals: number = 6
  ) => {
    const amountWei = parseUnits(amount, decimals);

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: ZetaTipRouterABI,
      functionName: 'tipSameChain',
      args: [recipient, token, amountWei, message],
    });
  };

  /**
   * 跨链打赏
   */
  const tipCrossChain = async (
    recipient: `0x${string}`,
    token: `0x${string}`,
    amount: string,
    targetChainId: number,
    message: string,
    decimals: number = 6
  ) => {
    const amountWei = parseUnits(amount, decimals);

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: ZetaTipRouterABI,
      functionName: 'tipCrossChain',
      args: [recipient, token, amountWei, BigInt(targetChainId), message],
    });
  };

  /**
   * 估算费用
   */
  const { data: feeEstimate } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ZetaTipRouterABI,
    functionName: 'estimateFees',
    args: [BigInt(currentChainId), parseUnits('10', 6)], // 默认 10 USDC
  });

  /**
   * 获取平台费率
   */
  const { data: platformFeeRate } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ZetaTipRouterABI,
    functionName: 'platformFeeRate',
  });

  /**
   * 检查代币是否支持
   */
  const { data: isTokenSupported } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ZetaTipRouterABI,
    functionName: 'supportedTokens',
    args: [CONTRACT_ADDRESSES.sepolia.USDC as `0x${string}`],
  });

  return {
    // Write methods
    tipSameChain,
    tipCrossChain,

    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,

    // Read data
    feeEstimate,
    platformFeeRate,
    isTokenSupported,

    // Utils
    contractAddress,
  };
}

/**
 * Hook for ERC20 token operations
 */
export function useERC20Token(tokenAddress: `0x${string}`, chainId?: number) {
  const ERC20_ABI = [
    {
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
      ],
      name: 'allowance',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * 授权代币
   */
  const approve = async (spender: `0x${string}`, amount: string, decimals: number = 6) => {
    const amountWei = parseUnits(amount, decimals);

    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amountWei],
    });
  };

  /**
   * 查询余额
   */
  const useBalance = (address?: `0x${string}`) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
    });
  };

  /**
   * 查询授权额度
   */
  const useAllowance = (owner?: `0x${string}`, spender?: `0x${string}`) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: owner && spender ? [owner, spender] : undefined,
    });
  };

  /**
   * 查询代币精度
   */
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  return {
    approve,
    useBalance,
    useAllowance,
    decimals,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook for formatting amounts
 */
export function useFormatAmount() {
  const formatAmount = (amount: bigint | undefined, decimals: number = 6) => {
    if (!amount) return '0';
    return formatUnits(amount, decimals);
  };

  const parseAmount = (amount: string, decimals: number = 6) => {
    return parseUnits(amount, decimals);
  };

  return {
    formatAmount,
    parseAmount,
  };
}
