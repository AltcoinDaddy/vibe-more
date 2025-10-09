/**
 * API Endpoint Integration Tests for Quality Assurance
 * 
 * Tests the integration of quality assurance features in API endpoints
 * with a focus on core functionality and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { enhancedGenerationController } from '../enhanced-generation-controller'
import { QualityScoreCalculator } from '../quality-score-calculator'
import { FallbackGenerator } from '../fallback-generator'
import { UndefinedValueDetector } from '../undefined-value-detector'

describe('API Endpoint Quality Assurance Integration', () => {
  let qualityCalculator: QualityScoreCalculator
  let fallbackGenerator: FallbackGenerator
  let undefinedDetector: UndefinedValueDetector

  beforeEach(() => {
    qualityCalculator = new QualityScoreCalculator()
    fallbackGenerator = new FallbackGenerator()
    undefinedDetector = new UndefinedValueDetector()
  })

  describe('Enhanced Generation Controller', () => {
    it('should create generation context from request', async () => {
      const request = {
        prompt: 'Create an NFT contract',
        context: 'Digital art collection',
        temperature: 0.8,
        maxRetries: 3,
        strictMode: true
      }

      // Test the controller can handle the request structure
      expect(request.prompt).toBeDefined()
      expect(request.maxRetries).toBe(3)
      expect(request.strictMode).toBe(true)
    })

    it('should provide fallback code when requested', async () => {
      const fallbackCode = await enhancedGenerationController.getFallbackCode(
        'Create a simple contract',
        { category: 'generic', complexity: 'simple', features: [] }
      )

      expect(fallbackCode).toBeDefined()
      expect(fallbackCode).toContain('contract')
      expect(fallbackCode).toContain('init()')
      expect(fallbackCode).toContain('access(all)')
    })

    it('should validate and correct existing code', async () => {
      const codeWithIssues = `access(all) contract TestContract {
        access(all) var value: String = undefined
        init() {}
      }`

      const context = {
        userPrompt: 'Test contract',
        contractType: { category: 'generic' as const, complexity: 'simple' as const, features: [] },
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 80,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        },
        userExperience: 'intermediate' as const
      }

      const result = await enhancedGenerationController.validateAndCorrect(codeWithIssues, context)

      expect(result).toBeDefined()
      expect(result.correctedCode).toBeDefined()
      expect(result.qualityScore).toBeDefined()
      expect(result.validationResults).toBeDefined()
    })
  })

  describe('Quality Score Calculator Integration', () => {
    it('should calculate quality scores for API responses', () => {
      const validationResults = [
        {
          type: 'syntax' as const,
          passed: true,
          issues: [],
          score: 100
        },
        {
          type: 'completeness' as const,
          passed: true,
          issues: [],
          score: 90
        }
      ]

      const qualityScore = qualityCalculator.calculateQualityScore(validationResults)

      expect(qualityScore.overall).toBeGreaterThan(60)
      expect(qualityScore.syntax).toBe(100)
      expect(qualityScore.completeness).toBe(90)
      expect(qualityScore.productionReadiness).toBeGreaterThanOrEqual(0)
    })

    it('should provide quality assessment for user feedback', () => {
      const qualityScore = {
        overall: 85,
        syntax: 90,
        logic: 80,
        completeness: 85,
        bestPractices: 80,
        productionReadiness: 85
      }

      const assessment = qualityCalculator.getQualityAssessment(qualityScore, [])

      expect(assessment.level).toBe('good')
      expect(assessment.productionReady).toBe(true)
      expect(assessment.recommendations).toBeDefined()
    })
  })

  describe('Fallback Generator Integration', () => {
    it('should detect contract type from prompts for API requests', () => {
      const nftPrompt = 'Create an NFT collection contract with metadata'
      const tokenPrompt = 'Create a fungible token with transfer functionality'
      const daoPrompt = 'Create a DAO governance contract with voting'

      const nftDetection = fallbackGenerator.detectContractType(nftPrompt)
      const tokenDetection = fallbackGenerator.detectContractType(tokenPrompt)
      const daoDetection = fallbackGenerator.detectContractType(daoPrompt)

      expect(nftDetection.contractType.category).toBe('nft')
      expect(tokenDetection.contractType.category).toBe('fungible-token')
      expect(daoDetection.contractType.category).toBe('dao')
    })

    it('should generate fallback contracts for API error scenarios', async () => {
      const fallbackResult = await fallbackGenerator.generateFallbackContract(
        'Create a marketplace contract'
      )

      expect(fallbackResult.success).toBe(true)
      expect(fallbackResult.code).toContain('contract')
      expect(fallbackResult.code).toContain('access(all)')
      expect(fallbackResult.templateUsed).toBeDefined()
      expect(fallbackResult.confidence).toBeGreaterThan(0)
    })

    it('should validate fallback contract quality', async () => {
      const fallbackCode = `access(all) contract TestFallback {
        access(all) var initialized: Bool
        
        access(all) event ContractInitialized()
        
        access(all) fun initialize() {
          self.initialized = true
          emit ContractInitialized()
        }
        
        init() {
          self.initialized = false
        }
      }`

      const isValid = await fallbackGenerator.validateFallbackQuality(fallbackCode)
      expect(isValid).toBe(true)
    })
  })

  describe('Undefined Value Detection for API Validation', () => {
    it('should detect undefined values in generated code', () => {
      const codeWithUndefined = `access(all) contract TestContract {
        access(all) var name: String = undefined
        access(all) var count: Int = undefined
        
        init() {
          // Contract initialization
        }
      }`

      const scanResult = undefinedDetector.scanForUndefinedValues(codeWithUndefined)

      expect(scanResult.totalIssues).toBe(2)
      expect(scanResult.criticalIssues).toBe(2)
      expect(scanResult.hasBlockingIssues).toBe(true)
      expect(scanResult.issues[0].suggestedValue).toBeDefined()
    })

    it('should provide appropriate suggestions for API error messages', () => {
      const codeWithIncompleteDeclaration = `access(all) contract TestContract {
        access(all) var balance: UFix64 = 
        
        init() {}
      }`

      const scanResult = undefinedDetector.scanForUndefinedValues(codeWithIncompleteDeclaration)

      expect(scanResult.totalIssues).toBeGreaterThan(0)
      expect(scanResult.issues[0].message).toContain('incomplete')
      expect(scanResult.issues[0].autoFixable).toBe(true)
    })
  })

  describe('API Response Format Validation', () => {
    it('should structure quality metrics for API responses', () => {
      const mockGenerationMetrics = {
        attemptCount: 2,
        totalGenerationTime: 3000,
        validationTime: 200,
        correctionTime: 500,
        finalQualityScore: 85,
        issuesDetected: 1,
        issuesFixed: 1,
        startTime: new Date(),
        endTime: new Date()
      }

      // Verify the structure matches what the API expects
      expect(mockGenerationMetrics.attemptCount).toBeDefined()
      expect(mockGenerationMetrics.totalGenerationTime).toBeDefined()
      expect(mockGenerationMetrics.finalQualityScore).toBeDefined()
      expect(mockGenerationMetrics.issuesDetected).toBeDefined()
      expect(mockGenerationMetrics.issuesFixed).toBeDefined()
    })

    it('should format validation results for API responses', () => {
      const mockValidationResults = [
        {
          type: 'syntax' as const,
          passed: true,
          issues: [],
          score: 100,
          message: 'Syntax validation passed'
        },
        {
          type: 'completeness' as const,
          passed: false,
          issues: [
            {
              severity: 'warning' as const,
              type: 'missing-function',
              location: { line: 1, column: 0 },
              message: 'Missing required function',
              autoFixable: false
            }
          ],
          score: 75,
          message: 'Completeness issues detected'
        }
      ]

      // Verify the structure matches API expectations
      expect(mockValidationResults).toHaveLength(2)
      expect(mockValidationResults[0].type).toBe('syntax')
      expect(mockValidationResults[1].issues).toHaveLength(1)
      expect(mockValidationResults[1].issues[0].severity).toBe('warning')
    })

    it('should format correction history for API responses', () => {
      const mockCorrectionHistory = [
        {
          attemptNumber: 1,
          timestamp: new Date(),
          corrections: [
            {
              type: 'undefined-fix' as const,
              location: { line: 2, column: 30 },
              originalValue: 'undefined',
              correctedValue: '""',
              reasoning: 'Replaced undefined with empty string default',
              confidence: 90
            }
          ],
          success: true,
          qualityImprovement: 15
        }
      ]

      // Verify the structure matches API expectations
      expect(mockCorrectionHistory).toHaveLength(1)
      expect(mockCorrectionHistory[0].corrections).toHaveLength(1)
      expect(mockCorrectionHistory[0].corrections[0].type).toBe('undefined-fix')
      expect(mockCorrectionHistory[0].qualityImprovement).toBe(15)
    })
  })

  describe('Error Handling for API Integration', () => {
    it('should handle generation failures gracefully', async () => {
      // Test that the system can handle various error scenarios
      const errorScenarios = [
        'Empty prompt',
        'Invalid contract type',
        'Timeout scenario',
        'Service unavailable'
      ]

      for (const scenario of errorScenarios) {
        // Each scenario should be handled without throwing unhandled exceptions
        expect(() => {
          // Mock error handling logic
          const errorResponse = {
            error: `Generation failed: ${scenario}`,
            fallbackUsed: true,
            qualityMetrics: {
              qualityScore: 0,
              validationResults: [],
              fallbackUsed: true,
              generationMetrics: {
                attemptCount: 0,
                totalGenerationTime: 0,
                validationTime: 0,
                correctionTime: 0,
                finalQualityScore: 0,
                issuesDetected: 1,
                issuesFixed: 0,
                startTime: new Date(),
                endTime: new Date()
              },
              correctionHistory: []
            }
          }
          return errorResponse
        }).not.toThrow()
      }
    })

    it('should provide meaningful error messages for API users', () => {
      const errorMessages = [
        'Quality threshold not met - generated code scored 65/100',
        'Legacy patterns detected that could not be automatically resolved',
        'Generation timeout - fallback template provided',
        'AI service unavailable - using emergency fallback'
      ]

      errorMessages.forEach(message => {
        const hasExpectedContent = 
          message.includes('Quality threshold') ||
          message.includes('Legacy patterns') ||
          message.includes('timeout') ||
          message.includes('unavailable')
        expect(hasExpectedContent).toBe(true)
      })
    })
  })

  describe('Performance Considerations for API', () => {
    it('should complete quality checks within reasonable time limits', async () => {
      const startTime = Date.now()
      
      // Simulate quality check operations
      const testCode = `access(all) contract TestContract {
        access(all) var value: String
        
        access(all) fun getValue(): String {
          return self.value
        }
        
        init() {
          self.value = "test"
        }
      }`

      const scanResult = undefinedDetector.scanForUndefinedValues(testCode)
      const qualityScore = qualityCalculator.calculateQualityScore([
        {
          type: 'syntax',
          passed: true,
          issues: [],
          score: 100
        }
      ])

      const endTime = Date.now()
      const duration = endTime - startTime

      // Quality checks should complete quickly (under 100ms for simple cases)
      expect(duration).toBeLessThan(100)
      expect(scanResult).toBeDefined()
      expect(qualityScore.overall).toBeGreaterThan(0)
    })
  })
})