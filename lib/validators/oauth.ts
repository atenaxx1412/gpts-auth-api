export interface OAuthAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  allowedTokens?: string[]
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

      if (authConfig.allowedTokens && authConfig.allowedTokens.length > 0) {
        return authConfig.allowedTokens.includes(token)
      }

      return true
    } catch {
      console.error('OAuth validation failed')
      return false
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