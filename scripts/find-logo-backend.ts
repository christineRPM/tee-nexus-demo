import { ethers as hardhatEthers, network, run } from "hardhat";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { chainAddresses } from '@hyperlane-xyz/registry';
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { LogoHuntGame, LogoHuntGame__factory } from "../typechain-types";
import path from "path";
import { Mailbox__factory } from "@hyperlane-xyz/core";
dotenv.config();

const CHAIN_CONFIG = {
  sepolia: {
    chainId: 11155111,
    name: "sepolia",
    rpc: "https://eth-sepolia.g.alchemy.com/v2/fl94lXT-IxAhUmbp5fOua",
    interchainSecurityModule: "0x2004694c5801e7a6F7C72aDc8275Fd63C3068BCE",
  },
  arbitrumsepolia: {
    chainId: 421614,
    name: "arbitrumsepolia",
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    interchainSecurityModule: "0xAd96506f940e114FF35A9Eb6489e731d66180B99",
  },
};

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY env variable not set");
}

function getSigner(rpc: string) {
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  return new ethers.Wallet(PRIVATE_KEY!, provider);
}

async function main() {
  // Get user wallet address from command line arguments
  const userWallet = process.argv[2];
  const targetChain = process.argv[3] || "sepolia"; // Default to sepolia
  
  if (!userWallet) {
    console.error("❌ Please provide a user wallet address:");
    console.error("npm run find-logo-backend <user_wallet_address> [chain]");
    console.error("Example: npm run find-logo-backend 0x1234... sepolia");
    process.exit(1);
  }

  // Validate wallet address
  if (!ethers.utils.isAddress(userWallet)) {
    console.error("❌ Invalid wallet address provided");
    process.exit(1);
  }

  const deploymentsPath = path.join(__dirname, "../deployments/logohuntgame.json");
  let deployments: Record<string, any>;
  try {
    deployments = JSON.parse(readFileSync(deploymentsPath, "utf-8"));
  } catch (e) {
    console.error(`Could not read deployments file at ${deploymentsPath}`);
    console.error("Please run the deployment script first: npm run deploy");
    process.exit(1);
  }

  const cfg = CHAIN_CONFIG[targetChain as keyof typeof CHAIN_CONFIG];
  if (!cfg) {
    console.error(`❌ Invalid chain: ${targetChain}`);
    console.error("Available chains: sepolia, arbitrumsepolia");
    process.exit(1);
  }

  const remoteCfg = targetChain === "sepolia" ? CHAIN_CONFIG.arbitrumsepolia : CHAIN_CONFIG.sepolia;
  const local = deployments[cfg.name];
  const remote = deployments[remoteCfg.name];
  const signer = getSigner(cfg.rpc);
  const logoHuntGame = LogoHuntGame__factory.connect(local.address, signer);

  console.log(`🎯 Backend collecting logo for user: ${userWallet}`);
  console.log(`📍 Chain: ${cfg.name}:${local.address}`);
  console.log(`🌉 Destination: ${remoteCfg.name} (${remote.chainId})`);

  // Check current logo count before finding
  const logosFoundBefore = await logoHuntGame.logosFound();
  console.log(`📊 Current logos found on ${cfg.name}: ${logosFoundBefore}`);

  // Check current personal collection for the user
  const personalCollection = await logoHuntGame.personalCollection(userWallet);
  console.log(`👤 User's personal collection on ${cfg.name}: ${personalCollection} logos`);

  // Prepare discovery data for quoteDispatch
  // Encode: finder address + total count (current + 1) + personal count (current + 1)
  const discoveryData = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256"],
    [userWallet, logosFoundBefore.add(1), personalCollection.add(1)]
  );

  console.log(`🔍 Discovery data: ${discoveryData}`);
  console.log(`👤 User wallet: ${userWallet}`);
  console.log(`🎯 Expected new total count: ${logosFoundBefore.add(1)}`);
  console.log(`🎯 Expected new personal count: ${personalCollection.add(1)}`);

  // Get quote for dispatching the discovery
  let quote;
  try {
    quote = await logoHuntGame.quoteDispatch(remote.chainId, discoveryData);
    console.log(`💰 Quote for dispatching logo discovery: ${ethers.utils.formatEther(quote)} ETH`);
  } catch (error) {
    console.error('❌ Error getting quote:', error);
    throw error;
  }

  // Find the logo with the quoted amount of Ether
  console.log(`🚀 Backend calling findLogo() for user ${userWallet}...`);
  const tx = await logoHuntGame.findLogo(remote.chainId, userWallet, { value: quote });
  await tx.wait();
  console.log(`✅ findLogo transaction confirmed on ${cfg.name}`);

  // Check the updated logo count
  const logosFoundAfter = await logoHuntGame.logosFound();
  console.log(`📈 Updated logos found on ${cfg.name}: ${logosFoundAfter}`);

  // Check the updated personal collection
  const updatedPersonalCollection = await logoHuntGame.personalCollection(userWallet);
  console.log(`📈 Updated personal collection for ${userWallet}: ${updatedPersonalCollection} logos`);

  console.log(`🎉 Logo collected for user ${userWallet} from ${cfg.name} to ${remoteCfg.name}!`);
  console.log(`🔄 The logo count should now be synchronized across both chains.`);
  console.log(`🔗 View on ${cfg.name}: https://${cfg.name === 'sepolia' ? 'sepolia.etherscan.io' : 'sepolia.arbiscan.io'}/address/${local.address}`);
  console.log(`🔗 View on ${remoteCfg.name}: https://${remoteCfg.name === 'sepolia' ? 'sepolia.etherscan.io' : 'sepolia.arbiscan.io'}/address/${remote.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 