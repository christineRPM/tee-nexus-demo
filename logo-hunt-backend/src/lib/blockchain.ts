import { ethers } from 'ethers';
import { config } from './config';

// Contract ABI for the LogoHuntGame contract
const LOGO_HUNT_GAME_ABI = [
  "function findLogo(uint32 _destinationDomain, address _userWallet) external payable",
  "function quoteDispatch(uint32 _destinationDomain, bytes calldata _message) external view returns (uint256)",
  "function logosFound() external view returns (uint256)",
  "function personalCollection(address _user) external view returns (uint256)",
  "function uniqueParticipants() external view returns (uint256)"
];

export class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(chainName: 'sepolia' | 'arbitrumSepolia') {
    const chainConfig = config.chains[chainName];
    this.provider = new ethers.providers.JsonRpcProvider(chainConfig.rpc, {
      name: chainName === 'sepolia' ? 'sepolia' : 'arbitrum-sepolia',
      chainId: chainConfig.chainId
    });
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(chainConfig.contractAddress, LOGO_HUNT_GAME_ABI, this.wallet);
  }

  async collectLogo(userWallet: string, destinationChain: 'sepolia' | 'arbitrumSepolia'): Promise<any> {
    try {
      // Ensure provider is ready
      await this.provider.ready;
      
      const destinationChainId = config.chains[destinationChain].chainId;
      
      // Get current counts
      const logosFound = await this.contract.logosFound();
      const personalCollection = await this.contract.personalCollection(userWallet);
      
      // Prepare discovery data
      const discoveryData = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [userWallet, logosFound.add(1), personalCollection.add(1)]
      );
      
      // Get quote
      const quote = await this.contract.quoteDispatch(destinationChainId, discoveryData);
      
      // Execute transaction
      const tx = await this.contract.findLogo(destinationChainId, userWallet, { value: quote });
      const receipt = await tx.wait();
      
      // Get updated counts
      const updatedLogosFound = await this.contract.logosFound();
      const updatedPersonalCollection = await this.contract.personalCollection(userWallet);
      
      return {
        success: true,
        userWallet,
        chain: destinationChain,
        message: 'Logo collection successful',
        totalLogos: updatedLogosFound.toString(),
        personalCollection: updatedPersonalCollection.toString(),
        quote: ethers.utils.formatEther(quote),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Blockchain transaction failed:', error);
      return {
        success: false,
        error: 'Blockchain transaction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkCollection(userWallet: string): Promise<any> {
    try {
      // Ensure provider is ready
      await this.provider.ready;
      
      const personalCollection = await this.contract.personalCollection(userWallet);
      const totalLogos = await this.contract.logosFound();
      const uniqueParticipants = await this.contract.uniqueParticipants();
      
      return {
        success: true,
        userWallet,
        collection: {
          personal: personalCollection.toNumber(),
          total: totalLogos.toNumber(),
          participants: uniqueParticipants.toNumber()
        }
      };
    } catch (error) {
      console.error('Failed to check collection:', error);
      return {
        success: false,
        error: 'Failed to check collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 