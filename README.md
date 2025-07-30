# Nexus Logo Hunt Game (Hardhat)

This project is a cross-chain logo collection game built on Nexus powered cross-chain messaging. Players can collect logos on one chain and their collection is automatically synchronized across all participating chains. Think of it like collecting coins in a video game - each player can collect multiple logos and build their personal collection while contributing to the global total. It provides ready-to-use scripts for compiling, deploying, and verifying contracts on multiple EVM-compatible chains (currently Sepolia and Arbitrum Sepolia testnets).

## Installation

First, install all dependencies and compile contracts:
```shell
npm run setup
```

Or manually:
```shell
npm install --legacy-peer-deps
npm run compile
```

**Note:** This project uses ethers v5 and requires the `--legacy-peer-deps` flag due to dependency conflicts with newer hardhat tooling.

## Setup Process

After installing dependencies, you must provide your deployer private key and Etherscan API key using **both** a `.env` file and Hardhat vars. This ensures compatibility with all scripts and workflows.

### 1. Create a `.env` file in the project root:
```env
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_v2_api_key
```

### 2. Set the same secrets using Hardhat vars:
```shell
npx hardhat vars set PRIVATE_KEY
npx hardhat vars set ETHERSCAN_API_KEY
```

You can check your current vars with:
```shell
npx hardhat vars list
```

---

## Quick Start

1. **Compile contracts (if not done during setup):**
   ```shell
   npm run compile
   ```

2. **Deploy contracts:**
   ```shell
   npm run deploy
   ```
   - By default, this deploys `LogoHuntGame` contracts to Sepolia and Arbitrum Sepolia.
   - The deployment script:
     - Sets the correct Nexus Interchain Security Module (ISM) and mailbox for each contract.
     - Automatically enrolls the peer address of the contract deployed on the other chain (enabling cross-chain messaging out-of-the-box).
   - Deployment details are saved to `deployments/logohuntgame.json` for later verification or troubleshooting.

3. **Verify contracts:**
   - To verify on Sepolia:
     ```shell
     npm run verify:sepolia
     ```
   - To verify on Arbitrum Sepolia:
     ```shell
     npm run verify:arbitrumsepolia
     ```
   - **Note:** Verification on Arbitrum Sepolia is currently failing due to block explorer/API issues. This will be fixed soon.

4. **Test the cross-chain logo collection:**
   ```shell
   # Check initial counts
   npm run check-counts
   
   # Collect a logo on Sepolia
   npm run find-logo:sepolia
   
   # Check counts again
   npm run check-counts
   
   # Collect another logo on Arbitrum Sepolia
   npm run find-logo:arbitrum
   
   # Final count check
   npm run check-counts
   ```

5. **Collect logos (cross-chain discovery):**
   - After deployment, you can collect logos on either chain and have your collection synchronized across all chains using:
     ```shell
     # Find logo on Sepolia (sends to Arbitrum Sepolia)
     npm run find-logo:sepolia
     
     # Find logo on Arbitrum Sepolia (sends to Sepolia)
     npm run find-logo:arbitrum
     
     # Legacy script (finds on Sepolia)
     npm run find-logo
     ```
   - These scripts perform the following steps:
     1. Shows your current personal collection count
     2. Connects to the source chain's LogoHuntGame contract
     3. Calls `quoteDispatch` to get the exact amount of native token (ETH) required for the cross-chain message
     4. Displays the quoted amount needed for the transaction
     5. Calls `findLogo()` with the exact quoted value attached to the transaction
   - **Important:** The quoted amount is the exact value required by the Hyperlane protocol to process the cross-chain message. This covers:
     - Gas costs on the destination chain
     - Protocol fees
     - Any additional costs for message delivery
   - The logo discovery will be processed by the destination chain's Mailbox and delivered to the recipient contract, updating the logo count on both chains

   Example output:
   ```
   🎯 Finding logo on SEPOLIA
   📍 Contract: sepolia:0xE362Af41BC246AcF75AE1Ddc3e3b15C3D78A1a75
   🌉 Destination: arbitrumsepolia (421614)
   📊 Current logos found on sepolia: 0
   👤 Your personal collection on sepolia: 0 logos
   🔍 Discovery data: 0x...
   👤 Finder address: 0x...
   🎯 Expected new total count: 1
   🎯 Expected new personal count: 1
   💰 Quote for dispatching logo discovery: 0.000031460400000001 ETH
   🚀 Calling findLogo() on Sepolia...
   ✅ findLogo transaction confirmed on sepolia
   📈 Updated logos found on sepolia: 1
   🎉 Logo discovery sent from sepolia to arbitrumsepolia!
   🔄 The logo count should now be synchronized across both chains.
   ```

6. **Check logo counts:**
   - View the current logo counts on both chains and check synchronization:
     ```shell
     npm run check-counts
     ```
   - This script shows:
     - Total logos found on each chain
     - Whether counts are synchronized across chains
     - Your personal participation status
     - Explorer links to view contracts

   Example output:
   ```
   📊 Logo Hunt Game - Cross-Chain Counts

   🔵 Sepolia: 1 logos found
      Unique participants: 1
      Contract: 0xE362Af41BC246AcF75AE1Ddc3e3b15C3D78A1a75
      Explorer: https://sepolia.etherscan.io/address/0xE362Af41BC246AcF75AE1Ddc3e3b15C3D78A1a75

   🟣 Arbitrum Sepolia: 0 logos found
      Unique participants: 0
      Contract: 0xb8636b5d89f882509703D2F3F13B12927705d732
      Explorer: https://sepolia.arbiscan.io/address/0xb8636b5d89f882509703D2F3F13B12927705d732

   ⚠️  Counts are not synchronized:
      Sepolia: 1
      Arbitrum Sepolia: 0
      Difference: 1

   👤 Your address (0x99e1d1Eb6a9D87c48364018A6670399afDdadF8b):
      Sepolia: 1 logos collected
      Arbitrum Sepolia: 0 logos collected
      Total personal collection: 1 logos
   ```


## Troubleshooting & Manual Process

- **Nexus ISM addresses:**
  - Sepolia: `0x2004694c5801e7a6F7C72aDc8275Fd63C3068BCE`
  - Arbitrum Sepolia: `0xAd96506f940e114FF35A9Eb6489e731d66180B99`
- The deployment script uses these by default, but you can override them in `deploy-logohuntgame.ts` if needed.
- If you need to re-verify or debug, check `deployments/logohuntgame.json` for contract addresses and constructor arguments.
- **Current Deployed Contracts:**
  - Sepolia: `0x8F86FE8d54ff5C27C97D53Ee113936a0E64958E2`
  - Arbitrum Sepolia: `0xB41396f80545e34CdD0B31dF8fF7b7c5FA658045`
- **Game Features:**
  - Players can collect multiple logos (like collecting coins in a video game)
  - Personal collections are tracked per address and synchronized across chains
  - The `logosFound` counter represents the total discoveries across all chains
  - The `personalCollection(address)` mapping tracks each player's individual collection
  - The `uniqueParticipants` counter tracks how many different addresses have collected at least one logo
  - Cross-chain messages may take a few minutes to process and synchronize

## Environment Variables

- Create a `.env` file with:
  ```env
  PRIVATE_KEY=your_deployer_private_key
  ETHERSCAN_API_KEY=your_etherscan_v2_api_key
  ```

## Known Issues

- **Verification on Arbitrum Sepolia**: Currently fails due to the block explorer endpoint/API key handling. This will be fixed as soon as upstream support is stable.
- **Node.js Version**: Hardhat only supports Node.js 18.x and 20.x. Using other versions may cause unexpected errors.
- **Dependency Conflicts**: The project uses ethers v5 with newer hardhat tooling, requiring `--legacy-peer-deps` for installation.

## Additional Notes
- The deployment and verification scripts are designed to be run per-network for reliability.
- For custom deployments or additional networks, extend the `CHAIN_CONFIG` in `deploy-logohuntgame.ts` and update scripts as needed.
- **Legacy MockClient:** The original MockClient contracts are still available using:
  - `npm run deploy:mockclient` - Deploy MockClient contracts
  - `npm run verify:mockclient:sepolia` - Verify MockClient on Sepolia
  - `npm run verify:mockclient:arbitrumsepolia` - Verify MockClient on Arbitrum Sepolia
  - `npm run send-message` - Send "Hello World" message
- For more information on Nexus and Hyperlane, see the [Nexus documentation](https://docs.hyperlane.xyz/).
