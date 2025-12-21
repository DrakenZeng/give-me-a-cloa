"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { WalletConnectButton } from './WalletConnectButton';

interface NavbarProps {
  onNavigate?: (page: 'landing' | 'explore' | 'detail') => void;
  currentPage?: 'landing' | 'explore' | 'detail';
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Attempt to get pathname, defaulting safely if used outside Next.js context (e.g., in App.tsx)
  let pathname: string | null = null;
  try {
    pathname = usePathname();
  } catch (e) {
    // ignore
  }

  const getLinkClass = (path: string) => {
    if (onNavigate && currentPage) {
       const pageMap: Record<string, string> = { '/': 'landing', '/explore': 'explore' };
       return currentPage === pageMap[path] ? 'text-white' : 'hover:text-white transition-colors';
    }
    return (pathname || '/') === path ? 'text-white' : 'hover:text-white transition-colors';
  };

  const handleNavClick = (e: React.MouseEvent, page: 'landing' | 'explore') => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(page);
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md py-4 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link href="/" onClick={(e) => handleNavClick(e, 'landing')} className="flex items-center gap-3 cursor-pointer">
          <div className="relative w-8 h-8 flex items-center justify-center">
             <span className="absolute inset-0 bg-red-600 rounded-full blur opacity-20 animate-pulse"></span>
             <span className="text-2xl relative z-10">🥤</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-mono">
            GiveMeA<span className="text-red-500">Cola</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="/" onClick={(e) => handleNavClick(e, 'landing')} className={getLinkClass('/')}>首页</Link>
          <Link href="/explore" onClick={(e) => handleNavClick(e, 'explore')} className={getLinkClass('/explore')}>探索项目</Link>
          <WalletConnectButton />
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-black border-b border-white/10 p-6 flex flex-col gap-4 md:hidden animate-fade-in-down">
           <Link href="/" onClick={(e) => handleNavClick(e, 'landing')} className="text-left text-zinc-400 hover:text-white mb-4">首页</Link>
           <Link href="/explore" onClick={(e) => handleNavClick(e, 'explore')} className="text-left text-zinc-400 hover:text-white">探索项目</Link>
           <div className="mt-2">
             <WalletConnectButton className="w-full" />
           </div>
        </div>
      )}
    </nav>
  );
};
