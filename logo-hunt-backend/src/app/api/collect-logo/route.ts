import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import 'dotenv/config';

const CHAIN_CONFIG = {
  sepolia: {
    chainId: 11155111,
    name: "sepolia",
    rpc: "https://eth-sepolia.g.alchemy.com/v2/fl94lXT-IxAhUmbp5fOua",
    contractAddress: process.env.SEPOLIA_CONTRACT_ADDRESS!,
  },
  arbitrumSepolia: {
    chainId: 421614,
    name: "arbitrumsepolia",
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    contractAddress: process.env.ARBITRUM_SEPOLIA_CONTRACT_ADDRESS!,
  },
};

function getSigner(rpc: string) {
  // Use server-side provider without network detection
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  return wallet;
}

// Alternative approach for server-side
function createProvider(rpc: string) {
  return new ethers.providers.JsonRpcProvider(rpc);
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Collect Logo API Called ===');
    
    const body = await request.json();
    const { userWallet, chain = 'sepolia' } = body;

    // Validate input
    if (!userWallet) {
      return NextResponse.json(
        { error: 'User wallet address is required' },
        { status: 400 }
      );
    }

    if (!ethers.utils.isAddress(userWallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address provided' },
        { status: 400 }
      );
    }

    if (chain !== 'sepolia' && chain !== 'arbitrumSepolia') {
      return NextResponse.json(
        { error: 'Invalid chain. Available: sepolia, arbitrumSepolia' },
        { status: 400 }
      );
    }

    try {
      console.log('Setting up blockchain connection...');
      
      // Get chain configuration
      const cfg = CHAIN_CONFIG[chain as keyof typeof CHAIN_CONFIG];
      const remoteChain = chain === 'sepolia' ? 'arbitrumSepolia' : 'sepolia';
      const remoteCfg = CHAIN_CONFIG[remoteChain as keyof typeof CHAIN_CONFIG];
      
      console.log(`🎯 Finding logo on ${chain.toUpperCase()}`);
      console.log(`📍 Contract: ${cfg.name}:${cfg.contractAddress}`);
      console.log(`🌉 Destination: ${remoteCfg.name} (${remoteCfg.chainId})`);

      // Create provider and wallet for server-side
      console.log('Creating provider with RPC:', cfg.rpc);
      const provider = createProvider(cfg.rpc);
      console.log('Provider created successfully');
      
      console.log('Creating wallet...');
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
      console.log('Wallet created successfully');
      
      console.log('Creating contract with address:', cfg.contractAddress);
      const logoHuntGame = new ethers.Contract(
        cfg.contractAddress,
        [
          "function findLogo(uint32 _destinationDomain, address _userWallet) external payable",
          "function quoteDispatch(uint32 _destinationDomain, bytes calldata _message) external view returns (uint256)",
          "function logosFound() external view returns (uint256)",
          "function personalCollection(address _user) external view returns (uint256)"
        ],
        wallet
      );
      console.log('Contract created successfully');

      // Check current logo count before finding
      const logosFoundBefore = await logoHuntGame.logosFound();
      console.log(`📊 Current logos found on ${cfg.name}: ${logosFoundBefore}`);

      // Check current personal collection
      const personalCollection = await logoHuntGame.personalCollection(userWallet);
      console.log(`👤 Personal collection on ${cfg.name}: ${personalCollection} logos`);

      // Prepare discovery data for quoteDispatch
      const discoveryData = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [userWallet, logosFoundBefore.add(1), personalCollection.add(1)]
      );

      console.log(`🔍 Discovery data: ${discoveryData}`);
      console.log(`👤 User address: ${userWallet}`);
      console.log(`🎯 Expected new total count: ${logosFoundBefore.add(1)}`);
      console.log(`🎯 Expected new personal count: ${personalCollection.add(1)}`);

      // Get quote for dispatching the discovery
      let quote;
      try {
        quote = await logoHuntGame.quoteDispatch(remoteCfg.chainId, discoveryData);
        console.log(`💰 Quote for dispatching logo discovery: ${ethers.utils.formatEther(quote)} ETH`);
      } catch (error) {
        console.error('❌ Error getting quote:', error);
        throw error;
      }

      // Find the logo with the quoted amount of Ether
      console.log(`🚀 Calling findLogo() on ${chain}...`);
      const tx = await logoHuntGame.findLogo(remoteCfg.chainId, userWallet, { value: quote });
      await tx.wait();
      console.log(`✅ findLogo transaction confirmed on ${cfg.name}`);

      // Check the updated logo count
      const logosFoundAfter = await logoHuntGame.logosFound();
      console.log(`📈 Updated logos found on ${cfg.name}: ${logosFoundAfter}`);

      const result = {
        success: true,
        userWallet,
        chain,
        message: 'Logo collection successful',
        totalLogos: logosFoundAfter.toString(),
        personalCollection: personalCollection.add(1).toString(),
        quote: ethers.utils.formatEther(quote),
        transactionHash: tx.hash
      };

      console.log('Success:', result);
      return NextResponse.json(result);

    } catch (error) {
      console.error('Blockchain transaction failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Blockchain transaction failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          userWallet,
          chain
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error collecting logo:', error);
    return NextResponse.json(
      { 
        error: 'Failed to collect logo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 