# Logo Hunt Backend

A Next.js backend API for the cross-chain logo collection game. This backend manages blockchain transactions and provides REST API endpoints for Unity game integration.

## Features

- 🎮 **Unity Integration** - REST API endpoints for game integration
- 🔗 **Cross-Chain Support** - Collect logos on Sepolia and Arbitrum Sepolia
- 👤 **User Wallet Tracking** - Track personal collections per wallet address
- 🚀 **Backend Transaction Management** - All transactions sent from backend wallet
- 📊 **Collection Queries** - Check user collections and global stats

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the backend directory:
   ```env
   PRIVATE_KEY=your_backend_private_key
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

**Base URL:** `http://localhost:3000` (development) or your deployed URL

### POST /api/collect-logo
**URL:** `http://localhost:3000/api/collect-logo`

Collect a logo for a user wallet.

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
**URL:** `http://localhost:3000/api/check-collection`

Check a user's logo collection.

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
**URL:** `http://localhost:3000/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "Logo Hunt Backend",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "endpoints": {
    "POST /api/collect-logo": "Collect a logo for a user wallet",
    "POST /api/check-collection": "Check a user's logo collection",
    "GET /api/health": "Health check endpoint"
  }
}
```

## Unity Integration

### Collecting Logos
```csharp
// Unity C# example
public async Task CollectLogo(string userWallet, string chain = "sepolia")
{
    var request = new
    {
        userWallet = userWallet,
        chain = chain
    };
    
    var response = await httpClient.PostAsJsonAsync("http://localhost:3000/api/collect-logo", request);
    var result = await response.Content.ReadFromJsonAsync<CollectLogoResponse>();
    
    Debug.Log($"Collected logo for {result.userWallet}");
}
```

### Checking Collections
```csharp
// Unity C# example
public async Task<CollectionData> CheckCollection(string userWallet)
{
    var request = new { userWallet = userWallet };
    
    var response = await httpClient.PostAsJsonAsync("http://localhost:3000/api/check-collection", request);
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
- `ETHERSCAN_API_KEY`: Etherscan API key for contract verification

### Deployment
The backend can be deployed to Vercel, Netlify, or any other Next.js hosting platform.

## Architecture

- **Backend Wallet**: Sends all blockchain transactions
- **User Wallets**: Tracked for personal collections
- **Cross-Chain Sync**: Collections synchronized across chains
- **REST API**: Simple endpoints for Unity integration

## Security Notes

- Backend private key should be kept secure
- Consider rate limiting for production
- Validate all user inputs
- Monitor transaction costs and gas usage
