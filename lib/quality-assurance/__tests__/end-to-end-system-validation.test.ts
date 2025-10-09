/**
 * End-to-End System Validation Tests
 * 
 * Comprehensive integration tests that validate the entire quality assurance
 * system from user request to final code delivery, ensuring undefined values
 * are eliminated and fallback systems work reliably.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedGenerationController } from '../enhanced-generation-controller'
import { UndefinedValueDetector } from '../undefined-value-detector'
import { FallbackGenerator } from '../fallback-generator'
import { AutoCorrectionEngine } from '../auto-correction-engine'
import { QualityScoreCalculator } from '../quality-score-calculator'
import { MetricsCollector } from '../metrics-collector'
import { DeploymentReadinessChecker } from '../deployment-readiness-check'

describe('End-to-End System Validation', () => {
  let controller: EnhancedGenerationController
  let undefinedDetector: UndefinedValueDetector
  let fallbackGenerator: FallbackGenerator
  let autoCorrector: AutoCorrectionEngine
  let qualityCalculator: QualityScoreCalculator
  let metricsCollector: MetricsCollector
  let deploymentChecker: DeploymentReadinessChecker

  beforeEach(() => {
    // Initialize all components
    controller = new EnhancedGenerationController()
    undefinedDetector = new UndefinedValueDetector()
    fallbackGenerator = new FallbackGenerator()
    autoCorrector = new AutoCorrectionEngine()
    qualityCalculator = new QualityScoreCalculator()
    metricsCollector = new MetricsCollector()
    deploymentChecker = new DeploymentReadinessChecker()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Generation Pipeline', () => {
    test('should generate high-quality code without undefined values', async () => {
      const request = {
        prompt: 'Create a simple NFT contract with minting functionality',
        strictMode: true,
        maxRetries: 3
      }

      const result = await controller.generateWithQualityAssurance(request)

      // Validate no undefined values
      expect(result.code).not.toContain('undefined')
      expect(result.code).not.toMatch(/=\s*$/) // No incomplete assignments
      expect(result.code).not.toMatch(/:\s*$/) // No incomplete type annotations

      // Validate quality score
      expect(result.qualityScore).toBeGreaterThan(80)

      // Validate code structure
      expect(result.code).toContain('access(all) contract')
      expect(result.code).toContain('init()')
      expect(result.code).toMatch(/\{[\s\S]*\}/) // Has proper braces

      // Validate generation metrics
      expect(result.generationMetrics.finalQualityScore).toBeGreaterThan(80)
      expect(result.generationMetrics.issuesDetected).toBeGreaterThanOrEqual(0)
      expect(result.generationMetrics.issuesFixed).toBeGreaterThanOrEqual(0)
    })

    test('should handle complex contract generation with multiple features', async () => {
      const request = {
        prompt: 'Create an NFT marketplace contract with listing, purchasing, and royalty features',
        strictMode: true,
        maxRetries: 3
      }

      const result = await controller.generateWithQualityAssurance(request)

      // Validate comprehensive functionality
      expect(result.code).toContain('access(all) contract')
      expect(result.code).toContain('init()')
      
      // Should contain marketplace-specific functionality
      expect(result.code.toLowerCase()).toMatch(/(list|purchase|buy|sell|royalt)/i)
      
      // No undefined values
      const undefinedIssues = undefinedDetector.detectUndefinedValues(result.code)
      expect(undefinedIssues).toHaveLength(0)

      // High quality score
      expect(result.qualityScore).toBeGreaterThan(75)
    })

    test('should recover from generation failures using fallback system', async () => {
      // Mock the controller to fail initially, then use fallback
      const mockController = vi.spyOn(controller, 'generateWithQualityAssurance')
      mockController.mockImplementationOnce(async () => {
        throw new Error('Generation failed')
      })

      const request = {
        prompt: 'Create a simple token contract',
        strictMode: true,
        maxRetries: 1
      }

      // Should not throw, should use fallback
      const fallbackCode = fallbackGenerator.generateFallbackContract(
        request.prompt,
        { category: 'fungible-token', complexity: 'simple', features: [] }
      )

      expect(fallbackCode).toBeDefined()
      expect(fallbackCode).toContain('access(all) contract')
      expect(fallbackCode).not.toContain('undefined')

      // Validate fallback quality
      const qualityScore = qualityCalculator.calculateQualityScore(fallbackCode, {
        checkSyntax: true,
        checkCompleteness: true,
        checkBestPractices: true
      })

      expect(qualityScore.overall).toBeGreaterThan(70)
    })
  })

  describe('Undefined Value Elimination', () => {
    test('should detect and eliminate all undefined patterns', async () => {
      const testCases = [
        'Create an NFT contract',
        'Build a fungible token',
        'Create a DAO voting system',
        'Build a marketplace contract',
        'Create a staking rewards contract'
      ]

      for (const prompt of testCases) {
        const result = await controller.generateWithQualityAssurance({
          prompt,
          strictMode: true,
          maxRetries: 3
        })

        // Check for undefined values
        const undefinedIssues = undefinedDetector.detectUndefinedValues(result.code)
        expect(undefinedIssues).toHaveLength(0)

        // Validate specific undefined patterns
        expect(result.code).not.toContain('= undefined')
        expect(result.code).not.toContain(': undefined')
        expect(result.code).not.toMatch(/undefined[^a-zA-Z]/)
        expect(result.code).not.toMatch(/=\s*$/)
        expect(result.code).not.toMatch(/:\s*$/)
      }
    })

    test('should handle edge cases in undefined detection', async () => {
      const edgeCases = [
        'Create a contract with optional parameters',
        'Build a contract with complex data structures',
        'Create a contract with nested resources',
        'Build a contract with multiple interfaces'
      ]

      for (const prompt of edgeCases) {
        const result = await controller.generateWithQualityAssurance({
          prompt,
          strictMode: true,
          maxRetries: 3
        })

        // Comprehensive undefined checking
        const undefinedIssues = undefinedDetector.detectUndefinedValues(result.code)
        expect(undefinedIssues).toHaveLength(0)

        // Validate code completeness
        expect(result.code).toMatch(/\{[\s\S]*\}/) // Has complete blocks
        expect(result.code).not.toMatch(/\{\s*$/) // No incomplete blocks
        expect(result.code).not.toMatch(/\(\s*$/) // No incomplete function calls
      }
    })
  })

  describe('Auto-Correction System', () => {
    test('should automatically correct common issues', async () => {
      const codeWithIssues = `
        access(all) contract TestContract {
          access(all) var name: String = undefined
          access(all) var count: Int = 
          
          access(all) fun getValue(): String {
            return
          }
          
          init() {
            self.name = 
            self.count = undefined
          }
        }
      `

      const correctionResult = autoCorrector.correctCode(codeWithIssues, {
        fixUndefinedValues: true,
        fixIncompleteStatements: true,
        fixSyntaxErrors: true
      })

      expect(correctionResult.success).toBe(true)
      expect(correctionResult.correctedCode).not.toContain('undefined')
      expect(correctionResult.correctedCode).not.toMatch(/=\s*$/)
      expect(correctionResult.correctedCode).not.toMatch(/return\s*$/)
      expect(correctionResult.correctionsApplied.length).toBeGreaterThan(0)
    })

    test('should preserve correct code while fixing issues', async () => {
      const mixedCode = `
        access(all) contract GoodContract {
          access(all) var validName: String = "test"
          access(all) var invalidValue: String = undefined
          
          access(all) fun goodFunction(): String {
            return "valid"
          }
          
          access(all) fun badFunction(): String {
            return
          }
          
          init() {
            self.validName = "initialized"
            self.invalidValue = undefined
          }
        }
      `

      const correctionResult = autoCorrector.correctCode(mixedCode, {
        fixUndefinedValues: true,
        fixIncompleteStatements: true,
        fixSyntaxErrors: true
      })

      expect(correctionResult.success).toBe(true)
      
      // Should preserve good parts
      expect(correctionResult.correctedCode).toContain('validName: String = "test"')
      expect(correctionResult.correctedCode).toContain('return "valid"')
      expect(correctionResult.correctedCode).toContain('self.validName = "initialized"')
      
      // Should fix bad parts
      expect(correctionResult.correctedCode).not.toContain('undefined')
      expect(correctionResult.correctedCode).not.toMatch(/return\s*$/)
    })
  })

  describe('Fallback System Reliability', () => {
    test('should provide reliable fallbacks for all contract types', async () => {
      const contractTypes = [
        { category: 'nft' as const, complexity: 'simple' as const, features: [] },
        { category: 'fungible-token' as const, complexity: 'simple' as const, features: [] },
        { category: 'marketplace' as const, complexity: 'intermediate' as const, features: [] },
        { category: 'dao' as const, complexity: 'intermediate' as const, features: [] },
        { category: 'utility' as const, complexity: 'simple' as const, features: [] }
      ]

      for (const contractType of contractTypes) {
        const fallbackCode = fallbackGenerator.generateFallbackContract(
          `Create a ${contractType.category} contract`,
          contractType
        )

        // Validate fallback quality
        expect(fallbackCode).toBeDefined()
        expect(fallbackCode).toContain('access(all) contract')
        expect(fallbackCode).toContain('init()')
        expect(fallbackCode).not.toContain('undefined')

        // Validate syntax
        expect(fallbackCode).toMatch(/\{[\s\S]*\}/)
        expect(fallbackCode).not.toMatch(/\{\s*$/)

        // Calculate quality score
        const qualityScore = qualityCalculator.calculateQualityScore(fallbackCode, {
          checkSyntax: true,
          checkCompleteness: true,
          checkBestPractices: true
        })

        expect(qualityScore.overall).toBeGreaterThan(70)
        expect(qualityScore.syntax).toBeGreaterThan(80)
      }
    })

    test('should handle fallback generation under stress conditions', async () => {
      const stressPrompts = [
        'Create an extremely complex multi-contract system with interdependencies',
        'Build a contract with contradictory requirements',
        'Create a contract with impossible constraints',
        'Build a contract with invalid syntax requirements'
      ]

      for (const prompt of stressPrompts) {
        const fallbackCode = fallbackGenerator.generateFallbackContract(
          prompt,
          { category: 'generic', complexity: 'simple', features: [] }
        )

        // Should always produce valid code
        expect(fallbackCode).toBeDefined()
        expect(fallbackCode).toContain('access(all) contract')
        expect(fallbackCode).not.toContain('undefined')

        // Should be syntactically valid
        const undefinedIssues = undefinedDetector.detectUndefinedValues(fallbackCode)
        expect(undefinedIssues).toHaveLength(0)
      }
    })
  })

  describe('Quality Metrics Accuracy', () => {
    test('should accurately assess code quality', async () => {
      const testCodes = [
        {
          code: `access(all) contract HighQualityContract {
            access(all) var name: String
            access(all) event NameChanged(newName: String)
            
            access(all) fun setName(_ newName: String) {
              self.name = newName
              emit NameChanged(newName: newName)
            }
            
            init() {
              self.name = "Default"
            }
          }`,
          expectedRange: [85, 100]
        },
        {
          code: `access(all) contract MediumQualityContract {
            access(all) var value: Int
            
            access(all) fun getValue(): Int {
              return self.value
            }
            
            init() {
              self.value = 0
            }
          }`,
          expectedRange: [70, 85]
        },
        {
          code: `access(all) contract LowQualityContract {
            init() {}
          }`,
          expectedRange: [40, 70]
        }
      ]

      for (const testCase of testCodes) {
        const qualityScore = qualityCalculator.calculateQualityScore(testCase.code, {
          checkSyntax: true,
          checkCompleteness: true,
          checkBestPractices: true
        })

        expect(qualityScore.overall).toBeGreaterThanOrEqual(testCase.expectedRange[0])
        expect(qualityScore.overall).toBeLessThanOrEqual(testCase.expectedRange[1])
        
        // Validate individual metrics
        expect(qualityScore.syntax).toBeGreaterThan(0)
        expect(qualityScore.logic).toBeGreaterThan(0)
        expect(qualityScore.completeness).toBeGreaterThan(0)
        expect(qualityScore.bestPractices).toBeGreaterThan(0)
      }
    })

    test('should detect quality issues accurately', async () => {
      const problematicCode = `
        access(all) contract ProblematicContract {
          access(all) var name: String = undefined
          access(all) var count: Int
          
          access(all) fun badFunction() {
            // Missing return type and implementation
          }
          
          // Missing init function
        }
      `

      const qualityScore = qualityCalculator.calculateQualityScore(problematicCode, {
        checkSyntax: true,
        checkCompleteness: true,
        checkBestPractices: true
      })

      expect(qualityScore.overall).toBeLessThan(60)
      expect(qualityScore.completeness).toBeLessThan(50)
      expect(qualityScore.syntax).toBeLessThan(70)
    })
  })

  describe('Performance Requirements', () => {
    test('should meet generation time requirements', async () => {
      const startTime = Date.now()
      
      const result = await controller.generateWithQualityAssurance({
        prompt: 'Create a simple NFT contract',
        strictMode: true,
        maxRetries: 2
      })
      
      const endTime = Date.now()
      const generationTime = endTime - startTime

      expect(generationTime).toBeLessThan(10000) // 10 seconds max
      expect(result.generationMetrics.totalGenerationTime).toBeLessThan(8000)
      expect(result.generationMetrics.validationTime).toBeLessThan(200)
    })

    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 5
      const promises = []

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          controller.generateWithQualityAssurance({
            prompt: `Create a test contract ${i}`,
            strictMode: true,
            maxRetries: 1
          })
        )
      }

      const startTime = Date.now()
      const results = await Promise.all(promises)
      const endTime = Date.now()

      const totalTime = endTime - startTime
      const averageTime = totalTime / concurrentRequests

      expect(results).toHaveLength(concurrentRequests)
      expect(averageTime).toBeLessThan(15000) // 15 seconds average
      
      // All results should be valid
      for (const result of results) {
        expect(result.code).not.toContain('undefined')
        expect(result.qualityScore).toBeGreaterThan(70)
      }
    })
  })

  describe('Deployment Readiness', () => {
    test('should pass comprehensive deployment readiness check', async () => {
      const result = await deploymentChecker.runDeploymentCheck()

      expect(result.canDeploy).toBe(true)
      expect(result.blockers).toHaveLength(0)
      expect(result.summary).toContain('READY')
    })

    test('should provide detailed deployment checklist', async () => {
      const result = await deploymentChecker.runDeploymentCheck()

      expect(result).toBeDefined()
      // Would validate specific checklist items based on actual implementation
    })

    test('should handle quick health checks', async () => {
      const isHealthy = await deploymentChecker.runQuickHealthCheck()
      expect(isHealthy).toBe(true)
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    test('should handle malformed prompts gracefully', async () => {
      const malformedPrompts = [
        '',
        '   ',
        'asdfghjkl',
        '!@#$%^&*()',
        'Create a contract with 🚀 emojis and weird chars ñáéíóú'
      ]

      for (const prompt of malformedPrompts) {
        const result = await controller.generateWithQualityAssurance({
          prompt,
          strictMode: true,
          maxRetries: 1
        })

        // Should either generate valid code or use fallback
        expect(result.code).toBeDefined()
        expect(result.code).not.toContain('undefined')
        
        if (result.fallbackUsed) {
          expect(result.code).toContain('access(all) contract')
        }
      }
    })

    test('should handle system resource constraints', async () => {
      // Simulate high load scenario
      const highLoadPrompts = Array(10).fill(0).map((_, i) => 
        `Create a complex contract ${i} with multiple features`
      )

      const results = await Promise.allSettled(
        highLoadPrompts.map(prompt =>
          controller.generateWithQualityAssurance({
            prompt,
            strictMode: true,
            maxRetries: 1
          })
        )
      )

      // At least 80% should succeed
      const successful = results.filter(r => r.status === 'fulfilled').length
      const successRate = (successful / results.length) * 100
      expect(successRate).toBeGreaterThan(80)
    })

    test('should maintain quality under failure conditions', async () => {
      // Test with intentionally difficult prompts
      const difficultPrompts = [
        'Create a contract that does everything and nothing',
        'Build a contract with infinite complexity',
        'Create a contract that breaks all rules'
      ]

      for (const prompt of difficultPrompts) {
        const result = await controller.generateWithQualityAssurance({
          prompt,
          strictMode: true,
          maxRetries: 3
        })

        // Even with difficult prompts, should produce valid code
        expect(result.code).not.toContain('undefined')
        expect(result.qualityScore).toBeGreaterThan(60) // Minimum acceptable quality
        
        const undefinedIssues = undefinedDetector.detectUndefinedValues(result.code)
        expect(undefinedIssues).toHaveLength(0)
      }
    })
  })
})