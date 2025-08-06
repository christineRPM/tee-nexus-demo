import { NextResponse } from 'next/server';
import Web3 from 'web3';
import 'dotenv/config';

interface PlayerStats {
  wallet: string;
  total: number;
  sepolia: number;
  arbitrumSepolia: number;
}

export async function GET() {
  try {
    console.log('=== Leaderboard API Called ===');
    
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

      console.log('Fetching recent events to get player addresses...');

      // Get recent LogoFound events from both chains to find active players
      const sepoliaEvents = await sepoliaWeb3.eth.getPastLogs({
        address: process.env.SEPOLIA_CONTRACT_ADDRESS!,
        topics: [
          sepoliaWeb3.utils.sha3('LogoFound(address,uint256,uint256,uint32,uint32)') || ''
        ],
        fromBlock: 'latest',
        toBlock: 'latest'
      }).catch(() => []);

      const arbitrumEvents = await arbitrumWeb3.eth.getPastLogs({
        address: process.env.ARBITRUM_SEPOLIA_CONTRACT_ADDRESS!,
        topics: [
          arbitrumWeb3.utils.sha3('LogoFound(address,uint256,uint256,uint32,uint32)') || ''
        ],
        fromBlock: 'latest',
        toBlock: 'latest'
      }).catch(() => []);

      // Extract unique player addresses from events
      const playerAddresses = new Set<string>();
      
      // Add some known test addresses for demonstration
      const testAddresses = [
        '0x1234567890123456789012345678901234567890',
        '0x2345678901234567890123456789012345678901',
        '0x3456789012345678901234567890123456789012',
        '0x4567890123456789012345678901234567890123',
        '0x5678901234567890123456789012345678901234'
      ];

      testAddresses.forEach(addr => playerAddresses.add(addr));

      // Also add addresses from events if any
      sepoliaEvents.forEach((event: any) => {
        if (event.topics[1]) {
          const address = sepoliaWeb3.eth.abi.decodeParameter('address', event.topics[1]) as string;
          playerAddresses.add(address);
        }
      });

      arbitrumEvents.forEach((event: any) => {
        if (event.topics[1]) {
          const address = arbitrumWeb3.eth.abi.decodeParameter('address', event.topics[1]) as string;
          playerAddresses.add(address);
        }
      });

      console.log(`Found ${playerAddresses.size} unique players`);

      // Query stats for each player
      const playerStats: PlayerStats[] = [];
      
      for (const wallet of playerAddresses) {
        try {
          const [sepoliaCount, arbitrumCount] = await Promise.all([
            (sepoliaContract.methods.personalCollection(wallet).call() as Promise<string>).catch(() => '0'),
            (arbitrumContract.methods.personalCollection(wallet).call() as Promise<string>).catch(() => '0')
          ]);

          const sepolia = parseInt(sepoliaCount);
          const arbitrumSepolia = parseInt(arbitrumCount);
          const total = sepolia + arbitrumSepolia;

          if (total > 0) { // Only include players with victories
            playerStats.push({
              wallet: wallet,
              total,
              sepolia,
              arbitrumSepolia
            });
          }
        } catch (error) {
          console.log(`Error fetching stats for ${wallet}:`, error);
        }
      }

      // Sort by total victories (descending)
      playerStats.sort((a, b) => b.total - a.total);

      // Take top 10 players
      const topPlayers = playerStats.slice(0, 10).map(player => ({
        ...player,
        wallet: `${player.wallet.slice(0, 6)}...${player.wallet.slice(-4)}` // Shorten address for display
      }));

      console.log('Leaderboard success:', topPlayers);

      return NextResponse.json({
        success: true,
        topPlayers,
        totalPlayers: playerStats.length
      });

    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch leaderboard',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch leaderboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 