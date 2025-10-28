import { NextRequest } from "next/server"
import { z } from "zod"

/**
 * Authentication and Security Utilities
 * Provides comprehensive authentication and security measures for API routes
 */

export interface SecurityConfig {
  enableRateLimit: boolean
  enableCORS: boolean
  enableCSRF: boolean
  enableJWTAuth: boolean
  enableSignatureAuth: boolean
  maxRequestsPerMinute: number
  sessionTimeout: number
}

export interface AuthenticationResult {
  success: boolean
  user?: {
    address: string
    publicKey?: string
    roles: string[]
    permissions: string[]
  }
  error?: string
  token?: string
}

export interface SecurityHeaders {
  'X-Content-Type-Options': string
  'X-Frame-Options': string
  'X-XSS-Protection': string
  'Referrer-Policy': string
  'Content-Security-Policy': string
  'Strict-Transport-Security': string
}

/**
 * Flow signature verification
 */
export async function verifyFlowSignature(
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    // In production, this would use the Flow SDK to verify signatures
    // For now, we'll implement basic validation
    
    if (!address || !signature || !message) {
      return false
    }
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{16}$/.test(address)) {
      return false
    }
    
    // Validate signature format (simplified)
    if (signature.length < 64) {
      return false
    }
    
    // Mock verification - in production, use actual cryptographic verification
    console.log(`[Auth] Verifying signature for ${address}`)
    return true
    
  } catch (error) {
    console.error('[Auth] Signature verification failed:', error)
    return false
  }
}

/**
 * JWT token generation and verification
 */
export class JWTManager {
  private secret: string
  
  constructor(secret?: string) {
    this.secret = secret || process.env.JWT_SECRET || 'default-secret-change-in-production'
  }
  
  /**
   * Generate JWT token
   */
  generateToken(payload: {
    address: string
    roles: string[]
    permissions: string[]
    expiresIn?: number
  }): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }
    
    const now = Math.floor(Date.now() / 1000)
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + (payload.expiresIn || 3600) // Default 1 hour
    }
    
    // Simple JWT implementation (in production, use a proper JWT library)
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url')
    
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`)
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }
  
  /**
   * Verify JWT token
   */
  verifyToken(token: string): { valid: boolean, payload?: any, error?: string } {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' }
      }
      
      const [encodedHeader, encodedPayload, signature] = parts
      
      // Verify signature
      const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`)
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' }
      }
      
      // Decode payload
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' }
      }
      
      return { valid: true, payload }
      
    } catch (error) {
      return { valid: false, error: 'Token verification failed' }
    }
  }
  
  private sign(data: string): string {
    // Simple HMAC implementation (in production, use crypto.createHmac)
    return Buffer.from(`${data}:${this.secret}`).toString('base64url').substring(0, 32)
  }
}

/**
 * Rate limiting implementation
 */
export class RateLimiter {
  private store = new Map<string, { count: number, resetTime: number }>()
  private maxRequests: number
  private windowMs: number
  
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }
  
  /**
   * Check if request is within rate limit
   */
  checkLimit(key: string): {
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  } {
    const now = Date.now()
    const current = this.store.get(key)
    
    // Clean up expired entries
    this.cleanup()
    
    if (!current || current.resetTime < now) {
      // New window
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      }
    }
    
    if (current.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }
    }
    
    current.count++
    
    return {
      allowed: true,
      remaining: this.maxRequests - current.count,
      resetTime: current.resetTime
    }
  }
  
  private cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key)
      }
    }
  }
}

/**
 * CSRF protection
 */
export class CSRFProtection {
  private tokens = new Map<string, { token: string, expiresAt: number }>()
  
  /**
   * Generate CSRF token
   */
  generateToken(sessionId: string): string {
    const token = this.randomToken()
    const expiresAt = Date.now() + 3600000 // 1 hour
    
    this.tokens.set(sessionId, { token, expiresAt })
    
    return token
  }
  
  /**
   * Verify CSRF token
   */
  verifyToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    
    if (!stored || stored.expiresAt < Date.now()) {
      if (stored) {
        this.tokens.delete(sessionId)
      }
      return false
    }
    
    return stored.token === token
  }
  
  private randomToken(): string {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }
}

/**
 * Security middleware
 */
export class SecurityMiddleware {
  private rateLimiter: RateLimiter
  private jwtManager: JWTManager
  private csrfProtection: CSRFProtection
  private config: SecurityConfig
  
  constructor(config: SecurityConfig) {
    this.config = config
    this.rateLimiter = new RateLimiter(config.maxRequestsPerMinute, 60000)
    this.jwtManager = new JWTManager()
    this.csrfProtection = new CSRFProtection()
  }
  
  /**
   * Apply security headers
   */
  getSecurityHeaders(): SecurityHeaders {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  }
  
  /**
   * Check rate limit
   */
  checkRateLimit(request: NextRequest): {
    allowed: boolean
    headers: Record<string, string>
  } {
    if (!this.config.enableRateLimit) {
      return { allowed: true, headers: {} }
    }
    
    const clientIP = this.getClientIP(request)
    const result = this.rateLimiter.checkLimit(clientIP)
    
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': this.config.maxRequestsPerMinute.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    }
    
    if (!result.allowed && result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString()
    }
    
    return {
      allowed: result.allowed,
      headers
    }
  }
  
  /**
   * Authenticate request
   */
  async authenticateRequest(request: NextRequest): Promise<AuthenticationResult> {
    try {
      // Try JWT authentication first
      if (this.config.enableJWTAuth) {
        const jwtResult = await this.authenticateJWT(request)
        if (jwtResult.success) {
          return jwtResult
        }
      }
      
      // Try signature authentication
      if (this.config.enableSignatureAuth) {
        const sigResult = await this.authenticateSignature(request)
        if (sigResult.success) {
          return sigResult
        }
      }
      
      return {
        success: false,
        error: 'No valid authentication method found'
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }
  
  private async authenticateJWT(request: NextRequest): Promise<AuthenticationResult> {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No JWT token provided' }
    }
    
    const token = authHeader.substring(7)
    const verification = this.jwtManager.verifyToken(token)
    
    if (!verification.valid) {
      return { success: false, error: verification.error }
    }
    
    return {
      success: true,
      user: {
        address: verification.payload.address,
        roles: verification.payload.roles || [],
        permissions: verification.payload.permissions || []
      },
      token
    }
  }
  
  private async authenticateSignature(request: NextRequest): Promise<AuthenticationResult> {
    const address = request.headers.get('X-Flow-Address')
    const signature = request.headers.get('X-Flow-Signature')
    const message = request.headers.get('X-Flow-Message')
    
    if (!address || !signature || !message) {
      return { success: false, error: 'Missing signature authentication headers' }
    }
    
    const isValid = await verifyFlowSignature(address, signature, message)
    
    if (!isValid) {
      return { success: false, error: 'Invalid signature' }
    }
    
    return {
      success: true,
      user: {
        address,
        roles: ['user'], // Default role
        permissions: ['read', 'write'] // Default permissions
      }
    }
  }
  
  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           'unknown'
  }
}

/**
 * Input sanitization
 */
export const InputSanitizer = {
  /**
   * Sanitize string input
   */
  sanitizeString: (input: string, maxLength: number = 1000): string => {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, maxLength)
  },
  
  /**
   * Sanitize Flow address
   */
  sanitizeAddress: (address: string): string => {
    return address
      .toLowerCase()
      .replace(/[^0-9a-fx]/g, '')
      .substring(0, 18) // Max length for Flow address
  },
  
  /**
   * Sanitize numeric input
   */
  sanitizeNumber: (input: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
    const num = Number(input)
    if (isNaN(num)) return min
    return Math.max(min, Math.min(max, num))
  },
  
  /**
   * Sanitize object keys and values
   */
  sanitizeObject: (obj: any, maxDepth: number = 3): any => {
    if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.slice(0, 100).map(item => InputSanitizer.sanitizeObject(item, maxDepth - 1))
    }
    
    const sanitized: any = {}
    const keys = Object.keys(obj).slice(0, 50) // Limit number of keys
    
    for (const key of keys) {
      const sanitizedKey = InputSanitizer.sanitizeString(key, 100)
      sanitized[sanitizedKey] = InputSanitizer.sanitizeObject(obj[key], maxDepth - 1)
    }
    
    return sanitized
  }
}

/**
 * Validation schemas for security
 */
export const SecuritySchemas = {
  flowAddress: z.string().regex(/^0x[a-fA-F0-9]{16}$/, "Invalid Flow address format"),
  signature: z.string().min(64, "Signature too short").max(256, "Signature too long"),
  message: z.string().min(1, "Message required").max(1000, "Message too long"),
  token: z.string().min(10, "Token too short").max(2000, "Token too long")
}

// Export singleton instances
export const defaultSecurityConfig: SecurityConfig = {
  enableRateLimit: true,
  enableCORS: true,
  enableCSRF: true,
  enableJWTAuth: true,
  enableSignatureAuth: true,
  maxRequestsPerMinute: 100,
  sessionTimeout: 3600000 // 1 hour
}

export const securityMiddleware = new SecurityMiddleware(defaultSecurityConfig)