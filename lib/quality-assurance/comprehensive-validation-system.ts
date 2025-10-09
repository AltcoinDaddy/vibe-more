/**
 * Comprehensive Validation System Integration
 * 
 * Extends existing CodeValidator to work with quality assurance components,
 * providing unified validation for function signatures, contract structure,
 * event definitions, and parameter types.
 */

import { CodeValidator, SyntaxValidationResult } from '../migration/code-validator'
import { ComprehensiveErrorDetector, ErrorDetectionResult } from './comprehensive-error-detector'
import { UndefinedValueDetector, UndefinedScanResult } from './undefined-value-detector'
import { QualityScoreCalculator } from './quality-score-calculator'
import { ContractSpecificValidator, ContractSpecificValidationResult } from './contract-specific-validator'
import { FunctionalCompletenessValidator, FunctionalCompletenessResult } from './functional-completeness-validator'
import { ValidationResult, ValidationIssue, CodeLocation, QualityScore, ContractType } from './types'
import { QALogger, getLogger } from './logger'

export interface ComprehensiveValidationResult {
  isValid: boolean
  overallScore: number
  syntaxValidation: SyntaxValidationResult
  errorDetection: ErrorDetectionResult
  undefinedValueScan: UndefinedScanResult
  contractSpecificValidation: ContractSpecificValidationResult
  functionalCompletenessValidation: FunctionalCompletenessResult
  qualityScore: QualityScore
  validationResults: ValidationResult[]
  recommendations: string[]
  contractType: string
  completenessPercentage: number
}

export interface ValidationContext {
  contractType?: ContractType
  strictMode?: boolean
  enableAutoFix?: boolean
  customRules?: ValidationRule[]
  performanceMode?: 'fast' | 'thorough'
}

export interface ValidationRule {
  name: string
  description: string
  pattern: RegExp
  severity: 'critical' | 'warning' | 'info'
  category: 'syntax' | 'structure' | 'function' | 'event' | 'best-practice'
  autoFixable: boolean
  suggestedFix?: (match: string, context: string) => string
}

export interface FunctionSignatureValidation {
  functionName: string
  isComplete: boolean
  hasReturnType: boolean
  hasParameters: boolean
  hasBody: boolean
  accessModifier: string | null
  issues: ValidationIssue[]
  completenessScore: number
}

export interface ContractStructureValidation {
  hasContractDeclaration: boolean
  hasInitFunction: boolean
  hasProperAccessModifiers: boolean
  requiredImportsPresent: string[]
  missingImports: string[]
  structureScore: number
  issues: ValidationIssue[]
}

export interface EventDefinitionValidation {
  eventName: string
  hasAccessModifier: boolean
  hasParameters: boolean
  parametersValid: boolean
  isEmitted: boolean
  issues: ValidationIssue[]
  completenessScore: number
}

export class ComprehensiveValidationSystem {
  private codeValidator: CodeValidator
  private errorDetector: ComprehensiveErrorDetector
  private undefinedDetector: UndefinedValueDetector
  private qualityCalculator: QualityScoreCalculator
  private contractSpecificValidator: ContractSpecificValidator
  private functionalCompletenessValidator: FunctionalCompletenessValidator
  private logger: QALogger

  constructor() {
    this.codeValidator = new CodeValidator()
    this.errorDetector = new ComprehensiveErrorDetector()
    this.undefinedDetector = new UndefinedValueDetector()
    this.qualityCalculator = new QualityScoreCalculator()
    this.contractSpecificValidator = new ContractSpecificValidator()
    this.functionalCompletenessValidator = new FunctionalCompletenessValidator()
    
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
   * Perform comprehensive validation integrating all quality assurance components
   */
  async validateCode(code: string, context: ValidationContext = {}): Promise<ComprehensiveValidationResult> {
    const startTime = Date.now()
    this.logger.info('Starting comprehensive validation', { 
      codeLength: code.length,
      context 
    })

    try {
      // Step 1: Basic syntax validation using existing CodeValidator
      const syntaxValidation = this.codeValidator.validateSyntax(code)
      
      // Step 2: Comprehensive error detection
      const contractType = this.inferContractType(code, context.contractType)
      const errorDetection = await this.errorDetector.detectErrors(code, contractType)
      
      // Step 3: Undefined value detection
      const undefinedValueScan = this.undefinedDetector.scanForUndefinedValues(code)
      
      // Step 4: Function signature validation
      const functionValidations = this.validateFunctionSignatures(code)
      
      // Step 5: Contract structure validation
      const structureValidation = this.validateContractStructure(code, contractType)
      
      // Step 6: Event definition validation
      const eventValidations = this.validateEventDefinitions(code)
      
      // Step 7: Contract-specific validation
      const contractSpecificValidation = await this.contractSpecificValidator.validateContract(code, {
        category: contractType as any,
        complexity: 'intermediate',
        features: context.customRules?.map(r => r.name) || []
      })
      
      // Step 8: Functional completeness validation
      const functionalCompletenessValidation = await this.functionalCompletenessValidator.validateFunctionalCompleteness(code, {
        category: contractType as any,
        complexity: 'intermediate',
        features: context.customRules?.map(r => r.name) || []
      })
      
      // Step 9: Combine all validation results
      const validationResults = this.combineValidationResults(
        syntaxValidation,
        errorDetection,
        undefinedValueScan,
        functionValidations,
        structureValidation,
        eventValidations,
        contractSpecificValidation,
        functionalCompletenessValidation
      )
      
      // Step 10: Calculate quality score
      const qualityScore = this.qualityCalculator.calculateQualityScore(validationResults, {
        contractType: { category: contractType as any, complexity: 'intermediate', features: [] },
        requirements: {
          minimumQualityScore: 80,
          requiredFeatures: ['init'], // At least require init function
          prohibitedPatterns: ['undefined', 'null'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        }
      })
      
      // Step 11: Generate recommendations
      const recommendations = this.generateRecommendations(
        syntaxValidation,
        errorDetection,
        undefinedValueScan,
        functionValidations,
        structureValidation,
        eventValidations,
        contractSpecificValidation,
        functionalCompletenessValidation
      )
      
      // Step 12: Calculate overall validity and completeness
      const isValid = this.determineOverallValidity(
        syntaxValidation,
        errorDetection,
        undefinedValueScan,
        functionalCompletenessValidation,
        context.strictMode || false
      )
      
      const completenessPercentage = this.calculateCompletenessPercentage(
        functionValidations,
        structureValidation,
        eventValidations,
        functionalCompletenessValidation
      )

      const result: ComprehensiveValidationResult = {
        isValid,
        overallScore: qualityScore.overall,
        syntaxValidation,
        errorDetection,
        undefinedValueScan,
        contractSpecificValidation,
        functionalCompletenessValidation,
        qualityScore,
        validationResults,
        recommendations,
        contractType,
        completenessPercentage
      }

      const duration = Date.now() - startTime
      this.logger.info('Comprehensive validation completed', {
        duration,
        isValid,
        overallScore: qualityScore.overall,
        totalIssues: errorDetection.totalErrors + undefinedValueScan.totalIssues,
        completenessPercentage
      })

      return result

    } catch (error) {
      this.logger.error('Comprehensive validation failed', { error: error.message })
      
      // Return minimal validation result on failure
      return this.createFailureResult(code, error, startTime)
    }
  }

  /**
   * Validate function signature completeness
   */
  validateFunctionSignatures(code: string): FunctionSignatureValidation[] {
    const validations: FunctionSignatureValidation[] = []
    const lines = code.split('\n')
    
    // Find all function declarations
    const functionPattern = /(access\([^)]+\)\s+)?fun\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*(\{?)/g
    let match

    while ((match = functionPattern.exec(code)) !== null) {
      const accessModifier = match[1]?.trim() || null
      const functionName = match[2]
      const parameters = match[3]
      const returnType = match[4]?.trim()
      const hasOpenBrace = match[5] === '{'
      
      const location = this.findLocationInCode(code, match.index)
      const issues: ValidationIssue[] = []

      // Check access modifier
      if (!accessModifier) {
        issues.push({
          severity: 'warning',
          type: 'missing-access-modifier',
          location,
          message: `Function '${functionName}' is missing access modifier`,
          suggestedFix: `Add access modifier: access(all) fun ${functionName}`,
          autoFixable: true
        })
      }

      // Check function body
      let hasBody = false
      if (hasOpenBrace) {
        const functionBody = this.extractFunctionBody(code, match.index)
        hasBody = functionBody.trim().length > 2 // More than just braces
        
        if (!hasBody) {
          issues.push({
            severity: 'critical',
            type: 'empty-function-body',
            location,
            message: `Function '${functionName}' has empty implementation`,
            suggestedFix: 'Add function implementation',
            autoFixable: false
          })
        }
      } else {
        issues.push({
          severity: 'critical',
          type: 'missing-function-body',
          location,
          message: `Function '${functionName}' is missing implementation body`,
          suggestedFix: 'Add function body with braces { }',
          autoFixable: true
        })
      }

      // Check return type consistency
      if (hasBody && returnType) {
        const functionBody = this.extractFunctionBody(code, match.index)
        const hasReturnStatement = /^\s*return\s+/m.test(functionBody)
        
        if (!hasReturnStatement && returnType !== 'Void') {
          issues.push({
            severity: 'critical',
            type: 'missing-return-statement',
            location,
            message: `Function '${functionName}' has return type '${returnType}' but no return statement`,
            suggestedFix: `Add return statement: return /* ${returnType} value */`,
            autoFixable: false
          })
        }
      }

      // Calculate completeness score
      let completenessScore = 0
      if (accessModifier) completenessScore += 25
      if (hasBody) completenessScore += 50
      if (returnType || functionName === 'init') completenessScore += 25
      if (issues.filter(i => i.severity === 'critical').length === 0) completenessScore = Math.max(completenessScore, 75)

      validations.push({
        functionName,
        isComplete: issues.filter(i => i.severity === 'critical').length === 0,
        hasReturnType: !!returnType,
        hasParameters: parameters.trim().length > 0,
        hasBody,
        accessModifier,
        issues,
        completenessScore
      })
    }

    return validations
  }

  /**
   * Validate contract and resource structure
   */
  validateContractStructure(code: string, contractType: string): ContractStructureValidation {
    const issues: ValidationIssue[] = []
    
    // Check contract declaration
    const hasContractDeclaration = /access\(all\)\s+contract\s+\w+/.test(code)
    if (!hasContractDeclaration) {
      issues.push({
        severity: 'critical',
        type: 'missing-contract-declaration',
        location: { line: 1, column: 1 },
        message: 'Contract declaration is missing',
        suggestedFix: 'Add contract declaration: access(all) contract YourContractName { }',
        autoFixable: true
      })
    }

    // Check init function
    const hasInitFunction = /init\s*\(\s*\)\s*\{/.test(code)
    if (!hasInitFunction) {
      issues.push({
        severity: 'critical',
        type: 'missing-init-function',
        location: { line: 1, column: 1 },
        message: 'Contract is missing init() function',
        suggestedFix: 'Add init function: init() { }',
        autoFixable: true
      })
    }

    // Check access modifiers
    const functionsWithoutAccess = code.match(/^\s*fun\s+\w+/gm) || []
    const hasProperAccessModifiers = functionsWithoutAccess.length === 0

    if (!hasProperAccessModifiers) {
      issues.push({
        severity: 'warning',
        type: 'missing-access-modifiers',
        location: { line: 1, column: 1 },
        message: 'Some functions are missing access modifiers',
        suggestedFix: 'Add access modifiers to all functions',
        autoFixable: true
      })
    }

    // Check required imports based on contract type
    const requiredImports = this.getRequiredImports(contractType)
    const presentImports = this.extractImports(code)
    const missingImports = requiredImports.filter(imp => !presentImports.includes(imp))

    missingImports.forEach(imp => {
      issues.push({
        severity: 'warning',
        type: 'missing-required-import',
        location: { line: 1, column: 1 },
        message: `Missing required import '${imp}' for ${contractType} contract`,
        suggestedFix: `Add import: import ${imp} from 0x...`,
        autoFixable: false
      })
    })

    // Calculate structure score
    let structureScore = 0
    if (hasContractDeclaration) structureScore += 40
    if (hasInitFunction) structureScore += 30
    if (hasProperAccessModifiers) structureScore += 20
    if (missingImports.length === 0) structureScore += 10

    return {
      hasContractDeclaration,
      hasInitFunction,
      hasProperAccessModifiers,
      requiredImportsPresent: presentImports.filter(imp => requiredImports.includes(imp)),
      missingImports,
      structureScore,
      issues
    }
  }

  /**
   * Validate event definitions and parameter types
   */
  validateEventDefinitions(code: string): EventDefinitionValidation[] {
    const validations: EventDefinitionValidation[] = []
    
    // Find event declarations
    const eventPattern = /(access\([^)]+\)\s+)?event\s+(\w+)\s*\(([^)]*)\)/g
    let match

    while ((match = eventPattern.exec(code)) !== null) {
      const accessModifier = match[1]?.trim()
      const eventName = match[2]
      const parameters = match[3]
      
      const location = this.findLocationInCode(code, match.index)
      const issues: ValidationIssue[] = []

      // Check access modifier
      const hasAccessModifier = !!accessModifier
      if (!hasAccessModifier) {
        issues.push({
          severity: 'warning',
          type: 'missing-event-access-modifier',
          location,
          message: `Event '${eventName}' is missing access modifier`,
          suggestedFix: `Add access modifier: access(all) event ${eventName}`,
          autoFixable: true
        })
      }

      // Check parameters
      const hasParameters = parameters.trim().length > 0
      let parametersValid = true

      if (hasParameters) {
        const paramList = parameters.split(',').map(p => p.trim())
        
        paramList.forEach((param, index) => {
          if (!param.includes(':')) {
            parametersValid = false
            issues.push({
              severity: 'critical',
              type: 'invalid-event-parameter',
              location: { line: location.line, column: location.column + match[0].indexOf(param) },
              message: `Event '${eventName}' parameter '${param}' is missing type annotation`,
              suggestedFix: 'Add type annotation: parameterName: ParameterType',
              autoFixable: false
            })
          } else {
            const [paramName, paramType] = param.split(':').map(p => p.trim())
            if (!paramName || !paramType) {
              parametersValid = false
              issues.push({
                severity: 'critical',
                type: 'malformed-event-parameter',
                location: { line: location.line, column: location.column + match[0].indexOf(param) },
                message: `Event '${eventName}' has malformed parameter '${param}'`,
                suggestedFix: 'Use format: parameterName: ParameterType',
                autoFixable: false
              })
            }
          }
        })
      }

      // Check if event is emitted
      const isEmitted = code.includes(`emit ${eventName}`)
      if (!isEmitted) {
        issues.push({
          severity: 'info',
          type: 'unused-event',
          location,
          message: `Event '${eventName}' is defined but never emitted`,
          suggestedFix: `Add event emission: emit ${eventName}(/* parameters */)`,
          autoFixable: false
        })
      }

      // Calculate completeness score
      let completenessScore = 0
      if (hasAccessModifier) completenessScore += 25
      if (parametersValid) completenessScore += 50
      if (isEmitted) completenessScore += 25

      validations.push({
        eventName,
        hasAccessModifier,
        hasParameters,
        parametersValid,
        isEmitted,
        issues,
        completenessScore
      })
    }

    return validations
  }

  // Helper methods

  private inferContractType(code: string, providedType?: ContractType): string {
    if (providedType?.category) {
      return providedType.category
    }

    // Infer from code content
    if (code.includes('NonFungibleToken') || code.includes('NFT')) return 'nft'
    if (code.includes('FungibleToken') || code.includes('Vault')) return 'fungible-token'
    if (code.includes('vote') || code.includes('proposal')) return 'dao'
    if (code.includes('marketplace') || code.includes('listing')) return 'marketplace'
    return 'generic'
  }

  private findLocationInCode(code: string, index: number): CodeLocation {
    const beforeMatch = code.substring(0, index)
    const lines = beforeMatch.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length

    return { line, column }
  }

  private extractFunctionBody(code: string, startIndex: number): string {
    let braceCount = 0
    let inFunction = false
    let functionBody = ''

    for (let i = startIndex; i < code.length; i++) {
      const char = code[i]
      
      if (char === '{') {
        braceCount++
        inFunction = true
        functionBody += char
      } else if (char === '}') {
        braceCount--
        functionBody += char
        if (inFunction && braceCount === 0) {
          break
        }
      } else if (inFunction) {
        functionBody += char
      }
    }

    return functionBody
  }

  private getRequiredImports(contractType: string): string[] {
    const importMap: { [key: string]: string[] } = {
      'nft': ['NonFungibleToken', 'MetadataViews'],
      'fungible-token': ['FungibleToken'],
      'dao': [],
      'marketplace': ['NonFungibleToken', 'FungibleToken'],
      'generic': []
    }

    return importMap[contractType] || []
  }

  private extractImports(code: string): string[] {
    const imports: string[] = []
    const importPattern = /import\s+(\w+)\s+from/g
    let match

    while ((match = importPattern.exec(code)) !== null) {
      imports.push(match[1])
    }

    return imports
  }

  private combineValidationResults(
    syntaxValidation: SyntaxValidationResult,
    errorDetection: ErrorDetectionResult,
    undefinedValueScan: UndefinedScanResult,
    functionValidations: FunctionSignatureValidation[],
    structureValidation: ContractStructureValidation,
    eventValidations: EventDefinitionValidation[],
    contractSpecificValidation: ContractSpecificValidationResult,
    functionalCompletenessValidation: FunctionalCompletenessResult
  ): ValidationResult[] {
    const results: ValidationResult[] = []

    // Syntax validation result
    const syntaxIssues = [
      ...syntaxValidation.errors.map(e => ({
        severity: 'critical' as const,
        type: e.type,
        location: e.location,
        message: e.message,
        suggestedFix: e.suggestion,
        autoFixable: false
      })),
      ...syntaxValidation.warnings.map(w => ({
        severity: 'warning' as const,
        type: w.type,
        location: w.location,
        message: w.message,
        suggestedFix: w.suggestion,
        autoFixable: false
      })),
      ...syntaxValidation.structureIssues.map(s => ({
        severity: s.severity as 'critical' | 'warning',
        type: s.type,
        location: s.location,
        message: s.message,
        suggestedFix: s.suggestion,
        autoFixable: false
      })),
      ...syntaxValidation.functionIssues.map(f => ({
        severity: 'critical' as const,
        type: f.type,
        location: f.location,
        message: f.message,
        suggestedFix: f.suggestion,
        autoFixable: false
      })),
      ...syntaxValidation.eventIssues.map(e => ({
        severity: 'warning' as const,
        type: e.type,
        location: e.location,
        message: e.message,
        suggestedFix: e.suggestion,
        autoFixable: false
      }))
    ]

    const syntaxScore = syntaxValidation.isValid ? 
      Math.max(0, 100 - (syntaxIssues.filter(i => i.severity === 'critical').length * 20) - (syntaxIssues.filter(i => i.severity === 'warning').length * 5)) :
      Math.max(0, 100 - (syntaxValidation.errors.length * 25))

    results.push({
      type: 'syntax',
      passed: syntaxValidation.isValid,
      issues: syntaxIssues,
      score: syntaxScore
    })

    // Completeness validation result
    const completenessIssues = [
      ...functionValidations.flatMap(f => f.issues),
      ...structureValidation.issues,
      ...eventValidations.flatMap(e => e.issues)
    ]

    const criticalCompletenessIssues = completenessIssues.filter(i => i.severity === 'critical').length
    const completenessScore = Math.max(0, 100 - (criticalCompletenessIssues * 15) - (completenessIssues.length * 5))

    results.push({
      type: 'completeness',
      passed: criticalCompletenessIssues === 0,
      issues: completenessIssues,
      score: completenessScore
    })

    // Logic validation result (from error detection)
    const logicIssues = errorDetection.errors.map(e => ({
      severity: e.severity,
      type: e.type,
      location: e.location,
      message: e.message,
      suggestedFix: e.suggestedFix,
      autoFixable: e.autoFixable
    }))

    results.push({
      type: 'logic',
      passed: errorDetection.criticalErrors === 0,
      issues: logicIssues,
      score: errorDetection.completenessScore
    })

    // Best practices validation result
    const bestPracticeIssues = undefinedValueScan.issues.map(issue => ({
      severity: issue.severity,
      type: issue.type,
      location: issue.location,
      message: issue.message,
      suggestedFix: issue.suggestedFix,
      autoFixable: issue.autoFixable
    }))

    const bestPracticesScore = Math.max(0, 100 - (undefinedValueScan.criticalIssues * 20) - (undefinedValueScan.warningIssues * 10))

    results.push({
      type: 'best-practices',
      passed: !undefinedValueScan.hasBlockingIssues,
      issues: bestPracticeIssues,
      score: bestPracticesScore
    })

    // Contract-specific validation results
    results.push(...contractSpecificValidation.validationResults)

    // Functional completeness validation results
    results.push(...functionalCompletenessValidation.validationResults)

    return results
  }

  private generateRecommendations(
    syntaxValidation: SyntaxValidationResult,
    errorDetection: ErrorDetectionResult,
    undefinedValueScan: UndefinedScanResult,
    functionValidations: FunctionSignatureValidation[],
    structureValidation: ContractStructureValidation,
    eventValidations: EventDefinitionValidation[],
    contractSpecificValidation: ContractSpecificValidationResult,
    functionalCompletenessValidation: FunctionalCompletenessResult
  ): string[] {
    const recommendations: string[] = []

    // Syntax recommendations
    if (!syntaxValidation.isValid) {
      recommendations.push('Fix syntax errors to ensure code compiles correctly')
    }

    // Structure recommendations
    if (!structureValidation.hasContractDeclaration) {
      recommendations.push('Add proper contract declaration with access modifier')
    }
    if (!structureValidation.hasInitFunction) {
      recommendations.push('Add init() function for contract initialization')
    }
    if (structureValidation.missingImports.length > 0) {
      recommendations.push(`Add missing imports: ${structureValidation.missingImports.join(', ')}`)
    }

    // Function recommendations
    const incompleteFunctions = functionValidations.filter(f => !f.isComplete)
    if (incompleteFunctions.length > 0) {
      recommendations.push(`Complete function implementations: ${incompleteFunctions.map(f => f.functionName).join(', ')}`)
    }

    // Event recommendations
    const incompleteEvents = eventValidations.filter(e => !e.parametersValid)
    if (incompleteEvents.length > 0) {
      recommendations.push(`Fix event parameter definitions: ${incompleteEvents.map(e => e.eventName).join(', ')}`)
    }

    // Undefined value recommendations
    if (undefinedValueScan.hasBlockingIssues) {
      recommendations.push('Remove undefined values and replace with appropriate defaults')
    }

    // Error detection recommendations
    recommendations.push(...errorDetection.actionableRecommendations)

    // Contract-specific recommendations
    recommendations.push(...contractSpecificValidation.recommendations)

    // Functional completeness recommendations
    recommendations.push(...functionalCompletenessValidation.recommendations)

    return recommendations
  }

  private determineOverallValidity(
    syntaxValidation: SyntaxValidationResult,
    errorDetection: ErrorDetectionResult,
    undefinedValueScan: UndefinedScanResult,
    functionalCompletenessValidation: FunctionalCompletenessResult,
    strictMode: boolean
  ): boolean {
    // In strict mode, any critical issue makes code invalid
    if (strictMode) {
      return syntaxValidation.isValid && 
             errorDetection.criticalErrors === 0 && 
             !undefinedValueScan.hasBlockingIssues &&
             functionalCompletenessValidation.isComplete
    }

    // In normal mode, check for critical issues that prevent compilation
    const hasCriticalSyntaxErrors = syntaxValidation.errors.length > 0
    const hasCriticalStructureIssues = syntaxValidation.structureIssues.filter(i => i.severity === 'error').length > 0
    const hasCriticalFunctionIssues = syntaxValidation.functionIssues.length > 0
    const hasCriticalUndefinedIssues = undefinedValueScan.criticalIssues > 0
    const hasCriticalLogicErrors = errorDetection.criticalErrors > 0
    const hasCriticalCompletenessIssues = functionalCompletenessValidation.completenessScore < 60
    
    // Code is invalid if it has critical issues that would prevent compilation or execution
    return !hasCriticalSyntaxErrors && 
           !hasCriticalStructureIssues && 
           !hasCriticalFunctionIssues && 
           !hasCriticalUndefinedIssues &&
           !hasCriticalLogicErrors &&
           !hasCriticalCompletenessIssues
  }

  private calculateCompletenessPercentage(
    functionValidations: FunctionSignatureValidation[],
    structureValidation: ContractStructureValidation,
    eventValidations: EventDefinitionValidation[],
    functionalCompletenessValidation: FunctionalCompletenessResult
  ): number {
    let totalScore = 0
    let maxScore = 0

    // Function completeness (30% weight)
    if (functionValidations.length > 0) {
      const avgFunctionScore = functionValidations.reduce((sum, f) => sum + f.completenessScore, 0) / functionValidations.length
      totalScore += avgFunctionScore * 0.3
    }
    maxScore += 30

    // Structure completeness (30% weight)
    totalScore += structureValidation.structureScore * 0.3
    maxScore += 30

    // Event completeness (15% weight)
    if (eventValidations.length > 0) {
      const avgEventScore = eventValidations.reduce((sum, e) => sum + e.completenessScore, 0) / eventValidations.length
      totalScore += avgEventScore * 0.15
    }
    maxScore += 15

    // Functional completeness (25% weight)
    totalScore += functionalCompletenessValidation.completenessScore * 0.25
    maxScore += 25

    return Math.round((totalScore / maxScore) * 100)
  }

  private createFailureResult(code: string, error: any, startTime: number): ComprehensiveValidationResult {
    return {
      isValid: false,
      overallScore: 0,
      syntaxValidation: {
        isValid: false,
        errors: [{
          type: 'validation-failure',
          location: { line: 1, column: 1 },
          message: `Validation system failure: ${error.message}`,
          suggestion: 'Manual review required'
        }],
        warnings: [],
        structureIssues: [],
        functionIssues: [],
        eventIssues: []
      },
      errorDetection: {
        totalErrors: 1,
        criticalErrors: 1,
        warningErrors: 0,
        infoErrors: 0,
        errors: [],
        classification: {
          structuralErrors: 0,
          functionalErrors: 0,
          syntaxErrors: 1,
          completenessErrors: 0,
          bestPracticeViolations: 0,
          securityIssues: 0
        },
        completenessScore: 0,
        actionableRecommendations: ['Validation system failed - manual review required']
      },
      undefinedValueScan: {
        hasBlockingIssues: true,
        totalIssues: 1,
        criticalIssues: 1,
        warningIssues: 0,
        issues: []
      },
      contractSpecificValidation: {
        contractType: 'generic',
        isValid: false,
        validationResults: [],
        specificIssues: [],
        complianceScore: 0,
        requiredFeatures: [],
        missingFeatures: [],
        recommendations: ['Validation system failed - manual review required']
      },
      functionalCompletenessValidation: {
        isComplete: false,
        completenessScore: 0,
        functionCompleteness: {
          totalFunctions: 0,
          completeFunctions: 0,
          incompleteFunctions: [],
          missingRequiredFunctions: [],
          completenessPercentage: 0
        },
        resourceLifecycleValidation: {
          resources: [],
          lifecycleScore: 0,
          missingLifecycleMethods: [],
          issues: []
        },
        eventEmissionValidation: {
          definedEvents: [],
          emittedEvents: [],
          unusedEvents: [],
          missingEmissions: [],
          emissionCompleteness: 0
        },
        accessControlValidation: {
          functionsWithAccess: 0,
          functionsWithoutAccess: 0,
          resourcesWithAccess: 0,
          resourcesWithoutAccess: 0,
          accessControlScore: 0,
          issues: []
        },
        validationResults: [],
        recommendations: ['Validation system failed - manual review required']
      },
      qualityScore: {
        overall: 0,
        syntax: 0,
        logic: 0,
        completeness: 0,
        bestPractices: 0,
        productionReadiness: 0
      },
      validationResults: [],
      recommendations: ['Validation system failed - manual review required'],
      contractType: 'generic',
      completenessPercentage: 0
    }
  }
}

// Export singleton instance
export const comprehensiveValidationSystem = new ComprehensiveValidationSystem()