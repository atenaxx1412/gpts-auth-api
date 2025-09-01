import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { requireAuth } from '@/lib/auth'
import { AccessLogger } from '@/lib/access-logger'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ urlId: string }> }
) {
  try {
    const user = await requireAuth()
    const { urlId } = await params

    const docRef = doc(db, 'urls', urlId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      )
    }

    const urlData = docSnap.data()
    
    if (urlData.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const accessLogs = await AccessLogger.getAccessLogs(urlId)

    return NextResponse.json({
      url: { id: urlId, ...urlData },
      accessLogs
    })
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ urlId: string }> }
) {
  try {
    const user = await requireAuth()
    const { urlId } = await params
    const body = await request.json()

    const docRef = doc(db, 'urls', urlId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      )
    }

    const urlData = docSnap.data()
    
    if (urlData.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const allowedFields = ['name', 'description', 'isActive', 'authConfig']
    const updateData: Record<string, unknown> = {}

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    await updateDoc(docRef, updateData)

    return NextResponse.json({ message: 'URL updated successfully' })
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ urlId: string }> }
) {
  try {
    const user = await requireAuth()
    const { urlId } = await params

    const docRef = doc(db, 'urls', urlId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      )
    }

    const urlData = docSnap.data()
    
    if (urlData.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await deleteDoc(docRef)

    return NextResponse.json({ message: 'URL deleted successfully' })
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}