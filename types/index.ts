
export type AuthType = 'password' | 'basic' | 'apikey' | 'oauth'

export interface URL {
  id: string
  userId: string
  name: string
  description?: string
  authType: AuthType
  authConfig: Record<string, unknown>
  isActive: boolean
  createdAt: Date
  lastAccessed?: Date
  accessCount: number
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
  createdAt: Date
  isActive: boolean
}

export interface AccessLog {
  id: string
  urlId: string
  timestamp: Date
  authMethod: string
  success: boolean
  ipAddress: string
  userAgent: string
}

export interface User {
  uid: string
  email: string
  displayName?: string
  createdAt: Date
  updatedAt: Date
}