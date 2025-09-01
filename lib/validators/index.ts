import { PasswordValidator, PasswordAuthConfig } from './password'
import { BasicValidator, BasicAuthConfig } from './basic'
import { ApiKeyValidator, ApiKeyAuthConfig } from './apikey'
import { OAuthValidator, OAuthAuthConfig } from './oauth'

export type AuthConfig = PasswordAuthConfig | BasicAuthConfig | ApiKeyAuthConfig | OAuthAuthConfig

export class AuthenticationValidator {
  static async validate(
    request: Request,
    authType: 'password' | 'basic' | 'apikey' | 'oauth',
    authConfig: AuthConfig
  ): Promise<boolean> {
    switch (authType) {
      case 'password':
        return await PasswordValidator.validate(request, authConfig as PasswordAuthConfig)
      case 'basic':
        return await BasicValidator.validate(request, authConfig as BasicAuthConfig)
      case 'apikey':
        return await ApiKeyValidator.validate(request, authConfig as ApiKeyAuthConfig)
      case 'oauth':
        return await OAuthValidator.validate(request, authConfig as OAuthAuthConfig)
      default:
        return false
    }
  }
}

export {
  PasswordValidator,
  BasicValidator,
  ApiKeyValidator,
  OAuthValidator,
  type PasswordAuthConfig,
  type BasicAuthConfig,
  type ApiKeyAuthConfig,
  type OAuthAuthConfig
}