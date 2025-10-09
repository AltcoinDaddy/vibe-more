/**
 * Comprehensive tests for MetricsCollector
 * Tests metrics collection accuracy, performance impact, and reporting capabilities
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { MetricsCollector } from '../metrics-collector'
import { 
  GenerationRequest, 
  QualityAssuredResult, 
  ValidationResult,
  ValidationIssue,
  CorrectionAttempt,
  GenerationMetrics,
  CodeLocation
} from '../types'

describe('MetricsCollector', () => {
  let metricsCollector: MetricsCollector
  let mockRequest: GenerationRequest
  let mockResult: QualityAssuredResult

  beforeEach(() => {
    metricsCollector = new MetricsCollector({
      enableRealTimeTracking: false, // Disable for testing
      maxHistorySize: 1000,
      aggregationInterval: 1,
      enableTrendAnalysis: true,
      enablePerformanceTracking: true
    })

    mockRequest = {
      prompt: 'Create an NFT contract',
      context: 'Test context',
      temperature: 0.7,
      maxRetries: 3,
      strictMode: true
    }

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
      attemptCount: 2,
      totalGenerationTime: 1500,
      validationTime: 200,
      correctionTime: 300,
      finalQualityScore: 85,
      issuesDetected: 1,
      issuesFixed: 1,
      startTime: new Date(),
      endTime: new Date()
    }

    mockResult = {
      code: 'access(all) contract TestNFT {}',
      qualityScore: 85,
      validationResults: [mockValidationResult],
      correctionHistory: [mockCorrectionAttempt],
      fallbackUsed: false,
      generationMetrics: mockGenerationMetrics
    }
  })

  afterEach(() => {
    metricsCollector.clearMetrics()
  })

  describe('Session Recording', () => {
    test('should record generation session with all metrics', () => {
      const sessionId = metricsCollector.recordGenerationSession(mockRequest, mockResult)
      
      expect(sessionId).toBeDefined()
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/)
      
      const dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.realTimeMetrics.generationsToday).toBe(1)
    })

    test('should handle custom session IDs', () => {
      const customId = 'custom-session-123'
      const sessionId = metricsCollector.recordGenerationSession(mockRequest, mockResult, customId)
      
      expect(sessionId).toBe(customId)
    })

    test('should track success and failure correctly', () => {
      // Record successful session
      metricsCollector.recordGenerationSession(mockRequest, mockResult)
      
      // Record failed session
      const failedResult = { ...mockResult, qualityScore: 50 }
      metricsCollector.recordGenerationSession(mockRequest, failedResult)
      
      const dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.realTimeMetrics.successRate).toBe(50) // 1 success out of 2
    })

    test('should track retry counts and fallback usage', () => {
      const resultWithRetries = {
        ...mockResult,
        generationMetrics: {
          ...mockResult.generationMetrics,
          attemptCount: 3
        },
        fallbackUsed: true
      }
      
      metricsCollector.recordGenerationSession(mockRequest, resultWithRetries)
      
      const report = metricsCollector.generateQualityReport()
      expect(report.summary.generationSuccess.fallbackUsed).toBeGreaterThan(0)
    })
  })

  describe('Quality Trends Tracking', () => {
    test('should track quality trends over time', () => {
      // Record multiple sessions with different quality scores
      const scores = [70, 80, 85, 90, 95]
      scores.forEach((score, index) => {
        const result = { ...mockResult, qualityScore: score }
        // Simulate different timestamps
        result.generationMetrics.startTime = new Date(Date.now() - (scores.length - index) * 60000)
        metricsCollector.recordGenerationSession(mockRequest, result)
      })
      
      const trends = metricsCollector.trackQualityTrends()
      
      expect(trends.qualityScoreOverTime).toHaveLength(5)
      expect(trends.qualityScoreOverTime[0].score).toBe(70)
      expect(trends.qualityScoreOverTime[4].score).toBe(95)
    })

    test('should calculate issue frequency trends', () => {
      // Create sessions with different issue types
      const issueTypes = ['syntax-error', 'undefined-value', 'logic-error']
      
      issueTypes.forEach(type => {
        const issue: ValidationIssue = {
          severity: 'warning',
          type,
          location: { line: 1, column: 1 },
          message: `Test ${type}`,
          autoFixable: true
        }
        
        const result = {
          ...mockResult,
          validationResults: [{
            ...mockResult.validationResults[0],
            issues: [issue]
          }]
        }
        
        metricsCollector.recordGenerationSession(mockRequest, result)
      })
      
      const trends = metricsCollector.trackQualityTrends()
      expect(trends.issueFrequencyTrends.length).toBeGreaterThan(0)
    })

    test('should calculate correction success rate', () => {
      // Record sessions with successful corrections
      const successfulCorrection = {
        ...mockResult,
        correctionHistory: [{
          attemptNumber: 1,
          timestamp: new Date(),
          corrections: [],
          success: true,
          qualityImprovement: 15
        }]
      }
      
      metricsCollector.recordGenerationSession(mockRequest, successfulCorrection)
      
      // Record session with failed correction
      const failedCorrection = {
        ...mockResult,
        qualityScore: 60,
        correctionHistory: [{
          attemptNumber: 1,
          timestamp: new Date(),
          corrections: [],
          success: false,
          qualityImprovement: 0
        }]
      }
      
      metricsCollector.recordGenerationSession(mockRequest, failedCorrection)
      
      const trends = metricsCollector.trackQualityTrends()
      expect(trends.correctionSuccessRate).toBe(50) // 1 success out of 2
    })
  })

  describe('Issue Pattern Identification', () => {
    test('should identify common issues', () => {
      // Create multiple sessions with the same issue type
      const commonIssueType = 'undefined-value'
      
      for (let i = 0; i < 5; i++) {
        const issue: ValidationIssue = {
          severity: 'critical',
          type: commonIssueType,
          location: { line: i + 1, column: 1 },
          message: `Undefined value at line ${i + 1}`,
          autoFixable: true
        }
        
        const result = {
          ...mockResult,
          validationResults: [{
            ...mockResult.validationResults[0],
            issues: [issue]
          }]
        }
        
        metricsCollector.recordGenerationSession(mockRequest, result)
      }
      
      const commonIssues = metricsCollector.identifyCommonIssues()
      expect(commonIssues.length).toBeGreaterThan(0)
      
      const undefinedIssue = commonIssues.find(issue => issue.type === commonIssueType)
      expect(undefinedIssue).toBeDefined()
      expect(undefinedIssue?.frequency).toBe(5)
    })

    test('should sort issues by frequency', () => {
      const issueFrequencies = [
        { type: 'rare-issue', count: 1 },
        { type: 'common-issue', count: 10 },
        { type: 'moderate-issue', count: 5 }
      ]
      
      issueFrequencies.forEach(({ type, count }) => {
        for (let i = 0; i < count; i++) {
          const issue: ValidationIssue = {
            severity: 'warning',
            type,
            location: { line: 1, column: 1 },
            message: `Test ${type}`,
            autoFixable: true
          }
          
          const result = {
            ...mockResult,
            validationResults: [{
              ...mockResult.validationResults[0],
              issues: [issue]
            }]
          }
          
          metricsCollector.recordGenerationSession(mockRequest, result)
        }
      })
      
      const commonIssues = metricsCollector.identifyCommonIssues()
      expect(commonIssues[0].type).toBe('common-issue')
      expect(commonIssues[1].type).toBe('moderate-issue')
      expect(commonIssues[2].type).toBe('rare-issue')
    })
  })

  describe('Quality Report Generation', () => {
    test('should generate comprehensive quality report', () => {
      // Record multiple sessions with various characteristics
      const sessions = [
        { ...mockResult, qualityScore: 95, fallbackUsed: false },
        { ...mockResult, qualityScore: 70, fallbackUsed: true },
        { ...mockResult, qualityScore: 85, fallbackUsed: false }
      ]
      
      sessions.forEach(result => {
        metricsCollector.recordGenerationSession(mockRequest, result)
      })
      
      const report = metricsCollector.generateQualityReport()
      
      expect(report.summary).toBeDefined()
      expect(report.trends).toBeDefined()
      expect(report.commonIssues).toBeDefined()
      expect(report.recommendations).toBeDefined()
      expect(report.generatedAt).toBeInstanceOf(Date)
      
      expect(report.summary.totalGenerations).toBe(3)
      expect(report.summary.averageQualityScore).toBeCloseTo(83.33, 1)
    })

    test('should include recommendations based on metrics', () => {
      // Create sessions with low quality scores to trigger recommendations
      for (let i = 0; i < 5; i++) {
        const lowQualityResult = { ...mockResult, qualityScore: 60 }
        metricsCollector.recordGenerationSession(mockRequest, lowQualityResult)
      }
      
      const report = metricsCollector.generateQualityReport()
      expect(report.recommendations.length).toBeGreaterThan(0)
      expect(report.recommendations.some(rec => 
        rec.includes('quality scores') || rec.includes('success rate')
      )).toBe(true)
    })

    test('should handle time range filtering', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      
      // Record old session
      const oldResult = { ...mockResult }
      oldResult.generationMetrics = { ...mockResult.generationMetrics, startTime: twoHoursAgo }
      metricsCollector.recordGenerationSession(mockRequest, oldResult)
      
      // Record recent session  
      const recentResult = { ...mockResult }
      recentResult.generationMetrics = { ...mockResult.generationMetrics, startTime: now }
      metricsCollector.recordGenerationSession(mockRequest, recentResult)
      
      const recentReport = metricsCollector.generateQualityReport({
        start: oneHourAgo,
        end: now
      })
      
      expect(recentReport.summary.totalGenerations).toBe(1)
    })
  })

  describe('Dashboard Data', () => {
    test('should provide real-time dashboard data', () => {
      // Record some sessions
      for (let i = 0; i < 3; i++) {
        metricsCollector.recordGenerationSession(mockRequest, mockResult)
      }
      
      const dashboardData = metricsCollector.getDashboardData()
      
      expect(dashboardData.realTimeMetrics).toBeDefined()
      expect(dashboardData.trends).toBeDefined()
      expect(dashboardData.topIssues).toBeDefined()
      expect(dashboardData.performance).toBeDefined()
      
      expect(dashboardData.realTimeMetrics.generationsToday).toBe(3)
      expect(dashboardData.realTimeMetrics.successRate).toBe(100)
    })

    test('should calculate performance metrics correctly', () => {
      const performanceResults = [
        { ...mockResult, generationMetrics: { ...mockResult.generationMetrics, totalGenerationTime: 1000 } },
        { ...mockResult, generationMetrics: { ...mockResult.generationMetrics, totalGenerationTime: 2000 } },
        { ...mockResult, generationMetrics: { ...mockResult.generationMetrics, totalGenerationTime: 1500 } }
      ]
      
      performanceResults.forEach(result => {
        metricsCollector.recordGenerationSession(mockRequest, result)
      })
      
      const performance = metricsCollector.getPerformanceMetrics()
      
      expect(performance.averageGenerationTime).toBe(1500)
      expect(performance.p95GenerationTime).toBeGreaterThan(0)
      expect(performance.throughput).toBeGreaterThan(0)
      expect(performance.errorRate).toBe(0)
    })
  })

  describe('Performance Impact', () => {
    test('should handle large numbers of sessions efficiently', () => {
      const startTime = Date.now()
      
      // Record 1000 sessions
      for (let i = 0; i < 1000; i++) {
        const result = { ...mockResult, qualityScore: 70 + (i % 30) }
        metricsCollector.recordGenerationSession(mockRequest, result)
      }
      
      const recordingTime = Date.now() - startTime
      
      // Should complete within reasonable time (less than 1 second)
      expect(recordingTime).toBeLessThan(1000)
      
      // Test report generation performance
      const reportStartTime = Date.now()
      const report = metricsCollector.generateQualityReport()
      const reportTime = Date.now() - reportStartTime
      
      expect(reportTime).toBeLessThan(500) // Should generate report quickly
      expect(report.summary.totalGenerations).toBe(1000)
    })

    test('should cleanup old sessions when limit exceeded', () => {
      const smallCollector = new MetricsCollector({
        maxHistorySize: 10,
        enableRealTimeTracking: false
      })
      
      // Record more sessions than the limit
      for (let i = 0; i < 15; i++) {
        smallCollector.recordGenerationSession(mockRequest, mockResult)
      }
      
      const dashboardData = smallCollector.getDashboardData()
      // Should only keep the most recent sessions
      expect(dashboardData.realTimeMetrics.generationsToday).toBeLessThanOrEqual(10)
    })

    test('should handle concurrent session recording', async () => {
      const promises = []
      
      // Simulate concurrent session recording
      for (let i = 0; i < 50; i++) {
        promises.push(
          Promise.resolve().then(() => 
            metricsCollector.recordGenerationSession(mockRequest, mockResult)
          )
        )
      }
      
      const sessionIds = await Promise.all(promises)
      
      expect(sessionIds).toHaveLength(50)
      expect(new Set(sessionIds).size).toBe(50) // All IDs should be unique
      
      const dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.realTimeMetrics.generationsToday).toBe(50)
    })
  })

  describe('Data Export and Import', () => {
    test('should export metrics data in JSON format', () => {
      metricsCollector.recordGenerationSession(mockRequest, mockResult)
      
      const exportedData = metricsCollector.exportMetricsData('json')
      const parsedData = JSON.parse(exportedData)
      
      expect(parsedData.sessions).toBeDefined()
      expect(parsedData.aggregatedMetrics).toBeDefined()
      expect(parsedData.issuePatterns).toBeDefined()
      expect(parsedData.exportedAt).toBeDefined()
      
      expect(parsedData.sessions).toHaveLength(1)
    })

    test('should export metrics data in CSV format', () => {
      metricsCollector.recordGenerationSession(mockRequest, mockResult)
      
      const csvData = metricsCollector.exportMetricsData('csv')
      
      expect(csvData).toContain('timestamp,success,qualityScore')
      expect(csvData.split('\n').length).toBeGreaterThan(1) // Header + data rows
    })

    test('should clear all metrics when requested', () => {
      metricsCollector.recordGenerationSession(mockRequest, mockResult)
      
      let dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.realTimeMetrics.generationsToday).toBe(1)
      
      metricsCollector.clearMetrics()
      
      dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.realTimeMetrics.generationsToday).toBe(0)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty sessions gracefully', () => {
      const report = metricsCollector.generateQualityReport()
      
      expect(report.summary.totalGenerations).toBe(0)
      expect(report.summary.averageQualityScore).toBe(0)
      expect(report.trends.qualityScoreOverTime).toHaveLength(0)
    })

    test('should handle sessions with no issues', () => {
      const cleanResult = {
        ...mockResult,
        validationResults: [{
          type: 'syntax' as const,
          passed: true,
          issues: [],
          score: 100
        }]
      }
      
      metricsCollector.recordGenerationSession(mockRequest, cleanResult)
      
      const commonIssues = metricsCollector.identifyCommonIssues()
      expect(commonIssues).toHaveLength(0)
    })

    test('should handle malformed validation results', () => {
      const malformedResult = {
        ...mockResult,
        validationResults: []
      }
      
      expect(() => {
        metricsCollector.recordGenerationSession(mockRequest, malformedResult)
      }).not.toThrow()
      
      const report = metricsCollector.generateQualityReport()
      expect(report.summary.totalGenerations).toBe(1)
    })
  })

  describe('Time-based Analysis', () => {
    test('should group sessions by time windows correctly', () => {
      const now = new Date()
      const times = [
        new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        now
      ]
      
      times.forEach(time => {
        const result = { ...mockResult }
        result.generationMetrics.startTime = time
        metricsCollector.recordGenerationSession(mockRequest, result)
      })
      
      const dashboardData = metricsCollector.getDashboardData()
      expect(dashboardData.trends.volumeTrend.length).toBeGreaterThan(0)
    })

    test('should calculate trends correctly', () => {
      // Create sessions with improving quality over time
      const scores = [60, 65, 70, 75, 80, 85, 90]
      
      scores.forEach((score, index) => {
        const result = { ...mockResult, qualityScore: score }
        result.generationMetrics.startTime = new Date(Date.now() - (scores.length - index) * 60000)
        metricsCollector.recordGenerationSession(mockRequest, result)
      })
      
      const trends = metricsCollector.trackQualityTrends()
      
      // Quality should be improving over time
      const firstScore = trends.qualityScoreOverTime[0].score
      const lastScore = trends.qualityScoreOverTime[trends.qualityScoreOverTime.length - 1].score
      expect(lastScore).toBeGreaterThan(firstScore)
    })
  })
})