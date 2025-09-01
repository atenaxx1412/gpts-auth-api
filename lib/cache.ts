interface CacheEntry<T> {
  data: T
  expiry: number
  hits: number
  lastAccess: number
}

export class Cache<T = any> {
  private store = new Map<string, CacheEntry<T>>()
  private readonly defaultTtl: number
  
  constructor(defaultTtlMs: number = 300000) { // 5 minutes default
    this.defaultTtl = defaultTtlMs
  }
  
  set(key: string, data: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs || this.defaultTtl)
    this.store.set(key, {
      data,
      expiry,
      hits: 0,
      lastAccess: Date.now()
    })
  }
  
  get(key: string): T | null {
    const entry = this.store.get(key)
    
    if (!entry) {
      return null
    }
    
    if (Date.now() > entry.expiry) {
      this.store.delete(key)
      return null
    }
    
    entry.hits++
    entry.lastAccess = Date.now()
    return entry.data
  }
  
  has(key: string): boolean {
    return this.get(key) !== null
  }
  
  delete(key: string): boolean {
    return this.store.delete(key)
  }
  
  clear(): void {
    this.store.clear()
  }
  
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key)
        removed++
      }
    }
    
    return removed
  }
  
  getStats(): {
    size: number
    totalHits: number
    averageHits: number
    oldestEntry: number
    newestEntry: number
  } {
    if (this.store.size === 0) {
      return {
        size: 0,
        totalHits: 0,
        averageHits: 0,
        oldestEntry: 0,
        newestEntry: 0
      }
    }
    
    const entries = Array.from(this.store.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0)
    const lastAccesses = entries.map(entry => entry.lastAccess)
    
    return {
      size: this.store.size,
      totalHits,
      averageHits: totalHits / this.store.size,
      oldestEntry: Math.min(...lastAccesses),
      newestEntry: Math.max(...lastAccesses)
    }
  }
}

// Global cache instances
export const urlCache = new Cache<any>(600000) // 10 minutes for URL data
export const userCache = new Cache<any>(300000) // 5 minutes for user data
export const analyticsCache = new Cache<any>(1800000) // 30 minutes for analytics
export const logsCache = new Cache<any>(60000) // 1 minute for logs

// Cache key generators
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

// Cache wrapper for async functions
export function withCache<T extends any[], R>(
  cache: Cache<R>,
  keyGenerator: (...args: T) => string,
  ttlMs?: number
) {
  return function(fn: (...args: T) => Promise<R>) {
    return async (...args: T): Promise<R> => {
      const key = keyGenerator(...args)
      
      // Try to get from cache first
      const cached = cache.get(key)
      if (cached !== null) {
        return cached
      }
      
      // Execute function and cache result
      const result = await fn(...args)
      cache.set(key, result, ttlMs)
      return result
    }
  }
}

// Auto-cleanup every 2 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    urlCache.cleanup()
    userCache.cleanup()
    analyticsCache.cleanup()
    logsCache.cleanup()
  }, 120000)
}