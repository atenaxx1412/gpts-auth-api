import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { AccessLogger } from '@/lib/access-logger'

export async function GET() {
  try {
    const user = await requireAuth()
    
    const logs = await AccessLogger.getUserAccessLogs(user.uid, 200)

    return NextResponse.json({ 
      logs,
      total: logs.length
    })
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}