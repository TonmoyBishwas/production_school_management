// Vercel Cron Job for Automated Training Data Sync

export const dynamic = 'force-dynamic';
// Runs daily at 2 AM to sync images for face recognition

import { NextRequest, NextResponse } from 'next/server';
import { syncImagesFromBlob } from '@/lib/storage';

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('🔄 Starting automated training data sync...');
    
    const startTime = Date.now();
    
    // Sync images from Vercel Blob to local structure
    await syncImagesFromBlob('./training-data');
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`✅ Training data sync completed in ${duration} seconds`);
    
    return NextResponse.json({
      success: true,
      message: 'Training data sync completed',
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Training data sync failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Training data sync failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Health check endpoint
export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'training-data-sync',
    timestamp: new Date().toISOString()
  });
}