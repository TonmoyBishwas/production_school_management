// Health Check API Endpoint
// Provides system health status for monitoring

import { NextRequest, NextResponse } from 'next/server';
import { getHealthStatus, ErrorLogger, asyncHandler } from '@/lib/error-handler';

export const GET = asyncHandler(async (request: Request) => {
  const healthStatus = await getHealthStatus();
  
  // Log health check
  ErrorLogger.info('Health check performed', {
    status: healthStatus.status,
    requestIp: request.headers.get('x-forwarded-for') || 'unknown'
  });

  const statusCode = healthStatus.status === 'healthy' ? 200 : 
                    healthStatus.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });
});

// Simple ping endpoint
export const POST = asyncHandler(async (request: Request) => {
  return NextResponse.json({
    pong: true,
    timestamp: new Date().toISOString(),
    server: 'healthy'
  });
});