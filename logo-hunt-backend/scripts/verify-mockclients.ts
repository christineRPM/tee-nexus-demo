import hre, { run } from "hardhat";
import { readFileSync } from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const deploymentsPath = path.join(__dirname, "../deployments/mockclient.json");
  let deployments: Record<string, any>;
  try {
    deployments = JSON.parse(readFileSync(deploymentsPath, "utf-8"));
  } catch (e) {
    console.error(`Could not read deployments file at ${deploymentsPath}`);
    process.exit(1);
  }

  const currentNetwork = hre.network.name;
  const info = deployments[currentNetwork];
  if (!info) {
    console.error(`No deployment info for network ${currentNetwork}`);
    process.exit(1);
  }

  try {
    // Log the explorer endpoint Hardhat will use (for plugin v2 this is internal, so we log what we can)
    const etherscanConfig = hre.config.etherscan;
    console.log(`[DEBUG] Etherscan config:`, etherscanConfig);
    console.log(`Verifying ${currentNetwork}: ${info.address} with args ${JSON.stringify(info.constructorArgs)}`);
    await run("verify:verify", {
      address: info.address,
      constructorArguments: info.constructorArgs,
    });
    console.log(`Verified MockClient on ${currentNetwork}`);
  } catch (e: any) {
    console.warn(`Verification failed on ${currentNetwork}:`, e.message || e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});