import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/dashboard')) {
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register']
}