/**
 * Functional Completeness Validator
 * 
 * Validates that contracts have complete function implementations,
 * proper resource lifecycle management, complete event emission patterns,
 * and proper access control completeness.
 */

import { ValidationResult, ValidationIssue, CodeLocation, ContractType } from './types'
import { QALogger, getLogger } from './logger'

export interface FunctionalCompletenessResult {
  isComplete: boolean
  completenessScore: number
  functionCompleteness: FunctionCompletenessValidation
  resourceLifecycleValidation: ResourceLifecycleValidation
  eventEmissionValidation: EventEmissionValidation
  accessControlValidation: AccessControlValidation
  validationResults: ValidationResult[]
  recommendations: string[]
}

export interface FunctionCompletenessValidation {
  totalFunctions: number
  completeFunctions: number
  incompleteFunctions: FunctionIssue[]
  missingRequiredFunctions: string[]
  completenessPercentage: number
}

export interface ResourceLifecycleValidation {
  resources: ResourceValidation[]
  lifecycleScore: number
  missingLifecycleMethods: string[]
  issues: ValidationIssue[]
}

export interface EventEmissionValidation {
  definedEvents: EventDefinition[]
  emittedEvents: string[]
  unusedEvents: string[]
  missingEmissions: string[]
  emissionCompleteness: number
}

export interface AccessControlValidation {
  functionsWithAccess: number
  functionsWithoutAccess: number
  resourcesWithAccess: number
  resourcesWithoutAccess: number
  accessControlScore: number
  issues: ValidationIssue[]
}

export interface FunctionIssue {
  functionName: string
  issues: string[]
  severity: 'critical' | 'warning' | 'info'
  location: CodeLocation
  suggestedFix: string
}

export interface ResourceValidation {
  resourceName: string
  hasInit: boolean
  hasDestroy: boolean
  hasProperAccess: boolean
  lifecycleComplete: boolean
  issues: ValidationIssue[]
}

export interface EventDefinition {
  name: string
  parameters: string[]
  location: CodeLocation
  isEmitted: boolean
}

export interface RequiredFunction {
  name: string
  pattern: RegExp
  contractTypes: string[]
  description: string
  required: boolean
}

export class FunctionalCompletenessValidator {
  private logger: QALogger
  private requiredFunctions: RequiredFunction[]

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

    this.requiredFunctions = this.initializeRequiredFunctions()
  }

  /**
   * Validate functional completeness of a contract
   */
  async validateFunctionalCompleteness(
    code: string, 
    contractType: ContractType
  ): Promise<FunctionalCompletenessResult> {
    this.logger.info('Starting functional completeness validation', { 
      contractType: contractType.category 
    })

    try {
      // Step 1: Validate function implementations
      const functionCompleteness = this.validateFunctionCompleteness(code, contractType)
      
      // Step 2: Validate resource lifecycle management
      const resourceLifecycleValidation = this.validateResourceLifecycle(code)
      
      // Step 3: Validate event emission patterns
      const eventEmissionValidation = this.validateEventEmissionPatterns(code)
      
      // Step 4: Validate access control completeness
      const accessControlValidation = this.validateAccessControlCompleteness(code)
      
      // Step 5: Calculate overall completeness score
      const completenessScore = this.calculateOverallCompletenessScore(
        functionCompleteness,
        resourceLifecycleValidation,
        eventEmissionValidation,
        accessControlValidation
      )
      
      // Step 6: Generate validation results
      const validationResults = this.generateValidationResults(
        functionCompleteness,
        resourceLifecycleValidation,
        eventEmissionValidation,
        accessControlValidation
      )
      
      // Step 7: Generate recommendations
      const recommendations = this.generateRecommendations(
        functionCompleteness,
        resourceLifecycleValidation,
        eventEmissionValidation,
        accessControlValidation
      )

      const result: FunctionalCompletenessResult = {
        isComplete: completenessScore >= 80, // 80% threshold for completeness
        completenessScore,
        functionCompleteness,
        resourceLifecycleValidation,
        eventEmissionValidation,
        accessControlValidation,
        validationResults,
        recommendations
      }

      this.logger.info('Functional completeness validation completed', {
        isComplete: result.isComplete,
        completenessScore,
        totalIssues: validationResults.reduce((sum, vr) => sum + vr.issues.length, 0)
      })

      return result

    } catch (error) {
      this.logger.error('Functional completeness validation failed', { error: error.message })
      throw error
    }
  }  /**
  
 * Validate that required functions are implemented and complete
   */
  private validateFunctionCompleteness(
    code: string, 
    contractType: ContractType
  ): FunctionCompletenessValidation {
    const functions = this.extractFunctions(code)
    const incompleteFunctions: FunctionIssue[] = []
    const missingRequiredFunctions: string[] = []
    
    // Check each function for completeness
    functions.forEach(func => {
      const issues: string[] = []
      
      // Check if function has implementation
      if (!func.hasBody) {
        issues.push('Function has no implementation body')
      }
      
      // Check if function body is empty
      if (func.hasBody && func.bodyContent.trim().length <= 2) {
        issues.push('Function body is empty')
      }
      
      // Check for return statement if function has return type
      if (func.returnType && func.returnType !== 'Void' && !func.hasReturnStatement) {
        issues.push(`Function declares return type '${func.returnType}' but has no return statement`)
      }
      
      // Check for proper error handling in critical functions
      if (this.isCriticalFunction(func.name) && !func.hasErrorHandling) {
        issues.push('Critical function should include error handling (pre/post conditions)')
      }
      
      // Check for access modifiers
      if (!func.accessModifier) {
        issues.push('Function is missing access modifier')
      }
      
      if (issues.length > 0) {
        incompleteFunctions.push({
          functionName: func.name,
          issues,
          severity: this.determineFunctionIssueSeverity(issues),
          location: func.location,
          suggestedFix: this.generateFunctionFix(func.name, issues)
        })
      }
    })
    
    // Check for missing required functions based on contract type
    const requiredForType = this.requiredFunctions.filter(rf => 
      rf.contractTypes.includes(contractType.category) || rf.contractTypes.includes('all')
    )
    
    requiredForType.forEach(required => {
      if (!required.pattern.test(code)) {
        missingRequiredFunctions.push(required.name)
      }
    })
    
    const completeFunctions = functions.length - incompleteFunctions.length
    const completenessPercentage = functions.length > 0 ? 
      Math.round((completeFunctions / functions.length) * 100) : 0

    return {
      totalFunctions: functions.length,
      completeFunctions,
      incompleteFunctions,
      missingRequiredFunctions,
      completenessPercentage
    }
  }

  /**
   * Validate proper resource lifecycle management
   */
  private validateResourceLifecycle(code: string): ResourceLifecycleValidation {
    const resources = this.extractResources(code)
    const resourceValidations: ResourceValidation[] = []
    const missingLifecycleMethods: string[] = []
    const issues: ValidationIssue[] = []
    
    resources.forEach(resource => {
      const validation: ResourceValidation = {
        resourceName: resource.name,
        hasInit: resource.hasInit,
        hasDestroy: resource.hasDestroy,
        hasProperAccess: resource.hasAccessModifier,
        lifecycleComplete: resource.hasInit && resource.hasDestroy && resource.hasAccessModifier,
        issues: []
      }
      
      // Check for init function
      if (!resource.hasInit && this.requiresInit(resource.name)) {
        validation.issues.push({
          severity: 'critical',
          type: 'missing-resource-init',
          location: resource.location,
          message: `Resource '${resource.name}' is missing init() function`,
          suggestedFix: 'Add init() function to resource',
          autoFixable: false
        })
        missingLifecycleMethods.push(`${resource.name}.init()`)
      }
      
      // Check for destroy function
      if (!resource.hasDestroy) {
        validation.issues.push({
          severity: 'warning',
          type: 'missing-resource-destroy',
          location: resource.location,
          message: `Resource '${resource.name}' should implement destroy() function`,
          suggestedFix: 'Add destroy() function to resource for proper cleanup',
          autoFixable: false
        })
        missingLifecycleMethods.push(`${resource.name}.destroy()`)
      }
      
      // Check for proper access control
      if (!resource.hasAccessModifier) {
        validation.issues.push({
          severity: 'critical',
          type: 'missing-resource-access',
          location: resource.location,
          message: `Resource '${resource.name}' is missing access modifier`,
          suggestedFix: 'Add access(all) or appropriate access modifier',
          autoFixable: true
        })
      }
      
      issues.push(...validation.issues)
      resourceValidations.push(validation)
    })
    
    const completeResources = resourceValidations.filter(r => r.lifecycleComplete).length
    const lifecycleScore = resources.length > 0 ? 
      Math.round((completeResources / resources.length) * 100) : 100

    return {
      resources: resourceValidations,
      lifecycleScore,
      missingLifecycleMethods,
      issues
    }
  }  /**
   * 
Validate complete event emission patterns
   */
  private validateEventEmissionPatterns(code: string): EventEmissionValidation {
    const definedEvents = this.extractEventDefinitions(code)
    const emittedEvents = this.extractEventEmissions(code)
    const unusedEvents: string[] = []
    const missingEmissions: string[] = []
    
    // Check which defined events are actually emitted
    definedEvents.forEach(event => {
      event.isEmitted = emittedEvents.includes(event.name)
      if (!event.isEmitted) {
        unusedEvents.push(event.name)
      }
    })
    
    // Check for common events that should be emitted but aren't defined
    const expectedEvents = this.getExpectedEvents(code)
    expectedEvents.forEach(expectedEvent => {
      if (!definedEvents.some(e => e.name === expectedEvent) && 
          !emittedEvents.includes(expectedEvent)) {
        missingEmissions.push(expectedEvent)
      }
    })
    
    const emittedDefinedEvents = definedEvents.filter(e => e.isEmitted).length
    const emissionCompleteness = definedEvents.length > 0 ? 
      Math.round((emittedDefinedEvents / definedEvents.length) * 100) : 100

    return {
      definedEvents,
      emittedEvents,
      unusedEvents,
      missingEmissions,
      emissionCompleteness
    }
  }

  /**
   * Validate access control completeness
   */
  private validateAccessControlCompleteness(code: string): AccessControlValidation {
    const functions = this.extractFunctions(code)
    const resources = this.extractResources(code)
    const issues: ValidationIssue[] = []
    
    const functionsWithAccess = functions.filter(f => f.accessModifier).length
    const functionsWithoutAccess = functions.length - functionsWithAccess
    
    const resourcesWithAccess = resources.filter(r => r.hasAccessModifier).length
    const resourcesWithoutAccess = resources.length - resourcesWithAccess
    
    // Add issues for missing access modifiers
    functions.forEach(func => {
      if (!func.accessModifier) {
        issues.push({
          severity: 'warning',
          type: 'missing-function-access-modifier',
          location: func.location,
          message: `Function '${func.name}' is missing access modifier`,
          suggestedFix: 'Add appropriate access modifier (access(all), access(contract), etc.)',
          autoFixable: true
        })
      }
    })
    
    resources.forEach(resource => {
      if (!resource.hasAccessModifier) {
        issues.push({
          severity: 'critical',
          type: 'missing-resource-access-modifier',
          location: resource.location,
          message: `Resource '${resource.name}' is missing access modifier`,
          suggestedFix: 'Add access(all) or appropriate access modifier',
          autoFixable: true
        })
      }
    })
    
    const totalElements = functions.length + resources.length
    const elementsWithAccess = functionsWithAccess + resourcesWithAccess
    const accessControlScore = totalElements > 0 ? 
      Math.round((elementsWithAccess / totalElements) * 100) : 100

    return {
      functionsWithAccess,
      functionsWithoutAccess,
      resourcesWithAccess,
      resourcesWithoutAccess,
      accessControlScore,
      issues
    }
  }

  /**
   * Calculate overall completeness score
   */
  private calculateOverallCompletenessScore(
    functionCompleteness: FunctionCompletenessValidation,
    resourceLifecycle: ResourceLifecycleValidation,
    eventEmission: EventEmissionValidation,
    accessControl: AccessControlValidation
  ): number {
    // If no functions or resources exist, score should be very low
    if (functionCompleteness.totalFunctions === 0 && resourceLifecycle.resources.length === 0) {
      return 0
    }
    
    // Weighted scoring: functions 40%, resources 30%, events 15%, access 15%
    const functionScore = functionCompleteness.completenessPercentage * 0.4
    const resourceScore = resourceLifecycle.lifecycleScore * 0.3
    const eventScore = eventEmission.emissionCompleteness * 0.15
    const accessScore = accessControl.accessControlScore * 0.15
    
    return Math.round(functionScore + resourceScore + eventScore + accessScore)
  }

  // Helper methods for parsing and analysis

  private extractFunctions(code: string): ParsedFunction[] {
    const functions: ParsedFunction[] = []
    
    // More comprehensive function pattern that handles multiline functions
    const functionPattern = /(access\([^)]+\)\s+)?fun\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+?))?\s*(\{|$)/g
    let match

    while ((match = functionPattern.exec(code)) !== null) {
      const accessModifier = match[1]?.trim() || null
      const name = match[2]
      const parameters = match[3]
      const returnType = match[4]?.trim()
      const hasOpenBrace = match[5] === '{'
      
      const location = this.findLocationInCode(code, match.index)
      
      // Extract function body if it has opening brace
      let bodyContent = ''
      let hasBody = false
      
      if (hasOpenBrace) {
        bodyContent = this.extractFunctionBody(code, match.index)
        hasBody = bodyContent.trim().length > 2 // More than just braces
      }
      
      functions.push({
        name,
        accessModifier,
        parameters,
        returnType,
        hasBody,
        bodyContent,
        hasReturnStatement: bodyContent ? /return\s+/.test(bodyContent) : false,
        hasErrorHandling: bodyContent ? /pre\s*\{|post\s*\{/.test(bodyContent) : false,
        location
      })
    }

    return functions
  }

  private extractFunctionBody(code: string, startIndex: number): string {
    let braceCount = 0
    let inFunction = false
    let functionBody = ''
    let i = startIndex

    // Find the opening brace
    while (i < code.length && code[i] !== '{') {
      i++
    }

    if (i >= code.length) return ''

    // Extract the function body
    for (; i < code.length; i++) {
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

  private extractResources(code: string): ParsedResource[] {
    const resources: ParsedResource[] = []
    const resourcePattern = /(access\([^)]+\)\s+)?resource\s+(\w+)\s*[:{]/g
    let match

    while ((match = resourcePattern.exec(code)) !== null) {
      const accessModifier = match[1]?.trim()
      const name = match[2]
      const location = this.findLocationInCode(code, match.index)
      
      // Extract resource body to check for init and destroy
      const resourceBody = this.extractResourceBody(code, match.index)
      
      resources.push({
        name,
        hasAccessModifier: !!accessModifier,
        hasInit: /init\s*\(/.test(resourceBody),
        hasDestroy: /destroy\s*\(/.test(resourceBody),
        location
      })
    }

    return resources
  }

  private extractEventDefinitions(code: string): EventDefinition[] {
    const events: EventDefinition[] = []
    const eventPattern = /(access\([^)]+\)\s+)?event\s+(\w+)\s*\(([^)]*)\)/g
    let match

    while ((match = eventPattern.exec(code)) !== null) {
      const name = match[2]
      const parametersStr = match[3]
      const parameters = parametersStr ? parametersStr.split(',').map(p => p.trim()) : []
      const location = this.findLocationInCode(code, match.index)
      
      events.push({
        name,
        parameters,
        location,
        isEmitted: false // Will be set later
      })
    }

    return events
  }

  private extractEventEmissions(code: string): string[] {
    const emissions: string[] = []
    const emitPattern = /emit\s+(\w+)\s*\(/g
    let match

    while ((match = emitPattern.exec(code)) !== null) {
      emissions.push(match[1])
    }

    return [...new Set(emissions)] // Remove duplicates
  }

  private extractResourceBody(code: string, startIndex: number): string {
    let braceCount = 0
    let inResource = false
    let resourceBody = ''

    for (let i = startIndex; i < code.length; i++) {
      const char = code[i]
      
      if (char === '{') {
        braceCount++
        inResource = true
        resourceBody += char
      } else if (char === '}') {
        braceCount--
        resourceBody += char
        if (inResource && braceCount === 0) {
          break
        }
      } else if (inResource) {
        resourceBody += char
      }
    }

    return resourceBody
  }

  private findLocationInCode(code: string, index: number): CodeLocation {
    const beforeMatch = code.substring(0, index)
    const lines = beforeMatch.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length

    return { line, column }
  }

  private isCriticalFunction(functionName: string): boolean {
    const criticalFunctions = [
      'withdraw', 'deposit', 'mint', 'burn', 'transfer', 
      'vote', 'execute', 'purchase', 'createListing'
    ]
    return criticalFunctions.some(cf => functionName.toLowerCase().includes(cf.toLowerCase()))
  }

  private requiresInit(resourceName: string): boolean {
    // Resources that typically require initialization
    const initRequiredResources = ['Collection', 'Vault', 'Minter', 'Administrator']
    return initRequiredResources.some(r => resourceName.includes(r))
  }

  private getExpectedEvents(code: string): string[] {
    const expectedEvents: string[] = []
    
    // Check for common patterns that should emit events
    if (code.includes('mint') || code.includes('Mint')) {
      expectedEvents.push('Minted', 'TokenMinted', 'NFTMinted')
    }
    if (code.includes('withdraw') || code.includes('deposit')) {
      expectedEvents.push('Withdraw', 'Deposit', 'Transfer')
    }
    if (code.includes('vote') || code.includes('Vote')) {
      expectedEvents.push('VoteCast', 'ProposalCreated')
    }
    if (code.includes('purchase') || code.includes('buy')) {
      expectedEvents.push('Purchase', 'Sale', 'ListingCompleted')
    }
    
    return expectedEvents
  }

  private determineFunctionIssueSeverity(issues: string[]): 'critical' | 'warning' | 'info' {
    if (issues.some(issue => 
      issue.includes('no implementation') || 
      issue.includes('no return statement') ||
      issue.includes('missing access modifier')
    )) {
      return 'critical'
    }
    if (issues.some(issue => issue.includes('empty') || issue.includes('error handling'))) {
      return 'warning'
    }
    return 'info'
  }

  private generateFunctionFix(functionName: string, issues: string[]): string {
    const fixes: string[] = []
    
    issues.forEach(issue => {
      if (issue.includes('no implementation')) {
        fixes.push('Add function implementation body with braces { }')
      }
      if (issue.includes('empty')) {
        fixes.push('Add function logic inside the body')
      }
      if (issue.includes('no return statement')) {
        fixes.push('Add return statement matching the declared return type')
      }
      if (issue.includes('error handling')) {
        fixes.push('Add pre/post conditions for validation')
      }
      if (issue.includes('access modifier')) {
        fixes.push('Add access(all) or appropriate access modifier')
      }
    })
    
    return fixes.join('; ')
  }

  private generateValidationResults(
    functionCompleteness: FunctionCompletenessValidation,
    resourceLifecycle: ResourceLifecycleValidation,
    eventEmission: EventEmissionValidation,
    accessControl: AccessControlValidation
  ): ValidationResult[] {
    const results: ValidationResult[] = []

    // Function completeness result
    const functionIssues = functionCompleteness.incompleteFunctions.map(f => ({
      severity: f.severity,
      type: 'incomplete-function',
      location: f.location,
      message: `Function '${f.functionName}' is incomplete: ${f.issues.join(', ')}`,
      suggestedFix: f.suggestedFix,
      autoFixable: f.issues.some(i => i.includes('access modifier'))
    }))

    // Add missing required functions
    functionCompleteness.missingRequiredFunctions.forEach(funcName => {
      functionIssues.push({
        severity: 'critical',
        type: 'missing-required-function',
        location: { line: 1, column: 1 },
        message: `Contract is missing required function: ${funcName}`,
        suggestedFix: `Implement ${funcName} function`,
        autoFixable: false
      })
    })

    results.push({
      type: 'completeness',
      passed: functionCompleteness.incompleteFunctions.length === 0 && 
              functionCompleteness.missingRequiredFunctions.length === 0,
      issues: functionIssues,
      score: functionCompleteness.completenessPercentage
    })

    // Resource lifecycle result
    results.push({
      type: 'completeness',
      passed: resourceLifecycle.lifecycleScore >= 80,
      issues: resourceLifecycle.issues,
      score: resourceLifecycle.lifecycleScore
    })

    // Event emission result
    const eventIssues: ValidationIssue[] = []
    
    eventEmission.unusedEvents.forEach(eventName => {
      eventIssues.push({
        severity: 'info',
        type: 'unused-event',
        location: { line: 1, column: 1 },
        message: `Event '${eventName}' is defined but never emitted`,
        suggestedFix: `Add emit ${eventName}() call or remove event definition`,
        autoFixable: false
      })
    })

    eventEmission.missingEmissions.forEach(eventName => {
      eventIssues.push({
        severity: 'warning',
        type: 'missing-event-emission',
        location: { line: 1, column: 1 },
        message: `Expected event '${eventName}' is not defined or emitted`,
        suggestedFix: `Define and emit ${eventName} event`,
        autoFixable: false
      })
    })

    results.push({
      type: 'best-practices',
      passed: eventEmission.emissionCompleteness >= 70,
      issues: eventIssues,
      score: eventEmission.emissionCompleteness
    })

    // Access control result
    results.push({
      type: 'completeness',
      passed: accessControl.accessControlScore >= 90,
      issues: accessControl.issues,
      score: accessControl.accessControlScore
    })

    return results
  }

  private generateRecommendations(
    functionCompleteness: FunctionCompletenessValidation,
    resourceLifecycle: ResourceLifecycleValidation,
    eventEmission: EventEmissionValidation,
    accessControl: AccessControlValidation
  ): string[] {
    const recommendations: string[] = []

    // Function completeness recommendations
    if (functionCompleteness.incompleteFunctions.length > 0) {
      recommendations.push(
        `Complete ${functionCompleteness.incompleteFunctions.length} incomplete function(s): ${
          functionCompleteness.incompleteFunctions.map(f => f.functionName).join(', ')
        }`
      )
    }

    if (functionCompleteness.missingRequiredFunctions.length > 0) {
      recommendations.push(
        `Implement missing required functions: ${functionCompleteness.missingRequiredFunctions.join(', ')}`
      )
    }

    // Resource lifecycle recommendations
    if (resourceLifecycle.missingLifecycleMethods.length > 0) {
      recommendations.push(
        `Add missing resource lifecycle methods: ${resourceLifecycle.missingLifecycleMethods.join(', ')}`
      )
    }

    // Event emission recommendations
    if (eventEmission.unusedEvents.length > 0) {
      recommendations.push(
        `Consider emitting or removing unused events: ${eventEmission.unusedEvents.join(', ')}`
      )
    }

    if (eventEmission.missingEmissions.length > 0) {
      recommendations.push(
        `Add expected event emissions: ${eventEmission.missingEmissions.join(', ')}`
      )
    }

    // Access control recommendations
    if (accessControl.functionsWithoutAccess > 0) {
      recommendations.push(
        `Add access modifiers to ${accessControl.functionsWithoutAccess} function(s)`
      )
    }

    if (accessControl.resourcesWithoutAccess > 0) {
      recommendations.push(
        `Add access modifiers to ${accessControl.resourcesWithoutAccess} resource(s)`
      )
    }

    return recommendations
  }

  private initializeRequiredFunctions(): RequiredFunction[] {
    return [
      {
        name: 'init',
        pattern: /init\s*\(\s*\)\s*\{/,
        contractTypes: ['all'],
        description: 'Contract initialization function',
        required: true
      },
      {
        name: 'mint',
        pattern: /fun\s+mint\w*\s*\(/,
        contractTypes: ['nft', 'fungible-token'],
        description: 'Token/NFT minting function',
        required: true
      },
      {
        name: 'withdraw',
        pattern: /fun\s+withdraw\s*\(/,
        contractTypes: ['fungible-token'],
        description: 'Token withdrawal function',
        required: true
      },
      {
        name: 'deposit',
        pattern: /fun\s+deposit\s*\(/,
        contractTypes: ['nft', 'fungible-token'],
        description: 'Token/NFT deposit function',
        required: true
      },
      {
        name: 'vote',
        pattern: /fun\s+vote\s*\(|fun\s+castVote\s*\(/,
        contractTypes: ['dao'],
        description: 'Voting function for DAO',
        required: true
      },
      {
        name: 'createProposal',
        pattern: /fun\s+createProposal\s*\(|fun\s+propose\s*\(/,
        contractTypes: ['dao'],
        description: 'Proposal creation function',
        required: true
      },
      {
        name: 'purchase',
        pattern: /fun\s+purchase\s*\(|fun\s+buy\s*\(/,
        contractTypes: ['marketplace'],
        description: 'Purchase function for marketplace',
        required: true
      },
      {
        name: 'createListing',
        pattern: /fun\s+createListing\s*\(|fun\s+list\s*\(/,
        contractTypes: ['marketplace'],
        description: 'Listing creation function',
        required: true
      }
    ]
  }
}

// Helper interfaces for parsing
interface ParsedFunction {
  name: string
  accessModifier: string | null
  parameters: string
  returnType?: string
  hasBody: boolean
  bodyContent: string
  hasReturnStatement: boolean
  hasErrorHandling: boolean
  location: CodeLocation
}

interface ParsedResource {
  name: string
  hasAccessModifier: boolean
  hasInit: boolean
  hasDestroy: boolean
  location: CodeLocation
}

// Export singleton instance
export const functionalCompletenessValidator = new FunctionalCompletenessValidator()