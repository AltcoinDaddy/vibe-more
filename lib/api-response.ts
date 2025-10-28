import { NextResponse } from "next/server"

/**
 * API Response Formatting and Error Handling Utilities
 * Provides consistent response formatting and comprehensive error handling
 */

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: any
  timestamp: string
  requestId?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
}

export interface APIError {
  code: string
  message: string
  details?: any
  statusCode: number
  category: 'client_error' | 'server_error' | 'validation_error' | 'auth_error' | 'rate_limit_error'
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: APIResponse<T>['meta'],
  statusCode: number = 200
): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    meta
  }
  
  return NextResponse.json(response, { status: statusCode })
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: APIError,
  requestId?: string
): NextResponse {
  const response: APIResponse = {
    success: false,
    error: error.message,
    code: error.code,
    details: error.details,
    timestamp: new Date().toISOString(),
    requestId
  }
  
  return NextResponse.json(response, { status: error.statusCode })
}

/**
 * Predefined API errors
 */
export const APIErrors = {
  // Client errors (4xx)
  BAD_REQUEST: (details?: any): APIError => ({
    code: 'BAD_REQUEST',
    message: 'Invalid request format or parameters',
    details,
    statusCode: 400,
    category: 'client_error'
  }),
  
  UNAUTHORIZED: (details?: any): APIError => ({
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    details,
    statusCode: 401,
    category: 'auth_error'
  }),
  
  FORBIDDEN: (details?: any): APIError => ({
    code: 'FORBIDDEN',
    message: 'Insufficient permissions',
    details,
    statusCode: 403,
    category: 'auth_error'
  }),
  
  NOT_FOUND: (resource?: string): APIError => ({
    code: 'NOT_FOUND',
    message: resource ? `${resource} not found` : 'Resource not found',
    statusCode: 404,
    category: 'client_error'
  }),
  
  METHOD_NOT_ALLOWED: (method: string): APIError => ({
    code: 'METHOD_NOT_ALLOWED',
    message: `HTTP method ${method} not allowed for this endpoint`,
    statusCode: 405,
    category: 'client_error'
  }),
  
  VALIDATION_ERROR: (details: any): APIError => ({
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details,
    statusCode: 422,
    category: 'validation_error'
  }),
  
  RATE_LIMIT_EXCEEDED: (resetTime?: number): APIError => ({
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded',
    details: resetTime ? { resetTime } : undefined,
    statusCode: 429,
    category: 'rate_limit_error'
  }),
  
  // Server errors (5xx)
  INTERNAL_SERVER_ERROR: (details?: any): APIError => ({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    details,
    statusCode: 500,
    category: 'server_error'
  }),
  
  SERVICE_UNAVAILABLE: (service?: string): APIError => ({
    code: 'SERVICE_UNAVAILABLE',
    message: service ? `${service} service is unavailable` : 'Service temporarily unavailable',
    statusCode: 503,
    category: 'server_error'
  }),
  
  GATEWAY_TIMEOUT: (operation?: string): APIError => ({
    code: 'GATEWAY_TIMEOUT',
    message: operation ? `${operation} operation timed out` : 'Operation timed out',
    statusCode: 504,
    category: 'server_error'
  }),
  
  // Flow-specific errors
  FLOW_NETWORK_ERROR: (details?: any): APIError => ({
    code: 'FLOW_NETWORK_ERROR',
    message: 'Flow blockchain network error',
    details,
    statusCode: 502,
    category: 'server_error'
  }),
  
  FLOW_SCRIPT_ERROR: (details?: any): APIError => ({
    code: 'FLOW_SCRIPT_ERROR',
    message: 'Flow script execution failed',
    details,
    statusCode: 502,
    category: 'server_error'
  }),
  
  FLOW_TRANSACTION_ERROR: (details?: any): APIError => ({
    code: 'FLOW_TRANSACTION_ERROR',
    message: 'Flow transaction execution failed',
    details,
    statusCode: 502,
    category: 'server_error'
  }),
  
  CONTRACT_NOT_FOUND: (contractName?: string): APIError => ({
    code: 'CONTRACT_NOT_FOUND',
    message: contractName ? `Contract ${contractName} not found` : 'Contract not found',
    statusCode: 404,
    category: 'client_error'
  }),
  
  ACCOUNT_NOT_FOUND: (address?: string): APIError => ({
    code: 'ACCOUNT_NOT_FOUND',
    message: address ? `Account ${address} not found` : 'Account not found',
    statusCode: 404,
    category: 'client_error'
  }),
  
  INSUFFICIENT_BALANCE: (required?: number, available?: number): APIError => ({
    code: 'INSUFFICIENT_BALANCE',
    message: 'Account has insufficient balance',
    details: { required, available },
    statusCode: 400,
    category: 'client_error'
  }),
  
  INVALID_SIGNATURE: (): APIError => ({
    code: 'INVALID_SIGNATURE',
    message: 'Transaction signature is invalid',
    statusCode: 400,
    category: 'client_error'
  }),
  
  // Generation-specific errors
  CODE_GENERATION_ERROR: (details?: any): APIError => ({
    code: 'CODE_GENERATION_ERROR',
    message: 'Code generation failed',
    details,
    statusCode: 500,
    category: 'server_error'
  }),
  
  LEGACY_SYNTAX_ERROR: (patterns: string[]): APIError => ({
    code: 'LEGACY_SYNTAX_ERROR',
    message: 'Code contains legacy syntax patterns',
    details: { patterns },
    statusCode: 422,
    category: 'validation_error'
  }),
  
  QUALITY_THRESHOLD_ERROR: (score: number, threshold: number): APIError => ({
    code: 'QUALITY_THRESHOLD_ERROR',
    message: 'Generated code quality below threshold',
    details: { score, threshold },
    statusCode: 422,
    category: 'validation_error'
  })
}

/**
 * Handle unknown errors and convert them to API errors
 */
export function handleUnknownError(error: unknown, operation?: string): APIError {
  console.error(`[API Error] ${operation || 'Unknown operation'}:`, error)
  
  if (error instanceof Error) {
    // Check for specific error patterns
    const message = error.message.toLowerCase()
    
    if (message.includes('timeout')) {
      return APIErrors.GATEWAY_TIMEOUT(operation)
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return APIErrors.FLOW_NETWORK_ERROR(error.message)
    }
    
    if (message.includes('script')) {
      return APIErrors.FLOW_SCRIPT_ERROR(error.message)
    }
    
    if (message.includes('transaction')) {
      return APIErrors.FLOW_TRANSACTION_ERROR(error.message)
    }
    
    if (message.includes('not found')) {
      return APIErrors.NOT_FOUND()
    }
    
    if (message.includes('unauthorized') || message.includes('permission')) {
      return APIErrors.FORBIDDEN()
    }
    
    return APIErrors.INTERNAL_SERVER_ERROR(error.message)
  }
  
  return APIErrors.INTERNAL_SERVER_ERROR('Unknown error occurred')
}

/**
 * Paginated response helper
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  statusCode: number = 200
): NextResponse {
  const hasMore = page * limit < total
  
  return createSuccessResponse(
    data,
    {
      page,
      limit,
      total,
      hasMore
    },
    statusCode
  )
}

/**
 * Stream response for long-running operations
 */
export function createStreamResponse(
  generator: AsyncGenerator<any, void, unknown>
): Response {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          const data = JSON.stringify({
            type: 'data',
            payload: chunk,
            timestamp: new Date().toISOString()
          }) + '\n'
          
          controller.enqueue(encoder.encode(data))
        }
        
        // Send completion signal
        const completion = JSON.stringify({
          type: 'complete',
          timestamp: new Date().toISOString()
        }) + '\n'
        
        controller.enqueue(encoder.encode(completion))
        controller.close()
      } catch (error) {
        const errorData = JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }) + '\n'
        
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

/**
 * CORS headers for API responses
 */
export function addCORSHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

/**
 * Handle OPTIONS requests for CORS
 */
export function handleOPTIONS(): NextResponse {
  const response = new NextResponse(null, { status: 200 })
  return addCORSHeaders(response)
}

/**
 * Request logging middleware
 */
export function logRequest(
  method: string,
  url: string,
  startTime: number,
  statusCode: number,
  error?: any
): void {
  const duration = Date.now() - startTime
  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
  
  const logData = {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  }
  
  if (error) {
    logData.error = error instanceof Error ? error.message : String(error)
  }
  
  console[logLevel]('[API Request]', logData)
}

/**
 * Security headers for API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'")
  
  return response
}

/**
 * Health check response
 */
export function createHealthCheckResponse(
  services: Record<string, boolean>
): NextResponse {
  const allHealthy = Object.values(services).every(Boolean)
  const statusCode = allHealthy ? 200 : 503
  
  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    services,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, { status: statusCode })
}

/**
 * API metrics response
 */
export function createMetricsResponse(metrics: {
  requests: number
  errors: number
  averageResponseTime: number
  uptime: number
}): NextResponse {
  return NextResponse.json({
    ...metrics,
    timestamp: new Date().toISOString(),
    errorRate: metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0
  })
}