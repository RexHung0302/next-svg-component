import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Add @svgr/webpack to the webpack config
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  }
};

export default nextConfig;
