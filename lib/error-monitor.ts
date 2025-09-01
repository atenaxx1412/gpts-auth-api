export interface ErrorLog {
  id: string
  timestamp: number
  error: {
    message: string
    stack?: string
    name: string
  }
  context: {
    userId?: string
    endpoint: string
    method: string
    userAgent?: string
    ip?: string
    requestId: string
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
}

export class ErrorMonitor {
  private static errors: ErrorLog[] = []
  private static readonly MAX_ERRORS = 1000
  
  static log(
    error: Error,
    context: Partial<ErrorLog['context']>,
    severity: ErrorLog['severity'] = 'medium'
  ): string {
    const errorId = this.generateErrorId()
    const errorLog: ErrorLog = {
      id: errorId,
      timestamp: Date.now(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: {
        endpoint: context.endpoint || 'unknown',
        method: context.method || 'unknown',
        userAgent: context.userAgent,
        ip: context.ip,
        userId: context.userId,
        requestId: context.requestId || this.generateRequestId()
      },
      severity,
      resolved: false
    }
    
    this.errors.push(errorLog)
    
    // Keep only the most recent errors
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS)
    }
    
    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}] ${errorLog.id}:`, {
        error: errorLog.error,
        context: errorLog.context
      })
    }
    
    // In production, you would send to external service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production' && severity === 'critical') {
      this.alertCriticalError(errorLog)
    }
    
    return errorId
  }
  
  static getErrors(filters?: {
    severity?: ErrorLog['severity']
    resolved?: boolean
    since?: number
    endpoint?: string
  }): ErrorLog[] {
    let filtered = this.errors
    
    if (filters) {
      if (filters.severity) {
        filtered = filtered.filter(e => e.severity === filters.severity)
      }
      if (filters.resolved !== undefined) {
        filtered = filtered.filter(e => e.resolved === filters.resolved)
      }
      if (filters.since) {
        filtered = filtered.filter(e => e.timestamp >= filters.since!)
      }
      if (filters.endpoint) {
        filtered = filtered.filter(e => e.context.endpoint.includes(filters.endpoint!))
      }
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  static getStats(): {
    total: number
    bySeverity: Record<ErrorLog['severity'], number>
    unresolved: number
    last24Hours: number
  } {
    const now = Date.now()
    const last24Hours = now - (24 * 60 * 60 * 1000)
    
    const stats = {
      total: this.errors.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      } as Record<ErrorLog['severity'], number>,
      unresolved: 0,
      last24Hours: 0
    }
    
    this.errors.forEach(error => {
      stats.bySeverity[error.severity]++
      if (!error.resolved) stats.unresolved++
      if (error.timestamp >= last24Hours) stats.last24Hours++
    })
    
    return stats
  }
  
  static resolveError(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      return true
    }
    return false
  }
  
  static clearResolved(): number {
    const before = this.errors.length
    this.errors = this.errors.filter(e => !e.resolved)
    return before - this.errors.length
  }
  
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private static alertCriticalError(errorLog: ErrorLog): void {
    // In production, this would integrate with alerting services
    console.error('CRITICAL ERROR ALERT:', errorLog)
    
    // Could integrate with:
    // - Slack/Discord webhooks
    // - Email notifications
    // - PagerDuty
    // - Sentry
  }
}

export function withErrorMonitoring<T extends any[], R>(
  fn: (...args: T) => R | Promise<R>,
  context: Partial<ErrorLog['context']> = {},
  severity: ErrorLog['severity'] = 'medium'
) {
  return async (...args: T): Promise<R> => {
    try {
      const result = await fn(...args)
      return result
    } catch (error) {
      const errorId = ErrorMonitor.log(
        error instanceof Error ? error : new Error(String(error)),
        context,
        severity
      )
      
      // Re-throw with error ID for debugging
      const enhancedError = error instanceof Error ? error : new Error(String(error))
      enhancedError.cause = errorId
      throw enhancedError
    }
  }
}

export function trackPerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  
  return Promise.resolve(fn()).then(
    result => ({
      result,
      duration: performance.now() - start
    }),
    error => {
      ErrorMonitor.log(
        error instanceof Error ? error : new Error(String(error)),
        { endpoint: operation },
        'high'
      )
      throw error
    }
  )
}