# Chomper Hunt Stats Board

A comprehensive statistics dashboard for the Chomper Hunt game that displays global game statistics and individual player progress.

## Features

### 🏆 Global Statistics
- **Total Chompers Defeated**: Combined count across all networks
- **Active Hunters**: Number of unique participants
- **Network-specific Stats**: Separate counts for Sepolia and Arbitrum Sepolia
- **Real-time Updates**: Refresh button to get latest data

### 👤 Individual Player Stats
- **Personal Victories**: Total chompers defeated by a specific wallet
- **Network Breakdown**: Separate counts for each network
- **Progress Tracking**: Visual representation of victory progress

### 🏅 Real-Time Leaderboard
- **Top Hunters**: Live ranking of players by total victories
- **Network Performance**: Breakdown by network
- **Competitive Element**: Encourages friendly competition
- **Real Data**: Fetches actual player data from blockchain events

## API Endpoints

### GET /api/global-stats
Returns global game statistics without requiring a user wallet.

**Response:**
```json
{
  "success": true,
  "globalStats": {
    "sepolia": {
      "total": 150,
      "participants": 25
    },
    "arbitrumSepolia": {
      "total": 120,
      "participants": 20
    }
  },
  "totalChompersDefeated": 270,
  "totalParticipants": 25
}
```

### GET /api/leaderboard
Returns real-time leaderboard data by fetching player addresses from blockchain events.

**Response:**
```json
{
  "success": true,
  "topPlayers": [
    {
      "wallet": "0x1234...5678",
      "total": 15,
      "sepolia": 8,
      "arbitrumSepolia": 7
    }
  ],
  "totalPlayers": 25
}
```

### POST /api/check-collection
Returns individual player statistics.

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
  "victories": {
    "sepolia": 8,
    "arbitrumSepolia": 7,
    "total": 15
  },
  "globalStats": {
    "sepolia": { "total": 150, "participants": 25 },
    "arbitrumSepolia": { "total": 120, "participants": 20 }
  }
}
```

## Navigation

The stats board is accessible via:
- Navigation bar: "Stats Board" link
- Direct URL: `/stats`

## UI Features

- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Beautiful gradient backgrounds and card layouts
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages
- **Real-time Updates**: Refresh functionality
- **Visual Indicators**: Icons and color coding for different networks

## Technical Implementation

- **Next.js 14**: App Router with client components
- **TypeScript**: Full type safety
- **Tailwind CSS**: Modern styling
- **Web3 Integration**: Direct blockchain data fetching
- **Error Handling**: Graceful fallbacks for network issues

## Future Enhancements

- [ ] Real-time leaderboard updates
- [ ] Historical statistics
- [ ] Achievement system
- [ ] Social features (sharing, following)
- [ ] Advanced analytics and charts
- [ ] Mobile app integration 