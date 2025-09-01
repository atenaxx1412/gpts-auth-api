import { NextRequest, NextResponse } from 'next/server'
import { URLGenerator } from '@/lib/url-generator'
import { PasswordValidator, BasicValidator } from '@/lib/validators'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAuth()
    const urls = await URLGenerator.getUserURLs(user.uid)
    
    return NextResponse.json({ urls })
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const { name, authType, authConfig, description } = body

    if (!name || !authType || !authConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const processedAuthConfig = { ...authConfig }

    if (authType === 'password') {
      processedAuthConfig.password = await PasswordValidator.hashPassword(authConfig.password)
    } else if (authType === 'basic') {
      processedAuthConfig.password = await BasicValidator.hashPassword(authConfig.password)
    }

    const url = await URLGenerator.createURL(
      user.uid,
      name,
      authType,
      processedAuthConfig,
      description
    )

    return NextResponse.json({ 
      url,
      endpoint: URLGenerator.generateEndpointURL(url.id)
    })
  } catch {
    console.error('Create URL error')
    return NextResponse.json(
      { error: 'Failed to create URL' },
      { status: 500 }
    )
  }
}