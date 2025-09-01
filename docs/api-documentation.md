# GPTs Auth API Documentation

## Overview
The GPTs Auth API provides secure authentication endpoints for ChatGPT custom actions with four different authentication methods.

## Base URL
- **Production**: `https://gpts-auth-api.vercel.app`
- **Development**: `http://localhost:3000`

## Authentication Methods

### 1. Password Authentication
Simple password-based protection using a shared password.

**Headers Required:**
```
X-API-Password: your-password
```

### 2. Basic Authentication  
Traditional username/password authentication using HTTP Basic Auth.

**Headers Required:**
```
Authorization: Basic base64(username:password)
```

### 3. API Key Authentication
Token-based authentication using API keys.

**Headers Required:**
```
Authorization: Bearer your-api-key
```

### 4. OAuth Authentication
OAuth 2.0 flow with support for Google, GitHub, and custom providers.

**Headers Required:**
```
Authorization: Bearer oauth-access-token
```

## API Endpoints

### Public Endpoints

#### `GET /api/v1/{urlId}`
Access your custom GPT endpoint with configured authentication.

**Parameters:**
- `urlId` (path): Unique identifier for your endpoint

**Authentication:** 
Based on configured auth type for the specific URL.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Authentication successful",
    "urlId": "uuid-here",
    "timestamp": 1756758249507
  }
}
```

**Error Response:**
```json
{
  "error": "Authentication failed",
  "details": "Invalid credentials"
}
```

### Admin Endpoints (Protected)

All admin endpoints require Firebase Authentication.

#### `GET /api/admin/urls`
List all URLs for the authenticated user.

**Response:**
```json
{
  "urls": [
    {
      "id": "uuid-here",
      "name": "My API Endpoint",
      "description": "Description here",
      "authType": "password",
      "isActive": true,
      "createdAt": "2025-09-01T19:00:00Z",
      "accessCount": 15
    }
  ]
}
```

#### `POST /api/admin/urls`
Create a new URL endpoint.

**Request Body:**
```json
{
  "name": "My API Endpoint",
  "description": "Optional description",
  "authType": "password|basic|apikey|oauth",
  "authConfig": {
    // Configuration varies by auth type
  }
}
```

**Response:**
```json
{
  "message": "URL created successfully",
  "url": {
    "id": "uuid-here",
    "endpoint": "/api/v1/uuid-here"
  }
}
```

#### `PUT /api/admin/urls/{urlId}`
Update an existing URL endpoint.

**Request Body:**
```json
{
  "name": "Updated name",
  "description": "Updated description", 
  "authConfig": {},
  "isActive": true
}
```

#### `DELETE /api/admin/urls/{urlId}`
Delete a URL endpoint.

**Response:**
```json
{
  "message": "URL deleted successfully"
}
```

#### `GET /api/admin/logs`
Get access logs for user's URLs.

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50)
- `urlId` (optional): Filter by specific URL
- `startDate` (optional): Start date filter (ISO string)
- `endDate` (optional): End date filter (ISO string)

**Response:**
```json
{
  "logs": [
    {
      "id": "log-id",
      "urlId": "uuid-here",
      "timestamp": "2025-09-01T19:00:00Z",
      "success": true,
      "ip": "192.168.1.1",
      "userAgent": "ChatGPT/1.0",
      "responseTime": 120
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

### Bulk Operations

#### `POST /api/admin/urls/bulk`
Create multiple URLs at once.

**Request Body:**
```json
{
  "urls": [
    {
      "name": "Endpoint 1",
      "authType": "password",
      "authConfig": { "password": "secret123" }
    },
    {
      "name": "Endpoint 2", 
      "authType": "apikey",
      "authConfig": { "apiKey": "key123" }
    }
  ]
}
```

#### `DELETE /api/admin/urls/bulk`
Delete multiple URLs at once.

**Request Body:**
```json
{
  "urlIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

#### `PUT /api/admin/urls/bulk`
Update multiple URLs at once.

**Request Body:**
```json
{
  "urlIds": ["uuid-1", "uuid-2"],
  "updates": {
    "isActive": false,
    "description": "Bulk updated"
  }
}
```

## Authentication Configuration Examples

### Password Authentication
```json
{
  "authType": "password",
  "authConfig": {
    "password": "your-secure-password"
  }
}
```

### Basic Authentication
```json
{
  "authType": "basic", 
  "authConfig": {
    "username": "your-username",
    "password": "your-password"
  }
}
```

### API Key Authentication
```json
{
  "authType": "apikey",
  "authConfig": {
    "apiKey": "your-generated-api-key"
  }
}
```

### OAuth Authentication
```json
{
  "authType": "oauth",
  "authConfig": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret", 
    "redirectUri": "https://your-app.com/callback",
    "provider": "google",
    "scopes": ["openid", "email"],
    "allowedTokens": ["token1", "token2"]
  }
}
```

## Rate Limits

- **API v1 endpoints**: 100 requests per minute per IP
- **Admin endpoints**: 50 requests per minute per IP  
- **Authentication endpoints**: 10 requests per 15 minutes per IP
- **Bulk operations**: 5 requests per 5 minutes per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1756758309
Retry-After: 60
```

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |

## Usage with ChatGPT

### Creating Custom Actions

1. **Create URL**: Use the dashboard to create a new URL with your preferred auth method
2. **Copy Endpoint**: Use the generated `/api/v1/{urlId}` endpoint
3. **Configure Action**: In ChatGPT, add the endpoint with the appropriate authentication headers

### Authentication Setup Examples

#### For Password Auth:
```yaml
# ChatGPT Action Configuration
authentication:
  type: "custom"
  custom_auth_header: "X-API-Password"
  custom_auth_value: "your-password"
```

#### For API Key Auth:
```yaml
# ChatGPT Action Configuration  
authentication:
  type: "bearer"
  bearer_token: "your-api-key"
```

#### For Basic Auth:
```yaml
# ChatGPT Action Configuration
authentication:
  type: "basic"
  username: "your-username"
  password: "your-password"
```

## Security Features

- **HTTPS Only**: All endpoints require HTTPS in production
- **CORS Protection**: Restricted to ChatGPT domains
- **Rate Limiting**: Comprehensive rate limiting per endpoint type
- **Security Headers**: CSP, HSTS, XSS protection
- **Input Validation**: All inputs are validated and sanitized
- **Error Monitoring**: Comprehensive error tracking and alerting

## Development

### Local Setup
```bash
git clone https://github.com/atenaxx1412/gpts-auth-api.git
cd gpts-auth-api
npm install
npm run dev
```

### Environment Variables
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Application
NEXT_PUBLIC_APP_URL=https://gpts-auth-api.vercel.app
NEXTAUTH_SECRET=your-secret-key
```

### Build and Deploy
```bash
npm run build
npm run start
```

## Support

For issues or questions, please create an issue on the [GitHub repository](https://github.com/atenaxx1412/gpts-auth-api/issues).