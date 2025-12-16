'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';
import { styles, MOCK_PROJECTS } from '../../constants';
import { TipModal } from '../../components/TipModal';

export default function ExplorePage() {
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<typeof MOCK_PROJECTS[0] | null>(null);

  const handleTipClick = (project: typeof MOCK_PROJECTS[0], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProject(project);
    setShowTipModal(true);
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">发现优秀的开源项目</h2>
            <p className="text-zinc-400">为你喜欢的项目加点"气"。</p>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="搜索项目、开发者..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-12 pr-6 text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_PROJECTS.map((project) => (
            <div
              key={project.id}
              className={`${styles.glassCard} cursor-pointer`}
            >
              <div className="flex justify-between items-start mb-4">
                 <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${project.color} flex items-center justify-center text-white font-bold text-xl`}>
                    {project.title.charAt(0)}
                 </div>
                 <div className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-md border border-zinc-700">
                    {project.category}
                 </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">{project.title}</h3>
              <p className="text-zinc-400 text-sm mb-6 line-clamp-2">{project.desc}</p>

              <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-white/5 pt-4 mb-4">
                 <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-[10px]">👤</span>
                    {project.author}
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-red-400"><span className="text-xs">🥤</span> {project.cokes}</span>
                 </div>
              </div>

              {/* Tip Button */}
              <button
                onClick={(e) => handleTipClick(project, e)}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>🥤</span>
                请喝可乐
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full">
            <button
              onClick={() => setShowTipModal(false)}
              className="absolute -top-12 right-0 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
              <span className="ml-2 text-sm">返回</span>
            </button>

            <TipModal />

            <div className="mt-4 text-center text-sm text-zinc-500">
              打赏给 <span className="text-white font-bold">{selectedProject.author}</span> 的 <span className="text-white font-bold">{selectedProject.title}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
