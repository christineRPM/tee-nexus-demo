import { NextRequest, NextResponse } from 'next/server';
import Web3 from 'web3';
import 'dotenv/config';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Check Collection API Called ===');
    
    const body = await request.json();
    const { userWallet } = body;

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

    // Contract ABI for the LogoHuntGame contract
    const LOGO_HUNT_GAME_ABI = [
      {
        "inputs": [],
        "name": "logosFound",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
        "name": "personalCollection",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "uniqueParticipants",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    try {
      console.log('Setting up Web3 instances...');
      
      // Create Web3 instances
      const sepoliaWeb3 = new Web3(process.env.SEPOLIA_RPC_URL!);
      const arbitrumWeb3 = new Web3(process.env.ARBITRUM_SEPOLIA_RPC_URL!);

      console.log('Creating contracts...');
      
      // Create contracts
      const sepoliaContract = new sepoliaWeb3.eth.Contract(
        LOGO_HUNT_GAME_ABI, 
        process.env.SEPOLIA_CONTRACT_ADDRESS!
      );
      
      const arbitrumContract = new arbitrumWeb3.eth.Contract(
        LOGO_HUNT_GAME_ABI, 
        process.env.ARBITRUM_SEPOLIA_CONTRACT_ADDRESS!
      );

      console.log('Fetching data from contracts...');

      // Get data from both chains with error handling
      const [sepoliaPersonal, sepoliaTotal, sepoliaParticipants, arbitrumPersonal, arbitrumTotal, arbitrumParticipants] = await Promise.all([
        (sepoliaContract.methods.personalCollection(userWallet).call() as Promise<string>).catch((e: any) => {
          console.log('Sepolia personal collection error:', e.message);
          return '0';
        }),
        (sepoliaContract.methods.logosFound().call() as Promise<string>).catch((e: any) => {
          console.log('Sepolia logos found error:', e.message);
          return '0';
        }),
        (sepoliaContract.methods.uniqueParticipants().call() as Promise<string>).catch((e: any) => {
          console.log('Sepolia participants error:', e.message);
          return '0';
        }),
        (arbitrumContract.methods.personalCollection(userWallet).call() as Promise<string>).catch((e: any) => {
          console.log('Arbitrum personal collection error:', e.message);
          return '0';
        }),
        (arbitrumContract.methods.logosFound().call() as Promise<string>).catch((e: any) => {
          console.log('Arbitrum logos found error:', e.message);
          return '0';
        }),
        (arbitrumContract.methods.uniqueParticipants().call() as Promise<string>).catch((e: any) => {
          console.log('Arbitrum participants error:', e.message);
          return '0';
        })
      ]);

      const result = {
        success: true,
        userWallet,
        collection: {
          sepolia: parseInt(sepoliaPersonal),
          arbitrumSepolia: parseInt(arbitrumPersonal),
          total: parseInt(sepoliaPersonal) + parseInt(arbitrumPersonal)
        },
        globalStats: {
          sepolia: { 
            total: parseInt(sepoliaTotal), 
            participants: parseInt(sepoliaParticipants) 
          },
          arbitrumSepolia: { 
            total: parseInt(arbitrumTotal), 
            participants: parseInt(arbitrumParticipants) 
          }
        }
      };

      console.log('Success:', result);
      return NextResponse.json(result);

    } catch (error) {
      console.error('Failed to check collection:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check collection',
          details: error instanceof Error ? error.message : 'Unknown error',
          userWallet
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error checking collection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 