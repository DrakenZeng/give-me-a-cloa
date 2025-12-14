"use client";

import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { Project } from '../types';
import { styles } from '../constants';

interface VendingMachineProps {
  project: Project;
  onBuy?: () => void;
}

export const VendingMachine: React.FC<VendingMachineProps> = ({ project, onBuy }) => {
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dispensed, setDispensed] = useState(false);

  const handleBuy = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setDispensed(true);
      if (onBuy) onBuy();
      setTimeout(() => setDispensed(false), 3000); // Reset animation
    }, 2000);
  };

  return (
    <div className={`${styles.vendingMachine} w-full max-w-sm mx-auto border-4 border-zinc-800 bg-zinc-950`}>
      {/* 顶部招牌 */}
      <div className="bg-red-600 text-white text-center py-2 rounded-t-lg font-bold tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.6)] mb-6 animate-pulse-slow">
        GIVE ME A COLA
      </div>

      {/* 玻璃展示柜 */}
      <div className="bg-blue-900/20 border border-white/10 rounded-xl p-4 mb-6 relative overflow-hidden inner-shadow h-48 flex items-end justify-center gap-2">
         {/* 玻璃反光 */}
         <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"></div>
         
         {/* 商品展示: 可乐罐 */}
         <div className="flex justify-around w-full items-end pb-2">
            {['BTC', 'ETH', 'ZETA'].map((token) => (
                <div key={token} 
                     onClick={() => setSelectedToken(token)}
                     className={`cursor-pointer transition-all duration-300 transform hover:scale-110 flex flex-col items-center gap-2 ${selectedToken === token ? 'scale-110 grayscale-0' : 'grayscale opacity-50'}`}>
                    <div className={`w-12 h-20 rounded-lg bg-gradient-to-b ${token === 'BTC' ? 'from-orange-400 to-orange-600' : token === 'ETH' ? 'from-indigo-400 to-indigo-600' : 'from-emerald-400 to-emerald-600'} flex items-center justify-center shadow-lg relative`}>
                        {/* 罐子高光 */}
                        <div className="absolute top-2 left-1 w-1 h-16 bg-white/20 rounded-full"></div>
                        <span className="text-[10px] font-black text-white/90 -rotate-90 tracking-widest">{token}</span>
                    </div>
                    <div className="text-[10px] bg-black/50 px-2 rounded text-zinc-300 font-mono border border-zinc-700">
                        {token === 'BTC' ? '0.001' : token === 'ETH' ? '0.01' : '10'}
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* 操作面板 */}
      <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700/50">
         <div className="flex justify-between items-center mb-4">
            <div className="text-green-500 font-mono text-xs bg-black px-3 py-1 rounded border border-green-900/50 animate-pulse">
               READY: {selectedToken}
            </div>
            <div className="text-zinc-500 text-xs font-mono">
               Gas: Paid by Zeta
            </div>
         </div>

         {/* 投币/购买按钮 */}
         <button 
           onClick={handleBuy}
           disabled={isProcessing}
           className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
             ${isProcessing 
               ? 'bg-zinc-600 cursor-not-allowed' 
               : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-900/20'}`}
         >
           {isProcessing ? (
             <>
               <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
               Processing...
             </>
           ) : (
             <>
               <Coins size={18} />
               投币 (Buy Cola)
             </>
           )}
         </button>
      </div>

      {/* 出货口 */}
      <div className="mt-6 h-16 bg-black rounded-lg border-t-4 border-zinc-700 relative flex items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900 z-10"></div>
         {/* 出货动画 */}
         <div className={`absolute z-20 transition-all duration-500 ${dispensed ? 'translate-y-0 opacity-100 rotate-12' : 'translate-y-20 opacity-0'}`}>
             <div className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🥤</div>
         </div>
      </div>
      
      {dispensed && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="text-emerald-400 font-bold text-xl animate-bounce bg-black/80 px-4 py-2 rounded-lg border border-emerald-500/50">
                  Thanks for support!
              </div>
          </div>
      )}
    </div>
  );
};
