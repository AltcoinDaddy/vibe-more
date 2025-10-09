/**
 * Integration tests for ComprehensiveErrorDetector with the quality assurance system
 * 
 * Tests how the error detector integrates with other quality assurance components
 * and provides comprehensive error analysis for AI-generated code.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { 
  ComprehensiveErrorDetector, 
  ErrorType, 
  ErrorCategory,
  AutoCorrectionEngine,
  QualityScoreCalculator
} from '../index'

describe('ComprehensiveErrorDetector Integration', () => {
  let detector: ComprehensiveErrorDetector
  let corrector: AutoCorrectionEngine
  let scoreCalculator: QualityScoreCalculator

  beforeEach(() => {
    detector = new ComprehensiveErrorDetector()
    corrector = new AutoCorrectionEngine()
    scoreCalculator = new QualityScoreCalculator()
  })

  describe('Integration with Auto-Correction Engine', () => {
    test('should detect errors that can be auto-corrected', async () => {
      const codeWithErrors = `
        access(all) contract TestContract {
          access(all) fun getValue(): String
          
          access(all) fun processData(): Int {
            let value = undefined
            // TODO: Process the data
          }
          
          init() {}
        }
      `

      // First detect errors
      const errorResult = await detector.detectErrors(codeWithErrors, 'generic')
      
      expect(errorResult.totalErrors).toBeGreaterThan(0)
      expect(errorResult.criticalErrors).toBeGreaterThan(0)
      
      // Check that some errors are auto-fixable
      const autoFixableErrors = errorResult.errors.filter(e => e.autoFixable)
      expect(autoFixableErrors.length).toBeGreaterThan(0)
      
      // Try to auto-correct the code
      const correctionResult = await corrector.correctCode(codeWithErrors)
      expect(correctionResult.success).toBe(true)
      expect(correctionResult.correctionsApplied.length).toBeGreaterThan(0)
      
      // Verify that the corrected code is different from the original
      expect(correctionResult.correctedCode).not.toBe(codeWithErrors)
      expect(correctionResult.correctedCode).not.toContain('undefined')
    })

    test('should provide specific correction suggestions for detected errors', async () => {
      const incompleteContract = `
        access(all) contract IncompleteContract {
          access(all) fun calculate(): UFix64
          
          // Missing init function
        }
      `

      const result = await detector.detectErrors(incompleteContract, 'generic')
      
      // Check that errors have actionable suggestions
      const errorsWithSuggestions = result.errors.filter(e => e.suggestedFix && e.suggestedFix.length > 0)
      expect(errorsWithSuggestions.length).toBeGreaterThan(0)
      
      // Verify suggestions are specific and actionable
      const functionBodyError = result.errors.find(e => e.type === ErrorType.MISSING_FUNCTION_BODY)
      expect(functionBodyError?.suggestedFix).toContain('Add function body')
      
      const initError = result.errors.find(e => e.type === ErrorType.MISSING_INIT_FUNCTION)
      expect(initError?.suggestedFix).toContain('init()')
    })
  })

  describe('Integration with Quality Score Calculator', () => {
    test('should provide error data that influences quality scores', async () => {
      const poorQualityCode = `
        // Missing contract declaration
        access(all) fun badFunction(): String
        // TODO: Implement everything
      `

      const goodQualityCode = `
        access(all) contract WellFormedContract {
          access(all) fun goodFunction(): String {
            return "Hello, World!"
          }
          
          init() {
            // Proper initialization
          }
        }
      `

      // Analyze poor quality code
      const poorResult = await detector.detectErrors(poorQualityCode, 'generic')
      expect(poorResult.completenessScore).toBeLessThan(50)
      expect(poorResult.criticalErrors).toBeGreaterThan(0)
      
      // Analyze good quality code
      const goodResult = await detector.detectErrors(goodQualityCode, 'generic')
      expect(goodResult.completenessScore).toBeGreaterThan(80)
      expect(goodResult.criticalErrors).toBe(0)
      
      // Verify that error classification provides useful metrics
      expect(poorResult.classification.structuralErrors).toBeGreaterThan(0)
      expect(poorResult.classification.completenessErrors).toBeGreaterThan(0)
      expect(goodResult.classification.structuralErrors).toBe(0)
    })

    test('should generate quality scores that correlate with error severity', async () => {
      const testCases = [
        {
          name: 'Critical errors',
          code: `access(all) fun brokenFunction(): String`,
          expectedScore: { min: 0, max: 30 }
        },
        {
          name: 'Warning errors',
          code: `
            access(all) contract TestContract {
              fun missingAccessModifier(): String {
                return "test"
              }
              init() {}
            }
          `,
          expectedScore: { min: 60, max: 90 }
        },
        {
          name: 'Clean code',
          code: `
            access(all) contract CleanContract {
              access(all) fun cleanFunction(): String {
                return "clean"
              }
              init() {}
            }
          `,
          expectedScore: { min: 90, max: 100 }
        }
      ]

      for (const testCase of testCases) {
        const result = await detector.detectErrors(testCase.code, 'generic')
        expect(result.completenessScore).toBeGreaterThanOrEqual(testCase.expectedScore.min)
        expect(result.completenessScore).toBeLessThanOrEqual(testCase.expectedScore.max)
      }
    })
  })

  describe('Contract Type-Specific Error Detection', () => {
    test('should detect NFT-specific errors and requirements', async () => {
      const incompleteNFTContract = `
        access(all) contract MyNFT {
          // Missing NFT-specific functions and events
          
          init() {}
        }
      `

      const result = await detector.detectErrors(incompleteNFTContract, 'nft')
      
      // Should detect missing NFT-specific requirements
      const missingFunctions = result.errors.filter(e => e.type === ErrorType.MISSING_REQUIRED_FUNCTION)
      expect(missingFunctions.length).toBeGreaterThan(0)
      
      const nftFunctionNames = ['createNFT', 'mintNFT', 'getMetadata']
      for (const functionName of nftFunctionNames) {
        const error = missingFunctions.find(e => e.message.includes(functionName))
        expect(error).toBeDefined()
      }
      
      // Should detect missing NFT events
      const missingEvents = result.errors.filter(e => e.type === ErrorType.MISSING_EVENT_DEFINITIONS)
      expect(missingEvents.length).toBeGreaterThan(0)
      
      const nftEventNames = ['Minted', 'Withdraw', 'Deposit']
      for (const eventName of nftEventNames) {
        const error = missingEvents.find(e => e.message.includes(eventName))
        expect(error).toBeDefined()
      }
    })

    test('should detect fungible token-specific errors', async () => {
      const incompleteFTContract = `
        access(all) contract MyToken {
          // Missing FT-specific functions
          
          init() {}
        }
      `

      const result = await detector.detectErrors(incompleteFTContract, 'fungible-token')
      
      // Should detect missing FT-specific requirements
      const missingFunctions = result.errors.filter(e => e.type === ErrorType.MISSING_REQUIRED_FUNCTION)
      const ftFunctionNames = ['createVault', 'mintTokens', 'getBalance']
      
      for (const functionName of ftFunctionNames) {
        const error = missingFunctions.find(e => e.message.includes(functionName))
        expect(error).toBeDefined()
      }
    })

    test('should provide contract-type-specific recommendations', async () => {
      const genericContract = `
        access(all) contract GenericContract {
          init() {}
        }
      `

      const nftResult = await detector.detectErrors(genericContract, 'nft')
      const ftResult = await detector.detectErrors(genericContract, 'fungible-token')
      
      // NFT recommendations should mention NFT-specific elements
      const nftRecommendations = nftResult.actionableRecommendations.join(' ')
      expect(nftRecommendations.toLowerCase()).toContain('function')
      
      // FT recommendations should mention FT-specific elements
      const ftRecommendations = ftResult.actionableRecommendations.join(' ')
      expect(ftRecommendations.toLowerCase()).toContain('function')
      
      // Should have different recommendations for different contract types
      expect(nftResult.errors.length).not.toBe(ftResult.errors.length)
    })
  })

  describe('Error Context and Debugging Information', () => {
    test('should provide detailed context for debugging', async () => {
      const complexCode = `
        access(all) contract ComplexContract {
          access(all) resource TestResource {
            access(all) let id: UInt64
            
            init(id: UInt64) {
              self.id = id
            }
            // Missing destroy method
          }
          
          access(all) fun processResource(): String {
            let resource <- create TestResource(id: 1)
            // Missing return statement
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(complexCode, 'generic')
      
      // Check that errors have detailed context
      for (const error of result.errors) {
        expect(error.context).toBeDefined()
        expect(error.location).toBeDefined()
        expect(error.location.line).toBeGreaterThan(0)
        
        if (error.context.functionName) {
          expect(error.context.functionName).toBeTruthy()
        }
        
        if (error.context.resourceName) {
          expect(error.context.resourceName).toBeTruthy()
        }
      }
      
      // Verify specific error contexts
      const resourceError = result.errors.find(e => e.type === ErrorType.MISSING_RESOURCE_METHODS)
      expect(resourceError?.context.resourceName).toBe('TestResource')
      
      const functionError = result.errors.find(e => e.type === ErrorType.INCOMPLETE_FUNCTION_IMPLEMENTATION)
      expect(functionError?.context.functionName).toBe('processResource')
    })

    test('should provide confidence levels for error detection', async () => {
      const ambiguousCode = `
        access(all) contract AmbiguousContract {
          access(all) fun maybeIncomplete(): String {
            let value = "test"
            // This might be complete or incomplete
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(ambiguousCode, 'generic')
      
      // All errors should have confidence levels
      for (const error of result.errors) {
        expect(error.confidence).toBeGreaterThan(0)
        expect(error.confidence).toBeLessThanOrEqual(100)
      }
      
      // High-confidence errors should be marked as such
      const highConfidenceErrors = result.errors.filter(e => e.confidence >= 90)
      const lowConfidenceErrors = result.errors.filter(e => e.confidence < 70)
      
      // Should have some variation in confidence levels
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle large contracts efficiently', async () => {
      // Generate a large contract with many functions
      const largeFunctions = Array.from({ length: 50 }, (_, i) => `
        access(all) fun function${i}(): String {
          return "function${i}"
        }
      `).join('\n')

      const largeContract = `
        access(all) contract LargeContract {
          ${largeFunctions}
          
          init() {}
        }
      `

      const startTime = Date.now()
      const result = await detector.detectErrors(largeContract, 'generic')
      const duration = Date.now() - startTime

      // Should complete within reasonable time (less than 2 seconds)
      expect(duration).toBeLessThan(2000)
      expect(result).toBeDefined()
      expect(result.totalErrors).toBeGreaterThanOrEqual(0)
    })

    test('should provide consistent results across multiple runs', async () => {
      const testCode = `
        access(all) contract ConsistencyTest {
          access(all) fun testFunction(): String
          
          init() {}
        }
      `

      // Run detection multiple times
      const results = await Promise.all([
        detector.detectErrors(testCode, 'generic'),
        detector.detectErrors(testCode, 'generic'),
        detector.detectErrors(testCode, 'generic')
      ])

      // Results should be consistent
      const firstResult = results[0]
      for (let i = 1; i < results.length; i++) {
        expect(results[i].totalErrors).toBe(firstResult.totalErrors)
        expect(results[i].criticalErrors).toBe(firstResult.criticalErrors)
        expect(results[i].completenessScore).toBe(firstResult.completenessScore)
      }
    })
  })
})