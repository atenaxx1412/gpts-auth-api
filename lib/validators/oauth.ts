export interface OAuthAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  allowedTokens?: string[]
  provider?: 'google' | 'github' | 'custom'
  scopes?: string[]
  introspectionUrl?: string
  refreshToken?: string
  tokenUrl?: string
}

export class OAuthValidator {
  static async validate(request: Request, authConfig: OAuthAuthConfig): Promise<boolean> {
    try {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false
      }

      const token = authHeader.slice(7)
      
      if (!token) {
        return false
      }

      // If using allowedTokens list (simple mode)
      if (authConfig.allowedTokens && authConfig.allowedTokens.length > 0) {
        return authConfig.allowedTokens.includes(token)
      }

      // If introspection URL is provided, validate token remotely
      if (authConfig.introspectionUrl) {
        return await this.introspectToken(token, authConfig)
      }

      // Provider-specific validation
      if (authConfig.provider) {
        return await this.validateWithProvider(token, authConfig)
      }

      return true
    } catch {
      console.error('OAuth validation failed')
      return false
    }
  }

  static async introspectToken(token: string, authConfig: OAuthAuthConfig): Promise<boolean> {
    try {
      const response = await fetch(authConfig.introspectionUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${authConfig.clientId}:${authConfig.clientSecret}`).toString('base64')}`
        },
        body: `token=${encodeURIComponent(token)}`
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      
      // Check if token is active and has required scopes
      if (!data.active) {
        return false
      }

      if (authConfig.scopes && authConfig.scopes.length > 0) {
        const tokenScopes = data.scope ? data.scope.split(' ') : []
        const hasRequiredScopes = authConfig.scopes.every(scope => tokenScopes.includes(scope))
        if (!hasRequiredScopes) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Token introspection failed:', error)
      return false
    }
  }

  static async validateWithProvider(token: string, authConfig: OAuthAuthConfig): Promise<boolean> {
    try {
      let validationUrl: string

      switch (authConfig.provider) {
        case 'google':
          validationUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
          break
        case 'github':
          validationUrl = 'https://api.github.com/user'
          break
        default:
          return false
      }

      const headers: Record<string, string> = {}
      if (authConfig.provider === 'github') {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(validationUrl, { headers })
      
      if (!response.ok) {
        return false
      }

      const data = await response.json()

      // Provider-specific validation
      switch (authConfig.provider) {
        case 'google':
          return data.audience === authConfig.clientId
        case 'github':
          return !!data.id
        default:
          return false
      }
    } catch (error) {
      console.error('Provider validation failed:', error)
      return false
    }
  }

  static async refreshToken(authConfig: OAuthAuthConfig): Promise<string | null> {
    if (!authConfig.refreshToken || !authConfig.tokenUrl) {
      return null
    }

    try {
      const response = await fetch(authConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: authConfig.refreshToken,
          client_id: authConfig.clientId,
          client_secret: authConfig.clientSecret
        })
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  }

  static generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}