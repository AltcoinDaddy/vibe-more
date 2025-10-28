import { GeneratedContract, GeneratedComponent, GeneratedAPIRoute } from './vibesdk'

/**
 * Code documentation generation options
 */
export interface CodeDocumentationOptions {
  includeJSDoc: boolean
  includeTypeDocumentation: boolean
  includeCadenceDocumentation: boolean
  includeInlineComments: boolean
  includeExamples: boolean
  documentationStyle: 'detailed' | 'concise' | 'minimal'
}

/**
 * JSDoc comment structure
 */
export interface JSDocComment {
  description: string
  params?: Array<{
    name: string
    type: string
    description: string
    optional?: boolean
  }>
  returns?: {
    type: string
    description: string
  }
  examples?: string[]
  since?: string
  author?: string
  throws?: Array<{
    type: string
    description: string
  }>
}

/**
 * TypeScript type documentation
 */
export interface TypeDocumentation {
  name: string
  description: string
  properties?: Array<{
    name: string
    type: string
    description: string
    optional: boolean
    example?: string
  }>
  methods?: Array<{
    name: string
    signature: string
    description: string
    params: Array<{
      name: string
      type: string
      description: string
    }>
    returns: {
      type: string
      description: string
    }
  }>
  examples?: string[]
}

/**
 * Cadence contract documentation
 */
export interface CadenceDocumentation {
  contractName: string
  description: string
  resources?: Array<{
    name: string
    description: string
    functions: Array<{
      name: string
      description: string
      parameters: Array<{
        name: string
        type: string
        description: string
      }>
      returns?: {
        type: string
        description: string
      }
    }>
  }>
  structs?: Array<{
    name: string
    description: string
    fields: Array<{
      name: string
      type: string
      description: string
    }>
  }>
  events?: Array<{
    name: string
    description: string
    fields: Array<{
      name: string
      type: string
      description: string
    }>
  }>
  functions?: Array<{
    name: string
    description: string
    access: string
    parameters: Array<{
      name: string
      type: string
      description: string
    }>
    returns?: {
      type: string
      description: string
    }
  }>
}

/**
 * Code documentation generator
 * Adds JSDoc comments, TypeScript documentation, and Cadence contract documentation
 */
export class CodeDocumentationGenerator {

  /**
   * Generate comprehensive code documentation for all generated components
   */
  async generateCodeDocumentation(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[],
    options: CodeDocumentationOptions
  ): Promise<{
    documentedContracts: GeneratedContract[]
    documentedComponents: GeneratedComponent[]
    documentedAPIRoutes: GeneratedAPIRoute[]
    typeDocumentation: TypeDocumentation[]
  }> {
    
    const documentedContracts = options.includeCadenceDocumentation 
      ? await this.documentContracts(contracts, options)
      : contracts

    const documentedComponents = options.includeJSDoc 
      ? await this.documentComponents(components, options)
      : components

    const documentedAPIRoutes = options.includeJSDoc 
      ? await this.documentAPIRoutes(apiRoutes, options)
      : apiRoutes

    const typeDocumentation = options.includeTypeDocumentation
      ? await this.generateTypeDocumentation(components, apiRoutes, options)
      : []

    return {
      documentedContracts,
      documentedComponents,
      documentedAPIRoutes,
      typeDocumentation
    }
  }

  /**
   * Add comprehensive documentation to Cadence smart contracts
   */
  private async documentContracts(
    contracts: GeneratedContract[],
    options: CodeDocumentationOptions
  ): Promise<GeneratedContract[]> {
    
    return Promise.all(contracts.map(async (contract) => {
      const documentedCode = await this.addCadenceDocumentation(contract.code, contract.filename, options)
      
      return {
        ...contract,
        code: documentedCode
      }
    }))
  }

  /**
   * Add JSDoc comments to React components
   */
  private async documentComponents(
    components: GeneratedComponent[],
    options: CodeDocumentationOptions
  ): Promise<GeneratedComponent[]> {
    
    return Promise.all(components.map(async (component) => {
      const documentedCode = await this.addJSDocToComponent(component.code, component.filename, options)
      
      return {
        ...component,
        code: documentedCode
      }
    }))
  }

  /**
   * Add JSDoc comments to API routes
   */
  private async documentAPIRoutes(
    apiRoutes: GeneratedAPIRoute[],
    options: CodeDocumentationOptions
  ): Promise<GeneratedAPIRoute[]> {
    
    return Promise.all(apiRoutes.map(async (route) => {
      const documentedCode = await this.addJSDocToAPIRoute(route.code, route.filename, options)
      
      return {
        ...route,
        code: documentedCode
      }
    }))
  }

  /**
   * Add comprehensive Cadence documentation to smart contracts
   */
  private async addCadenceDocumentation(
    code: string,
    filename: string,
    options: CodeDocumentationOptions
  ): Promise<string> {
    
    const contractName = filename.replace('.cdc', '')
    const lines = code.split('\n')
    const documentedLines: string[] = []

    // Add file header documentation
    documentedLines.push(`/// ${contractName} Smart Contract`)
    documentedLines.push(`/// `)
    documentedLines.push(`/// This contract provides ${this.inferContractPurpose(code)} functionality`)
    documentedLines.push(`/// on the Flow blockchain with secure transaction handling and event emission.`)
    documentedLines.push(`/// `)
    documentedLines.push(`/// @author Generated by VibeMore`)
    documentedLines.push(`/// @version 1.0.0`)
    documentedLines.push(`/// @since ${new Date().toISOString().split('T')[0]}`)
    documentedLines.push('')

    let inResource = false
    let inStruct = false
    let inFunction = false
    let braceCount = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // Document contract declaration
      if (trimmedLine.startsWith('pub contract') || trimmedLine.startsWith('access(all) contract')) {
        documentedLines.push(`/// Main contract implementing ${contractName} functionality`)
        documentedLines.push(`/// `)
        documentedLines.push(`/// This contract follows Flow best practices and includes:`)
        documentedLines.push(`/// - Secure resource management`)
        documentedLines.push(`/// - Event emission for frontend integration`)
        documentedLines.push(`/// - Access control and permissions`)
        documentedLines.push(`/// - Gas-optimized operations`)
        documentedLines.push(line)
        continue
      }

      // Document resources
      if (trimmedLine.startsWith('pub resource') || trimmedLine.startsWith('access(all) resource')) {
        const resourceName = this.extractResourceName(trimmedLine)
        documentedLines.push('')
        documentedLines.push(`    /// ${resourceName} resource`)
        documentedLines.push(`    /// `)
        documentedLines.push(`    /// Represents ${this.inferResourcePurpose(resourceName)} with secure ownership`)
        documentedLines.push(`    /// and transfer capabilities. This resource follows Flow's resource-oriented`)
        documentedLines.push(`    /// programming model for digital asset management.`)
        inResource = true
        braceCount = 0
      }

      // Document structs
      if (trimmedLine.startsWith('pub struct') || trimmedLine.startsWith('access(all) struct')) {
        const structName = this.extractStructName(trimmedLine)
        documentedLines.push('')
        documentedLines.push(`    /// ${structName} data structure`)
        documentedLines.push(`    /// `)
        documentedLines.push(`    /// Contains ${this.inferStructPurpose(structName)} information`)
        documentedLines.push(`    /// with type-safe field access and validation.`)
        inStruct = true
        braceCount = 0
      }

      // Document events
      if (trimmedLine.startsWith('pub event') || trimmedLine.startsWith('access(all) event')) {
        const eventName = this.extractEventName(trimmedLine)
        documentedLines.push('')
        documentedLines.push(`    /// ${eventName} event`)
        documentedLines.push(`    /// `)
        documentedLines.push(`    /// Emitted when ${this.inferEventPurpose(eventName)} occurs.`)
        documentedLines.push(`    /// Frontend applications can listen to this event for real-time updates.`)
      }

      // Document functions
      if (this.isFunctionDeclaration(trimmedLine)) {
        const functionInfo = this.extractFunctionInfo(trimmedLine)
        const indent = this.getIndentation(line)
        
        documentedLines.push('')
        documentedLines.push(`${indent}/// ${functionInfo.name}`)
        documentedLines.push(`${indent}/// `)
        documentedLines.push(`${indent}/// ${this.inferFunctionPurpose(functionInfo.name, functionInfo.access)}`)
        
        if (functionInfo.parameters.length > 0) {
          documentedLines.push(`${indent}/// `)
          functionInfo.parameters.forEach(param => {
            documentedLines.push(`${indent}/// @param ${param.name} ${this.inferParameterPurpose(param.name, param.type)}`)
          })
        }
        
        if (functionInfo.returnType && functionInfo.returnType !== 'Void') {
          documentedLines.push(`${indent}/// `)
          documentedLines.push(`${indent}/// @return ${this.inferReturnPurpose(functionInfo.returnType, functionInfo.name)}`)
        }

        if (options.includeExamples && options.documentationStyle === 'detailed') {
          documentedLines.push(`${indent}/// `)
          documentedLines.push(`${indent}/// @example`)
          documentedLines.push(`${indent}/// \`\`\`cadence`)
          documentedLines.push(`${indent}/// // Example usage of ${functionInfo.name}`)
          documentedLines.push(`${indent}/// let result = ${functionInfo.name}(${functionInfo.parameters.map(p => `${p.name}: ${this.generateExampleValue(p.type)}`).join(', ')})`)
          documentedLines.push(`${indent}/// \`\`\``)
        }

        inFunction = true
      }

      // Track brace counting for context
      if (line.includes('{')) braceCount++
      if (line.includes('}')) {
        braceCount--
        if (braceCount === 0) {
          inResource = false
          inStruct = false
          inFunction = false
        }
      }

      documentedLines.push(line)
    }

    return documentedLines.join('\n')
  }  /**

   * Add JSDoc comments to React components
   */
  private async addJSDocToComponent(
    code: string,
    filename: string,
    options: CodeDocumentationOptions
  ): Promise<string> {
    
    const componentName = filename.replace('.tsx', '').replace('.jsx', '')
    const lines = code.split('\n')
    const documentedLines: string[] = []

    // Add file header
    documentedLines.push(`/**`)
    documentedLines.push(` * ${componentName} Component`)
    documentedLines.push(` * `)
    documentedLines.push(` * ${this.inferComponentPurpose(componentName)} component built with React and TypeScript.`)
    documentedLines.push(` * Integrates with Flow blockchain for decentralized functionality.`)
    documentedLines.push(` * `)
    documentedLines.push(` * @author Generated by VibeMore`)
    documentedLines.push(` * @version 1.0.0`)
    documentedLines.push(` * @since ${new Date().toISOString().split('T')[0]}`)
    documentedLines.push(` */`)
    documentedLines.push('')

    let inImports = true
    let inInterface = false
    let inComponent = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // Skip import section
      if (trimmedLine.startsWith('import') || trimmedLine.startsWith('export') && trimmedLine.includes('from')) {
        documentedLines.push(line)
        continue
      }

      if (inImports && trimmedLine !== '' && !trimmedLine.startsWith('import')) {
        inImports = false
      }

      // Document interfaces
      if (trimmedLine.startsWith('interface') || trimmedLine.startsWith('export interface')) {
        const interfaceName = this.extractInterfaceName(trimmedLine)
        documentedLines.push('')
        documentedLines.push(`/**`)
        documentedLines.push(` * Props interface for ${componentName} component`)
        documentedLines.push(` * `)
        documentedLines.push(` * Defines the expected properties and their types for proper`)
        documentedLines.push(` * component initialization and type safety.`)
        documentedLines.push(` */`)
        inInterface = true
      }

      // Document component function
      if (this.isComponentDeclaration(trimmedLine, componentName)) {
        documentedLines.push('')
        documentedLines.push(`/**`)
        documentedLines.push(` * ${componentName} functional component`)
        documentedLines.push(` * `)
        documentedLines.push(` * ${this.inferComponentPurpose(componentName)} with the following features:`)
        documentedLines.push(` * - TypeScript type safety`)
        documentedLines.push(` * - Responsive design with Tailwind CSS`)
        documentedLines.push(` * - Flow blockchain integration`)
        documentedLines.push(` * - Error handling and loading states`)
        documentedLines.push(` * `)
        
        if (this.hasProps(trimmedLine)) {
          documentedLines.push(` * @param props - Component properties`)
          documentedLines.push(` * @param props.className - Additional CSS classes`)
          documentedLines.push(` * @param props.children - Child components or content`)
        }
        
        documentedLines.push(` * @returns JSX element representing the ${componentName.toLowerCase()} interface`)
        
        if (options.includeExamples && options.documentationStyle === 'detailed') {
          documentedLines.push(` * `)
          documentedLines.push(` * @example`)
          documentedLines.push(` * \`\`\`tsx`)
          documentedLines.push(` * <${componentName} className="custom-class">`)
          documentedLines.push(` *   <p>Content here</p>`)
          documentedLines.push(` * </${componentName}>`)
          documentedLines.push(` * \`\`\``)
        }
        
        documentedLines.push(` */`)
        inComponent = true
      }

      // Document custom hooks
      if (trimmedLine.startsWith('const use') || trimmedLine.startsWith('export const use')) {
        const hookName = this.extractHookName(trimmedLine)
        documentedLines.push('')
        documentedLines.push(`/**`)
        documentedLines.push(` * ${hookName} custom hook`)
        documentedLines.push(` * `)
        documentedLines.push(` * ${this.inferHookPurpose(hookName)} with state management`)
        documentedLines.push(` * and side effect handling for React components.`)
        documentedLines.push(` * `)
        documentedLines.push(` * @returns Hook state and methods`)
        documentedLines.push(` */`)
      }

      // Document utility functions
      if (this.isUtilityFunction(trimmedLine) && !inComponent) {
        const functionName = this.extractFunctionName(trimmedLine)
        const indent = this.getIndentation(line)
        documentedLines.push('')
        documentedLines.push(`${indent}/**`)
        documentedLines.push(`${indent} * ${functionName} utility function`)
        documentedLines.push(`${indent} * `)
        documentedLines.push(`${indent} * ${this.inferUtilityPurpose(functionName)}`)
        documentedLines.push(`${indent} */`)
      }

      documentedLines.push(line)
    }

    return documentedLines.join('\n')
  }

  /**
   * Add JSDoc comments to API routes
   */
  private async addJSDocToAPIRoute(
    code: string,
    filename: string,
    options: CodeDocumentationOptions
  ): Promise<string> {
    
    const routeName = filename.replace('/route.ts', '').replace('app/api/', '')
    const lines = code.split('\n')
    const documentedLines: string[] = []

    // Add file header
    documentedLines.push(`/**`)
    documentedLines.push(` * ${routeName} API Route`)
    documentedLines.push(` * `)
    documentedLines.push(` * Next.js API route for ${this.inferAPIRoutePurpose(routeName)} operations.`)
    documentedLines.push(` * Integrates with Flow blockchain and provides secure endpoints`)
    documentedLines.push(` * for frontend applications.`)
    documentedLines.push(` * `)
    documentedLines.push(` * @author Generated by VibeMore`)
    documentedLines.push(` * @version 1.0.0`)
    documentedLines.push(` * @since ${new Date().toISOString().split('T')[0]}`)
    documentedLines.push(` */`)
    documentedLines.push('')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // Document HTTP method handlers
      if (this.isHTTPMethodHandler(trimmedLine)) {
        const method = this.extractHTTPMethod(trimmedLine)
        documentedLines.push('')
        documentedLines.push(`/**`)
        documentedLines.push(` * Handle ${method} requests to ${routeName} endpoint`)
        documentedLines.push(` * `)
        documentedLines.push(` * ${this.inferHTTPMethodPurpose(method, routeName)}`)
        documentedLines.push(` * Includes request validation, error handling, and response formatting.`)
        documentedLines.push(` * `)
        documentedLines.push(` * @param request - Next.js request object`)
        documentedLines.push(` * @returns Promise<Response> - JSON response with operation result`)
        documentedLines.push(` * `)
        documentedLines.push(` * @throws {400} Bad Request - Invalid request parameters`)
        documentedLines.push(` * @throws {401} Unauthorized - Authentication required`)
        documentedLines.push(` * @throws {500} Internal Server Error - Server processing error`)
        
        if (options.includeExamples && options.documentationStyle === 'detailed') {
          documentedLines.push(` * `)
          documentedLines.push(` * @example`)
          documentedLines.push(` * \`\`\`typescript`)
          documentedLines.push(` * const response = await fetch('/api/${routeName}', {`)
          documentedLines.push(` *   method: '${method}',`)
          documentedLines.push(` *   headers: { 'Content-Type': 'application/json' },`)
          documentedLines.push(` *   body: JSON.stringify({ /* request data */ })`)
          documentedLines.push(` * })`)
          documentedLines.push(` * const data = await response.json()`)
          documentedLines.push(` * \`\`\``)
        }
        
        documentedLines.push(` */`)
      }

      // Document validation schemas
      if (trimmedLine.includes('z.object') || trimmedLine.includes('zod')) {
        documentedLines.push('')
        documentedLines.push(`/**`)
        documentedLines.push(` * Request validation schema`)
        documentedLines.push(` * `)
        documentedLines.push(` * Defines the expected structure and types for incoming requests`)
        documentedLines.push(` * using Zod for runtime type checking and validation.`)
        documentedLines.push(` */`)
      }

      // Document helper functions
      if (this.isHelperFunction(trimmedLine)) {
        const functionName = this.extractFunctionName(trimmedLine)
        const indent = this.getIndentation(line)
        documentedLines.push('')
        documentedLines.push(`${indent}/**`)
        documentedLines.push(`${indent} * ${functionName} helper function`)
        documentedLines.push(`${indent} * `)
        documentedLines.push(`${indent} * ${this.inferHelperFunctionPurpose(functionName)}`)
        documentedLines.push(`${indent} */`)
      }

      documentedLines.push(line)
    }

    return documentedLines.join('\n')
  }

  /**
   * Generate TypeScript type documentation
   */
  private async generateTypeDocumentation(
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[],
    options: CodeDocumentationOptions
  ): Promise<TypeDocumentation[]> {
    
    const typeDocumentation: TypeDocumentation[] = []

    // Generate documentation for component prop types
    for (const component of components) {
      const componentName = component.filename.replace('.tsx', '').replace('.jsx', '')
      const propTypes = this.extractPropTypes(component.code)
      
      if (propTypes.length > 0) {
        typeDocumentation.push({
          name: `${componentName}Props`,
          description: `Props interface for the ${componentName} component`,
          properties: propTypes.map(prop => ({
            name: prop.name,
            type: prop.type,
            description: this.inferPropPurpose(prop.name, prop.type),
            optional: prop.optional,
            example: this.generateTypeExample(prop.type)
          })),
          examples: [
            `const props: ${componentName}Props = {`,
            ...propTypes.map(prop => `  ${prop.name}: ${this.generateTypeExample(prop.type)},`),
            `}`
          ]
        })
      }
    }

    // Generate documentation for API request/response types
    for (const route of apiRoutes) {
      const routeName = route.filename.replace('/route.ts', '').replace('app/api/', '')
      const requestTypes = this.extractRequestTypes(route.code)
      const responseTypes = this.extractResponseTypes(route.code)

      if (requestTypes.length > 0) {
        typeDocumentation.push({
          name: `${this.toPascalCase(routeName)}Request`,
          description: `Request type for ${routeName} API endpoint`,
          properties: requestTypes,
          examples: [
            `const request: ${this.toPascalCase(routeName)}Request = {`,
            ...requestTypes.map(prop => `  ${prop.name}: ${this.generateTypeExample(prop.type)},`),
            `}`
          ]
        })
      }

      if (responseTypes.length > 0) {
        typeDocumentation.push({
          name: `${this.toPascalCase(routeName)}Response`,
          description: `Response type for ${routeName} API endpoint`,
          properties: responseTypes,
          examples: [
            `const response: ${this.toPascalCase(routeName)}Response = {`,
            ...responseTypes.map(prop => `  ${prop.name}: ${this.generateTypeExample(prop.type)},`),
            `}`
          ]
        })
      }
    }

    return typeDocumentation
  }

  // Helper methods for code analysis and documentation generation

  /**
   * Infer the purpose of a contract based on its code
   */
  private inferContractPurpose(code: string): string {
    if (code.includes('NFT') || code.includes('NonFungibleToken')) return 'NFT collection'
    if (code.includes('FungibleToken') || code.includes('Token')) return 'fungible token'
    if (code.includes('Marketplace') || code.includes('Sale')) return 'marketplace'
    if (code.includes('DAO') || code.includes('Governance')) return 'DAO governance'
    if (code.includes('Staking') || code.includes('Reward')) return 'staking and rewards'
    return 'smart contract'
  }

  /**
   * Extract resource name from declaration
   */
  private extractResourceName(line: string): string {
    const match = line.match(/resource\s+(\w+)/)
    return match ? match[1] : 'Resource'
  }

  /**
   * Extract struct name from declaration
   */
  private extractStructName(line: string): string {
    const match = line.match(/struct\s+(\w+)/)
    return match ? match[1] : 'Struct'
  }

  /**
   * Extract event name from declaration
   */
  private extractEventName(line: string): string {
    const match = line.match(/event\s+(\w+)/)
    return match ? match[1] : 'Event'
  }

  /**
   * Check if line is a function declaration
   */
  private isFunctionDeclaration(line: string): boolean {
    return line.includes('fun ') || line.includes('function ')
  }

  /**
   * Extract function information from declaration
   */
  private extractFunctionInfo(line: string): {
    name: string
    access: string
    parameters: Array<{ name: string; type: string }>
    returnType?: string
  } {
    const accessMatch = line.match(/(pub|access\([^)]+\)|priv)/)
    const access = accessMatch ? accessMatch[1] : 'private'
    
    const nameMatch = line.match(/fun\s+(\w+)/)
    const name = nameMatch ? nameMatch[1] : 'function'
    
    const paramMatch = line.match(/\(([^)]*)\)/)
    const paramString = paramMatch ? paramMatch[1] : ''
    
    const parameters = paramString.split(',').map(param => {
      const parts = param.trim().split(':')
      return {
        name: parts[0]?.trim() || 'param',
        type: parts[1]?.trim() || 'Any'
      }
    }).filter(p => p.name !== 'param' || p.type !== 'Any')
    
    const returnMatch = line.match(/:\s*([^{]+)/)
    const returnType = returnMatch ? returnMatch[1].trim() : undefined
    
    return { name, access, parameters, returnType }
  }

  /**
   * Get indentation from line
   */
  private getIndentation(line: string): string {
    const match = line.match(/^(\s*)/)
    return match ? match[1] : ''
  }

  /**
   * Infer resource purpose from name
   */
  private inferResourcePurpose(name: string): string {
    if (name.toLowerCase().includes('nft')) return 'a non-fungible token'
    if (name.toLowerCase().includes('collection')) return 'a token collection'
    if (name.toLowerCase().includes('vault')) return 'a token vault'
    if (name.toLowerCase().includes('admin')) return 'administrative capabilities'
    return 'a blockchain resource'
  }

  /**
   * Infer struct purpose from name
   */
  private inferStructPurpose(name: string): string {
    if (name.toLowerCase().includes('metadata')) return 'metadata'
    if (name.toLowerCase().includes('info')) return 'information'
    if (name.toLowerCase().includes('data')) return 'data'
    if (name.toLowerCase().includes('config')) return 'configuration'
    return 'structured data'
  }

  /**
   * Infer event purpose from name
   */
  private inferEventPurpose(name: string): string {
    if (name.toLowerCase().includes('mint')) return 'a token is minted'
    if (name.toLowerCase().includes('transfer')) return 'a token is transferred'
    if (name.toLowerCase().includes('burn')) return 'a token is burned'
    if (name.toLowerCase().includes('deposit')) return 'a deposit occurs'
    if (name.toLowerCase().includes('withdraw')) return 'a withdrawal occurs'
    return 'an important state change'
  }

  /**
   * Infer function purpose from name and access
   */
  private inferFunctionPurpose(name: string, access: string): string {
    const isPublic = access.includes('pub') || access.includes('access(all)')
    const prefix = isPublic ? 'Public function to' : 'Internal function to'
    
    if (name.toLowerCase().includes('mint')) return `${prefix} mint new tokens`
    if (name.toLowerCase().includes('transfer')) return `${prefix} transfer tokens between accounts`
    if (name.toLowerCase().includes('burn')) return `${prefix} burn existing tokens`
    if (name.toLowerCase().includes('deposit')) return `${prefix} deposit tokens into an account`
    if (name.toLowerCase().includes('withdraw')) return `${prefix} withdraw tokens from an account`
    if (name.toLowerCase().includes('get')) return `${prefix} retrieve data or state`
    if (name.toLowerCase().includes('set')) return `${prefix} update data or state`
    if (name.toLowerCase().includes('create')) return `${prefix} create new resources or data`
    if (name.toLowerCase().includes('destroy')) return `${prefix} destroy resources or data`
    return `${prefix} perform ${name.toLowerCase()} operations`
  }

  /**
   * Infer parameter purpose from name and type
   */
  private inferParameterPurpose(name: string, type: string): string {
    if (name.toLowerCase().includes('recipient')) return `The recipient address for the operation`
    if (name.toLowerCase().includes('amount')) return `The amount to process`
    if (name.toLowerCase().includes('id')) return `The unique identifier`
    if (name.toLowerCase().includes('metadata')) return `The metadata information`
    if (name.toLowerCase().includes('address')) return `The blockchain address`
    if (type.includes('Address')) return `The Flow blockchain address`
    if (type.includes('UFix64')) return `The decimal amount value`
    if (type.includes('UInt64')) return `The unsigned integer value`
    if (type.includes('String')) return `The string value`
    return `The ${name} parameter of type ${type}`
  }

  /**
   * Infer return purpose from type and function name
   */
  private inferReturnPurpose(returnType: string, functionName: string): string {
    if (returnType.includes('Bool')) return 'Boolean indicating success or failure'
    if (returnType.includes('UFix64')) return 'Decimal value result'
    if (returnType.includes('UInt64')) return 'Unsigned integer result'
    if (returnType.includes('String')) return 'String value result'
    if (returnType.includes('Address')) return 'Flow blockchain address'
    if (returnType.includes('Array')) return 'Array of results'
    if (returnType.includes('Dictionary')) return 'Dictionary mapping of results'
    return `${returnType} value from ${functionName} operation`
  }

  /**
   * Generate example value for a given type
   */
  private generateExampleValue(type: string): string {
    if (type.includes('String')) return '"example"'
    if (type.includes('UFix64')) return '10.0'
    if (type.includes('UInt64')) return '42'
    if (type.includes('Bool')) return 'true'
    if (type.includes('Address')) return '0x1234567890abcdef'
    if (type.includes('Array')) return '[]'
    if (type.includes('Dictionary')) return '{}'
    return 'value'
  }

  /**
   * Infer component purpose from name
   */
  private inferComponentPurpose(name: string): string {
    if (name.toLowerCase().includes('nft')) return 'NFT management'
    if (name.toLowerCase().includes('wallet')) return 'Wallet connection and management'
    if (name.toLowerCase().includes('marketplace')) return 'Marketplace interaction'
    if (name.toLowerCase().includes('form')) return 'Form handling and validation'
    if (name.toLowerCase().includes('modal')) return 'Modal dialog'
    if (name.toLowerCase().includes('card')) return 'Information display card'
    if (name.toLowerCase().includes('button')) return 'Interactive button'
    if (name.toLowerCase().includes('list')) return 'Data list display'
    return 'User interface'
  }

  /**
   * Extract interface name from declaration
   */
  private extractInterfaceName(line: string): string {
    const match = line.match(/interface\s+(\w+)/)
    return match ? match[1] : 'Interface'
  }

  /**
   * Check if line is a component declaration
   */
  private isComponentDeclaration(line: string, componentName: string): boolean {
    return line.includes(`function ${componentName}`) || 
           line.includes(`const ${componentName}`) ||
           line.includes(`export function ${componentName}`) ||
           line.includes(`export const ${componentName}`)
  }

  /**
   * Check if component has props
   */
  private hasProps(line: string): boolean {
    return line.includes('(') && line.includes(')')
  }

  /**
   * Extract hook name from declaration
   */
  private extractHookName(line: string): string {
    const match = line.match(/const\s+(use\w+)/)
    return match ? match[1] : 'useHook'
  }

  /**
   * Infer hook purpose from name
   */
  private inferHookPurpose(name: string): string {
    if (name.toLowerCase().includes('contract')) return 'Manages smart contract interactions'
    if (name.toLowerCase().includes('wallet')) return 'Handles wallet connection and state'
    if (name.toLowerCase().includes('transaction')) return 'Manages blockchain transactions'
    if (name.toLowerCase().includes('nft')) return 'Handles NFT operations'
    if (name.toLowerCase().includes('token')) return 'Manages token operations'
    return 'Provides stateful logic'
  }

  /**
   * Check if line is a utility function
   */
  private isUtilityFunction(line: string): boolean {
    return (line.includes('function ') || line.includes('const ') && line.includes(' = ')) &&
           !line.includes('use') && !line.includes('component')
  }

  /**
   * Extract function name from declaration
   */
  private extractFunctionName(line: string): string {
    let match = line.match(/function\s+(\w+)/)
    if (match) return match[1]
    
    match = line.match(/const\s+(\w+)\s*=/)
    return match ? match[1] : 'function'
  }

  /**
   * Infer utility function purpose from name
   */
  private inferUtilityPurpose(name: string): string {
    if (name.toLowerCase().includes('format')) return 'Formats data for display'
    if (name.toLowerCase().includes('validate')) return 'Validates input data'
    if (name.toLowerCase().includes('parse')) return 'Parses data from input'
    if (name.toLowerCase().includes('convert')) return 'Converts data between formats'
    if (name.toLowerCase().includes('calculate')) return 'Performs calculations'
    if (name.toLowerCase().includes('generate')) return 'Generates new data'
    return 'Provides utility functionality'
  }

  /**
   * Infer API route purpose from name
   */
  private inferAPIRoutePurpose(name: string): string {
    if (name.toLowerCase().includes('nft')) return 'NFT'
    if (name.toLowerCase().includes('token')) return 'token'
    if (name.toLowerCase().includes('marketplace')) return 'marketplace'
    if (name.toLowerCase().includes('wallet')) return 'wallet'
    if (name.toLowerCase().includes('transaction')) return 'transaction'
    if (name.toLowerCase().includes('auth')) return 'authentication'
    return name.replace('-', ' ')
  }

  /**
   * Check if line is HTTP method handler
   */
  private isHTTPMethodHandler(line: string): boolean {
    return line.includes('export async function GET') ||
           line.includes('export async function POST') ||
           line.includes('export async function PUT') ||
           line.includes('export async function DELETE') ||
           line.includes('export async function PATCH')
  }

  /**
   * Extract HTTP method from handler declaration
   */
  private extractHTTPMethod(line: string): string {
    if (line.includes('GET')) return 'GET'
    if (line.includes('POST')) return 'POST'
    if (line.includes('PUT')) return 'PUT'
    if (line.includes('DELETE')) return 'DELETE'
    if (line.includes('PATCH')) return 'PATCH'
    return 'HTTP'
  }

  /**
   * Infer HTTP method purpose
   */
  private inferHTTPMethodPurpose(method: string, routeName: string): string {
    const operation = routeName.replace('-', ' ')
    switch (method) {
      case 'GET': return `Retrieves ${operation} data from the blockchain`
      case 'POST': return `Creates new ${operation} entries or executes transactions`
      case 'PUT': return `Updates existing ${operation} data`
      case 'DELETE': return `Removes ${operation} data`
      case 'PATCH': return `Partially updates ${operation} data`
      default: return `Handles ${operation} operations`
    }
  }

  /**
   * Check if line is helper function
   */
  private isHelperFunction(line: string): boolean {
    return (line.includes('async function') || line.includes('function')) &&
           !line.includes('export async function GET') &&
           !line.includes('export async function POST') &&
           !line.includes('export async function PUT') &&
           !line.includes('export async function DELETE')
  }

  /**
   * Infer helper function purpose from name
   */
  private inferHelperFunctionPurpose(name: string): string {
    if (name.toLowerCase().includes('validate')) return 'Validates request data and parameters'
    if (name.toLowerCase().includes('authenticate')) return 'Handles user authentication'
    if (name.toLowerCase().includes('authorize')) return 'Checks user authorization'
    if (name.toLowerCase().includes('process')) return 'Processes business logic'
    if (name.toLowerCase().includes('format')) return 'Formats response data'
    if (name.toLowerCase().includes('error')) return 'Handles error responses'
    return 'Provides helper functionality for the API route'
  }

  /**
   * Extract prop types from component code
   */
  private extractPropTypes(code: string): Array<{
    name: string
    type: string
    optional: boolean
  }> {
    // This is a simplified implementation - in practice, you'd use a TypeScript parser
    const interfaceMatch = code.match(/interface\s+\w+Props\s*{([^}]+)}/s)
    if (!interfaceMatch) return []

    const propsString = interfaceMatch[1]
    const props: Array<{ name: string; type: string; optional: boolean }> = []

    const propLines = propsString.split('\n').filter(line => line.trim())
    for (const line of propLines) {
      const match = line.match(/(\w+)(\?)?:\s*([^;]+)/)
      if (match) {
        props.push({
          name: match[1],
          type: match[3].trim(),
          optional: !!match[2]
        })
      }
    }

    return props
  }

  /**
   * Extract request types from API route code
   */
  private extractRequestTypes(code: string): Array<{
    name: string
    type: string
    description: string
    optional: boolean
  }> {
    // Simplified implementation - would use proper TypeScript parsing
    return [
      {
        name: 'data',
        type: 'any',
        description: 'Request payload data',
        optional: false
      }
    ]
  }

  /**
   * Extract response types from API route code
   */
  private extractResponseTypes(code: string): Array<{
    name: string
    type: string
    description: string
    optional: boolean
  }> {
    // Simplified implementation - would use proper TypeScript parsing
    return [
      {
        name: 'success',
        type: 'boolean',
        description: 'Indicates if the operation was successful',
        optional: false
      },
      {
        name: 'data',
        type: 'any',
        description: 'Response data payload',
        optional: true
      },
      {
        name: 'message',
        type: 'string',
        description: 'Human-readable response message',
        optional: true
      }
    ]
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('')
  }

  /**
   * Infer prop purpose from name and type
   */
  private inferPropPurpose(name: string, type: string): string {
    if (name === 'className') return 'Additional CSS classes for styling'
    if (name === 'children') return 'Child components or content'
    if (name.toLowerCase().includes('onclick')) return 'Click event handler'
    if (name.toLowerCase().includes('onchange')) return 'Change event handler'
    if (name.toLowerCase().includes('disabled')) return 'Whether the component is disabled'
    if (name.toLowerCase().includes('loading')) return 'Whether the component is in loading state'
    if (type === 'string') return `String value for ${name}`
    if (type === 'number') return `Numeric value for ${name}`
    if (type === 'boolean') return `Boolean flag for ${name}`
    return `${name} property`
  }

  /**
   * Generate example value for TypeScript type
   */
  private generateTypeExample(type: string): string {
    if (type === 'string') return '"example"'
    if (type === 'number') return '42'
    if (type === 'boolean') return 'true'
    if (type.includes('[]')) return '[]'
    if (type.includes('{}') || type === 'object') return '{}'
    if (type === 'React.ReactNode') return '<div>Content</div>'
    return 'undefined'
  }
}