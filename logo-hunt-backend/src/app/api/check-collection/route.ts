import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userWallet } = body;

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

    // Execute the check-counts script
    const command = `cd .. && npx hardhat run scripts/check-counts.ts`;
    
    console.log(`📊 Checking collection for: ${userWallet}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.error('Script stderr:', stderr);
    }

    console.log('Script stdout:', stdout);

    // Parse the output to extract user's collection
    const lines = stdout.split('\n');
    const result: {
      success: boolean;
      userWallet: string;
      collection: {
        sepolia: number;
        arbitrumSepolia: number;
        total: number;
      };
      globalStats: {
        sepolia: { total: number; participants: number };
        arbitrumSepolia: { total: number; participants: number };
      };
    } = {
      success: true,
      userWallet,
      collection: {
        sepolia: 0,
        arbitrumSepolia: 0,
        total: 0
      },
      globalStats: {
        sepolia: { total: 0, participants: 0 },
        arbitrumSepolia: { total: 0, participants: 0 }
      }
    };

    // Extract user's personal collection
    for (const line of lines) {
      if (line.includes('Your address') && line.includes(userWallet)) {
        // Look for the next lines that show collection counts
        const sepoliaMatch = lines.find(l => l.includes('Sepolia:') && l.includes('logos collected'));
        const arbitrumMatch = lines.find(l => l.includes('Arbitrum Sepolia:') && l.includes('logos collected'));
        const totalMatch = lines.find(l => l.includes('Total personal collection:') && l.includes('logos'));

        if (sepoliaMatch) {
          result.collection.sepolia = parseInt(sepoliaMatch.match(/\d+/)?.[0] || '0');
        }
        if (arbitrumMatch) {
          result.collection.arbitrumSepolia = parseInt(arbitrumMatch.match(/\d+/)?.[0] || '0');
        }
        if (totalMatch) {
          result.collection.total = parseInt(totalMatch.match(/\d+/)?.[0] || '0');
        }
      }

      // Extract global stats
      if (line.includes('Sepolia:') && line.includes('logos found')) {
        result.globalStats.sepolia.total = parseInt(line.match(/\d+/)?.[0] || '0');
      }
      if (line.includes('Unique participants:') && line.includes('Sepolia')) {
        result.globalStats.sepolia.participants = parseInt(line.match(/\d+/)?.[0] || '0');
      }
      if (line.includes('Arbitrum Sepolia:') && line.includes('logos found')) {
        result.globalStats.arbitrumSepolia.total = parseInt(line.match(/\d+/)?.[0] || '0');
      }
      if (line.includes('Unique participants:') && line.includes('Arbitrum Sepolia')) {
        result.globalStats.arbitrumSepolia.participants = parseInt(line.match(/\d+/)?.[0] || '0');
      }
    }

    return NextResponse.json(result);

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