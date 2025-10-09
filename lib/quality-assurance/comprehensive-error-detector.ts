/**
 * Comprehensive Error Detection and Classification System
 * 
 * Detects and classifies various types of errors in AI-generated Cadence contracts
 * including incomplete functions, missing contract elements, and structural issues.
 */

import { CodeLocation, ValidationIssue } from './types'
import { QALogger } from './logger'

export interface ErrorDetectionResult {
  totalErrors: number
  criticalErrors: number
  warningErrors: number
  infoErrors: number
  errors: DetectedError[]
  classification: ErrorClassification
  completenessScore: number
  actionableRecommendations: string[]
}

export interface DetectedError {
  id: string
  type: ErrorType
  category: ErrorCategory
  severity: 'critical' | 'warning' | 'info'
  location: CodeLocation
  message: string
  description: string
  suggestedFix: string
  autoFixable: boolean
  confidence: number
  context: ErrorContext
}

export interface ErrorContext {
  contractType?: 'nft' | 'fungible-token' | 'utility' | 'dao' | 'marketplace' | 'generic'
  functionName?: string
  resourceName?: string
  eventName?: string
  surroundingCode: string
  lineContent: string
}

export interface ErrorClassification {
  structuralErrors: number
  functionalErrors: number
  syntaxErrors: number
  completenessErrors: number
  bestPracticeViolations: number
  securityIssues: number
}

export enum ErrorType {
  // Function-related errors
  INCOMPLETE_FUNCTION_IMPLEMENTATION = 'incomplete-function-implementation',
  MISSING_FUNCTION_BODY = 'missing-function-body',
  MISSING_RETURN_STATEMENT = 'missing-return-statement',
  INVALID_FUNCTION_SIGNATURE = 'invalid-function-signature',
  MISSING_REQUIRED_FUNCTION = 'missing-required-function',
  
  // Contract structure errors
  MISSING_INIT_FUNCTION = 'missing-init-function',
  MISSING_CONTRACT_DECLARATION = 'missing-contract-declaration',
  INVALID_CONTRACT_STRUCTURE = 'invalid-contract-structure',
  MISSING_IMPORT_STATEMENTS = 'missing-import-statements',
  
  // Resource and interface errors
  INCOMPLETE_RESOURCE_DEFINITION = 'incomplete-resource-definition',
  MISSING_RESOURCE_INTERFACE = 'missing-resource-interface',
  INVALID_RESOURCE_LIFECYCLE = 'invalid-resource-lifecycle',
  MISSING_RESOURCE_METHODS = 'missing-resource-methods',
  
  // Event-related errors
  MISSING_EVENT_DEFINITIONS = 'missing-event-definitions',
  INVALID_EVENT_PARAMETERS = 'invalid-event-parameters',
  MISSING_EVENT_EMISSION = 'missing-event-emission',
  
  // Access control errors
  MISSING_ACCESS_MODIFIERS = 'missing-access-modifiers',
  INVALID_ACCESS_CONTROL = 'invalid-access-control',
  SECURITY_VULNERABILITY = 'security-vulnerability',
  
  // Type and validation errors
  TYPE_MISMATCH = 'type-mismatch',
  MISSING_TYPE_ANNOTATIONS = 'missing-type-annotations',
  INVALID_TYPE_USAGE = 'invalid-type-usage',
  
  // Completeness errors
  INCOMPLETE_IMPLEMENTATION = 'incomplete-implementation',
  MISSING_ERROR_HANDLING = 'missing-error-handling',
  INCOMPLETE_VALIDATION = 'incomplete-validation',
  
  // Best practice violations
  POOR_NAMING_CONVENTION = 'poor-naming-convention',
  MISSING_DOCUMENTATION = 'missing-documentation',
  INEFFICIENT_IMPLEMENTATION = 'inefficient-implementation'
}

export enum ErrorCategory {
  STRUCTURAL = 'structural',
  FUNCTIONAL = 'functional',
  SYNTAX = 'syntax',
  COMPLETENESS = 'completeness',
  BEST_PRACTICES = 'best-practices',
  SECURITY = 'security'
}

export interface ContractRequirements {
  contractType: 'nft' | 'fungible-token' | 'utility' | 'dao' | 'marketplace' | 'generic'
  requiredFunctions: string[]
  requiredEvents: string[]
  requiredResources: string[]
  requiredInterfaces: string[]
  requiredImports: string[]
}

export class ComprehensiveErrorDetector {
  private logger: QALogger
  private contractRequirements: Map<string, ContractRequirements>

  constructor() {
    this.logger = new QALogger('ComprehensiveErrorDetector')
    this.contractRequirements = this.initializeContractRequirements()
  }

  /**
   * Main error detection method that performs comprehensive analysis
   */
  public async detectErrors(code: string, contractType?: string): Promise<ErrorDetectionResult> {
    this.logger.info('Starting comprehensive error detection')
    const startTime = Date.now()

    try {
      const errors: DetectedError[] = []
      const detectedContractType = contractType || this.inferContractType(code)

      // Detect different categories of errors
      errors.push(...this.detectFunctionErrors(code, detectedContractType))
      errors.push(...this.detectStructuralErrors(code, detectedContractType))
      errors.push(...this.detectResourceErrors(code))
      errors.push(...this.detectEventErrors(code, detectedContractType))
      errors.push(...this.detectAccessControlErrors(code))
      errors.push(...this.detectCompletenessErrors(code, detectedContractType))
      errors.push(...this.detectBestPracticeViolations(code))

      // Classify errors
      const classification = this.classifyErrors(errors)
      
      // Calculate completeness score
      const completenessScore = this.calculateCompletenessScore(errors, detectedContractType)
      
      // Generate actionable recommendations
      const actionableRecommendations = this.generateActionableRecommendations(errors)

      // Count errors by severity
      const criticalErrors = errors.filter(e => e.severity === 'critical').length
      const warningErrors = errors.filter(e => e.severity === 'warning').length
      const infoErrors = errors.filter(e => e.severity === 'info').length

      const result: ErrorDetectionResult = {
        totalErrors: errors.length,
        criticalErrors,
        warningErrors,
        infoErrors,
        errors,
        classification,
        completenessScore,
        actionableRecommendations
      }

      const duration = Date.now() - startTime
      this.logger.info(`Error detection completed in ${duration}ms`, {
        totalErrors: errors.length,
        criticalErrors,
        completenessScore
      })

      return result

    } catch (error) {
      this.logger.error('Error detection failed', error)
      return {
        totalErrors: 0,
        criticalErrors: 0,
        warningErrors: 0,
        infoErrors: 0,
        errors: [],
        classification: {
          structuralErrors: 0,
          functionalErrors: 0,
          syntaxErrors: 0,
          completenessErrors: 0,
          bestPracticeViolations: 0,
          securityIssues: 0
        },
        completenessScore: 0,
        actionableRecommendations: ['Error detection system failed - manual review required']
      }
    }
  }

  /**
   * Detect function-related errors
   */
  private detectFunctionErrors(code: string, contractType: string): DetectedError[] {
    const errors: DetectedError[] = []
    const lines = code.split('\n')

    // Find all function declarations
    const functionPattern = /access\([^)]+\)\s+fun\s+(\w+)\s*\([^)]*\)\s*(?::\s*(\w+))?\s*(\{?)/g
    let match

    while ((match = functionPattern.exec(code)) !== null) {
      const functionName = match[1]
      const returnType = match[2]
      const hasOpenBrace = match[3] === '{'
      const location = this.findLocationInCode(code, match.index)

      // Check for missing function body
      if (!hasOpenBrace) {
        errors.push({
          id: `missing-body-${functionName}`,
          type: ErrorType.MISSING_FUNCTION_BODY,
          category: ErrorCategory.STRUCTURAL,
          severity: 'critical',
          location,
          message: `Function '${functionName}' is missing its implementation body`,
          description: `The function '${functionName}' has been declared but lacks a proper implementation body with opening and closing braces.`,
          suggestedFix: `Add function body: {\n    // TODO: Implement ${functionName}\n    ${returnType ? `return /* ${returnType} value */` : ''}\n}`,
          autoFixable: true,
          confidence: 95,
          context: {
            contractType: contractType as any,
            functionName,
            surroundingCode: this.getSurroundingCode(lines, location.line),
            lineContent: lines[location.line - 1] || ''
          }
        })
      } else {
        // Check for incomplete function implementation
        const functionBody = this.extractFunctionBody(code, match.index)
        if (this.isFunctionIncomplete(functionBody, returnType)) {
          errors.push({
            id: `incomplete-impl-${functionName}`,
            type: ErrorType.INCOMPLETE_FUNCTION_IMPLEMENTATION,
            category: ErrorCategory.FUNCTIONAL,
            severity: 'critical',
            location,
            message: `Function '${functionName}' has incomplete implementation`,
            description: `The function '${functionName}' contains placeholder comments, empty body, or missing return statements.`,
            suggestedFix: this.generateFunctionImplementationSuggestion(functionName, returnType, contractType),
            autoFixable: false,
            confidence: 85,
            context: {
              contractType: contractType as any,
              functionName,
              surroundingCode: this.getSurroundingCode(lines, location.line),
              lineContent: lines[location.line - 1] || ''
            }
          })
        }
      }
    }

    // Check for missing required functions based on contract type
    const requirements = this.contractRequirements.get(contractType)
    if (requirements) {
      for (const requiredFunction of requirements.requiredFunctions) {
        if (!this.hasFunctionImplementation(code, requiredFunction)) {
          errors.push({
            id: `missing-required-${requiredFunction}`,
            type: ErrorType.MISSING_REQUIRED_FUNCTION,
            category: ErrorCategory.COMPLETENESS,
            severity: 'critical',
            location: { line: 1, column: 1 },
            message: `Missing required function '${requiredFunction}' for ${contractType} contract`,
            description: `${contractType} contracts must implement the '${requiredFunction}' function to meet interface requirements.`,
            suggestedFix: this.generateRequiredFunctionSuggestion(requiredFunction, contractType),
            autoFixable: true,
            confidence: 90,
            context: {
              contractType: contractType as any,
              functionName: requiredFunction,
              surroundingCode: '',
              lineContent: ''
            }
          })
        }
      }
    }

    return errors
  }

  /**
   * Detect structural errors in contract
   */
  private detectStructuralErrors(code: string, contractType: string): DetectedError[] {
    const errors: DetectedError[] = []

    // Check for missing contract declaration
    if (!code.includes('access(all) contract')) {
      errors.push({
        id: 'missing-contract-declaration',
        type: ErrorType.MISSING_CONTRACT_DECLARATION,
        category: ErrorCategory.STRUCTURAL,
        severity: 'critical',
        location: { line: 1, column: 1 },
        message: 'Contract declaration is missing',
        description: 'Every Cadence contract must start with a proper contract declaration.',
        suggestedFix: 'Add contract declaration: access(all) contract YourContractName {\n    // Contract implementation\n}',
        autoFixable: true,
        confidence: 100,
        context: {
          contractType: contractType as any,
          surroundingCode: code.substring(0, 200),
          lineContent: ''
        }
      })
    }

    // Check for missing init function
    if (!this.hasInitFunction(code)) {
      errors.push({
        id: 'missing-init-function',
        type: ErrorType.MISSING_INIT_FUNCTION,
        category: ErrorCategory.STRUCTURAL,
        severity: 'critical',
        location: { line: 1, column: 1 },
        message: 'Contract is missing init() function',
        description: 'Cadence contracts must have an init() function for proper initialization.',
        suggestedFix: 'Add init function: init() {\n    // Initialize contract state\n}',
        autoFixable: true,
        confidence: 95,
        context: {
          contractType: contractType as any,
          surroundingCode: '',
          lineContent: ''
        }
      })
    }

    // Check for missing required imports
    const requirements = this.contractRequirements.get(contractType)
    if (requirements) {
      for (const requiredImport of requirements.requiredImports) {
        if (!code.includes(`import ${requiredImport}`)) {
          errors.push({
            id: `missing-import-${requiredImport}`,
            type: ErrorType.MISSING_IMPORT_STATEMENTS,
            category: ErrorCategory.STRUCTURAL,
            severity: 'warning',
            location: { line: 1, column: 1 },
            message: `Missing required import '${requiredImport}'`,
            description: `${contractType} contracts typically require importing '${requiredImport}' for proper functionality.`,
            suggestedFix: `Add import statement: import ${requiredImport} from 0x...`,
            autoFixable: false,
            confidence: 80,
            context: {
              contractType: contractType as any,
              surroundingCode: '',
              lineContent: ''
            }
          })
        }
      }
    }

    return errors
  }

  /**
   * Detect resource-related errors
   */
  private detectResourceErrors(code: string): DetectedError[] {
    const errors: DetectedError[] = []
    const lines = code.split('\n')

    // Find resource declarations
    const resourcePattern = /access\([^)]+\)\s+resource\s+(\w+)\s*(\{?)/g
    let match

    while ((match = resourcePattern.exec(code)) !== null) {
      const resourceName = match[1]
      const hasOpenBrace = match[2] === '{'
      const location = this.findLocationInCode(code, match.index)

      if (!hasOpenBrace) {
        errors.push({
          id: `incomplete-resource-${resourceName}`,
          type: ErrorType.INCOMPLETE_RESOURCE_DEFINITION,
          category: ErrorCategory.STRUCTURAL,
          severity: 'critical',
          location,
          message: `Resource '${resourceName}' definition is incomplete`,
          description: `The resource '${resourceName}' is declared but missing its implementation body.`,
          suggestedFix: `Complete resource definition: {\n    // Resource properties and methods\n}`,
          autoFixable: true,
          confidence: 90,
          context: {
            resourceName,
            surroundingCode: this.getSurroundingCode(lines, location.line),
            lineContent: lines[location.line - 1] || ''
          }
        })
      } else {
        // Check for missing destroy method
        const resourceBody = this.extractResourceBody(code, match.index)
        if (!resourceBody.includes('destroy()')) {
          errors.push({
            id: `missing-destroy-${resourceName}`,
            type: ErrorType.MISSING_RESOURCE_METHODS,
            category: ErrorCategory.FUNCTIONAL,
            severity: 'warning',
            location,
            message: `Resource '${resourceName}' is missing destroy() method`,
            description: `Resources should implement a destroy() method for proper lifecycle management.`,
            suggestedFix: `Add destroy method: destroy() {\n    // Cleanup resource\n}`,
            autoFixable: true,
            confidence: 85,
            context: {
              resourceName,
              surroundingCode: this.getSurroundingCode(lines, location.line),
              lineContent: lines[location.line - 1] || ''
            }
          })
        }
      }
    }

    return errors
  }

  /**
   * Detect event-related errors
   */
  private detectEventErrors(code: string, contractType: string): DetectedError[] {
    const errors: DetectedError[] = []

    // Check for missing required events
    const requirements = this.contractRequirements.get(contractType)
    if (requirements) {
      for (const requiredEvent of requirements.requiredEvents) {
        if (!code.includes(`access(all) event ${requiredEvent}`)) {
          errors.push({
            id: `missing-event-${requiredEvent}`,
            type: ErrorType.MISSING_EVENT_DEFINITIONS,
            category: ErrorCategory.COMPLETENESS,
            severity: 'warning',
            location: { line: 1, column: 1 },
            message: `Missing required event '${requiredEvent}'`,
            description: `${contractType} contracts should define the '${requiredEvent}' event for proper monitoring.`,
            suggestedFix: this.generateEventDefinitionSuggestion(requiredEvent, contractType),
            autoFixable: true,
            confidence: 85,
            context: {
              contractType: contractType as any,
              eventName: requiredEvent,
              surroundingCode: '',
              lineContent: ''
            }
          })
        }
      }
    }

    // Check for events without proper emission
    const eventPattern = /access\(all\)\s+event\s+(\w+)\s*\([^)]*\)/g
    let match

    while ((match = eventPattern.exec(code)) !== null) {
      const eventName = match[1]
      
      // Check if event is emitted anywhere in the code
      if (!code.includes(`emit ${eventName}`)) {
        const location = this.findLocationInCode(code, match.index)
        errors.push({
          id: `unused-event-${eventName}`,
          type: ErrorType.MISSING_EVENT_EMISSION,
          category: ErrorCategory.BEST_PRACTICES,
          severity: 'info',
          location,
          message: `Event '${eventName}' is defined but never emitted`,
          description: `The event '${eventName}' is declared but not used anywhere in the contract.`,
          suggestedFix: `Add event emission: emit ${eventName}(/* parameters */)`,
          autoFixable: false,
          confidence: 75,
          context: {
            eventName,
            surroundingCode: '',
            lineContent: ''
          }
        })
      }
    }

    return errors
  }

  /**
   * Detect access control errors
   */
  private detectAccessControlErrors(code: string): DetectedError[] {
    const errors: DetectedError[] = []
    const lines = code.split('\n')

    // Check for functions without access modifiers
    const functionWithoutAccessPattern = /^\s*fun\s+(\w+)/gm
    let match

    while ((match = functionWithoutAccessPattern.exec(code)) !== null) {
      const functionName = match[1]
      const location = this.findLocationInCode(code, match.index)

      errors.push({
        id: `missing-access-${functionName}`,
        type: ErrorType.MISSING_ACCESS_MODIFIERS,
        category: ErrorCategory.SECURITY,
        severity: 'warning',
        location,
        message: `Function '${functionName}' is missing access modifier`,
        description: `All functions should have explicit access modifiers (access(all), access(account), etc.).`,
        suggestedFix: `Add access modifier: access(all) fun ${functionName}`,
        autoFixable: true,
        confidence: 90,
        context: {
          functionName,
          surroundingCode: this.getSurroundingCode(lines, location.line),
          lineContent: lines[location.line - 1] || ''
        }
      })
    }

    return errors
  }

  /**
   * Detect completeness errors
   */
  private detectCompletenessErrors(code: string, contractType: string): DetectedError[] {
    const errors: DetectedError[] = []

    // Check for TODO comments indicating incomplete implementation
    const todoPattern = /\/\/\s*TODO|\/\*\s*TODO/gi
    let match

    while ((match = todoPattern.exec(code)) !== null) {
      const location = this.findLocationInCode(code, match.index)
      errors.push({
        id: `todo-${location.line}-${location.column}`,
        type: ErrorType.INCOMPLETE_IMPLEMENTATION,
        category: ErrorCategory.COMPLETENESS,
        severity: 'warning',
        location,
        message: 'Incomplete implementation detected (TODO comment)',
        description: 'Code contains TODO comments indicating unfinished implementation.',
        suggestedFix: 'Complete the implementation and remove TODO comments',
        autoFixable: false,
        confidence: 100,
        context: {
          surroundingCode: '',
          lineContent: ''
        }
      })
    }

    // Check for empty function bodies
    const emptyFunctionPattern = /access\([^)]+\)\s+fun\s+(\w+)[^{]*\{\s*\}/g
    while ((match = emptyFunctionPattern.exec(code)) !== null) {
      const functionName = match[1]
      const location = this.findLocationInCode(code, match.index)

      errors.push({
        id: `empty-function-${functionName}`,
        type: ErrorType.INCOMPLETE_IMPLEMENTATION,
        category: ErrorCategory.COMPLETENESS,
        severity: 'critical',
        location,
        message: `Function '${functionName}' has empty implementation`,
        description: `The function '${functionName}' is declared but has no implementation.`,
        suggestedFix: this.generateFunctionImplementationSuggestion(functionName, undefined, contractType),
        autoFixable: false,
        confidence: 95,
        context: {
          functionName,
          surroundingCode: '',
          lineContent: ''
        }
      })
    }

    return errors
  }

  /**
   * Detect best practice violations
   */
  private detectBestPracticeViolations(code: string): DetectedError[] {
    const errors: DetectedError[] = []

    // Check for poor naming conventions
    const poorNamingPattern = /\b[a-z][a-z0-9_]*[A-Z]/g
    let match

    while ((match = poorNamingPattern.exec(code)) !== null) {
      const location = this.findLocationInCode(code, match.index)
      errors.push({
        id: `poor-naming-${match[0]}`,
        type: ErrorType.POOR_NAMING_CONVENTION,
        category: ErrorCategory.BEST_PRACTICES,
        severity: 'info',
        location,
        message: `Poor naming convention: '${match[0]}'`,
        description: 'Variable and function names should follow consistent camelCase or snake_case conventions.',
        suggestedFix: 'Use consistent naming conventions (camelCase recommended)',
        autoFixable: false,
        confidence: 70,
        context: {
          surroundingCode: '',
          lineContent: ''
        }
      })
    }

    return errors
  }

  // Helper methods

  private initializeContractRequirements(): Map<string, ContractRequirements> {
    const requirements = new Map<string, ContractRequirements>()

    requirements.set('nft', {
      contractType: 'nft',
      requiredFunctions: ['createNFT', 'mintNFT', 'getMetadata'],
      requiredEvents: ['Minted', 'Withdraw', 'Deposit'],
      requiredResources: ['NFT', 'Collection'],
      requiredInterfaces: ['NonFungibleToken', 'MetadataViews'],
      requiredImports: ['NonFungibleToken', 'MetadataViews']
    })

    requirements.set('fungible-token', {
      contractType: 'fungible-token',
      requiredFunctions: ['createVault', 'mintTokens', 'getBalance'],
      requiredEvents: ['TokensMinted', 'TokensWithdrawn', 'TokensDeposited'],
      requiredResources: ['Vault', 'Minter'],
      requiredInterfaces: ['FungibleToken'],
      requiredImports: ['FungibleToken']
    })

    requirements.set('dao', {
      contractType: 'dao',
      requiredFunctions: ['createProposal', 'vote', 'executeProposal'],
      requiredEvents: ['ProposalCreated', 'VoteCast', 'ProposalExecuted'],
      requiredResources: ['Proposal', 'VotingToken'],
      requiredInterfaces: [],
      requiredImports: []
    })

    requirements.set('marketplace', {
      contractType: 'marketplace',
      requiredFunctions: ['listItem', 'purchase', 'cancelListing'],
      requiredEvents: ['ItemListed', 'ItemPurchased', 'ListingCanceled'],
      requiredResources: ['Listing', 'Storefront'],
      requiredInterfaces: [],
      requiredImports: ['NonFungibleToken', 'FungibleToken']
    })

    return requirements
  }

  private inferContractType(code: string): string {
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

  private getSurroundingCode(lines: string[], lineNumber: number, context: number = 2): string {
    const start = Math.max(0, lineNumber - context - 1)
    const end = Math.min(lines.length, lineNumber + context)
    return lines.slice(start, end).join('\n')
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

  private extractResourceBody(code: string, startIndex: number): string {
    // Similar to extractFunctionBody but for resources
    return this.extractFunctionBody(code, startIndex)
  }

  private isFunctionIncomplete(functionBody: string, returnType?: string): boolean {
    // Check for TODO comments
    if (functionBody.includes('TODO') || functionBody.includes('todo')) return true
    
    // Check for empty body (only whitespace and braces)
    const bodyContent = functionBody.replace(/[{}\s]/g, '')
    if (bodyContent.length === 0) return true
    
    // Check for missing return statement when return type is specified
    if (returnType && returnType !== 'Void') {
      // Look for actual return statements, not just the word "return" in comments
      const hasReturnStatement = /^\s*return\s+/m.test(functionBody)
      if (!hasReturnStatement) {
        return true // If function has return type but no return statement, it's incomplete
      }
    }
    
    return false
  }

  private hasFunctionImplementation(code: string, functionName: string): boolean {
    const pattern = new RegExp(`access\\([^)]+\\)\\s+fun\\s+${functionName}\\s*\\([^)]*\\)`, 'g')
    return pattern.test(code)
  }

  private hasInitFunction(code: string): boolean {
    return /init\s*\(\s*\)\s*\{/.test(code)
  }

  private classifyErrors(errors: DetectedError[]): ErrorClassification {
    const classification: ErrorClassification = {
      structuralErrors: 0,
      functionalErrors: 0,
      syntaxErrors: 0,
      completenessErrors: 0,
      bestPracticeViolations: 0,
      securityIssues: 0
    }

    for (const error of errors) {
      switch (error.category) {
        case ErrorCategory.STRUCTURAL:
          classification.structuralErrors++
          break
        case ErrorCategory.FUNCTIONAL:
          classification.functionalErrors++
          break
        case ErrorCategory.SYNTAX:
          classification.syntaxErrors++
          break
        case ErrorCategory.COMPLETENESS:
          classification.completenessErrors++
          break
        case ErrorCategory.BEST_PRACTICES:
          classification.bestPracticeViolations++
          break
        case ErrorCategory.SECURITY:
          classification.securityIssues++
          break
      }
    }

    return classification
  }

  private calculateCompletenessScore(errors: DetectedError[], contractType: string): number {
    const requirements = this.contractRequirements.get(contractType)
    
    const criticalErrors = errors.filter(e => e.severity === 'critical').length
    const warningErrors = errors.filter(e => e.severity === 'warning').length
    const structuralErrors = errors.filter(e => e.category === ErrorCategory.STRUCTURAL).length
    const completenessErrors = errors.filter(e => e.category === ErrorCategory.COMPLETENESS).length

    // Start with perfect score and deduct points for errors
    let score = 100

    // Heavy penalty for critical errors
    score -= criticalErrors * 25

    // Moderate penalty for warning errors
    score -= warningErrors * 10

    // Additional penalty for structural issues
    score -= structuralErrors * 15

    // Additional penalty for completeness issues
    score -= completenessErrors * 12

    // If there are contract-specific requirements, check compliance
    if (requirements) {
      const missingRequiredFunctions = errors.filter(e => 
        e.type === ErrorType.MISSING_REQUIRED_FUNCTION
      ).length
      const missingRequiredEvents = errors.filter(e => 
        e.type === ErrorType.MISSING_EVENT_DEFINITIONS
      ).length
      
      // Heavy penalty for missing required elements
      score -= (missingRequiredFunctions + missingRequiredEvents) * 20
    }

    return Math.max(0, Math.round(score))
  }

  private generateActionableRecommendations(errors: DetectedError[]): string[] {
    const recommendations: string[] = []
    const errorsByType = new Map<ErrorType, DetectedError[]>()

    // Group errors by type
    for (const error of errors) {
      if (!errorsByType.has(error.type)) {
        errorsByType.set(error.type, [])
      }
      errorsByType.get(error.type)!.push(error)
    }

    // Generate recommendations based on error patterns
    if (errorsByType.has(ErrorType.MISSING_FUNCTION_BODY)) {
      recommendations.push('Complete all function implementations by adding proper function bodies')
    }

    if (errorsByType.has(ErrorType.MISSING_INIT_FUNCTION)) {
      recommendations.push('Add an init() function to properly initialize the contract')
    }

    if (errorsByType.has(ErrorType.MISSING_REQUIRED_FUNCTION)) {
      recommendations.push('Implement all required functions for the contract type')
    }

    if (errorsByType.has(ErrorType.INCOMPLETE_IMPLEMENTATION)) {
      recommendations.push('Remove TODO comments and complete all implementations')
    }

    if (errorsByType.has(ErrorType.MISSING_ACCESS_MODIFIERS)) {
      recommendations.push('Add explicit access modifiers to all functions and resources')
    }

    if (recommendations.length === 0) {
      recommendations.push('Code quality looks good - consider reviewing best practices')
    }

    return recommendations
  }

  private generateFunctionImplementationSuggestion(functionName: string, returnType?: string, contractType?: string): string {
    const suggestions = {
      'createNFT': 'return <- create NFT(id: id, metadata: metadata)',
      'mintNFT': 'let nft <- create NFT(id: self.nextID, metadata: metadata)\nself.nextID = self.nextID + 1\nreturn <- nft',
      'getMetadata': 'return self.metadata',
      'createVault': 'return <- create Vault(balance: 0.0)',
      'mintTokens': 'self.totalSupply = self.totalSupply + amount\nreturn <- create Vault(balance: amount)',
      'getBalance': 'return self.balance'
    }

    const suggestion = suggestions[functionName as keyof typeof suggestions]
    if (suggestion) {
      return `Implement function:\n{\n    ${suggestion}\n}`
    }

    if (returnType) {
      const defaultReturns = {
        'String': 'return ""',
        'Int': 'return 0',
        'UInt64': 'return 0',
        'Bool': 'return false',
        'Address': 'return self.account.address'
      }
      const defaultReturn = defaultReturns[returnType as keyof typeof defaultReturns] || 'return nil'
      return `Implement function:\n{\n    // TODO: Add implementation\n    ${defaultReturn}\n}`
    }

    return `Implement function:\n{\n    // TODO: Add implementation\n}`
  }

  private generateRequiredFunctionSuggestion(functionName: string, contractType: string): string {
    return this.generateFunctionImplementationSuggestion(functionName, undefined, contractType)
  }

  private generateEventDefinitionSuggestion(eventName: string, contractType: string): string {
    const eventSuggestions = {
      'Minted': 'access(all) event Minted(id: UInt64, to: Address?)',
      'Withdraw': 'access(all) event Withdraw(id: UInt64, from: Address?)',
      'Deposit': 'access(all) event Deposit(id: UInt64, to: Address?)',
      'TokensMinted': 'access(all) event TokensMinted(amount: UFix64)',
      'TokensWithdrawn': 'access(all) event TokensWithdrawn(amount: UFix64)',
      'TokensDeposited': 'access(all) event TokensDeposited(amount: UFix64)',
      'ProposalCreated': 'access(all) event ProposalCreated(id: UInt64, proposer: Address)',
      'VoteCast': 'access(all) event VoteCast(proposalId: UInt64, voter: Address, vote: Bool)',
      'ProposalExecuted': 'access(all) event ProposalExecuted(id: UInt64)'
    }

    return eventSuggestions[eventName as keyof typeof eventSuggestions] || 
           `access(all) event ${eventName}(/* add appropriate parameters */)`
  }
}