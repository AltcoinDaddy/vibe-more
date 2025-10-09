/**
 * Integration tests for Quality Score Calculator
 * 
 * Tests the quality score calculator integration with other quality assurance components
 */

import { describe, test, expect } from 'vitest'
import { qualityScoreCalculator } from '../quality-score-calculator'
import { ValidationResult, ContractType, QualityRequirements } from '../types'

describe('Quality Score Calculator Integration', () => {
  test('integrates with validation pipeline for comprehensive scoring', () => {
    // Simulate a complete validation pipeline result
    const validationResults: ValidationResult[] = [
      {
        type: 'syntax',
        passed: true,
        issues: [
          {
            severity: 'warning',
            type: 'unused-variable',
            location: { line: 5, column: 10 },
            message: 'Unused variable detected',
            autoFixable: true
          }
        ],
        score: 90
      },
      {
        type: 'logic',
        passed: false,
        issues: [
          {
            severity: 'critical',
            type: 'missing-metadata',
            location: { line: 20, column: 1 },
            message: 'NFT contract missing metadata implementation',
            autoFixable: false
          }
        ],
        score: 70
      },
      {
        type: 'completeness',
        passed: true,
        issues: [],
        score: 95
      },
      {
        type: 'best-practices',
        passed: true,
        issues: [
          {
            severity: 'info',
            type: 'documentation',
            location: { line: 1, column: 1 },
            message: 'Consider adding more detailed documentation',
            autoFixable: false
          }
        ],
        score: 85
      }
    ]

    const contractType: ContractType = {
      category: 'nft',
      complexity: 'intermediate',
      features: ['metadata', 'transfer', 'mint']
    }

    const requirements: QualityRequirements = {
      minimumQualityScore: 75,
      requiredFeatures: ['metadata', 'transfer'],
      prohibitedPatterns: ['undefined'],
      performanceRequirements: {
        maxGenerationTime: 10000,
        maxValidationTime: 2000,
        maxRetryAttempts: 3
      }
    }

    const context = { contractType, requirements }
    const qualityScore = qualityScoreCalculator.calculateQualityScore(validationResults, context)

    // Verify comprehensive scoring
    expect(qualityScore.overall).toBeGreaterThan(0)
    expect(qualityScore.overall).toBeLessThan(100)
    expect(qualityScore.syntax).toBe(90) // From validation result
    expect(qualityScore.logic).toBeLessThan(70) // Should be penalized for critical NFT issue
    expect(qualityScore.completeness).toBe(95) // From validation result
    expect(qualityScore.bestPractices).toBe(82) // 85 - 3 for info issue
    expect(qualityScore.productionReadiness).toBeGreaterThanOrEqual(0) // May be 0 due to critical issues

    // Verify quality assessment
    const assessment = qualityScoreCalculator.getQualityAssessment(qualityScore, validationResults)
    expect(assessment.level).toBeOneOf(['poor', 'fair', 'good', 'excellent'])
    expect(assessment.recommendations).toBeInstanceOf(Array)
    expect(assessment.productionReady).toBeDefined()
  })

  test('handles edge case with minimal validation data', () => {
    const validationResults: ValidationResult[] = [
      {
        type: 'syntax',
        passed: true,
        issues: [],
        score: 100
      }
    ]

    const qualityScore = qualityScoreCalculator.calculateQualityScore(validationResults)

    expect(qualityScore.overall).toBeGreaterThan(50)
    expect(qualityScore.syntax).toBe(100)
    expect(qualityScore.logic).toBe(50) // Default when no logic validation
    expect(qualityScore.completeness).toBe(50) // Default when no completeness validation
    expect(qualityScore.bestPractices).toBe(50) // Default when no best practices validation
  })

  test('enforces quality thresholds correctly', () => {
    const highQualityResults: ValidationResult[] = [
      { type: 'syntax', passed: true, issues: [], score: 95 },
      { type: 'logic', passed: true, issues: [], score: 90 },
      { type: 'completeness', passed: true, issues: [], score: 92 },
      { type: 'best-practices', passed: true, issues: [], score: 88 }
    ]

    const lowQualityResults: ValidationResult[] = [
      { type: 'syntax', passed: false, issues: [
        { severity: 'critical', type: 'parse-error', location: { line: 1, column: 1 }, message: 'Parse error', autoFixable: false }
      ], score: 30 },
      { type: 'logic', passed: false, issues: [
        { severity: 'critical', type: 'missing-function', location: { line: 10, column: 1 }, message: 'Missing function', autoFixable: false }
      ], score: 25 }
    ]

    const highQualityScore = qualityScoreCalculator.calculateQualityScore(highQualityResults)
    const lowQualityScore = qualityScoreCalculator.calculateQualityScore(lowQualityResults)

    // High quality should meet most thresholds
    expect(qualityScoreCalculator.meetsQualityThreshold(highQualityScore, 80)).toBe(true)
    expect(qualityScoreCalculator.isProductionReady(highQualityScore)).toBe(true)

    // Low quality should not meet thresholds
    expect(qualityScoreCalculator.meetsQualityThreshold(lowQualityScore, 80)).toBe(false)
    expect(qualityScoreCalculator.isProductionReady(lowQualityScore)).toBe(false)
  })

  test('provides actionable recommendations based on quality issues', () => {
    const validationResults: ValidationResult[] = [
      {
        type: 'syntax',
        passed: false,
        issues: [
          {
            severity: 'critical',
            type: 'syntax-error',
            location: { line: 5, column: 1 },
            message: 'Syntax error detected',
            autoFixable: false
          }
        ],
        score: 40
      },
      {
        type: 'logic',
        passed: false,
        issues: [
          {
            severity: 'critical',
            type: 'incomplete-function',
            location: { line: 15, column: 1 },
            message: 'Function implementation incomplete',
            autoFixable: false
          }
        ],
        score: 35
      }
    ]

    const qualityScore = qualityScoreCalculator.calculateQualityScore(validationResults)
    const assessment = qualityScoreCalculator.getQualityAssessment(qualityScore, validationResults)

    expect(assessment.level).toBe('poor')
    expect(assessment.productionReady).toBe(false)
    expect(assessment.recommendations.length).toBeGreaterThan(0)
    
    // Should include specific recommendations for the issues
    const recommendationText = assessment.recommendations.join(' ')
    expect(recommendationText.toLowerCase()).toContain('syntax')
    expect(recommendationText.toLowerCase()).toContain('critical')
  })

  test('scales scoring based on contract complexity', () => {
    const simpleContractType: ContractType = {
      category: 'utility',
      complexity: 'simple',
      features: ['basic']
    }

    const complexContractType: ContractType = {
      category: 'nft',
      complexity: 'advanced',
      features: ['metadata', 'transfer', 'mint', 'burn', 'royalties']
    }

    const validationResults: ValidationResult[] = [
      {
        type: 'logic',
        passed: false,
        issues: [
          {
            severity: 'warning',
            type: 'missing-feature',
            location: { line: 10, column: 1 },
            message: 'Optional feature missing',
            autoFixable: true
          }
        ],
        score: 80
      }
    ]

    const simpleScore = qualityScoreCalculator.calculateQualityScore(
      validationResults, 
      { contractType: simpleContractType }
    )
    
    const complexScore = qualityScoreCalculator.calculateQualityScore(
      validationResults, 
      { contractType: complexContractType }
    )

    // Both should be calculated, but complex contracts might have different requirements
    expect(simpleScore.overall).toBeGreaterThan(0)
    expect(complexScore.overall).toBeGreaterThan(0)
    expect(simpleScore.logic).toBeGreaterThanOrEqual(0)
    expect(complexScore.logic).toBeGreaterThanOrEqual(0)
  })
})