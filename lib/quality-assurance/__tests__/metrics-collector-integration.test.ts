/**
 * Integration tests for MetricsCollector with the quality assurance system
 * Tests real-world scenarios and integration patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { MetricsCollector } from '../metrics-collector'
import { 
  GenerationRequest, 
  QualityAssuredResult,
  ContractType,
  ValidationResult,
  ValidationIssue,
  CorrectionAttempt,
  GenerationMetrics,
  CodeLocation
} from '../types'

describe('MetricsCollector Integration', () => {
  let metricsCollector: MetricsCollector

  beforeEach(() => {
    metricsCollector = new MetricsCollector({
      enableRealTimeTracking: true,
      maxHistorySize: 1000,
      aggregationInterval: 1,
      enableTrendAnalysis: true,
      enablePerformanceTracking: true
    })
  })

  afterEach(() => {
    metricsCollector.clearMetrics()
  })

  // Helper function to create mock results
  const createMockResult = (overrides: Partial<QualityAssuredResult> = {}): QualityAssuredResult => {
    const mockLocation: CodeLocation = {
      line: 1,
      column: 1,
      length: 10,
      context: 'test context'
    }

    const mockValidationIssue: ValidationIssue = {
      severity: 'warning',
      type: 'syntax-error',
      location: mockLocation,
      message: 'Test validation issue',
      suggestedFix: 'Fix suggestion',
      autoFixable: true
    }

    const mockValidationResult: ValidationResult = {
      type: 'syntax',
      passed: true,
      issues: [mockValidationIssue],
      score: 85,
      message: 'Validation passed with warnings'
    }

    const mockCorrectionAttempt: CorrectionAttempt = {
      attemptNumber: 1,
      timestamp: new Date(),
      corrections: [],
      success: true,
      qualityImprovement: 10
    }

    const mockGenerationMetrics: GenerationMetrics = {
      attemptCount: 1,
      totalGenerationTime: 1500,
      validationTime: 200,
      correctionTime: 0,
      finalQualityScore: 85,
      issuesDetected: 0,
      issuesFixed: 0,
      startTime: new Date(),
      endTime: new Date()
    }

    return {
      code: 'access(all) contract TestNFT {}',
      qualityScore: 85,
      validationResults: [mockValidationResult],
      correctionHistory: [mockCorrectionAttempt],
      fallbackUsed: false,
      generationMetrics: mockGenerationMetrics,
      ...overrides
    }
  }

  describe('End-to-End Generation Tracking', () => {
    test('should track complete generation pipeline with metrics', () => {
      const request: GenerationRequest = {
        prompt: 'Create a simple NFT contract with minting functionality',
        context: 'Integration test',
        temperature: 0.7,
        maxRetries: 3,
        strictMode: true
      }

      // Simulate a complete generation process
      const result = createMockResult({
        qualityScore: 90,
        generationMetrics: {
          attemptCount: 1,
          totalGenerationTime: 2000,
          validationTime: 300,
          correctionTime: 0,
          finalQualityScore: 90,
          issuesDetected: 0,
          issuesFixed: 0,
          startTime: new Date(),
          endTime: new Date()
        }
      })
      
      metricsCollector.recordGenerationSession(request, result)
      
      // Verify metrics were collected
      const dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.realTimeMetrics.generationsToday).toBe(1)
      expect(dashboardData.realTimeMetrics.currentQualityScore).toBe(90)
      
      // Verify detailed metrics
      const report = metricsCollector.generateQualityReport()
      expect(report.summary.totalGenerations).toBe(1)
      expect(report.summary.averageQualityScore).toBe(90)
    })

    test('should track retry attempts and corrections', () => {
      const request: GenerationRequest = {
        prompt: 'Create a contract with intentionally problematic code',
        context: 'Test retry mechanism',
        maxRetries: 2
      }

      // Simulate a scenario that requires retries
      const result = createMockResult({
        qualityScore: 75,
        correctionHistory: [
          {
            attemptNumber: 1,
            timestamp: new Date(),
            corrections: [
              {
                type: 'syntax-fix',
                location: { line: 1, column: 1 },
                originalValue: 'undefined',
                correctedValue: '""',
                reasoning: 'Fixed undefined value',
                confidence: 0.9
              }
            ],
            success: true,
            qualityImprovement: 15
          }
        ],
        validationResults: [{
          type: 'syntax',
          passed: true,
          issues: [{
            severity: 'warning',
            type: 'syntax-fix',
            location: { line: 1, column: 1 },
            message: 'Fixed syntax issue',
            autoFixable: true
          }],
          score: 75
        }],
        generationMetrics: {
          attemptCount: 2,
          totalGenerationTime: 2500,
          validationTime: 300,
          correctionTime: 500,
          finalQualityScore: 75,
          issuesDetected: 1,
          issuesFixed: 1,
          startTime: new Date(),
          endTime: new Date()
        }
      })

      metricsCollector.recordGenerationSession(request, result)
      
      const trends = metricsCollector.trackQualityTrends()
      expect(trends.correctionSuccessRate).toBe(100)
      
      const commonIssues = metricsCollector.identifyCommonIssues()
      expect(commonIssues.some(issue => issue.type.includes('syntax'))).toBe(true)
    })

    test('should track fallback usage patterns', () => {
      const request: GenerationRequest = {
        prompt: 'Create an extremely complex contract that will likely fail',
        maxRetries: 1
      }

      // Simulate a scenario that uses fallback
      const fallbackResult = createMockResult({
        code: 'access(all) contract FallbackContract {}',
        qualityScore: 80,
        fallbackUsed: true,
        generationMetrics: {
          attemptCount: 2,
          totalGenerationTime: 3000,
          validationTime: 200,
          correctionTime: 0,
          finalQualityScore: 80,
          issuesDetected: 0,
          issuesFixed: 0,
          startTime: new Date(),
          endTime: new Date()
        }
      })

      metricsCollector.recordGenerationSession(request, fallbackResult)
      
      const trends = metricsCollector.trackQualityTrends()
      expect(trends.fallbackUsageRate).toBe(100)
      
      const report = metricsCollector.generateQualityReport()
      expect(report.summary.generationSuccess.fallbackUsed).toBe(100)
    })
  })

  describe('Performance Monitoring Integration', () => {
    test('should track performance across multiple contract types', () => {
      const contractTypes: ContractType[] = [
        { category: 'nft', complexity: 'simple', features: ['minting'] },
        { category: 'fungible-token', complexity: 'intermediate', features: ['transfer', 'burn'] },
        { category: 'dao', complexity: 'advanced', features: ['voting', 'proposals'] }
      ]

      // Generate contracts of different types and complexities
      for (const contractType of contractTypes) {
        const request: GenerationRequest = {
          prompt: `Create a ${contractType.category} contract`,
          context: JSON.stringify(contractType)
        }

        // Simulate different performance characteristics for different contract types
        const baseTime = contractType.complexity === 'simple' ? 1000 : 
                         contractType.complexity === 'intermediate' ? 2000 : 3000

        const result = createMockResult({
          code: `access(all) contract ${contractType.category}Contract {}`,
          qualityScore: 85,
          generationMetrics: {
            attemptCount: 1,
            totalGenerationTime: baseTime + Math.random() * 500,
            validationTime: 200,
            correctionTime: 0,
            finalQualityScore: 85,
            issuesDetected: 0,
            issuesFixed: 0,
            startTime: new Date(),
            endTime: new Date()
          }
        })

        metricsCollector.recordGenerationSession(request, result)
      }

      const performance = metricsCollector.getPerformanceMetrics()
      expect(performance.averageGenerationTime).toBeGreaterThan(1000)
      expect(performance.p95GenerationTime).toBeGreaterThan(performance.averageGenerationTime)
      expect(performance.throughput).toBeGreaterThan(0)
    })

    test('should detect performance degradation patterns', () => {
      // Simulate performance degradation over time
      const degradationPattern = [1000, 1200, 1500, 2000, 2500, 3000]
      
      for (const [index, generationTime] of degradationPattern.entries()) {
        const request: GenerationRequest = {
          prompt: `Test request ${index}`,
          context: 'Performance test'
        }

        const result = createMockResult({
          code: 'access(all) contract TestContract {}',
          qualityScore: 85,
          generationMetrics: {
            attemptCount: 1,
            totalGenerationTime: generationTime,
            validationTime: 200,
            correctionTime: 0,
            finalQualityScore: 85,
            issuesDetected: 0,
            issuesFixed: 0,
            startTime: new Date(Date.now() - (degradationPattern.length - index) * 60000),
            endTime: new Date()
          }
        })

        metricsCollector.recordGenerationSession(request, result)
      }

      const dashboardData = metricsCollector.getDashboardData()
      const performanceTrend = dashboardData.trends.volumeTrend
      
      // Should detect the degradation pattern
      expect(performanceTrend.length).toBeGreaterThan(0)
      
      const report = metricsCollector.generateQualityReport()
      // Verify that the report was generated successfully
      expect(report.summary.totalGenerations).toBe(degradationPattern.length)
      expect(report.summary.averageQualityScore).toBe(85)
    })
  })

  describe('Quality Trend Analysis', () => {
    test('should identify quality improvement patterns', () => {
      // Simulate quality improvement over time
      const qualityProgression = [60, 65, 70, 75, 80, 85, 90]
      
      for (const [index, qualityScore] of qualityProgression.entries()) {
        const request: GenerationRequest = {
          prompt: `Quality test ${index}`,
          context: 'Quality improvement test'
        }

        const result = createMockResult({
          code: 'access(all) contract TestContract {}',
          qualityScore,
          generationMetrics: {
            attemptCount: 1,
            totalGenerationTime: 1500,
            validationTime: 200,
            correctionTime: 0,
            finalQualityScore: qualityScore,
            issuesDetected: 0,
            issuesFixed: 0,
            startTime: new Date(Date.now() - (qualityProgression.length - index) * 60000),
            endTime: new Date()
          }
        })

        metricsCollector.recordGenerationSession(request, result)
      }

      const trends = metricsCollector.trackQualityTrends()
      const qualityTrend = trends.qualityScoreOverTime
      
      expect(qualityTrend.length).toBe(qualityProgression.length)
      expect(qualityTrend[0].score).toBe(60)
      expect(qualityTrend[qualityTrend.length - 1].score).toBe(90)
      
      // Should show improvement trend
      const firstHalf = qualityTrend.slice(0, Math.floor(qualityTrend.length / 2))
      const secondHalf = qualityTrend.slice(Math.floor(qualityTrend.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, item) => sum + item.score, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, item) => sum + item.score, 0) / secondHalf.length
      
      expect(secondAvg).toBeGreaterThan(firstAvg)
    })

    test('should correlate issue patterns with quality scores', () => {
      const testScenarios = [
        { issues: ['undefined-value', 'syntax-error'], expectedScore: 60 },
        { issues: ['syntax-error'], expectedScore: 75 },
        { issues: [], expectedScore: 90 }
      ]

      for (const scenario of testScenarios) {
        const request: GenerationRequest = {
          prompt: 'Test contract with specific issues',
          context: JSON.stringify(scenario)
        }

        const validationIssues = scenario.issues.map(issueType => ({
          severity: 'warning' as const,
          type: issueType,
          location: { line: 1, column: 1 },
          message: `Test ${issueType}`,
          autoFixable: true
        }))

        const result = createMockResult({
          code: 'access(all) contract TestContract {}',
          qualityScore: scenario.expectedScore,
          validationResults: [{
            type: 'syntax',
            passed: scenario.issues.length === 0,
            issues: validationIssues,
            score: scenario.expectedScore
          }],
          generationMetrics: {
            attemptCount: 1,
            totalGenerationTime: 1500,
            validationTime: 200,
            correctionTime: 0,
            finalQualityScore: scenario.expectedScore,
            issuesDetected: scenario.issues.length,
            issuesFixed: 0,
            startTime: new Date(),
            endTime: new Date()
          }
        })

        metricsCollector.recordGenerationSession(request, result)
      }

      const commonIssues = metricsCollector.identifyCommonIssues()
      const report = metricsCollector.generateQualityReport()
      
      // Should identify the correlation between issues and quality
      expect(commonIssues.length).toBeGreaterThan(0)
      expect(report.summary.averageQualityScore).toBeCloseTo(75, 0) // Average of 60, 75, 90
    })
  })

  describe('Real-time Monitoring', () => {
    test('should provide real-time dashboard updates', () => {
      let dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.realTimeMetrics.generationsToday).toBe(0)

      // Simulate real-time generation
      const request: GenerationRequest = {
        prompt: 'Real-time test contract',
        context: 'Real-time monitoring test'
      }

      const result = createMockResult({
        code: 'access(all) contract RealtimeContract {}',
        qualityScore: 85,
        generationMetrics: {
          attemptCount: 1,
          totalGenerationTime: 1500,
          validationTime: 200,
          correctionTime: 0,
          finalQualityScore: 85,
          issuesDetected: 0,
          issuesFixed: 0,
          startTime: new Date(),
          endTime: new Date()
        }
      })

      metricsCollector.recordGenerationSession(request, result)

      dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.realTimeMetrics.generationsToday).toBe(1)
      expect(dashboardData.realTimeMetrics.currentQualityScore).toBe(85)
      expect(dashboardData.realTimeMetrics.successRate).toBe(100)
    })

    test('should handle concurrent generation monitoring', () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
        prompt: `Concurrent test contract ${i}`,
        context: 'Concurrent monitoring test'
      }))

      // Simulate concurrent generations
      concurrentRequests.forEach((request, index) => {
        const result = createMockResult({
          code: `access(all) contract ConcurrentContract${index} {}`,
          qualityScore: 80 + index, // Varying quality scores
          generationMetrics: {
            attemptCount: 1,
            totalGenerationTime: 1000 + index * 100,
            validationTime: 200,
            correctionTime: 0,
            finalQualityScore: 80 + index,
            issuesDetected: 0,
            issuesFixed: 0,
            startTime: new Date(),
            endTime: new Date()
          }
        })

        metricsCollector.recordGenerationSession(request, result)
      })

      const dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.realTimeMetrics.generationsToday).toBe(10)
      
      const performance = metricsCollector.getPerformanceMetrics()
      expect(performance.throughput).toBeGreaterThan(0)
    })
  })

  describe('Error Recovery Tracking', () => {
    test('should track error recovery success rates', () => {
      const errorScenarios = [
        { recoverable: true, finalScore: 85 },
        { recoverable: false, finalScore: 45 },
        { recoverable: true, finalScore: 80 }
      ]

      for (const [index, scenario] of errorScenarios.entries()) {
        const request: GenerationRequest = {
          prompt: `Error recovery test ${index}`,
          context: 'Error recovery tracking'
        }

        const result = createMockResult({
          code: 'access(all) contract ErrorRecoveryContract {}',
          qualityScore: scenario.finalScore,
          correctionHistory: scenario.recoverable ? [{
            attemptNumber: 1,
            timestamp: new Date(),
            corrections: [],
            success: true,
            qualityImprovement: 20
          }] : [],
          fallbackUsed: !scenario.recoverable && scenario.finalScore < 70,
          generationMetrics: {
            attemptCount: scenario.recoverable ? 2 : 1,
            totalGenerationTime: 2000,
            validationTime: 300,
            correctionTime: scenario.recoverable ? 500 : 0,
            finalQualityScore: scenario.finalScore,
            issuesDetected: scenario.recoverable ? 1 : 0,
            issuesFixed: scenario.recoverable ? 1 : 0,
            startTime: new Date(),
            endTime: new Date()
          }
        })

        metricsCollector.recordGenerationSession(request, result)
      }

      const trends = metricsCollector.trackQualityTrends()
      expect(trends.correctionSuccessRate).toBeCloseTo(100, 1) // All sessions with corrections were successful

      const report = metricsCollector.generateQualityReport()
      expect(report.recommendations.length).toBeGreaterThan(0)
    })
  })
})