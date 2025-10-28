/**
 * Helper methods for Full-Stack Validation System
 */

import { GeneratedContract, GeneratedComponent, GeneratedAPIRoute, FullStackGenerationResult } from '../vibesdk'
import { 
  ComponentValidationResult, 
  APIRouteValidationResult, 
  CompilationError, 
  TypeConsistencyCheck,
  ContractBindingConsistencyCheck,
  DataFlowConsistencyCheck,
  ImportConsistencyCheck,
  ProjectCompilationResult,
  CrossComponentConsistencyResult,
  FullStackValidationResult
} from './fullstack-validation-system'
import { ComprehensiveValidationResult } from './comprehensive-validation-system'
import { IntegrationValidationResult } from '../component-integration-validator'
import { QualityScore } from './types'

export class FullStackValidationHelpers {
  
  // Validation helper methods (simplified implementations)

  async checkComponentSyntax(code: string): Promise<boolean> {
    // Check for basic React component structure
    return code.includes('export') && (code.includes('function') || code.includes('const'))
  }

  async checkComponentTypeScript(code: string): Promise<boolean> {
    // Check for TypeScript patterns
    return !code.includes('any') || code.includes('// @ts-ignore')
  }

  async checkReactPatterns(code: string): Promise<boolean> {
    // Check for React best practices
    return code.includes('useState') || code.includes('useEffect') || !code.includes('class')
  }

  async checkAccessibilityCompliance(code: string): Promise<boolean> {
    // Check for accessibility attributes
    return code.includes('aria-') || code.includes('alt=') || !code.includes('<img')
  }

  async checkPerformanceOptimization(code: string): Promise<boolean> {
    // Check for performance patterns
    return code.includes('useMemo') || code.includes('useCallback') || code.length < 1000
  }

  async checkContractIntegration(component: GeneratedComponent): Promise<boolean> {
    // Check if contract integrations are valid
    return component.contractIntegrations.every(integration => 
      integration.contractName && integration.functions.length > 0
    )
  }

  async checkAPIRouteSyntax(code: string): Promise<boolean> {
    // Check for Next.js API route structure
    return code.includes('export') && (code.includes('GET') || code.includes('POST'))
  }

  async checkAPIRouteTypeScript(code: string): Promise<boolean> {
    // Check for TypeScript in API routes
    return code.includes('NextRequest') || code.includes('NextResponse')
  }

  async checkNextJSPatterns(code: string): Promise<boolean> {
    // Check for Next.js best practices
    return code.includes('NextResponse') && code.includes('try')
  }

  async checkSecurityCompliance(code: string): Promise<boolean> {
    // Check for security patterns
    return !code.includes('eval(') && !code.includes('innerHTML')
  }

  async checkErrorHandling(code: string): Promise<boolean> {
    // Check for error handling
    return code.includes('try') && code.includes('catch')
  }

  async checkAPIRouteContractIntegration(apiRoute: GeneratedAPIRoute): Promise<boolean> {
    // Check if API route contract calls are valid
    return apiRoute.contractCalls.length === 0 || apiRoute.contractCalls.every(call => call.includes('.'))
  }

  // Scoring methods

  calculateComponentScore(
    syntaxValid: boolean,
    typeScriptValid: boolean,
    reactPatternValid: boolean,
    accessibilityCompliant: boolean,
    performanceOptimized: boolean,
    contractIntegrationValid: boolean
  ): number {
    let score = 0
    if (syntaxValid) score += 25
    if (typeScriptValid) score += 20
    if (reactPatternValid) score += 20
    if (accessibilityCompliant) score += 15
    if (performanceOptimized) score += 10
    if (contractIntegrationValid) score += 10
    return score
  }

  calculateAPIRouteScore(
    syntaxValid: boolean,
    typeScriptValid: boolean,
    nextJSPatternValid: boolean,
    securityCompliant: boolean,
    errorHandlingComplete: boolean,
    contractIntegrationValid: boolean
  ): number {
    let score = 0
    if (syntaxValid) score += 25
    if (typeScriptValid) score += 20
    if (nextJSPatternValid) score += 15
    if (securityCompliant) score += 20
    if (errorHandlingComplete) score += 10
    if (contractIntegrationValid) score += 10
    return score
  }

  calculateConsistencyScore(
    typeConsistency: TypeConsistencyCheck,
    contractBindingConsistency: ContractBindingConsistencyCheck,
    dataFlowConsistency: DataFlowConsistencyCheck,
    importConsistency: ImportConsistencyCheck
  ): number {
    let score = 0
    if (typeConsistency.consistent) score += 25
    if (contractBindingConsistency.consistent) score += 30
    if (dataFlowConsistency.consistent) score += 25
    if (importConsistency.consistent) score += 20
    return score
  }

  calculateCompilationScore(
    typeScriptErrors: CompilationError[],
    nextJSBuildErrors: CompilationError[],
    cadenceCompilationErrors: CompilationError[],
    dependencyIssues: any[]
  ): number {
    let score = 100
    score -= typeScriptErrors.filter(e => e.severity === 'error').length * 15
    score -= typeScriptErrors.filter(e => e.severity === 'warning').length * 5
    score -= nextJSBuildErrors.filter(e => e.severity === 'error').length * 20
    score -= cadenceCompilationErrors.filter(e => e.severity === 'error').length * 20
    score -= dependencyIssues.length * 10
    return Math.max(0, score)
  }

  calculateOverallValidation(
    contractValidation: Map<string, ComprehensiveValidationResult>,
    componentValidation: Map<string, ComponentValidationResult>,
    apiRouteValidation: Map<string, APIRouteValidationResult>,
    integrationValidation: IntegrationValidationResult,
    crossComponentConsistency: CrossComponentConsistencyResult,
    projectCompilationCheck: ProjectCompilationResult
  ): { isValid: boolean, overallScore: number, qualityScore: QualityScore } {
    // Calculate individual scores
    const contractScores = Array.from(contractValidation.values()).map(v => v.overallScore)
    const componentScores = Array.from(componentValidation.values()).map(v => v.score)
    const apiRouteScores = Array.from(apiRouteValidation.values()).map(v => v.score)

    const avgContractScore = contractScores.length > 0 ? contractScores.reduce((a, b) => a + b, 0) / contractScores.length : 100
    const avgComponentScore = componentScores.length > 0 ? componentScores.reduce((a, b) => a + b, 0) / componentScores.length : 100
    const avgAPIRouteScore = apiRouteScores.length > 0 ? apiRouteScores.reduce((a, b) => a + b, 0) / apiRouteScores.length : 100

    // Weight the scores
    const overallScore = Math.round(
      avgContractScore * 0.3 +
      avgComponentScore * 0.25 +
      avgAPIRouteScore * 0.2 +
      integrationValidation.score * 0.15 +
      crossComponentConsistency.score * 0.1
    )

    // Determine validity
    const contractsValid = Array.from(contractValidation.values()).every(v => v.isValid)
    const componentsValid = Array.from(componentValidation.values()).every(v => v.isValid)
    const apiRoutesValid = Array.from(apiRouteValidation.values()).every(v => v.isValid)

    const isValid = contractsValid && 
                   componentsValid && 
                   apiRoutesValid && 
                   integrationValidation.isValid && 
                   crossComponentConsistency.consistent &&
                   projectCompilationCheck.compilable

    // Calculate quality score
    const qualityScore: QualityScore = {
      overall: overallScore,
      syntax: Math.round((avgContractScore + avgComponentScore + avgAPIRouteScore) / 3),
      logic: integrationValidation.score,
      completeness: crossComponentConsistency.score,
      bestPractices: Math.round((avgComponentScore + avgAPIRouteScore) / 2),
      productionReadiness: projectCompilationCheck.score
    }

    return { isValid, overallScore, qualityScore }
  }

  generateFullStackRecommendations(
    contractValidation: Map<string, ComprehensiveValidationResult>,
    componentValidation: Map<string, ComponentValidationResult>,
    apiRouteValidation: Map<string, APIRouteValidationResult>,
    integrationValidation: IntegrationValidationResult,
    crossComponentConsistency: CrossComponentConsistencyResult,
    projectCompilationCheck: ProjectCompilationResult
  ): string[] {
    const recommendations: string[] = []

    // Contract recommendations
    for (const [filename, validation] of contractValidation) {
      if (!validation.isValid) {
        recommendations.push(`Fix critical issues in contract ${filename}`)
      }
      recommendations.push(...validation.recommendations.map(r => `Contract ${filename}: ${r}`))
    }

    // Component recommendations
    for (const [filename, validation] of componentValidation) {
      if (!validation.isValid) {
        recommendations.push(`Fix critical issues in component ${filename}`)
      }
      if (!validation.accessibilityCompliant) {
        recommendations.push(`Improve accessibility in component ${filename}`)
      }
      if (!validation.performanceOptimized) {
        recommendations.push(`Optimize performance in component ${filename}`)
      }
    }

    // API route recommendations
    for (const [filename, validation] of apiRouteValidation) {
      if (!validation.isValid) {
        recommendations.push(`Fix critical issues in API route ${filename}`)
      }
      if (!validation.securityCompliant) {
        recommendations.push(`Improve security in API route ${filename}`)
      }
      if (!validation.errorHandlingComplete) {
        recommendations.push(`Add comprehensive error handling to API route ${filename}`)
      }
    }

    // Integration recommendations
    recommendations.push(...integrationValidation.suggestions.map(s => s.message))

    // Consistency recommendations
    if (!crossComponentConsistency.consistent) {
      recommendations.push('Fix cross-component consistency issues')
    }

    // Compilation recommendations
    if (!projectCompilationCheck.compilable) {
      recommendations.push('Fix compilation errors before deployment')
    }

    return recommendations
  }

  // Helper methods for type and function extraction

  extractTypesFromContracts(contracts: GeneratedContract[]): Map<string, string> {
    const types = new Map<string, string>()
    
    for (const contract of contracts) {
      // Extract struct and resource definitions
      const typeRegex = /(struct|resource)\s+(\w+)/g
      let match
      
      while ((match = typeRegex.exec(contract.code)) !== null) {
        types.set(match[2], match[1])
      }
    }
    
    return types
  }

  extractTypesFromComponents(components: GeneratedComponent[]): Map<string, string> {
    const types = new Map<string, string>()
    
    for (const component of components) {
      // Extract TypeScript interface and type definitions
      const typeRegex = /(interface|type)\s+(\w+)/g
      let match
      
      while ((match = typeRegex.exec(component.code)) !== null) {
        types.set(match[2], match[1])
      }
    }
    
    return types
  }

  extractTypesFromAPIRoutes(apiRoutes: GeneratedAPIRoute[]): Map<string, string> {
    const types = new Map<string, string>()
    
    for (const apiRoute of apiRoutes) {
      // Extract TypeScript interface and type definitions
      const typeRegex = /(interface|type)\s+(\w+)/g
      let match
      
      while ((match = typeRegex.exec(apiRoute.code)) !== null) {
        types.set(match[2], match[1])
      }
    }
    
    return types
  }

  extractContractFunctions(contracts: GeneratedContract[]): Map<string, Array<{ name: string, parameters: string[], returnType: string }>> {
    const functions = new Map()
    
    for (const contract of contracts) {
      const contractName = contract.filename.replace('.cdc', '')
      const contractFunctions = []
      
      // Extract function definitions
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

  extractImports(code: string): string[] {
    const imports: string[] = []
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g
    let match
    
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1])
    }
    
    return imports
  }

  isValidInternalImport(importPath: string): boolean {
    // Simplified validation - in real implementation, check if file exists
    return importPath.startsWith('@/components') || 
           importPath.startsWith('@/lib') || 
           importPath.startsWith('@/hooks') ||
           importPath.startsWith('@/app')
  }

  isImportUsed(importPath: string, code: string): boolean {
    // Simplified usage check
    const importName = importPath.split('/').pop()?.replace(/['"]/g, '')
    return importName ? code.includes(importName) : true
  }

  extractProjectDependencies(project: FullStackGenerationResult): string[] {
    const dependencies = new Set<string>()
    
    // Extract from configurations
    for (const config of project.configurations) {
      if (config.filename === 'package.json') {
        try {
          const packageJson = JSON.parse(config.content)
          if (packageJson.dependencies) {
            Object.keys(packageJson.dependencies).forEach(dep => dependencies.add(dep))
          }
          if (packageJson.devDependencies) {
            Object.keys(packageJson.devDependencies).forEach(dep => dependencies.add(dep))
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }
    
    return Array.from(dependencies)
  }

  countTotalIssues(result: FullStackValidationResult): number {
    let count = 0
    
    // Count contract issues
    for (const validation of result.contractValidation.values()) {
      count += validation.errorDetection.totalErrors + validation.undefinedValueScan.totalIssues
    }
    
    // Count component issues
    for (const validation of result.componentValidation.values()) {
      count += validation.issues.length
    }
    
    // Count API route issues
    for (const validation of result.apiRouteValidation.values()) {
      count += validation.issues.length
    }
    
    // Count integration issues
    count += result.integrationValidation.errors.length + result.integrationValidation.warnings.length
    
    // Count consistency issues
    count += result.crossComponentConsistency.issues.length
    
    return count
  }
}

// Export singleton instance
export const fullStackValidationHelpers = new FullStackValidationHelpers()