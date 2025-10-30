import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore les erreurs ESLint pendant le build en prod
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore les erreurs TypeScript pendant le build en prod
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
