import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize Turbopack configuration
  turbopack: {
    root: process.cwd(),
  },
  
  // Transpile local packages
  transpilePackages: ['@graphdb/model-builder'],
  
  // Experimental optimizations
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-select',
      'lucide-react',
    ],
  },
  
  // Reduce memory usage during build
  typescript: {
    // Type checking is already done by tsconfig, skip during build
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
