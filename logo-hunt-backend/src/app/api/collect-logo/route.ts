import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '@/lib/config';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
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

    if (!config.chains[chain as keyof typeof config.chains]) {
      return NextResponse.json(
        { error: 'Invalid chain. Available: sepolia, arbitrumsepolia' },
        { status: 400 }
      );
    }

    // Execute the backend script
    const scriptPath = '../scripts/find-logo-backend.ts';
    const command = `cd .. && npx hardhat run ${scriptPath} --network ${chain} ${userWallet}`;
    
    console.log(`🎯 Executing: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.error('Script stderr:', stderr);
    }

    console.log('Script stdout:', stdout);

    // Parse the output to extract key information
    const lines = stdout.split('\n');
    const result: {
      success: boolean;
      userWallet: string;
      chain: string;
      message: string;
      details: string[];
      totalLogos?: string;
      personalCollection?: string;
      quote?: string;
    } = {
      success: true,
      userWallet,
      chain,
      message: 'Logo collection initiated successfully',
      details: lines
    };

    // Extract key metrics from output
    for (const line of lines) {
      if (line.includes('Updated logos found')) {
        result.totalLogos = line.match(/\d+/)?.[0];
      }
      if (line.includes('Updated personal collection')) {
        result.personalCollection = line.match(/\d+/)?.[0];
      }
      if (line.includes('Quote for dispatching')) {
        result.quote = line.match(/[\d.]+/)?.[0];
      }
    }

    return NextResponse.json(result);

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