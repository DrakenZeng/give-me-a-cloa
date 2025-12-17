import Link from 'next/link';
import { Search, Sparkles, Filter, ArrowUpRight } from 'lucide-react';
import { styles, MOCK_PROJECTS } from '../../constants';

const CATEGORIES = ["全部", "工具", "DeFi", "设计", "教育", "NFT", "DAO"];

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-zinc-950 relative selection:bg-red-500/30 overflow-hidden font-sans">
      {/* 1. Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>

        {/* Gradient Orbs - Zeta (Green) & Cola (Red) */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 pt-32 px-6 pb-20 max-w-7xl mx-auto">

        {/* 2. Header Section */}
        <div className="flex flex-col gap-10 mb-20">
          {/* Top Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="space-y-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-emerald-400 font-mono shadow-lg backdrop-blur-md">
                <Sparkles size={12} />
                <span className="tracking-wide uppercase">Discover Web3 Gems</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1]">
                发现值得支持的<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-red-400">开源力量</span>
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
                探索基于 ZetaChain 生态构建的优质项目。为你喜欢的开发者投递一瓶“可乐”，让开源精神持续流动。
              </p>
            </div>

            {/* Search Box with Glow Effect */}
            <div className="w-full lg:w-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-red-500/20 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="搜索项目、开发者 ID..."
                  className="w-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-14 pr-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-zinc-950 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Filter size={14} /> 全部项目
            </button>
            {CATEGORIES.slice(1).map(cat => (
              <button key={cat} className="px-6 py-2.5 bg-zinc-900/50 border border-zinc-800 text-zinc-400 rounded-full font-medium text-sm hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all active:scale-95 backdrop-blur-sm">
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_PROJECTS.map((project, index) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className={`${styles.glassCard} group relative overflow-hidden`}
            >
              {/* Card Hover Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${project.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10`}>
                    {project.title.charAt(0)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-zinc-900/50 backdrop-blur text-zinc-400 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-white/5 group-hover:border-white/20 transition-colors">
                      {project.category}
                    </div>
                    <ArrowUpRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
                  {project.title}
                </h3>
                <p className="text-zinc-400 text-sm mb-8 line-clamp-2 leading-relaxed">
                  {project.desc}
                </p>

                <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-white/5 pt-5 group-hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] border border-white/5 ring-1 ring-black">👤</div>
                    <span className="group-hover:text-zinc-300 transition-colors">{project.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/10 group-hover:bg-red-500/20 group-hover:border-red-500/30 transition-all">
                    <span className="text-xs">🥤</span>
                    <span className="text-red-400 font-bold font-mono">{project.cokes}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-20 text-center border-t border-white/5 pt-12">
          <p className="text-zinc-600 text-sm">
            找不到想要的项目？ <a href="#" className="text-emerald-500 hover:underline hover:text-emerald-400 transition-colors">申请收录</a>
          </p>
        </div>
      </div>
    </div>
  );
}