# Logo Hunt Backend

A Next.js backend API for the cross-chain logo collection game. This backend manages blockchain transactions and provides REST API endpoints for Unity game integration.

## Features

- 🎮 **Unity Integration** - REST API endpoints for game integration
- 🔗 **Cross-Chain Support** - Collect logos on Sepolia and Arbitrum Sepolia
- 👤 **User Wallet Tracking** - Track personal collections per wallet address
- 🚀 **Backend Transaction Management** - All transactions sent from backend wallet
- 📊 **Collection Queries** - Check user collections and global stats
- ⚡ **Web3.js Integration** - Modern Web3.js for blockchain interactions

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the backend directory:
   ```env
   PRIVATE_KEY=your_backend_private_key
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   ARBITRUM_SEPOLIA_RPC_URL=your_arbitrum_sepolia_rpc_url
   SEPOLIA_CONTRACT_ADDRESS=your_sepolia_contract_address
   ARBITRUM_SEPOLIA_CONTRACT_ADDRESS=your_arbitrum_sepolia_contract_address
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

3. **Deploy contracts first:**
   ```bash
   cd ..
   npm run deploy
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

**Base URL:** `https://tee-nexus-demo.vercel.app` (production) or `http://localhost:3000` (development)

### POST /api/collect-logo-web3
**URL:** `https://tee-nexus-demo.vercel.app/api/collect-logo-web3`

Collect a logo for a user wallet using Web3.js.

**Request:**
```json
{
  "userWallet": "0x1234567890abcdef...",
  "chain": "sepolia" // or "arbitrumSepolia"
}
```

**Response:**
```json
{
  "success": true,
  "userWallet": "0x1234567890abcdef...",
  "chain": "sepolia",
  "message": "Logo collection successful",
  "totalLogos": "5",
  "personalCollection": "3",
  "quote": "0.000031460400000001",
  "transactionHash": "0x36f64cdedbeedd5f39636445e1b89975172d1a44a73d5f644561de5b213949b9"
}
```

### POST /api/collect-logo
**URL:** `https://tee-nexus-demo.vercel.app/api/collect-logo`

Collect a logo for a user wallet (legacy endpoint).

**Request:**
```json
{
  "userWallet": "0x1234567890abcdef...",
  "chain": "sepolia" // or "arbitrumsepolia"
}
```

**Response:**
```json
{
  "success": true,
  "userWallet": "0x1234567890abcdef...",
  "chain": "sepolia",
  "message": "Logo collection initiated successfully",
  "totalLogos": "5",
  "personalCollection": "3",
  "quote": "0.000031460400000001"
}
```

### POST /api/check-collection
**URL:** `https://tee-nexus-demo.vercel.app/api/check-collection`

Check a user's logo collection using Web3.js.

**Request:**
```json
{
  "userWallet": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "userWallet": "0x1234567890abcdef...",
  "collection": {
    "sepolia": 2,
    "arbitrumSepolia": 1,
    "total": 3
  },
  "globalStats": {
    "sepolia": { "total": 15, "participants": 8 },
    "arbitrumSepolia": { "total": 12, "participants": 6 }
  }
}
```

### GET /api/health
**URL:** `https://tee-nexus-demo.vercel.app/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "Logo Hunt Backend",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "endpoints": {
    "POST /api/collect-logo-web3": "Collect a logo for a user wallet (Web3.js)",
    "POST /api/collect-logo": "Collect a logo for a user wallet (legacy)",
    "POST /api/check-collection": "Check a user's logo collection",
    "GET /api/health": "Health check endpoint"
  }
}
```

## Unity Integration

### Collecting Logos (Recommended)
```csharp
// Unity C# example - using the new Web3.js endpoint
public async Task CollectLogo(string userWallet, string chain = "sepolia")
{
    var request = new
    {
        userWallet = userWallet,
        chain = chain
    };
    
    var response = await httpClient.PostAsJsonAsync("https://tee-nexus-demo.vercel.app/api/collect-logo-web3", request);
    var result = await response.Content.ReadFromJsonAsync<CollectLogoResponse>();
    
    Debug.Log($"Collected logo for {result.userWallet}");
    Debug.Log($"Transaction: {result.transactionHash}");
}
```

### Checking Collections
```csharp
// Unity C# example
public async Task<CollectionData> CheckCollection(string userWallet)
{
    var request = new { userWallet = userWallet };
    
    var response = await httpClient.PostAsJsonAsync("https://tee-nexus-demo.vercel.app/api/check-collection", request);
    var result = await response.Content.ReadFromJsonAsync<CollectionResponse>();
    
    return result.collection;
}
```

## Development

### Testing the API
1. Start the development server: `npm run dev`
2. Open http://localhost:3000
3. Use the web interface to test API endpoints
4. Check the console for detailed logs

### Environment Variables
- `PRIVATE_KEY`: Backend wallet private key for sending transactions
- `SEPOLIA_RPC_URL`: Sepolia testnet RPC URL
- `ARBITRUM_SEPOLIA_RPC_URL`: Arbitrum Sepolia testnet RPC URL
- `SEPOLIA_CONTRACT_ADDRESS`: Deployed contract address on Sepolia
- `ARBITRUM_SEPOLIA_CONTRACT_ADDRESS`: Deployed contract address on Arbitrum Sepolia
- `ETHERSCAN_API_KEY`: Etherscan API key for contract verification

### Technology Stack
- **Next.js**: React framework for API routes
- **Web3.js**: Modern Web3 library for blockchain interactions
- **TypeScript**: Type-safe development
- **Hardhat**: Smart contract development and deployment

### Deployment
The backend can be deployed to Vercel, Netlify, or any other Next.js hosting platform.

## Architecture

- **Backend Wallet**: Sends all blockchain transactions
- **User Wallets**: Tracked for personal collections
- **Cross-Chain Sync**: Collections synchronized across chains
- **REST API**: Simple endpoints for Unity integration
- **Web3.js**: Modern blockchain interaction library

## Security Notes

- Backend private key should be kept secure
- Consider rate limiting for production
- Validate all user inputs
- Monitor transaction costs and gas usage
- Use environment variables for sensitive configuration
