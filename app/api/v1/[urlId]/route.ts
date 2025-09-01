import { NextRequest, NextResponse } from 'next/server'
import { URLGenerator } from '@/lib/url-generator'
import { AuthenticationValidator } from '@/lib/validators'
import { AccessLogger } from '@/lib/access-logger'

async function getClientIP(request: NextRequest): Promise<string> {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ urlId: string }> }
) {
  const { urlId } = await params
  const ip = await getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    const urlData = await URLGenerator.getURL(urlId)

    if (!urlData) {
      await AccessLogger.logAccess(urlId, false, ip, userAgent, 'not_found')
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      )
    }

    if (!urlData.isActive) {
      await AccessLogger.logAccess(urlId, false, ip, userAgent, 'inactive')
      return NextResponse.json(
        { error: 'URL is inactive' },
        { status: 403 }
      )
    }

    const isAuthenticated = await AuthenticationValidator.validate(
      request,
      urlData.authType,
      urlData.authConfig as any
    )

    if (!isAuthenticated) {
      await AccessLogger.logAccess(urlId, false, ip, userAgent, urlData.authType)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    await AccessLogger.logAccess(urlId, true, ip, userAgent, urlData.authType)

    return NextResponse.json({
      message: 'Authentication successful',
      urlId: urlData.id,
      name: urlData.name,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API Error:', error)
    await AccessLogger.logAccess(urlId, false, ip, userAgent, 'error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ urlId: string }> }
) {
  return GET(request, { params })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ urlId: string }> }
) {
  return GET(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ urlId: string }> }
) {
  return GET(request, { params })
}