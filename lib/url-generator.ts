import { v4 as uuidv4 } from 'uuid'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import { URL as URLType } from '@/types'

export class URLGenerator {
  static generateUrlId(): string {
    return uuidv4()
  }

  static async createURL(
    userId: string,
    name: string,
    authType: 'password' | 'basic' | 'apikey' | 'oauth',
    authConfig: any,
    description?: string
  ): Promise<URLType> {
    const urlId = this.generateUrlId()
    
    const urlData: URLType = {
      id: urlId,
      userId,
      name,
      description: description || '',
      authType,
      authConfig,
      isActive: true,
      createdAt: new Date(),
      accessCount: 0
    }

    await setDoc(doc(db, 'urls', urlId), urlData)
    return urlData
  }

  static async getURL(urlId: string): Promise<URLType | null> {
    const docRef = doc(db, 'urls', urlId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data() as URLType
    }
    
    return null
  }

  static async getUserURLs(userId: string): Promise<URLType[]> {
    const q = query(
      collection(db, 'urls'),
      where('userId', '==', userId)
    )
    
    const querySnapshot = await getDocs(q)
    const urls: URLType[] = []
    
    querySnapshot.forEach((doc) => {
      urls.push({ id: doc.id, ...doc.data() } as URLType)
    })
    
    return urls.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  static generateEndpointURL(urlId: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://gpts-auth-api.vercel.app'
    return `${base}/api/v1/${urlId}`
  }
}