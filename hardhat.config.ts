import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";

// Override typechain target to use ethers-v5
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-ethers";
const config: HardhatUserConfig = {
  solidity: "0.8.24",
  typechain: {
    target: "ethers-v5",
  },
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/fl94lXT-IxAhUmbp5fOua",
      accounts: vars.get("PRIVATE_KEY") ? [vars.get("PRIVATE_KEY")] : [],
    },
    arbitrumsepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: vars.get("PRIVATE_KEY") ? [vars.get("PRIVATE_KEY")] : [],
    }
  },
  etherscan: {
    apiKey: "D1GWV5DMU7IVVNGZW8AHIWXKUHTJE2UEGW",
    // apiKey: {
    //   sepolia: "D1GWV5DMU7IVVNGZW8AHIWXKUHTJE2UEGW",
    //   arbitrumsepolia: "D1GWV5DMU7IVVNGZW8AHIWXKUHTJE2UEGW"
    // },
    // customChains: [
    //   {
    //     network: "sepolia",
    //     chainId: 11155111,
    //     urls: {
    //       apiURL: "https://api-sepolia.etherscan.io/api",
    //       browserURL: "https://sepolia.etherscan.io",
    //     },
    //   },
    //   {
    //     network: "arbitrumsepolia",
    //     chainId: 421614,
    //     urls: {
    //       apiURL: "https://api-sepolia.arbiscan.io/api",
    //       browserURL: "https://sepolia.arbiscan.io",
    //     },
    //   },
    //   {
    //     network: "basesepolia",
    //     chainId: 84532,
    //     urls: {
    //       apiURL: "https://api-sepolia.basescan.org/api",
    //       browserURL: "https://sepolia.basescan.org",
    //     },
    //   }
    // ],
  },
};

export default config;
