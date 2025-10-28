import { NextResponse } from "next/server"
import { APIRouteGenerator } from "@/lib/api-route-generator"
import { z } from "zod"

// Request validation schema
const APIRouteRequestSchema = z.object({
  path: z.string().min(1, "API path is required"),
  methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])).min(1, "At least one HTTP method is required"),
  description: z.string().optional(),
  contractCalls: z.array(z.object({
    contractName: z.string(),
    functionName: z.string(),
    parameters: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean().default(true),
      description: z.string().optional()
    })).default([]),
    returnType: z.string().default('any')
  })).default([]),
  validation: z.object({
    body: z.record(z.any()).optional(),
    query: z.record(z.any()).optional(),
    params: z.record(z.any()).optional()
  }).default({}),
  authentication: z.boolean().default(false),
  rateLimit: z.object({
    enabled: z.boolean().default(false),
    requests: z.number().default(100),
    window: z.string().default('15m')
  }).default({}),
  caching: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().default(300), // 5 minutes
    strategy: z.enum(['memory', 'redis']).default('memory')
  }).default({}),
  features: z.object({
    errorHandling: z.boolean().default(true),
    logging: z.boolean().default(true),
    validation: z.boolean().default(true),
    typescript: z.boolean().default(true),
    testGeneration: z.boolean().default(false),
    documentation: z.boolean().default(true)
  }).default({})
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate request
    const validationResult = APIRouteRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid request format",
        details: validationResult.error.errors,
        type: 'validation_error'
      }, { status: 400 })
    }

    const request = validationResult.data

    // Create API route generator
    const generator = new APIRouteGenerator()

    // Create route specification
    const routeSpec = {
      path: request.path,
      methods: request.methods,
      contractCalls: request.contractCalls,
      validation: request.validation,
      authentication: request.authentication
    }

    // Create contract integrations from contract calls
    const contractIntegrations = request.contractCalls.map(call => ({
      contractName: call.contractName,
      functions: [call.functionName],
      events: [],
      integrationCode: `// Integration for ${call.contractName}.${call.functionName}`
    }))

    // Generate the API route
    const generatedRoute = await generator.generateRoute(routeSpec, contractIntegrations)

    // Generate additional files
    const additionalFiles = []

    // Generate test file if requested
    if (request.features.testGeneration) {
      const testCode = generateAPIRouteTest(request.path, request.methods, request.contractCalls)
      additionalFiles.push({
        filename: `${sanitizeFilename(request.path)}.test.ts`,
        code: testCode,
        type: 'test'
      })
    }

    // Generate middleware if authentication is required
    if (request.authentication) {
      const middlewareCode = generateAuthMiddleware()
      additionalFiles.push({
        filename: 'middleware.ts',
        code: middlewareCode,
        type: 'middleware'
      })
    }

    // Generate rate limiting middleware if enabled
    if (request.rateLimit.enabled) {
      const rateLimitCode = generateRateLimitMiddleware(request.rateLimit)
      additionalFiles.push({
        filename: 'rate-limit.ts',
        code: rateLimitCode,
        type: 'middleware'
      })
    }

    // Generate API documentation if requested
    if (request.features.documentation) {
      const docCode = generateAPIDocumentation(request)
      additionalFiles.push({
        filename: `${sanitizeFilename(request.path)}.md`,
        code: docCode,
        type: 'documentation'
      })
    }

    return NextResponse.json({
      success: true,
      apiRoute: generatedRoute,
      additionalFiles,
      metadata: {
        generatedAt: new Date().toISOString(),
        path: request.path,
        methods: request.methods,
        hasContractIntegration: request.contractCalls.length > 0,
        hasAuthentication: request.authentication,
        hasRateLimit: request.rateLimit.enabled,
        features: request.features
      },
      usage: {
        endpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api${request.path}`,
        methods: request.methods,
        examples: generateUsageExamples(request.path, request.methods, request.contractCalls)
      }
    })

  } catch (error) {
    console.error("[API] API route generation error:", error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      type: 'generation_error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint for API route templates and patterns
export async function GET(req: Request) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const pattern = url.searchParams.get('pattern')

  try {
    switch (action) {
      case 'templates':
        return NextResponse.json({
          templates: getAPIRouteTemplates(pattern)
        })

      case 'patterns':
        return NextResponse.json({
          patterns: getAPIRoutePatterns()
        })

      case 'examples':
        return NextResponse.json({
          examples: getAPIRouteExamples(pattern)
        })

      default:
        return NextResponse.json({
          error: "Invalid action parameter",
          availableActions: ['templates', 'patterns', 'examples']
        }, { status: 400 })
    }
  } catch (error) {
    console.error("[API] GET request error:", error)
    return NextResponse.json({
      error: "Failed to process request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Helper functions
function sanitizeFilename(path: string): string {
  return path.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '')
}

function generateAPIRouteTest(path: string, methods: string[], contractCalls: any[]): string {
  return `import { createMocks } from 'node-mocks-http'
import handler from './route'

describe('/api${path}', () => {
  ${methods.map(method => `
  it('handles ${method} requests', async () => {
    const { req, res } = createMocks({
      method: '${method}',
      ${method === 'POST' || method === 'PUT' || method === 'PATCH' ? `
      body: {
        // Add test data based on your API requirements
      },` : ''}
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('success', true)
  })`).join('')}

  ${contractCalls.length > 0 ? `
  it('handles contract interactions', async () => {
    // Mock Flow client
    const mockFlowClient = {
      ${contractCalls.map(call => `${call.functionName}: jest.fn().mockResolvedValue({})`).join(',\n      ')}
    }

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // Add contract interaction test data
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    ${contractCalls.map(call => `expect(mockFlowClient.${call.functionName}).toHaveBeenCalled()`).join('\n    ')}
  })` : ''}

  it('handles validation errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // Invalid data
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('error')
  })

  it('handles server errors gracefully', async () => {
    // Mock error scenario
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    })

    // Simulate server error
    jest.spyOn(console, 'error').mockImplementation(() => {})

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
  })
})`
}

function generateAuthMiddleware(): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    address: string
    [key: string]: any
  }
}

export async function authenticateRequest(req: NextRequest): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header'
      }
    }

    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = verify(token, secret) as any
    
    return {
      success: true,
      user: decoded
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

export function requireAuth(handler: Function) {
  return async (req: NextRequest) => {
    const auth = await authenticateRequest(req)
    
    if (!auth.success) {
      return NextResponse.json({
        error: auth.error,
        type: 'authentication_error'
      }, { status: 401 })
    }

    // Add user to request
    ;(req as AuthenticatedRequest).user = auth.user

    return handler(req)
  }
}`
}

function generateRateLimitMiddleware(rateLimit: any): string {
  return `import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  requests: number
  window: string
  keyGenerator?: (req: NextRequest) => string
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(private config: RateLimitConfig) {}

  async isAllowed(req: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req)
    const now = Date.now()
    const windowMs = this.parseWindow(this.config.window)
    
    const record = this.requests.get(key)
    
    if (!record || now > record.resetTime) {
      // New window
      const resetTime = now + windowMs
      this.requests.set(key, { count: 1, resetTime })
      return { allowed: true, remaining: this.config.requests - 1, resetTime }
    }
    
    if (record.count >= this.config.requests) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }
    
    // Increment count
    record.count++
    this.requests.set(key, record)
    
    return { allowed: true, remaining: this.config.requests - record.count, resetTime: record.resetTime }
  }

  private getDefaultKey(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
    return \`rate-limit:\${ip}\`
  }

  private parseWindow(window: string): number {
    const match = window.match(/^(\\d+)([smhd])$/)
    if (!match) return 60000 // Default 1 minute
    
    const [, amount, unit] = match
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
    return parseInt(amount) * multipliers[unit as keyof typeof multipliers]
  }
}

const rateLimiter = new RateLimiter({
  requests: ${rateLimit.requests},
  window: '${rateLimit.window}'
})

export async function rateLimit(req: NextRequest): Promise<NextResponse | null> {
  const result = await rateLimiter.isAllowed(req)
  
  if (!result.allowed) {
    return NextResponse.json({
      error: 'Rate limit exceeded',
      type: 'rate_limit_error',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
    }, { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': '${rateLimit.requests}',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
      }
    })
  }
  
  return null // Allow request to proceed
}`
}

function generateAPIDocumentation(request: any): string {
  return `# API Route: ${request.path}

${request.description || 'Auto-generated API route documentation'}

## Endpoints

${request.methods.map((method: string) => `
### ${method} ${request.path}

${getMethodDescription(method, request)}

#### Request

${method === 'POST' || method === 'PUT' || method === 'PATCH' ? `
**Body:**
\`\`\`json
{
  ${request.contractCalls.map((call: any) => 
    call.parameters.map((param: any) => `"${param.name}": "${param.type}"`).join(',\n  ')
  ).join(',\n  ')}
}
\`\`\`
` : ''}

${Object.keys(request.validation.query || {}).length > 0 ? `
**Query Parameters:**
${Object.entries(request.validation.query || {}).map(([key, value]) => `- \`${key}\`: ${typeof value}`).join('\n')}
` : ''}

#### Response

**Success (200):**
\`\`\`json
{
  "success": true,
  "data": {
    // Response data based on contract calls
  }
}
\`\`\`

**Error (400/500):**
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "type": "error_type"
}
\`\`\`
`).join('\n')}

## Contract Integrations

${request.contractCalls.length > 0 ? request.contractCalls.map((call: any) => `
### ${call.contractName}.${call.functionName}

${call.parameters.length > 0 ? `
**Parameters:**
${call.parameters.map((param: any) => `- \`${param.name}\` (${param.type}): ${param.description || 'No description'}`).join('\n')}
` : 'No parameters required.'}

**Returns:** ${call.returnType}
`).join('\n') : 'No contract integrations configured.'}

## Authentication

${request.authentication ? `
This endpoint requires authentication. Include a valid JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`
` : 'No authentication required.'}

## Rate Limiting

${request.rateLimit.enabled ? `
This endpoint is rate limited to ${request.rateLimit.requests} requests per ${request.rateLimit.window}.
` : 'No rate limiting configured.'}

## Examples

${generateDocumentationExamples(request.path, request.methods, request.contractCalls)}
`
}

function getMethodDescription(method: string, request: any): string {
  const descriptions = {
    GET: 'Retrieves data from the blockchain or database',
    POST: 'Creates new data or executes blockchain transactions',
    PUT: 'Updates existing data completely',
    PATCH: 'Updates existing data partially',
    DELETE: 'Removes data or cancels transactions'
  }
  return descriptions[method as keyof typeof descriptions] || 'Performs the specified operation'
}

function generateUsageExamples(path: string, methods: string[], contractCalls: any[]) {
  return methods.reduce((examples, method) => {
    examples[method.toLowerCase()] = {
      curl: generateCurlExample(path, method, contractCalls),
      javascript: generateJavaScriptExample(path, method, contractCalls),
      response: generateResponseExample(contractCalls)
    }
    return examples
  }, {} as Record<string, any>)
}

function generateCurlExample(path: string, method: string, contractCalls: any[]): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (method === 'GET') {
    return `curl -X GET "${baseUrl}/api${path}"`
  }
  
  const sampleData = contractCalls.length > 0 
    ? contractCalls[0].parameters.reduce((acc, param) => {
        acc[param.name] = param.type === 'string' ? 'example' : param.type === 'number' ? 123 : true
        return acc
      }, {} as Record<string, any>)
    : { example: 'data' }

  return `curl -X ${method} "${baseUrl}/api${path}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sampleData, null, 2)}'`
}

function generateJavaScriptExample(path: string, method: string, contractCalls: any[]): string {
  if (method === 'GET') {
    return `const response = await fetch('/api${path}')
const data = await response.json()`
  }

  const sampleData = contractCalls.length > 0 
    ? contractCalls[0].parameters.reduce((acc, param) => {
        acc[param.name] = param.type === 'string' ? 'example' : param.type === 'number' ? 123 : true
        return acc
      }, {} as Record<string, any>)
    : { example: 'data' }

  return `const response = await fetch('/api${path}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${JSON.stringify(sampleData, null, 2)})
})
const data = await response.json()`
}

function generateResponseExample(contractCalls: any[]) {
  return {
    success: true,
    data: contractCalls.length > 0 
      ? { result: 'Contract function executed successfully' }
      : { message: 'Operation completed' }
  }
}

function generateDocumentationExamples(path: string, methods: string[], contractCalls: any[]): string {
  return methods.map(method => {
    const example = generateUsageExamples(path, [method], contractCalls)[method.toLowerCase()]
    return `
### ${method} Request

**cURL:**
\`\`\`bash
${example.curl}
\`\`\`

**JavaScript:**
\`\`\`javascript
${example.javascript}
\`\`\`

**Response:**
\`\`\`json
${JSON.stringify(example.response, null, 2)}
\`\`\`
`
  }).join('\n')
}

function getAPIRouteTemplates(pattern?: string) {
  const templates = {
    crud: [
      {
        name: 'Basic CRUD',
        path: '/items',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Standard CRUD operations for a resource'
      },
      {
        name: 'NFT CRUD',
        path: '/nfts',
        methods: ['GET', 'POST'],
        description: 'NFT-specific operations with minting',
        contractCalls: [{ contractName: 'NFTContract', functionName: 'mint' }]
      }
    ],
    blockchain: [
      {
        name: 'Token Transfer',
        path: '/transfer',
        methods: ['POST'],
        description: 'Transfer tokens between accounts',
        contractCalls: [{ contractName: 'TokenContract', functionName: 'transfer' }]
      },
      {
        name: 'Balance Check',
        path: '/balance',
        methods: ['GET'],
        description: 'Check account token balance',
        contractCalls: [{ contractName: 'TokenContract', functionName: 'getBalance' }]
      }
    ],
    utility: [
      {
        name: 'Health Check',
        path: '/health',
        methods: ['GET'],
        description: 'API health status endpoint'
      },
      {
        name: 'Upload Handler',
        path: '/upload',
        methods: ['POST'],
        description: 'File upload endpoint with validation'
      }
    ]
  }

  return pattern ? templates[pattern as keyof typeof templates] || [] : templates
}

function getAPIRoutePatterns() {
  return [
    {
      name: 'RESTful Resource',
      pattern: '/api/resources/:id',
      methods: ['GET', 'PUT', 'DELETE'],
      description: 'Standard REST pattern for individual resources'
    },
    {
      name: 'Collection Endpoint',
      pattern: '/api/collections',
      methods: ['GET', 'POST'],
      description: 'Handle collections of resources'
    },
    {
      name: 'Action Endpoint',
      pattern: '/api/resources/:id/action',
      methods: ['POST'],
      description: 'Perform specific actions on resources'
    },
    {
      name: 'Nested Resource',
      pattern: '/api/parent/:parentId/children',
      methods: ['GET', 'POST'],
      description: 'Handle nested resource relationships'
    }
  ]
}

function getAPIRouteExamples(pattern?: string) {
  const examples = {
    simple: `// Simple GET endpoint
export async function GET() {
  return NextResponse.json({ message: 'Hello World' })
}`,
    
    withValidation: `// POST endpoint with validation
export async function POST(req: Request) {
  const body = await req.json()
  
  // Validate input
  if (!body.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  
  return NextResponse.json({ success: true, data: body })
}`,
    
    blockchain: `// Blockchain integration endpoint
export async function POST(req: Request) {
  const { recipient, amount } = await req.json()
  
  try {
    const result = await flowClient.executeTransaction('transfer', [recipient, amount])
    return NextResponse.json({ success: true, transactionId: result.id })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}`
  }

  return pattern ? examples[pattern as keyof typeof examples] || examples.simple : examples
}