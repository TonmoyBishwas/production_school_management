// API Route Wrapper with Security, Caching, and Error Handling
// Standardizes all API endpoints with consistent patterns

import { NextRequest, NextResponse } from 'next/server';
import { withSecurityContext, extractSecurityContext } from './rls';
import { cacheQuery, CacheKeys, CacheTTL, PerformanceMonitor } from './cache';
import { asyncHandler, checkRateLimit, validateRequired, ErrorLogger } from './error-handler';

export interface ApiRouteConfig {
  requireAuth?: boolean;
  allowedRoles?: string[];
  rateLimit?: {
    max: number;
    windowMs?: number;
  };
  cache?: {
    enabled: boolean;
    ttl?: number;
    keyGenerator?: (request: NextRequest) => string;
  };
}

export function withApiWrapper(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  config: ApiRouteConfig = {}
) {
  return asyncHandler(async (request: NextRequest) => {
    const timer = PerformanceMonitor.startTimer(`api:${request.url}`);
    
    try {
      // Rate limiting
      if (config.rateLimit) {
        const identifier = request.headers.get('x-forwarded-for') || 
                          request.headers.get('x-real-ip') || 
                          'unknown';
        checkRateLimit(
          identifier, 
          config.rateLimit.max, 
          config.rateLimit.windowMs
        );
      }

      // Authentication check
      if (config.requireAuth !== false) {
        const securityContext = extractSecurityContext(request.headers);
        
        // Role-based authorization
        if (config.allowedRoles && !config.allowedRoles.includes(securityContext.userRole)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        // Execute with security context
        return await withSecurityContext(securityContext, async () => {
          // Check cache first
          if (config.cache?.enabled && request.method === 'GET') {
            const cacheKey = config.cache.keyGenerator?.(request) || 
                           `api:${request.url}:${securityContext.schoolId}`;
            
            return await cacheQuery(
              cacheKey,
              () => handler(request, { securityContext }),
              config.cache.ttl || CacheTTL.USER_DATA
            );
          }

          return await handler(request, { securityContext });
        });
      }

      // Execute without security context
      return await handler(request, {});
      
    } finally {
      timer();
    }
  });
}

// Predefined configurations for common patterns
export const ApiConfigs = {
  PUBLIC: {
    requireAuth: false
  },
  
  AUTHENTICATED: {
    requireAuth: true
  },
  
  ADMIN_ONLY: {
    requireAuth: true,
    allowedRoles: ['admin'],
    rateLimit: { max: 100 }
  },
  
  SUPERADMIN_ONLY: {
    requireAuth: true,
    allowedRoles: ['superadmin'],
    rateLimit: { max: 200 }
  },
  
  TEACHER_ONLY: {
    requireAuth: true,
    allowedRoles: ['teacher'],
    rateLimit: { max: 150 },
    cache: {
      enabled: true,
      ttl: CacheTTL.SCHEDULES
    }
  },
  
  STUDENT_PARENT: {
    requireAuth: true,
    allowedRoles: ['student', 'parent'],
    rateLimit: { max: 50 },
    cache: {
      enabled: true,
      ttl: CacheTTL.DASHBOARD
    }
  },
  
  FILE_UPLOAD: {
    requireAuth: true,
    allowedRoles: ['admin', 'teacher'],
    rateLimit: { max: 10 } // Stricter for file uploads
  }
};

// Standard response helpers
export const ApiResponse = {
  success: (data: any, message?: string) => {
    return NextResponse.json({
      success: true,
      message: message || 'Operation completed successfully',
      data,
      timestamp: new Date().toISOString()
    });
  },

  error: (message: string, statusCode: number = 400, details?: any) => {
    return NextResponse.json({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  },

  paginated: (items: any[], pagination: any, message?: string) => {
    return NextResponse.json({
      success: true,
      message: message || 'Data retrieved successfully',
      data: items,
      pagination,
      timestamp: new Date().toISOString()
    });
  }
};

// Validation helpers
export const ApiValidation = {
  requiredFields: (data: any, fields: string[]) => {
    validateRequired(data, fields);
  },

  positiveInteger: (value: any, fieldName: string) => {
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) {
      throw new Error(`${fieldName} must be a positive integer`);
    }
    return num;
  },

  validEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return email;
  },

  validPhone: (phone: string) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone number format');
    }
    return phone;
  },

  validGrade: (grade: number) => {
    if (grade < 1 || grade > 12) {
      throw new Error('Grade must be between 1 and 12');
    }
    return grade;
  }
};

// Logging helpers
export const ApiLogger = {
  request: (request: NextRequest, context?: any) => {
    ErrorLogger.info('API Request', {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userId: context?.securityContext?.userId,
      schoolId: context?.securityContext?.schoolId
    });
  },

  success: (operation: string, data?: any) => {
    ErrorLogger.info(`API Success: ${operation}`, data);
  },

  warning: (operation: string, details?: any) => {
    ErrorLogger.log(new Error(`API Warning: ${operation}`), details);
  }
};