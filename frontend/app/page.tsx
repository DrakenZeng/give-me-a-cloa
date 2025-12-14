import React from 'react';
import Link from 'next/link';
import { Terminal, Code } from 'lucide-react';
import { ZetaSection } from '../components/ZetaSection';
import { ValueSection } from '../components/ValueSection';
import { styles } from '../constants';

export default function LandingPage() {
  return (
    <div className="w-full snap-y snap-mandatory h-screen overflow-y-scroll scroll-smooth">
      {/* 1. Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden snap-start bg-black">
        <div className="absolute inset-0 bg-black z-0">
          <div className={`${styles.gradientOrb} bg-emerald-900 w-[500px] h-[500px] top-[-100px] left-[-100px] opacity-20`}></div>
          <div className={`${styles.gradientOrb} bg-red-900 w-[600px] h-[600px] bottom-[-200px] right-[-100px] animation-delay-2000 opacity-20`}></div>
          <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-8 hover:border-zinc-600 transition-colors cursor-default">
            <Terminal size={12} className="text-emerald-500" />
            <span>面向开发者 & 创作者的全链打赏平台</span>
          </div>

          <h1 className={`text-5xl md:text-8xl mb-8 ${styles.heading} leading-tight`}>
            给我一瓶<span className="text-red-500 font-serif italic pr-2">可乐</span> <br/>
            <span className="text-3xl md:text-5xl font-normal text-zinc-400 block mt-4">
               就能让我继续为开源努力。
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            小额友好 · 轻松随意 · 无摩擦全链支持 <br/>
            <span className="text-zinc-600 text-sm mt-2 block">基于 ZetaChain，无论粉丝持有 BTC 还是 ETH，都能一键请客。</span>
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link 
              href="/explore"
              className="px-8 py-4 bg-white text-black text-lg font-bold rounded-full hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2">
              <span className="text-xl">🥤</span>
              请我喝可乐 (Explore)
            </Link>
            <button className="px-8 py-4 bg-transparent border border-white/10 text-zinc-300 text-lg font-bold rounded-full hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <Code size={20} />
              我是开发者
            </button>
          </div>
        </div>
        
        {/* Scroll Hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-zinc-700">
           <span className="text-[10px] tracking-[0.3em] uppercase font-mono">Scroll for Tech</span>
        </div>
      </section>

      {/* 2. Zeta Section */}
      <ZetaSection />

      {/* 3. Value Section */}
      <ValueSection />
    </div>
  );
}
