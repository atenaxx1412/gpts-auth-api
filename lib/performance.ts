interface PerformanceMetric {
  id: string
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
  category: 'api' | 'database' | 'auth' | 'cache' | 'external'
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = []
  private static readonly MAX_METRICS = 1000
  
  static startTimer(name: string, category: PerformanceMetric['category'] = 'api'): string {
    const id = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const metric: PerformanceMetric = {
      id,
      name,
      duration: 0,
      timestamp: Date.now(),
      category
    }
    
    this.metrics.push(metric)
    return id
  }
  
  static endTimer(id: string, metadata?: Record<string, any>): number {
    const metric = this.metrics.find(m => m.id === id)
    if (!metric) {
      return -1
    }
    
    metric.duration = Date.now() - metric.timestamp
    metric.metadata = metadata
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
    
    // Log slow operations
    if (metric.duration > 5000) { // 5 seconds
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration}ms`)
    }
    
    return metric.duration
  }
  
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'api',
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startTimer(name, category)
    try {
      const result = await fn()
      this.endTimer(id, metadata)
      return result
    } catch (error) {
      this.endTimer(id, { ...metadata, error: String(error) })
      throw error
    }
  }
  
  static measure<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'api',
    metadata?: Record<string, any>
  ): T {
    const id = this.startTimer(name, category)
    try {
      const result = fn()
      this.endTimer(id, metadata)
      return result
    } catch (error) {
      this.endTimer(id, { ...metadata, error: String(error) })
      throw error
    }
  }
  
  static getMetrics(filters?: {
    category?: PerformanceMetric['category']
    since?: number
    minDuration?: number
    maxDuration?: number
  }): PerformanceMetric[] {
    let filtered = this.metrics.filter(m => m.duration > 0)
    
    if (filters) {
      if (filters.category) {
        filtered = filtered.filter(m => m.category === filters.category)
      }
      if (filters.since) {
        filtered = filtered.filter(m => m.timestamp >= filters.since!)
      }
      if (filters.minDuration) {
        filtered = filtered.filter(m => m.duration >= filters.minDuration!)
      }
      if (filters.maxDuration) {
        filtered = filtered.filter(m => m.duration <= filters.maxDuration!)
      }
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  static getStats(): {
    total: number
    byCategory: Record<PerformanceMetric['category'], {
      count: number
      avgDuration: number
      maxDuration: number
      minDuration: number
    }>
    slowOperations: PerformanceMetric[]
    last24Hours: number
  } {
    const completedMetrics = this.metrics.filter(m => m.duration > 0)
    const now = Date.now()
    const last24Hours = now - (24 * 60 * 60 * 1000)
    
    const byCategory: Record<PerformanceMetric['category'], {
      count: number
      avgDuration: number
      maxDuration: number
      minDuration: number
    }> = {
      api: { count: 0, avgDuration: 0, maxDuration: 0, minDuration: Infinity },
      database: { count: 0, avgDuration: 0, maxDuration: 0, minDuration: Infinity },
      auth: { count: 0, avgDuration: 0, maxDuration: 0, minDuration: Infinity },
      cache: { count: 0, avgDuration: 0, maxDuration: 0, minDuration: Infinity },
      external: { count: 0, avgDuration: 0, maxDuration: 0, minDuration: Infinity }
    }
    
    completedMetrics.forEach(metric => {
      const cat = byCategory[metric.category]
      cat.count++
      cat.maxDuration = Math.max(cat.maxDuration, metric.duration)
      cat.minDuration = Math.min(cat.minDuration, metric.duration)
    })
    
    // Calculate averages
    Object.values(byCategory).forEach(cat => {
      if (cat.count > 0) {
        const categoryMetrics = completedMetrics.filter(m => 
          Object.keys(byCategory).find(key => 
            byCategory[key as PerformanceMetric['category']] === cat
          ) === m.category
        )
        cat.avgDuration = categoryMetrics.reduce((sum, m) => sum + m.duration, 0) / cat.count
      } else {
        cat.minDuration = 0
      }
    })
    
    return {
      total: completedMetrics.length,
      byCategory,
      slowOperations: completedMetrics
        .filter(m => m.duration > 1000)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      last24Hours: completedMetrics.filter(m => m.timestamp >= last24Hours).length
    }
  }
  
  static clear(): void {
    this.metrics = []
  }
}

// Helper function for API performance tracking
export function withPerformanceTracking(
  operation: string,
  category: PerformanceMetric['category'] = 'api'
) {
  return function<T extends any[], R>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value!
    
    descriptor.value = async function(...args: T): Promise<R> {
      return PerformanceMonitor.measureAsync(
        `${operation}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        category,
        { args: args.length }
      )
    }
    
    return descriptor
  }
}

// Web Vitals tracking (client-side) - Optional feature
export function trackWebVitals() {
  if (typeof window !== 'undefined') {
    // Web Vitals tracking can be added by installing the web-vitals package
    console.log('Web Vitals tracking available - install web-vitals package to enable')
  }
}