'use client';

import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { useZetaTipRouter, useERC20Token, useFormatAmount } from '../../hooks/useContract';
import { CONTRACT_ADDRESSES, CHAIN_IDS, CHAIN_NAMES, SUPPORTED_TOKENS, MIN_TIP_AMOUNT, MAX_TIP_AMOUNT } from '../../contracts/config';

export function TipModal() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { tipSameChain, tipCrossChain, isPending, isSuccess, error } = useZetaTipRouter(chainId);
  const { formatAmount } = useFormatAmount();

  // 表单状态
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [targetChainId, setTargetChainId] = useState(chainId);
  const [step, setStep] = useState<'input' | 'approve' | 'sending'>('input');

  // 获取 USDC 地址
  const getUSDCAddress = (chain: number) => {
    return SUPPORTED_TOKENS.USDC.addresses[chain as keyof typeof SUPPORTED_TOKENS.USDC.addresses];
  };

  const usdcAddress = getUSDCAddress(chainId);
  const { approve, useBalance, useAllowance, isPending: isApproving, isSuccess: isApproveSuccess } = useERC20Token(usdcAddress as `0x${string}`, chainId);

  // 查询余额和授权
  const { data: balance } = useBalance(address);
  const { data: allowance } = useAllowance(address, useZetaTipRouter(chainId).contractAddress as `0x${string}`);

  // 是否跨链
  const isCrossChain = targetChainId !== chainId;

  // 计算费用
  const calculateFees = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      return { platformFee: '0', netAmount: '0', total: amount };
    }

    const amountNum = parseFloat(amount);
    const platformFee = amountNum * 0.01; // 1%
    const netAmount = amountNum - platformFee;

    return {
      platformFee: platformFee.toFixed(2),
      netAmount: netAmount.toFixed(2),
      total: amount,
    };
  };

  const fees = calculateFees();

  // 验证表单
  const isFormValid = () => {
    if (!recipient || !amount || !address) return false;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return false;
    if (amountNum < MIN_TIP_AMOUNT / 10 ** 6) return false;
    if (amountNum > MAX_TIP_AMOUNT / 10 ** 6) return false;

    // 检查余额
    if (balance) {
      const balanceNum = parseFloat(formatAmount(balance, 6));
      if (amountNum > balanceNum) return false;
    }

    return true;
  };

  // 检查是否需要授权
  const needsApproval = () => {
    if (!amount || !allowance) return true;

    const amountWei = parseUnits(amount, 6);
    return allowance < amountWei;
  };

  // 处理授权
  const handleApprove = async () => {
    try {
      setStep('approve');
      await approve(
        useZetaTipRouter(chainId).contractAddress as `0x${string}`,
        amount,
        6
      );
    } catch (err) {
      console.error('Approval failed:', err);
      setStep('input');
    }
  };

  // 处理打赏
  const handleTip = async () => {
    if (!isFormValid()) return;

    try {
      setStep('sending');

      if (isCrossChain) {
        await tipCrossChain(
          recipient as `0x${string}`,
          usdcAddress as `0x${string}`,
          amount,
          targetChainId,
          message,
          6
        );
      } else {
        await tipSameChain(
          recipient as `0x${string}`,
          usdcAddress as `0x${string}`,
          amount,
          message,
          6
        );
      }
    } catch (err) {
      console.error('Tip failed:', err);
      setStep('input');
    }
  };

  // 重置表单
  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setMessage('');
    setStep('input');
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">🥤 请我喝可乐</h2>

      {/* 成功提示 */}
      {isSuccess && (
        <div className="mb-4 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
          <p className="text-emerald-400 text-sm">✓ 打赏成功！</p>
          <button
            onClick={resetForm}
            className="mt-2 text-emerald-400 text-sm underline"
          >
            发送另一笔
          </button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">⚠️ {error.message}</p>
        </div>
      )}

      {!isSuccess && (
        <div className="space-y-4">
          {/* 接收者地址 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">接收者地址</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              disabled={isPending || isApproving}
            />
          </div>

          {/* 金额 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              金额 (USDC)
              {balance && (
                <span className="float-right text-zinc-500">
                  余额: {formatAmount(balance, 6)}
                </span>
              )}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10.00"
              step="0.01"
              min={MIN_TIP_AMOUNT / 10 ** 6}
              max={MAX_TIP_AMOUNT / 10 ** 6}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              disabled={isPending || isApproving}
            />
          </div>

          {/* 目标链 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">目标链</label>
            <select
              value={targetChainId}
              onChange={(e) => setTargetChainId(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              disabled={isPending || isApproving}
            >
              <option value={CHAIN_IDS.sepolia}>{CHAIN_NAMES[CHAIN_IDS.sepolia]}</option>
              <option value={CHAIN_IDS.bscTestnet}>{CHAIN_NAMES[CHAIN_IDS.bscTestnet]}</option>
            </select>
            {isCrossChain && (
              <p className="mt-2 text-xs text-amber-400">
                ⚠️ 跨链打赏需要额外支付 ~0.01 ETH Gas 费
              </p>
            )}
          </div>

          {/* 留言 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">留言（可选）</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="感谢你的开源贡献！"
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
              disabled={isPending || isApproving}
            />
            <p className="mt-1 text-xs text-zinc-500 text-right">
              {message.length}/200
            </p>
          </div>

          {/* 费用预览 */}
          {amount && parseFloat(amount) > 0 && (
            <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>打赏金额</span>
                <span>{fees.total} USDC</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>平台费用 (1%)</span>
                <span>-{fees.platformFee} USDC</span>
              </div>
              {isCrossChain && (
                <div className="flex justify-between text-zinc-400">
                  <span>跨链 Gas 费</span>
                  <span>~0.01 ETH</span>
                </div>
              )}
              <div className="border-t border-zinc-700 pt-2 flex justify-between text-white font-bold">
                <span>实际到账</span>
                <span>{fees.netAmount} USDC</span>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-2">
            {needsApproval() ? (
              <button
                onClick={handleApprove}
                disabled={!isFormValid() || isApproving || isPending}
                className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-lg transition-colors"
              >
                {isApproving ? '授权中...' : '1. 授权 USDC'}
              </button>
            ) : (
              <button
                onClick={handleTip}
                disabled={!isFormValid() || isPending}
                className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-lg transition-colors"
              >
                {isPending ? (isCrossChain ? '跨链打赏中...' : '打赏中...') : `${isCrossChain ? '跨链' : ''}打赏 ${amount || '0'} USDC`}
              </button>
            )}
          </div>

          {/* 提示信息 */}
          {!address && (
            <p className="text-center text-sm text-zinc-500">
              请先连接钱包
            </p>
          )}
        </div>
      )}
    </div>
  );
}
