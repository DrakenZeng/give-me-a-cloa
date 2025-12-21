import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  reactStrictMode: true,
  turbopack: {},
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
