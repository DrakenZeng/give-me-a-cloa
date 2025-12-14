import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Environment variables
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  // Optimize for production
  reactStrictMode: true,
  // Turbopack configuration (empty object to silence warning)
  turbopack: {},
  // Webpack compatibility (for libraries that need it)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
