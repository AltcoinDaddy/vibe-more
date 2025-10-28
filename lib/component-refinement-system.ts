import { VibeSDK } from './vibesdk'
import { ReactComponentGenerator } from './react-component-generator'
import { APIRouteGenerator } from './api-route-generator'
import { RealtimeValidator } from './migration/realtime-validator'
import { ComponentRefinementRequest } from '@/components/types/chat-types'

/**
 * Refinement request for individual components
 */
export interface ComponentRefinementOptions {
  componentPath: string
  componentType: 'contract' | 'frontend' | 'api' | 'config'
  refinementType: 'modify' | 'add_feature' | 'fix_issue' | 'optimize'
  description: string
  currentCode: string
  relatedFiles?: RelatedFile[]
  preserveIntegrations?: boolean
}

/**
 * Related file information for context
 */
export interface RelatedFile {
  path: string
  type: 'contract' | 'component' | 'api' | 'config' | 'type'
  content: string
  relationship: 'imports' | 'exports' | 'calls' | 'extends' | 'implements'
}

/**
 * Refinement result with updated code and integration changes
 */
export interface ComponentRefinementResult {
  success: boolean
  updatedCode: string
  affectedFiles: AffectedFile[]
  integrationUpdates: IntegrationUpdate[]
  validation: ValidationResult
  warnings: string[]
  suggestions: string[]
}

/**
 * Files affected by the refinement
 */
export interface AffectedFile {
  path: string
  type: 'contract' | 'component' | 'api' | 'config' | 'type'
  action: 'created' | 'modified' | 'deleted'
  content: string
  reason: string
}

/**
 * Integration updates needed after refinement
 */
export interface IntegrationUpdate {
  type: 'import' | 'export' | 'function_call' | 'type_reference' | 'contract_binding'
  fromFile: string
  toFile: string
  oldReference: string
  newReference: string
  description: string
}

/**
 * Validation result for refined code
 */
export interface ValidationResult {
  isValid: boolean
  hasLegacyPatterns: boolean
  compilationErrors: string[]
  typeErrors: string[]
  integrationErrors: string[]
  warnings: string[]
  confidence: number
}

/**
 * Component-specific refinement system for full-stack projects
 * Handles refinement of individual components while maintaining integration consistency
 */
export class ComponentRefinementSystem {
  private vibeSDK: VibeSDK
  private componentGenerator: ReactComponentGenerator
  private apiGenerator: APIRouteGenerator
  private validator: RealtimeValidator

  constructor() {
    this.vibeSDK = new VibeSDK()
    this.componentGenerator = new ReactComponentGenerator()
    this.apiGenerator = new APIRouteGenerator()
    this.validator = new RealtimeValidator()
  }

  /**
   * Refine a specific component with integration awareness
   */
  async refineComponent(options: ComponentRefinementOptions): Promise<ComponentRefinementResult> {
    try {
      // Validate input code first
      const inputValidation = await this.validateInputCode(options.currentCode, options.componentType)
      
      if (!inputValidation.isValid && inputValidation.hasLegacyPatterns) {
        // Attempt to modernize legacy code first
        const modernizedCode = await this.modernizeLegacyCode(options.currentCode, options.componentType)
        if (modernizedCode) {
          options.currentCode = modernizedCode
        } else {
          return {
            success: false,
            updatedCode: options.currentCode,
            affectedFiles: [],
            integrationUpdates: [],
            validation: inputValidation,
            warnings: ['Input code contains legacy patterns that could not be automatically modernized'],
            suggestions: ['Please modernize the code to Cadence 1.0 syntax before refinement']
          }
        }
      }

      // Analyze component dependencies and relationships
      const dependencies = await this.analyzeDependencies(options)
      
      // Generate refinement based on component type
      let refinementResult: ComponentRefinementResult
      
      switch (options.componentType) {
        case 'contract':
          refinementResult = await this.refineContract(options, dependencies)
          break
        case 'frontend':
          refinementResult = await this.refineFrontendComponent(options, dependencies)
          break
        case 'api':
          refinementResult = await this.refineAPIRoute(options, dependencies)
          break
        case 'config':
          refinementResult = await this.refineConfiguration(options, dependencies)
          break
        default:
          throw new Error(`Unsupported component type: ${options.componentType}`)
      }

      // Validate the refined code
      const validation = await this.validateRefinedCode(
        refinementResult.updatedCode, 
        options.componentType,
        dependencies
      )

      refinementResult.validation = validation

      // If validation fails, attempt auto-correction
      if (!validation.isValid) {
        const correctedResult = await this.attemptAutoCorrection(refinementResult, options)
        if (correctedResult) {
          refinementResult = correctedResult
        }
      }

      return refinementResult

    } catch (error) {
      return {
        success: false,
        updatedCode: options.currentCode,
        affectedFiles: [],
        integrationUpdates: [],
        validation: {
          isValid: false,
          hasLegacyPatterns: false,
          compilationErrors: [error instanceof Error ? error.message : 'Unknown error'],
          typeErrors: [],
          integrationErrors: [],
          warnings: [],
          confidence: 0
        },
        warnings: ['Refinement failed due to an error'],
        suggestions: ['Please check the component code and try again']
      }
    }
  }

  /**
   * Refine a smart contract with frontend integration updates
   */
  private async refineContract(
    options: ComponentRefinementOptions,
    dependencies: ComponentDependencies
  ): Promise<ComponentRefinementResult> {
    // Create enhanced refinement prompt for contracts
    const enhancedPrompt = this.createContractRefinementPrompt(options, dependencies)
    
    // Refine the contract code
    const refinedCode = await this.vibeSDK.refineCode({
      code: options.currentCode,
      refinementRequest: enhancedPrompt
    })

    // Analyze what changed in the contract
    const contractChanges = await this.analyzeContractChanges(options.currentCode, refinedCode)
    
    // Generate updates for related frontend components
    const frontendUpdates = await this.generateFrontendUpdatesForContract(
      contractChanges,
      dependencies.relatedComponents
    )

    // Generate updates for related API routes
    const apiUpdates = await this.generateAPIUpdatesForContract(
      contractChanges,
      dependencies.relatedAPIRoutes
    )

    return {
      success: true,
      updatedCode: refinedCode,
      affectedFiles: [...frontendUpdates.affectedFiles, ...apiUpdates.affectedFiles],
      integrationUpdates: [...frontendUpdates.integrationUpdates, ...apiUpdates.integrationUpdates],
      validation: { isValid: true, hasLegacyPatterns: false, compilationErrors: [], typeErrors: [], integrationErrors: [], warnings: [], confidence: 0.9 },
      warnings: [],
      suggestions: []
    }
  }

  /**
   * Refine a React component with contract integration updates
   */
  private async refineFrontendComponent(
    options: ComponentRefinementOptions,
    dependencies: ComponentDependencies
  ): Promise<ComponentRefinementResult> {
    // Create enhanced refinement prompt for React components
    const enhancedPrompt = this.createFrontendRefinementPrompt(options, dependencies)
    
    // Use the component generator for refinement
    const componentSpec = this.extractComponentSpecFromCode(options.currentCode)
    const contractIntegrations = dependencies.relatedContracts.map(contract => ({
      contractName: this.extractContractName(contract.path),
      functions: this.extractContractFunctions(contract.content),
      events: this.extractContractEvents(contract.content),
      integrationCode: this.generateIntegrationCode(contract.content)
    }))

    // Generate refined component
    const refinedComponent = await this.componentGenerator.generateComponent(
      {
        ...componentSpec,
        name: this.extractComponentName(options.componentPath)
      },
      contractIntegrations
    )

    // Apply the refinement request to the generated component
    const finalRefinedCode = await this.applyRefinementToComponent(
      refinedComponent.code,
      options.description,
      options.refinementType
    )

    return {
      success: true,
      updatedCode: finalRefinedCode,
      affectedFiles: [{
        path: options.componentPath,
        type: 'component',
        action: 'modified',
        content: finalRefinedCode,
        reason: `Applied ${options.refinementType} refinement: ${options.description}`
      }],
      integrationUpdates: [],
      validation: { isValid: true, hasLegacyPatterns: false, compilationErrors: [], typeErrors: [], integrationErrors: [], warnings: [], confidence: 0.9 },
      warnings: [],
      suggestions: []
    }
  }

  /**
   * Refine an API route with contract integration updates
   */
  private async refineAPIRoute(
    options: ComponentRefinementOptions,
    dependencies: ComponentDependencies
  ): Promise<ComponentRefinementResult> {
    // Create enhanced refinement prompt for API routes
    const enhancedPrompt = this.createAPIRefinementPrompt(options, dependencies)
    
    // Extract route specification from current code
    const routeSpec = this.extractRouteSpecFromCode(options.currentCode)
    const contractIntegrations = dependencies.relatedContracts.map(contract => ({
      contractName: this.extractContractName(contract.path),
      functions: this.extractContractFunctions(contract.content),
      events: this.extractContractEvents(contract.content),
      integrationCode: this.generateIntegrationCode(contract.content)
    }))

    // Generate refined API route
    const refinedRoute = await this.apiGenerator.generateRoute(routeSpec, contractIntegrations)

    // Apply the refinement request to the generated route
    const finalRefinedCode = await this.applyRefinementToAPIRoute(
      refinedRoute.code,
      options.description,
      options.refinementType
    )

    return {
      success: true,
      updatedCode: finalRefinedCode,
      affectedFiles: [{
        path: options.componentPath,
        type: 'api',
        action: 'modified',
        content: finalRefinedCode,
        reason: `Applied ${options.refinementType} refinement: ${options.description}`
      }],
      integrationUpdates: [],
      validation: { isValid: true, hasLegacyPatterns: false, compilationErrors: [], typeErrors: [], integrationErrors: [], warnings: [], confidence: 0.9 },
      warnings: [],
      suggestions: []
    }
  }

  /**
   * Refine configuration files
   */
  private async refineConfiguration(
    options: ComponentRefinementOptions,
    dependencies: ComponentDependencies
  ): Promise<ComponentRefinementResult> {
    // For configuration files, use direct refinement
    const enhancedPrompt = `${options.description}

Please refine this configuration file while maintaining compatibility with the project structure.
Ensure all dependencies and settings remain valid.

Current configuration:
${options.currentCode}`

    const refinedCode = await this.vibeSDK.refineCode({
      code: options.currentCode,
      refinementRequest: enhancedPrompt
    })

    return {
      success: true,
      updatedCode: refinedCode,
      affectedFiles: [{
        path: options.componentPath,
        type: 'config',
        action: 'modified',
        content: refinedCode,
        reason: `Applied ${options.refinementType} refinement: ${options.description}`
      }],
      integrationUpdates: [],
      validation: { isValid: true, hasLegacyPatterns: false, compilationErrors: [], typeErrors: [], integrationErrors: [], warnings: [], confidence: 0.9 },
      warnings: [],
      suggestions: []
    }
  }

  /**
   * Validate input code before refinement
   */
  private async validateInputCode(code: string, componentType: string): Promise<ValidationResult> {
    if (componentType === 'contract') {
      const validation = await this.validator.validateUserInput(code)
      return {
        isValid: validation.isValid,
        hasLegacyPatterns: validation.hasLegacyPatterns,
        compilationErrors: validation.patterns.filter(p => p.severity === 'critical').map(p => p.description),
        typeErrors: [],
        integrationErrors: [],
        warnings: validation.patterns.filter(p => p.severity === 'warning').map(p => p.description),
        confidence: validation.confidence
      }
    }

    // For non-contract components, perform basic validation
    return {
      isValid: true,
      hasLegacyPatterns: false,
      compilationErrors: [],
      typeErrors: [],
      integrationErrors: [],
      warnings: [],
      confidence: 0.9
    }
  }

  /**
   * Modernize legacy code patterns
   */
  private async modernizeLegacyCode(code: string, componentType: string): Promise<string | null> {
    if (componentType === 'contract') {
      const modernization = this.validator.autoModernizeCode(code, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: false
      })

      if (modernization.confidence > 0.7 && !modernization.requiresManualReview) {
        return modernization.modernizedCode
      }
    }

    return null
  }

  /**
   * Analyze component dependencies and relationships
   */
  private async analyzeDependencies(options: ComponentRefinementOptions): Promise<ComponentDependencies> {
    const relatedFiles = options.relatedFiles || []
    
    return {
      relatedContracts: relatedFiles.filter(f => f.type === 'contract'),
      relatedComponents: relatedFiles.filter(f => f.type === 'component'),
      relatedAPIRoutes: relatedFiles.filter(f => f.type === 'api'),
      relatedConfigs: relatedFiles.filter(f => f.type === 'config'),
      relatedTypes: relatedFiles.filter(f => f.type === 'type')
    }
  }

  /**
   * Validate refined code
   */
  private async validateRefinedCode(
    code: string,
    componentType: string,
    dependencies: ComponentDependencies
  ): Promise<ValidationResult> {
    // Use the same validation as input validation
    return await this.validateInputCode(code, componentType)
  }

  /**
   * Attempt automatic correction of validation errors
   */
  private async attemptAutoCorrection(
    result: ComponentRefinementResult,
    options: ComponentRefinementOptions
  ): Promise<ComponentRefinementResult | null> {
    if (result.validation.hasLegacyPatterns && options.componentType === 'contract') {
      const correctedCode = await this.modernizeLegacyCode(result.updatedCode, options.componentType)
      if (correctedCode) {
        return {
          ...result,
          updatedCode: correctedCode,
          validation: await this.validateInputCode(correctedCode, options.componentType),
          warnings: [...result.warnings, 'Code was automatically modernized to fix legacy patterns']
        }
      }
    }

    return null
  }

  // Helper methods for creating refinement prompts and extracting information
  private createContractRefinementPrompt(options: ComponentRefinementOptions, dependencies: ComponentDependencies): string {
    return `${options.description}

CRITICAL REQUIREMENTS:
- Use ONLY Cadence 1.0 syntax (no legacy patterns)
- Maintain compatibility with existing frontend components
- Preserve all public interfaces unless explicitly requested to change them
- Follow Flow blockchain best practices

Related frontend components that depend on this contract:
${dependencies.relatedComponents.map(c => `- ${c.path}`).join('\n')}

Related API routes that use this contract:
${dependencies.relatedAPIRoutes.map(a => `- ${a.path}`).join('\n')}

Current contract code:
${options.currentCode}`
  }

  private createFrontendRefinementPrompt(options: ComponentRefinementOptions, dependencies: ComponentDependencies): string {
    return `${options.description}

Requirements:
- Use React 19 and TypeScript
- Maintain integration with existing smart contracts
- Use shadcn/ui components and Tailwind CSS
- Follow Next.js App Router patterns

Related contracts:
${dependencies.relatedContracts.map(c => `- ${c.path}`).join('\n')}

Current component code:
${options.currentCode}`
  }

  private createAPIRefinementPrompt(options: ComponentRefinementOptions, dependencies: ComponentDependencies): string {
    return `${options.description}

Requirements:
- Use Next.js App Router API routes
- Maintain integration with Flow blockchain contracts
- Include proper error handling and validation
- Use TypeScript for type safety

Related contracts:
${dependencies.relatedContracts.map(c => `- ${c.path}`).join('\n')}

Current API route code:
${options.currentCode}`
  }

  // Placeholder methods for code analysis and extraction
  private extractComponentSpecFromCode(code: string): any {
    // This would analyze the React component code and extract its specification
    return {
      type: 'interaction',
      props: [],
      styling: { framework: 'tailwind', theme: 'auto', responsive: true, accessibility: true },
      contractFunctions: []
    }
  }

  private extractRouteSpecFromCode(code: string): any {
    // This would analyze the API route code and extract its specification
    return {
      path: '/api/example',
      methods: ['GET', 'POST'],
      contractCalls: [],
      validation: { body: {}, query: {}, params: {} },
      authentication: false
    }
  }

  private extractContractName(path: string): string {
    return path.split('/').pop()?.replace('.cdc', '') || 'Contract'
  }

  private extractComponentName(path: string): string {
    return path.split('/').pop()?.replace('.tsx', '').replace('.jsx', '') || 'Component'
  }

  private extractContractFunctions(content: string): string[] {
    // This would parse the contract code and extract function names
    return ['mint', 'transfer', 'getBalance']
  }

  private extractContractEvents(content: string): string[] {
    // This would parse the contract code and extract event names
    return ['Minted', 'Transferred']
  }

  private generateIntegrationCode(content: string): string {
    // This would generate integration code based on the contract
    return '// Integration code placeholder'
  }

  private async applyRefinementToComponent(code: string, description: string, refinementType: string): Promise<string> {
    // Apply specific refinement to the component code
    const refinementPrompt = `Apply the following ${refinementType} to this React component:
${description}

Component code:
${code}

Return the updated component code with the requested changes.`

    return await this.vibeSDK.refineCode({
      code,
      refinementRequest: refinementPrompt
    })
  }

  private async applyRefinementToAPIRoute(code: string, description: string, refinementType: string): Promise<string> {
    // Apply specific refinement to the API route code
    const refinementPrompt = `Apply the following ${refinementType} to this Next.js API route:
${description}

API route code:
${code}

Return the updated API route code with the requested changes.`

    return await this.vibeSDK.refineCode({
      code,
      refinementRequest: refinementPrompt
    })
  }

  private async analyzeContractChanges(oldCode: string, newCode: string): Promise<ContractChanges> {
    // This would analyze what changed in the contract
    return {
      addedFunctions: [],
      removedFunctions: [],
      modifiedFunctions: [],
      addedEvents: [],
      removedEvents: [],
      modifiedEvents: []
    }
  }

  private async generateFrontendUpdatesForContract(
    changes: ContractChanges,
    relatedComponents: RelatedFile[]
  ): Promise<{ affectedFiles: AffectedFile[], integrationUpdates: IntegrationUpdate[] }> {
    // Generate updates for frontend components based on contract changes
    return {
      affectedFiles: [],
      integrationUpdates: []
    }
  }

  private async generateAPIUpdatesForContract(
    changes: ContractChanges,
    relatedAPIRoutes: RelatedFile[]
  ): Promise<{ affectedFiles: AffectedFile[], integrationUpdates: IntegrationUpdate[] }> {
    // Generate updates for API routes based on contract changes
    return {
      affectedFiles: [],
      integrationUpdates: []
    }
  }
}

/**
 * Component dependencies structure
 */
interface ComponentDependencies {
  relatedContracts: RelatedFile[]
  relatedComponents: RelatedFile[]
  relatedAPIRoutes: RelatedFile[]
  relatedConfigs: RelatedFile[]
  relatedTypes: RelatedFile[]
}

/**
 * Contract changes analysis result
 */
interface ContractChanges {
  addedFunctions: string[]
  removedFunctions: string[]
  modifiedFunctions: string[]
  addedEvents: string[]
  removedEvents: string[]
  modifiedEvents: string[]
}