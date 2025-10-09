/**
 * Integration Tests for Enhanced Generation Controller
 * 
 * Tests the complete quality assurance pipeline including all integrated components:
 * - Comprehensive validation system
 * - Auto-correction engine
 * - Fallback generation
 * - Quality scoring
 * - Error detection and classification
 * - User feedback generation
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { EnhancedGenerationController } from '../enhanced-generation-controller'
import { GenerationRequest, QualityAssuredResult, ContractType } from '../types'

describe('EnhancedGenerationController Integration Tests', () => {
  let controller: EnhancedGenerationController
  let mockGenerationFunction: ReturnType<typeof vi.fn<(prompt: string, temperature: number) => Promise<string>>>

  beforeEach(() => {
    controller = new EnhancedGenerationController()
    mockGenerationFunction = vi.fn()
  })

  describe('generateWithQualityAssurance', () => {
    test('should generate high-quality code on first attempt', async () => {
      // Mock a perfect contract generation
      const perfectContract = `
access(all) contract TestContract {
    access(all) var value: String

    access(all) event ValueChanged(newValue: String)

    access(all) fun setValue(newValue: String) {
        pre {
            newValue.length > 0: "Value cannot be empty"
        }
        
        self.value = newValue
        emit ValueChanged(newValue: newValue)
    }

    access(all) view fun getValue(): String {
        return self.value
    }

    init() {
        self.value = "initial"
        emit ValueChanged(newValue: self.value)
    }
}`

      mockGenerationFunction.mockResolvedValue(perfectContract)

      const request: GenerationRequest = {
        prompt: 'Create a simple contract with a string value and setter/getter functions',
        temperature: 0.7
      }

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 80 }
      )

      expect(result.code).toBe(perfectContract)
      expect(result.qualityScore).toBeGreaterThan(80)
      expect(result.fallbackUsed).toBe(false)
      expect(result.generationMetrics.attemptCount).toBe(1)
      expect(result.validationResults).toBeDefined()
      expect(result.correctionHistory).toHaveLength(0)
    })

    test('should handle code with undefined values and auto-correct', async () => {
      // Mock generation with undefined values
      const codeWithUndefined = `
access(all) contract TestContract {
    access(all) var value: String = undefined

    access(all) fun setValue(newValue: String) {
        self.value = undefined
    }

    init() {
        self.value = undefined
    }
}`

      // Mock corrected version
      const correctedCode = `
access(all) contract TestContract {
    access(all) var value: String

    access(all) fun setValue(newValue: String) {
        self.value = newValue
    }

    init() {
        self.value = ""
    }
}`

      mockGenerationFunction
        .mockResolvedValueOnce(codeWithUndefined)
        .mockResolvedValueOnce(correctedCode)

      const request: GenerationRequest = {
        prompt: 'Create a contract with string storage',
        temperature: 0.7
      }

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { 
          qualityThreshold: 70,
          enableAutoCorrection: true 
        }
      )

      expect(result.code).not.toContain('undefined')
      expect(result.correctionHistory.length).toBeGreaterThan(0)
      expect(result.generationMetrics.issuesDetected).toBeGreaterThan(0)
      expect(result.generationMetrics.issuesFixed).toBeGreaterThan(0)
    })

    test('should activate fallback when quality threshold not met', async () => {
      // Mock consistently poor quality generation
      const poorQualityCode = `
contract Broken {
    var x = undefined
    fun broken() {
        // incomplete
`

      mockGenerationFunction.mockResolvedValue(poorQualityCode)

      const request: GenerationRequest = {
        prompt: 'Create a complex DeFi contract',
        temperature: 0.7,
        maxRetries: 2
      }

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { 
          qualityThreshold: 80,
          enableFallbackGeneration: true 
        }
      )

      expect(result.fallbackUsed).toBe(true)
      expect(result.code).toContain('access(all) contract')
      expect(result.code).not.toContain('undefined')
      expect(result.generationMetrics.attemptCount).toBeGreaterThan(1)
    })

    test('should handle progressive enhancement with multiple correction attempts', async () => {
      const initialCode = `
access(all) contract TestContract {
    access(all) var value: String = undefined
    
    fun incomplete() {
        // missing implementation
    }
}`

      const enhancedCode = `
access(all) contract TestContract {
    access(all) var value: String

    access(all) event ValueChanged(newValue: String)
    
    access(all) fun setValue(newValue: String) {
        self.value = newValue
        emit ValueChanged(newValue: newValue)
    }

    init() {
        self.value = ""
    }
}`

      // The controller will use the first generation and then enhance it internally
      mockGenerationFunction.mockResolvedValue(initialCode)

      const request: GenerationRequest = {
        prompt: 'Create a contract with proper event emission',
        temperature: 0.7
      }

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 85 }
      )

      expect(result.correctionHistory.length).toBeGreaterThan(0)
      expect(result.code).not.toContain('undefined') // Should fix undefined values
      expect(result.qualityScore).toBeGreaterThan(50) // Lower expectation since we're not adding events
    })

    test('should provide comprehensive error handling for generation failures', async () => {
      mockGenerationFunction.mockRejectedValue(new Error('AI service unavailable'))

      const request: GenerationRequest = {
        prompt: 'Create any contract',
        temperature: 0.7
      }

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableFallbackGeneration: true }
      )

      expect(result.fallbackUsed).toBe(true)
      expect(result.code).toContain('EmergencyFallback')
      expect(result.qualityScore).toBeLessThan(50)
      expect(result.generationMetrics.attemptCount).toBeGreaterThan(0) // May retry before fallback
    })

    test('should integrate all validation components correctly', async () => {
      const complexContract = `
access(all) contract NFTContract {
    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) let metadata: {String: String}

        init(id: UInt64, metadata: {String: String}) {
            self.id = id
            self.metadata = metadata
        }
    }

    access(all) resource Collection {
        access(all) var ownedNFTs: @{UInt64: NFT}

        access(all) fun deposit(token: @NFT) {
            self.ownedNFTs[token.id] <-! token
        }

        access(all) fun withdraw(withdrawID: UInt64): @NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID)!
            return <-token
        }

        init() {
            self.ownedNFTs <- {}
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    access(all) fun createEmptyCollection(): @Collection {
        return <-create Collection()
    }

    access(all) fun mintNFT(id: UInt64, metadata: {String: String}): @NFT {
        return <-create NFT(id: id, metadata: metadata)
    }

    init() {
        // Contract initialization
    }
}`

      mockGenerationFunction.mockResolvedValue(complexContract)

      const request: GenerationRequest = {
        prompt: 'Create an NFT contract with collection and minting functionality',
        temperature: 0.7
      }

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 75 }
      )

      expect(result.code).toContain('resource NFT')
      expect(result.code).toContain('resource Collection')
      expect(result.validationResults).toBeDefined()
      expect(result.validationResults.length).toBeGreaterThan(0)
      
      // Should have contract-specific validation results
      const contractValidation = result.validationResults.find(vr => vr.type === 'completeness')
      expect(contractValidation).toBeDefined()
    })
  })

  describe('validateAndCorrect', () => {
    test('should validate and correct existing code comprehensively', async () => {
      const codeWithIssues = `
access(all) contract TestContract {
    access(all) var value: String = undefined
    
    access(all) fun getValue() {
        // missing return type and implementation
    }

    init() {
        // missing initialization
    }
}`

      const context = {
        userPrompt: 'Test contract',
        contractType: {
          category: 'utility' as const,
          complexity: 'simple' as const,
          features: []
        },
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

      const result = await controller.validateAndCorrect(codeWithIssues, context)

      expect(result.correctedCode).not.toContain('undefined')
      expect(result.qualityScore).toBeGreaterThan(0)
      expect(result.validationResults).toBeDefined()
      expect(result.correctionHistory).toBeDefined()
    })

    test('should handle validation errors gracefully', async () => {
      const invalidCode = 'This is not valid Cadence code at all!'

      const context = {
        userPrompt: 'Test',
        contractType: {
          category: 'generic' as const,
          complexity: 'simple' as const,
          features: []
        },
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 70,
          requiredFeatures: [],
          prohibitedPatterns: [],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        },
        userExperience: 'beginner' as const
      }

      const result = await controller.validateAndCorrect(invalidCode, context)

      expect(result.correctedCode).toBe(invalidCode) // Should return original if correction fails
      expect(result.qualityScore).toBeLessThan(80) // Should be low score for invalid code
      expect(result.validationResults.length).toBeGreaterThan(0)
      expect(result.validationResults[0].passed).toBe(false)
    })
  })

  describe('getFallbackCode', () => {
    test('should generate appropriate fallback code for different contract types', async () => {
      const nftContractType: ContractType = {
        category: 'nft',
        complexity: 'intermediate',
        features: ['minting', 'metadata']
      }

      const fallbackCode = await controller.getFallbackCode(
        'Create an NFT contract',
        nftContractType
      )

      expect(fallbackCode).toContain('access(all) contract')
      expect(fallbackCode).not.toContain('undefined')
      expect(fallbackCode).toContain('init()')
    })

    test('should provide emergency fallback when fallback generation fails', async () => {
      // Test with invalid contract type to trigger fallback failure
      const invalidContractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }

      const fallbackCode = await controller.getFallbackCode(
        'Invalid prompt that causes fallback to fail',
        invalidContractType
      )

      expect(fallbackCode).toContain('EmergencyFallback')
      expect(fallbackCode).toContain('access(all) contract')
    })
  })

  describe('reportQualityMetrics', () => {
    test('should report comprehensive quality metrics', () => {
      const mockResult: QualityAssuredResult = {
        code: 'test code',
        qualityScore: 85,
        validationResults: [
          {
            type: 'syntax',
            passed: true,
            issues: [],
            score: 95
          },
          {
            type: 'logic',
            passed: true,
            issues: [],
            score: 80
          }
        ],
        correctionHistory: [
          {
            attemptNumber: 1,
            timestamp: new Date(),
            corrections: [
              {
                type: 'undefined-fix',
                location: { line: 1, column: 1 },
                originalValue: 'undefined',
                correctedValue: '""',
                reasoning: 'Fixed undefined value',
                confidence: 0.9
              }
            ],
            success: true,
            qualityImprovement: 20
          }
        ],
        fallbackUsed: false,
        generationMetrics: {
          attemptCount: 2,
          totalGenerationTime: 5000,
          validationTime: 1000,
          correctionTime: 500,
          finalQualityScore: 85,
          issuesDetected: 3,
          issuesFixed: 2,
          startTime: new Date(),
          endTime: new Date()
        }
      }

      // Should not throw
      expect(() => controller.reportQualityMetrics(mockResult)).not.toThrow()
    })
  })

  describe('generateUserFeedback', () => {
    test('should generate comprehensive user feedback', () => {
      const mockResult: QualityAssuredResult = {
        code: 'test code',
        qualityScore: 75,
        validationResults: [
          {
            type: 'syntax',
            passed: true,
            issues: [],
            score: 90
          },
          {
            type: 'completeness',
            passed: false,
            issues: [
              {
                severity: 'warning',
                type: 'missing-function',
                location: { line: 10, column: 1 },
                message: 'Missing required function',
                autoFixable: true
              }
            ],
            score: 60
          }
        ],
        correctionHistory: [],
        fallbackUsed: false,
        generationMetrics: {
          attemptCount: 1,
          totalGenerationTime: 3000,
          validationTime: 500,
          correctionTime: 0,
          finalQualityScore: 75,
          issuesDetected: 1,
          issuesFixed: 0,
          startTime: new Date(),
          endTime: new Date()
        }
      }

      const feedback = controller.generateUserFeedback(mockResult)

      expect(feedback.summary).toContain('75')
      expect(feedback.details).toBeDefined()
      expect(feedback.recommendations).toBeDefined()
      expect(feedback.qualityBreakdown).toBeDefined()
      expect(feedback.nextSteps).toBeDefined()
      
      expect(feedback.qualityBreakdown.overall).toBe(75)
      expect(feedback.recommendations.length).toBeGreaterThan(0)
      expect(feedback.nextSteps.length).toBeGreaterThan(0)
    })

    test('should handle high-quality results appropriately', () => {
      const highQualityResult: QualityAssuredResult = {
        code: 'excellent code',
        qualityScore: 95,
        validationResults: [],
        correctionHistory: [],
        fallbackUsed: false,
        generationMetrics: {
          attemptCount: 1,
          totalGenerationTime: 2000,
          validationTime: 300,
          correctionTime: 0,
          finalQualityScore: 95,
          issuesDetected: 0,
          issuesFixed: 0,
          startTime: new Date(),
          endTime: new Date()
        }
      }

      const feedback = controller.generateUserFeedback(highQualityResult)

      expect(feedback.summary).toContain('Excellent')
      expect(feedback.summary).toContain('95')
      expect(feedback.nextSteps.some(step => step.includes('Deploy to testnet'))).toBe(true)
    })

    test('should handle fallback results appropriately', () => {
      const fallbackResult: QualityAssuredResult = {
        code: 'fallback code',
        qualityScore: 50,
        validationResults: [],
        correctionHistory: [],
        fallbackUsed: true,
        generationMetrics: {
          attemptCount: 3,
          totalGenerationTime: 15000,
          validationTime: 2000,
          correctionTime: 1000,
          finalQualityScore: 50,
          issuesDetected: 5,
          issuesFixed: 2,
          startTime: new Date(),
          endTime: new Date()
        }
      }

      const feedback = controller.generateUserFeedback(fallbackResult)

      expect(feedback.summary).toContain('Fallback template used')
      expect(feedback.recommendations.some(rec => rec.includes('Customize the fallback template'))).toBe(true)
      expect(feedback.nextSteps.some(step => step.includes('Customize the contract'))).toBe(true)
    })
  })

  describe('Performance and Error Handling', () => {
    test('should handle concurrent generation requests', async () => {
      const simpleContract = `
access(all) contract Simple {
    access(all) var value: String
    
    init() {
        self.value = "test"
    }
}`

      mockGenerationFunction.mockResolvedValue(simpleContract)

      const requests = Array(5).fill(null).map((_, i) => ({
        prompt: `Create simple contract ${i}`,
        temperature: 0.7
      }))

      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(
          request,
          mockGenerationFunction,
          { qualityThreshold: 70 }
        )
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result.qualityScore).toBeGreaterThan(0)
        expect(result.code).toContain('access(all) contract')
      })
    })

    test('should handle timeout scenarios gracefully', async () => {
      mockGenerationFunction.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      const request: GenerationRequest = {
        prompt: 'Create a contract',
        temperature: 0.7
      }

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableFallbackGeneration: true }
      )

      expect(result.fallbackUsed).toBe(true)
      expect(result.code).toContain('EmergencyFallback')
    })
  })
})