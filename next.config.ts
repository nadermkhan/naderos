import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/naderos',
  assetPrefix: '/naderos',
  transpilePackages: ['onesignal'],
};

export default nextConfig;