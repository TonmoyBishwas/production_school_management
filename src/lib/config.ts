// Application Configuration
// Centralized configuration management with validation

interface Config {
  // Database
  database: {
    url: string;
    directUrl?: string;
    shadowUrl?: string;
  };
  
  // Security
  jwt: {
    secret: string;
    expiresIn: string;
  };
  
  nextAuth: {
    secret: string;
    url: string;
  };
  
  bcrypt: {
    rounds: number;
  };
  
  password: {
    minLength: number;
  };
  
  session: {
    timeoutHours: number;
  };
  
  // Storage
  storage: {
    blobToken?: string;
    uploadPath: string;
  };
  
  // App
  app: {
    name: string;
    version: string;
    nodeEnv: string;
  };
  
  // Rate Limiting
  rateLimit: {
    max: number;
    windowMs: number;
  };
  
  // Monitoring
  monitoring: {
    sentryDsn?: string;
  };
}

function validateEnvironment(): Config {
  // Only validate environment variables on the server-side
  if (typeof window === 'undefined') {
    // Required environment variables
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  // Validate JWT secret strength (server-side only)
  if (typeof window === 'undefined' && process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
    }

    // Validate production environment
    if (process.env.NODE_ENV === 'production') {
      const prodSecrets = ['JWT_SECRET', 'NEXTAUTH_SECRET'];
      const weakSecrets = prodSecrets.filter(secret =>
        process.env[secret]?.includes('local-dev') ||
        process.env[secret]?.includes('change-in-production')
      );

      if (weakSecrets.length > 0) {
        throw new Error(`Production environment detected with weak secrets: ${weakSecrets.join(', ')}`);
      }

      if (!process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
        console.warn('Warning: VERCEL_BLOB_READ_WRITE_TOKEN not set. File uploads will fail.');
      }
    }
  }
  
  return {
    database: {
      url: process.env.DATABASE_URL || '',
      directUrl: process.env.DATABASE_DIRECT_URL,
      shadowUrl: process.env.SHADOW_DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    },
    nextAuth: {
      secret: process.env.NEXTAUTH_SECRET || '',
      url: process.env.NEXTAUTH_URL || '',
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    },
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    },
    session: {
      timeoutHours: parseInt(process.env.SESSION_TIMEOUT_HOURS || '8'),
    },
    storage: {
      blobToken: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
      uploadPath: process.env.UPLOAD_PATH || './public/storage',
    },
    app: {
      name: process.env.APP_NAME || 'School Management System',
      version: process.env.APP_VERSION || '1.0.0',
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
    },
    monitoring: {
      sentryDsn: process.env.SENTRY_DSN,
    },
  };
}

// Export validated configuration
export const config = validateEnvironment();

// Helper functions
export const isDevelopment = config.app.nodeEnv === 'development';
export const isProduction = config.app.nodeEnv === 'production';
export const isTest = config.app.nodeEnv === 'test';

// Security helpers
export function generateSecureSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
}

export function validateSecretStrength(secret: string): boolean {
  return secret.length >= 32 && 
         !/^(local-dev|change-in-production|your-)/i.test(secret);
}

// Database connection string helpers
export function isDatabaseReady(): boolean {
  return !!config.database.url && !config.database.url.includes('localhost');
}

export function getConnectionPoolConfig() {
  return {
    max: isProduction ? 20 : 5,
    min: isProduction ? 5 : 1,
    acquire: 30000,
    idle: 10000,
  };
}