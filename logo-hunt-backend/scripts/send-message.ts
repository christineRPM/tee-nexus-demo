import { ethers as hardhatEthers, network, run } from "hardhat";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { chainAddresses } from '@hyperlane-xyz/registry';
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { MockClient, MockClient__factory } from "../typechain-types";
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
  const deploymentsPath = path.join(__dirname, "../deployments/mockclient.json");
  let deployments: Record<string, any>;
  try {
    deployments = JSON.parse(readFileSync(deploymentsPath, "utf-8"));
  } catch (e) {
    console.error(`Could not read deployments file at ${deploymentsPath}`);
    process.exit(1);
  }

  const cfg = CHAIN_CONFIG.sepolia;
  const remoteCfg = CHAIN_CONFIG.arbitrumsepolia;
  const local = deployments[cfg.name];
  const remote = deployments[remoteCfg.name];
  const signer = getSigner(cfg.rpc);
  const mockClient = MockClient__factory.connect(local.address, signer);
  const mailbox = Mailbox__factory.connect(local.mailbox, signer);

  console.log(`Calling sendHelloWorld on ${cfg.name}:${local.address} with destination address ${remote.address} and domain ${remote.chainId}`);

  // Prepare message for quoteDispatch
  const message = "Hello World!";
  const messageBody = ethers.utils.toUtf8Bytes(message);
  // Convert recipient address to bytes32
  const recipientBytes32 = ethers.utils.zeroPad(ethers.utils.arrayify(remote.address), 32);

  console.log(`Message: ${message}`);
  console.log(`MessageBody: ${messageBody}`);
  console.log(`RecipientBytes32: ${recipientBytes32}`);
  console.log(`RecipientAddress: ${remote.address}`);
  console.log(`RecipientChainId: ${remote.chainId}`);
  console.log(`OriginAddress: ${local.address}`);
  console.log(`OriginChainId: ${local.chainId}`);
  // Get quote for dispatching the message
  let quote;
  try {
    quote = await mailbox["quoteDispatch(uint32,bytes32,bytes)"](
      remote.chainId, // destination domain
      recipientBytes32, // recipient address (bytes32)
      messageBody
    );
    console.log(`Quote for dispatching message: ${ethers.utils.formatEther(quote)} ETH`);
  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }

  // Send the message with the quoted amount of Ether
  const tx1 = await mockClient.sendHelloWorld(remote.chainId, message, { value: quote });
  await tx1.wait();
  console.log(`sendHelloWorld called on ${cfg.name}`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
