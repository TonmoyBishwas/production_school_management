// Centralized Error Handling and Logging
// Production-ready error management with proper logging

import { NextResponse } from 'next/server';
import { config } from './config';

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: any;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, true, details);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: any) {
    super(`External service error: ${service}`, 502, true, details);
    this.name = 'ExternalServiceError';
  }
}

// Error logging utility
export class ErrorLogger {
  static log(error: Error, context?: any) {
    const timestamp = new Date().toISOString();
    const logLevel = error instanceof AppError && error.statusCode < 500 ? 'WARN' : 'ERROR';
    
    const logEntry = {
      timestamp,
      level: logLevel,
      error: {
        name: error.name,
        message: error.message,
        stack: config.app.nodeEnv === 'development' ? error.stack : undefined,
        statusCode: error instanceof AppError ? error.statusCode : 500,
        isOperational: error instanceof AppError ? error.isOperational : false,
        details: error instanceof AppError ? error.details : undefined
      },
      context,
      environment: config.app.nodeEnv,
      version: config.app.version
    };

    // Log to console (Vercel captures these)
    if (logLevel === 'ERROR') {
      console.error('🚨 ERROR:', JSON.stringify(logEntry, null, 2));
    } else {
      console.warn('⚠️  WARNING:', JSON.stringify(logEntry, null, 2));
    }

    // TODO: In production, send to external monitoring service
    // if (config.monitoring.sentryDsn) {
    //   Sentry.captureException(error, { extra: context });
    // }
  }

  static info(message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      data,
      environment: config.app.nodeEnv
    };
    
    console.log('ℹ️  INFO:', JSON.stringify(logEntry, null, 2));
  }

  static debug(message: string, data?: any) {
    if (config.app.nodeEnv === 'development') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        message,
        data
      };
      
      console.debug('🐛 DEBUG:', JSON.stringify(logEntry, null, 2));
    }
  }
}

// API Error Handler
export function handleApiError(error: Error, request?: Request): NextResponse<ErrorResponse> {
  ErrorLogger.log(error, {
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent')
  });

  let statusCode = 500;
  let message = 'Internal server error';
  let details;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = config.app.nodeEnv === 'development' ? error.details : undefined;
  } else if (error.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed';
    details = config.app.nodeEnv === 'development' ? error.message : undefined;
  } else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  const errorResponse: ErrorResponse = {
    error: error.name,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: request?.url,
    details: config.app.nodeEnv === 'development' ? details : undefined
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

// Async error wrapper for API routes
export function asyncHandler(
  handler: (request: Request, ...args: any[]) => Promise<Response>
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return handleApiError(error instanceof Error ? error : new Error(String(error)), request);
    }
  };
}

// Validation helper
export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = config.rateLimit.max): void {
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return;
  }
  
  if (record.count >= maxRequests) {
    throw new RateLimitError(`Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000} seconds`);
  }
  
  record.count++;
}

// Cleanup old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of Array.from(rateLimitMap.entries())) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Health check utility
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: 'up' | 'down' | 'degraded';
    storage: 'up' | 'down' | 'degraded';
    auth: 'up' | 'down' | 'degraded';
  };
  metrics: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  const services: HealthStatus['services'] = {
    database: 'up',
    storage: 'up',
    auth: 'up'
  };

  // Check database
  try {
    const { prisma } = await import('./db');
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    services.database = 'down';
    ErrorLogger.log(new Error('Database health check failed'), { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  // Check storage (Vercel Blob)
  try {
    if (!config.storage.blobToken) {
      services.storage = 'degraded';
    }
  } catch (error) {
    services.storage = 'down';
  }

  // Check auth configuration
  try {
    if (!config.jwt.secret || config.jwt.secret.length < 32) {
      services.auth = 'degraded';
    }
  } catch (error) {
    services.auth = 'down';
  }

  // Determine overall status
  const hasDown = Object.values(services).includes('down');
  const hasDegraded = Object.values(services).includes('degraded');
  
  let status: 'healthy' | 'unhealthy' | 'degraded';
  if (hasDown) {
    status = 'unhealthy';
  } else if (hasDegraded) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  return {
    status,
    timestamp: new Date().toISOString(),
    version: config.app.version,
    environment: config.app.nodeEnv,
    services,
    metrics: {
      uptime: process.uptime(),
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      }
    }
  };
}