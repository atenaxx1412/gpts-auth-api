export interface ApiKeyAuthConfig {
  apiKey: string
}

export class ApiKeyValidator {
  static async validate(request: Request, authConfig: ApiKeyAuthConfig): Promise<boolean> {
    try {
      const apiKeyHeader = request.headers.get('x-api-key')
      const authHeader = request.headers.get('authorization')
      
      let providedApiKey: string | null = null

      if (apiKeyHeader) {
        providedApiKey = apiKeyHeader
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        providedApiKey = authHeader.slice(7)
      }

      if (!providedApiKey) {
        return false
      }

      return providedApiKey === authConfig.apiKey
    } catch {
      console.error('API key validation failed')
      return false
    }
  }

  static generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}