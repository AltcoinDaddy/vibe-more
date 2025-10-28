/**
 * Prompt Enhancement System for AI Generation Quality Assurance
 * 
 * This module provides intelligent prompt enhancement capabilities to improve
 * the quality of AI-generated Cadence smart contracts by:
 * - Adding quality-focused instructions
 * - Preventing undefined values and syntax errors
 * - Learning from previous failures
 * - Progressive enhancement for retry attempts
 */

import { GenerationContext, FailurePattern, QualityRequirements, ValidationIssue } from './types'

// Create a simple logger for the prompt enhancer
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[PromptEnhancer] ${message}`, data || '')
  },
  warn: (message: string, data?: any) => {
    console.warn(`[PromptEnhancer] ${message}`, data || '')
  },
  error: (message: string, data?: any) => {
    console.error(`[PromptEnhancer] ${message}`, data || '')
  }
}

export interface PromptEnhancementOptions {
  attemptNumber: number
  previousFailures: FailurePattern[]
  qualityRequirements: QualityRequirements
  strictMode: boolean
  temperature: number
}

export interface EnhancedPrompt {
  systemPrompt: string
  userPrompt: string
  temperature: number
  qualityConstraints: QualityConstraints
  enhancementLevel: 'basic' | 'moderate' | 'strict' | 'maximum'
}

export interface QualityConstraints {
  syntaxRequirements: string[]
  completenessRequirements: string[]
  bestPracticeRequirements: string[]
  errorPreventionRules: string[]
  undefinedValuePrevention: string[]
}

export class PromptEnhancer {
  private static readonly BASE_QUALITY_INSTRUCTIONS = `
🚨 CRITICAL QUALITY REQUIREMENTS 🚨

🔥 CADENCE 1.0 SYNTAX ENFORCEMENT (ABSOLUTELY MANDATORY):
- NEVER EVER use "pub" keyword - this is FORBIDDEN in Cadence 1.0
- ALWAYS use "access(all)" instead of "pub" - NO EXCEPTIONS
- NEVER use "AuthAccount" - this is deprecated and forbidden
- NEVER use legacy storage API like "account.save" or "account.link"
- ALWAYS use modern storage API: account.storage.save(), account.capabilities.storage.issue()
- NEVER use old capability patterns - use modern capability-based security
- Use ONLY these access modifiers: access(all), access(self), access(contract), access(account)
- Use entitlements for fine-grained access control where appropriate

MANDATORY SYNTAX COMPLIANCE:
- NEVER use "undefined" values - always provide proper defaults (String: "", UInt64: 0, Bool: false, Arrays: [], Dictionaries: {})
- Ensure ALL brackets, parentheses, and braces are properly matched
- NEVER leave function bodies empty - always provide complete implementations
- NEVER use placeholder comments like "TODO" or "FIXME" - implement everything

COMPLETENESS REQUIREMENTS:
- ALL functions must have complete implementations with proper logic
- ALL variables must be properly initialized with concrete values
- ALL resources must have proper lifecycle management (create, destroy, move)
- ALL events must be properly defined and emitted at appropriate times
- ALL imports must be valid, necessary, and use correct contract addresses
- ALL interfaces must be fully implemented with all required methods
- ALL pre/post conditions must be meaningful and comprehensive

QUALITY STANDARDS:
- Include comprehensive error handling with descriptive pre/post conditions
- Add input validation for all public functions with clear error messages
- Implement proper access control patterns using modern Cadence features
- Follow Cadence best practices and Flow ecosystem conventions
- Include clear, descriptive comments explaining complex logic
- Use meaningful variable and function names that describe their purpose
- Implement proper resource ownership and capability patterns
- Add comprehensive event emissions for all state changes
- Include proper error recovery and graceful failure handling

PRODUCTION READINESS:
- Code must be immediately deployable without modifications
- All edge cases must be handled appropriately
- Security considerations must be addressed (reentrancy, access control, etc.)
- Gas optimization should be considered for frequently called functions
- Code should follow established patterns from Flow ecosystem standards
`

  private static readonly UNDEFINED_PREVENTION_RULES = `
🛡️ UNDEFINED VALUE PREVENTION (CRITICAL):
- NEVER write "undefined" in any context - this is absolutely forbidden
- NEVER leave variable declarations incomplete or without values
- NEVER use placeholder values like "TODO", "FIXME", "...", or "TBD"
- NEVER leave function bodies empty or with just comments
- NEVER use incomplete expressions or statements

CONCRETE VALUE REQUIREMENTS:
- String variables: use "" (empty string) or meaningful default like "Default Name"
- UInt64/UInt32/UInt8 variables: use 0 or appropriate positive number
- Int64/Int32/Int8 variables: use 0 or appropriate number
- UFix64/Fix64 variables: use 0.0 or appropriate decimal
- Bool variables: use true or false (never leave uninitialized)
- Address variables: use proper Flow addresses or self.account.address
- Arrays: use [] (empty array) or populate with appropriate default elements
- Dictionaries: use {} (empty dictionary) or populate with default key-value pairs
- Optional types: use nil only when intentional and document why
- Resource types: always create with proper initialization

FUNCTION IMPLEMENTATION REQUIREMENTS:
- ALWAYS complete function implementations with actual logic
- ALWAYS provide return values for non-void functions
- ALWAYS handle all code paths and edge cases
- ALWAYS include proper error handling and validation
- NEVER leave functions with just "return" or empty bodies

INITIALIZATION PATTERNS:
- Contract init() functions must initialize ALL contract state
- Resource init() functions must initialize ALL resource properties
- Struct init() functions must initialize ALL struct fields
- All storage operations must be complete and functional
- All capability creation must be complete with proper types
`

  private static readonly PROGRESSIVE_ENHANCEMENT_LEVELS = {
    basic: {
      temperature: 0.7,
      strictness: 'moderate',
      additionalRules: [
        'Focus on complete, working implementations',
        'Ensure all variables have concrete values',
        'Use modern Cadence 1.0 syntax throughout'
      ]
    },
    moderate: {
      temperature: 0.5,
      strictness: 'high',
      additionalRules: [
        'Double-check all variable initializations for concrete values',
        'Verify all function signatures are complete with proper implementations',
        'Ensure comprehensive error handling in all functions',
        'Validate that no "undefined" values exist anywhere',
        'Confirm all brackets and parentheses are properly matched'
      ]
    },
    strict: {
      temperature: 0.3,
      strictness: 'maximum',
      additionalRules: [
        'TRIPLE-CHECK: No undefined values anywhere in the code',
        'VALIDATE: All brackets, parentheses, and braces match perfectly',
        'VERIFY: All functions have complete, working implementations',
        'CONFIRM: All variables are properly initialized with concrete values',
        'ENSURE: All resources have proper lifecycle management',
        'REVIEW: All access control patterns are correctly implemented'
      ]
    },
    maximum: {
      temperature: 0.1,
      strictness: 'extreme',
      additionalRules: [
        'EXTREME VALIDATION: Every single line must be syntactically perfect',
        'ZERO TOLERANCE: Any undefined value will cause immediate rejection',
        'COMPLETE IMPLEMENTATION: No partial, incomplete, or placeholder code allowed',
        'PRODUCTION READY: Code must be immediately deployable without any modifications',
        'PERFECT SYNTAX: Every bracket, parenthesis, and brace must be perfectly matched',
        'COMPREHENSIVE LOGIC: All functions must have complete, working implementations',
        'CONCRETE VALUES: Every variable must have a concrete, meaningful value',
        'MODERN PATTERNS: Only Cadence 1.0 syntax and patterns are acceptable'
      ]
    }
  }

  /**
   * Enhance a prompt with quality-focused instructions
   */
  static enhancePromptForQuality(
    basePrompt: string,
    context: GenerationContext,
    options: PromptEnhancementOptions = {
      attemptNumber: 1,
      previousFailures: [],
      qualityRequirements: {
        minimumQualityScore: 80,
        requiredFeatures: [],
        prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount'],
        performanceRequirements: {
          maxGenerationTime: 30000,
          maxValidationTime: 5000,
          maxRetryAttempts: 3
        }
      },
      strictMode: false,
      temperature: 0.7
    }
  ): EnhancedPrompt {
    logger.info('Enhancing prompt for quality', {
      attemptNumber: options.attemptNumber,
      strictMode: options.strictMode,
      previousFailures: options.previousFailures.length
    })

    const enhancementLevel = this.determineEnhancementLevel(options.attemptNumber, options.strictMode)
    const qualityConstraints = this.buildQualityConstraints(context, options)
    
    const systemPrompt = this.buildEnhancedSystemPrompt(
      context,
      options,
      enhancementLevel,
      qualityConstraints
    )

    const enhancedUserPrompt = this.enhanceUserPrompt(basePrompt, context, options)
    const adjustedTemperature = this.calculateOptimalTemperature(options.attemptNumber, options.temperature, options.strictMode)

    return {
      systemPrompt,
      userPrompt: enhancedUserPrompt,
      temperature: adjustedTemperature,
      qualityConstraints,
      enhancementLevel
    }
  }

  /**
   * Add quality constraints based on previous failures
   */
  static addQualityConstraints(
    prompt: string,
    previousFailures: FailurePattern[]
  ): string {
    if (previousFailures.length === 0) {
      return prompt
    }

    const failureSpecificRules = previousFailures.map(failure => {
      switch (failure.type) {
        case 'undefined-values':
          return 'CRITICAL: Previous attempt had undefined values. Ensure ALL variables have concrete values.'
        case 'syntax-errors':
          return 'CRITICAL: Previous attempt had syntax errors. Double-check all brackets and syntax.'
        case 'incomplete-logic':
          return 'CRITICAL: Previous attempt had incomplete logic. Ensure ALL functions are fully implemented.'
        case 'validation-failures':
          return 'CRITICAL: Previous attempt failed validation. Follow ALL Cadence 1.0 requirements strictly.'
        default:
          return `CRITICAL: Previous attempt failed due to ${failure.type}. Address this specific issue.`
      }
    }).join('\n')

    return `${prompt}

🔥 FAILURE PREVENTION BASED ON PREVIOUS ATTEMPTS:
${failureSpecificRules}

These issues MUST be avoided in this generation attempt.`
  }

  /**
   * Incorporate learnings from quality history
   */
  static incorporateLearnings(
    prompt: string,
    qualityHistory: Array<{ issues: ValidationIssue[]; score: number }>
  ): string {
    if (qualityHistory.length === 0) {
      return prompt
    }

    const commonIssues = this.analyzeCommonIssues(qualityHistory)
    const learningRules = commonIssues.map(issue => {
      switch (issue.type) {
        case 'undefined-literal':
          return 'LEARNED: Avoid any "undefined" literals - use proper default values'
        case 'bracket-mismatch':
          return 'LEARNED: Count brackets carefully - every opening bracket needs a closing bracket'
        case 'incomplete-function':
          return 'LEARNED: Complete all function implementations - no empty function bodies'
        case 'missing-initialization':
          return 'LEARNED: Initialize all variables with appropriate values'
        default:
          return `LEARNED: Avoid ${issue.type} issues that occurred in previous generations`
      }
    }).join('\n')

    return `${prompt}

📚 QUALITY LEARNINGS FROM PREVIOUS GENERATIONS:
${learningRules}

Apply these learnings to ensure higher quality output.`
  }

  /**
   * Create context-aware prompt modifications based on contract type and user experience
   */
  static createContextAwareModifications(
    basePrompt: string,
    context: GenerationContext
  ): string {
    let modifications = basePrompt

    // Contract type specific enhancements with quality focus
    switch (context.contractType.category) {
      case 'nft':
        modifications += `\n\n🎨 NFT CONTRACT SPECIFIC REQUIREMENTS:
- Implement ALL MetadataViews interfaces completely (Display, Royalties, ExternalURL, etc.)
- Ensure proper NFT resource lifecycle management with complete init() functions
- Include comprehensive metadata handling with concrete default values
- Implement proper collection interfaces (Provider, Receiver, CollectionPublic)
- Add proper event emissions for minting/transfers with all required parameters
- NEVER use undefined values in metadata or NFT properties
- Include proper access control for minting and admin functions
- Implement complete borrowNFT and borrowViewResolver functions
- Add comprehensive input validation for all minting parameters`
        break
      
      case 'fungible-token':
        modifications += `\n\n💰 FUNGIBLE TOKEN SPECIFIC REQUIREMENTS:
- Implement FungibleToken interface completely with all required methods
- Include proper supply management with concrete initial values
- Add transfer validation and events with complete parameter sets
- Implement proper vault resource patterns with full lifecycle management
- Include balance checking mechanisms with proper error handling
- NEVER use undefined values in token amounts or vault properties
- Add comprehensive access control for minting and admin operations
- Implement complete deposit/withdraw functions with proper validation
- Include proper totalSupply tracking and management`
        break
      
      case 'dao':
        modifications += `\n\n🏛️ DAO CONTRACT SPECIFIC REQUIREMENTS:
- Implement voting mechanisms completely with proper vote counting
- Include proposal management systems with complete lifecycle
- Add proper governance controls with comprehensive access patterns
- Implement member management with complete registration/removal logic
- Include proper access control for admin functions with entitlements
- NEVER use undefined values in voting or proposal data
- Add comprehensive event emissions for all governance actions
- Implement complete proposal creation, voting, and execution logic
- Include proper treasury management with secure fund handling`
        break
      
      case 'marketplace':
        modifications += `\n\n🛒 MARKETPLACE SPECIFIC REQUIREMENTS:
- Implement listing and purchasing logic completely with proper validation
- Include proper payment handling with comprehensive escrow patterns
- Add royalty distribution mechanisms with complete calculation logic
- Implement proper escrow patterns with secure fund management
- Include comprehensive event emissions for all marketplace actions
- NEVER use undefined values in pricing or listing data
- Add complete access control for marketplace operations
- Implement proper commission handling and distribution
- Include comprehensive error handling for failed transactions`
        break
      
      case 'utility':
        modifications += `\n\n🔧 UTILITY CONTRACT SPECIFIC REQUIREMENTS:
- Implement all utility functions completely with proper logic
- Include comprehensive access control patterns
- Add proper state management with concrete initial values
- Implement complete error handling and validation
- NEVER use undefined values in utility contract state
- Include proper event emissions for state changes
- Add comprehensive input validation for all public functions`
        break
    }

    // User experience level adjustments with quality emphasis
    switch (context.userExperience) {
      case 'beginner':
        modifications += `\n\n🌟 BEGINNER-FRIENDLY QUALITY REQUIREMENTS:
- Include extensive comments explaining each section and why it's needed
- Use clear, descriptive variable names that explain their purpose
- Add explanatory comments for complex logic and Cadence concepts
- Include usage examples in comments showing how to interact with the contract
- ALWAYS use concrete values instead of undefined - explain why each default is chosen
- Break down complex functions into smaller, well-commented steps
- Explain resource management concepts in comments
- Include clear error messages that help users understand what went wrong`
        break
      
      case 'expert':
        modifications += `\n\n🚀 EXPERT-LEVEL QUALITY REQUIREMENTS:
- Implement advanced patterns and optimizations while maintaining readability
- Include sophisticated error handling with custom error types where appropriate
- Use advanced Cadence features appropriately (entitlements, attachments, etc.)
- Optimize for gas efficiency and performance without sacrificing security
- NEVER compromise on quality for performance - use concrete values always
- Implement advanced access control patterns with fine-grained permissions
- Include comprehensive security considerations and mitigation strategies
- Use advanced resource patterns and capability-based security effectively`
        break
      
      case 'intermediate':
        modifications += `\n\n💡 INTERMEDIATE-LEVEL QUALITY REQUIREMENTS:
- Balance simplicity with completeness in implementations
- Include clear comments for non-obvious logic and patterns
- Use established Cadence patterns and best practices consistently
- ALWAYS use concrete values and complete implementations
- Include proper error handling without over-complicating the code
- Implement standard interfaces correctly and completely
- Add appropriate access control without excessive complexity`
        break
    }

    // Add complexity-specific requirements
    switch (context.contractType.complexity) {
      case 'simple':
        modifications += `\n\n📝 SIMPLE CONTRACT QUALITY FOCUS:
- Keep implementations straightforward but complete
- NEVER use undefined values even in simple contracts
- Include all necessary error handling and validation
- Use clear, simple patterns that are easy to understand and maintain`
        break
      
      case 'advanced':
        modifications += `\n\n🎯 ADVANCED CONTRACT QUALITY FOCUS:
- Implement sophisticated patterns while maintaining code quality
- Include comprehensive error handling and edge case management
- NEVER use undefined values regardless of complexity
- Add advanced security patterns and access control mechanisms
- Include performance optimizations and gas efficiency considerations`
        break
    }

    return modifications
  }

  /**
   * Build enhanced system prompt with all quality measures
   */
  private static buildEnhancedSystemPrompt(
    context: GenerationContext,
    options: PromptEnhancementOptions,
    enhancementLevel: keyof typeof PromptEnhancer.PROGRESSIVE_ENHANCEMENT_LEVELS,
    qualityConstraints: QualityConstraints
  ): string {
    const levelConfig = this.PROGRESSIVE_ENHANCEMENT_LEVELS[enhancementLevel]
    
    let systemPrompt = `You are an expert Flow blockchain developer specializing in Cadence 1.0 smart contracts.
Generate PERFECT, production-ready code with ZERO quality issues.

🚨🚨🚨 CRITICAL CADENCE 1.0 SYNTAX ENFORCEMENT 🚨🚨🚨
ABSOLUTELY FORBIDDEN PATTERNS (WILL CAUSE IMMEDIATE REJECTION):
- "pub" keyword - NEVER use this, ALWAYS use "access(all)" instead
- "AuthAccount" - NEVER use this deprecated type
- "account.save" or "account.link" - NEVER use legacy storage API
- Any Cadence 0.x syntax patterns

REQUIRED CADENCE 1.0 PATTERNS:
- access(all) instead of pub
- access(self) for private access
- account.storage.save() for storage operations
- account.capabilities.storage.issue() for capabilities
- Modern capability-based security patterns

${this.BASE_QUALITY_INSTRUCTIONS}

${this.UNDEFINED_PREVENTION_RULES}

ENHANCEMENT LEVEL: ${enhancementLevel.toUpperCase()} (Attempt ${options.attemptNumber})
STRICTNESS: ${levelConfig.strictness}
TEMPERATURE: ${levelConfig.temperature}`

    // Add progressive enhancement rules
    if (levelConfig.additionalRules.length > 0) {
      systemPrompt += `\n\nPROGRESSIVE ENHANCEMENT RULES:
${levelConfig.additionalRules.map(rule => `- ${rule}`).join('\n')}`
    }

    // Add quality constraints
    systemPrompt += `\n\nQUALITY CONSTRAINTS:
${qualityConstraints.syntaxRequirements.map(req => `- ${req}`).join('\n')}
${qualityConstraints.completenessRequirements.map(req => `- ${req}`).join('\n')}
${qualityConstraints.errorPreventionRules.map(rule => `- ${rule}`).join('\n')}`

    // Add failure-specific instructions
    if (options.previousFailures.length > 0) {
      systemPrompt += `\n\n🚨 CRITICAL FAILURE PREVENTION:
Previous attempts failed due to: ${options.previousFailures.map(f => f.type).join(', ')}
These issues MUST be completely avoided in this generation.`
    }

    // Add context-specific requirements
    systemPrompt += this.getContextSpecificRequirements(context)

    return systemPrompt
  }

  /**
   * Enhance user prompt with quality focus and progressive enhancement
   */
  private static enhanceUserPrompt(
    basePrompt: string,
    context: GenerationContext,
    options: PromptEnhancementOptions
  ): string {
    let enhanced = `Create a PERFECT Cadence 1.0 smart contract for: ${basePrompt}

🔥 CADENCE 1.0 SYNTAX REQUIREMENTS (CRITICAL - NO EXCEPTIONS):
- NEVER use "pub" - ALWAYS use "access(all)" instead
- NEVER use "AuthAccount" - use modern account patterns
- NEVER use legacy storage API - use account.storage.save(), account.capabilities.storage.issue()
- Use ONLY modern Cadence 1.0 syntax throughout the entire contract

🎯 CRITICAL QUALITY REQUIREMENTS:
- ZERO undefined values anywhere in the code (use concrete defaults: "", 0, false, [], {})
- Complete, production-ready implementation with all functions fully working
- All functions fully implemented with proper logic and error handling
- All variables properly initialized with meaningful, concrete values
- Perfect syntax with no errors - every bracket must match
- Comprehensive error handling with pre/post conditions
- Proper resource lifecycle management
- Complete event definitions and emissions`

    // Add progressive enhancement based on attempt number
    enhanced = this.createProgressiveEnhancement(enhanced, options.attemptNumber, options.previousFailures)

    // Add failure-specific modifications
    if (options.previousFailures.length > 0) {
      enhanced = this.createFailureSpecificModifications(enhanced, options.previousFailures)
    }

    // Add context-aware modifications
    enhanced = this.createContextAwareModifications(enhanced, context)

    // Add attempt-specific messaging
    if (options.attemptNumber > 1) {
      enhanced += `\n\n⚠️ RETRY ATTEMPT ${options.attemptNumber}/${options.qualityRequirements.performanceRequirements.maxRetryAttempts}:
Previous attempts failed quality validation. This attempt MUST be perfect.`
    }

    if (options.strictMode) {
      enhanced += `\n\n🚨 STRICT MODE ACTIVATED:
Code will be immediately rejected for ANY quality issues. Perfection is required.`
    }

    // Add quality score requirement
    enhanced += `\n\n📊 QUALITY TARGET:
This code must achieve a quality score of ${options.qualityRequirements.minimumQualityScore}+ to be accepted.`

    return enhanced
  }

  /**
   * Determine enhancement level based on attempt number and strict mode
   */
  private static determineEnhancementLevel(
    attemptNumber: number,
    strictMode: boolean
  ): keyof typeof PromptEnhancer.PROGRESSIVE_ENHANCEMENT_LEVELS {
    if (strictMode) {
      return attemptNumber >= 3 ? 'maximum' : 'strict'
    }

    switch (attemptNumber) {
      case 1:
        return 'basic'
      case 2:
        return 'moderate'
      case 3:
        return 'strict'
      default:
        return 'maximum'
    }
  }

  /**
   * Build quality constraints based on context and options
   */
  private static buildQualityConstraints(
    context: GenerationContext,
    options: PromptEnhancementOptions
  ): QualityConstraints {
    return {
      syntaxRequirements: [
        'Use access(all) instead of pub',
        'Use modern storage API (account.storage.save)',
        'Use capabilities instead of account.link',
        'Proper bracket matching',
        'Complete function signatures'
      ],
      completenessRequirements: [
        'All functions fully implemented',
        'All variables initialized',
        'All resources properly managed',
        'All events properly defined',
        'Complete contract initialization'
      ],
      bestPracticeRequirements: [
        'Comprehensive error handling',
        'Input validation with pre conditions',
        'Proper access control patterns',
        'Clear documentation and comments',
        'Efficient resource usage'
      ],
      errorPreventionRules: [
        'No undefined values anywhere',
        'No incomplete statements',
        'No missing return values',
        'No unmatched brackets',
        'No legacy syntax patterns'
      ],
      undefinedValuePrevention: [
        'String variables must have concrete values',
        'Numeric variables must be initialized',
        'Boolean variables must be true or false',
        'Arrays must be properly initialized',
        'Dictionaries must be properly initialized'
      ]
    }
  }

  /**
   * Calculate optimal temperature based on attempt number and strict mode
   */
  private static calculateOptimalTemperature(attemptNumber: number, baseTemperature: number, strictMode: boolean = false): number {
    // Strict mode uses lower temperature immediately
    if (strictMode) {
      return Math.max(0.1, baseTemperature * 0.5)
    }
    
    // Progressively lower temperature for more deterministic results
    if (attemptNumber >= 4) {
      return 0.1 // Maximum strictness for final attempts
    }
    const reductionFactor = Math.pow(0.7, attemptNumber - 1)
    return Math.max(0.1, baseTemperature * reductionFactor)
  }

  /**
   * Get context-specific requirements
   */
  private static getContextSpecificRequirements(context: GenerationContext): string {
    let requirements = ''

    // Add contract type specific requirements
    switch (context.contractType.category) {
      case 'nft':
        requirements += `\n\nNFT CONTRACT REQUIREMENTS:
- Implement NonFungibleToken interface
- Include MetadataViews compliance
- Proper collection resource patterns
- Complete minting functionality`
        break
      
      case 'fungible-token':
        requirements += `\n\nFUNGIBLE TOKEN REQUIREMENTS:
- Implement FungibleToken interface
- Include vault resource patterns
- Proper supply management
- Transfer validation logic`
        break
    }

    return requirements
  }

  /**
   * Create progressive prompt enhancement for retry attempts
   */
  static createProgressiveEnhancement(
    basePrompt: string,
    attemptNumber: number,
    previousFailures: FailurePattern[]
  ): string {
    let enhanced = basePrompt

    if (attemptNumber === 1) {
      enhanced += `\n\n🎯 FIRST ATTEMPT - HIGH QUALITY FOCUS:
- Generate complete, production-ready code immediately
- Use concrete values for all variables (no undefined anywhere)
- Implement all functions completely with proper logic
- Follow modern Cadence 1.0 patterns exclusively`
    } else if (attemptNumber === 2) {
      enhanced += `\n\n⚠️ SECOND ATTEMPT - ENHANCED QUALITY CONTROL:
- Previous attempt had quality issues - this must be perfect
- DOUBLE-CHECK: No undefined values anywhere in the code
- VERIFY: All functions have complete implementations
- ENSURE: All brackets and syntax are perfectly matched
- VALIDATE: All variables are properly initialized`
    } else if (attemptNumber === 3) {
      enhanced += `\n\n🚨 THIRD ATTEMPT - MAXIMUM QUALITY ENFORCEMENT:
- This is the final attempt before fallback activation
- TRIPLE-CHECK: Every line must be syntactically perfect
- ZERO TOLERANCE: Any undefined value will cause rejection
- COMPLETE VALIDATION: All functions must be fully implemented
- PERFECT SYNTAX: Every bracket must be properly matched`
    } else {
      enhanced += `\n\n🔥 FINAL ATTEMPT - EXTREME QUALITY MEASURES:
- This is the absolute final attempt - perfection is required
- EXTREME VALIDATION: Every character must be correct
- NO COMPROMISES: Complete, perfect implementation only
- PRODUCTION READY: Code must deploy immediately without issues`
    }

    // Add failure-specific enhancements
    if (previousFailures.length > 0) {
      enhanced += `\n\n🛠️ FAILURE-SPECIFIC CORRECTIONS (Critical):`
      previousFailures.forEach(failure => {
        switch (failure.type) {
          case 'undefined-values':
            enhanced += `\n- CRITICAL: Previous attempts had undefined values - use concrete defaults only`
            break
          case 'syntax-errors':
            enhanced += `\n- CRITICAL: Previous attempts had syntax errors - verify all brackets match`
            break
          case 'incomplete-logic':
            enhanced += `\n- CRITICAL: Previous attempts had incomplete logic - implement all functions fully`
            break
          case 'legacy-syntax':
            enhanced += `\n- CRITICAL: Previous attempts used legacy syntax - use only Cadence 1.0 patterns`
            break
          case 'validation-failures':
            enhanced += `\n- CRITICAL: Previous attempts failed validation - follow all requirements strictly`
            break
        }
      })
    }

    return enhanced
  }

  /**
   * Create failure-specific prompt modifications
   */
  static createFailureSpecificModifications(
    basePrompt: string,
    failures: FailurePattern[]
  ): string {
    if (failures.length === 0) return basePrompt

    let enhanced = basePrompt + `\n\n🚨 CRITICAL FAILURE PREVENTION:`

    const undefinedFailures = failures.filter(f => f.type === 'undefined-values')
    if (undefinedFailures.length > 0) {
      enhanced += `\n\n❌ UNDEFINED VALUE PREVENTION (${undefinedFailures.length} previous failures):
- NEVER write "undefined" anywhere in the code
- String variables MUST use "" or meaningful defaults
- Numeric variables MUST use 0 or appropriate numbers
- Boolean variables MUST use true or false
- Arrays MUST use [] or populated arrays
- Dictionaries MUST use {} or populated dictionaries
- ALL variables MUST have concrete, meaningful values`
    }

    const syntaxFailures = failures.filter(f => f.type === 'syntax-errors')
    if (syntaxFailures.length > 0) {
      enhanced += `\n\n❌ SYNTAX ERROR PREVENTION (${syntaxFailures.length} previous failures):
- Count every opening bracket { [ ( and ensure it has a closing bracket } ] )
- Verify all function signatures are complete
- Ensure all statements end properly
- Check all string literals are properly quoted
- Validate all access modifiers are correct`
    }

    const incompleteFailures = failures.filter(f => f.type === 'incomplete-logic')
    if (incompleteFailures.length > 0) {
      enhanced += `\n\n❌ INCOMPLETE LOGIC PREVENTION (${incompleteFailures.length} previous failures):
- ALL functions must have complete implementations
- NO empty function bodies or placeholder comments
- ALL code paths must be implemented
- ALL return statements must return appropriate values
- ALL resource operations must be complete`
    }

    const legacyFailures = failures.filter(f => f.type === 'legacy-syntax')
    if (legacyFailures.length > 0) {
      enhanced += `\n\n❌ LEGACY SYNTAX PREVENTION (${legacyFailures.length} previous failures):
- NEVER use "pub" - ALWAYS use "access(all)"
- NEVER use "AuthAccount" - use modern account patterns
- NEVER use old storage API - use account.storage.save()
- ALWAYS use modern capability patterns
- ONLY use Cadence 1.0 syntax and patterns`
    }

    return enhanced
  }

  /**
   * Analyze common issues from quality history
   */
  private static analyzeCommonIssues(
    qualityHistory: Array<{ issues: ValidationIssue[]; score: number }>
  ): Array<{ type: string; frequency: number }> {
    const issueCount: Record<string, number> = {}
    
    qualityHistory.forEach(entry => {
      entry.issues.forEach(issue => {
        issueCount[issue.type] = (issueCount[issue.type] || 0) + 1
      })
    })

    return Object.entries(issueCount)
      .map(([type, frequency]) => ({ type, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5) // Top 5 most common issues
  }
}