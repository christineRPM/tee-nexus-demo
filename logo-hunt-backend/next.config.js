/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude hardhat config from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Ignore hardhat config files
    config.module.rules.push({
      test: /hardhat\.config\.ts$/,
      use: 'ignore-loader',
    });
    
    return config;
  },
  // Exclude hardhat files from the build
  experimental: {
    excludeDefaultMomentLocales: false,
  },
};

module.exports = nextConfig;
