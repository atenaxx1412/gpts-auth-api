import { collection, addDoc, doc, updateDoc, increment, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import { AccessLog } from '@/types'

export class AccessLogger {
  static async logAccess(
    urlId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    authMethod?: string
  ): Promise<void> {
    try {
      const logData: Omit<AccessLog, 'id'> = {
        urlId,
        timestamp: new Date(),
        success,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        authMethod: authMethod || 'unknown'
      }

      await addDoc(collection(db, 'accessLogs'), logData)

      if (success) {
        await updateDoc(doc(db, 'urls', urlId), {
          accessCount: increment(1),
          lastAccessed: new Date()
        })
      }
    } catch (error) {
      console.error('Failed to log access:', error)
    }
  }

  static async getAccessLogs(urlId: string, limitCount: number = 50): Promise<AccessLog[]> {
    try {
      const q = query(
        collection(db, 'accessLogs'),
        where('urlId', '==', urlId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const logs: AccessLog[] = []

      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as AccessLog)
      })

      return logs
    } catch (error) {
      console.error('Failed to get access logs:', error)
      return []
    }
  }

  static async getUserAccessLogs(userId: string, limitCount: number = 100): Promise<AccessLog[]> {
    try {
      const userUrlsQuery = query(
        collection(db, 'urls'),
        where('userId', '==', userId)
      )
      
      const urlSnapshot = await getDocs(userUrlsQuery)
      const urlIds: string[] = []
      
      urlSnapshot.forEach((doc) => {
        urlIds.push(doc.id)
      })

      if (urlIds.length === 0) {
        return []
      }

      const logsQuery = query(
        collection(db, 'accessLogs'),
        where('urlId', 'in', urlIds),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      const logsSnapshot = await getDocs(logsQuery)
      const logs: AccessLog[] = []

      logsSnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as AccessLog)
      })

      return logs
    } catch (error) {
      console.error('Failed to get user access logs:', error)
      return []
    }
  }
}