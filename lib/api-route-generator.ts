import { APIRouteSpecification, GeneratedAPIRoute, ContractIntegration } from './vibesdk'

/**
 * API route generator for Next.js with Flow blockchain integration
 */
export class APIRouteGenerator {

  /**
   * Generate a Next.js API route with Flow integration
   */
  async generateRoute(
    spec: APIRouteSpecification,
    contractIntegrations: ContractIntegration[]
  ): Promise<GeneratedAPIRoute> {
    const routeCode = this.buildRouteCode(spec, contractIntegrations)
    const contractCalls = spec.contractCalls.map(call => call.functionName)

    return {
      filename: this.getRouteFilename(spec.path),
      code: routeCode,
      endpoint: spec.path,
      methods: spec.methods,
      contractCalls
    }
  }

  /**
   * Build the complete API route code
   */
  private buildRouteCode(spec: APIRouteSpecification, contractIntegrations: ContractIntegration[]): string {
    const imports = this.generateImports(spec)
    const validation = this.generateValidation(spec)
    const handlers = this.generateHandlers(spec, contractIntegrations)

    return `${imports}

${validation}

${handlers}`
  }

  /**
   * Generate import statements
   */
  private generateImports(spec: APIRouteSpecification): string {
    const imports = [
      `import { NextRequest, NextResponse } from 'next/server'`,
      `import { z } from 'zod'`,
      `import { flowClient } from '@/lib/flow-client'`
    ]

    if (spec.authentication) {
      imports.push(`import { verifyAuth } from '@/lib/auth-security'`)
    }

    return imports.join('\n')
  }

  /**
   * Generate validation schemas
   */
  private generateValidation(spec: APIRouteSpecification): string {
    const schemas = []

    if (spec.validation.body && Object.keys(spec.validation.body).length > 0) {
      const bodySchema = `const bodySchema = z.object({
  ${Object.entries(spec.validation.body).map(([key, type]) => 
    `${key}: z.${this.getZodType(type)}`
  ).join(',\n  ')}
})`
      schemas.push(bodySchema)
    }

    if (spec.validation.query && Object.keys(spec.validation.query).length > 0) {
      const querySchema = `const querySchema = z.object({
  ${Object.entries(spec.validation.query).map(([key, type]) => 
    `${key}: z.${this.getZodType(type)}`
  ).join(',\n  ')}
})`
      schemas.push(querySchema)
    }

    if (spec.validation.params && Object.keys(spec.validation.params).length > 0) {
      const paramsSchema = `const paramsSchema = z.object({
  ${Object.entries(spec.validation.params).map(([key, type]) => 
    `${key}: z.${this.getZodType(type)}`
  ).join(',\n  ')}
})`
      schemas.push(paramsSchema)
    }

    return schemas.join('\n\n')
  }

  /**
   * Generate HTTP method handlers
   */
  private generateHandlers(spec: APIRouteSpecification, contractIntegrations: ContractIntegration[]): string {
    const handlers = spec.methods.map(method => {
      switch (method) {
        case 'GET':
          return this.generateGetHandler(spec, contractIntegrations)
        case 'POST':
          return this.generatePostHandler(spec, contractIntegrations)
        case 'PUT':
          return this.generatePutHandler(spec, contractIntegrations)
        case 'DELETE':
          return this.generateDeleteHandler(spec, contractIntegrations)
        case 'PATCH':
          return this.generatePatchHandler(spec, contractIntegrations)
        default:
          return ''
      }
    }).filter(Boolean)

    return handlers.join('\n\n')
  }

  /**
   * Generate GET handler
   */
  private generateGetHandler(spec: APIRouteSpecification, contractIntegrations: ContractIntegration[]): string {
    const authCheck = spec.authentication ? `
  // Verify authentication
  const authResult = await verifyAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }` : ''

    const queryValidation = spec.validation.query && Object.keys(spec.validation.query).length > 0 ? `
  // Validate query parameters
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams.entries())
  
  const queryValidation = querySchema.safeParse(queryParams)
  if (!queryValidation.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: queryValidation.error.errors },
      { status: 400 }
    )
  }
  
  const query = queryValidation.data` : ''

    const contractCalls = spec.contractCalls.map(call => `
    // Execute ${call.functionName} on ${call.contractName}
    const ${call.functionName}Result = await flowClient.executeScript(
      '${call.contractName}',
      '${call.functionName}',
      [${call.parameters.map(p => `query?.${p.name} || ''`).join(', ')}]
    )`).join('')

    return `export async function GET(request: NextRequest) {
  try {${authCheck}${queryValidation}

    // Execute contract calls${contractCalls}

    return NextResponse.json({
      success: true,
      data: {
        ${spec.contractCalls.map(call => `${call.functionName}: ${call.functionName}Result`).join(',\n        ')}
      }
    })
  } catch (error) {
    console.error('GET ${spec.path} error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}`
  }

  /**
   * Generate POST handler
   */
  private generatePostHandler(spec: APIRouteSpecification, contractIntegrations: ContractIntegration[]): string {
    const authCheck = spec.authentication ? `
  // Verify authentication
  const authResult = await verifyAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }` : ''

    const bodyValidation = spec.validation.body && Object.keys(spec.validation.body).length > 0 ? `
  // Parse and validate request body
  const body = await request.json()
  const bodyValidation = bodySchema.safeParse(body)
  if (!bodyValidation.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: bodyValidation.error.errors },
      { status: 400 }
    )
  }
  
  const data = bodyValidation.data` : `
  // Parse request body
  const data = await request.json()`

    const contractCalls = spec.contractCalls.map(call => `
    // Execute ${call.functionName} transaction on ${call.contractName}
    const ${call.functionName}Result = await flowClient.executeTransaction(
      '${call.contractName}',
      '${call.functionName}',
      [${call.parameters.map(p => `data.${p.name}`).join(', ')}]
    )`).join('')

    return `export async function POST(request: NextRequest) {
  try {${authCheck}${bodyValidation}

    // Execute contract transactions${contractCalls}

    return NextResponse.json({
      success: true,
      data: {
        ${spec.contractCalls.map(call => `${call.functionName}: ${call.functionName}Result`).join(',\n        ')}
      }
    }, { status: 201 })
  } catch (error) {
    console.error('POST ${spec.path} error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}`
  }

  /**
   * Generate PUT handler
   */
  private generatePutHandler(spec: APIRouteSpecification, contractIntegrations: ContractIntegration[]): string {
    const authCheck = spec.authentication ? `
  // Verify authentication
  const authResult = await verifyAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }` : ''

    const bodyValidation = spec.validation.body && Object.keys(spec.validation.body).length > 0 ? `
  // Parse and validate request body
  const body = await request.json()
  const bodyValidation = bodySchema.safeParse(body)
  if (!bodyValidation.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: bodyValidation.error.errors },
      { status: 400 }
    )
  }
  
  const data = bodyValidation.data` : `
  // Parse request body
  const data = await request.json()`

    const contractCalls = spec.contractCalls.map(call => `
    // Update ${call.functionName} on ${call.contractName}
    const ${call.functionName}Result = await flowClient.executeTransaction(
      '${call.contractName}',
      '${call.functionName}',
      [${call.parameters.map(p => `data.${p.name}`).join(', ')}]
    )`).join('')

    return `export async function PUT(request: NextRequest) {
  try {${authCheck}${bodyValidation}

    // Execute contract updates${contractCalls}

    return NextResponse.json({
      success: true,
      data: {
        ${spec.contractCalls.map(call => `${call.functionName}: ${call.functionName}Result`).join(',\n        ')}
      }
    })
  } catch (error) {
    console.error('PUT ${spec.path} error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}`
  }

  /**
   * Generate DELETE handler
   */
  private generateDeleteHandler(spec: APIRouteSpecification, contractIntegrations: ContractIntegration[]): string {
    const authCheck = spec.authentication ? `
  // Verify authentication
  const authResult = await verifyAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }` : ''

    const paramsValidation = spec.validation.params && Object.keys(spec.validation.params).length > 0 ? `
  // Validate path parameters
  const paramsValidation = paramsSchema.safeParse(params)
  if (!paramsValidation.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: paramsValidation.error.errors },
      { status: 400 }
    )
  }
  
  const validatedParams = paramsValidation.data` : ''

    const contractCalls = spec.contractCalls.map(call => `
    // Delete/destroy ${call.functionName} on ${call.contractName}
    const ${call.functionName}Result = await flowClient.executeTransaction(
      '${call.contractName}',
      '${call.functionName}',
      [${call.parameters.map(p => `validatedParams?.${p.name} || params.${p.name}`).join(', ')}]
    )`).join('')

    return `export async function DELETE(request: NextRequest, { params }: { params: any }) {
  try {${authCheck}${paramsValidation}

    // Execute contract deletions${contractCalls}

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully',
      data: {
        ${spec.contractCalls.map(call => `${call.functionName}: ${call.functionName}Result`).join(',\n        ')}
      }
    })
  } catch (error) {
    console.error('DELETE ${spec.path} error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}`
  }

  /**
   * Generate PATCH handler
   */
  private generatePatchHandler(spec: APIRouteSpecification, contractIntegrations: ContractIntegration[]): string {
    const authCheck = spec.authentication ? `
  // Verify authentication
  const authResult = await verifyAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }` : ''

    const bodyValidation = spec.validation.body && Object.keys(spec.validation.body).length > 0 ? `
  // Parse and validate request body (partial update)
  const body = await request.json()
  const bodyValidation = bodySchema.partial().safeParse(body)
  if (!bodyValidation.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: bodyValidation.error.errors },
      { status: 400 }
    )
  }
  
  const data = bodyValidation.data` : `
  // Parse request body
  const data = await request.json()`

    const contractCalls = spec.contractCalls.map(call => `
    // Partially update ${call.functionName} on ${call.contractName}
    const ${call.functionName}Result = await flowClient.executeTransaction(
      '${call.contractName}',
      '${call.functionName}',
      [${call.parameters.map(p => `data.${p.name}`).join(', ')}]
    )`).join('')

    return `export async function PATCH(request: NextRequest, { params }: { params: any }) {
  try {${authCheck}${bodyValidation}

    // Execute contract partial updates${contractCalls}

    return NextResponse.json({
      success: true,
      data: {
        ${spec.contractCalls.map(call => `${call.functionName}: ${call.functionName}Result`).join(',\n        ')}
      }
    })
  } catch (error) {
    console.error('PATCH ${spec.path} error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}`
  }

  /**
   * Get the filename for the API route
   */
  private getRouteFilename(path: string): string {
    // Convert API path to Next.js file structure
    // e.g., /api/nft/mint -> nft/mint/route.ts
    const cleanPath = path.replace(/^\/api\//, '').replace(/\/$/, '')
    return `${cleanPath}/route.ts`
  }

  /**
   * Convert type to Zod type
   */
  private getZodType(type: any): string {
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'string':
          return 'string()'
        case 'number':
          return 'number()'
        case 'boolean':
          return 'boolean()'
        case 'array':
          return 'array(z.string())'
        case 'object':
          return 'object({})'
        default:
          return 'string()'
      }
    }
    
    if (typeof type === 'object') {
      if (type.type === 'array') {
        return `array(z.${this.getZodType(type.items)})`
      }
      if (type.type === 'object') {
        const properties = Object.entries(type.properties || {})
          .map(([key, value]) => `${key}: z.${this.getZodType(value)}`)
          .join(', ')
        return `object({ ${properties} })`
      }
    }
    
    return 'string()'
  }
}