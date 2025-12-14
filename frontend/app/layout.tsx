import React from 'react';
import { Navbar } from '../components/Navbar';
import { Providers } from '../components/Providers';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Give Me A Cola - Omnichain Support Platform',
  description: 'An omnichain donation platform for developers and creators, powered by ZetaChain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-black min-h-screen text-white selection:bg-red-500 selection:text-white font-sans overflow-x-hidden">
        <Providers>
          <Navbar />
          <main className="w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
