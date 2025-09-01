interface RateLimitConfig {
  requests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  count: number
  resetTime: number
  blocked: boolean
}

export class RateLimiter {
  private static store = new Map<string, RateLimitStore>()
  
  static check(key: string, config: RateLimitConfig): {
    allowed: boolean
    remaining: number
    resetTime: number
    total: number
  } {
    const now = Date.now()
    const record = this.store.get(key)
    
    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        blocked: false
      })
      
      return {
        allowed: true,
        remaining: config.requests - 1,
        resetTime: now + config.windowMs,
        total: config.requests
      }
    }
    
    const allowed = record.count < config.requests
    
    if (allowed) {
      record.count++
    } else {
      record.blocked = true
    }
    
    return {
      allowed,
      remaining: Math.max(0, config.requests - record.count),
      resetTime: record.resetTime,
      total: config.requests
    }
  }
  
  static getKey(identifier: string, endpoint?: string): string {
    return endpoint ? `${identifier}:${endpoint}` : identifier
  }
  
  static cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

export const RATE_LIMIT_CONFIGS = {
  API_V1: { requests: 100, windowMs: 60000 }, // 100 requests per minute
  API_ADMIN: { requests: 50, windowMs: 60000 }, // 50 requests per minute
  AUTH: { requests: 10, windowMs: 900000 }, // 10 requests per 15 minutes
  BULK_OPERATIONS: { requests: 5, windowMs: 300000 }, // 5 requests per 5 minutes
  PASSWORD_RESET: { requests: 3, windowMs: 3600000 } // 3 requests per hour
}

export function createRateLimitResponse(resetTime: number, total: number): Response {
  const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000)
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: resetSeconds
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': resetSeconds.toString(),
        'X-RateLimit-Limit': total.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString()
      }
    }
  )
}

// Auto-cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    RateLimiter.cleanup()
  }, 300000)
}