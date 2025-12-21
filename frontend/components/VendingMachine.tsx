
"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, Settings, Info } from 'lucide-react';
import { Project } from '../types';
import { useDemoEthTip } from '../hooks/useDemoEthTip';

interface VendingMachineProps {
  project: Project;
  onBuy?: () => void;
}

// Token Configuration with Can Styles
const TOKENS = [
  {
    id: 'ETH',
    symbol: 'Ξ',
    name: 'Ethereum',
    color: 'from-slate-800 to-indigo-900',
    textColor: 'text-indigo-200',
    ring: 'ring-indigo-500',
    btnBorder: 'hover:border-indigo-500',
    presets: ['0.001', '0.005', '0.01'],
    flavor: 'ETHER FIZZ',
    canDesign: 'border-t-4 border-indigo-400'
  },
  {
    id: 'SOL',
    symbol: '◎',
    name: 'Solana',
    color: 'from-purple-600 to-fuchsia-600',
    textColor: 'text-fuchsia-100',
    ring: 'ring-fuchsia-500',
    btnBorder: 'hover:border-fuchsia-500',
    presets: ['0.05', '0.1', '0.5'],
    flavor: 'SOL BURST',
    canDesign: 'bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px]'
  },
  {
    id: 'BNB',
    symbol: '❖',
    name: 'BSC',
    color: 'from-yellow-500 to-amber-600',
    textColor: 'text-amber-100',
    ring: 'ring-amber-500',
    btnBorder: 'hover:border-amber-500',
    presets: ['0.01', '0.05', '0.1'],
    flavor: 'BINANCE BREW',
    canDesign: 'border-b-4 border-yellow-300'
  },
  {
    id: 'USDT',
    symbol: 'T',
    name: 'Tether',
    color: 'from-emerald-600 to-teal-700',
    textColor: 'text-emerald-100',
    ring: 'ring-emerald-500',
    btnBorder: 'hover:border-emerald-500',
    presets: ['1', '3', '5'],
    flavor: 'TETHER LIME',
    canDesign: 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:8px_8px]'
  },
  {
    id: 'USDC',
    symbol: 'C',
    name: 'USDC',
    color: 'from-blue-500 to-cyan-600',
    textColor: 'text-cyan-100',
    ring: 'ring-cyan-500',
    btnBorder: 'hover:border-cyan-500',
    presets: ['1', '3', '5'],
    flavor: 'STABLE SODA',
    canDesign: 'border-l-4 border-r-4 border-blue-400'
  },
  {
    id: 'ZETA',
    symbol: 'ζ',
    name: 'ZetaChain',
    color: 'from-green-500 to-emerald-700',
    textColor: 'text-green-100',
    ring: 'ring-green-500',
    btnBorder: 'hover:border-green-500',
    presets: ['1', '5', '10'],
    flavor: 'OMNI ELIXIR',
    canDesign: 'bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.2))] border-t-2 border-green-300'
  },
];

export const VendingMachine: React.FC<VendingMachineProps> = ({ project, onBuy }) => {
  const [selectedTokenId, setSelectedTokenId] = useState('ETH');
  const [amount, setAmount] = useState('0.005');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [status, setStatus] = useState<'idle' | 'inserting' | 'processing' | 'dispensing' | 'completed'>('idle');
  const [lcdMessage, setLcdMessage] = useState('READY');
  const [shake, setShake] = useState(false);

  const selectedToken = TOKENS.find(t => t.id === selectedTokenId) || TOKENS[0];

  const { send, isPending, isConfirming, isSuccess, error, hash, configErrors } = useDemoEthTip();

  // Reset amount to default preset when token changes
  useEffect(() => {
    if (!isCustomAmount) {
      setAmount(selectedToken.presets[1]);
    }
  }, [selectedTokenId]);

  // Status Machine Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (status === 'idle') {
      setLcdMessage(`DEMO: SEPOLIA → BASE`);
    } else if (status === 'inserting') {
      setLcdMessage('INSERTING...');
    } else if (status === 'processing') {
      setLcdMessage('TX PENDING...');
      setShake(true);
      timeout = setTimeout(() => setShake(false), 500);
    } else if (status === 'dispensing') {
      setLcdMessage('DISPENSING...');
    } else if (status === 'completed') {
      setLcdMessage('THANK YOU!');
    }
    return () => clearTimeout(timeout);
  }, [status, selectedToken]);

  useEffect(() => {
    if (error) {
      setStatus('idle');
      setLcdMessage('TX FAILED');
    }
  }, [error]);

  useEffect(() => {
    if (isSuccess) {
      setStatus('completed');
      setLcdMessage('SUCCESS');
      const t = setTimeout(() => setStatus('idle'), 6000);
      return () => clearTimeout(t);
    }
  }, [isSuccess]);

  const handleBuy = () => {
    if (status !== 'idle') return;
    if (selectedTokenId !== 'ETH') {
      setLcdMessage('DEMO: ETH ONLY');
      return;
    }
    if (amount !== '0.005') {
      setAmount('0.005');
      setIsCustomAmount(false);
    }
    if (configErrors.length) {
      setLcdMessage('CONFIG MISSING');
      return;
    }

    setStatus('processing');
    void send().then(() => {
      if (onBuy) onBuy();
    });
  };

  return (
    <div className={`relative w-full max-w-md mx-auto perspective-1000 ${shake ? 'animate-shake' : ''}`}>
      <style jsx>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px) rotate(-1deg); }
            75% { transform: translateX(2px) rotate(1deg); }
        }
        @keyframes coin-drop {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-80px) scale(0.8); }
            100% { transform: translateY(10px) translateX(60px) scale(0.2); opacity: 0; }
        }
        @keyframes can-drop-bounce {
            0% { transform: translateY(-100px); opacity: 0; }
            40% { transform: translateY(0); opacity: 1; }
            60% { transform: translateY(-20px); }
            80% { transform: translateY(0); }
            90% { transform: translateY(-5px); }
            100% { transform: translateY(0); opacity: 1; }
        }
        .animate-shake { animation: shake 0.3s ease-in-out infinite; }
        .animate-coin-drop { animation: coin-drop 1s forwards cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-can-drop { animation: can-drop-bounce 1s forwards ease-out; }
        .lcd-text { font-family: 'Courier New', Courier, monospace; letter-spacing: 0.1em; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>

      {/* Machine Chassis */}
      <div className="bg-zinc-900 rounded-[2rem] p-4 shadow-2xl border border-zinc-800 relative ring-1 ring-white/10 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-t-2xl py-3 px-6 mb-6 shadow-lg border-b-4 border-red-900 flex justify-between items-center relative z-10">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse"></div>
            <div className="w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse delay-75"></div>
          </div>
          <span className="font-black tracking-[0.25em] text-white text-sm drop-shadow-md">OMNICHAIN VENDING</span>
          <div className="w-4 h-4 rounded-full border-2 border-white/20 flex items-center justify-center">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></div>
          </div>
        </div>

        {/* Main Display Window */}
        <div className="relative h-56 bg-[#0a0a0a] rounded-xl border-4 border-zinc-800 mb-6 overflow-hidden group shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
          {/* Glass Reflections */}
          <div className="absolute inset-0 z-20 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.03)_25%,transparent_30%)] pointer-events-none"></div>

          {/* The Shelf */}
          <div className="absolute bottom-0 w-full h-4 bg-zinc-800 z-10 shadow-[0_-5px_10px_rgba(0,0,0,0.5)]"></div>

          {/* The Can (Dynamic Rendering) */}
          <div className={`absolute left-1/2 -translate-x-1/2 bottom-4 transition-all duration-500 z-0
                ${status === 'dispensing' ? 'animate-can-drop' : ''}
                ${status === 'completed' ? 'translate-y-0' : status !== 'dispensing' ? 'translate-y-0' : '-translate-y-full opacity-0'}
            `}>
            <div className={`
                    w-24 h-40 rounded-[1.5rem] bg-gradient-to-br ${selectedToken.color} ${selectedToken.canDesign}
                    shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative flex flex-col items-center justify-between py-4
                    group-hover:scale-105 transition-transform duration-300 border-t border-white/20
                `}>
              {/* Can Top */}
              <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30 rounded-[1.5rem] pointer-events-none"></div>

              {/* Label Area */}
              <div className="relative z-10 text-center">
                <div className={`text-3xl font-black ${selectedToken.textColor} drop-shadow-md`}>
                  {selectedToken.symbol}
                </div>
                <div className="text-[0.6rem] font-bold text-white/80 tracking-widest mt-1 px-2 py-0.5 bg-black/20 rounded">
                  {selectedToken.flavor}
                </div>
              </div>

              {/* Branding */}
              <div className="relative z-10 text-center">
                <div className="text-[0.5rem] text-white/60 uppercase tracking-tight">Pure Crypto</div>
                <div className="text-2xl mt-1">🥤</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-zinc-950/50 rounded-xl p-4 border border-white/5 space-y-5">

          {/* 1. LCD Screen */}
          <div className="bg-[#1c2e26] rounded-lg border-2 border-[#2d4a3e] p-2.5 h-16 flex flex-col justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.2)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none opacity-50 z-10"></div>
            <div className="flex justify-between items-end relative z-0">
              <span className="text-[#34d399] text-xs font-mono lcd-text opacity-70">AMT: 0.005 ETH</span>
              <span className="text-[#34d399] text-[0.6rem] font-mono animate-pulse">
                {isConfirming || isPending ? 'TX PENDING' : 'ONLINE'}
              </span>
            </div>
            <div className="text-[#4ade80] font-bold font-mono text-lg tracking-wider truncate mt-1 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
              {'>'} {lcdMessage}
            </div>
          </div>

          {/* 2. Token Grid */}
          <div className="grid grid-cols-3 gap-2">
            {TOKENS.map(token => (
              <button
                key={token.id}
                onClick={() => {
                  if (status === 'idle') {
                    setSelectedTokenId(token.id);
                    setIsCustomAmount(false);
                  }
                }}
                disabled={status !== 'idle'}
                className={`
                            relative py-2 px-1 rounded-lg border transition-all duration-200 group
                            flex flex-col items-center justify-center gap-1
                            ${selectedTokenId === token.id
                    ? `bg-zinc-800 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]`
                    : `bg-zinc-900 border-zinc-800 ${token.btnBorder} opacity-60 hover:opacity-100`
                  }
                        `}
              >
                {selectedTokenId === token.id && (
                  <div className={`absolute inset-0 rounded-lg ring-1 ${token.ring} opacity-100`}></div>
                )}
                <span className={`text-sm font-bold ${selectedTokenId === token.id ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{token.symbol}</span>
                <span className="text-[0.6rem] font-mono uppercase text-zinc-600">{token.id}</span>
              </button>
            ))}
          </div>

          {configErrors.length > 0 && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              Missing env: {configErrors.join(', ')}
            </div>
          )}

          {hash && (
            <div className="text-[10px] text-zinc-500 font-mono break-all">
              tx: {hash}
            </div>
          )}

          {/* 3. Amounts & Input */}
          <div className="flex flex-col gap-3">
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              {selectedToken.presets.map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setAmount(val);
                    setIsCustomAmount(false);
                  }}
                  disabled={status !== 'idle'}
                  className={`flex-1 py-1.5 rounded-md text-xs font-mono transition-colors ${amount === val && !isCustomAmount ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {val}
                </button>
              ))}
              <button
                onClick={() => {
                  setIsCustomAmount(true);
                  setAmount('');
                }}
                disabled={status !== 'idle'}
                className={`flex-1 py-1.5 rounded-md text-xs font-mono transition-colors ${isCustomAmount ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                CUSTOM
              </button>
            </div>

            {/* Custom Input Display */}
            <div className={`relative transition-all duration-300 overflow-hidden ${isCustomAmount ? 'h-10 opacity-100' : 'h-0 opacity-0'}`}>
              <input
                type="number"
                value={amount}
                placeholder="0.0"
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-right px-3 py-2 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-white/30"
              />
              <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">{selectedToken.id}</span>
            </div>
          </div>

          {/* 4. Action Button & Coin Slot */}
          <div className="flex gap-4 items-stretch h-14">
            <button
              onClick={handleBuy}
              disabled={status !== 'idle' || !amount}
              className={`
                        flex-1 rounded-xl font-black text-sm uppercase tracking-widest transition-all
                        flex items-center justify-center gap-2 shadow-lg relative overflow-hidden group
                        ${status === 'idle'
                  ? `bg-gradient-to-br ${selectedToken.color} text-white hover:brightness-110 active:scale-95`
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}
                    `}
            >
              {status === 'idle' ? (
                <>
                  <span className="relative z-10">PUSH</span>
                  <ChevronRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </>
              ) : (
                <span className="animate-pulse">WAIT</span>
              )}
            </button>

            {/* Coin Slot Visual */}
            <div className="w-12 bg-zinc-400 rounded-lg border-b-4 border-zinc-500 shadow-inner flex items-center justify-center relative overflow-hidden">
              <div className="w-1.5 h-8 bg-zinc-800 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"></div>
              {status === 'inserting' && (
                <div className="absolute w-6 h-6 bg-yellow-400 rounded-full border border-yellow-600 flex items-center justify-center shadow-md animate-coin-drop z-20">
                  <span className="text-[8px] font-bold text-yellow-800">$</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Machine Feet */}
        <div className="absolute -bottom-2 left-8 w-6 h-4 bg-zinc-800 rounded-b-lg -z-10"></div>
        <div className="absolute -bottom-2 right-8 w-6 h-4 bg-zinc-800 rounded-b-lg -z-10"></div>
      </div>
    </div>
  );
};
