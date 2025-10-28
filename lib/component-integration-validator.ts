import { GeneratedContract, GeneratedComponent, GeneratedAPIRoute, ContractIntegration } from './vibesdk'

/**
 * Integration validation result
 */
export interface IntegrationValidationResult {
  isValid: boolean
  errors: IntegrationError[]
  warnings: IntegrationWarning[]
  suggestions: IntegrationSuggestion[]
  score: number // 0-100
}

/**
 * Integration error types
 */
export interface IntegrationError {
  type: 'missing_dependency' | 'circular_dependency' | 'type_mismatch' | 'invalid_import' | 'contract_mismatch'
  component: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  fix?: string
}

/**
 * Integration warning types
 */
export interface IntegrationWarning {
  type: 'unused_import' | 'deprecated_pattern' | 'performance_concern' | 'accessibility_issue'
  component: string
  message: string
  suggestion?: string
}

/**
 * Integration suggestion types
 */
export interface IntegrationSuggestion {
  type: 'optimization' | 'best_practice' | 'security' | 'maintainability' | 'performance'
  component: string
  message: string
  implementation?: string
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysis {
  resolved: string[]
  missing: string[]
  circular: string[]
  unused: string[]
  conflicts: DependencyConflict[]
}

/**
 * Dependency conflict information
 */
export interface DependencyConflict {
  dependency: string
  conflictingVersions: string[]
  components: string[]
  resolution?: string
}

/**
 * Contract consistency check result
 */
export interface ContractConsistencyResult {
  consistent: boolean
  mismatches: ContractMismatch[]
  missingBindings: string[]
  extraBindings: string[]
}

/**
 * Contract mismatch information
 */
export interface ContractMismatch {
  contractName: string
  expectedFunction: string
  actualFunction?: string
  component: string
  issue: 'missing_function' | 'parameter_mismatch' | 'return_type_mismatch'
}

/**
 * Component integration validation system
 * Validates consistency between contracts, frontend components, and API routes
 */
export class ComponentIntegrationValidator {

  /**
   * Validate integration between all generated components
   */
  async validateIntegration(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Promise<IntegrationValidationResult> {
    const errors: IntegrationError[] = []
    const warnings: IntegrationWarning[] = []
    const suggestions: IntegrationSuggestion[] = []

    // Validate dependencies
    const dependencyAnalysis = await this.analyzeDependencies(contracts, components, apiRoutes)
    errors.push(...this.convertDependencyErrorsToIntegrationErrors(dependencyAnalysis))

    // Validate contract consistency
    const contractConsistency = await this.validateContractConsistency(contracts, components, apiRoutes)
    errors.push(...this.convertContractErrorsToIntegrationErrors(contractConsistency))

    // Validate import statements
    const importValidation = await this.validateImports(components, apiRoutes)
    errors.push(...importValidation.errors)
    warnings.push(...importValidation.warnings)

    // Validate type consistency
    const typeValidation = await this.validateTypeConsistency(contracts, components, apiRoutes)
    errors.push(...typeValidation.errors)
    warnings.push(...typeValidation.warnings)

    // Generate suggestions
    suggestions.push(...await this.generateOptimizationSuggestions(contracts, components, apiRoutes))

    // Calculate integration score
    const score = this.calculateIntegrationScore(errors, warnings, suggestions)

    return {
      isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      errors,
      warnings,
      suggestions,
      score
    }
  }

  /**
   * Analyze dependencies between components
   */
  private async analyzeDependencies(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Promise<DependencyAnalysis> {
    const allComponents = [
      ...contracts.map(c => ({ name: c.filename, type: 'contract', dependencies: c.dependencies })),
      ...components.map(c => ({ name: c.filename, type: 'component', dependencies: c.dependencies })),
      ...apiRoutes.map(a => ({ name: a.filename, type: 'api', dependencies: [] }))
    ]

    const resolved: string[] = []
    const missing: string[] = []
    const circular: string[] = []
    const unused: string[] = []
    const conflicts: DependencyConflict[] = []

    // Build dependency graph
    const dependencyGraph = new Map<string, string[]>()
    const availableComponents = new Set(allComponents.map(c => c.name))

    for (const component of allComponents) {
      dependencyGraph.set(component.name, component.dependencies)
      
      // Check for missing dependencies
      for (const dep of component.dependencies) {
        if (!availableComponents.has(dep) && !this.isExternalDependency(dep)) {
          missing.push(`${component.name} -> ${dep}`)
        } else {
          resolved.push(`${component.name} -> ${dep}`)
        }
      }
    }

    // Check for circular dependencies
    circular.push(...this.detectCircularDependencies(dependencyGraph))

    // Check for unused dependencies
    unused.push(...this.detectUnusedDependencies(allComponents))

    // Check for version conflicts
    conflicts.push(...this.detectDependencyConflicts(allComponents))

    return {
      resolved,
      missing,
      circular,
      unused,
      conflicts
    }
  }

  /**
   * Validate contract consistency across components
   */
  private async validateContractConsistency(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Promise<ContractConsistencyResult> {
    const mismatches: ContractMismatch[] = []
    const missingBindings: string[] = []
    const extraBindings: string[] = []

    // Extract contract functions from contract code
    const contractFunctions = this.extractContractFunctions(contracts)

    // Validate component integrations
    for (const component of components) {
      for (const integration of component.contractIntegrations) {
        const contractName = integration.contractName
        const expectedFunctions = contractFunctions.get(contractName) || []

        for (const functionName of integration.functions) {
          const contractFunction = expectedFunctions.find(f => f.name === functionName)
          
          if (!contractFunction) {
            mismatches.push({
              contractName,
              expectedFunction: functionName,
              component: component.filename,
              issue: 'missing_function'
            })
          }
        }
      }
    }

    // Validate API route integrations
    for (const apiRoute of apiRoutes) {
      for (const contractCall of apiRoute.contractCalls) {
        const contractName = contractCall.split('.')[0]
        const functionName = contractCall.split('.')[1]
        
        if (contractName && functionName) {
          const expectedFunctions = contractFunctions.get(contractName) || []
          const contractFunction = expectedFunctions.find(f => f.name === functionName)
          
          if (!contractFunction) {
            mismatches.push({
              contractName,
              expectedFunction: functionName,
              component: apiRoute.filename,
              issue: 'missing_function'
            })
          }
        }
      }
    }

    return {
      consistent: mismatches.length === 0,
      mismatches,
      missingBindings,
      extraBindings
    }
  }

  /**
   * Validate import statements in components
   */
  private async validateImports(
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Promise<{ errors: IntegrationError[], warnings: IntegrationWarning[] }> {
    const errors: IntegrationError[] = []
    const warnings: IntegrationWarning[] = []

    const allFiles = [...components, ...apiRoutes]

    for (const file of allFiles) {
      const imports = this.extractImports(file.code)
      
      for (const importStatement of imports) {
        // Check for invalid import paths
        if (importStatement.startsWith('@/') && !this.isValidInternalImport(importStatement)) {
          errors.push({
            type: 'invalid_import',
            component: file.filename,
            message: `Invalid import path: ${importStatement}`,
            severity: 'medium',
            fix: `Ensure the imported file exists at ${importStatement}`
          })
        }

        // Check for unused imports
        if (!this.isImportUsed(importStatement, file.code)) {
          warnings.push({
            type: 'unused_import',
            component: file.filename,
            message: `Unused import: ${importStatement}`,
            suggestion: `Remove unused import to reduce bundle size`
          })
        }
      }
    }

    return { errors, warnings }
  }

  /**
   * Validate type consistency between components
   */
  private async validateTypeConsistency(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Promise<{ errors: IntegrationError[], warnings: IntegrationWarning[] }> {
    const errors: IntegrationError[] = []
    const warnings: IntegrationWarning[] = []

    // Extract types from contracts
    const contractTypes = this.extractContractTypes(contracts)

    // Validate component types
    for (const component of components) {
      const componentTypes = this.extractComponentTypes(component.code)
      
      for (const integration of component.contractIntegrations) {
        const contractName = integration.contractName
        const expectedTypes = contractTypes.get(contractName) || []
        
        // Check if component uses correct types
        for (const type of componentTypes) {
          if (type.includes(contractName) && !expectedTypes.some(t => t.name === type)) {
            warnings.push({
              type: 'deprecated_pattern',
              component: component.filename,
              message: `Type ${type} may not match contract definition`,
              suggestion: `Verify type definition matches contract ${contractName}`
            })
          }
        }
      }
    }

    return { errors, warnings }
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizationSuggestions(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Promise<IntegrationSuggestion[]> {
    const suggestions: IntegrationSuggestion[] = []

    // Suggest code splitting for large components
    for (const component of components) {
      if (component.code.length > 5000) {
        suggestions.push({
          type: 'optimization',
          component: component.filename,
          message: 'Consider splitting this large component into smaller, more focused components',
          implementation: 'Extract reusable logic into custom hooks or separate components'
        })
      }
    }

    // Suggest caching for API routes
    for (const apiRoute of apiRoutes) {
      if (apiRoute.methods.includes('GET') && !apiRoute.code.includes('cache')) {
        suggestions.push({
          type: 'performance',
          component: apiRoute.filename,
          message: 'Consider adding caching to improve API performance',
          implementation: 'Add Next.js caching headers or implement Redis caching'
        })
      }
    }

    // Suggest error boundaries
    const hasErrorBoundary = components.some(c => c.code.includes('ErrorBoundary'))
    if (!hasErrorBoundary) {
      suggestions.push({
        type: 'best_practice',
        component: 'global',
        message: 'Consider adding error boundaries to handle component errors gracefully',
        implementation: 'Create an ErrorBoundary component and wrap your main components'
      })
    }

    return suggestions
  }

  /**
   * Calculate integration score based on errors, warnings, and suggestions
   */
  private calculateIntegrationScore(
    errors: IntegrationError[],
    warnings: IntegrationWarning[],
    suggestions: IntegrationSuggestion[]
  ): number {
    let score = 100

    // Deduct points for errors
    for (const error of errors) {
      switch (error.severity) {
        case 'critical':
          score -= 25
          break
        case 'high':
          score -= 15
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    }

    // Deduct points for warnings
    score -= warnings.length * 2

    // Bonus points for following suggestions
    score += Math.min(suggestions.length * 1, 10)

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Helper methods
   */

  private isExternalDependency(dep: string): boolean {
    return dep.startsWith('react') || 
           dep.startsWith('next') || 
           dep.startsWith('@') || 
           dep.startsWith('lucide-react') ||
           dep.startsWith('zod') ||
           dep.startsWith('@onflow')
  }

  private detectCircularDependencies(dependencyGraph: Map<string, string[]>): string[] {
    const circular: string[] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (node: string, path: string[] = []): boolean => {
      if (recursionStack.has(node)) {
        circular.push(`Circular dependency: ${[...path, node].join(' -> ')}`)
        return true
      }
      if (visited.has(node)) {
        return false
      }

      visited.add(node)
      recursionStack.add(node)

      const deps = dependencyGraph.get(node) || []
      for (const dep of deps) {
        if (hasCycle(dep, [...path, node])) {
          return true
        }
      }

      recursionStack.delete(node)
      return false
    }

    for (const node of Array.from(dependencyGraph.keys())) {
      if (!visited.has(node)) {
        hasCycle(node)
      }
    }

    return circular
  }

  private detectUnusedDependencies(components: Array<{ name: string, type: string, dependencies: string[] }>): string[] {
    // Simplified unused dependency detection
    return []
  }

  private detectDependencyConflicts(components: Array<{ name: string, type: string, dependencies: string[] }>): DependencyConflict[] {
    // Simplified conflict detection
    return []
  }

  private extractContractFunctions(contracts: GeneratedContract[]): Map<string, Array<{ name: string, parameters: string[], returnType: string }>> {
    const functions = new Map()
    
    for (const contract of contracts) {
      const contractName = contract.filename.replace('.cdc', '')
      const contractFunctions = []
      
      // Simple regex to extract function definitions
      const functionRegex = /access\([^)]+\)\s+fun\s+(\w+)\s*\([^)]*\)(?:\s*:\s*([^{]+))?/g
      let match
      
      while ((match = functionRegex.exec(contract.code)) !== null) {
        contractFunctions.push({
          name: match[1],
          parameters: [], // Simplified
          returnType: match[2] || 'Void'
        })
      }
      
      functions.set(contractName, contractFunctions)
    }
    
    return functions
  }

  private extractImports(code: string): string[] {
    const imports: string[] = []
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g
    let match
    
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1])
    }
    
    return imports
  }

  private isValidInternalImport(importPath: string): boolean {
    // Simplified validation - in real implementation, check if file exists
    return importPath.startsWith('@/components') || 
           importPath.startsWith('@/lib') || 
           importPath.startsWith('@/hooks')
  }

  private isImportUsed(importPath: string, code: string): boolean {
    // Simplified usage check
    const importName = importPath.split('/').pop()?.replace(/['"]/g, '')
    return importName ? code.includes(importName) : true
  }

  private extractContractTypes(contracts: GeneratedContract[]): Map<string, Array<{ name: string, definition: string }>> {
    const types = new Map()
    
    for (const contract of contracts) {
      const contractName = contract.filename.replace('.cdc', '')
      const contractTypes = []
      
      // Extract struct and resource definitions
      const typeRegex = /(struct|resource)\s+(\w+)/g
      let match
      
      while ((match = typeRegex.exec(contract.code)) !== null) {
        contractTypes.push({
          name: match[2],
          definition: match[1]
        })
      }
      
      types.set(contractName, contractTypes)
    }
    
    return types
  }

  private extractComponentTypes(code: string): string[] {
    const types: string[] = []
    const typeRegex = /interface\s+(\w+)|type\s+(\w+)/g
    let match
    
    while ((match = typeRegex.exec(code)) !== null) {
      types.push(match[1] || match[2])
    }
    
    return types
  }

  private convertDependencyErrorsToIntegrationErrors(analysis: DependencyAnalysis): IntegrationError[] {
    const errors: IntegrationError[] = []
    
    for (const missing of analysis.missing) {
      const [component, dependency] = missing.split(' -> ')
      errors.push({
        type: 'missing_dependency',
        component,
        message: `Missing dependency: ${dependency}`,
        severity: 'high',
        fix: `Install or create the missing dependency: ${dependency}`
      })
    }
    
    for (const circular of analysis.circular) {
      errors.push({
        type: 'circular_dependency',
        component: 'multiple',
        message: circular,
        severity: 'critical',
        fix: 'Refactor components to remove circular dependencies'
      })
    }
    
    return errors
  }

  private convertContractErrorsToIntegrationErrors(consistency: ContractConsistencyResult): IntegrationError[] {
    const errors: IntegrationError[] = []
    
    for (const mismatch of consistency.mismatches) {
      errors.push({
        type: 'contract_mismatch',
        component: mismatch.component,
        message: `Contract function mismatch: ${mismatch.contractName}.${mismatch.expectedFunction}`,
        severity: 'high',
        fix: `Ensure the contract ${mismatch.contractName} has the function ${mismatch.expectedFunction}`
      })
    }
    
    return errors
  }
}