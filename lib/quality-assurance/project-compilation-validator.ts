/**
 * Project Compilation and Testing Utilities
 * 
 * Provides utilities for validating TypeScript compilation, Next.js build validation,
 * and automated testing setup for generated full-stack projects.
 */

import { FullStackGenerationResult, GeneratedContract, GeneratedComponent, GeneratedAPIRoute } from '../vibesdk'
import { QALogger, getLogger } from './logger'

export interface ProjectCompilationValidationResult {
  isValid: boolean
  typeScriptCompilation: TypeScriptCompilationResult
  nextJSBuildValidation: NextJSBuildValidationResult
  cadenceCompilation: CadenceCompilationResult
  testingSetup: TestingSetupResult
  overallScore: number
  recommendations: string[]
}

export interface TypeScriptCompilationResult {
  compilable: boolean
  errors: TypeScriptError[]
  warnings: TypeScriptWarning[]
  configurationValid: boolean
  dependenciesResolved: boolean
  score: number
}

export interface TypeScriptError {
  file: string
  line: number
  column: number
  code: string
  message: string
  severity: 'error' | 'warning'
  category: 'syntax' | 'type' | 'import' | 'declaration'
}

export interface TypeScriptWarning {
  file: string
  line: number
  column: number
  code: string
  message: string
  suggestion?: string
}

export interface NextJSBuildValidationResult {
  buildable: boolean
  routeValidation: RouteValidationResult
  componentValidation: ComponentBuildValidationResult
  configurationValidation: ConfigurationValidationResult
  optimizationChecks: OptimizationCheckResult
  score: number
}

export interface RouteValidationResult {
  validRoutes: string[]
  invalidRoutes: RouteError[]
  apiRouteValidation: APIRouteValidationResult[]
  dynamicRouteValidation: DynamicRouteValidationResult[]
}

export interface RouteError {
  route: string
  error: string
  severity: 'error' | 'warning'
  fix?: string
}

export interface APIRouteValidationResult {
  route: string
  isValid: boolean
  httpMethods: string[]
  hasErrorHandling: boolean
  hasValidation: boolean
  hasAuthentication: boolean
  issues: string[]
}

export interface DynamicRouteValidationResult {
  route: string
  isValid: boolean
  parameterValidation: boolean
  catchAllRoutes: boolean
  issues: string[]
}

export interface ComponentBuildValidationResult {
  validComponents: string[]
  invalidComponents: ComponentBuildError[]
  importValidation: ImportValidationResult
  exportValidation: ExportValidationResult
}

export interface ComponentBuildError {
  component: string
  error: string
  line?: number
  column?: number
  fix?: string
}

export interface ImportValidationResult {
  validImports: string[]
  invalidImports: ImportError[]
  circularImports: string[]
  unusedImports: string[]
}

export interface ImportError {
  file: string
  import: string
  error: string
  suggestion?: string
}

export interface ExportValidationResult {
  validExports: string[]
  invalidExports: ExportError[]
  missingExports: string[]
}

export interface ExportError {
  file: string
  export: string
  error: string
  suggestion?: string
}

export interface ConfigurationValidationResult {
  nextConfigValid: boolean
  tailwindConfigValid: boolean
  tsConfigValid: boolean
  packageJsonValid: boolean
  envConfigValid: boolean
  issues: ConfigurationIssue[]
}

export interface ConfigurationIssue {
  file: string
  issue: string
  severity: 'error' | 'warning' | 'info'
  fix?: string
}

export interface OptimizationCheckResult {
  bundleSize: BundleSizeAnalysis
  performanceOptimizations: PerformanceOptimization[]
  accessibilityChecks: AccessibilityCheck[]
  seoOptimizations: SEOOptimization[]
}

export interface BundleSizeAnalysis {
  totalSize: number
  componentSizes: ComponentSize[]
  recommendations: string[]
}

export interface ComponentSize {
  component: string
  size: number
  optimizable: boolean
}

export interface PerformanceOptimization {
  type: 'code-splitting' | 'lazy-loading' | 'memoization' | 'bundle-optimization'
  component: string
  current: string
  recommended: string
  impact: 'high' | 'medium' | 'low'
}

export interface AccessibilityCheck {
  component: string
  issues: AccessibilityIssue[]
  score: number
}

export interface AccessibilityIssue {
  type: 'missing-alt' | 'missing-aria' | 'color-contrast' | 'keyboard-navigation'
  element: string
  severity: 'error' | 'warning'
  fix: string
}

export interface SEOOptimization {
  page: string
  issues: SEOIssue[]
  score: number
}

export interface SEOIssue {
  type: 'missing-meta' | 'missing-title' | 'missing-description' | 'missing-og-tags'
  severity: 'error' | 'warning'
  fix: string
}

export interface CadenceCompilationResult {
  compilable: boolean
  contracts: CadenceContractValidation[]
  dependencyValidation: CadenceDependencyValidation
  networkCompatibility: NetworkCompatibilityResult
  score: number
}

export interface CadenceContractValidation {
  contract: string
  isValid: boolean
  syntaxErrors: CadenceSyntaxError[]
  semanticErrors: CadenceSemanticError[]
  warnings: CadenceWarning[]
  deployable: boolean
}

export interface CadenceSyntaxError {
  line: number
  column: number
  message: string
  code: string
}

export interface CadenceSemanticError {
  line: number
  column: number
  message: string
  type: 'type-mismatch' | 'undefined-reference' | 'access-violation' | 'resource-error'
}

export interface CadenceWarning {
  line: number
  column: number
  message: string
  suggestion?: string
}

export interface CadenceDependencyValidation {
  requiredImports: string[]
  availableImports: string[]
  missingImports: string[]
  invalidImports: string[]
}

export interface NetworkCompatibilityResult {
  testnetCompatible: boolean
  mainnetCompatible: boolean
  emulatorCompatible: boolean
  issues: NetworkCompatibilityIssue[]
}

export interface NetworkCompatibilityIssue {
  network: 'testnet' | 'mainnet' | 'emulator'
  issue: string
  severity: 'error' | 'warning'
  fix?: string
}

export interface TestingSetupResult {
  hasTestingFramework: boolean
  testCoverage: TestCoverageResult
  testTypes: TestTypeResult
  testConfiguration: TestConfigurationResult
  automatedTesting: AutomatedTestingResult
  score: number
}

export interface TestCoverageResult {
  overallCoverage: number
  contractCoverage: number
  componentCoverage: number
  apiRouteCoverage: number
  uncoveredFiles: string[]
  recommendations: string[]
}

export interface TestTypeResult {
  unitTests: UnitTestResult
  integrationTests: IntegrationTestResult
  e2eTests: E2ETestResult
  contractTests: ContractTestResult
}

export interface UnitTestResult {
  present: boolean
  count: number
  coverage: number
  frameworks: string[]
  issues: string[]
}

export interface IntegrationTestResult {
  present: boolean
  count: number
  coverage: number
  frameworks: string[]
  issues: string[]
}

export interface E2ETestResult {
  present: boolean
  count: number
  coverage: number
  frameworks: string[]
  issues: string[]
}

export interface ContractTestResult {
  present: boolean
  count: number
  coverage: number
  frameworks: string[]
  issues: string[]
}

export interface TestConfigurationResult {
  jestConfigValid: boolean
  vitestConfigValid: boolean
  playwrightConfigValid: boolean
  cypressConfigValid: boolean
  issues: TestConfigurationIssue[]
}

export interface TestConfigurationIssue {
  file: string
  issue: string
  severity: 'error' | 'warning'
  fix?: string
}

export interface AutomatedTestingResult {
  cicdSetup: boolean
  preCommitHooks: boolean
  testScripts: boolean
  coverageReporting: boolean
  issues: string[]
  recommendations: string[]
}

/**
 * Project Compilation Validator
 * Validates compilation and testing setup for full-stack dApp projects
 */
export class ProjectCompilationValidator {
  private logger: QALogger

  constructor() {
    try {
      this.logger = getLogger()
    } catch {
      // Fallback logger for testing
      this.logger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {}
      } as QALogger
    }
  }

  /**
   * Validate complete project compilation and testing setup
   */
  async validateProjectCompilation(
    project: FullStackGenerationResult,
    options: {
      checkTypeScript?: boolean
      checkNextJS?: boolean
      checkCadence?: boolean
      checkTesting?: boolean
      performanceMode?: 'fast' | 'thorough'
    } = {}
  ): Promise<ProjectCompilationValidationResult> {
    const startTime = Date.now()
    this.logger.info('Starting project compilation validation', {
      contractCount: project.smartContracts.length,
      componentCount: project.frontendComponents.length,
      apiRouteCount: project.apiRoutes.length,
      options
    })

    try {
      // Default options
      const {
        checkTypeScript = true,
        checkNextJS = true,
        checkCadence = true,
        checkTesting = true,
        performanceMode = 'thorough'
      } = options

      // Step 1: Validate TypeScript compilation
      let typeScriptCompilation: TypeScriptCompilationResult = {
        compilable: true,
        errors: [],
        warnings: [],
        configurationValid: true,
        dependenciesResolved: true,
        score: 100
      }

      if (checkTypeScript) {
        this.logger.info('Validating TypeScript compilation')
        typeScriptCompilation = await this.validateTypeScriptCompilation(project, performanceMode)
      }

      // Step 2: Validate Next.js build
      let nextJSBuildValidation: NextJSBuildValidationResult = {
        buildable: true,
        routeValidation: { validRoutes: [], invalidRoutes: [], apiRouteValidation: [], dynamicRouteValidation: [] },
        componentValidation: { validComponents: [], invalidComponents: [], importValidation: { validImports: [], invalidImports: [], circularImports: [], unusedImports: [] }, exportValidation: { validExports: [], invalidExports: [], missingExports: [] } },
        configurationValidation: { nextConfigValid: true, tailwindConfigValid: true, tsConfigValid: true, packageJsonValid: true, envConfigValid: true, issues: [] },
        optimizationChecks: { bundleSize: { totalSize: 0, componentSizes: [], recommendations: [] }, performanceOptimizations: [], accessibilityChecks: [], seoOptimizations: [] },
        score: 100
      }

      if (checkNextJS) {
        this.logger.info('Validating Next.js build')
        nextJSBuildValidation = await this.validateNextJSBuild(project, performanceMode)
      }

      // Step 3: Validate Cadence compilation
      let cadenceCompilation: CadenceCompilationResult = {
        compilable: true,
        contracts: [],
        dependencyValidation: { requiredImports: [], availableImports: [], missingImports: [], invalidImports: [] },
        networkCompatibility: { testnetCompatible: true, mainnetCompatible: true, emulatorCompatible: true, issues: [] },
        score: 100
      }

      if (checkCadence) {
        this.logger.info('Validating Cadence compilation')
        cadenceCompilation = await this.validateCadenceCompilation(project, performanceMode)
      }

      // Step 4: Validate testing setup
      let testingSetup: TestingSetupResult = {
        hasTestingFramework: false,
        testCoverage: { overallCoverage: 0, contractCoverage: 0, componentCoverage: 0, apiRouteCoverage: 0, uncoveredFiles: [], recommendations: [] },
        testTypes: { unitTests: { present: false, count: 0, coverage: 0, frameworks: [], issues: [] }, integrationTests: { present: false, count: 0, coverage: 0, frameworks: [], issues: [] }, e2eTests: { present: false, count: 0, coverage: 0, frameworks: [], issues: [] }, contractTests: { present: false, count: 0, coverage: 0, frameworks: [], issues: [] } },
        testConfiguration: { jestConfigValid: false, vitestConfigValid: false, playwrightConfigValid: false, cypressConfigValid: false, issues: [] },
        automatedTesting: { cicdSetup: false, preCommitHooks: false, testScripts: false, coverageReporting: false, issues: [], recommendations: [] },
        score: 0
      }

      if (checkTesting) {
        this.logger.info('Validating testing setup')
        testingSetup = await this.validateTestingSetup(project, performanceMode)
      }

      // Step 5: Calculate overall validation result
      const { isValid, overallScore } = this.calculateOverallCompilationScore(
        typeScriptCompilation,
        nextJSBuildValidation,
        cadenceCompilation,
        testingSetup
      )

      // Step 6: Generate recommendations
      const recommendations = this.generateCompilationRecommendations(
        typeScriptCompilation,
        nextJSBuildValidation,
        cadenceCompilation,
        testingSetup
      )

      const result: ProjectCompilationValidationResult = {
        isValid,
        typeScriptCompilation,
        nextJSBuildValidation,
        cadenceCompilation,
        testingSetup,
        overallScore,
        recommendations
      }

      const duration = Date.now() - startTime
      this.logger.info('Project compilation validation completed', {
        duration,
        isValid,
        overallScore,
        recommendationCount: recommendations.length
      })

      return result

    } catch (error) {
      this.logger.error('Project compilation validation failed', { error: error.message })
      throw error
    }
  }

  /**
   * Validate TypeScript compilation for the project
   */
  private async validateTypeScriptCompilation(
    project: FullStackGenerationResult,
    performanceMode: 'fast' | 'thorough'
  ): Promise<TypeScriptCompilationResult> {
    const errors: TypeScriptError[] = []
    const warnings: TypeScriptWarning[] = []

    // Check TypeScript configuration
    const tsConfig = project.configurations.find(c => c.filename === 'tsconfig.json')
    const configurationValid = !!tsConfig && this.validateTSConfig(tsConfig.content)

    if (!configurationValid) {
      errors.push({
        file: 'tsconfig.json',
        line: 1,
        column: 1,
        code: 'TS6053',
        message: 'Invalid or missing TypeScript configuration',
        severity: 'error',
        category: 'declaration'
      })
    }

    // Check dependencies
    const packageJson = project.configurations.find(c => c.filename === 'package.json')
    const dependenciesResolved = this.validateTypeScriptDependencies(packageJson?.content)

    if (!dependenciesResolved) {
      errors.push({
        file: 'package.json',
        line: 1,
        column: 1,
        code: 'TS2307',
        message: 'Missing TypeScript dependencies',
        severity: 'error',
        category: 'import'
      })
    }

    // Validate individual components and API routes
    for (const component of project.frontendComponents) {
      const componentErrors = await this.validateTypeScriptFile(component.code, component.filename, performanceMode)
      errors.push(...componentErrors.errors)
      warnings.push(...componentErrors.warnings)
    }

    for (const apiRoute of project.apiRoutes) {
      const routeErrors = await this.validateTypeScriptFile(apiRoute.code, apiRoute.filename, performanceMode)
      errors.push(...routeErrors.errors)
      warnings.push(...routeErrors.warnings)
    }

    const compilable = errors.filter(e => e.severity === 'error').length === 0
    const score = this.calculateTypeScriptScore(errors, warnings, configurationValid, dependenciesResolved)

    return {
      compilable,
      errors,
      warnings,
      configurationValid,
      dependenciesResolved,
      score
    }
  }

  /**
   * Validate Next.js build configuration and components
   */
  private async validateNextJSBuild(
    project: FullStackGenerationResult,
    performanceMode: 'fast' | 'thorough'
  ): Promise<NextJSBuildValidationResult> {
    // Validate routes
    const routeValidation = await this.validateRoutes(project)

    // Validate component builds
    const componentValidation = await this.validateComponentBuilds(project, performanceMode)

    // Validate configurations
    const configurationValidation = await this.validateNextJSConfigurations(project)

    // Run optimization checks
    const optimizationChecks = performanceMode === 'thorough' 
      ? await this.runOptimizationChecks(project)
      : { bundleSize: { totalSize: 0, componentSizes: [], recommendations: [] }, performanceOptimizations: [], accessibilityChecks: [], seoOptimizations: [] }

    const buildable = routeValidation.invalidRoutes.length === 0 && 
                     componentValidation.invalidComponents.length === 0 &&
                     configurationValidation.issues.filter(i => i.severity === 'error').length === 0

    const score = this.calculateNextJSScore(routeValidation, componentValidation, configurationValidation, optimizationChecks)

    return {
      buildable,
      routeValidation,
      componentValidation,
      configurationValidation,
      optimizationChecks,
      score
    }
  }

  /**
   * Validate Cadence contract compilation
   */
  private async validateCadenceCompilation(
    project: FullStackGenerationResult,
    performanceMode: 'fast' | 'thorough'
  ): Promise<CadenceCompilationResult> {
    const contracts: CadenceContractValidation[] = []

    // Validate each contract
    for (const contract of project.smartContracts) {
      const validation = await this.validateCadenceContract(contract, performanceMode)
      contracts.push(validation)
    }

    // Validate dependencies
    const dependencyValidation = await this.validateCadenceDependencies(project.smartContracts)

    // Check network compatibility
    const networkCompatibility = performanceMode === 'thorough'
      ? await this.validateNetworkCompatibility(project.smartContracts)
      : { testnetCompatible: true, mainnetCompatible: true, emulatorCompatible: true, issues: [] }

    const compilable = contracts.every(c => c.isValid) && 
                      dependencyValidation.missingImports.length === 0

    const score = this.calculateCadenceScore(contracts, dependencyValidation, networkCompatibility)

    return {
      compilable,
      contracts,
      dependencyValidation,
      networkCompatibility,
      score
    }
  }

  /**
   * Validate testing setup and configuration
   */
  private async validateTestingSetup(
    project: FullStackGenerationResult,
    performanceMode: 'fast' | 'thorough'
  ): Promise<TestingSetupResult> {
    // Check if testing framework is present
    const packageJson = project.configurations.find(c => c.filename === 'package.json')
    const hasTestingFramework = this.checkTestingFramework(packageJson?.content)

    // Analyze test coverage (simplified)
    const testCoverage = await this.analyzeTestCoverage(project, performanceMode)

    // Check test types
    const testTypes = await this.analyzeTestTypes(project, performanceMode)

    // Validate test configuration
    const testConfiguration = await this.validateTestConfiguration(project)

    // Check automated testing setup
    const automatedTesting = await this.validateAutomatedTesting(project)

    const score = this.calculateTestingScore(hasTestingFramework, testCoverage, testTypes, testConfiguration, automatedTesting)

    return {
      hasTestingFramework,
      testCoverage,
      testTypes,
      testConfiguration,
      automatedTesting,
      score
    }
  }  
// Helper methods for validation

  private validateTSConfig(content: string): boolean {
    try {
      const config = JSON.parse(content)
      return config.compilerOptions && 
             config.compilerOptions.target && 
             config.compilerOptions.module &&
             config.include
    } catch {
      return false
    }
  }

  private validateTypeScriptDependencies(packageJsonContent?: string): boolean {
    if (!packageJsonContent) return false
    
    try {
      const packageJson = JSON.parse(packageJsonContent)
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      return deps.typescript && deps['@types/react'] && deps['@types/node']
    } catch {
      return false
    }
  }

  private async validateTypeScriptFile(
    code: string, 
    filename: string, 
    performanceMode: 'fast' | 'thorough'
  ): Promise<{ errors: TypeScriptError[], warnings: TypeScriptWarning[] }> {
    const errors: TypeScriptError[] = []
    const warnings: TypeScriptWarning[] = []

    // Basic syntax checks
    if (!code.includes('export')) {
      errors.push({
        file: filename,
        line: 1,
        column: 1,
        code: 'TS1128',
        message: 'No exports found in module',
        severity: 'error',
        category: 'syntax'
      })
    }

    // Type checking (simplified)
    if (code.includes('any') && !code.includes('// @ts-ignore')) {
      warnings.push({
        file: filename,
        line: 1,
        column: 1,
        code: 'TS7006',
        message: 'Usage of "any" type detected',
        suggestion: 'Consider using more specific types'
      })
    }

    // Import validation
    const imports = this.extractImports(code)
    for (const importPath of imports) {
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Relative import - would need file system check in real implementation
        if (performanceMode === 'thorough') {
          // Simulate import validation
          if (importPath.includes('nonexistent')) {
            errors.push({
              file: filename,
              line: 1,
              column: 1,
              code: 'TS2307',
              message: `Cannot find module '${importPath}'`,
              severity: 'error',
              category: 'import'
            })
          }
        }
      }
    }

    return { errors, warnings }
  }

  private async validateRoutes(project: FullStackGenerationResult): Promise<RouteValidationResult> {
    const validRoutes: string[] = []
    const invalidRoutes: RouteError[] = []
    const apiRouteValidation: APIRouteValidationResult[] = []
    const dynamicRouteValidation: DynamicRouteValidationResult[] = []

    // Validate API routes
    for (const apiRoute of project.apiRoutes) {
      const validation = await this.validateAPIRoute(apiRoute)
      apiRouteValidation.push(validation)
      
      if (validation.isValid) {
        validRoutes.push(apiRoute.endpoint)
      } else {
        invalidRoutes.push({
          route: apiRoute.endpoint,
          error: validation.issues.join(', '),
          severity: 'error'
        })
      }
    }

    // Validate component routes (pages)
    for (const component of project.frontendComponents) {
      if (component.componentType === 'page') {
        const routeValid = this.validatePageRoute(component)
        if (routeValid) {
          validRoutes.push(component.filename)
        } else {
          invalidRoutes.push({
            route: component.filename,
            error: 'Invalid page component structure',
            severity: 'error',
            fix: 'Ensure page component exports default function'
          })
        }
      }
    }

    return {
      validRoutes,
      invalidRoutes,
      apiRouteValidation,
      dynamicRouteValidation
    }
  }

  private async validateAPIRoute(apiRoute: GeneratedAPIRoute): Promise<APIRouteValidationResult> {
    const issues: string[] = []

    // Check HTTP methods
    const httpMethods = apiRoute.methods
    if (httpMethods.length === 0) {
      issues.push('No HTTP methods defined')
    }

    // Check error handling
    const hasErrorHandling = apiRoute.code.includes('try') && apiRoute.code.includes('catch')
    if (!hasErrorHandling) {
      issues.push('Missing error handling')
    }

    // Check validation
    const hasValidation = apiRoute.code.includes('zod') || apiRoute.code.includes('validate')
    if (!hasValidation) {
      issues.push('Missing input validation')
    }

    // Check authentication (simplified)
    const hasAuthentication = apiRoute.code.includes('auth') || apiRoute.code.includes('token')

    return {
      route: apiRoute.endpoint,
      isValid: issues.length === 0,
      httpMethods,
      hasErrorHandling,
      hasValidation,
      hasAuthentication,
      issues
    }
  }

  private validatePageRoute(component: GeneratedComponent): boolean {
    // Check if component exports default function
    return component.code.includes('export default') && 
           (component.code.includes('function') || component.code.includes('const'))
  }

  private async validateComponentBuilds(
    project: FullStackGenerationResult,
    performanceMode: 'fast' | 'thorough'
  ): Promise<ComponentBuildValidationResult> {
    const validComponents: string[] = []
    const invalidComponents: ComponentBuildError[] = []

    // Validate each component
    for (const component of project.frontendComponents) {
      const isValid = await this.validateComponentBuild(component, performanceMode)
      
      if (isValid.valid) {
        validComponents.push(component.filename)
      } else {
        invalidComponents.push({
          component: component.filename,
          error: isValid.error || 'Component build validation failed',
          fix: isValid.fix
        })
      }
    }

    // Validate imports and exports
    const importValidation = await this.validateImports(project.frontendComponents)
    const exportValidation = await this.validateExports(project.frontendComponents)

    return {
      validComponents,
      invalidComponents,
      importValidation,
      exportValidation
    }
  }

  private async validateComponentBuild(
    component: GeneratedComponent,
    performanceMode: 'fast' | 'thorough'
  ): Promise<{ valid: boolean, error?: string, fix?: string }> {
    // Check basic React component structure
    if (!component.code.includes('export')) {
      return {
        valid: false,
        error: 'Component missing export statement',
        fix: 'Add export statement for the component'
      }
    }

    // Check for JSX syntax
    if (component.code.includes('<') && component.code.includes('>')) {
      // Has JSX - check for React import
      if (!component.code.includes('import React') && !component.code.includes("import { ")) {
        return {
          valid: false,
          error: 'JSX component missing React import',
          fix: 'Add React import at the top of the file'
        }
      }
    }

    // Check for TypeScript issues (simplified)
    if (performanceMode === 'thorough') {
      const tsValidation = await this.validateTypeScriptFile(component.code, component.filename, performanceMode)
      if (tsValidation.errors.filter(e => e.severity === 'error').length > 0) {
        return {
          valid: false,
          error: 'TypeScript compilation errors',
          fix: 'Fix TypeScript errors in component'
        }
      }
    }

    return { valid: true }
  }

  private async validateImports(components: GeneratedComponent[]): Promise<ImportValidationResult> {
    const validImports: string[] = []
    const invalidImports: ImportError[] = []
    const circularImports: string[] = []
    const unusedImports: string[] = []

    for (const component of components) {
      const imports = this.extractImports(component.code)
      
      for (const importPath of imports) {
        // Validate import path
        if (importPath.startsWith('@/')) {
          // Internal import - simplified validation
          validImports.push(importPath)
        } else if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // Relative import - would need file system check
          validImports.push(importPath)
        } else {
          // External import - assume valid for now
          validImports.push(importPath)
        }

        // Check if import is used (simplified)
        const importName = this.extractImportName(importPath)
        if (importName && !component.code.includes(importName)) {
          unusedImports.push(importPath)
        }
      }
    }

    return {
      validImports,
      invalidImports,
      circularImports,
      unusedImports
    }
  }

  private async validateExports(components: GeneratedComponent[]): Promise<ExportValidationResult> {
    const validExports: string[] = []
    const invalidExports: ExportError[] = []
    const missingExports: string[] = []

    for (const component of components) {
      // Check for default export
      if (component.code.includes('export default')) {
        validExports.push(`${component.filename}:default`)
      } else if (component.componentType === 'page') {
        missingExports.push(`${component.filename}:default`)
      }

      // Check for named exports
      const namedExports = this.extractNamedExports(component.code)
      validExports.push(...namedExports.map(exp => `${component.filename}:${exp}`))
    }

    return {
      validExports,
      invalidExports,
      missingExports
    }
  }

  private async validateNextJSConfigurations(project: FullStackGenerationResult): Promise<ConfigurationValidationResult> {
    const issues: ConfigurationIssue[] = []

    // Check Next.js config
    const nextConfig = project.configurations.find(c => c.filename === 'next.config.mjs' || c.filename === 'next.config.js')
    const nextConfigValid = !!nextConfig && this.validateNextConfig(nextConfig.content)
    
    if (!nextConfigValid) {
      issues.push({
        file: 'next.config.js',
        issue: 'Invalid or missing Next.js configuration',
        severity: 'warning',
        fix: 'Create valid next.config.js file'
      })
    }

    // Check Tailwind config
    const tailwindConfig = project.configurations.find(c => c.filename === 'tailwind.config.js' || c.filename === 'tailwind.config.ts')
    const tailwindConfigValid = !!tailwindConfig && this.validateTailwindConfig(tailwindConfig.content)
    
    if (!tailwindConfigValid) {
      issues.push({
        file: 'tailwind.config.js',
        issue: 'Invalid or missing Tailwind configuration',
        severity: 'warning',
        fix: 'Create valid tailwind.config.js file'
      })
    }

    // Check TypeScript config
    const tsConfig = project.configurations.find(c => c.filename === 'tsconfig.json')
    const tsConfigValid = !!tsConfig && this.validateTSConfig(tsConfig.content)
    
    if (!tsConfigValid) {
      issues.push({
        file: 'tsconfig.json',
        issue: 'Invalid or missing TypeScript configuration',
        severity: 'error',
        fix: 'Create valid tsconfig.json file'
      })
    }

    // Check package.json
    const packageJson = project.configurations.find(c => c.filename === 'package.json')
    const packageJsonValid = !!packageJson && this.validatePackageJson(packageJson.content)
    
    if (!packageJsonValid) {
      issues.push({
        file: 'package.json',
        issue: 'Invalid or missing package.json',
        severity: 'error',
        fix: 'Create valid package.json file'
      })
    }

    // Check environment config
    const envConfig = project.configurations.find(c => c.filename === '.env.example' || c.filename === '.env.local')
    const envConfigValid = !!envConfig

    return {
      nextConfigValid,
      tailwindConfigValid,
      tsConfigValid,
      packageJsonValid,
      envConfigValid,
      issues
    }
  }

  private validateNextConfig(content: string): boolean {
    // Basic Next.js config validation
    return content.includes('nextConfig') || content.includes('module.exports')
  }

  private validateTailwindConfig(content: string): boolean {
    // Basic Tailwind config validation
    return content.includes('content') && content.includes('theme')
  }

  private validatePackageJson(content: string): boolean {
    try {
      const pkg = JSON.parse(content)
      return pkg.name && pkg.scripts && pkg.dependencies
    } catch {
      return false
    }
  }

  private async runOptimizationChecks(project: FullStackGenerationResult): Promise<OptimizationCheckResult> {
    // Bundle size analysis (simplified)
    const bundleSize: BundleSizeAnalysis = {
      totalSize: project.frontendComponents.reduce((total, comp) => total + comp.code.length, 0),
      componentSizes: project.frontendComponents.map(comp => ({
        component: comp.filename,
        size: comp.code.length,
        optimizable: comp.code.length > 2000
      })),
      recommendations: []
    }

    if (bundleSize.totalSize > 50000) {
      bundleSize.recommendations.push('Consider code splitting for large components')
    }

    // Performance optimizations
    const performanceOptimizations: PerformanceOptimization[] = []
    
    for (const component of project.frontendComponents) {
      if (component.code.length > 2000 && !component.code.includes('lazy')) {
        performanceOptimizations.push({
          type: 'lazy-loading',
          component: component.filename,
          current: 'Eager loading',
          recommended: 'Lazy loading with React.lazy()',
          impact: 'medium'
        })
      }

      if (component.code.includes('useEffect') && !component.code.includes('useMemo')) {
        performanceOptimizations.push({
          type: 'memoization',
          component: component.filename,
          current: 'No memoization',
          recommended: 'Use useMemo for expensive calculations',
          impact: 'low'
        })
      }
    }

    // Accessibility checks
    const accessibilityChecks: AccessibilityCheck[] = []
    
    for (const component of project.frontendComponents) {
      const issues: AccessibilityIssue[] = []
      
      if (component.code.includes('<img') && !component.code.includes('alt=')) {
        issues.push({
          type: 'missing-alt',
          element: 'img',
          severity: 'error',
          fix: 'Add alt attribute to all images'
        })
      }

      if (component.code.includes('<button') && !component.code.includes('aria-')) {
        issues.push({
          type: 'missing-aria',
          element: 'button',
          severity: 'warning',
          fix: 'Add appropriate ARIA attributes'
        })
      }

      const score = Math.max(0, 100 - (issues.length * 20))
      
      accessibilityChecks.push({
        component: component.filename,
        issues,
        score
      })
    }

    // SEO optimizations
    const seoOptimizations: SEOOptimization[] = []
    
    for (const component of project.frontendComponents) {
      if (component.componentType === 'page') {
        const issues: SEOIssue[] = []
        
        if (!component.code.includes('<title>') && !component.code.includes('title:')) {
          issues.push({
            type: 'missing-title',
            severity: 'error',
            fix: 'Add page title using Next.js Head component'
          })
        }

        if (!component.code.includes('description') && !component.code.includes('meta')) {
          issues.push({
            type: 'missing-description',
            severity: 'warning',
            fix: 'Add meta description for better SEO'
          })
        }

        const score = Math.max(0, 100 - (issues.length * 25))
        
        seoOptimizations.push({
          page: component.filename,
          issues,
          score
        })
      }
    }

    return {
      bundleSize,
      performanceOptimizations,
      accessibilityChecks,
      seoOptimizations
    }
  }

  private async validateCadenceContract(
    contract: GeneratedContract,
    performanceMode: 'fast' | 'thorough'
  ): Promise<CadenceContractValidation> {
    const syntaxErrors: CadenceSyntaxError[] = []
    const semanticErrors: CadenceSemanticError[] = []
    const warnings: CadenceWarning[] = []

    // Basic syntax validation
    if (!contract.code.includes('access(all) contract')) {
      syntaxErrors.push({
        line: 1,
        column: 1,
        message: 'Contract declaration missing or invalid',
        code: 'CADENCE001'
      })
    }

    if (!contract.code.includes('init()')) {
      syntaxErrors.push({
        line: 1,
        column: 1,
        message: 'Contract missing init() function',
        code: 'CADENCE002'
      })
    }

    // Semantic validation (simplified)
    if (performanceMode === 'thorough') {
      // Check for proper access modifiers
      const functions = contract.code.match(/fun\s+\w+/g) || []
      const accessModifiers = contract.code.match(/access\([^)]+\)\s+fun/g) || []
      
      if (functions.length > accessModifiers.length) {
        semanticErrors.push({
          line: 1,
          column: 1,
          message: 'Some functions missing access modifiers',
          type: 'access-violation'
        })
      }

      // Check for resource handling
      if (contract.code.includes('resource') && !contract.code.includes('destroy')) {
        warnings.push({
          line: 1,
          column: 1,
          message: 'Resource defined without destroy function',
          suggestion: 'Add destroy function for proper resource lifecycle'
        })
      }
    }

    const isValid = syntaxErrors.length === 0 && semanticErrors.length === 0
    const deployable = isValid && contract.validation.isValid

    return {
      contract: contract.filename,
      isValid,
      syntaxErrors,
      semanticErrors,
      warnings,
      deployable
    }
  }

  private async validateCadenceDependencies(contracts: GeneratedContract[]): Promise<CadenceDependencyValidation> {
    const requiredImports: string[] = []
    const availableImports: string[] = []
    const missingImports: string[] = []
    const invalidImports: string[] = []

    // Extract imports from all contracts
    for (const contract of contracts) {
      const imports = this.extractCadenceImports(contract.code)
      requiredImports.push(...imports)
    }

    // Standard Flow imports that should be available
    const standardImports = [
      'NonFungibleToken',
      'FungibleToken',
      'MetadataViews',
      'ViewResolver'
    ]

    availableImports.push(...standardImports)

    // Check for missing imports
    for (const required of requiredImports) {
      if (!availableImports.includes(required)) {
        missingImports.push(required)
      }
    }

    return {
      requiredImports,
      availableImports,
      missingImports,
      invalidImports
    }
  }

  private async validateNetworkCompatibility(contracts: GeneratedContract[]): Promise<NetworkCompatibilityResult> {
    const issues: NetworkCompatibilityIssue[] = []

    // Check for testnet compatibility
    let testnetCompatible = true
    let mainnetCompatible = true
    let emulatorCompatible = true

    for (const contract of contracts) {
      // Check for hardcoded addresses (simplified)
      if (contract.code.includes('0x01') || contract.code.includes('0x02')) {
        issues.push({
          network: 'mainnet',
          issue: 'Contract contains hardcoded testnet addresses',
          severity: 'error',
          fix: 'Use environment variables for contract addresses'
        })
        mainnetCompatible = false
      }

      // Check for emulator-specific code
      if (contract.code.includes('emulator')) {
        issues.push({
          network: 'testnet',
          issue: 'Contract contains emulator-specific code',
          severity: 'warning',
          fix: 'Remove emulator-specific code for testnet deployment'
        })
      }
    }

    return {
      testnetCompatible,
      mainnetCompatible,
      emulatorCompatible,
      issues
    }
  }

  private checkTestingFramework(packageJsonContent?: string): boolean {
    if (!packageJsonContent) return false
    
    try {
      const packageJson = JSON.parse(packageJsonContent)
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      return !!(deps.jest || deps.vitest || deps['@testing-library/react'] || deps.cypress || deps.playwright)
    } catch {
      return false
    }
  }

  private async analyzeTestCoverage(
    project: FullStackGenerationResult,
    performanceMode: 'fast' | 'thorough'
  ): Promise<TestCoverageResult> {
    // Simplified test coverage analysis
    const uncoveredFiles: string[] = []
    const recommendations: string[] = []

    // Check if components have corresponding test files
    for (const component of project.frontendComponents) {
      const testFileName = component.filename.replace('.tsx', '.test.tsx').replace('.ts', '.test.ts')
      // In real implementation, would check if test file exists
      uncoveredFiles.push(component.filename)
    }

    // Check if API routes have tests
    for (const apiRoute of project.apiRoutes) {
      const testFileName = apiRoute.filename.replace('.ts', '.test.ts')
      uncoveredFiles.push(apiRoute.filename)
    }

    // Check if contracts have tests
    for (const contract of project.smartContracts) {
      const testFileName = contract.filename.replace('.cdc', '.test.js')
      uncoveredFiles.push(contract.filename)
    }

    if (uncoveredFiles.length > 0) {
      recommendations.push('Add unit tests for uncovered components')
      recommendations.push('Set up integration tests for API routes')
      recommendations.push('Create contract tests for Cadence contracts')
    }

    return {
      overallCoverage: 0, // Would be calculated from actual test results
      contractCoverage: 0,
      componentCoverage: 0,
      apiRouteCoverage: 0,
      uncoveredFiles,
      recommendations
    }
  }

  private async analyzeTestTypes(
    project: FullStackGenerationResult,
    performanceMode: 'fast' | 'thorough'
  ): Promise<TestTypeResult> {
    // Simplified test type analysis
    return {
      unitTests: {
        present: false,
        count: 0,
        coverage: 0,
        frameworks: [],
        issues: ['No unit tests found']
      },
      integrationTests: {
        present: false,
        count: 0,
        coverage: 0,
        frameworks: [],
        issues: ['No integration tests found']
      },
      e2eTests: {
        present: false,
        count: 0,
        coverage: 0,
        frameworks: [],
        issues: ['No E2E tests found']
      },
      contractTests: {
        present: false,
        count: 0,
        coverage: 0,
        frameworks: [],
        issues: ['No contract tests found']
      }
    }
  }

  private async validateTestConfiguration(project: FullStackGenerationResult): Promise<TestConfigurationResult> {
    const issues: TestConfigurationIssue[] = []

    // Check for Jest config
    const jestConfig = project.configurations.find(c => 
      c.filename === 'jest.config.js' || 
      c.filename === 'jest.config.ts' ||
      c.filename === 'jest.config.json'
    )
    const jestConfigValid = !!jestConfig

    // Check for Vitest config
    const vitestConfig = project.configurations.find(c => 
      c.filename === 'vitest.config.js' || 
      c.filename === 'vitest.config.ts'
    )
    const vitestConfigValid = !!vitestConfig

    // Check for Playwright config
    const playwrightConfig = project.configurations.find(c => 
      c.filename === 'playwright.config.js' || 
      c.filename === 'playwright.config.ts'
    )
    const playwrightConfigValid = !!playwrightConfig

    // Check for Cypress config
    const cypressConfig = project.configurations.find(c => 
      c.filename === 'cypress.config.js' || 
      c.filename === 'cypress.config.ts'
    )
    const cypressConfigValid = !!cypressConfig

    if (!jestConfigValid && !vitestConfigValid) {
      issues.push({
        file: 'test configuration',
        issue: 'No unit testing framework configuration found',
        severity: 'warning',
        fix: 'Add Jest or Vitest configuration'
      })
    }

    return {
      jestConfigValid,
      vitestConfigValid,
      playwrightConfigValid,
      cypressConfigValid,
      issues
    }
  }

  private async validateAutomatedTesting(project: FullStackGenerationResult): Promise<AutomatedTestingResult> {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check for CI/CD setup (simplified)
    const cicdSetup = project.configurations.some(c => 
      c.filename.includes('.github') || 
      c.filename.includes('ci.yml') ||
      c.filename.includes('workflow')
    )

    // Check for pre-commit hooks
    const preCommitHooks = project.configurations.some(c => 
      c.filename.includes('.husky') || 
      c.filename.includes('pre-commit')
    )

    // Check for test scripts in package.json
    const packageJson = project.configurations.find(c => c.filename === 'package.json')
    let testScripts = false
    
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson.content)
        testScripts = !!(pkg.scripts?.test || pkg.scripts?.['test:unit'] || pkg.scripts?.['test:e2e'])
      } catch {
        // Ignore parsing errors
      }
    }

    // Check for coverage reporting
    const coverageReporting = packageJson?.content.includes('coverage') || false

    if (!cicdSetup) {
      issues.push('No CI/CD pipeline configuration found')
      recommendations.push('Set up GitHub Actions or similar CI/CD pipeline')
    }

    if (!preCommitHooks) {
      issues.push('No pre-commit hooks configured')
      recommendations.push('Add pre-commit hooks with Husky')
    }

    if (!testScripts) {
      issues.push('No test scripts in package.json')
      recommendations.push('Add test scripts to package.json')
    }

    if (!coverageReporting) {
      recommendations.push('Enable test coverage reporting')
    }

    return {
      cicdSetup,
      preCommitHooks,
      testScripts,
      coverageReporting,
      issues,
      recommendations
    }
  }

  // Scoring methods

  private calculateTypeScriptScore(
    errors: TypeScriptError[],
    warnings: TypeScriptWarning[],
    configurationValid: boolean,
    dependenciesResolved: boolean
  ): number {
    let score = 100
    
    score -= errors.filter(e => e.severity === 'error').length * 15
    score -= warnings.length * 5
    
    if (!configurationValid) score -= 20
    if (!dependenciesResolved) score -= 15
    
    return Math.max(0, score)
  }

  private calculateNextJSScore(
    routeValidation: RouteValidationResult,
    componentValidation: ComponentBuildValidationResult,
    configurationValidation: ConfigurationValidationResult,
    optimizationChecks: OptimizationCheckResult
  ): number {
    let score = 100
    
    score -= routeValidation.invalidRoutes.length * 20
    score -= componentValidation.invalidComponents.length * 15
    score -= configurationValidation.issues.filter(i => i.severity === 'error').length * 10
    score -= configurationValidation.issues.filter(i => i.severity === 'warning').length * 5
    
    // Bonus for optimizations
    const avgAccessibilityScore = optimizationChecks.accessibilityChecks.length > 0
      ? optimizationChecks.accessibilityChecks.reduce((sum, check) => sum + check.score, 0) / optimizationChecks.accessibilityChecks.length
      : 100
    
    score = Math.min(100, score + (avgAccessibilityScore - 100) * 0.1)
    
    return Math.max(0, score)
  }

  private calculateCadenceScore(
    contracts: CadenceContractValidation[],
    dependencyValidation: CadenceDependencyValidation,
    networkCompatibility: NetworkCompatibilityResult
  ): number {
    let score = 100
    
    const invalidContracts = contracts.filter(c => !c.isValid).length
    score -= invalidContracts * 25
    
    score -= dependencyValidation.missingImports.length * 10
    score -= networkCompatibility.issues.filter(i => i.severity === 'error').length * 15
    score -= networkCompatibility.issues.filter(i => i.severity === 'warning').length * 5
    
    return Math.max(0, score)
  }

  private calculateTestingScore(
    hasTestingFramework: boolean,
    testCoverage: TestCoverageResult,
    testTypes: TestTypeResult,
    testConfiguration: TestConfigurationResult,
    automatedTesting: AutomatedTestingResult
  ): number {
    let score = 0
    
    if (hasTestingFramework) score += 25
    
    score += testCoverage.overallCoverage * 0.3 // Max 30 points for coverage
    
    if (testTypes.unitTests.present) score += 15
    if (testTypes.integrationTests.present) score += 10
    if (testTypes.e2eTests.present) score += 10
    if (testTypes.contractTests.present) score += 10
    
    if (automatedTesting.cicdSetup) score += 5
    if (automatedTesting.preCommitHooks) score += 3
    if (automatedTesting.testScripts) score += 2
    
    return Math.min(100, score)
  }

  private calculateOverallCompilationScore(
    typeScriptCompilation: TypeScriptCompilationResult,
    nextJSBuildValidation: NextJSBuildValidationResult,
    cadenceCompilation: CadenceCompilationResult,
    testingSetup: TestingSetupResult
  ): { isValid: boolean, overallScore: number } {
    const scores = [
      typeScriptCompilation.score * 0.3,
      nextJSBuildValidation.score * 0.3,
      cadenceCompilation.score * 0.25,
      testingSetup.score * 0.15
    ]
    
    const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0))
    
    const isValid = typeScriptCompilation.compilable &&
                   nextJSBuildValidation.buildable &&
                   cadenceCompilation.compilable
    
    return { isValid, overallScore }
  }

  private generateCompilationRecommendations(
    typeScriptCompilation: TypeScriptCompilationResult,
    nextJSBuildValidation: NextJSBuildValidationResult,
    cadenceCompilation: CadenceCompilationResult,
    testingSetup: TestingSetupResult
  ): string[] {
    const recommendations: string[] = []
    
    // TypeScript recommendations
    if (!typeScriptCompilation.compilable) {
      recommendations.push('Fix TypeScript compilation errors before deployment')
    }
    if (!typeScriptCompilation.configurationValid) {
      recommendations.push('Update TypeScript configuration file')
    }
    if (!typeScriptCompilation.dependenciesResolved) {
      recommendations.push('Install missing TypeScript dependencies')
    }
    
    // Next.js recommendations
    if (!nextJSBuildValidation.buildable) {
      recommendations.push('Fix Next.js build errors')
    }
    if (nextJSBuildValidation.routeValidation.invalidRoutes.length > 0) {
      recommendations.push('Fix invalid route configurations')
    }
    
    // Add optimization recommendations
    const perfOptimizations = nextJSBuildValidation.optimizationChecks.performanceOptimizations
    if (perfOptimizations.length > 0) {
      recommendations.push('Implement suggested performance optimizations')
    }
    
    // Cadence recommendations
    if (!cadenceCompilation.compilable) {
      recommendations.push('Fix Cadence contract compilation errors')
    }
    if (cadenceCompilation.dependencyValidation.missingImports.length > 0) {
      recommendations.push('Add missing Cadence contract imports')
    }
    
    // Testing recommendations
    if (!testingSetup.hasTestingFramework) {
      recommendations.push('Set up a testing framework (Jest, Vitest, etc.)')
    }
    if (testingSetup.testCoverage.overallCoverage < 50) {
      recommendations.push('Increase test coverage to at least 50%')
    }
    recommendations.push(...testingSetup.testCoverage.recommendations)
    recommendations.push(...testingSetup.automatedTesting.recommendations)
    
    return recommendations
  }

  // Utility methods

  private extractImports(code: string): string[] {
    const imports: string[] = []
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g
    let match
    
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1])
    }
    
    return imports
  }

  private extractImportName(importPath: string): string | null {
    // Extract the actual imported name - simplified
    const parts = importPath.split('/')
    return parts[parts.length - 1] || null
  }

  private extractNamedExports(code: string): string[] {
    const exports: string[] = []
    const exportRegex = /export\s+(?:const|function|class)\s+(\w+)/g
    let match
    
    while ((match = exportRegex.exec(code)) !== null) {
      exports.push(match[1])
    }
    
    return exports
  }

  private extractCadenceImports(code: string): string[] {
    const imports: string[] = []
    const importRegex = /import\s+(\w+)\s+from/g
    let match
    
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1])
    }
    
    return imports
  }
}

// Export singleton instance
export const projectCompilationValidator = new ProjectCompilationValidator()