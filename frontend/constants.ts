import { Project } from './types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    title: "ZetaScan Pro",
    author: "0xDev...88",
    category: "Tooling",
    desc: "一个专注于跨链交易追踪的开源浏览器，帮助开发者更直观地调试 Omnichain 合约。",
    likes: 128,
    cokes: 450,
    tags: ["Explorer", "Open Source"],
    content: "ZetaScan Pro 解决了现有浏览器在跨链消息追踪上的痛点...",
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: 2,
    title: "Pixel RPG Assets",
    author: "Art4Game",
    category: "Design",
    desc: "免费可商用的像素游戏素材包，包含 500+ 角色动作与场景贴图。",
    likes: 856,
    cokes: 1200,
    tags: ["GameDev", "CC0"],
    content: "这是一套为独立游戏开发者准备的像素美术资源...",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: 3,
    title: "Rust Learning Path",
    author: "Rustacean",
    category: "Education",
    desc: "从零开始学习 Rust 语言的互动式教程，专为 Web3 开发者设计。",
    likes: 2300,
    cokes: 5600,
    tags: ["Education", "Rust"],
    content: "本教程旨在降低 Rust 语言的学习门槛...",
    color: "from-orange-500 to-red-500"
  },
  {
    id: 4,
    title: "Omni-DAO Template",
    author: "DAO_Wizard",
    category: "Smart Contract",
    desc: "一行代码部署跨链 DAO 治理合约，支持多链投票。",
    likes: 445,
    cokes: 890,
    tags: ["DAO", "Solidity"],
    content: "传统的 DAO 治理受限于单一网络，Omni-DAO 改变了这一点...",
    color: "from-emerald-500 to-teal-500"
  }
];

export const styles = {
  gradientOrb: "absolute rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse-slow",
  glassCard: "bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xl group cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10",
  heading: "font-bold tracking-tighter text-white",
};
