import { ethers as hardhatEthers, network, run } from "hardhat";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { chainAddresses } from '@hyperlane-xyz/registry';
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { MockClient, MockClient__factory } from "../typechain-types";
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

async function deployMockClient(cfg: any) {
  const signer = getSigner(cfg.rpc);
  const mailbox = chainAddresses[cfg.name as keyof typeof chainAddresses].mailbox;
  const MockClientFactory = new MockClient__factory(signer);
  const mockClient = await MockClientFactory.deploy(mailbox, ethers.constants.AddressZero);
  await mockClient.deployTransaction.wait();
  const address = mockClient.address;
  console.log(`${cfg.name} MockClient deployed at:`, address);
  return { address, chainId: cfg.chainId, signer };
}

async function verifyContract(cfg: any, address: string, mailbox: string) {
  try {
    await run("verify:etherscan", {
      address,
      constructorArguments: [mailbox, ethers.constants.AddressZero],
      network: cfg.name,
    });
    console.log(`Verified MockClient on ${cfg.name}`);
  } catch (e: any) {
    console.warn(`Verification failed on ${cfg.name}:`, e.message || e);
  }
}

async function main() {
  const deployments: Record<string, any> = {};

  // Deploy and verify on both chains
  for (const [_, cfg] of Object.entries(CHAIN_CONFIG)) {
    const mailbox = chainAddresses[cfg.name as keyof typeof chainAddresses].mailbox;
    const deployed = await deployMockClient(cfg);
    deployments[cfg.name] = {
      address: deployed.address,
      mailbox,
      chainId: cfg.chainId,
      network: cfg.name,
      constructorArgs: [mailbox, ethers.constants.AddressZero],
    };
    await verifyContract(cfg, deployed.address, mailbox);
  }

  // Store deployments to file for later verification
  const deploymentsDir = `${__dirname}/../deployments`;
  if (!existsSync(deploymentsDir)) {
    mkdirSync(deploymentsDir);
  }
  writeFileSync(
    `${deploymentsDir}/mockclient.json`,
    JSON.stringify(deployments, null, 2)
  );
  console.log(`Deployment details written to ${deploymentsDir}/mockclient.json`);

  // Enroll remote routers and set ISM
  for (const [_, cfg] of Object.entries(CHAIN_CONFIG)) {
    const remoteKey = cfg.name === "sepolia" ? "arbitrumsepolia" : "sepolia";
    const local = deployments[cfg.name];
    const remote = deployments[remoteKey];
    const signer = getSigner(cfg.rpc);
    const mockClient = MockClient__factory.connect(local.address, signer);

    console.log(`Calling enrollRemoteRouter on ${cfg.name}:${local.address} with remote address ${remote.address} and domain ${remote.chainId}`);
    // ABI-encode remote.address as bytes32
    const routerBytes32 = ethers.utils.zeroPad(remote.address, 32);
    const abiEncodedRouter = ethers.utils.defaultAbiCoder.encode(["bytes32"], [routerBytes32]);
    console.log(`AbiEncodedRouter: ${abiEncodedRouter}`);

    const tx1 = await mockClient.enrollRemoteRouter(remote.chainId, abiEncodedRouter);
    await tx1.wait();
    console.log(`enrollRemoteRouter called on ${cfg.name}`);

    console.log(`Calling setInterchainSecurityModule on ${cfg.name} with ISM ${cfg.interchainSecurityModule}`);
    const tx2 = await mockClient.setInterchainSecurityModule(cfg.interchainSecurityModule);
    await tx2.wait();
    console.log(`setInterchainSecurityModule called on ${cfg.name}`);
  }

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
