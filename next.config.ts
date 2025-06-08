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
  },

  // Add @svgr/webpack to the webpack config
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

export default nextConfig;
