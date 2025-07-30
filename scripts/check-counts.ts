import { ethers as hardhatEthers, network, run } from "hardhat";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { chainAddresses } from '@hyperlane-xyz/registry';
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { LogoHuntGame, LogoHuntGame__factory } from "../typechain-types";
import path from "path";
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

  console.log(`📊 Logo Hunt Game - Cross-Chain Counts\n`);

  // Check Sepolia
  const sepoliaCfg = CHAIN_CONFIG.sepolia;
  const sepoliaDeployment = deployments[sepoliaCfg.name];
  const sepoliaSigner = getSigner(sepoliaCfg.rpc);
  const sepoliaGame = LogoHuntGame__factory.connect(sepoliaDeployment.address, sepoliaSigner);
  
  const sepoliaCount = await sepoliaGame.logosFound();
  const sepoliaParticipants = await sepoliaGame.uniqueParticipants();
  console.log(`🔵 Sepolia: ${sepoliaCount} logos found`);
  console.log(`   Unique participants: ${sepoliaParticipants}`);
  console.log(`   Contract: ${sepoliaDeployment.address}`);
  console.log(`   Explorer: https://sepolia.etherscan.io/address/${sepoliaDeployment.address}\n`);

  // Check Arbitrum Sepolia
  const arbitrumCfg = CHAIN_CONFIG.arbitrumsepolia;
  const arbitrumDeployment = deployments[arbitrumCfg.name];
  const arbitrumSigner = getSigner(arbitrumCfg.rpc);
  const arbitrumGame = LogoHuntGame__factory.connect(arbitrumDeployment.address, arbitrumSigner);
  
  const arbitrumCount = await arbitrumGame.logosFound();
  const arbitrumParticipants = await arbitrumGame.uniqueParticipants();
  console.log(`🟣 Arbitrum Sepolia: ${arbitrumCount} logos found`);
  console.log(`   Unique participants: ${arbitrumParticipants}`);
  console.log(`   Contract: ${arbitrumDeployment.address}`);
  console.log(`   Explorer: https://sepolia.arbiscan.io/address/${arbitrumDeployment.address}\n`);

  // Check if counts are synchronized
  if (sepoliaCount.eq(arbitrumCount)) {
    console.log(`✅ Counts are synchronized! Both chains show ${sepoliaCount} logos found.`);
  } else {
    console.log(`⚠️  Counts are not synchronized:`);
    console.log(`   Sepolia: ${sepoliaCount}`);
    console.log(`   Arbitrum Sepolia: ${arbitrumCount}`);
    console.log(`   Difference: ${sepoliaCount.sub(arbitrumCount).abs()}`);
  }

  // Check current address personal collections
  const currentAddress = sepoliaSigner.address;
  const sepoliaPersonal = await sepoliaGame.personalCollection(currentAddress);
  const arbitrumPersonal = await arbitrumGame.personalCollection(currentAddress);
  
  console.log(`\n👤 Your address (${currentAddress}):`);
  console.log(`   Sepolia: ${sepoliaPersonal} logos collected`);
  console.log(`   Arbitrum Sepolia: ${arbitrumPersonal} logos collected`);
  console.log(`   Total personal collection: ${sepoliaPersonal.add(arbitrumPersonal)} logos`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 