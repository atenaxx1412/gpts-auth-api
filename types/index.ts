import { Timestamp } from 'firebase/firestore'

export type AuthType = 'password' | 'id-password' | 'api-key' | 'oauth'

export interface URL {
  urlId: string
  endpoint: string
  authType: AuthType
  createdAt: Timestamp
  updatedAt: Timestamp
  ownerId: string
  isActive: boolean
  metadata: {
    name: string
    description: string
  }
}

export interface Authentication {
  authId: string
  type: AuthType
  credentials: {
    password?: string
    userId?: string
    apiKey?: string
    clientId?: string
    clientSecret?: string
    redirectUri?: string
  }
  createdAt: Timestamp
  isActive: boolean
}

export interface AccessLog {
  logId: string
  timestamp: Timestamp
  authMethod: string
  success: boolean
  ipAddress: string
  userAgent: string
}

export interface User {
  uid: string
  email: string
  displayName?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}