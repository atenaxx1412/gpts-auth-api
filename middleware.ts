import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis or external storage)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return `${ip}:${request.nextUrl.pathname}`
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimit.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'"
    ].join('; ')
  }
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    'https://chat.openai.com',
    'https://chatgpt.com',
    'https://gpts-auth-api.vercel.app'
  ]
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-API-Password',
    'Access-Control-Max-Age': '86400'
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  
  return headers
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const response = NextResponse.next()
  
  // Apply security headers to all responses
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin)
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders })
    }
    
    // Rate limiting for API routes
    const rateLimitKey = getRateLimitKey(request)
    const isApiV1 = pathname.startsWith('/api/v1/')
    const limit = isApiV1 ? 100 : 50
    const windowMs = 60000 // 1 minute
    
    if (!checkRateLimit(rateLimitKey, limit, windowMs)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...corsHeaders
          }
        }
      )
    }
  }
  
  // Authentication redirects
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
    const authCookie = request.cookies.get('auth-token')
    
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname === '/login' || pathname === '/register') {
    const authCookie = request.cookies.get('auth-token')
    
    if (authCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*', 
    '/login', 
    '/register',
    '/api/:path*'
  ]
}