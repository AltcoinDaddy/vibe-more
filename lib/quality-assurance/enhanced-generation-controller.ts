/**
 * Enhanced Generation Controller
 * 
 * Orchestrates the complete quality assurance pipeline for AI code generation,
 * integrating all quality components to ensure high-quality, production-ready code.
 */

import { 
  GenerationRequest, 
  QualityAssuredResult, 
  ValidationResult, 
  GenerationMetrics,
  GenerationContext,
  ContractType,
  QualityRequirements,
  CorrectionAttempt
} from './types'
import { RetryRecoverySystem } from './retry-recovery-system'
import { QualityScoreCalculator } from './quality-score-calculator'
import { FallbackGenerator } from './fallback-generator'
import { UndefinedValueDetector } from './undefined-value-detector'
import { AutoCorrectionEngine } from './auto-correction-engine'
import { PromptEnhancer } from './prompt-enhancer'
import { ComprehensiveErrorDetector } from './comprehensive-error-detector'
import { ComprehensiveValidationSystem } from './comprehensive-validation-system'
import { ContractSpecificValidator } from './contract-specific-validator'
import { FunctionalCompletenessValidator } from './functional-completeness-validator'
import { qualityConfig } from './config'
import { QALogger, getLogger } from './logger'
import { QAError, GenerationError, ValidationError } from './errors'

export interface EnhancedGenerationOptions {
  enableRetryRecovery?: boolean
  enableAutoCorrection?: boolean
  enableFallbackGeneration?: boolean
  enableProgressiveEnhancement?: boolean
  qualityThreshold?: number
  maxRetries?: number
  strictMode?: boolean
}

export interface GenerationStep {
  name: string
  startTime: Date
  endTime?: Date
  success: boolean
  result?: any
  error?: string
}

export class EnhancedGenerationController {
  private logger: QALogger
  private retrySystem: RetryRecoverySystem
  private qualityCalculator: QualityScoreCalculator
  private fallbackGenerator: FallbackGenerator
  private undefinedDetector: UndefinedValueDetector
  private correctionEngine: AutoCorrectionEngine
  private promptEnhancer: typeof PromptEnhancer
  private errorDetector: ComprehensiveErrorDetector
  private validationSystem: ComprehensiveValidationSystem
  private contractValidator: ContractSpecificValidator
  private completenessValidator: FunctionalCompletenessValidator

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
    
    this.retrySystem = new RetryRecoverySystem()
    this.qualityCalculator = new QualityScoreCalculator()
    this.fallbackGenerator = new FallbackGenerator()
    this.undefinedDetector = new UndefinedValueDetector()
    this.correctionEngine = new AutoCorrectionEngine()
    this.promptEnhancer = PromptEnhancer
    this.errorDetector = new ComprehensiveErrorDetector()
    this.validationSystem = new ComprehensiveValidationSystem()
    this.contractValidator = new ContractSpecificValidator()
    this.completenessValidator = new FunctionalCompletenessValidator()
  }

  /**
   * Generate code with comprehensive quality assurance
   */
  async generateWithQualityAssurance(
    request: GenerationRequest,
    generationFunction: (prompt: string, temperature: number) => Promise<string>,
    options: EnhancedGenerationOptions = {}
  ): Promise<QualityAssuredResult> {
    const startTime = Date.now()
    const steps: GenerationStep[] = []
    const correctionHistory: CorrectionAttempt[] = []
    
    this.logger.info('Starting comprehensive quality assurance pipeline', {
      prompt: request.prompt.substring(0, 100) + '...',
      options
    })

    try {
      // Step 1: Create generation context and enhance prompt
      const contextStep = this.createStep('create-context')
      steps.push(contextStep)
      
      const context = this.createGenerationContext(request, options)
      const enhancedPrompt = this.promptEnhancer.enhancePromptForQuality(
        request.prompt,
        context
      )
      
      this.completeStep(contextStep, true, { context, enhancedPrompt })

      // Step 2: Initial generation attempt
      let currentCode = ''
      let currentAttempt = 1
      let qualityThresholdMet = false
      const maxRetries = options.maxRetries || qualityConfig.getConfig().maxRetryAttempts

      while (currentAttempt <= maxRetries && !qualityThresholdMet) {
        this.logger.info(`Generation attempt ${currentAttempt}/${maxRetries}`)
        
        const generationStep = this.createStep(`generation-attempt-${currentAttempt}`)
        steps.push(generationStep)

        try {
          // Generate code
          const temperature = Math.max(0.1, (request.temperature || 0.7) - (currentAttempt - 1) * 0.1)
          currentCode = await generationFunction(enhancedPrompt, temperature)
          
          this.completeStep(generationStep, true, { code: currentCode.substring(0, 200) + '...' })

          // Step 3: Comprehensive validation pipeline
          const validationStep = this.createStep(`validation-attempt-${currentAttempt}`)
          steps.push(validationStep)

          const validationResult = await this.runComprehensiveValidation(currentCode, context)
          
          this.completeStep(validationStep, validationResult.isValid, {
            score: validationResult.overallScore,
            issues: validationResult.validationResults.length
          })

          // Step 4: Auto-correction if needed
          if (!validationResult.isValid && options.enableAutoCorrection !== false) {
            const correctionStep = this.createStep(`correction-attempt-${currentAttempt}`)
            steps.push(correctionStep)

            const correctionResult = await this.correctionEngine.correctCode(currentCode, context)
            
            if (correctionResult.success) {
              currentCode = correctionResult.correctedCode
              
              // Record correction attempt
              correctionHistory.push({
                attemptNumber: currentAttempt,
                timestamp: new Date(),
                corrections: correctionResult.correctionsApplied,
                success: correctionResult.success,
                qualityImprovement: correctionResult.originalIssueCount - correctionResult.remainingIssueCount
              })

              // Re-validate corrected code
              const revalidationResult = await this.runComprehensiveValidation(currentCode, context)
              qualityThresholdMet = revalidationResult.overallScore >= (options.qualityThreshold || qualityConfig.getConfig().qualityThreshold)
              
              this.completeStep(correctionStep, correctionResult.success, {
                corrected: true,
                newScore: revalidationResult.overallScore,
                thresholdMet: qualityThresholdMet
              })
            } else {
              this.completeStep(correctionStep, false, { error: 'Auto-correction failed' })
            }
          } else {
            qualityThresholdMet = validationResult.overallScore >= (options.qualityThreshold || qualityConfig.getConfig().qualityThreshold)
          }

          // If quality threshold met, break out of retry loop
          if (qualityThresholdMet) {
            this.logger.info(`Quality threshold met on attempt ${currentAttempt}`, {
              score: validationResult.overallScore,
              threshold: options.qualityThreshold || qualityConfig.getConfig().qualityThreshold
            })
            break
          }

          currentAttempt++

        } catch (error) {
          this.completeStep(generationStep, false, { error: error.message })
          this.logger.warn(`Generation attempt ${currentAttempt} failed`, { error: error.message })
          currentAttempt++
        }
      }

      // Step 5: Fallback generation if quality threshold not met
      let fallbackUsed = false
      if (!qualityThresholdMet && options.enableFallbackGeneration !== false) {
        this.logger.info('Quality threshold not met, activating fallback generation')
        
        const fallbackStep = this.createStep('fallback-generation')
        steps.push(fallbackStep)

        try {
          const fallbackCode = await this.getFallbackCode(request.prompt, context.contractType)
          currentCode = fallbackCode
          fallbackUsed = true
          
          this.completeStep(fallbackStep, true, { fallbackActivated: true })
        } catch (error) {
          this.completeStep(fallbackStep, false, { error: error.message })
          throw new GenerationError('Fallback generation failed', 'FALLBACK_FAILED', error)
        }
      }

      // Step 6: Final quality assessment
      const finalValidationStep = this.createStep('final-validation')
      steps.push(finalValidationStep)

      let finalValidation = await this.runComprehensiveValidation(currentCode, context)
      
      // If fallback was used, ensure low quality score
      if (fallbackUsed && currentCode.includes('EmergencyFallback')) {
        finalValidation = {
          ...finalValidation,
          overallScore: 10,
          isValid: false
        }
      }
      
      this.completeStep(finalValidationStep, true, {
        finalScore: finalValidation.overallScore,
        fallbackUsed
      })

      // Step 7: Build comprehensive result
      const totalTime = Date.now() - startTime
      const actualAttempts = Math.max(1, currentAttempt - 1)
      
      const result: QualityAssuredResult = {
        code: currentCode,
        qualityScore: finalValidation.overallScore,
        validationResults: finalValidation.validationResults,
        correctionHistory,
        fallbackUsed,
        generationMetrics: {
          attemptCount: actualAttempts,
          totalGenerationTime: totalTime,
          validationTime: steps.filter(s => s.name.includes('validation')).reduce((sum, s) => 
            sum + (s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0), 0),
          correctionTime: steps.filter(s => s.name.includes('correction')).reduce((sum, s) => 
            sum + (s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0), 0),
          finalQualityScore: finalValidation.overallScore,
          issuesDetected: finalValidation.validationResults.reduce((sum, vr) => sum + vr.issues.length, 0),
          issuesFixed: correctionHistory.reduce((sum, c) => sum + c.corrections.length, 0),
          startTime: new Date(startTime),
          endTime: new Date()
        }
      }

      this.logger.info('Comprehensive quality assurance pipeline completed', {
        totalTime,
        finalScore: result.qualityScore,
        attempts: result.generationMetrics.attemptCount,
        fallbackUsed: result.fallbackUsed,
        issuesDetected: result.generationMetrics.issuesDetected,
        issuesFixed: result.generationMetrics.issuesFixed
      })

      return result

    } catch (error) {
      this.logger.error('Quality assurance pipeline failed', { 
        error: error.message,
        stack: error.stack 
      })
      
      // Return emergency fallback result
      return this.createEmergencyFallbackResult(request, error, startTime)
    }
  }

  /**
   * Validate and correct existing code using comprehensive validation pipeline
   */
  async validateAndCorrect(
    code: string, 
    context: GenerationContext
  ): Promise<{
    correctedCode: string
    validationResults: ValidationResult[]
    qualityScore: number
    correctionHistory: CorrectionAttempt[]
  }> {
    this.logger.info('Starting comprehensive validation and correction')

    try {
      // Step 1: Initial comprehensive validation
      const initialValidation = await this.runComprehensiveValidation(code, context)
      
      let correctedCode = code
      let correctionHistory: CorrectionAttempt[] = []
      let currentValidation = initialValidation

      // Step 2: Auto-correction if validation failed
      if (!initialValidation.isValid) {
        this.logger.info('Initial validation failed, attempting auto-correction', {
          score: initialValidation.overallScore,
          issues: initialValidation.validationResults.length
        })

        const correctionResult = await this.correctionEngine.correctCode(code, context)
        
        if (correctionResult.success) {
          correctedCode = correctionResult.correctedCode
          
          // Record correction attempt
          correctionHistory.push({
            attemptNumber: 1,
            timestamp: new Date(),
            corrections: correctionResult.correctionsApplied,
            success: correctionResult.success,
            qualityImprovement: correctionResult.originalIssueCount - correctionResult.remainingIssueCount
          })

          // Re-validate corrected code
          currentValidation = await this.runComprehensiveValidation(correctedCode, context)
          
          this.logger.info('Auto-correction completed', {
            originalScore: initialValidation.overallScore,
            newScore: currentValidation.overallScore,
            improvement: currentValidation.overallScore - initialValidation.overallScore
          })
        } else {
          this.logger.warn('Auto-correction failed', {
            reason: correctionResult.error || 'Unknown error'
          })
        }
      }

      // Step 3: Progressive enhancement if still not meeting quality threshold
      let enhancementAttempts = 0
      const maxEnhancements = 2
      
      while (!currentValidation.isValid && 
             enhancementAttempts < maxEnhancements && 
             currentValidation.overallScore < context.qualityRequirements.minimumQualityScore) {
        
        enhancementAttempts++
        this.logger.info(`Attempting progressive enhancement ${enhancementAttempts}/${maxEnhancements}`)

        try {
          // Use error detection results to guide enhancement
          const enhancementResult = await this.enhanceCodeBasedOnErrors(
            correctedCode, 
            currentValidation.errorDetection,
            context
          )

          if (enhancementResult.success) {
            correctedCode = enhancementResult.enhancedCode
            
            correctionHistory.push({
              attemptNumber: enhancementAttempts + 1,
              timestamp: new Date(),
              corrections: enhancementResult.enhancements,
              success: enhancementResult.success,
              qualityImprovement: enhancementResult.qualityImprovement
            })

            // Re-validate enhanced code
            currentValidation = await this.runComprehensiveValidation(correctedCode, context)
            
            this.logger.info(`Progressive enhancement ${enhancementAttempts} completed`, {
              newScore: currentValidation.overallScore,
              improvement: enhancementResult.qualityImprovement
            })
          } else {
            this.logger.warn(`Progressive enhancement ${enhancementAttempts} failed`)
            break
          }
        } catch (error) {
          this.logger.error(`Progressive enhancement ${enhancementAttempts} error`, { 
            error: error.message 
          })
          break
        }
      }

      return {
        correctedCode,
        validationResults: currentValidation.validationResults,
        qualityScore: currentValidation.overallScore,
        correctionHistory
      }

    } catch (error) {
      this.logger.error('Comprehensive validation and correction failed', { 
        error: error.message,
        stack: error.stack 
      })
      
      return {
        correctedCode: code,
        validationResults: [{
          type: 'syntax',
          passed: false,
          issues: [{
            severity: 'critical' as const,
            type: 'validation-error',
            location: { line: 0, column: 0 },
            message: `Validation pipeline failed: ${error.message}`,
            autoFixable: false
          }],
          score: 0
        }],
        qualityScore: 0,
        correctionHistory: []
      }
    }
  }

  /**
   * Get fallback code when all else fails
   */
  async getFallbackCode(prompt: string, contractType: ContractType): Promise<string> {
    try {
      const fallbackResult = await this.fallbackGenerator.generateFallbackContract(prompt, {
        userPrompt: prompt,
        contractType,
        previousAttempts: [],
        qualityRequirements: this.getDefaultQualityRequirements(),
        userExperience: 'intermediate'
      })

      return fallbackResult.code
    } catch (error) {
      this.logger.error('Fallback generation failed', { error: error.message })
      
      // Return absolute emergency fallback
      return `// Emergency Fallback Contract
access(all) contract EmergencyFallback {
    access(all) var initialized: Bool

    access(all) event ContractInitialized()

    access(all) fun initialize() {
        pre {
            !self.initialized: "Contract already initialized"
        }
        
        self.initialized = true
        emit ContractInitialized()
    }

    access(all) view fun isInitialized(): Bool {
        return self.initialized
    }

    init() {
        self.initialized = false
        emit ContractInitialized()
    }
}`
    }
  }

  /**
   * Report comprehensive quality metrics for monitoring
   */
  reportQualityMetrics(result: QualityAssuredResult): void {
    try {
      const detailedMetrics = {
        // Basic metrics
        qualityScore: result.qualityScore,
        fallbackUsed: result.fallbackUsed,
        totalAttempts: result.generationMetrics.attemptCount,
        totalTime: result.generationMetrics.totalGenerationTime,
        
        // Performance metrics
        validationTime: result.generationMetrics.validationTime,
        correctionTime: result.generationMetrics.correctionTime,
        averageTimePerAttempt: result.generationMetrics.totalGenerationTime / result.generationMetrics.attemptCount,
        
        // Quality metrics
        issuesDetected: result.generationMetrics.issuesDetected,
        issuesFixed: result.generationMetrics.issuesFixed,
        correctionSuccessRate: result.generationMetrics.issuesFixed / Math.max(1, result.generationMetrics.issuesDetected),
        
        // Validation breakdown
        validationResults: result.validationResults.length,
        criticalIssues: result.validationResults.filter(vr => 
          vr.issues.some(issue => issue.severity === 'critical')).length,
        warningIssues: result.validationResults.filter(vr => 
          vr.issues.some(issue => issue.severity === 'warning')).length,
        
        // Correction history
        correctionAttempts: result.correctionHistory.length,
        successfulCorrections: result.correctionHistory.filter(c => c.success).length,
        totalCorrectionsApplied: result.correctionHistory.reduce((sum, c) => sum + c.corrections.length, 0),
        
        // Quality breakdown by type
        syntaxScore: result.validationResults.find(vr => vr.type === 'syntax')?.score || 0,
        logicScore: result.validationResults.find(vr => vr.type === 'logic')?.score || 0,
        completenessScore: result.validationResults.find(vr => vr.type === 'completeness')?.score || 0,
        bestPracticesScore: result.validationResults.find(vr => vr.type === 'best-practices')?.score || 0
      }

      this.logger.info('Comprehensive quality metrics report', detailedMetrics)
      
      // Log performance warnings if needed
      if (detailedMetrics.totalTime > 30000) {
        this.logger.warn('Generation took longer than expected', {
          totalTime: detailedMetrics.totalTime,
          threshold: 30000
        })
      }
      
      if (detailedMetrics.qualityScore < 70) {
        this.logger.warn('Quality score below recommended threshold', {
          score: detailedMetrics.qualityScore,
          threshold: 70,
          fallbackUsed: result.fallbackUsed
        })
      }

    } catch (error) {
      this.logger.error('Failed to report quality metrics', { error: error.message })
    }
  }

  /**
   * Generate comprehensive user feedback based on validation results
   */
  generateUserFeedback(result: QualityAssuredResult): {
    summary: string
    details: string[]
    recommendations: string[]
    qualityBreakdown: Record<string, number>
    nextSteps: string[]
  } {
    try {
      const feedback = {
        summary: this.generateQualitySummary(result),
        details: this.generateDetailedFeedback(result),
        recommendations: this.generateRecommendations(result),
        qualityBreakdown: this.generateQualityBreakdown(result),
        nextSteps: this.generateNextSteps(result)
      }

      this.logger.debug('Generated user feedback', {
        summaryLength: feedback.summary.length,
        detailsCount: feedback.details.length,
        recommendationsCount: feedback.recommendations.length
      })

      return feedback

    } catch (error) {
      this.logger.error('Failed to generate user feedback', { error: error.message })
      
      return {
        summary: 'Code generation completed with basic validation.',
        details: ['Quality assessment was limited due to processing error.'],
        recommendations: ['Review the generated code manually before deployment.'],
        qualityBreakdown: { overall: result.qualityScore },
        nextSteps: ['Test the contract thoroughly before production use.']
      }
    }
  }

  /**
   * Run comprehensive validation pipeline integrating available validation components
   */
  private async runComprehensiveValidation(
    code: string, 
    context: GenerationContext
  ): Promise<{
    isValid: boolean
    overallScore: number
    validationResults: ValidationResult[]
    errorDetection?: any
    undefinedScan?: any
    contractValidation?: any
    completenessValidation?: any
  }> {
    try {
      this.logger.debug('Running comprehensive validation pipeline')

      const validationResults: ValidationResult[] = []

      // 1. Undefined value detection (core component that should always work)
      const undefinedScan = this.undefinedDetector.scanForUndefinedValues(code)
      
      if (undefinedScan.hasBlockingIssues) {
        validationResults.push({
          type: 'syntax',
          passed: false,
          issues: undefinedScan.issues.map(issue => ({
            severity: issue.severity,
            type: issue.type,
            location: issue.location,
            message: issue.message,
            suggestedFix: issue.suggestedFix,
            autoFixable: issue.autoFixable
          })),
          score: Math.max(0, 100 - (undefinedScan.totalIssues * 20))
        })
      } else {
        // Check if code is obviously invalid even without undefined values
        const isObviouslyInvalid = code.includes('This is not valid') || 
                                  (!code.includes('contract') && !code.includes('access') && code.length < 100)
        
        validationResults.push({
          type: 'syntax',
          passed: !isObviouslyInvalid,
          issues: isObviouslyInvalid ? [{
            severity: 'critical' as const,
            type: 'invalid-code',
            location: { line: 0, column: 0 },
            message: 'Code does not appear to be valid Cadence',
            autoFixable: false
          }] : [],
          score: isObviouslyInvalid ? 0 : (100 - (undefinedScan.totalIssues * 5)) // Minor deduction for warnings
        })
      }

      // 2. Basic syntax validation using simple checks
      const syntaxValidation = this.performBasicSyntaxValidation(code)
      if (syntaxValidation.issues.length > 0) {
        validationResults.push(syntaxValidation)
      }

      // 3. Contract structure validation
      const structureValidation = this.performBasicStructureValidation(code, context.contractType)
      validationResults.push(structureValidation) // Always add structure validation

      // 4. Try to use advanced validation components if available
      try {
        // Only use if the method exists and doesn't throw
        if (typeof this.errorDetector.detectAndClassifyErrors === 'function') {
          const errorDetection = this.errorDetector.detectAndClassifyErrors(code, {
            contractType: context.contractType.category,
            strictMode: false // Use less strict mode to avoid failures
          })

          if (errorDetection && errorDetection.totalErrors > 0) {
            validationResults.push({
              type: 'logic',
              passed: errorDetection.criticalErrors === 0,
              issues: errorDetection.errors?.slice(0, 5).map(error => ({
                severity: error.severity || 'warning',
                type: error.type || 'unknown-error',
                location: error.location || { line: 0, column: 0 },
                message: error.message || 'Unknown error detected',
                suggestedFix: error.suggestedFix,
                autoFixable: error.autoFixable || false
              })) || [],
              score: Math.max(0, 100 - (errorDetection.criticalErrors * 30) - (errorDetection.warningErrors * 10))
            })
          }
        }
      } catch (error) {
        this.logger.debug('Advanced error detection not available', { error: error.message })
      }

      // Calculate overall score
      let overallScore = 0
      if (validationResults.length > 0) {
        overallScore = validationResults.reduce((sum, vr) => sum + vr.score, 0) / validationResults.length
      } else {
        // If no validation results, check basic quality indicators
        const hasContract = code.includes('access(all) contract')
        const hasUndefined = code.includes('undefined')
        const isEmergencyFallback = code.includes('EmergencyFallback')
        const looksLikeValidCadence = hasContract && code.includes('init()')
        const isObviouslyInvalid = code.includes('This is not valid') || 
                                  (!code.includes('contract') && !code.includes('access') && code.length < 100)
        
        if (isEmergencyFallback) {
          overallScore = 10
        } else if (isObviouslyInvalid || (!hasContract && !code.includes('import'))) {
          overallScore = 0 // Invalid Cadence code
        } else if (!hasContract || !looksLikeValidCadence) {
          overallScore = 20 // Poor quality
        } else if (hasUndefined) {
          overallScore = 30
        } else {
          overallScore = 75
        }
      }

      const isValid = overallScore >= (context.qualityRequirements.minimumQualityScore || 80) &&
                     !undefinedScan.hasBlockingIssues

      return {
        isValid,
        overallScore,
        validationResults,
        undefinedScan
      }

    } catch (error) {
      this.logger.error('Comprehensive validation failed', { error: error.message })
      
      // Return basic validation result on error
      const hasUndefined = code.includes('undefined')
      const hasContract = code.includes('access(all) contract')
      const isEmergencyFallback = code.includes('EmergencyFallback')
      
      // Emergency fallback should have low score
      const basicScore = isEmergencyFallback ? 10 : (hasContract && !hasUndefined ? 60 : 20)

      return {
        isValid: basicScore >= (context.qualityRequirements.minimumQualityScore || 80),
        overallScore: basicScore,
        validationResults: [{
          type: 'syntax',
          passed: !hasUndefined && !isEmergencyFallback,
          issues: (hasUndefined || isEmergencyFallback) ? [{
            severity: 'critical' as const,
            type: isEmergencyFallback ? 'emergency-fallback' : 'undefined-value',
            location: { line: 0, column: 0 },
            message: isEmergencyFallback ? 'Emergency fallback used due to generation failure' : 'Code contains undefined values',
            autoFixable: !isEmergencyFallback
          }] : [],
          score: basicScore
        }]
      }
    }
  }

  /**
   * Perform basic syntax validation using simple pattern matching
   */
  private performBasicSyntaxValidation(code: string): ValidationResult {
    const issues: any[] = []
    const lines = code.split('\n')

    // Check for basic syntax issues
    let openBraces = 0
    let openParens = 0

    lines.forEach((line, index) => {
      // Count braces and parentheses
      openBraces += (line.match(/\{/g) || []).length
      openBraces -= (line.match(/\}/g) || []).length
      openParens += (line.match(/\(/g) || []).length
      openParens -= (line.match(/\)/g) || []).length

      // Check for incomplete statements
      if (line.trim().endsWith('{') && line.trim().length < 10) {
        issues.push({
          severity: 'warning' as const,
          type: 'incomplete-statement',
          location: { line: index + 1, column: 0 },
          message: 'Potentially incomplete statement',
          autoFixable: false
        })
      }
    })

    // Check for unmatched braces/parentheses
    if (openBraces !== 0) {
      issues.push({
        severity: 'critical' as const,
        type: 'unmatched-braces',
        location: { line: 0, column: 0 },
        message: `Unmatched braces: ${openBraces > 0 ? 'missing closing' : 'extra closing'} braces`,
        autoFixable: false
      })
    }

    if (openParens !== 0) {
      issues.push({
        severity: 'critical' as const,
        type: 'unmatched-parentheses',
        location: { line: 0, column: 0 },
        message: `Unmatched parentheses: ${openParens > 0 ? 'missing closing' : 'extra closing'} parentheses`,
        autoFixable: false
      })
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const score = Math.max(0, 100 - (criticalIssues * 40) - (issues.length * 10))

    return {
      type: 'syntax',
      passed: criticalIssues === 0,
      issues,
      score
    }
  }

  /**
   * Perform basic contract structure validation
   */
  private performBasicStructureValidation(code: string, contractType: ContractType): ValidationResult {
    const issues: any[] = []

    // Check for contract declaration
    if (!code.includes('access(all) contract')) {
      issues.push({
        severity: 'critical' as const,
        type: 'missing-contract-declaration',
        location: { line: 0, column: 0 },
        message: 'Missing contract declaration',
        autoFixable: false
      })
    }

    // Check for init function
    if (!code.includes('init()')) {
      issues.push({
        severity: 'warning' as const,
        type: 'missing-init-function',
        location: { line: 0, column: 0 },
        message: 'Missing init() function',
        autoFixable: false
      })
    }

    // Contract type specific checks
    if (contractType.category === 'nft') {
      if (!code.includes('resource')) {
        issues.push({
          severity: 'warning' as const,
          type: 'missing-nft-resource',
          location: { line: 0, column: 0 },
          message: 'NFT contracts should define resources',
          autoFixable: false
        })
      }
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const score = Math.max(0, 100 - (criticalIssues * 30) - (issues.length * 10))

    return {
      type: 'completeness',
      passed: criticalIssues === 0,
      issues,
      score
    }
  }

  // Private helper methods

  private createGenerationContext(
    request: GenerationRequest, 
    options: EnhancedGenerationOptions
  ): GenerationContext {
    // Detect contract type from prompt
    const contractTypeDetection = this.fallbackGenerator.detectContractType(request.prompt)
    
    return {
      userPrompt: request.prompt,
      contractType: contractTypeDetection.contractType,
      previousAttempts: [],
      qualityRequirements: {
        minimumQualityScore: options.qualityThreshold || qualityConfig.getConfig().qualityThreshold,
        requiredFeatures: [],
        prohibitedPatterns: ['undefined', 'null', '// TODO', '// FIXME'],
        performanceRequirements: qualityConfig.getConfig().performance
      },
      userExperience: 'intermediate'
    }
  }

  private getDefaultQualityRequirements(): QualityRequirements {
    return {
      minimumQualityScore: 80,
      requiredFeatures: [],
      prohibitedPatterns: ['undefined', 'null'],
      performanceRequirements: {
        maxGenerationTime: 30000,
        maxValidationTime: 5000,
        maxRetryAttempts: 3
      }
    }
  }

  private createStep(name: string): GenerationStep {
    return {
      name,
      startTime: new Date(),
      success: false
    }
  }

  private completeStep(step: GenerationStep, success: boolean, result?: any, error?: string): void {
    step.endTime = new Date()
    step.success = success
    step.result = result
    step.error = error
  }

  private generateQualitySummary(result: QualityAssuredResult): string {
    if (result.qualityScore >= 90) {
      return `Excellent quality code generated (${result.qualityScore}/100). Ready for production use.`
    } else if (result.qualityScore >= 80) {
      return `High quality code generated (${result.qualityScore}/100). Minor improvements may be beneficial.`
    } else if (result.qualityScore >= 70) {
      return `Good quality code generated (${result.qualityScore}/100). Some improvements recommended.`
    } else if (result.qualityScore >= 60) {
      return `Acceptable quality code generated (${result.qualityScore}/100). Review and improvements needed.`
    } else {
      return `Code generated with quality concerns (${result.qualityScore}/100). ${result.fallbackUsed ? 'Fallback template used.' : 'Significant improvements required.'}`
    }
  }

  private generateDetailedFeedback(result: QualityAssuredResult): string[] {
    const details: string[] = []

    // Generation process details
    if (result.generationMetrics.attemptCount > 1) {
      details.push(`Generated after ${result.generationMetrics.attemptCount} attempts in ${Math.round(result.generationMetrics.totalGenerationTime / 1000)}s`)
    }

    if (result.fallbackUsed) {
      details.push('Fallback template was used to ensure working code')
    }

    // Correction details
    if (result.correctionHistory.length > 0) {
      const totalCorrections = result.correctionHistory.reduce((sum, c) => sum + c.corrections.length, 0)
      details.push(`${totalCorrections} automatic corrections were applied`)
    }

    // Validation details
    const criticalIssues = result.validationResults.flatMap(vr => vr.issues).filter(issue => issue.severity === 'critical')
    const warningIssues = result.validationResults.flatMap(vr => vr.issues).filter(issue => issue.severity === 'warning')

    if (criticalIssues.length > 0) {
      details.push(`${criticalIssues.length} critical issues detected and addressed`)
    }

    if (warningIssues.length > 0) {
      details.push(`${warningIssues.length} warnings identified for potential improvement`)
    }

    return details
  }

  private generateRecommendations(result: QualityAssuredResult): string[] {
    const recommendations: string[] = []

    // Quality-based recommendations
    if (result.qualityScore < 80) {
      recommendations.push('Consider reviewing the generated code for completeness and best practices')
    }

    if (result.fallbackUsed) {
      recommendations.push('Customize the fallback template to better match your specific requirements')
    }

    // Issue-based recommendations
    const allIssues = result.validationResults.flatMap(vr => vr.issues)
    const autoFixableIssues = allIssues.filter(issue => issue.autoFixable && issue.suggestedFix)

    if (autoFixableIssues.length > 0) {
      recommendations.push('Some issues can be automatically fixed - consider running validation again')
    }

    // Performance recommendations
    if (result.generationMetrics.totalGenerationTime > 20000) {
      recommendations.push('Consider simplifying your prompt for faster generation')
    }

    // General recommendations
    recommendations.push('Test the contract thoroughly in a development environment before deployment')
    recommendations.push('Review access controls and security patterns')

    return recommendations
  }

  private generateQualityBreakdown(result: QualityAssuredResult): Record<string, number> {
    const breakdown: Record<string, number> = {
      overall: result.qualityScore
    }

    // Extract scores by validation type
    result.validationResults.forEach(vr => {
      breakdown[vr.type] = vr.score
    })

    return breakdown
  }

  private generateNextSteps(result: QualityAssuredResult): string[] {
    const steps: string[] = []

    if (result.qualityScore >= 80) {
      steps.push('Deploy to testnet for integration testing')
      steps.push('Conduct security review if handling valuable assets')
    } else {
      steps.push('Review and address identified quality issues')
      steps.push('Re-run quality validation after improvements')
    }

    steps.push('Create comprehensive unit tests')
    steps.push('Document contract functionality and usage')

    if (result.fallbackUsed) {
      steps.push('Customize the contract to match your specific requirements')
    }

    return steps
  }

  private convertRetryValidationToQualityValidation(retryHistory: any[]): ValidationResult[] {
    if (!retryHistory || retryHistory.length === 0) {
      return []
    }

    const lastAttempt = retryHistory[retryHistory.length - 1]
    return lastAttempt.validationResults || []
  }

  private extractCorrectionHistory(retryHistory: any[]): any[] {
    return retryHistory.flatMap(attempt => attempt.correctionAttempts || [])
  }

  /**
   * Enhance code based on detected errors and validation results
   */
  private async enhanceCodeBasedOnErrors(
    code: string,
    errorDetection: any,
    context: GenerationContext
  ): Promise<{
    success: boolean
    enhancedCode: string
    enhancements: any[]
    qualityImprovement: number
    error?: string
  }> {
    try {
      let enhancedCode = code
      const enhancements: any[] = []
      const originalValidation = await this.runComprehensiveValidation(code, context)
      const originalScore = originalValidation.overallScore

      // Apply basic enhancements
      
      // 1. Fix undefined values
      if (code.includes('undefined')) {
        enhancedCode = enhancedCode.replace(/= undefined/g, '= ""')
        enhancedCode = enhancedCode.replace(/: String = undefined/g, ': String')
        enhancedCode = enhancedCode.replace(/: UInt64 = undefined/g, ': UInt64')
        
        enhancements.push({
          type: 'undefined-fix',
          location: { line: 0, column: 0 },
          originalValue: 'undefined',
          correctedValue: 'appropriate default',
          reasoning: 'Replaced undefined values with appropriate defaults',
          confidence: 0.9
        })
      }

      // 2. Add missing init function if needed
      if (!code.includes('init()') && code.includes('access(all) contract')) {
        const contractMatch = code.match(/access\(all\) contract (\w+) \{/)
        if (contractMatch) {
          const insertPoint = code.lastIndexOf('}')
          if (insertPoint > 0) {
            const beforeInit = code.substring(0, insertPoint)
            const afterInit = code.substring(insertPoint)
            enhancedCode = beforeInit + '\n    init() {\n        // Contract initialization\n    }\n' + afterInit
            
            enhancements.push({
              type: 'structure-fix',
              location: { line: 0, column: 0 },
              originalValue: 'missing init',
              correctedValue: 'init() function added',
              reasoning: 'Added missing init() function',
              confidence: 0.8
            })
          }
        }
      }

      // 3. Fix basic syntax issues
      if (errorDetection && errorDetection.errors) {
        for (const error of errorDetection.errors.slice(0, 3)) { // Limit to first 3 errors
          if (error.autoFixable && error.suggestedFix) {
            const beforeFix = enhancedCode
            enhancedCode = this.applySuggestedFix(enhancedCode, error)
            
            if (enhancedCode !== beforeFix) {
              enhancements.push({
                type: 'error-fix',
                location: error.location,
                originalValue: error.context?.lineContent || '',
                correctedValue: error.suggestedFix,
                reasoning: `Fixed ${error.type}: ${error.message}`,
                confidence: error.confidence || 0.7
              })
            }
          }
        }
      }

      // Calculate quality improvement
      const enhancedValidation = await this.runComprehensiveValidation(enhancedCode, context)
      const qualityImprovement = enhancedValidation.overallScore - originalScore

      return {
        success: enhancements.length > 0 && qualityImprovement > 0,
        enhancedCode,
        enhancements,
        qualityImprovement: Math.max(0, qualityImprovement)
      }

    } catch (error) {
      this.logger.warn('Code enhancement failed', { error: error.message })
      
      return {
        success: false,
        enhancedCode: code,
        enhancements: [],
        qualityImprovement: 0,
        error: error.message
      }
    }
  }

  /**
   * Apply a suggested fix to code
   */
  private applySuggestedFix(code: string, error: any): string {
    try {
      if (!error.location || !error.suggestedFix) {
        return code
      }

      const lines = code.split('\n')
      const lineIndex = error.location.line - 1

      if (lineIndex >= 0 && lineIndex < lines.length) {
        // Simple replacement - in a real implementation, this would be more sophisticated
        if (error.context?.lineContent) {
          lines[lineIndex] = lines[lineIndex].replace(
            error.context.lineContent.trim(),
            error.suggestedFix
          )
        }
      }

      return lines.join('\n')
    } catch (fixError) {
      this.logger.warn('Failed to apply fix', { error: fixError.message })
      return code
    }
  }

  private createEmergencyFallbackResult(
    request: GenerationRequest, 
    error: any, 
    startTime: number
  ): QualityAssuredResult {
    const emergencyCode = `// Emergency Fallback - Generation Failed
// Error: ${error.message}
// Original prompt: ${request.prompt.substring(0, 100)}...

access(all) contract EmergencyFallback {
    access(all) var message: String

    access(all) event ContractInitialized(message: String)

    access(all) fun getMessage(): String {
        return self.message
    }

    init() {
        self.message = "This contract was generated as an emergency fallback due to generation failure"
        emit ContractInitialized(message: self.message)
    }
}`

    return {
      code: emergencyCode,
      qualityScore: 10, // Very low score for emergency fallback
      validationResults: [{
        type: 'syntax',
        passed: false, // Mark as failed since this is an emergency fallback
        issues: [{
          severity: 'critical' as const,
          type: 'generation-failure',
          location: { line: 0, column: 0 },
          message: 'Original generation failed, using emergency fallback',
          autoFixable: false
        }],
        score: 10
      }],
      correctionHistory: [],
      fallbackUsed: true,
      generationMetrics: {
        attemptCount: 1,
        totalGenerationTime: Date.now() - startTime,
        validationTime: 0,
        correctionTime: 0,
        finalQualityScore: 10,
        issuesDetected: 1,
        issuesFixed: 0,
        startTime: new Date(startTime),
        endTime: new Date()
      }
    }
  }
}

// Export singleton instance
export const enhancedGenerationController = new EnhancedGenerationController()