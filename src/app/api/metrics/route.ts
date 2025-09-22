// Performance Metrics API
// Provides cache and performance statistics

import { NextRequest, NextResponse } from 'next/server';
import { appCache, PerformanceMonitor } from '@/lib/cache';
import { asyncHandler, AuthorizationError } from '@/lib/error-handler';

export const GET = asyncHandler(async (request: NextRequest) => {
  const userRole = request.headers.get('x-user-role');
  
  // Only superadmin can access metrics
  if (userRole !== 'superadmin') {
    throw new AuthorizationError('Access denied: Admin privileges required');
  }

  const cacheStats = appCache.getStats();
  const performanceMetrics = PerformanceMonitor.getAllMetrics();
  
  const memoryUsage = process.memoryUsage();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    cache: {
      size: cacheStats.size,
      maxSize: cacheStats.maxSize,
      utilizationPercentage: Math.round((cacheStats.size / cacheStats.maxSize) * 100),
      expiredEntries: cacheStats.entries.filter(e => e.expired).length
    },
    performance: performanceMetrics,
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
    },
    system: {
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform
    }
  };

  return NextResponse.json(metrics);
});

// Clear cache endpoint
export const DELETE = asyncHandler(async (request: NextRequest) => {
  const userRole = request.headers.get('x-user-role');
  
  if (userRole !== 'superadmin') {
    throw new AuthorizationError('Access denied: Admin privileges required');
  }

  appCache.clear();

  return NextResponse.json({
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
});