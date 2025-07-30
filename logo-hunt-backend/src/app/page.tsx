'use client';

import { useState } from 'react';

export default function Home() {
  const [userWallet, setUserWallet] = useState('');
  const [chain, setChain] = useState('sepolia');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    details?: string;
    userWallet?: string;
    chain?: string;
    message?: string;
    totalLogos?: string;
    personalCollection?: string;
    quote?: string;
    collection?: {
      sepolia: number;
      arbitrumSepolia: number;
      total: number;
    };
    globalStats?: {
      sepolia: { total: number; participants: number };
      arbitrumSepolia: { total: number; participants: number };
    };
  } | null>(null);

  const collectLogo = async () => {
    if (!userWallet) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/collect-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userWallet, chain }),
      });
      
      const data = await response.json();
      setResult(data as typeof result);
    } catch (error) {
      setResult({ error: 'Failed to collect logo', details: error as string });
    } finally {
      setLoading(false);
    }
  };

  const checkCollection = async () => {
    if (!userWallet) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/check-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userWallet }),
      });
      
      const data = await response.json();
      setResult(data as typeof result);
    } catch (error) {
      setResult({ error: 'Failed to check collection', details: error as string });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🎮 Logo Hunt Backend
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Unity Integration Test</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Wallet Address
              </label>
              <input
                type="text"
                value={userWallet}
                onChange={(e) => setUserWallet(e.target.value)}
                placeholder="0x1234567890abcdef..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chain
              </label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sepolia">Sepolia</option>
                <option value="arbitrumsepolia">Arbitrum Sepolia</option>
              </select>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={collectLogo}
                disabled={loading || !userWallet}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Collecting...' : '🎯 Collect Logo'}
              </button>
              
              <button
                onClick={checkCollection}
                disabled={loading || !userWallet}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : '📊 Check Collection'}
              </button>
            </div>
          </div>
        </div>
        
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Result</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-green-600">POST /api/collect-logo</h3>
              <p className="text-gray-600">Collect a logo for a user wallet</p>
              <code className="text-sm bg-gray-100 p-2 rounded block mt-2">
                {`{
  "userWallet": "0x1234567890abcdef...",
  "chain": "sepolia" // or "arbitrumsepolia"
}`}
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-600">POST /api/check-collection</h3>
              <p className="text-gray-600">Check a user&apos;s logo collection</p>
              <code className="text-sm bg-gray-100 p-2 rounded block mt-2">
                {`{
  "userWallet": "0x1234567890abcdef..."
}`}
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold text-purple-600">GET /api/health</h3>
              <p className="text-gray-600">Health check endpoint</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
