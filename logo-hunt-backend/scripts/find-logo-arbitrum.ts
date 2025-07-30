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
  const deploymentsPath = path.join(__dirname, "../deployments/logohuntgame.json");
  let deployments: Record<string, any>;
  try {
    deployments = JSON.parse(readFileSync(deploymentsPath, "utf-8"));
  } catch (e) {
    console.error(`Could not read deployments file at ${deploymentsPath}`);
    console.error("Please run the deployment script first: npm run deploy");
    process.exit(1);
  }

  const cfg = CHAIN_CONFIG.arbitrumsepolia;
  const remoteCfg = CHAIN_CONFIG.sepolia;
  const local = deployments[cfg.name];
  const remote = deployments[remoteCfg.name];
  const signer = getSigner(cfg.rpc);
  const logoHuntGame = LogoHuntGame__factory.connect(local.address, signer);
  const mailbox = Mailbox__factory.connect(local.mailbox, signer);

  console.log(`🎯 Finding logo on ARBITRUM SEPOLIA`);
  console.log(`📍 Contract: ${cfg.name}:${local.address}`);
  console.log(`🌉 Destination: ${remoteCfg.name} (${remote.chainId})`);

  // Check current logo count before finding
  const logosFoundBefore = await logoHuntGame.logosFound();
  console.log(`📊 Current logos found on ${cfg.name}: ${logosFoundBefore}`);

  // Check current personal collection
  const personalCollection = await logoHuntGame.personalCollection(signer.address);
  console.log(`👤 Your personal collection on ${cfg.name}: ${personalCollection} logos`);

  // Prepare discovery data for quoteDispatch
  // Encode: finder address + total count (current + 1) + personal count (current + 1)
  const discoveryData = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256"],
    [signer.address, logosFoundBefore.add(1), personalCollection.add(1)]
  );

  console.log(`🔍 Discovery data: ${discoveryData}`);
  console.log(`👤 Finder address: ${signer.address}`);
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
  console.log(`🚀 Calling findLogo() on Arbitrum Sepolia...`);
  const tx = await logoHuntGame.findLogo(remote.chainId, signer.address, { value: quote });
  await tx.wait();
  console.log(`✅ findLogo transaction confirmed on ${cfg.name}`);

  // Check the updated logo count
  const logosFoundAfter = await logoHuntGame.logosFound();
  console.log(`📈 Updated logos found on ${cfg.name}: ${logosFoundAfter}`);

  console.log(`🎉 Logo discovery sent from ${cfg.name} to ${remoteCfg.name}!`);
  console.log(`🔄 The logo count should now be synchronized across both chains.`);
  console.log(`🔗 View on Arbitrum Sepolia: https://sepolia.arbiscan.io/address/${local.address}`);
  console.log(`🔗 View on Sepolia: https://sepolia.etherscan.io/address/${remote.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 