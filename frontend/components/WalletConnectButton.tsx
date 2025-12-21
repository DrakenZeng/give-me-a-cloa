"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useConnection, useBalance, useDisconnect, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { Copy, LogOut, Wallet } from 'lucide-react';
import { CHAIN_NAMES } from '../contracts/config';

interface WalletConnectButtonProps {
  className?: string;
}

const truncateAddress = (value?: string) => {
  if (!value) return '';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const formatBalance = (value?: string) => {
  if (!value) return '0';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  if (num === 0) return '0';
  if (num < 0.0001) {
    return '<0.0001';
  }
  if (num < 1) {
    return num.toFixed(4).replace(/\.?0+$/, '');
  }
  return num.toFixed(3).replace(/\.?0+$/, '');
};

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ className }) => {
  const { address, isConnected } = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balance, isFetching: balanceFetching } = useBalance({
    address,
    chainId,
    query: { enabled: Boolean(address) },
  });

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDetailsOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        setIsDetailsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isDetailsOpen]);

  useEffect(() => {
    if (!isConnected) {
      setIsDetailsOpen(false);
    }
  }, [isConnected]);

  const balanceText = useMemo(() => {
    if (balanceFetching) return '加载中...';
    if (!balance) return '0';
    const formatted = formatUnits(balance.value, balance.decimals);
    return `${formatBalance(formatted)} ${balance.symbol}`;
  }, [balanceFetching, balance]);

  const chainName = useMemo(() => {
    return CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] || `Chain ${chainId}`;
  }, [chainId]);

  const copyAddress = () => {
    if (!address) return;
    void navigator.clipboard.writeText(address);
  };

  return (
    <div className={`relative ${className ?? ''}`} ref={detailsRef}>
      <ConnectKitButton.Custom>
        {({ isConnected: kitConnected, isConnecting, show, truncatedAddress }) => {
          const connected = isConnected && kitConnected;
          return (
            <button
              onClick={() => {
                if (!connected) {
                  show?.();
                } else {
                  setIsDetailsOpen((prev) => !prev);
                }
              }}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm transition-colors border border-white/10"
            >
              <Wallet size={16} />
              {connected
                ? truncatedAddress ?? truncateAddress(address)
                : isConnecting
                  ? '连接中...'
                  : '连接钱包'}
            </button>
          );
        }}
      </ConnectKitButton.Custom>

      {isConnected && isDetailsOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl p-4 text-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">当前地址</div>
            <button
              onClick={copyAddress}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
            >
              <Copy size={12} />
              复制
            </button>
          </div>
          <div className="font-mono text-white text-base break-all mb-4">
            {address}
          </div>

          <div className="bg-white/5 rounded-xl px-3 py-2 mb-4 border border-white/5">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{chainName} 余额</div>
            <div className="text-lg text-white font-semibold">{balanceText}</div>
          </div>

          <button
            onClick={() => {
              disconnect();
              setIsDetailsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-xl py-2 text-sm transition-colors"
          >
            <LogOut size={16} />
            断开连接
          </button>
        </div>
      )}
    </div>
  );
};
