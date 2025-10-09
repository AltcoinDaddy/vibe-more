/**
 * Retry and Recovery System Integration Tests
 * 
 * Tests the comprehensive retry logic with progressive prompt enhancement,
 * automatic regeneration when validation fails, maximum retry limits with
 * fallback activation, and correction attempt tracking and analysis.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { RetryRecoverySystem, RetryAttempt, RetryResult } from '../retry-recovery-system'
import { 
  GenerationRequest, 
  GenerationContext, 
  ContractType, 
  QualityRequirements,
  ValidationResult,
  FailurePattern
} from '../types'
import { QualityConfigManager } from '../config'
import { FallbackGenerator } from '../fallback-generator'
import { QualityScoreCalculator } from '../quality-score-calculator'
import { UndefinedValueDetector } from '../undefined-value-detector'
import { AutoCorrectionEngine } from '../auto-correction-engine'

// Mock dependencies
vi.mock('../fallback-generator')
vi.mock('../quality-score-calculator')
vi.mock('../undefined-value-detector')
vi.mock('../auto-correction-engine')
vi.mock('../logger')

describe('RetryRecoverySystem', () => {
  let retrySystem: RetryRecoverySystem
  let mockFallbackGenerator: any
  let mockQualityCalculator: any
  let mockUndefinedDetector: any
  let mockCorrectionEngine: any
  let mockGenerationFunction: any

  const createTestContext = (): GenerationContext => ({
    userPrompt: 'Create an NFT contract',
    contractType: {
      category: 'nft',
      complexity: 'simple',
      features: ['minting', 'metadata']
    } as ContractType,
    previousAttempts: [],
    qualityRequirements: {
      minimumQualityScore: 80,
      requiredFeatures: ['complete-implementation'],
      prohibitedPatterns: ['undefined', 'pub '],
      performanceRequirements: {
        maxGenerationTime: 30000,
        maxValidationTime: 5000,
        maxRetryAttempts: 3
      }
    } as QualityRequirements,
    userExperience: 'intermediate'
  })

  const createTestRequest = (): GenerationRequest => ({
    prompt: 'Create a simple NFT contract with minting functionality',
    context: 'Flow blockchain NFT contract',
    temperature: 0.7,
    maxRetries: 3,
    strictMode: false
  })

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Create mock instances
    mockFallbackGenerator = {
      generateFallbackContract: vi.fn()
    }
    mockQualityCalculator = {
      calculateQualityScore: vi.fn()
    }
    mockUndefinedDetector = {
      detectUndefinedValues: vi.fn()
    }
    mockCorrectionEngine = {
      correctCode: vi.fn()
    }

    // Create retry system with mocked dependencies
    retrySystem = new RetryRecoverySystem(
      new QualityConfigManager(),
      mockFallbackGenerator,
      mockQualityCalculator,
      mockUndefinedDetector,
      mockCorrectionEngine
    )

    // Create mock generation function
    mockGenerationFunction = vi.fn()

    // Setup default mock behaviors
    mockUndefinedDetector.detectUndefinedValues.mockReturnValue([])
    mockQualityCalculator.calculateQualityScore.mockReturnValue({
      overall: 85,
      syntax: 90,
      logic: 85,
      completeness: 80,
      bestPractices: 85,
      productionReadiness: 85
    })
    mockCorrectionEngine.correctCode.mockResolvedValue({
      correctedCode: 'corrected code',
      corrections: [],
      success: true,
      qualityImprovement: 10
    })
  })

  describe('Successful Generation on First Attempt', () => {
    test('should succeed immediately with high-quality code', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      // Mock successful generation
      mockGenerationFunction.mockResolvedValue(`
        access(all) contract SimpleNFT {
          access(all) var totalSupply: UInt64
          
          init() {
            self.totalSupply = 0
          }
          
          access(all) fun mintNFT(): @NFT {
            self.totalSupply = self.totalSupply + 1
            return <- create NFT(id: self.totalSupply)
          }
        }
        
        access(all) resource NFT {
          access(all) let id: UInt64
          
          init(id: UInt64) {
            self.id = id
          }
        }
      `)

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(1)
      expect(result.fallbackUsed).toBe(false)
      expect(result.finalQualityScore).toBe(85)
      expect(mockGenerationFunction).toHaveBeenCalledTimes(1)
    })

    test('should track generation metrics correctly', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      mockGenerationFunction.mockResolvedValue('access(all) contract Test { init() {} }')

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.metrics).toBeDefined()
      expect(result.metrics.attemptCount).toBe(1)
      expect(result.metrics.totalGenerationTime).toBeGreaterThan(0)
      expect(result.metrics.finalQualityScore).toBe(85)
      expect(result.metrics.issuesDetected).toBe(0)
    })
  })

  describe('Progressive Retry Logic', () => {
    test('should retry with enhanced prompts when quality is insufficient', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      // Mock first attempt with low quality, second with high quality
      mockGenerationFunction
        .mockResolvedValueOnce('access(all) contract Test { var value: String = undefined }')
        .mockResolvedValueOnce('access(all) contract Test { var value: String = "default"; init() {} }')

      // Mock undefined detection for first attempt
      mockUndefinedDetector.detectUndefinedValues
        .mockReturnValueOnce([{
          type: 'literal-undefined',
          location: { line: 1, column: 45 },
          context: 'var value: String = undefined',
          description: 'Undefined value detected',
          suggestedFix: 'Use concrete default value',
          autoFixable: true,
          severity: 'critical'
        }])
        .mockReturnValueOnce([])

      // Mock quality scores
      mockQualityCalculator.calculateQualityScore
        .mockReturnValueOnce({ overall: 30, syntax: 30, logic: 50, completeness: 20, bestPractices: 30, productionReadiness: 20 })
        .mockReturnValueOnce({ overall: 90, syntax: 95, logic: 90, completeness: 85, bestPractices: 90, productionReadiness: 90 })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(2)
      expect(result.fallbackUsed).toBe(false)
      expect(result.finalQualityScore).toBe(90)
      expect(mockGenerationFunction).toHaveBeenCalledTimes(2)

      // Verify progressive enhancement
      const firstCall = mockGenerationFunction.mock.calls[0]
      const secondCall = mockGenerationFunction.mock.calls[1]
      expect(secondCall[1]).toBeLessThan(firstCall[1]) // Temperature should decrease
    })

    test('should track failure patterns across attempts', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      // Mock multiple failed attempts
      mockGenerationFunction
        .mockResolvedValueOnce('access(all) contract Test { var value: String = undefined }')
        .mockResolvedValueOnce('access(all) contract Test { var value: String = ""; init() }') // Missing brace
        .mockResolvedValueOnce('access(all) contract Test { var value: String = ""; init() {} }')

      // Mock different types of failures
      mockUndefinedDetector.detectUndefinedValues
        .mockReturnValueOnce([{ type: 'literal-undefined', location: { line: 1, column: 45 }, context: '', description: 'Undefined value', suggestedFix: '', autoFixable: true, severity: 'critical' }])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])

      mockQualityCalculator.calculateQualityScore
        .mockReturnValueOnce({ overall: 30, syntax: 30, logic: 50, completeness: 20, bestPractices: 30, productionReadiness: 20 })
        .mockReturnValueOnce({ overall: 60, syntax: 50, logic: 70, completeness: 60, bestPractices: 60, productionReadiness: 50 })
        .mockReturnValueOnce({ overall: 90, syntax: 95, logic: 90, completeness: 85, bestPractices: 90, productionReadiness: 90 })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(3)
      expect(result.failurePatterns.length).toBeGreaterThan(0)
      expect(result.failurePatterns.some(p => p.type === 'undefined-value')).toBe(true)
    })

    test('should apply progressive enhancement levels correctly', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      // Mock failed attempts to trigger all enhancement levels
      mockGenerationFunction
        .mockResolvedValueOnce('bad code 1')
        .mockResolvedValueOnce('bad code 2')
        .mockResolvedValueOnce('bad code 3')
        .mockResolvedValueOnce('access(all) contract Perfect { init() {} }')

      mockQualityCalculator.calculateQualityScore
        .mockReturnValueOnce({ overall: 20, syntax: 20, logic: 20, completeness: 20, bestPractices: 20, productionReadiness: 20 })
        .mockReturnValueOnce({ overall: 30, syntax: 30, logic: 30, completeness: 30, bestPractices: 30, productionReadiness: 30 })
        .mockReturnValueOnce({ overall: 40, syntax: 40, logic: 40, completeness: 40, bestPractices: 40, productionReadiness: 40 })
        .mockReturnValueOnce({ overall: 95, syntax: 95, logic: 95, completeness: 95, bestPractices: 95, productionReadiness: 95 })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(4)
      
      // Verify enhancement levels progressed
      expect(result.retryHistory[0].enhancementLevel).toBe('basic')
      expect(result.retryHistory[1].enhancementLevel).toBe('moderate')
      expect(result.retryHistory[2].enhancementLevel).toBe('strict')
      expect(result.retryHistory[3].enhancementLevel).toBe('maximum')
    })
  })

  describe('Automatic Correction Integration', () => {
    test('should attempt auto-correction when quality is insufficient', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      mockGenerationFunction.mockResolvedValue('access(all) contract Test { var value: String = undefined }')
      
      // Mock undefined detection
      mockUndefinedDetector.detectUndefinedValues.mockReturnValue([{
        type: 'literal-undefined',
        location: { line: 1, column: 45 },
        context: 'var value: String = undefined',
        description: 'Undefined value detected',
        suggestedFix: 'Use concrete default value',
        autoFixable: true,
        severity: 'critical'
      }])

      // Mock low quality score to trigger correction
      mockQualityCalculator.calculateQualityScore
        .mockReturnValueOnce({ overall: 40, syntax: 40, logic: 50, completeness: 30, bestPractices: 40, productionReadiness: 30 })
        .mockReturnValueOnce({ overall: 85, syntax: 90, logic: 85, completeness: 80, bestPractices: 85, productionReadiness: 85 })

      // Mock successful correction
      mockCorrectionEngine.correctCode.mockResolvedValue({
        correctedCode: 'access(all) contract Test { var value: String = ""; init() {} }',
        corrections: [{
          type: 'undefined-fix',
          location: { line: 1, column: 45 },
          originalValue: 'undefined',
          correctedValue: '""',
          reasoning: 'Replaced undefined with empty string default',
          confidence: 0.9
        }],
        success: true,
        qualityImprovement: 45
      })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(1)
      expect(result.retryHistory[0].correctionAttempts).toHaveLength(1)
      expect(result.retryHistory[0].correctionAttempts[0].success).toBe(true)
      expect(mockCorrectionEngine.correctCode).toHaveBeenCalledTimes(1)
    })

    test('should continue to next attempt if correction fails', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      mockGenerationFunction
        .mockResolvedValueOnce('bad code')
        .mockResolvedValueOnce('access(all) contract Good { init() {} }')

      mockQualityCalculator.calculateQualityScore
        .mockReturnValueOnce({ overall: 40, syntax: 40, logic: 50, completeness: 30, bestPractices: 40, productionReadiness: 30 })
        .mockReturnValueOnce({ overall: 40, syntax: 40, logic: 50, completeness: 30, bestPractices: 40, productionReadiness: 30 }) // After failed correction
        .mockReturnValueOnce({ overall: 90, syntax: 95, logic: 90, completeness: 85, bestPractices: 90, productionReadiness: 90 })

      // Mock failed correction
      mockCorrectionEngine.correctCode.mockResolvedValue({
        correctedCode: 'still bad code',
        corrections: [],
        success: false,
        qualityImprovement: 0
      })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(2)
      expect(result.retryHistory[0].correctionAttempts[0].success).toBe(false)
      expect(mockGenerationFunction).toHaveBeenCalledTimes(2)
    })
  })

  describe('Fallback Activation', () => {
    test('should activate fallback when all retry attempts fail', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      // Mock all attempts failing
      mockGenerationFunction
        .mockResolvedValueOnce('bad code 1')
        .mockResolvedValueOnce('bad code 2')
        .mockResolvedValueOnce('bad code 3')

      mockQualityCalculator.calculateQualityScore
        .mockReturnValue({ overall: 30, syntax: 30, logic: 30, completeness: 30, bestPractices: 30, productionReadiness: 30 })

      // Mock successful fallback
      mockFallbackGenerator.generateFallbackContract.mockResolvedValue(`
        access(all) contract FallbackNFT {
          access(all) var totalSupply: UInt64
          
          init() {
            self.totalSupply = 0
          }
        }
      `)

      // Mock fallback validation
      mockQualityCalculator.calculateQualityScore
        .mockReturnValueOnce({ overall: 30, syntax: 30, logic: 30, completeness: 30, bestPractices: 30, productionReadiness: 30 })
        .mockReturnValueOnce({ overall: 30, syntax: 30, logic: 30, completeness: 30, bestPractices: 30, productionReadiness: 30 })
        .mockReturnValueOnce({ overall: 30, syntax: 30, logic: 30, completeness: 30, bestPractices: 30, productionReadiness: 30 })
        .mockReturnValueOnce({ overall: 85, syntax: 90, logic: 85, completeness: 80, bestPractices: 85, productionReadiness: 85 })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.fallbackUsed).toBe(true)
      expect(result.totalAttempts).toBe(4) // 3 failed attempts + 1 fallback
      expect(result.recoveryStrategiesUsed).toContain('fallback-generation')
      expect(mockFallbackGenerator.generateFallbackContract).toHaveBeenCalledWith(
        request.prompt,
        context.contractType
      )
    })

    test('should return failure if fallback also fails', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      // Mock all attempts failing
      mockGenerationFunction
        .mockResolvedValue('bad code')

      mockQualityCalculator.calculateQualityScore
        .mockReturnValue({ overall: 30, syntax: 30, logic: 30, completeness: 30, bestPractices: 30, productionReadiness: 30 })

      // Mock fallback failure
      mockFallbackGenerator.generateFallbackContract.mockRejectedValue(new Error('Fallback generation failed'))

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(false)
      expect(result.fallbackUsed).toBe(false)
      expect(result.totalAttempts).toBe(3) // Only the failed attempts
      expect(result.finalCode).toBe('bad code') // Best attempt
    })
  })

  describe('Recovery Strategies', () => {
    test('should apply recovery strategies when conditions are met', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      // Mock first attempt with undefined values, second with success after recovery
      mockGenerationFunction
        .mockResolvedValueOnce('access(all) contract Test { var value: String = undefined }')

      mockUndefinedDetector.detectUndefinedValues
        .mockReturnValueOnce([{
          type: 'literal-undefined',
          location: { line: 1, column: 45 },
          context: 'var value: String = undefined',
          description: 'Undefined value detected',
          suggestedFix: 'Use concrete default value',
          autoFixable: true,
          severity: 'critical'
        }])

      mockQualityCalculator.calculateQualityScore
        .mockReturnValueOnce({ overall: 30, syntax: 30, logic: 50, completeness: 20, bestPractices: 30, productionReadiness: 20 })

      // Mock correction failure to trigger recovery strategy
      mockCorrectionEngine.correctCode.mockResolvedValue({
        correctedCode: 'still bad',
        corrections: [],
        success: false,
        qualityImprovement: 0
      })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.totalAttempts).toBeGreaterThan(0)
      expect(result.failurePatterns.some(p => p.type === 'undefined-value')).toBe(true)
    })
  })

  describe('Timeout Handling', () => {
    test('should handle generation timeouts gracefully', async () => {
      const request = { ...createTestRequest(), maxRetries: 2 }
      const context = createTestContext()
      
      // Mock timeout on first attempt, success on second
      mockGenerationFunction
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve('delayed'), 100)))
        .mockResolvedValueOnce('access(all) contract Success { init() {} }')

      // Set very short timeout for testing
      const shortTimeoutSystem = new RetryRecoverySystem(
        new QualityConfigManager({ performance: { maxGenerationTime: 50, maxValidationTime: 1000, maxRetryAttempts: 2 } })
      )

      const result = await shortTimeoutSystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.totalAttempts).toBe(2)
      expect(result.retryHistory[0].failureReasons).toContain('generation-error')
    })
  })

  describe('Statistics and Analysis', () => {
    test('should calculate retry statistics correctly', () => {
      const retryHistory: RetryAttempt[] = [
        {
          attemptNumber: 1,
          timestamp: new Date(),
          prompt: 'test',
          enhancedPrompt: 'enhanced test',
          generatedCode: 'code1',
          validationResults: [],
          qualityScore: 30,
          correctionAttempts: [{ attemptNumber: 1, timestamp: new Date(), corrections: [], success: false, qualityImprovement: 0 }],
          success: false,
          failureReasons: ['undefined-value', 'syntax-error'],
          enhancementLevel: 'basic',
          temperature: 0.7,
          processingTime: 1000
        },
        {
          attemptNumber: 2,
          timestamp: new Date(),
          prompt: 'test',
          enhancedPrompt: 'enhanced test 2',
          generatedCode: 'code2',
          validationResults: [],
          qualityScore: 60,
          correctionAttempts: [{ attemptNumber: 1, timestamp: new Date(), corrections: [], success: true, qualityImprovement: 20 }],
          success: false,
          failureReasons: ['incomplete-logic'],
          enhancementLevel: 'moderate',
          temperature: 0.5,
          processingTime: 1200
        },
        {
          attemptNumber: 3,
          timestamp: new Date(),
          prompt: 'test',
          enhancedPrompt: 'enhanced test 3',
          generatedCode: 'code3',
          validationResults: [],
          qualityScore: 90,
          correctionAttempts: [],
          success: true,
          failureReasons: [],
          enhancementLevel: 'strict',
          temperature: 0.3,
          processingTime: 800
        }
      ]

      const stats = retrySystem.getRetryStatistics(retryHistory)

      expect(stats.averageQualityImprovement).toBe(30) // (90-30)/2
      expect(stats.mostCommonFailures).toContain('undefined-value')
      expect(stats.enhancementEffectiveness.moderate).toBe(30) // 60-30
      expect(stats.enhancementEffectiveness.strict).toBe(30) // 90-60
      expect(stats.correctionSuccessRate).toBe(0.5) // 1 success out of 2 attempts
    })

    test('should handle empty retry history', () => {
      const stats = retrySystem.getRetryStatistics([])

      expect(stats.averageQualityImprovement).toBe(0)
      expect(stats.mostCommonFailures).toEqual([])
      expect(stats.enhancementEffectiveness).toEqual({})
      expect(stats.correctionSuccessRate).toBe(0)
    })
  })

  describe('Error Handling', () => {
    test('should handle generation function errors gracefully', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      mockGenerationFunction
        .mockRejectedValueOnce(new Error('AI service unavailable'))
        .mockResolvedValueOnce('access(all) contract Recovery { init() {} }')

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.totalAttempts).toBe(2)
      expect(result.retryHistory[0].failureReasons).toContain('generation-error')
      expect(result.success).toBe(true) // Should recover on second attempt
    })

    test('should handle validation errors gracefully', async () => {
      const request = createTestRequest()
      const context = createTestContext()
      
      mockGenerationFunction.mockResolvedValue('access(all) contract Test { init() {} }')
      
      // Mock validation error
      mockUndefinedDetector.detectUndefinedValues.mockImplementation(() => {
        throw new Error('Validation service error')
      })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      // Should still attempt to continue despite validation errors
      expect(result.totalAttempts).toBeGreaterThan(0)
    })
  })

  describe('Configuration Integration', () => {
    test('should respect custom retry configuration', async () => {
      const customConfig = new QualityConfigManager({
        maxRetryAttempts: 5,
        qualityThreshold: 95,
        enableAutoCorrection: false,
        enableFallbackGeneration: false
      })

      const customRetrySystem = new RetryRecoverySystem(customConfig)
      const request = createTestRequest()
      const context = createTestContext()
      
      // Mock all attempts failing with quality below threshold
      mockGenerationFunction.mockResolvedValue('mediocre code')
      mockQualityCalculator.calculateQualityScore.mockReturnValue({
        overall: 85, // Below custom threshold of 95
        syntax: 85,
        logic: 85,
        completeness: 85,
        bestPractices: 85,
        productionReadiness: 85
      })

      const result = await customRetrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.totalAttempts).toBe(5) // Should use custom max attempts
      expect(result.success).toBe(false) // Should fail due to high threshold
      expect(result.fallbackUsed).toBe(false) // Fallback disabled
    })
  })
})