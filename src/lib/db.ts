import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty'
})

// Handle connection cleanup in serverless environment
if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'production') {
    // In production, disconnect after each request to avoid connection pool exhaustion
    const originalPrisma = prisma;
    
    // Override the prisma methods to auto-disconnect
    const createProxyWithDisconnect = (target: any) => {
      return new Proxy(target, {
        get(obj, prop) {
          const value = obj[prop];
          if (typeof value === 'function' && ['findMany', 'findFirst', 'findUnique', 'create', 'update', 'delete', 'upsert'].includes(prop as string)) {
            return async (...args: any[]) => {
              try {
                const result = await value.apply(obj, args);
                return result;
              } finally {
                // Disconnect after operation in serverless environment
                setTimeout(() => {
                  originalPrisma.$disconnect().catch(() => {});
                }, 0);
              }
            };
          }
          return value;
        }
      });
    };

    globalForPrisma.prisma = createProxyWithDisconnect(prisma);
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma