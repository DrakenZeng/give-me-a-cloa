'use client';

import { encodeAbiParameters, isAddress, parseAbiParameters, parseEther } from 'viem';
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES, CHAIN_IDS } from '../contracts/config';
import { DEMO_TIP, validateDemoTipConfig } from '../contracts/demo';
import { gatewayEvmAbi } from '../contracts/gatewayEvmAbi';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export function useDemoEthTip() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const gatewaySepolia = CONTRACT_ADDRESSES.sepolia.Gateway;

  const configCheck = validateDemoTipConfig();
  const isReady =
    chainId === CHAIN_IDS.sepolia &&
    Boolean(address) &&
    configCheck.ok &&
    isAddress(gatewaySepolia) &&
    gatewaySepolia !== ZERO_ADDRESS;

  const send = async () => {
    if (chainId !== CHAIN_IDS.sepolia) {
      await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
      return;
    }
    if (!address) throw new Error('Wallet not connected');
    if (!configCheck.ok) throw new Error(configCheck.errors.join(', '));

    const payload = encodeAbiParameters(parseAbiParameters('address targetZRC20, bytes recipient, bool withdrawFlag'), [
      DEMO_TIP.targetZrc20BaseSepoliaGas,
      DEMO_TIP.recipientBaseSepolia,
      true,
    ]);

    return writeContractAsync({
      address: gatewaySepolia,
      abi: gatewayEvmAbi,
      functionName: 'depositAndCall',
      args: [
        DEMO_TIP.universalSwapApp,
        payload,
        {
          revertAddress: address,
          callOnRevert: false,
          abortAddress: ZERO_ADDRESS,
          revertMessage: '0x',
          onRevertGasLimit: 0n,
        },
      ],
      value: parseEther(DEMO_TIP.amountEth),
    });
  };

  return {
    amountEth: DEMO_TIP.amountEth,
    recipient: DEMO_TIP.recipientBaseSepolia,
    universalSwapApp: DEMO_TIP.universalSwapApp,
    targetZrc20: DEMO_TIP.targetZrc20BaseSepoliaGas,
    gateway: gatewaySepolia,

    isReady,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,

    configErrors: configCheck.ok ? [] : configCheck.errors,
    send,
  };
}

