'use client';

import React, { useState, useEffect } from 'react';

interface GlobalStats {
  sepolia: { total: number; participants: number };
  arbitrumSepolia: { total: number; participants: number };
}

interface UserStats {
  sepolia: number;
  arbitrumSepolia: number;
  total: number;
}

interface StatsData {
  globalStats: GlobalStats;
  topPlayers?: Array<{
    wallet: string;
    total: number;
    sepolia: number;
    arbitrumSepolia: number;
  }>;
}

export default function StatsBoard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [userWallet, setUserWallet] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch global stats
  const fetchGlobalStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [globalResponse, leaderboardResponse] = await Promise.all([
        fetch('/api/global-stats'),
        fetch('/api/leaderboard')
      ]);
      
      const globalData = await globalResponse.json();
      const leaderboardData = await leaderboardResponse.json();
      
      if (globalData.success && leaderboardData.success) {
        setStats({
          globalStats: globalData.globalStats,
          topPlayers: leaderboardData.topPlayers
        });
      } else {
        setError('Failed to fetch stats');
      }
    } catch (error) {
      setError('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user stats
  const fetchUserStats = async () => {
    if (!userWallet) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userWallet }),
      });
      
      const data = await response.json();
      if (data.success) {
        setUserStats(data.collection);
      } else {
        setError('Failed to fetch user stats');
      }
    } catch (error) {
      setError('Failed to fetch user stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const totalLogos = stats ? 
    stats.globalStats.sepolia.total + stats.globalStats.arbitrumSepolia.total : 0;
  
  const totalParticipants = stats ? 
    Math.max(stats.globalStats.sepolia.participants, stats.globalStats.arbitrumSepolia.participants) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🏆 Chomper Hunt Stats Board
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Track your victories and compete with other hunters
          </p>
          <button
            onClick={fetchGlobalStats}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>

        {/* Global Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                                 <div className="ml-4">
                   <p className="text-sm font-medium text-gray-600">Total Chompers Defeated</p>
                   <p className="text-2xl font-bold text-gray-900">{totalLogos.toLocaleString()}</p>
                 </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Hunters</p>
                  <p className="text-2xl font-bold text-gray-900">{totalParticipants.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                                 <div className="ml-4">
                   <p className="text-sm font-medium text-gray-600">Sepolia Chompers Defeated</p>
                   <p className="text-2xl font-bold text-gray-900">{stats.globalStats.sepolia.total.toLocaleString()}</p>
                 </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                                 <div className="ml-4">
                   <p className="text-sm font-medium text-gray-600">Arbitrum Chompers Defeated</p>
                   <p className="text-2xl font-bold text-gray-900">{stats.globalStats.arbitrumSepolia.total.toLocaleString()}</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Chain-specific Stats */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                Sepolia Network
              </h3>
              <div className="grid grid-cols-2 gap-4">
                                 <div className="text-center">
                   <p className="text-3xl font-bold text-purple-600">{stats.globalStats.sepolia.total}</p>
                   <p className="text-sm text-gray-600">Chompers Defeated</p>
                 </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{stats.globalStats.sepolia.participants}</p>
                  <p className="text-sm text-gray-600">Hunters</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                Arbitrum Sepolia Network
              </h3>
              <div className="grid grid-cols-2 gap-4">
                                 <div className="text-center">
                   <p className="text-3xl font-bold text-orange-600">{stats.globalStats.arbitrumSepolia.total}</p>
                   <p className="text-sm text-gray-600">Chompers Defeated</p>
                 </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{stats.globalStats.arbitrumSepolia.participants}</p>
                  <p className="text-sm text-gray-600">Hunters</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Stats Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Check Your Stats</h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Wallet Address
              </label>
              <input
                type="text"
                value={userWallet}
                onChange={(e) => setUserWallet(e.target.value)}
                placeholder="0x1234567890abcdef..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchUserStats}
                disabled={loading || !userWallet}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Loading...' : 'Check Stats'}
              </button>
            </div>
          </div>

          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                                 <h4 className="text-lg font-semibold mb-2">Your Total Victories</h4>
                 <p className="text-4xl font-bold">{userStats.total}</p>
                 <p className="text-blue-100 text-sm">Chompers defeated</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                                 <h4 className="text-lg font-semibold mb-2">Sepolia Victories</h4>
                 <p className="text-4xl font-bold">{userStats.sepolia}</p>
                 <p className="text-purple-100 text-sm">Chompers defeated on Sepolia</p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                                 <h4 className="text-lg font-semibold mb-2">Arbitrum Victories</h4>
                 <p className="text-4xl font-bold">{userStats.arbitrumSepolia}</p>
                 <p className="text-orange-100 text-sm">Chompers defeated on Arbitrum</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        {stats?.topPlayers && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">🏆 Top Hunters</h2>
              <div className="text-sm text-gray-500">
                {stats.topPlayers.length} active hunters
              </div>
            </div>
            
            {stats.topPlayers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Hunter</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Victories</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Sepolia</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Arbitrum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPlayers.map((player, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                            {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                            {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                            {index > 2 && <span className="text-lg font-bold text-gray-400 mr-2">#{index + 1}</span>}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-900 font-mono">{player.wallet}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-bold text-lg text-blue-600">{player.total}</span>
                        </td>
                        <td className="py-4 px-4 text-center text-purple-600">{player.sepolia}</td>
                        <td className="py-4 px-4 text-center text-orange-600">{player.arbitrumSepolia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">No hunters yet</div>
                <div className="text-gray-500 text-sm">Be the first to defeat some chompers!</div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
} 