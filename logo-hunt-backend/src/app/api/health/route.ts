import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Logo Hunt Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/collect-logo': 'Collect a logo for a user wallet',
      'POST /api/check-collection': 'Check a user\'s logo collection',
      'GET /api/health': 'Health check endpoint'
    }
  });
} 