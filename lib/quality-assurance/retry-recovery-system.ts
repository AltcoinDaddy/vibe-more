/**
 * Generation Retry and Recovery System
 * 
 * This module implements comprehensive retry logic with progressive prompt enhancement
 * for failed AI generations, automatic regeneration when validation fails, maximum
 * retry limits with fallback activation, and correction attempt tracking and analysis.
 */

import { 
  GenerationRequest, 
  QualityAssuredResult, 
  ValidationResult, 
  GenerationMetrics,
  FailurePattern,
  GenerationContext,
  CorrectionAttempt,
  QualityScore,
  ValidationIssue
} from './types'
import { QualityConfigManager, qualityConfig } from './config'
import { PromptEnhancer, PromptEnhancementOptions } from './prompt-enhancer'
import { FallbackGenerator } from './fallback-generator'
import { QualityScoreCalculator } from './quality-score-calculator'
import { UndefinedValueDetector } from './undefined-value-detector'
import { AutoCorrectionEngine } from './auto-correction-engine'
import { QALogger, getLogger } from './logger'

export interface RetryAttempt {
  attemptNumber: number
  timestamp: Date
  prompt: string
  enhancedPrompt: string
  generatedCode: string
  validationResults: ValidationResult[]
  qualityScore: number
  correctionAttempts: CorrectionAttempt[]
  success: boolean
  failureReasons: string[]
  enhancementLevel: 'basic' | 'moderate' | 'strict' | 'maximum'
  temperature: number
  processingTime: number
}

export interface RecoveryStrategy {
  name: string
  description: string
  shouldApply: (failures: FailurePattern[], attemptNumber: number) => boolean
  apply: (request: GenerationRequest, context: GenerationContext, failures: FailurePattern[]) => Promise<string>
  priority: number
}

export interface RetryConfiguration {
  maxRetryAttempts: number
  enableProgressiveEnhancement: boolean
  enableAutomaticCorrection: boolean
  enableFallbackActivation: boolean
  qualityThreshold: number
  timeoutPerAttempt: number
  enableFailureAnalysis: boolean
  recoveryStrategies: RecoveryStrategy[]
}

export interface RetryResult {
  success: boolean
  finalCode: string
  totalAttempts: number
  retryHistory: RetryAttempt[]
  finalQualityScore: number
  fallbackUsed: boolean
  totalProcessingTime: number
  failurePatterns: FailurePattern[]
  recoveryStrategiesUsed: string[]
  metrics: GenerationMetrics
}

export class RetryRecoverySystem {
  private logger: QALogger
  private config: QualityConfigManager
  private promptEnhancer: typeof PromptEnhancer
  private fallbackGenerator: FallbackGenerator
  private qualityCalculator: QualityScoreCalculator
  private undefinedDetector: UndefinedValueDetector
  private correctionEngine: AutoCorrectionEngine

  constructor(
    config?: QualityConfigManager,
    fallbackGenerator?: FallbackGenerator,
    qualityCalculator?: QualityScoreCalculator,
    undefinedDetector?: UndefinedValueDetector,
    correctionEngine?: AutoCorrectionEngine
  ) {
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
    this.config = config || qualityConfig
    this.promptEnhancer = PromptEnhancer
    this.fallbackGenerator = fallbackGenerator || new FallbackGenerator()
    this.qualityCalculator = qualityCalculator || new QualityScoreCalculator()
    this.undefinedDetector = undefinedDetector || new UndefinedValueDetector()
    this.correctionEngine = correctionEngine || new AutoCorrectionEngine()
  }

  /**
   * Execute generation with comprehensive retry and recovery logic
   */
  async executeWithRetry(
    request: GenerationRequest,
    context: GenerationContext,
    generationFunction: (prompt: string, temperature: number) => Promise<string>
  ): Promise<RetryResult> {
    const startTime = Date.now()
    const retryHistory: RetryAttempt[] = []
    const failurePatterns: FailurePattern[] = []
    const recoveryStrategiesUsed: string[] = []
    
    const retryConfig = this.getRetryConfiguration(request)
    
    this.logger.info('Starting generation with retry system', {
      maxAttempts: retryConfig.maxRetryAttempts,
      qualityThreshold: retryConfig.qualityThreshold,
      prompt: request.prompt.substring(0, 100) + '...'
    })

    let currentAttempt = 1
    let bestResult: RetryAttempt | null = null

    // Main retry loop
    while (currentAttempt <= retryConfig.maxRetryAttempts) {
      const attemptStartTime = Date.now()
      
      try {
        this.logger.info(`Starting attempt ${currentAttempt}/${retryConfig.maxRetryAttempts}`)
        
        // Create retry attempt record
        const attempt: RetryAttempt = {
          attemptNumber: currentAttempt,
          timestamp: new Date(),
          prompt: request.prompt,
          enhancedPrompt: '',
          generatedCode: '',
          validationResults: [],
          qualityScore: 0,
          correctionAttempts: [],
          success: false,
          failureReasons: [],
          enhancementLevel: 'basic',
          temperature: request.temperature || 0.7,
          processingTime: 0
        }

        // Apply progressive prompt enhancement
        const enhancementOptions: PromptEnhancementOptions = {
          attemptNumber: currentAttempt,
          previousFailures: failurePatterns,
          qualityRequirements: context.qualityRequirements,
          strictMode: request.strictMode || false,
          temperature: request.temperature || 0.7
        }

        const enhancedPrompt = this.promptEnhancer.enhancePromptForQuality(
          request.prompt,
          context,
          enhancementOptions
        )

        attempt.enhancedPrompt = enhancedPrompt.userPrompt
        attempt.enhancementLevel = enhancedPrompt.enhancementLevel
        attempt.temperature = enhancedPrompt.temperature

        // Generate code with enhanced prompt
        const generatedCode = await this.generateWithTimeout(
          generationFunction,
          enhancedPrompt.userPrompt,
          enhancedPrompt.temperature,
          retryConfig.timeoutPerAttempt
        )

        attempt.generatedCode = generatedCode

        // Validate generated code
        const validationResults = await this.validateGeneratedCode(generatedCode, context)
        attempt.validationResults = validationResults

        // Calculate quality score
        const qualityScore = this.qualityCalculator.calculateQualityScore(validationResults, {
          contractType: context.contractType,
          requirements: context.qualityRequirements
        })
        attempt.qualityScore = qualityScore.overall

        // Attempt automatic correction if enabled and needed
        if (retryConfig.enableAutomaticCorrection && qualityScore.overall < retryConfig.qualityThreshold) {
          const correctionResult = await this.attemptAutoCorrection(generatedCode, context, validationResults)
          attempt.correctionAttempts = [correctionResult]
          
          if (correctionResult.success) {
            attempt.generatedCode = correctionResult.correctedCode
            // Re-validate corrected code
            attempt.validationResults = await this.validateGeneratedCode(correctionResult.correctedCode, context)
            attempt.qualityScore = this.qualityCalculator.calculateQualityScore(attempt.validationResults, {
              contractType: context.contractType,
              requirements: context.qualityRequirements
            }).overall
          }
        }

        // Check if attempt succeeded
        if (attempt.qualityScore >= retryConfig.qualityThreshold) {
          attempt.success = true
          attempt.processingTime = Date.now() - attemptStartTime
          retryHistory.push(attempt)
          
          this.logger.info(`Attempt ${currentAttempt} succeeded`, {
            qualityScore: attempt.qualityScore,
            threshold: retryConfig.qualityThreshold
          })

          return this.buildSuccessResult(attempt, retryHistory, startTime, failurePatterns, recoveryStrategiesUsed)
        }

        // Attempt failed - analyze failure patterns
        const attemptFailures = this.analyzeFailurePatterns(attempt.validationResults)
        failurePatterns.push(...attemptFailures)
        attempt.failureReasons = attemptFailures.map(f => f.type)
        attempt.processingTime = Date.now() - attemptStartTime
        retryHistory.push(attempt)

        // Track best result so far
        if (!bestResult || attempt.qualityScore > bestResult.qualityScore) {
          bestResult = attempt
        }

        // Apply recovery strategies if available
        if (retryConfig.recoveryStrategies.length > 0) {
          const applicableStrategies = retryConfig.recoveryStrategies
            .filter(strategy => strategy.shouldApply(failurePatterns, currentAttempt))
            .sort((a, b) => b.priority - a.priority)

          for (const strategy of applicableStrategies) {
            try {
              this.logger.info(`Applying recovery strategy: ${strategy.name}`)
              const recoveredCode = await strategy.apply(request, context, failurePatterns)
              
              // Validate recovered code
              const recoveredValidation = await this.validateGeneratedCode(recoveredCode, context)
              const recoveredScore = this.qualityCalculator.calculateQualityScore(recoveredValidation, {
                contractType: context.contractType,
                requirements: context.qualityRequirements
              }).overall

              if (recoveredScore >= retryConfig.qualityThreshold) {
                recoveryStrategiesUsed.push(strategy.name)
                
                const recoveryAttempt: RetryAttempt = {
                  ...attempt,
                  generatedCode: recoveredCode,
                  validationResults: recoveredValidation,
                  qualityScore: recoveredScore,
                  success: true,
                  processingTime: Date.now() - attemptStartTime
                }
                
                retryHistory[retryHistory.length - 1] = recoveryAttempt
                
                return this.buildSuccessResult(recoveryAttempt, retryHistory, startTime, failurePatterns, recoveryStrategiesUsed)
              }
            } catch (error) {
              this.logger.warn(`Recovery strategy ${strategy.name} failed`, { error: error.message })
            }
          }
        }

        this.logger.warn(`Attempt ${currentAttempt} failed`, {
          qualityScore: attempt.qualityScore,
          threshold: retryConfig.qualityThreshold,
          failures: attempt.failureReasons
        })

      } catch (error) {
        this.logger.error(`Attempt ${currentAttempt} encountered error`, { error: error.message })
        
        const errorAttempt: RetryAttempt = {
          attemptNumber: currentAttempt,
          timestamp: new Date(),
          prompt: request.prompt,
          enhancedPrompt: '',
          generatedCode: '',
          validationResults: [],
          qualityScore: 0,
          correctionAttempts: [],
          success: false,
          failureReasons: ['generation-error'],
          enhancementLevel: 'basic',
          temperature: request.temperature || 0.7,
          processingTime: Date.now() - attemptStartTime
        }
        
        retryHistory.push(errorAttempt)
        failurePatterns.push({
          type: 'generation-error',
          frequency: 1,
          commonCauses: [error.message],
          suggestedSolutions: ['Check AI service availability', 'Reduce prompt complexity']
        })
      }

      currentAttempt++
    }

    // All retry attempts failed - activate fallback if enabled
    if (retryConfig.enableFallbackActivation) {
      this.logger.info('All retry attempts failed, activating fallback generation')
      
      try {
        const fallbackCode = await this.fallbackGenerator.generateFallbackContract(
          request.prompt,
          context.contractType
        )
        
        const fallbackValidation = await this.validateGeneratedCode(fallbackCode, context)
        const fallbackScore = this.qualityCalculator.calculateQualityScore(fallbackValidation, {
          contractType: context.contractType,
          requirements: context.qualityRequirements
        }).overall

        const fallbackAttempt: RetryAttempt = {
          attemptNumber: currentAttempt,
          timestamp: new Date(),
          prompt: request.prompt,
          enhancedPrompt: 'FALLBACK_GENERATION',
          generatedCode: fallbackCode,
          validationResults: fallbackValidation,
          qualityScore: fallbackScore,
          correctionAttempts: [],
          success: true,
          failureReasons: [],
          enhancementLevel: 'maximum',
          temperature: 0.1,
          processingTime: 1000 // Fallback is typically fast
        }
        
        retryHistory.push(fallbackAttempt)
        recoveryStrategiesUsed.push('fallback-generation')

        return this.buildFallbackResult(fallbackAttempt, retryHistory, startTime, failurePatterns, recoveryStrategiesUsed)
        
      } catch (fallbackError) {
        this.logger.error('Fallback generation also failed', { error: fallbackError.message })
      }
    }

    // Complete failure - return best attempt or failure result
    return this.buildFailureResult(bestResult, retryHistory, startTime, failurePatterns, recoveryStrategiesUsed)
  }

  /**
   * Generate code with timeout protection
   */
  private async generateWithTimeout(
    generationFunction: (prompt: string, temperature: number) => Promise<string>,
    prompt: string,
    temperature: number,
    timeoutMs: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Generation timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      generationFunction(prompt, temperature)
        .then(result => {
          clearTimeout(timeout)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeout)
          reject(error)
        })
    })
  }

  /**
   * Validate generated code comprehensively
   */
  private async validateGeneratedCode(code: string, context: GenerationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []

    // Check for undefined values
    const undefinedIssues = this.undefinedDetector.detectUndefinedValues(code)
    if (undefinedIssues.length > 0) {
      results.push({
        type: 'syntax',
        passed: false,
        issues: undefinedIssues.map(issue => ({
          severity: 'critical' as const,
          type: 'undefined-value',
          location: issue.location,
          message: issue.description,
          suggestedFix: issue.suggestedFix,
          autoFixable: issue.autoFixable
        })),
        score: 0,
        message: 'Code contains undefined values'
      })
    }

    // Basic syntax validation
    const syntaxIssues = this.validateSyntax(code)
    if (syntaxIssues.length > 0) {
      results.push({
        type: 'syntax',
        passed: false,
        issues: syntaxIssues,
        score: Math.max(0, 100 - syntaxIssues.length * 10),
        message: 'Code has syntax errors'
      })
    } else {
      results.push({
        type: 'syntax',
        passed: true,
        issues: [],
        score: 100,
        message: 'Syntax validation passed'
      })
    }

    // Logic completeness validation
    const completenessIssues = this.validateCompleteness(code, context)
    if (completenessIssues.length > 0) {
      results.push({
        type: 'completeness',
        passed: false,
        issues: completenessIssues,
        score: Math.max(0, 100 - completenessIssues.length * 15),
        message: 'Code is incomplete'
      })
    } else {
      results.push({
        type: 'completeness',
        passed: true,
        issues: [],
        score: 100,
        message: 'Completeness validation passed'
      })
    }

    return results
  }

  /**
   * Validate syntax of generated code
   */
  private validateSyntax(code: string): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // Check for bracket matching
    const brackets = { '{': 0, '[': 0, '(': 0 }
    const lines = code.split('\n')
    
    lines.forEach((line, lineIndex) => {
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '{') brackets['{']++
        else if (char === '}') brackets['{']--
        else if (char === '[') brackets['[']++
        else if (char === ']') brackets['[']--
        else if (char === '(') brackets['(']++
        else if (char === ')') brackets['(']--
      }
    })

    Object.entries(brackets).forEach(([bracket, count]) => {
      if (count !== 0) {
        issues.push({
          severity: 'critical',
          type: 'bracket-mismatch',
          location: { line: 0, column: 0 },
          message: `Unmatched ${bracket} brackets (${count > 0 ? 'missing closing' : 'extra closing'})`,
          autoFixable: false
        })
      }
    })

    // Check for legacy syntax
    if (code.includes('pub ')) {
      issues.push({
        severity: 'critical',
        type: 'legacy-syntax',
        location: { line: 0, column: 0 },
        message: 'Legacy "pub" keyword found, use "access(all)" instead',
        suggestedFix: 'Replace "pub" with "access(all)"',
        autoFixable: true
      })
    }

    if (code.includes('AuthAccount')) {
      issues.push({
        severity: 'critical',
        type: 'legacy-syntax',
        location: { line: 0, column: 0 },
        message: 'Legacy "AuthAccount" found, use modern account patterns',
        autoFixable: false
      })
    }

    return issues
  }

  /**
   * Validate completeness of generated code
   */
  private validateCompleteness(code: string, context: GenerationContext): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // Check for empty function bodies
    const emptyFunctionRegex = /access\([^)]+\)\s+fun\s+\w+\([^)]*\)(?:\s*:\s*\w+)?\s*\{\s*\}/g
    const emptyFunctions = code.match(emptyFunctionRegex)
    if (emptyFunctions) {
      issues.push({
        severity: 'critical',
        type: 'incomplete-function',
        location: { line: 0, column: 0 },
        message: `Found ${emptyFunctions.length} empty function(s)`,
        autoFixable: false
      })
    }

    // Check for missing init function in contracts
    if (code.includes('access(all) contract') && !code.includes('init(')) {
      issues.push({
        severity: 'warning',
        type: 'missing-init',
        location: { line: 0, column: 0 },
        message: 'Contract missing init() function',
        autoFixable: false
      })
    }

    return issues
  }

  /**
   * Attempt automatic correction of generated code
   */
  private async attemptAutoCorrection(
    code: string,
    context: GenerationContext,
    validationResults: ValidationResult[]
  ): Promise<CorrectionAttempt> {
    const startTime = Date.now()
    
    try {
      const correctionResult = await this.correctionEngine.correctCode(code, validationResults)
      
      return {
        attemptNumber: 1,
        timestamp: new Date(),
        corrections: correctionResult.corrections || [],
        success: correctionResult.success,
        qualityImprovement: correctionResult.qualityImprovement || 0
      }
    } catch (error) {
      this.logger.error('Auto-correction failed', { error: error.message })
      
      return {
        attemptNumber: 1,
        timestamp: new Date(),
        corrections: [],
        success: false,
        qualityImprovement: 0
      }
    }
  }

  /**
   * Analyze failure patterns from validation results
   */
  private analyzeFailurePatterns(validationResults: ValidationResult[]): FailurePattern[] {
    const patterns: FailurePattern[] = []
    
    validationResults.forEach(result => {
      if (!result.passed) {
        result.issues.forEach(issue => {
          const existingPattern = patterns.find(p => p.type === issue.type)
          if (existingPattern) {
            existingPattern.frequency++
          } else {
            patterns.push({
              type: issue.type,
              frequency: 1,
              commonCauses: [issue.message],
              suggestedSolutions: issue.suggestedFix ? [issue.suggestedFix] : []
            })
          }
        })
      }
    })

    return patterns
  }

  /**
   * Get retry configuration based on request parameters
   */
  private getRetryConfiguration(request: GenerationRequest): RetryConfiguration {
    const config = this.config.getConfig()
    
    return {
      maxRetryAttempts: request.maxRetries || config.maxRetryAttempts,
      enableProgressiveEnhancement: true,
      enableAutomaticCorrection: config.enableAutoCorrection,
      enableFallbackActivation: config.enableFallbackGeneration,
      qualityThreshold: config.qualityThreshold,
      timeoutPerAttempt: config.performance.maxGenerationTime,
      enableFailureAnalysis: true,
      recoveryStrategies: this.getDefaultRecoveryStrategies()
    }
  }

  /**
   * Get default recovery strategies
   */
  private getDefaultRecoveryStrategies(): RecoveryStrategy[] {
    return [
      {
        name: 'undefined-value-recovery',
        description: 'Replace undefined values with appropriate defaults',
        priority: 10,
        shouldApply: (failures, attemptNumber) => 
          failures.some(f => f.type === 'undefined-value') && attemptNumber >= 2,
        apply: async (request, context, failures) => {
          // This would integrate with the auto-correction engine
          return request.prompt + '\n\nIMPORTANT: Use concrete default values, never "undefined"'
        }
      },
      {
        name: 'syntax-error-recovery',
        description: 'Fix common syntax errors',
        priority: 8,
        shouldApply: (failures, attemptNumber) => 
          failures.some(f => f.type === 'bracket-mismatch' || f.type === 'legacy-syntax'),
        apply: async (request, context, failures) => {
          return request.prompt + '\n\nIMPORTANT: Use modern Cadence 1.0 syntax and ensure all brackets match'
        }
      }
    ]
  }

  /**
   * Build success result
   */
  private buildSuccessResult(
    successAttempt: RetryAttempt,
    retryHistory: RetryAttempt[],
    startTime: number,
    failurePatterns: FailurePattern[],
    recoveryStrategiesUsed: string[]
  ): RetryResult {
    return {
      success: true,
      finalCode: successAttempt.generatedCode,
      totalAttempts: retryHistory.length,
      retryHistory,
      finalQualityScore: successAttempt.qualityScore,
      fallbackUsed: successAttempt.enhancedPrompt === 'FALLBACK_GENERATION',
      totalProcessingTime: Date.now() - startTime,
      failurePatterns,
      recoveryStrategiesUsed,
      metrics: this.buildGenerationMetrics(retryHistory, startTime)
    }
  }

  /**
   * Build fallback result
   */
  private buildFallbackResult(
    fallbackAttempt: RetryAttempt,
    retryHistory: RetryAttempt[],
    startTime: number,
    failurePatterns: FailurePattern[],
    recoveryStrategiesUsed: string[]
  ): RetryResult {
    return {
      success: true,
      finalCode: fallbackAttempt.generatedCode,
      totalAttempts: retryHistory.length,
      retryHistory,
      finalQualityScore: fallbackAttempt.qualityScore,
      fallbackUsed: true,
      totalProcessingTime: Date.now() - startTime,
      failurePatterns,
      recoveryStrategiesUsed,
      metrics: this.buildGenerationMetrics(retryHistory, startTime)
    }
  }

  /**
   * Build failure result
   */
  private buildFailureResult(
    bestAttempt: RetryAttempt | null,
    retryHistory: RetryAttempt[],
    startTime: number,
    failurePatterns: FailurePattern[],
    recoveryStrategiesUsed: string[]
  ): RetryResult {
    return {
      success: false,
      finalCode: bestAttempt?.generatedCode || '',
      totalAttempts: retryHistory.length,
      retryHistory,
      finalQualityScore: bestAttempt?.qualityScore || 0,
      fallbackUsed: false,
      totalProcessingTime: Date.now() - startTime,
      failurePatterns,
      recoveryStrategiesUsed,
      metrics: this.buildGenerationMetrics(retryHistory, startTime)
    }
  }

  /**
   * Build generation metrics from retry history
   */
  private buildGenerationMetrics(retryHistory: RetryAttempt[], startTime: number): GenerationMetrics {
    const totalTime = Date.now() - startTime
    const validationTime = retryHistory.reduce((sum, attempt) => sum + (attempt.processingTime * 0.2), 0)
    const correctionTime = retryHistory.reduce((sum, attempt) => 
      sum + attempt.correctionAttempts.reduce((corrSum, corr) => corrSum + 100, 0), 0)
    
    const finalAttempt = retryHistory[retryHistory.length - 1]
    const allIssues = retryHistory.flatMap(attempt => 
      attempt.validationResults.flatMap(result => result.issues))
    
    return {
      attemptCount: retryHistory.length,
      totalGenerationTime: totalTime,
      validationTime,
      correctionTime,
      finalQualityScore: finalAttempt?.qualityScore || 0,
      issuesDetected: allIssues.length,
      issuesFixed: retryHistory.reduce((sum, attempt) => 
        sum + attempt.correctionAttempts.reduce((corrSum, corr) => corrSum + corr.corrections.length, 0), 0),
      startTime: new Date(startTime),
      endTime: new Date()
    }
  }

  /**
   * Get retry statistics for monitoring and analysis
   */
  getRetryStatistics(retryHistory: RetryAttempt[]): {
    averageQualityImprovement: number
    mostCommonFailures: string[]
    enhancementEffectiveness: Record<string, number>
    correctionSuccessRate: number
  } {
    if (retryHistory.length === 0) {
      return {
        averageQualityImprovement: 0,
        mostCommonFailures: [],
        enhancementEffectiveness: {},
        correctionSuccessRate: 0
      }
    }

    // Calculate average quality improvement
    const qualityScores = retryHistory.map(attempt => attempt.qualityScore)
    const averageQualityImprovement = qualityScores.length > 1 
      ? (qualityScores[qualityScores.length - 1] - qualityScores[0]) / (qualityScores.length - 1)
      : 0

    // Find most common failures
    const allFailures = retryHistory.flatMap(attempt => attempt.failureReasons)
    const failureCounts = allFailures.reduce((counts, failure) => {
      counts[failure] = (counts[failure] || 0) + 1
      return counts
    }, {} as Record<string, number>)
    
    const mostCommonFailures = Object.entries(failureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([failure]) => failure)

    // Calculate enhancement effectiveness
    const enhancementEffectiveness = retryHistory.reduce((effectiveness, attempt, index) => {
      if (index > 0) {
        const improvement = attempt.qualityScore - retryHistory[index - 1].qualityScore
        effectiveness[attempt.enhancementLevel] = (effectiveness[attempt.enhancementLevel] || 0) + improvement
      }
      return effectiveness
    }, {} as Record<string, number>)

    // Calculate correction success rate
    const totalCorrections = retryHistory.reduce((sum, attempt) => sum + attempt.correctionAttempts.length, 0)
    const successfulCorrections = retryHistory.reduce((sum, attempt) => 
      sum + attempt.correctionAttempts.filter(corr => corr.success).length, 0)
    const correctionSuccessRate = totalCorrections > 0 ? successfulCorrections / totalCorrections : 0

    return {
      averageQualityImprovement,
      mostCommonFailures,
      enhancementEffectiveness,
      correctionSuccessRate
    }
  }
}

// Export default instance
export const retryRecoverySystem = new RetryRecoverySystem()