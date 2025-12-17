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
      return <div className="min-h-screen pt-24 text-center bg-zinc-950 text-white">Project not found</div>;
   }

   return (
      <div className="min-h-screen pt-24 px-6 pb-12 bg-zinc-950 relative overflow-hidden">
         {/* Dynamic Ambient Background based on Project Color */}
         <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Main ambient glow */}
            <div className={`absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br ${project.color} rounded-full blur-[150px] opacity-20 mix-blend-screen animate-pulse-slow`}></div>
            <div className={`absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr ${project.color} rounded-full blur-[180px] opacity-10 mix-blend-screen`}></div>
            {/* Noise overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
         </div>

         <div className="max-w-6xl mx-auto relative z-10">
            <Link href="/explore" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors inline-flex group">
               <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 返回探索
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               {/* Left: Content */}
               <div className="lg:col-span-7">
                  <div className="flex items-center gap-6 mb-8">
                     <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${project.color} flex items-center justify-center text-white font-bold text-4xl shadow-2xl ring-4 ring-white/5`}>
                        {project.title.charAt(0)}
                     </div>
                     <div>
                        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">{project.title}</h1>
                        <div className="flex items-center gap-3 text-zinc-400 text-sm">
                           <span className="bg-zinc-900/50 border border-white/10 px-3 py-1 rounded-full text-zinc-300">@{project.author}</span>
                           <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                           <span>Created 2 days ago</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-8 shadow-xl">
                     <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        关于项目 <div className="h-px bg-white/10 flex-1 ml-4"></div>
                     </h2>
                     <p className="text-zinc-300 leading-relaxed mb-8 text-lg font-light">
                        {project.desc}
                     </p>
                     <div className="prose prose-invert max-w-none mb-8 text-zinc-400">
                        <p>{project.content}</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</p>
                     </div>

                     <div className="flex flex-wrap gap-2">
                        {project.tags.map(tag => (
                           <span key={tag} className="text-xs text-white/80 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors">#{tag}</span>
                        ))}
                     </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-12 border-t border-white/5 pt-8">
                     <div>
                        <div className="text-3xl font-bold text-white mb-1">{project.likes}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Stars</div>
                     </div>
                     <div>
                        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">{project.cokes}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Colas Received</div>
                     </div>
                  </div>
               </div>

               {/* Right: Vending Machine */}
               <div className="lg:col-span-5 relative">
                  <div className="lg:sticky lg:top-32">
                     <VendingMachine project={project} />
                     <p className="text-center text-zinc-600 text-xs mt-6">
                        *Powered by ZetaChain Universal EVM
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}