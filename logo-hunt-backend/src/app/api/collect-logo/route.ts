import { NextRequest, NextResponse } from 'next/server';
import Web3 from 'web3';
import 'dotenv/config';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Collect Logo API Called (Web3.js) ===');
    
    const body = await request.json();
    const { userWallet, chain = 'sepolia' } = body;

    // Validate input
    if (!userWallet) {
      return NextResponse.json(
        { error: 'User wallet address is required' },
        { status: 400 }
      );
    }

    if (!Web3.utils.isAddress(userWallet)) {
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
      
      // Get configuration based on chain
      const rpcUrl = chain === 'sepolia' 
        ? process.env.SEPOLIA_RPC_URL! 
        : process.env.ARBITRUM_SEPOLIA_RPC_URL!;
      
      const contractAddress = chain === 'sepolia'
        ? process.env.SEPOLIA_CONTRACT_ADDRESS!
        : process.env.ARBITRUM_SEPOLIA_CONTRACT_ADDRESS!;
      
      const destinationChainId = chain === 'sepolia' ? 421614 : 11155111;
      
      console.log(`🎯 Finding logo on ${chain.toUpperCase()}`);
      console.log(`📍 Contract: ${contractAddress}`);
      console.log(`🌉 Destination chain ID: ${destinationChainId}`);

      // Create Web3 instance
      console.log('Creating Web3 instance...');
      const web3 = new Web3(rpcUrl);
      console.log('Web3 instance created');

      // Create account from private key
      console.log('Creating account...');
      const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY!);
      web3.eth.accounts.wallet.add(account);
      console.log('Account created');

      // Contract ABI
      const contractABI = [
        {
          "inputs": [
            {"internalType": "uint32", "name": "_destinationDomain", "type": "uint32"},
            {"internalType": "address", "name": "_userWallet", "type": "address"}
          ],
          "name": "findLogo",
          "outputs": [],
          "stateMutability": "payable" as const,
          "type": "function"
        },
        {
          "inputs": [
            {"internalType": "uint32", "name": "_destinationDomain", "type": "uint32"},
            {"internalType": "bytes", "name": "_message", "type": "bytes"}
          ],
          "name": "quoteDispatch",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view" as const,
          "type": "function"
        },
        {
          "inputs": [],
          "name": "logosFound",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view" as const,
          "type": "function"
        },
        {
          "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
          "name": "personalCollection",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view" as const,
          "type": "function"
        }
      ];

      // Create contract instance
      console.log('Creating contract instance...');
      const contract = new web3.eth.Contract(contractABI as any, contractAddress);
      console.log('Contract instance created');

      // Check current logo count before finding
      console.log('Getting current counts...');
      const logosFoundBefore = await contract.methods.logosFound().call() as string;
      console.log(`📊 Current logos found: ${logosFoundBefore}`);

      // Check current personal collection
      const personalCollection = await contract.methods.personalCollection(userWallet).call() as string;
      console.log(`👤 Personal collection: ${personalCollection} logos`);

      // Prepare discovery data for quoteDispatch
      const discoveryData = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'uint256'],
        [userWallet, BigInt(logosFoundBefore) + BigInt(1), BigInt(personalCollection) + BigInt(1)]
      );

      console.log(`🔍 Discovery data: ${discoveryData}`);
      console.log(`👤 User address: ${userWallet}`);

      // Get quote for dispatching the discovery
      console.log('Getting quote...');
      const quote = await contract.methods.quoteDispatch(destinationChainId, discoveryData).call() as string;
      console.log(`💰 Quote: ${web3.utils.fromWei(quote, 'ether')} ETH`);

      // Find the logo with the quoted amount of Ether
      console.log(`🚀 Calling findLogo()...`);
      const tx = await contract.methods.findLogo(destinationChainId, userWallet).send({
        from: account.address,
        value: quote,
        gas: '500000'
      });
      console.log(`✅ Transaction confirmed: ${tx.transactionHash}`);

      // Check the updated logo count
      const logosFoundAfter = await contract.methods.logosFound().call() as string;
      console.log(`📈 Updated logos found: ${logosFoundAfter}`);

      const result = {
        success: true,
        userWallet,
        chain,
        message: 'Logo collection successful',
        totalLogos: logosFoundAfter.toString(),
        personalCollection: (BigInt(personalCollection) + BigInt(1)).toString(),
        quote: web3.utils.fromWei(quote, 'ether'),
        transactionHash: tx.transactionHash
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