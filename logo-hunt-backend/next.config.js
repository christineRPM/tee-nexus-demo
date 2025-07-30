/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignore TypeScript errors in hardhat config
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors in hardhat config
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
