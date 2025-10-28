import { z } from "zod"
import { NextRequest } from "next/server"

/**
 * API Request Validation Utilities
 * Provides comprehensive validation for API requests using Zod schemas
 */

// Common validation schemas
export const FlowAddressSchema = z.string().regex(
  /^0x[a-fA-F0-9]{16}$/,
  "Invalid Flow address format"
)

export const TransactionIdSchema = z.string().regex(
  /^[a-fA-F0-9]{64}$/,
  "Invalid transaction ID format"
)

export const ContractNameSchema = z.string()
  .min(1, "Contract name is required")
  .max(50, "Contract name too long")
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Invalid contract name format")

export const FunctionNameSchema = z.string()
  .min(1, "Function name is required")
  .max(50, "Function name too long")
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Invalid function name format")

// Parameter validation schemas
export const ParameterSchema = z.object({
  name: z.string().min(1, "Parameter name is required"),
  type: z.string().min(1, "Parameter type is required"),
  value: z.any(),
  required: z.boolean().default(true)
})

export const ContractCallSchema = z.object({
  contractName: ContractNameSchema,
  functionName: FunctionNameSchema,
  parameters: z.array(ParameterSchema).default([]),
  returnType: z.string().default("Void")
})

// API route validation schemas
export const APIRouteCreateSchema = z.object({
  path: z.string()
    .min(1, "API path is required")
    .regex(/^\/api\/[a-zA-Z0-9\-_\/]+$/, "Invalid API path format"),
  methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']))
    .min(1, "At least one HTTP method is required"),
  contractCalls: z.array(ContractCallSchema).default([]),
  authentication: z.boolean().default(false),
  validation: z.object({
    body: z.record(z.any()).optional(),
    query: z.record(z.any()).optional(),
    params: z.record(z.any()).optional()
  }).default({})
})

// Contract deployment validation
export const ContractDeploymentSchema = z.object({
  contractName: ContractNameSchema,
  contractCode: z.string().min(1, "Contract code is required"),
  authorizer: FlowAddressSchema,
  network: z.enum(['testnet', 'mainnet', 'emulator']).default('testnet')
})

// Transaction execution validation
export const TransactionExecutionSchema = z.object({
  transaction: z.string().min(1, "Transaction code is required"),
  args: z.array(z.any()).default([]),
  authorizers: z.array(FlowAddressSchema).min(1, "At least one authorizer is required"),
  payer: FlowAddressSchema.optional(),
  gasLimit: z.number().min(1).max(9999).default(1000)
})

// Script execution validation
export const ScriptExecutionSchema = z.object({
  script: z.string().min(1, "Script code is required"),
  args: z.array(z.any()).default([])
})

// Account query validation
export const AccountQuerySchema = z.object({
  address: FlowAddressSchema
})

// Pagination validation
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Full-stack project validation
export const FullStackProjectSchema = z.object({
  projectName: z.string()
    .min(1, "Project name is required")
    .max(50, "Project name too long")
    .regex(/^[a-zA-Z][a-zA-Z0-9\-_]*$/, "Invalid project name format"),
  description: z.string().min(1, "Project description is required"),
  contractCode: z.string().min(1, "Contract code is required"),
  includeAPI: z.boolean().default(true),
  includeFrontend: z.boolean().default(true),
  uiFramework: z.enum(['react', 'next']).default('next'),
  stylingFramework: z.enum(['tailwind', 'css']).default('tailwind'),
  deploymentTarget: z.enum(['vercel', 'netlify', 'self-hosted']).default('vercel')
})

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Array<{
    field: string
    message: string
    code: string
  }>
}

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)
    
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    
    return {
      success: false,
      errors: [{
        field: 'body',
        message: 'Invalid request body format',
        code: 'invalid_type'
      }]
    }
  }
}

/**
 * Validate query parameters against schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)
    const validatedData = schema.parse(queryParams)
    
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    
    return {
      success: false,
      errors: [{
        field: 'query',
        message: 'Invalid query parameters',
        code: 'invalid_type'
      }]
    }
  }
}

/**
 * Validate path parameters against schema
 */
export function validatePathParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    // Extract path parameters from URL
    const pathname = new URL(request.url).pathname
    const segments = pathname.split('/').filter(Boolean)
    
    // Simple parameter extraction (would need more sophisticated logic for complex routes)
    const params: Record<string, string> = {}
    
    // For now, assume the last segment is an ID parameter
    if (segments.length > 0) {
      params.id = segments[segments.length - 1]
    }
    
    const validatedData = schema.parse(params)
    
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    
    return {
      success: false,
      errors: [{
        field: 'params',
        message: 'Invalid path parameters',
        code: 'invalid_type'
      }]
    }
  }
}

/**
 * Comprehensive request validation
 */
export async function validateRequest<TBody, TQuery, TParams>(
  request: NextRequest,
  schemas: {
    body?: z.ZodSchema<TBody>
    query?: z.ZodSchema<TQuery>
    params?: z.ZodSchema<TParams>
  }
): Promise<{
  success: boolean
  data?: {
    body?: TBody
    query?: TQuery
    params?: TParams
  }
  errors?: Array<{
    field: string
    message: string
    code: string
  }>
}> {
  const errors: Array<{ field: string, message: string, code: string }> = []
  const data: any = {}
  
  // Validate body if schema provided
  if (schemas.body) {
    const bodyValidation = await validateRequestBody(request, schemas.body)
    if (bodyValidation.success) {
      data.body = bodyValidation.data
    } else {
      errors.push(...(bodyValidation.errors || []))
    }
  }
  
  // Validate query parameters if schema provided
  if (schemas.query) {
    const queryValidation = validateQueryParams(request, schemas.query)
    if (queryValidation.success) {
      data.query = queryValidation.data
    } else {
      errors.push(...(queryValidation.errors || []))
    }
  }
  
  // Validate path parameters if schema provided
  if (schemas.params) {
    const paramsValidation = validatePathParams(request, schemas.params)
    if (paramsValidation.success) {
      data.params = paramsValidation.data
    } else {
      errors.push(...(paramsValidation.errors || []))
    }
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(errors: Array<{
  field: string
  message: string
  code: string
}>) {
  return {
    error: "Validation failed",
    code: "VALIDATION_ERROR",
    details: errors,
    timestamp: new Date().toISOString()
  }
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break queries
    .trim()
}

/**
 * Validate Cadence code for basic syntax
 */
export function validateCadenceCode(code: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check for legacy syntax patterns
  if (code.includes('pub ')) {
    errors.push('Legacy "pub" keyword detected. Use "access(all)" instead.')
  }
  
  if (code.includes('AuthAccount')) {
    errors.push('Legacy "AuthAccount" type detected. Use "&Account" instead.')
  }
  
  if (code.includes('account.save')) {
    warnings.push('Legacy storage API detected. Consider using "account.storage.save".')
  }
  
  // Check for required elements
  if (!code.includes('contract ') && !code.includes('transaction ') && !code.includes('access(all) fun main')) {
    errors.push('Code must contain a contract, transaction, or script definition.')
  }
  
  // Check for proper access modifiers
  const functionMatches = code.match(/fun\s+\w+/g)
  if (functionMatches) {
    functionMatches.forEach(match => {
      const beforeFunction = code.substring(0, code.indexOf(match))
      if (!beforeFunction.includes('access(') && !beforeFunction.includes('view ')) {
        warnings.push(`Function "${match}" should have an explicit access modifier.`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Rate limiting validation
 */
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
}

const rateLimitStore = new Map<string, { count: number, resetTime: number }>()

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): { allowed: boolean, remaining: number, resetTime: number } {
  const key = config.keyGenerator ? config.keyGenerator(request) : 
    request.headers.get('x-forwarded-for') || 'default'
  
  const now = Date.now()
  const windowStart = now - config.windowMs
  
  // Clean up old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k)
    }
  }
  
  const current = rateLimitStore.get(key)
  
  if (!current || current.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    }
  }
  
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    }
  }
  
  current.count++
  
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime
  }
}