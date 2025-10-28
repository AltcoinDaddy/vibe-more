import { VibeSDK, FullStackGenerationOptions, FullStackGenerationResult, GeneratedContract, GeneratedComponent, GeneratedAPIRoute, GeneratedConfig, ProjectStructure, IntegrationCode, ParsedPromptResult, FullStackProjectRequest } from './vibesdk'
import { ReactComponentGenerator } from './react-component-generator'
import { APIRouteGenerator } from './api-route-generator'
// import { ProjectScaffolder } from './project-structure-generator'
import { ConfigurationGenerator } from './configuration-generator'
import { DocumentationGenerator, DocumentationOptions, GeneratedDocumentation } from './documentation-generator'
import { CodeDocumentationGenerator, CodeDocumentationOptions } from './code-documentation-generator'
import { ComponentRefinementSystem, ComponentRefinementOptions, ComponentRefinementResult } from './component-refinement-system'
import { ProjectConsistencyManager, ConsistencyCheckResult } from './project-consistency-manager'
import { IntegrationRepairSystem, RepairOperationResult } from './integration-repair-system'
import { FullStackGenerationCache, getGenerationCache } from './fullstack-generation-cache'
import { FullStackAnalyticsSystem, getAnalyticsSystem } from './fullstack-analytics-system'

/**
 * Progress tracking for multi-component generation
 */
export interface GenerationProgress {
  phase: 'parsing' | 'contracts' | 'frontend' | 'api' | 'config' | 'integration' | 'complete'
  progress: number // 0-100
  currentTask: string
  completedTasks: string[]
  errors: string[]
  warnings: string[]
}

/**
 * Generation status for individual components
 */
export interface ComponentGenerationStatus {
  contracts: 'pending' | 'in-progress' | 'completed' | 'failed'
  frontend: 'pending' | 'in-progress' | 'completed' | 'failed'
  api: 'pending' | 'in-progress' | 'completed' | 'failed'
  config: 'pending' | 'in-progress' | 'completed' | 'failed'
  integration: 'pending' | 'in-progress' | 'completed' | 'failed'
}

/**
 * Dependency resolution result
 */
export interface DependencyResolution {
  resolved: boolean
  dependencies: Map<string, string[]>
  circularDependencies: string[]
  missingDependencies: string[]
}

/**
 * Multi-component generation orchestrator
 * Coordinates parallel generation of contracts, frontend, and API components
 */
export class FullStackOrchestrator {
  private vibeSDK: VibeSDK
  private componentGenerator: ReactComponentGenerator
  private apiGenerator: APIRouteGenerator
  // private scaffolder: ProjectScaffolder
  private configGenerator: ConfigurationGenerator
  private documentationGenerator: DocumentationGenerator
  private codeDocumentationGenerator: CodeDocumentationGenerator
  private refinementSystem: ComponentRefinementSystem
  private consistencyManager: ProjectConsistencyManager
  private repairSystem: IntegrationRepairSystem
  private cache: FullStackGenerationCache
  private analytics: FullStackAnalyticsSystem
  
  private progressCallback?: (progress: GenerationProgress) => void
  private currentProgress: GenerationProgress

  constructor(progressCallback?: (progress: GenerationProgress) => void) {
    this.vibeSDK = new VibeSDK()
    this.componentGenerator = new ReactComponentGenerator()
    this.apiGenerator = new APIRouteGenerator()
    // this.scaffolder = new ProjectScaffolder()
    this.configGenerator = new ConfigurationGenerator()
    this.documentationGenerator = new DocumentationGenerator()
    this.codeDocumentationGenerator = new CodeDocumentationGenerator()
    this.refinementSystem = new ComponentRefinementSystem()
    this.consistencyManager = new ProjectConsistencyManager()
    this.repairSystem = new IntegrationRepairSystem()
    this.cache = getGenerationCache()
    this.analytics = getAnalyticsSystem()
    
    this.progressCallback = progressCallback
    this.currentProgress = {
      phase: 'parsing',
      progress: 0,
      currentTask: 'Initializing',
      completedTasks: [],
      errors: [],
      warnings: []
    }
  }

  /**
   * Generate a complete full-stack dApp project
   */
  async generateFullStackProject(request: FullStackProjectRequest): Promise<FullStackGenerationResult> {
    // Start analytics session
    const sessionId = this.analytics.startSession(
      request.projectName,
      {
        prompt: request.description,
        projectName: request.projectName,
        includeFrontend: true,
        includeAPI: true,
        uiFramework: 'next',
        stylingFramework: 'tailwind',
        deploymentTarget: 'vercel'
      },
      { projectType: 'custom', backendRequirements: { contractTypes: [], functions: [], events: [], resources: [] }, frontendRequirements: { pages: [], components: [], interactions: [], styling: { framework: 'tailwind', theme: 'auto', responsive: true, accessibility: true } }, integrationRequirements: { apiEndpoints: [], contractBindings: [], dataFlow: [] }, confidence: 0.8 }
    )

    try {
      this.updateProgress('parsing', 5, 'Parsing project requirements')

      // Parse the user's request to identify components needed
      const parsedRequirements = await this.parseProjectRequirements(request)
      
      this.updateProgress('parsing', 10, 'Checking for cached project structure')

      // Check for cached project structure for incremental generation
      const cachedStructure = this.cache.getProjectStructure(
        request.projectName,
        {
          prompt: request.description,
          projectName: request.projectName,
          includeFrontend: true,
          includeAPI: true,
          uiFramework: 'next',
          stylingFramework: 'tailwind',
          deploymentTarget: 'vercel'
        },
        parsedRequirements
      )

      if (cachedStructure) {
        this.analytics.recordCacheEvent(sessionId, true)
        this.updateProgress('parsing', 15, 'Using cached project structure for faster generation')
      } else {
        this.analytics.recordCacheEvent(sessionId, false)
        this.updateProgress('parsing', 15, 'Analyzing component dependencies')
      }

      // Analyze dependencies between components
      const dependencyResolution = this.resolveDependencies(parsedRequirements)
      
      if (!dependencyResolution.resolved) {
        throw new Error(`Dependency resolution failed: ${dependencyResolution.circularDependencies.join(', ')}`)
      }

      this.updateProgress('contracts', 20, 'Starting parallel component generation')

      // Generate components in parallel with dependency awareness
      const generationResults = await this.generateComponentsInParallel(parsedRequirements, dependencyResolution)

      this.updateProgress('integration', 80, 'Integrating components')

      // Integrate all components
      const integrationCode = await this.integrateComponents(generationResults)

      this.updateProgress('integration', 82, 'Adding code documentation and comments')

      // Add JSDoc comments and code documentation
      const documentedCode = await this.addCodeDocumentation(
        generationResults.contracts,
        generationResults.components,
        generationResults.apiRoutes
      )

      this.updateProgress('integration', 85, 'Generating project documentation')

      // Generate comprehensive documentation
      const documentation = await this.generateProjectDocumentation(
        request,
        documentedCode.documentedContracts,
        documentedCode.documentedComponents,
        documentedCode.documentedAPIRoutes,
        generationResults.configs
      )

      this.updateProgress('integration', 90, 'Creating project structure')

      // Create final project structure
      const projectStructure: ProjectStructure = {
        directories: [],
        files: [],
        configurations: []
      }

      this.updateProgress('complete', 100, 'Project generation complete')

      const result = {
        smartContracts: documentedCode.documentedContracts,
        frontendComponents: documentedCode.documentedComponents,
        apiRoutes: documentedCode.documentedAPIRoutes,
        configurations: generationResults.configs,
        projectStructure,
        integrationCode,
        documentation
      }

      // Cache the generated components for future use
      this.cacheGeneratedComponents(result, parsedRequirements, request)

      // Complete analytics session
      this.analytics.completeSession(sessionId, result)

      return result

    } catch (error) {
      this.currentProgress.errors.push(error instanceof Error ? error.message : 'Unknown error')
      this.updateProgress(this.currentProgress.phase, this.currentProgress.progress, `Error: ${error}`)
      
      // Complete analytics session with error
      this.analytics.completeSession(sessionId, {} as FullStackGenerationResult, error instanceof Error ? error.message : 'Unknown error')
      
      throw error
    }
  }

  /**
   * Parse project requirements from natural language description
   */
  private async parseProjectRequirements(request: FullStackProjectRequest): Promise<ParsedPromptResult> {
    // Use VibeSDK's prompt parsing capabilities
    const prompt = `
      Project: ${request.projectName}
      Description: ${request.description}
      Features: ${request.features.map(f => `${f.type}: ${JSON.stringify(f.specifications)}`).join(', ')}
      UI Requirements: ${JSON.stringify(request.uiRequirements)}
      Deployment: ${request.deploymentRequirements.target}
    `

    // Intelligently parse the project requirements based on the description
    const contractTypes = request.features.map(f => f.type)
    const inferredComponents = this.inferRequiredComponents(request.description, contractTypes)
    const inferredAPIRoutes = this.inferRequiredAPIRoutes(request.description, contractTypes)
    
    const parsedResult: ParsedPromptResult = {
      projectType: this.inferProjectType(request),
      backendRequirements: {
        contractTypes: contractTypes,
        functions: [],
        events: [],
        resources: []
      },
      frontendRequirements: {
        pages: request.uiRequirements.pages.length > 0 
          ? request.uiRequirements.pages.map(p => p.name)
          : ['Home', 'Dashboard'], // Default pages
        components: request.uiRequirements.components.length > 0
          ? request.uiRequirements.components.map(c => c.name)
          : inferredComponents, // Inferred components
        interactions: [],
        styling: {
          ...request.uiRequirements.styling,
          responsive: request.uiRequirements.responsive,
          accessibility: request.uiRequirements.accessibility
        }
      },
      integrationRequirements: {
        apiEndpoints: inferredAPIRoutes,
        contractBindings: contractTypes.map(type => `${type}:mint`),
        dataFlow: []
      },
      confidence: 0.85
    }

    return parsedResult
  }

  /**
   * Resolve dependencies between components
   */
  private resolveDependencies(requirements: ParsedPromptResult): DependencyResolution {
    const dependencies = new Map<string, string[]>()
    const circularDependencies: string[] = []
    const missingDependencies: string[] = []

    // Build dependency graph
    // Contracts are typically independent
    requirements.backendRequirements.contractTypes.forEach(contractType => {
      dependencies.set(`contract:${contractType}`, [])
    })

    // Frontend components depend on contracts
    requirements.frontendRequirements.components.forEach(component => {
      const contractDeps = requirements.integrationRequirements.contractBindings
        .filter(binding => binding.includes(component))
        .map(binding => `contract:${binding.split(':')[0]}`)
      
      dependencies.set(`component:${component}`, contractDeps)
    })

    // API routes depend on contracts
    requirements.integrationRequirements.apiEndpoints.forEach(endpoint => {
      const contractDeps = requirements.backendRequirements.contractTypes
        .map(type => `contract:${type}`)
      
      dependencies.set(`api:${endpoint}`, contractDeps)
    })

    // Check for circular dependencies (simplified check)
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) {
        circularDependencies.push(node)
        return true
      }
      if (visited.has(node)) {
        return false
      }

      visited.add(node)
      recursionStack.add(node)

      const deps = dependencies.get(node) || []
      for (const dep of deps) {
        if (hasCycle(dep)) {
          return true
        }
      }

      recursionStack.delete(node)
      return false
    }

    // Check all nodes for cycles
    for (const node of Array.from(dependencies.keys())) {
      if (!visited.has(node)) {
        hasCycle(node)
      }
    }

    return {
      resolved: circularDependencies.length === 0,
      dependencies,
      circularDependencies,
      missingDependencies
    }
  }

  /**
   * Generate all components in parallel with proper dependency ordering
   */
  private async generateComponentsInParallel(
    requirements: ParsedPromptResult,
    dependencyResolution: DependencyResolution
  ): Promise<{
    contracts: GeneratedContract[]
    components: GeneratedComponent[]
    apiRoutes: GeneratedAPIRoute[]
    configs: GeneratedConfig[]
  }> {
    const status: ComponentGenerationStatus = {
      contracts: 'pending',
      frontend: 'pending',
      api: 'pending',
      config: 'pending',
      integration: 'pending'
    }

    // Start with contracts (they have no dependencies)
    this.updateProgress('contracts', 25, 'Generating smart contracts')
    status.contracts = 'in-progress'
    
    const contractPromises = requirements.backendRequirements.contractTypes.map(async (contractType) => {
      try {
        const prompt = `Generate a ${contractType} smart contract with the following requirements: ${JSON.stringify(requirements.backendRequirements)}`
        const code = await this.vibeSDK.generateCode({ prompt })
        
        return {
          filename: `${contractType}.cdc`,
          code,
          validation: { isValid: true, errors: [], warnings: [] },
          dependencies: []
        } as GeneratedContract
      } catch (error) {
        this.currentProgress.errors.push(`Contract generation failed for ${contractType}: ${error}`)
        throw error
      }
    })

    const contracts = await Promise.all(contractPromises)
    status.contracts = 'completed'
    this.updateProgress('frontend', 40, 'Generating React components')

    // Generate frontend components (depend on contracts)
    status.frontend = 'in-progress'
    
    const componentPromises = requirements.frontendRequirements.components.map(async (componentName) => {
      try {
        const contractIntegrations = contracts.map(contract => ({
          contractName: contract.filename.replace('.cdc', ''),
          functions: ['mint', 'transfer', 'getBalance'], // Simplified
          events: ['Minted', 'Transferred'],
          integrationCode: `// Integration code for ${contract.filename}`
        }))

        return await this.componentGenerator.generateComponent({
          name: componentName,
          type: 'interaction',
          props: [],
          styling: requirements.frontendRequirements.styling,
          contractFunctions: ['mint', 'transfer']
        }, contractIntegrations)
      } catch (error) {
        this.currentProgress.errors.push(`Component generation failed for ${componentName}: ${error}`)
        throw error
      }
    })

    const components = await Promise.all(componentPromises)
    status.frontend = 'completed'
    this.updateProgress('api', 60, 'Generating API routes')

    // Generate API routes (depend on contracts)
    status.api = 'in-progress'
    
    const apiPromises = requirements.integrationRequirements.apiEndpoints.map(async (endpoint) => {
      try {
        return await this.apiGenerator.generateRoute({
          path: endpoint,
          methods: ['GET', 'POST'],
          contractCalls: contracts.map(c => ({
            contractName: c.filename.replace('.cdc', ''),
            functionName: 'mint',
            parameters: [],
            returnType: 'String'
          })),
          validation: { body: {}, query: {}, params: {} },
          authentication: false
        }, contracts.map(c => ({
          contractName: c.filename.replace('.cdc', ''),
          functions: ['mint'],
          events: [],
          integrationCode: ''
        })))
      } catch (error) {
        this.currentProgress.errors.push(`API generation failed for ${endpoint}: ${error}`)
        throw error
      }
    })

    const apiRoutes = await Promise.all(apiPromises)
    status.api = 'completed'
    this.updateProgress('config', 70, 'Generating configuration files')

    // Generate configuration files
    status.config = 'in-progress'
    
    const configs = await this.configGenerator.generateConfigurations({
      projectName: requirements.projectType,
      dependencies: this.extractDependencies(contracts, components, apiRoutes),
      framework: 'next',
      styling: 'tailwind',
      typescript: true
    })
    
    status.config = 'completed'

    return {
      contracts,
      components,
      apiRoutes,
      configs
    }
  }

  /**
   * Integrate all generated components
   */
  private async integrateComponents(generationResults: {
    contracts: GeneratedContract[]
    components: GeneratedComponent[]
    apiRoutes: GeneratedAPIRoute[]
    configs: GeneratedConfig[]
  }): Promise<IntegrationCode> {
    // Generate React hooks for contract interactions
    const hooks = generationResults.contracts.map(contract => {
      const contractName = contract.filename.replace('.cdc', '')
      return `
// Auto-generated hook for ${contractName}
import { useState, useEffect } from 'react'
import { useFlowClient } from '@/lib/flow-client'

export function use${contractName}() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const flowClient = useFlowClient()

  const mint = async (recipient: string, metadata: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await flowClient.executeTransaction('${contractName}', 'mint', [recipient, metadata])
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mint,
    isLoading,
    error
  }
}
`
    })

    // Generate utility functions
    const utilities = [
      `
// Auto-generated Flow client utilities
export const flowConfig = {
  network: process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet',
  contracts: {
    ${generationResults.contracts.map(c => 
      `${c.filename.replace('.cdc', '')}: process.env.NEXT_PUBLIC_${c.filename.replace('.cdc', '').toUpperCase()}_ADDRESS`
    ).join(',\n    ')}
  }
}
`
    ]

    // Generate TypeScript types
    const types = generationResults.contracts.map(contract => {
      const contractName = contract.filename.replace('.cdc', '')
      return `
// Auto-generated types for ${contractName}
export interface ${contractName}NFT {
  id: string
  name: string
  description: string
  thumbnail: string
  metadata: Record<string, any>
}

export interface ${contractName}Collection {
  ids: string[]
  nfts: ${contractName}NFT[]
}
`
    })

    return {
      hooks,
      utilities,
      types
    }
  }

  /**
   * Extract dependencies from generated components
   */
  private extractDependencies(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): string[] {
    const dependencies = new Set<string>()

    // Base Next.js dependencies
    dependencies.add('next')
    dependencies.add('react')
    dependencies.add('react-dom')
    dependencies.add('typescript')
    dependencies.add('@types/react')
    dependencies.add('@types/node')

    // UI dependencies
    dependencies.add('tailwindcss')
    dependencies.add('@tailwindcss/forms')
    dependencies.add('lucide-react')

    // Flow dependencies
    dependencies.add('@onflow/fcl')
    dependencies.add('@onflow/types')

    // Form handling
    dependencies.add('react-hook-form')
    dependencies.add('zod')
    dependencies.add('@hookform/resolvers')

    return Array.from(dependencies)
  }

  /**
   * Infer required React components based on project description and contract types
   */
  private inferRequiredComponents(description: string, contractTypes: string[]): string[] {
    const components: string[] = []
    const lowerDesc = description.toLowerCase()
    
    // Always include basic components
    components.push('WalletConnect', 'Navigation')
    
    // Add components based on contract types
    contractTypes.forEach(type => {
      switch (type) {
        case 'nft':
        case 'custom':
          if (lowerDesc.includes('marketplace')) {
            components.push('NFTMarketplace', 'NFTCard', 'NFTList', 'MintingForm')
          } else {
            components.push('NFTCollection', 'NFTCard', 'MintingForm')
          }
          break
        case 'token':
          components.push('TokenDashboard', 'TransferForm', 'BalanceDisplay')
          break
        case 'dao':
          components.push('ProposalList', 'VotingInterface', 'GovernanceDashboard')
          break
        case 'defi':
          components.push('StakingInterface', 'LiquidityPool', 'RewardsDisplay')
          break
        case 'marketplace':
          components.push('MarketplaceGrid', 'ListingForm', 'BuyInterface')
          break
      }
    })
    
    // Add components based on description keywords
    if (lowerDesc.includes('dashboard')) components.push('Dashboard')
    if (lowerDesc.includes('profile')) components.push('UserProfile')
    if (lowerDesc.includes('admin')) components.push('AdminPanel')
    
    return [...new Set(components)] // Remove duplicates
  }

  /**
   * Infer required API routes based on project description and contract types
   */
  private inferRequiredAPIRoutes(description: string, contractTypes: string[]): string[] {
    const routes: string[] = []
    
    // Add routes based on contract types
    contractTypes.forEach(type => {
      switch (type) {
        case 'nft':
        case 'custom':
          routes.push('/api/nft/mint', '/api/nft/transfer', '/api/nft/metadata')
          break
        case 'token':
          routes.push('/api/token/transfer', '/api/token/balance')
          break
        case 'dao':
          routes.push('/api/dao/propose', '/api/dao/vote', '/api/dao/proposals')
          break
        case 'defi':
          routes.push('/api/defi/stake', '/api/defi/unstake', '/api/defi/rewards')
          break
        case 'marketplace':
          routes.push('/api/marketplace/list', '/api/marketplace/buy', '/api/marketplace/listings')
          break
      }
    })
    
    // Always include auth and health check routes
    routes.push('/api/auth/wallet', '/api/health')
    
    return [...new Set(routes)] // Remove duplicates
  }

  /**
   * Infer project type from request
   */
  private inferProjectType(request: FullStackProjectRequest): any {
    const features = request.features.map(f => f.type)
    
    if (features.includes('marketplace')) return 'marketplace'
    if (features.includes('nft')) return 'nft-collection'
    if (features.includes('dao')) return 'dao'
    if (features.includes('defi')) return 'defi-protocol'
    if (features.includes('token')) return 'token'
    
    return 'custom'
  }

  /**
   * Update progress and notify callback
   */
  private updateProgress(phase: GenerationProgress['phase'], progress: number, currentTask: string) {
    this.currentProgress = {
      ...this.currentProgress,
      phase,
      progress,
      currentTask,
      completedTasks: progress > this.currentProgress.progress 
        ? [...this.currentProgress.completedTasks, this.currentProgress.currentTask]
        : this.currentProgress.completedTasks
    }

    if (this.progressCallback) {
      this.progressCallback(this.currentProgress)
    }
  }

  /**
   * Add comprehensive code documentation and comments
   */
  private async addCodeDocumentation(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Promise<{
    documentedContracts: GeneratedContract[]
    documentedComponents: GeneratedComponent[]
    documentedAPIRoutes: GeneratedAPIRoute[]
  }> {
    const codeDocumentationOptions: CodeDocumentationOptions = {
      includeJSDoc: true,
      includeTypeDocumentation: true,
      includeCadenceDocumentation: true,
      includeInlineComments: true,
      includeExamples: true,
      documentationStyle: 'detailed'
    }

    const result = await this.codeDocumentationGenerator.generateCodeDocumentation(
      contracts,
      components,
      apiRoutes,
      codeDocumentationOptions
    )

    return {
      documentedContracts: result.documentedContracts,
      documentedComponents: result.documentedComponents,
      documentedAPIRoutes: result.documentedAPIRoutes
    }
  }

  /**
   * Generate comprehensive project documentation
   */
  private async generateProjectDocumentation(
    request: FullStackProjectRequest,
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[],
    configs: GeneratedConfig[]
  ): Promise<GeneratedDocumentation> {
    const documentationOptions: DocumentationOptions = {
      projectName: request.projectName,
      description: request.description,
      author: 'Generated by VibeMore',
      version: '1.0.0',
      includeSetupInstructions: true,
      includeAPIDocumentation: apiRoutes.length > 0,
      includeComponentExamples: components.length > 0,
      includeDeploymentGuide: true,
      includeTroubleshooting: true
    }

    return await this.documentationGenerator.generateProjectDocumentation(
      request,
      contracts,
      components,
      apiRoutes,
      configs,
      documentationOptions
    )
  }

  /**
   * Refine a specific component in the full-stack project
   */
  async refineProjectComponent(
    componentPath: string,
    componentType: 'contract' | 'frontend' | 'api' | 'config',
    refinementType: 'modify' | 'add_feature' | 'fix_issue' | 'optimize',
    description: string,
    projectFiles: Map<string, string>
  ): Promise<{
    refinementResult: ComponentRefinementResult
    consistencyResult: ConsistencyCheckResult
    repairResult?: RepairOperationResult
  }> {
    try {
      this.updateProgress('integration', 10, 'Analyzing project structure')

      // Analyze current project structure
      const projectStructure = await this.consistencyManager.analyzeProjectStructure(projectFiles)

      this.updateProgress('integration', 20, 'Preparing refinement context')

      // Get current code for the component
      const currentCode = projectFiles.get(componentPath) || ''
      
      // Find related files
      const relatedFiles = Array.from(projectFiles.entries())
        .filter(([path]) => path !== componentPath)
        .map(([path, content]) => ({
          path,
          type: this.determineFileType(path),
          content,
          relationship: this.determineRelationship(componentPath, path, content)
        }))
        .filter(file => file.relationship !== 'none')

      this.updateProgress('integration', 40, 'Refining component')

      // Perform component refinement
      const refinementOptions: ComponentRefinementOptions = {
        componentPath,
        componentType,
        refinementType,
        description,
        currentCode,
        relatedFiles,
        preserveIntegrations: true
      }

      const refinementResult = await this.refinementSystem.refineComponent(refinementOptions)

      this.updateProgress('integration', 70, 'Checking project consistency')

      // Update project structure and check consistency
      const consistencyResult = await this.consistencyManager.updateProjectAfterRefinement(
        refinementResult,
        componentPath
      )

      this.updateProgress('integration', 85, 'Repairing broken connections')

      // Repair any broken connections if needed
      let repairResult: RepairOperationResult | undefined
      if (!consistencyResult.isConsistent) {
        repairResult = await this.repairSystem.repairBrokenConnections(
          projectStructure,
          refinementResult,
          componentPath
        )
      }

      this.updateProgress('complete', 100, 'Refinement complete')

      return {
        refinementResult,
        consistencyResult,
        repairResult
      }

    } catch (error) {
      this.currentProgress.errors.push(error instanceof Error ? error.message : 'Unknown error')
      this.updateProgress(this.currentProgress.phase, this.currentProgress.progress, `Error: ${error}`)
      throw error
    }
  }

  /**
   * Perform project-wide consistency check
   */
  async checkProjectConsistency(projectFiles: Map<string, string>): Promise<ConsistencyCheckResult> {
    const projectStructure = await this.consistencyManager.analyzeProjectStructure(projectFiles)
    return await this.consistencyManager.checkProjectConsistency()
  }

  /**
   * Create a version snapshot of the project
   */
  async createProjectSnapshot(
    description: string,
    changedFiles: string[],
    projectFiles: Map<string, string>
  ): Promise<string> {
    const changes = changedFiles.map(file => ({
      file,
      type: 'modified' as const,
      description: `Updated ${file}`,
      impact: [file]
    }))

    return await this.consistencyManager.createVersionSnapshot(description, changes)
  }

  /**
   * Get version history for a file
   */
  getFileVersionHistory(filePath: string) {
    return this.consistencyManager.getVersionHistory(filePath)
  }

  /**
   * Rollback a file to a previous version
   */
  async rollbackFile(filePath: string, version: string): Promise<boolean> {
    return await this.consistencyManager.rollbackToVersion(filePath, version)
  }

  // Helper methods for refinement

  private determineFileType(filePath: string): 'contract' | 'component' | 'api' | 'config' | 'type' {
    if (filePath.endsWith('.cdc')) return 'contract'
    if (filePath.includes('/api/') && filePath.endsWith('.ts')) return 'api'
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) return 'component'
    if (filePath.includes('types') || filePath.endsWith('.d.ts')) return 'type'
    return 'config'
  }

  private determineRelationship(
    componentPath: string,
    relatedPath: string,
    relatedContent: string
  ): 'imports' | 'exports' | 'calls' | 'extends' | 'implements' | 'none' {
    // Simple relationship detection based on file content
    const componentName = componentPath.split('/').pop()?.replace(/\.(tsx?|jsx?|cdc)$/, '') || ''
    
    if (relatedContent.includes(`from "${componentPath}"`) || 
        relatedContent.includes(`from './${componentName}'`) ||
        relatedContent.includes(`import ${componentName}`)) {
      return 'imports'
    }
    
    if (relatedContent.includes(`export`) && componentPath.includes(relatedPath)) {
      return 'exports'
    }
    
    if (relatedContent.includes(componentName)) {
      return 'calls'
    }
    
    return 'none'
  }

  /**
   * Cache generated components for future reuse
   */
  private cacheGeneratedComponents(
    result: FullStackGenerationResult,
    parsedRequirements: ParsedPromptResult,
    request: FullStackProjectRequest
  ): void {
    try {
      // Cache smart contracts
      result.smartContracts.forEach(contract => {
        const contractType = contract.filename.replace('.cdc', '')
        const features = this.extractContractFeatures(contract.code)
        const complexity = this.determineContractComplexity(contract.code)
        
        this.cache.cacheTemplate(
          contractType,
          features,
          complexity,
          contract.code,
          contract.dependencies
        )
      })

      // Cache React components
      result.frontendComponents.forEach(component => {
        const contractIntegrations = component.contractIntegrations.map(ci => ci.contractName)
        
        this.cache.cacheComponent(
          component.filename.replace('.tsx', '').replace('page', 'Page'),
          component.componentType,
          contractIntegrations,
          component.code,
          component.dependencies
        )
      })

      // Cache integration code
      if (result.integrationCode) {
        const contractNames = result.smartContracts.map(c => c.filename.replace('.cdc', ''))
        
        result.integrationCode.hooks.forEach(hook => {
          this.cache.cacheIntegration('hooks', contractNames, hook)
        })
        
        result.integrationCode.utilities.forEach(utility => {
          this.cache.cacheIntegration('utilities', contractNames, utility)
        })
        
        result.integrationCode.types.forEach(type => {
          this.cache.cacheIntegration('types', contractNames, type)
        })
      }

      // Cache project structure
      this.cache.cacheProjectStructure(
        request.projectName,
        {
          prompt: request.description,
          projectName: request.projectName,
          includeFrontend: true,
          includeAPI: true,
          uiFramework: 'next',
          stylingFramework: 'tailwind',
          deploymentTarget: 'vercel'
        },
        parsedRequirements,
        result.projectStructure
      )

    } catch (error) {
      console.warn('Failed to cache generated components:', error)
    }
  }

  /**
   * Extract features from contract code for caching
   */
  private extractContractFeatures(code: string): string[] {
    const features: string[] = []
    
    if (code.includes('NonFungibleToken')) features.push('nft')
    if (code.includes('FungibleToken')) features.push('fungible-token')
    if (code.includes('MetadataViews')) features.push('metadata')
    if (code.includes('Royalties')) features.push('royalties')
    if (code.includes('marketplace') || code.includes('sale')) features.push('marketplace')
    if (code.includes('voting') || code.includes('proposal')) features.push('dao')
    if (code.includes('staking') || code.includes('reward')) features.push('defi')
    
    return features
  }

  /**
   * Determine contract complexity for caching
   */
  private determineContractComplexity(code: string): 'simple' | 'intermediate' | 'advanced' {
    const lines = code.split('\n').length
    const functionCount = (code.match(/access\(all\)\s+fun\s+/g) || []).length
    const resourceCount = (code.match(/access\(all\)\s+resource\s+/g) || []).length
    
    if (lines > 500 || functionCount > 15 || resourceCount > 5) {
      return 'advanced'
    } else if (lines > 200 || functionCount > 8 || resourceCount > 2) {
      return 'intermediate'
    } else {
      return 'simple'
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Get analytics dashboard metrics
   */
  getAnalyticsDashboard() {
    return this.analytics.getDashboardMetrics()
  }

  /**
   * Generate analytics report
   */
  generateAnalyticsReport(timeRange?: { start: Date; end: Date }) {
    return this.analytics.generateReport(timeRange)
  }

  /**
   * Get current generation progress
   */
  getProgress(): GenerationProgress {
    return { ...this.currentProgress }
  }
}