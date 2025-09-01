import bcrypt from 'bcryptjs'

export interface BasicAuthConfig {
  username: string
  password: string
}

export class BasicValidator {
  static async validate(request: Request, authConfig: BasicAuthConfig): Promise<boolean> {
    try {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return false
      }

      const base64Credentials = authHeader.slice(6)
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
      const [username, password] = credentials.split(':')

      if (!username || !password) {
        return false
      }

      const usernameMatch = username === authConfig.username
      const passwordMatch = await bcrypt.compare(password, authConfig.password)

      return usernameMatch && passwordMatch
    } catch {
      console.error('Basic auth validation failed')
      return false
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }
}