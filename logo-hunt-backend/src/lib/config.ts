// Configuration for Logo Hunt Backend
export const config = {
  // Backend wallet
  privateKey: process.env.PRIVATE_KEY!,
  
  // Contract addresses
  contracts: {
    sepolia: process.env.SEPOLIA_CONTRACT_ADDRESS!,
    arbitrumSepolia: process.env.ARBITRUM_SEPOLIA_CONTRACT_ADDRESS!,
  },
  
  // Chain configuration
  chains: {
    sepolia: {
      chainId: parseInt(process.env.SEPOLIA_CHAIN_ID || '11155111'),
      name: 'sepolia',
      rpc: process.env.SEPOLIA_RPC_URL!,
      contractAddress: process.env.SEPOLIA_CONTRACT_ADDRESS!,
      ismAddress: process.env.SEPOLIA_ISM_ADDRESS!,
    },
    arbitrumSepolia: {
      chainId: parseInt(process.env.ARBITRUM_SEPOLIA_CHAIN_ID || '421614'),
      name: 'arbitrumsepolia',
      rpc: process.env.ARBITRUM_SEPOLIA_RPC_URL!,
      contractAddress: process.env.ARBITRUM_SEPOLIA_CONTRACT_ADDRESS!,
      ismAddress: process.env.ARBITRUM_SEPOLIA_ISM_ADDRESS!,
    },
  },
  
  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  
  // Validation
  validate: () => {
    const required = [
      'PRIVATE_KEY',
      'SEPOLIA_CONTRACT_ADDRESS',
      'ARBITRUM_SEPOLIA_CONTRACT_ADDRESS',
      'SEPOLIA_RPC_URL',
      'ARBITRUM_SEPOLIA_RPC_URL',
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  },
};

// Validate configuration on import
config.validate(); 