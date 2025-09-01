import bcrypt from 'bcryptjs'

export interface PasswordAuthConfig {
  password: string
}

export class PasswordValidator {
  static async validate(request: Request, authConfig: PasswordAuthConfig): Promise<boolean> {
    try {
      const body = await request.json()
      const { password } = body

      if (!password || typeof password !== 'string') {
        return false
      }

      return await bcrypt.compare(password, authConfig.password)
    } catch {
      console.error('Password validation failed')
      return false
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }
}