import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/naderos',
  assetPrefix: '/naderos',
  transpilePackages: ['onesignal'],
  // Remove any headers, rewrites, or redirects as they don't work with static export
};

export default nextConfig;