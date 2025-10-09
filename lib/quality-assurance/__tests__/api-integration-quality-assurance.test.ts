/**
 * API Integration Tests for Quality Assurance Features
 * 
 * Tests the complete integration of quality assurance features in the API endpoints,
 * including error reporting, fallback activation, quality metrics, and user feedback.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../../../app/api/generate/route'

// Mock the dependencies
vi.mock('@/lib/vibesdk', () => ({
  vibeSDK: {
    generateCodeWithValidation: vi.fn()
  }
}))

vi.mock('@/lib/migration/realtime-validator', () => ({
  RealtimeValidator: vi.fn().mockImplementation(() => ({
    validateUserInput: vi.fn(),
    autoModernizeCode: vi.fn()
  }))
}))

vi.mock('@/lib/quality-assurance', () => ({
  enhancedGenerationController: {
    generateWithQualityAssurance: vi.fn(),
    getFallbackCode: vi.fn(),
    reportQualityMetrics: vi.fn()
  },
  GenerationRequest: {},
  QualityAssuredResult: {},
  EnhancedGenerationOptions: {}
}))

describe('API Quality Assurance Integration', () => {
  let mockVibeSDK: any
  let mockValidator: any
  let mockQAController: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Get mock instances
    mockVibeSDK = require('@/lib/vibesdk').vibeSDK
    const { RealtimeValidator } = require('@/lib/migration/realtime-validator')
    mockValidator = new RealtimeValidator()
    mockQAController = require('@/lib/quality-assurance').enhancedGenerationController

    // Setup default mock responses
    mockVibeSDK.generateCodeWithValidation.mockResolvedValue({
      code: 'access(all) contract TestContract { init() {} }'
    })

    mockValidator.validateUserInput.mockResolvedValue({
      isValid: true,
      hasLegacyPatterns: false,
      patterns: [],
      validationTime: 100,
      confidence: 95,
      suggestions: [],
      educationalContent: []
    })

    mockQAController.generateWithQualityAssurance.mockResolvedValue({
      code: 'access(all) contract TestContract { init() {} }',
      qualityScore: 85,
      validationResults: [{
        type: 'syntax',
        passed: true,
        issues: [],
        score: 100
      }],
      correctionHistory: [],
      fallbackUsed: false,
      generationMetrics: {
        attemptCount: 1,
        totalGenerationTime: 2000,
        validationTime: 100,
        correctionTime: 0,
        finalQualityScore: 85,
        issuesDetected: 0,
        issuesFixed: 0,
        startTime: new Date(),
        endTime: new Date()
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Quality Assurance Pipeline Integration', () => {
    it('should integrate quality assurance pipeline for successful generation', async () => {
      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a simple NFT contract',
          qualityThreshold: 80,
          maxRetries: 3,
          strictMode: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.code).toBeDefined()
      expect(data.qualityMetrics).toBeDefined()
      expect(data.qualityMetrics.qualityScore).toBe(85)
      expect(data.qualityMetrics.fallbackUsed).toBe(false)
      expect(data.qualityMetrics.generationMetrics).toBeDefined()
      expect(mockQAController.generateWithQualityAssurance).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Create a simple NFT contract',
          maxRetries: 3,
          strictMode: true
        }),
        expect.any(Function),
        expect.objectContaining({
          enableRetryRecovery: true,
          enableAutoCorrection: true,
          enableFallbackGeneration: true,
          qualityThreshold: 80
        })
      )
    })

    it('should activate fallback when quality threshold is not met', async () => {
      // Mock low quality result
      mockQAController.generateWithQualityAssurance.mockResolvedValue({
        code: 'access(all) contract LowQuality { init() {} }',
        qualityScore: 60, // Below threshold
        validationResults: [{
          type: 'syntax',
          passed: false,
          issues: [{ severity: 'warning', type: 'incomplete', location: { line: 1, column: 0 }, message: 'Incomplete contract' }],
          score: 60
        }],
        correctionHistory: [],
        fallbackUsed: false,
        generationMetrics: {
          attemptCount: 3,
          totalGenerationTime: 5000,
          validationTime: 300,
          correctionTime: 200,
          finalQualityScore: 60,
          issuesDetected: 1,
          issuesFixed: 0,
          startTime: new Date(),
          endTime: new Date()
        }
      })

      mockQAController.getFallbackCode.mockResolvedValue(
        'access(all) contract FallbackContract { init() {} }'
      )

      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a complex contract',
          qualityThreshold: 80
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.fallbackUsed).toBe(true)
      expect(data.fallbackReason).toContain('Quality score 60 below threshold 80')
      expect(data.qualityMetrics.fallbackUsed).toBe(true)
      expect(mockQAController.getFallbackCode).toHaveBeenCalled()
    })

    it('should provide comprehensive error reporting for generation failures', async () => {
      mockQAController.generateWithQualityAssurance.mockRejectedValue(
        new Error('AI service unavailable')
      )

      mockQAController.getFallbackCode.mockResolvedValue(
        'access(all) contract EmergencyFallback { init() {} }'
      )

      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a contract'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200) // Should still return 200 with fallback
      expect(data.fallbackUsed).toBe(true)
      expect(data.fallbackReason).toContain('AI service unavailable')
      expect(data.error).toContain('Generation failed, emergency fallback provided')
      expect(data.qualityMetrics).toBeDefined()
    })

    it('should handle legacy pattern detection with quality assurance', async () => {
      // Mock code with legacy patterns
      const legacyCode = 'pub contract LegacyContract { pub fun test() {} }'
      
      mockQAController.generateWithQualityAssurance.mockResolvedValue({
        code: legacyCode,
        qualityScore: 85,
        validationResults: [{
          type: 'syntax',
          passed: true,
          issues: [],
          score: 100
        }],
        correctionHistory: [],
        fallbackUsed: false,
        generationMetrics: {
          attemptCount: 1,
          totalGenerationTime: 2000,
          validationTime: 100,
          correctionTime: 0,
          finalQualityScore: 85,
          issuesDetected: 0,
          issuesFixed: 0,
          startTime: new Date(),
          endTime: new Date()
        }
      })

      // Mock legacy validation
      mockValidator.validateUserInput.mockResolvedValue({
        isValid: false,
        hasLegacyPatterns: true,
        patterns: [
          { type: 'legacy-pub', severity: 'critical', location: { line: 1, column: 0 } }
        ],
        validationTime: 100,
        confidence: 50
      })

      // Mock successful auto-modernization
      mockValidator.autoModernizeCode.mockReturnValue({
        modernizedCode: 'access(all) contract ModernContract { access(all) fun test() {} }',
        confidence: 0.9,
        requiresManualReview: false,
        transformationsApplied: ['pub-to-access-all'],
        warnings: []
      })

      // Mock validation of modernized code
      mockValidator.validateUserInput
        .mockResolvedValueOnce({
          isValid: false,
          hasLegacyPatterns: true,
          patterns: [{ type: 'legacy-pub', severity: 'critical' }],
          validationTime: 100,
          confidence: 50
        })
        .mockResolvedValueOnce({
          isValid: true,
          hasLegacyPatterns: false,
          patterns: [],
          validationTime: 100,
          confidence: 95
        })

      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a contract',
          strictMode: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.autoModernized).toBe(true)
      expect(data.modernizationApplied).toBeDefined()
      expect(data.modernizationApplied.transformationsApplied).toContain('pub-to-access-all')
      expect(data.qualityMetrics.qualityScore).toBe(85)
    })

    it('should reject code with unresolvable legacy patterns', async () => {
      const legacyCode = 'pub contract UnfixableContract { AuthAccount.save() }'
      
      mockQAController.generateWithQualityAssurance.mockResolvedValue({
        code: legacyCode,
        qualityScore: 85,
        validationResults: [],
        correctionHistory: [],
        fallbackUsed: false,
        generationMetrics: {
          attemptCount: 3,
          totalGenerationTime: 8000,
          validationTime: 500,
          correctionTime: 1000,
          finalQualityScore: 85,
          issuesDetected: 2,
          issuesFixed: 0,
          startTime: new Date(),
          endTime: new Date()
        }
      })

      mockValidator.validateUserInput.mockResolvedValue({
        isValid: false,
        hasLegacyPatterns: true,
        patterns: [
          { type: 'legacy-pub', severity: 'critical' },
          { type: 'legacy-auth-account', severity: 'critical' }
        ],
        validationTime: 100,
        confidence: 30
      })

      mockValidator.autoModernizeCode.mockReturnValue({
        modernizedCode: legacyCode, // Unchanged
        confidence: 0.3, // Low confidence
        requiresManualReview: true,
        transformationsApplied: [],
        warnings: ['Cannot automatically fix AuthAccount usage']
      })

      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a contract with account operations',
          strictMode: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.rejected).toBe(true)
      expect(data.error).toContain('legacy syntax that could not be automatically resolved')
      expect(data.comprehensiveReport).toBeDefined()
      expect(data.comprehensiveReport.criticalPatterns).toBe(2)
      expect(data.comprehensiveReport.qualityAssuranceAttempts).toBe(3)
      expect(data.autoModernization.successful).toBe(false)
    })

    it('should include quality metrics in API responses', async () => {
      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a token contract',
          includeAnalysis: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.qualityMetrics).toBeDefined()
      expect(data.qualityMetrics.qualityScore).toBeDefined()
      expect(data.qualityMetrics.validationResults).toBeDefined()
      expect(data.qualityMetrics.generationMetrics).toBeDefined()
      expect(data.qualityMetrics.generationMetrics.attemptCount).toBeDefined()
      expect(data.qualityMetrics.generationMetrics.totalGenerationTime).toBeDefined()
      expect(data.qualityMetrics.generationMetrics.issuesDetected).toBeDefined()
      expect(data.qualityMetrics.generationMetrics.issuesFixed).toBeDefined()

      // Check analysis includes quality assurance information
      expect(data.analysis.qualityAssurance).toBeDefined()
      expect(data.analysis.qualityAssurance.qualityScore).toBe(85)
      expect(data.analysis.qualityAssurance.totalAttempts).toBe(1)
      expect(data.analysis.qualityAssurance.processingTime).toBeDefined()
    })

    it('should report quality metrics for monitoring', async () => {
      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a DAO contract'
        })
      })

      await POST(request)

      expect(mockQAController.reportQualityMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          qualityScore: 85,
          fallbackUsed: false,
          generationMetrics: expect.objectContaining({
            attemptCount: 1,
            totalGenerationTime: 2000,
            issuesDetected: 0,
            issuesFixed: 0
          })
        })
      )
    })

    it('should handle missing prompt with quality metrics', async () => {
      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Prompt is required')
      expect(data.qualityMetrics).toBeDefined()
      expect(data.qualityMetrics.qualityScore).toBe(0)
      expect(data.qualityMetrics.generationMetrics.issuesDetected).toBe(1)
    })

    it('should handle complete system failure gracefully', async () => {
      mockQAController.generateWithQualityAssurance.mockRejectedValue(
        new Error('System failure')
      )
      mockQAController.getFallbackCode.mockRejectedValue(
        new Error('Fallback failure')
      )

      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a contract'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate code')
      expect(data.rejected).toBe(true)
      expect(data.fallbackError).toContain('Fallback also failed')
      expect(data.qualityMetrics).toBeDefined()
      expect(data.qualityMetrics.qualityScore).toBe(0)
    })

    it('should pass through custom quality parameters', async () => {
      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a marketplace contract',
          qualityThreshold: 90,
          maxRetries: 5,
          strictMode: false
        })
      })

      await POST(request)

      expect(mockQAController.generateWithQualityAssurance).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Create a marketplace contract',
          maxRetries: 5,
          strictMode: false
        }),
        expect.any(Function),
        expect.objectContaining({
          qualityThreshold: 90,
          maxRetries: 5,
          strictMode: false
        })
      )
    })

    it('should provide user feedback for quality issues', async () => {
      mockQAController.generateWithQualityAssurance.mockResolvedValue({
        code: 'access(all) contract TestContract { init() {} }',
        qualityScore: 75,
        validationResults: [{
          type: 'completeness',
          passed: false,
          issues: [
            { 
              severity: 'warning', 
              type: 'missing-function', 
              location: { line: 1, column: 0 }, 
              message: 'Contract missing required functions',
              suggestedFix: 'Add required interface functions'
            }
          ],
          score: 75
        }],
        correctionHistory: [{
          attemptNumber: 1,
          timestamp: new Date(),
          corrections: [
            {
              type: 'logic-enhancement',
              location: { line: 1, column: 0 },
              originalValue: 'incomplete contract',
              correctedValue: 'enhanced contract',
              reasoning: 'Added missing functionality',
              confidence: 80
            }
          ],
          success: true,
          qualityImprovement: 15
        }],
        fallbackUsed: false,
        generationMetrics: {
          attemptCount: 2,
          totalGenerationTime: 3000,
          validationTime: 200,
          correctionTime: 500,
          finalQualityScore: 75,
          issuesDetected: 1,
          issuesFixed: 1,
          startTime: new Date(),
          endTime: new Date()
        }
      })

      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a contract',
          includeAnalysis: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.qualityMetrics.correctionHistory).toHaveLength(1)
      expect(data.qualityMetrics.correctionHistory[0].corrections).toHaveLength(1)
      expect(data.qualityMetrics.correctionHistory[0].qualityImprovement).toBe(15)
      expect(data.analysis.qualityAssurance.issuesFixed).toBe(1)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      
      expect(response.status).toBe(500)
    })

    it('should handle timeout scenarios', async () => {
      mockQAController.generateWithQualityAssurance.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      mockQAController.getFallbackCode.mockResolvedValue(
        'access(all) contract TimeoutFallback { init() {} }'
      )

      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a complex contract'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.fallbackUsed).toBe(true)
      expect(data.fallbackReason).toContain('Timeout')
    })

    it('should maintain backward compatibility with existing API format', async () => {
      const request = new NextRequest('http://localhost/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a simple contract',
          context: 'NFT collection',
          validateCode: true,
          includeAnalysis: true,
          allowLegacySyntax: false
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Check that all expected fields are present for backward compatibility
      expect(data.code).toBeDefined()
      expect(data.validation).toBeDefined()
      expect(data.rejected).toBeDefined()
      expect(data.analysis).toBeDefined()
      expect(data.suggestions).toBeDefined()
      expect(data.educationalContent).toBeDefined()
      expect(data.complianceStatus).toBeDefined()
      
      // Check new quality assurance fields
      expect(data.qualityMetrics).toBeDefined()
    })
  })
})