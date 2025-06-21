import type { NextConfig } from "next";

const nextConfig: NextConfig = {
output: 'export',
 // basePath: '/naderos', 
  /* config options here */
    transpilePackages: ['onesignal'],
};

export default nextConfig;
