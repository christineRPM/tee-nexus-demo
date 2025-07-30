import { ethers as hardhatEthers, network, run } from "hardhat";
import { existsSync, readFileSync } from "fs";
import { chainAddresses } from '@hyperlane-xyz/registry';
import { ethers } from "ethers";
import * as dotenv from "dotenv";
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

async function verifyContract(cfg: any, address: string, mailbox: string) {
  try {
    await run("verify:etherscan", {
      address,
      constructorArguments: [mailbox, ethers.constants.AddressZero],
      network: cfg.name,
    });
    console.log(`Verified LogoHuntGame on ${cfg.name}`);
  } catch (e: any) {
    console.warn(`Verification failed on ${cfg.name}:`, e.message || e);
  }
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

  // Verify on both chains
  for (const [_, cfg] of Object.entries(CHAIN_CONFIG)) {
    const mailbox = chainAddresses[cfg.name as keyof typeof chainAddresses].mailbox;
    const deployment = deployments[cfg.name];
    await verifyContract(cfg, deployment.address, mailbox);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 