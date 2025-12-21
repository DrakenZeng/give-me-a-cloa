import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Environment variables
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  // Optimize for production
  reactStrictMode: true,
  // Webpack compatibility (for libraries that need it)
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp:
          /^(@metamask\/sdk(\/.*)?|@gemini-wallet\/core(\/.*)?|@base-org\/account(\/.*)?|porto(\/.*)?)$/,
      })
    );

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
