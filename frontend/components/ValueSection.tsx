"use client";

import React from 'react';
import Link from 'next/link';
import { styles } from '../constants';

interface ValueSectionProps {
  onNavigate?: (page: 'landing' | 'explore' | 'detail') => void;
}

export const ValueSection: React.FC<ValueSectionProps> = ({ onNavigate }) => {
  return (
    <section id="why" className="relative h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden snap-start">
      {/* 底部红色光晕，呼应 Cola 主题 */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-red-900/10 to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            给开发者一点<span className="text-red-500 italic">鼓励</span>
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light">
            让开源不再是用爱发电，用最无摩擦的方式完成支持。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 小额友好 */}
          <div className={`${styles.glassCard} cursor-default hover:-translate-y-0`}>
            <div className="mb-6 p-3 bg-zinc-800 rounded-lg w-fit">
               <span className="text-2xl">🪙</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">小额友好</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              许多平台因为高昂的 Gas 费，让 $1 - $5 的打赏变得毫无意义。
              我们优化了路由，让哪怕是<b>“一口可乐”</b>的心意也能完整送达。
            </p>
          </div>

          {/* Card 2: 轻松随意 */}
          <div className={`${styles.glassCard} cursor-default hover:-translate-y-0`}>
            <div className="mb-6 p-3 bg-zinc-800 rounded-lg w-fit">
               <span className="text-2xl">🎮</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">轻松随意</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              不需要正式的订阅，不需要复杂的承诺。
              这只是一次随手的支持，就像路过看到喜欢的街头艺人，投下一枚硬币。
            </p>
          </div>

          {/* Card 3: 开发者优先 */}
          <div className={`${styles.glassCard} cursor-default hover:-translate-y-0`}>
            <div className="mb-6 p-3 bg-zinc-800 rounded-lg w-fit">
               <span className="text-2xl">❤️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">开源精神</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              无论是写文档、修复 Bug 还是维护库。
              这里的每一笔打赏，都是对开源贡献者的一份<b>Respect</b>。
            </p>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center">
          <p className="text-zinc-500 text-sm mb-6 font-mono">Ready to support?</p>
          <Link 
             href="/explore"
             onClick={(e) => {
               if (onNavigate) {
                 e.preventDefault();
                 onNavigate('explore');
               }
             }}
             className="px-10 py-4 bg-zinc-100 text-black font-bold text-lg rounded-full hover:scale-105 hover:bg-white transition-all duration-300 shadow-2xl">
            开始探索项目
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="absolute bottom-0 w-full py-6 border-t border-white/5 text-center">
         <p className="text-zinc-700 text-xs font-mono">
           © 2024 Give Me a Cola. Built on ZetaChain.
         </p>
      </footer>
    </section>
  );
};