// In-Memory Caching System
// Optimizes performance for frequently accessed data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }

  // Remove expired entries
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
    
    if (toDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${toDelete.length} expired entries`);
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        expired: Date.now() - entry.timestamp > entry.ttl
      }))
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Global cache instance
export const appCache = new InMemoryCache(1000);

// Cache key generators
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  school: (schoolId: string) => `school:${schoolId}`,
  students: (schoolId: string, page: number = 1) => `students:${schoolId}:${page}`,
  teachers: (schoolId: string) => `teachers:${schoolId}`,
  subjects: (schoolId: string) => `subjects:${schoolId}`,
  schedules: (schoolId: string, grade: number, section: string) => `schedules:${schoolId}:${grade}:${section}`,
  attendance: (schoolId: string, date: string) => `attendance:${schoolId}:${date}`,
  homework: (schoolId: string, grade: number, section: string) => `homework:${schoolId}:${grade}:${section}`,
  studentPhotos: (studentId: string) => `photos:${studentId}`,
  dashboard: (role: string, userId: string) => `dashboard:${role}:${userId}`
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  USER_DATA: 300,        // 5 minutes
  SCHOOL_DATA: 600,      // 10 minutes
  STUDENTS_LIST: 300,    // 5 minutes
  TEACHERS_LIST: 600,    // 10 minutes
  SUBJECTS: 1800,        // 30 minutes
  SCHEDULES: 3600,       // 1 hour
  ATTENDANCE: 180,       // 3 minutes
  HOMEWORK: 300,         // 5 minutes
  PHOTOS: 3600,          // 1 hour
  DASHBOARD: 180         // 3 minutes
};

// Helper function to cache database queries
export async function cacheQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = appCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query and cache result
  const result = await queryFn();
  appCache.set(key, result, ttlSeconds);
  
  return result;
}

// Cache invalidation helpers
export const CacheInvalidation = {
  user: (userId: string) => {
    appCache.delete(CacheKeys.user(userId));
  },
  
  school: (schoolId: string) => {
    appCache.delete(CacheKeys.school(schoolId));
    // Also invalidate related data
    appCache.delete(CacheKeys.students(schoolId));
    appCache.delete(CacheKeys.teachers(schoolId));
    appCache.delete(CacheKeys.subjects(schoolId));
  },
  
  students: (schoolId: string) => {
    // Invalidate all student-related caches for this school
    const stats = appCache.getStats();
    const toDelete = stats.entries
      .filter(entry => entry.key.startsWith(`students:${schoolId}`))
      .map(entry => entry.key);
    
    toDelete.forEach(key => appCache.delete(key));
  },
  
  attendance: (schoolId: string, date?: string) => {
    if (date) {
      appCache.delete(CacheKeys.attendance(schoolId, date));
    } else {
      // Invalidate all attendance caches for school
      const stats = appCache.getStats();
      const toDelete = stats.entries
        .filter(entry => entry.key.startsWith(`attendance:${schoolId}`))
        .map(entry => entry.key);
      
      toDelete.forEach(key => appCache.delete(key));
    }
  },
  
  dashboard: (role: string, userId: string) => {
    appCache.delete(CacheKeys.dashboard(role, userId));
  }
};

// Database query optimization helpers
export const QueryOptimization = {
  // Batch multiple database queries
  batchQueries: async <T>(queries: (() => Promise<T>)[]): Promise<T[]> => {
    return Promise.all(queries.map(query => query()));
  },

  // Paginate large result sets
  paginate: <T>(items: T[], page: number = 1, limit: number = 20) => {
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);
    
    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
        hasNext: offset + limit < items.length,
        hasPrev: page > 1
      }
    };
  }
};

// Image optimization cache
export class ImageCache {
  private static cache = new Map<string, { blob: Blob; timestamp: number }>();
  private static readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  static async get(url: string): Promise<Blob | null> {
    const cached = this.cache.get(url);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.blob;
    }
    
    // Remove expired entry
    if (cached) {
      this.cache.delete(url);
    }
    
    return null;
  }

  static set(url: string, blob: Blob): void {
    // Limit cache size
    if (this.cache.size >= 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(url, {
      blob,
      timestamp: Date.now()
    });
  }

  static clear(): void {
    this.cache.clear();
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static startTimer(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }

  static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  static getMetrics(operation: string) {
    const metrics = this.metrics.get(operation) || [];
    
    if (metrics.length === 0) {
      return null;
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    
    return {
      count: metrics.length,
      avg: metrics.reduce((sum, val) => sum + val, 0) / metrics.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  static getAllMetrics() {
    const result: Record<string, any> = {};
    
    for (const [operation, _] of Array.from(this.metrics)) {
      result[operation] = this.getMetrics(operation);
    }
    
    return result;
  }
}

// Export singleton instance
export default appCache;