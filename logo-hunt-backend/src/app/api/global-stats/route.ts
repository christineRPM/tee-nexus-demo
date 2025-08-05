import { NextResponse } from 'next/server';
import Web3 from 'web3';
import 'dotenv/config';

export async function GET() {
  try {
    console.log('=== Global Stats API Called ===');
    
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

      console.log('Fetching global data from contracts...');

      // Get global data from both chains with error handling
      const [sepoliaTotal, sepoliaParticipants, arbitrumTotal, arbitrumParticipants] = await Promise.all([
        (sepoliaContract.methods.logosFound().call() as Promise<string>).catch((e: any) => {
          console.log('Sepolia logos found error:', e.message);
          return '0';
        }),
        (sepoliaContract.methods.uniqueParticipants().call() as Promise<string>).catch((e: any) => {
          console.log('Sepolia participants error:', e.message);
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
        globalStats: {
          sepolia: { 
            total: parseInt(sepoliaTotal), 
            participants: parseInt(sepoliaParticipants) 
          },
          arbitrumSepolia: { 
            total: parseInt(arbitrumTotal), 
            participants: parseInt(arbitrumParticipants) 
          }
        },
        totalLogos: parseInt(sepoliaTotal) + parseInt(arbitrumTotal),
        totalParticipants: Math.max(parseInt(sepoliaParticipants), parseInt(arbitrumParticipants))
      };

      console.log('Global stats success:', result);
      return NextResponse.json(result);

    } catch (error) {
      console.error('Failed to fetch global stats:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch global stats',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching global stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch global stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 