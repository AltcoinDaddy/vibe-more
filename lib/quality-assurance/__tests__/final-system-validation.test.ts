/**
 * Final System Validation Tests
 * 
 * Simplified integration tests that validate the core functionality
 * of the quality assurance system without complex mocking.
 */

import { describe, test, expect } from 'vitest'
import { UndefinedValueDetector } from '../undefined-value-detector'
import { FallbackGenerator } from '../fallback-generator'
import { QualityScoreCalculator } from '../quality-score-calculator'
import { AutoCorrectionEngine } from '../auto-correction-engine'

describe('Final System Validation', () => {
  describe('Undefined Value Elimination', () => {
    test('should detect undefined values in code', () => {
      const detector = new UndefinedValueDetector()
      
      const codeWithUndefined = `
        access(all) contract TestContract {
          access(all) var name: String = undefined
          access(all) var count: Int = 
          
          init() {
            self.name = undefined
            self.count = 
          }
        }
      `

      const issues = detector.detectUndefinedValues(codeWithUndefined)
      
      expect(issues.length).toBeGreaterThan(0)
      expect(issues.some(issue => issue.pattern.includes('undefined'))).toBe(true)
    })

    test('should not detect undefined in clean code', () => {
      const detector = new UndefinedValueDetector()
      
      const cleanCode = `
        access(all) contract CleanContract {
          access(all) var name: String
          access(all) var count: Int
          
          init() {
            self.name = "test"
            self.count = 0
          }
        }
      `

      const issues = detector.detectUndefinedValues(cleanCode)
      
      expect(issues).toHaveLength(0)
    })
  })

  describe('Auto-Correction System', () => {
    test('should correct undefined values', () => {
      const corrector = new AutoCorrectionEngine()
      
      const codeWithIssues = `
        access(all) contract TestContract {
          access(all) var name: String = undefined
          access(all) var count: Int = undefined
          
          init() {
            self.name = undefined
            self.count = undefined
          }
        }
      `

      const result = corrector.correctCode(codeWithIssues, {
        fixUndefinedValues: true,
        fixIncompleteStatements: true,
        fixSyntaxErrors: true
      })

      expect(result.success).toBe(true)
      expect(result.correctedCode).not.toContain('= undefined')
      expect(result.correctionsApplied.length).toBeGreaterThan(0)
    })

    test('should preserve correct code', () => {
      const corrector = new AutoCorrectionEngine()
      
      const goodCode = `
        access(all) contract GoodContract {
          access(all) var name: String
          
          init() {
            self.name = "test"
          }
        }
      `

      const result = corrector.correctCode(goodCode, {
        fixUndefinedValues: true,
        fixIncompleteStatements: true,
        fixSyntaxErrors: true
      })

      expect(result.success).toBe(true)
      expect(result.correctedCode).toContain('self.name = "test"')
    })
  })

  describe('Fallback System', () => {
    test('should generate fallback contracts for different types', () => {
      const fallbackGenerator = new FallbackGenerator()
      
      const contractTypes = [
        { category: 'nft' as const, complexity: 'simple' as const, features: [] },
        { category: 'fungible-token' as const, complexity: 'simple' as const, features: [] },
        { category: 'utility' as const, complexity: 'simple' as const, features: [] }
      ]

      for (const contractType of contractTypes) {
        const fallbackCode = fallbackGenerator.generateFallbackContract(
          `Create a ${contractType.category} contract`,
          contractType
        )

        expect(fallbackCode).toBeDefined()
        expect(fallbackCode).toContain('access(all) contract')
        expect(fallbackCode).toContain('init()')
        expect(fallbackCode).not.toContain('undefined')
      }
    })

    test('should generate valid syntax in fallback contracts', () => {
      const fallbackGenerator = new FallbackGenerator()
      
      const fallbackCode = fallbackGenerator.generateFallbackContract(
        'Create a test contract',
        { category: 'generic', complexity: 'simple', features: [] }
      )

      // Basic syntax validation
      expect(fallbackCode).toMatch(/access\(all\)\s+contract\s+\w+\s*\{/)
      expect(fallbackCode).toMatch(/init\(\)\s*\{/)
      expect(fallbackCode).toMatch(/\}$/)
    })
  })

  describe('Quality Score Calculation', () => {
    test('should calculate quality scores accurately', () => {
      const calculator = new QualityScoreCalculator()
      
      const highQualityCode = `
        access(all) contract HighQualityContract {
          access(all) var name: String
          access(all) event NameChanged(newName: String)
          
          access(all) fun setName(_ newName: String) {
            self.name = newName
            emit NameChanged(newName: newName)
          }
          
          init() {
            self.name = "Default"
          }
        }
      `

      const score = calculator.calculateQualityScore(highQualityCode, {
        checkSyntax: true,
        checkCompleteness: true,
        checkBestPractices: true
      })

      expect(score.overall).toBeGreaterThan(80)
      expect(score.syntax).toBeGreaterThan(85)
      expect(score.completeness).toBeGreaterThan(75)
    })

    test('should detect low quality code', () => {
      const calculator = new QualityScoreCalculator()
      
      const lowQualityCode = `
        access(all) contract LowQualityContract {
          init() {}
        }
      `

      const score = calculator.calculateQualityScore(lowQualityCode, {
        checkSyntax: true,
        checkCompleteness: true,
        checkBestPractices: true
      })

      expect(score.overall).toBeLessThan(70)
      expect(score.completeness).toBeLessThan(60)
    })
  })

  describe('System Integration', () => {
    test('should work together to improve code quality', () => {
      const detector = new UndefinedValueDetector()
      const corrector = new AutoCorrectionEngine()
      const calculator = new QualityScoreCalculator()
      
      const problematicCode = `
        access(all) contract ProblematicContract {
          access(all) var name: String = undefined
          access(all) var count: Int = undefined
          
          init() {
            self.name = undefined
            self.count = undefined
          }
        }
      `

      // Step 1: Detect issues
      const issues = detector.detectUndefinedValues(problematicCode)
      expect(issues.length).toBeGreaterThan(0)

      // Step 2: Correct issues
      const correctionResult = corrector.correctCode(problematicCode, {
        fixUndefinedValues: true,
        fixIncompleteStatements: true,
        fixSyntaxErrors: true
      })
      expect(correctionResult.success).toBe(true)

      // Step 3: Verify no more undefined values
      const remainingIssues = detector.detectUndefinedValues(correctionResult.correctedCode)
      expect(remainingIssues).toHaveLength(0)

      // Step 4: Calculate improved quality score
      const qualityScore = calculator.calculateQualityScore(correctionResult.correctedCode, {
        checkSyntax: true,
        checkCompleteness: true,
        checkBestPractices: true
      })
      expect(qualityScore.overall).toBeGreaterThan(70)
    })

    test('should handle edge cases gracefully', () => {
      const detector = new UndefinedValueDetector()
      const corrector = new AutoCorrectionEngine()
      const fallbackGenerator = new FallbackGenerator()
      
      // Test with empty code
      const emptyCode = ''
      const issues = detector.detectUndefinedValues(emptyCode)
      expect(issues).toHaveLength(0)

      // Test correction with empty code
      const correctionResult = corrector.correctCode(emptyCode, {
        fixUndefinedValues: true,
        fixIncompleteStatements: true,
        fixSyntaxErrors: true
      })
      expect(correctionResult.success).toBe(true)

      // Test fallback generation
      const fallbackCode = fallbackGenerator.generateFallbackContract(
        'Create a contract',
        { category: 'generic', complexity: 'simple', features: [] }
      )
      expect(fallbackCode).toBeDefined()
      expect(fallbackCode.length).toBeGreaterThan(0)
    })
  })

  describe('Performance Requirements', () => {
    test('should meet performance requirements for basic operations', () => {
      const detector = new UndefinedValueDetector()
      const calculator = new QualityScoreCalculator()
      
      const testCode = `
        access(all) contract TestContract {
          access(all) var name: String
          init() { self.name = "test" }
        }
      `

      // Test detection performance
      const detectionStart = Date.now()
      const issues = detector.detectUndefinedValues(testCode)
      const detectionTime = Date.now() - detectionStart
      expect(detectionTime).toBeLessThan(100) // Should be very fast

      // Test quality calculation performance
      const calculationStart = Date.now()
      const score = calculator.calculateQualityScore(testCode, {
        checkSyntax: true,
        checkCompleteness: true,
        checkBestPractices: true
      })
      const calculationTime = Date.now() - calculationStart
      expect(calculationTime).toBeLessThan(200) // Should be reasonably fast
    })
  })

  describe('Production Readiness Indicators', () => {
    test('should indicate system components are functional', () => {
      // Test that all core components can be instantiated
      expect(() => new UndefinedValueDetector()).not.toThrow()
      expect(() => new AutoCorrectionEngine()).not.toThrow()
      expect(() => new FallbackGenerator()).not.toThrow()
      expect(() => new QualityScoreCalculator()).not.toThrow()
    })

    test('should handle typical use cases without errors', () => {
      const detector = new UndefinedValueDetector()
      const corrector = new AutoCorrectionEngine()
      const fallbackGenerator = new FallbackGenerator()
      const calculator = new QualityScoreCalculator()

      const typicalPrompts = [
        'Create a simple NFT contract',
        'Build a fungible token',
        'Create a marketplace contract'
      ]

      for (const prompt of typicalPrompts) {
        // Test fallback generation
        expect(() => {
          const fallbackCode = fallbackGenerator.generateFallbackContract(
            prompt,
            { category: 'generic', complexity: 'simple', features: [] }
          )
          
          // Test detection on fallback
          const issues = detector.detectUndefinedValues(fallbackCode)
          
          // Test quality calculation on fallback
          const score = calculator.calculateQualityScore(fallbackCode, {
            checkSyntax: true,
            checkCompleteness: true,
            checkBestPractices: true
          })
          
          expect(issues).toHaveLength(0) // Fallback should have no undefined values
          expect(score.overall).toBeGreaterThan(60) // Fallback should have decent quality
        }).not.toThrow()
      }
    })
  })
})