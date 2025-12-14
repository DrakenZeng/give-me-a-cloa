import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { VendingMachine } from '../../../components/VendingMachine';
import { MOCK_PROJECTS } from '../../../constants';

export async function generateStaticParams() {
  return MOCK_PROJECTS.map((project) => ({
    id: project.id.toString(),
  }));
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = MOCK_PROJECTS.find(p => p.id === parseInt(id));

  if (!project) {
    return <div className="min-h-screen pt-24 text-center">Project not found</div>;
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-12 bg-black">
      {/* Background Ambience */}
      <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-zinc-900/20 to-transparent pointer-events-none`}></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <Link href="/explore" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors inline-flex">
           <ChevronLeft size={20} /> 返回探索
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* 左侧：内容区域 */}
          <div className="lg:col-span-7">
             <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${project.color} flex items-center justify-center text-white font-bold text-3xl shadow-lg`}>
                    {project.title.charAt(0)}
                </div>
                <div>
                   <h1 className="text-4xl font-bold text-white mb-1">{project.title}</h1>
                   <div className="flex items-center gap-3 text-zinc-400 text-sm">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">@{project.author}</span>
                      <span>·</span>
                      <span>Created 2 days ago</span>
                   </div>
                </div>
             </div>

             <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-8 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">关于项目</h2>
                <p className="text-zinc-400 leading-relaxed mb-6">
                   {project.desc}
                   <br/><br/>
                   {project.content}
                   <br/><br/>
                   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <div className="flex flex-wrap gap-2">
                   {project.tags.map(tag => (
                      <span key={tag} className="text-xs text-emerald-500 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900/30">#{tag}</span>
                   ))}
                </div>
             </div>
             
             {/* 社交证明 */}
             <div className="flex gap-8 border-t border-white/5 pt-6">
                <div className="text-center">
                   <div className="text-2xl font-bold text-white">{project.likes}</div>
                   <div className="text-xs text-zinc-500 uppercase tracking-wider">Stars</div>
                </div>
                <div className="text-center">
                   <div className="text-2xl font-bold text-red-500">{project.cokes}</div>
                   <div className="text-xs text-zinc-500 uppercase tracking-wider">Colas Received</div>
                </div>
             </div>
          </div>

          {/* 右侧：自动贩卖机 (Sticky) */}
          <div className="lg:col-span-5 relative">
             <div className="lg:sticky lg:top-28">
                <VendingMachine project={project} />
                <p className="text-center text-zinc-600 text-xs mt-4">
                   *所有打赏直接通过 ZetaChain 路由至作者钱包，无平台抽成。
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
