import React from 'react';
import { Globe, ShieldCheck, Zap } from 'lucide-react';

export const ZetaSection: React.FC = () => {
   return (
      <section id="about" className="relative h-screen w-full flex items-center justify-center bg-zinc-950 overflow-hidden snap-start border-t border-white/5">
         {/* 极简网格背景 */}
         <div className="absolute inset-0 z-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
         </div>

         <div className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

            <div className="order-2 md:order-1 relative">
               {/* 技术可视化：更抽象的链 */}
               <div className="relative border border-zinc-800 bg-zinc-900/50 p-8 rounded-3xl backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-12 opacity-50">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                     </div>
                     <div className="font-mono text-xs text-zinc-500">chain_interop.js</div>
                  </div>

                  {/* 模拟全链交易路径 */}
                  <div className="space-y-6 relative">
                     <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-zinc-800"></div>

                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#F7931A]/20 flex items-center justify-center border border-[#F7931A]/30 z-10 bg-black">
                           <span className="text-[#F7931A] font-bold text-xs">BTC</span>
                        </div>
                        <div className="text-zinc-400 text-sm font-mono">User sends BTC...</div>
                     </div>

                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 z-10 bg-black animate-pulse">
                           <Globe size={18} className="text-emerald-500" />
                        </div>
                        <div className="text-emerald-400 text-sm font-mono bg-emerald-900/20 px-3 py-1 rounded">
                           ZetaChain processing (Gas optimized)
                        </div>
                     </div>

                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 z-10 bg-black">
                           <span className="text-red-500 text-lg">🥤</span>
                        </div>
                        <div className="text-white text-sm font-mono">Dev receives Cola!</div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="order-1 md:order-2 text-left">
               <h2 className="text-emerald-500 font-mono text-sm tracking-widest mb-4 uppercase">Powered by ZetaChain</h2>
               <h3 className={`text-4xl md:text-5xl mb-6 text-white font-bold leading-tight`}>
                  打通全链资产<br />
                  <span className="text-zinc-500">只为那一刻的“爽”</span>
               </h3>
               <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                  我们利用 ZetaChain 的全链智能合约，消除了跨链的复杂性。
                  <br /><br />
                  对粉丝来说，就像发送一条消息一样简单。没有复杂的 Bridge，没有高昂的 Gas 惊吓。这才是 Web3 该有的样子。
               </p>

               <div className="grid grid-cols-2 gap-6">
                  <div>
                     <h4 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-500" /> 无需包装
                     </h4>
                     <p className="text-zinc-500 text-sm">原生资产直达，安全无忧。</p>
                  </div>
                  <div>
                     <h4 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                        <Zap size={18} className="text-emerald-500" /> 秒级确认
                     </h4>
                     <p className="text-zinc-500 text-sm">这就是 Omnichain 的速度。</p>
                  </div>
               </div>
            </div>

         </div>
      </section>
   );
};
