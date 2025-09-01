import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, deleteDoc, doc, writeBatch, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { requireAuth } from '@/lib/auth'
import { generateUniqueId } from '@/lib/url-generator'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { urls } = body

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Invalid URLs array' },
        { status: 400 }
      )
    }

    const batch = writeBatch(db)
    let createdCount = 0

    for (const urlData of urls) {
      if (!urlData.name || !urlData.authType) {
        continue
      }

      const urlId = generateUniqueId()
      const docRef = doc(db, 'urls', urlId)
      
      const newUrl = {
        userId: user.uid,
        name: urlData.name,
        description: urlData.description || '',
        authType: urlData.authType,
        authConfig: urlData.authConfig || {},
        isActive: urlData.isActive !== false,
        createdAt: new Date(),
        accessCount: 0
      }

      batch.set(docRef, newUrl)
      createdCount++
    }

    if (createdCount === 0) {
      return NextResponse.json(
        { error: 'No valid URLs to create' },
        { status: 400 }
      )
    }

    await batch.commit()

    return NextResponse.json({
      message: `${createdCount} URLs created successfully`,
      created: createdCount
    })
  } catch (error) {
    console.error('Bulk create error:', error)
    return NextResponse.json(
      { error: 'Authentication required or internal error' },
      { status: 401 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { urlIds } = body

    if (!Array.isArray(urlIds) || urlIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid URL IDs array' },
        { status: 400 }
      )
    }

    if (urlIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 URLs can be deleted at once' },
        { status: 400 }
      )
    }

    const batch = writeBatch(db)
    let deletedCount = 0

    for (const urlId of urlIds) {
      const docRef = doc(db, 'urls', urlId)
      
      // Verify ownership (Note: in production, you'd want to batch this check)
      const urlsQuery = query(
        collection(db, 'urls'),
        where('userId', '==', user.uid)
      )
      const urlsSnapshot = await getDocs(urlsQuery)
      const userUrlIds = urlsSnapshot.docs.map(doc => doc.id)
      
      if (userUrlIds.includes(urlId)) {
        batch.delete(docRef)
        
        // Also delete related access logs
        const logsQuery = query(
          collection(db, 'accessLogs'),
          where('urlId', '==', urlId)
        )
        const logsSnapshot = await getDocs(logsQuery)
        logsSnapshot.docs.forEach(logDoc => {
          batch.delete(logDoc.ref)
        })
        
        deletedCount++
      }
    }

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: 'No URLs found or access denied' },
        { status: 404 }
      )
    }

    await batch.commit()

    return NextResponse.json({
      message: `${deletedCount} URLs deleted successfully`,
      deleted: deletedCount
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Authentication required or internal error' },
      { status: 401 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { urlIds, updates } = body

    if (!Array.isArray(urlIds) || urlIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid URL IDs array' },
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Invalid updates object' },
        { status: 400 }
      )
    }

    const allowedFields = ['isActive', 'description']
    const updateData: Record<string, unknown> = {}

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const batch = writeBatch(db)
    let updatedCount = 0

    // Verify ownership for all URLs first
    const urlsQuery = query(
      collection(db, 'urls'),
      where('userId', '==', user.uid)
    )
    const urlsSnapshot = await getDocs(urlsQuery)
    const userUrlIds = urlsSnapshot.docs.map(doc => doc.id)

    for (const urlId of urlIds) {
      if (userUrlIds.includes(urlId)) {
        const docRef = doc(db, 'urls', urlId)
        batch.update(docRef, updateData)
        updatedCount++
      }
    }

    if (updatedCount === 0) {
      return NextResponse.json(
        { error: 'No URLs found or access denied' },
        { status: 404 }
      )
    }

    await batch.commit()

    return NextResponse.json({
      message: `${updatedCount} URLs updated successfully`,
      updated: updatedCount
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json(
      { error: 'Authentication required or internal error' },
      { status: 401 }
    )
  }
}