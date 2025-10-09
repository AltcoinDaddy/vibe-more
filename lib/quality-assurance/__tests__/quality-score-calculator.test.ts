/**
 * Unit tests for QualityScoreCalculator
 * 
 * Tests quality scoring algorithms for accuracy, consistency, and edge cases
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { QualityScoreCalculator } from '../quality-score-calculator'
import { 
  ValidationResult, 
  ValidationIssue, 
  QualityScore, 
  ContractType,
  QualityRequirements 
} from '../types'

describe('QualityScoreCalculator', () => {
  let calculator: QualityScoreCalculator

  beforeEach(() => {
    calculator = new QualityScoreCalculator()
  })

  describe('calculateQualityScore', () => {
    test('calculates perfect score for code with no issues', () => {
      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: true,
          issues: [],
          score: 100
        },
        {
          type: 'logic',
          passed: true,
          issues: [],
          score: 100
        },
        {
          type: 'completeness',
          passed: true,
          issues: [],
          score: 100
        },
        {
          type: 'best-practices',
          passed: true,
          issues: [],
          score: 100
        }
      ]

      const qualityScore = calculator.calculateQualityScore(validationResults)

      expect(qualityScore.overall).toBeGreaterThan(95)
      expect(qualityScore.syntax).toBe(100)
      expect(qualityScore.logic).toBe(100)
      expect(qualityScore.completeness).toBe(100)
      expect(qualityScore.bestPractices).toBe(100)
      expect(qualityScore.productionReadiness).toBeGreaterThan(90)
    })

    test('penalizes critical syntax errors heavily', () => {
      const criticalSyntaxIssue: ValidationIssue = {
        severity: 'critical',
        type: 'syntax-error',
        location: { line: 1, column: 1 },
        message: 'Missing closing brace',
        autoFixable: false
      }

      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: false,
          issues: [criticalSyntaxIssue],
          score: 50
        }
      ]

      const qualityScore = calculator.calculateQualityScore(validationResults)

      expect(qualityScore.syntax).toBeLessThan(80)
      expect(qualityScore.overall).toBeLessThan(70)
      expect(qualityScore.productionReadiness).toBe(0) // Should not be production ready
    })

    test('handles multiple validation issues correctly', () => {
      const syntaxIssue: ValidationIssue = {
        severity: 'warning',
        type: 'syntax-warning',
        location: { line: 5, column: 10 },
        message: 'Unused variable',
        autoFixable: true
      }

      const logicIssue: ValidationIssue = {
        severity: 'critical',
        type: 'missing-function',
        location: { line: 20, column: 1 },
        message: 'Missing required init function',
        autoFixable: false
      }

      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: true,
          issues: [syntaxIssue],
          score: 90
        },
        {
          type: 'logic',
          passed: false,
          issues: [logicIssue],
          score: 60
        }
      ]

      const qualityScore = calculator.calculateQualityScore(validationResults)

      expect(qualityScore.syntax).toBe(90)
      expect(qualityScore.logic).toBeLessThanOrEqual(60)
      expect(qualityScore.overall).toBeLessThan(80)
    })

    test('applies contract-type-specific scoring', () => {
      const nftContractType: ContractType = {
        category: 'nft',
        complexity: 'intermediate',
        features: ['metadata', 'transfer', 'mint']
      }

      const missingMetadataIssue: ValidationIssue = {
        severity: 'critical',
        type: 'missing-metadata',
        location: { line: 10, column: 1 },
        message: 'NFT contract missing metadata support',
        autoFixable: false
      }

      const validationResults: ValidationResult[] = [
        {
          type: 'logic',
          passed: false,
          issues: [missingMetadataIssue],
          score: 80
        }
      ]

      const context = { contractType: nftContractType }
      const qualityScore = calculator.calculateQualityScore(validationResults, context)

      expect(qualityScore.logic).toBeLessThan(80) // Should be penalized for critical issue and missing NFT metadata
    })

    test('uses custom weights when provided', () => {
      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: true,
          issues: [],
          score: 100
        },
        {
          type: 'logic',
          passed: true,
          issues: [],
          score: 60 // Lower logic score
        }
      ]

      // Test with default weights
      const defaultScore = calculator.calculateQualityScore(validationResults)

      // Test with custom weights (emphasize logic more)
      const customWeights = {
        syntax: 0.1,
        logic: 0.6,
        completeness: 0.1,
        bestPractices: 0.1,
        productionReadiness: 0.1
      }

      const customScore = calculator.calculateQualityScore(validationResults, {
        contractType: { category: 'generic', complexity: 'simple', features: [] },
        requirements: { minimumQualityScore: 70, requiredFeatures: [], prohibitedPatterns: [], performanceRequirements: { maxGenerationTime: 5000, maxValidationTime: 1000, maxRetryAttempts: 3 } },
        weights: customWeights
      })

      expect(customScore.overall).toBeLessThan(defaultScore.overall)
    })
  })

  describe('calculateSyntaxScore', () => {
    test('returns 100 for perfect syntax', () => {
      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: true,
          issues: [],
          score: 100
        }
      ]

      const score = calculator.calculateSyntaxScore(validationResults)
      expect(score).toBe(100)
    })

    test('penalizes critical syntax errors', () => {
      const criticalIssue: ValidationIssue = {
        severity: 'critical',
        type: 'syntax-error',
        location: { line: 1, column: 1 },
        message: 'Parse error',
        autoFixable: false
      }

      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: false,
          issues: [criticalIssue],
          score: 50
        }
      ]

      const score = calculator.calculateSyntaxScore(validationResults)
      expect(score).toBe(75) // 100 - 25 for critical issue
    })

    test('handles multiple syntax issues with different severities', () => {
      const issues: ValidationIssue[] = [
        {
          severity: 'critical',
          type: 'parse-error',
          location: { line: 1, column: 1 },
          message: 'Parse error',
          autoFixable: false
        },
        {
          severity: 'warning',
          type: 'style-warning',
          location: { line: 5, column: 10 },
          message: 'Style issue',
          autoFixable: true
        },
        {
          severity: 'info',
          type: 'suggestion',
          location: { line: 10, column: 5 },
          message: 'Consider refactoring',
          autoFixable: false
        }
      ]

      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: false,
          issues,
          score: 50
        }
      ]

      const score = calculator.calculateSyntaxScore(validationResults)
      expect(score).toBe(63) // 100 - 25 (critical) - 10 (warning) - 2 (info)
    })

    test('returns default score when no syntax validation performed', () => {
      const validationResults: ValidationResult[] = []
      const score = calculator.calculateSyntaxScore(validationResults)
      expect(score).toBe(50)
    })
  })

  describe('meetsQualityThreshold', () => {
    test('returns true when score meets threshold', () => {
      const qualityScore: QualityScore = {
        overall: 85,
        syntax: 90,
        logic: 80,
        completeness: 85,
        bestPractices: 75,
        productionReadiness: 80
      }

      expect(calculator.meetsQualityThreshold(qualityScore, 80)).toBe(true)
      expect(calculator.meetsQualityThreshold(qualityScore, 90)).toBe(false)
    })

    test('handles edge cases correctly', () => {
      const qualityScore: QualityScore = {
        overall: 75,
        syntax: 75,
        logic: 75,
        completeness: 75,
        bestPractices: 75,
        productionReadiness: 75
      }

      expect(calculator.meetsQualityThreshold(qualityScore, 75)).toBe(true)
      expect(calculator.meetsQualityThreshold(qualityScore, 76)).toBe(false)
    })
  })

  describe('isProductionReady', () => {
    test('returns true for high-quality code', () => {
      const qualityScore: QualityScore = {
        overall: 90,
        syntax: 95,
        logic: 90,
        completeness: 88,
        bestPractices: 85,
        productionReadiness: 92
      }

      expect(calculator.isProductionReady(qualityScore)).toBe(true)
    })

    test('returns false for low production readiness score', () => {
      const qualityScore: QualityScore = {
        overall: 80,
        syntax: 85,
        logic: 80,
        completeness: 75,
        bestPractices: 70,
        productionReadiness: 60 // Below production ready threshold
      }

      expect(calculator.isProductionReady(qualityScore)).toBe(false)
    })

    test('uses custom thresholds when provided', () => {
      const qualityScore: QualityScore = {
        overall: 80,
        syntax: 80,
        logic: 80,
        completeness: 80,
        bestPractices: 80,
        productionReadiness: 80
      }

      const context = {
        contractType: { category: 'generic' as const, complexity: 'simple' as const, features: [] },
        requirements: { 
          minimumQualityScore: 70, 
          requiredFeatures: [], 
          prohibitedPatterns: [], 
          performanceRequirements: { maxGenerationTime: 5000, maxValidationTime: 1000, maxRetryAttempts: 3 } 
        },
        thresholds: { productionReady: 75 }
      }

      expect(calculator.isProductionReady(qualityScore, context)).toBe(true)
    })
  })

  describe('getQualityAssessment', () => {
    test('provides correct assessment for excellent code', () => {
      const qualityScore: QualityScore = {
        overall: 95,
        syntax: 98,
        logic: 95,
        completeness: 92,
        bestPractices: 90,
        productionReadiness: 95
      }

      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: true,
          issues: [],
          score: 98
        }
      ]

      const assessment = calculator.getQualityAssessment(qualityScore, validationResults)

      expect(assessment.level).toBe('excellent')
      expect(assessment.productionReady).toBe(true)
      expect(assessment.recommendations).toHaveLength(0)
    })

    test('provides recommendations for poor quality code', () => {
      const qualityScore: QualityScore = {
        overall: 45,
        syntax: 60,
        logic: 40,
        completeness: 35,
        bestPractices: 50,
        productionReadiness: 20
      }

      const criticalIssue: ValidationIssue = {
        severity: 'critical',
        type: 'missing-function',
        location: { line: 1, column: 1 },
        message: 'Missing required function',
        autoFixable: false
      }

      const validationResults: ValidationResult[] = [
        {
          type: 'logic',
          passed: false,
          issues: [criticalIssue],
          score: 40
        }
      ]

      const assessment = calculator.getQualityAssessment(qualityScore, validationResults)

      expect(assessment.level).toBe('poor')
      expect(assessment.productionReady).toBe(false)
      expect(assessment.recommendations.length).toBeGreaterThan(3)
      expect(assessment.recommendations.some(r => r.includes('critical issues'))).toBe(true)
    })
  })

  describe('contract-type-specific scoring', () => {
    test('applies NFT-specific logic scoring', () => {
      const nftContractType: ContractType = {
        category: 'nft',
        complexity: 'intermediate',
        features: ['metadata', 'transfer']
      }

      const metadataIssue: ValidationIssue = {
        severity: 'critical',
        type: 'missing-metadata',
        location: { line: 10, column: 1 },
        message: 'Missing metadata support',
        autoFixable: false
      }

      const validationResults: ValidationResult[] = [
        {
          type: 'logic',
          passed: false,
          issues: [metadataIssue],
          score: 80
        }
      ]

      const context = { contractType: nftContractType }
      const qualityScore = calculator.calculateQualityScore(validationResults, context)

      expect(qualityScore.logic).toBeLessThan(80) // Should be penalized for missing metadata
    })

    test('applies fungible token-specific logic scoring', () => {
      const tokenContractType: ContractType = {
        category: 'fungible-token',
        complexity: 'intermediate',
        features: ['transfer', 'mint', 'burn']
      }

      const supplyIssue: ValidationIssue = {
        severity: 'critical',
        type: 'missing-supply',
        location: { line: 15, column: 1 },
        message: 'Missing supply management',
        autoFixable: false
      }

      const validationResults: ValidationResult[] = [
        {
          type: 'logic',
          passed: false,
          issues: [supplyIssue],
          score: 85
        }
      ]

      const context = { contractType: tokenContractType }
      const qualityScore = calculator.calculateQualityScore(validationResults, context)

      expect(qualityScore.logic).toBeLessThan(85) // Should be penalized for missing supply management
    })
  })

  describe('edge cases and error handling', () => {
    test('handles empty validation results', () => {
      const validationResults: ValidationResult[] = []
      const qualityScore = calculator.calculateQualityScore(validationResults)

      expect(qualityScore.overall).toBeGreaterThan(0)
      expect(qualityScore.overall).toBeLessThan(100)
      expect(qualityScore.syntax).toBe(50) // Default score
      expect(qualityScore.logic).toBe(50)
      expect(qualityScore.completeness).toBe(50)
      expect(qualityScore.bestPractices).toBe(50)
    })

    test('handles validation results without scores', () => {
      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: true,
          issues: []
          // No score property
        }
      ]

      const qualityScore = calculator.calculateQualityScore(validationResults)
      expect(qualityScore.syntax).toBe(100) // Should return 100 for passed validation with no issues
    })

    test('ensures scores stay within 0-100 range', () => {
      const manyIssues: ValidationIssue[] = Array.from({ length: 10 }, (_, i) => ({
        severity: 'critical' as const,
        type: `critical-issue-${i}`,
        location: { line: i + 1, column: 1 },
        message: `Critical issue ${i}`,
        autoFixable: false
      }))

      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: false,
          issues: manyIssues,
          score: 100
        }
      ]

      const qualityScore = calculator.calculateQualityScore(validationResults)

      expect(qualityScore.overall).toBeGreaterThanOrEqual(0)
      expect(qualityScore.overall).toBeLessThanOrEqual(100)
      expect(qualityScore.syntax).toBeGreaterThanOrEqual(0)
      expect(qualityScore.syntax).toBeLessThanOrEqual(100)
    })
  })

  describe('consistency and accuracy', () => {
    test('produces consistent scores for identical inputs', () => {
      const validationResults: ValidationResult[] = [
        {
          type: 'syntax',
          passed: true,
          issues: [],
          score: 85
        },
        {
          type: 'logic',
          passed: true,
          issues: [],
          score: 90
        }
      ]

      const score1 = calculator.calculateQualityScore(validationResults)
      const score2 = calculator.calculateQualityScore(validationResults)

      expect(score1).toEqual(score2)
    })

    test('scores correlate with issue severity', () => {
      const createValidationResult = (severity: 'critical' | 'warning' | 'info') => [
        {
          type: 'syntax' as const,
          passed: false,
          issues: [{
            severity,
            type: 'test-issue',
            location: { line: 1, column: 1 },
            message: 'Test issue',
            autoFixable: false
          }],
          score: 80
        }
      ]

      const criticalScore = calculator.calculateQualityScore(createValidationResult('critical'))
      const warningScore = calculator.calculateQualityScore(createValidationResult('warning'))
      const infoScore = calculator.calculateQualityScore(createValidationResult('info'))

      expect(criticalScore.overall).toBeLessThanOrEqual(warningScore.overall)
      expect(warningScore.overall).toBeLessThanOrEqual(infoScore.overall)
    })
  })
})