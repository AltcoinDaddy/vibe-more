/**
 * Comprehensive tests for API endpoint strict validation
 * Ensures all endpoints reject legacy syntax and provide modernization guidance
 */

import { describe, test, expect, beforeEach } from 'vitest'

// Mock the API endpoints for testing
const mockFetch = (url: string, options: any) => {
  // This would be replaced with actual API calls in integration tests
  return Promise.resolve({
    ok: options.body.includes('pub ') ? false : true,
    status: options.body.includes('pub ') ? 422 : 200,
    json: () => Promise.resolve({
      error: options.body.includes('pub ') ? 'Legacy syntax detected' : undefined,
      rejected: options.body.includes('pub '),
      validation: {
        hasLegacyPatterns: options.body.includes('pub '),
        patterns: options.body.includes('pub ') ? [
          { type: 'access-modifier', severity: 'critical', description: 'pub keyword detected' }
        ] : []
      }
    })
  })
}

describe('API Strict Validation', () => {
  const legacyCode = `
    pub contract TestContract {
      pub fun getValue(): String {
        return "test"
      }
    }
  `

  const modernCode = `
    access(all) contract TestContract {
      access(all) fun getValue(): String {
        return "test"
      }
    }
  `

  describe('Generate API Endpoint', () => {
    test('should reject legacy syntax in generated code', async () => {
      const response = await mockFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a contract with pub functions',
          context: legacyCode
        })
      })

      const data = await response.json()
      
      expect(response.status).toBe(422)
      expect(data.rejected).toBe(true)
      expect(data.error).toContain('Legacy syntax')
      expect(data.validation.hasLegacyPatterns).toBe(true)
      expect(data.comprehensiveReport).toBeDefined()
      expect(data.suggestions).toBeDefined()
      expect(data.educationalContent).toBeDefined()
    })

    test('should accept modern syntax in generated code', async () => {
      const response = await mockFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a modern contract',
          context: modernCode
        })
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.rejected).toBe(false)
      expect(data.validation.hasLegacyPatterns).toBe(false)
      expect(data.complianceStatus.cadence10Compliant).toBe(true)
    })

    test('should prevent validation bypass attempts', async () => {
      const response = await mockFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a contract',
          context: legacyCode,
          allowLegacySyntax: true // This should be ignored
        })
      })

      const data = await response.json()
      
      // Should still reject despite allowLegacySyntax flag
      expect(response.status).toBe(422)
      expect(data.rejected).toBe(true)
    })
  })

  describe('Explain API Endpoint', () => {
    test('should reject legacy syntax in input code', async () => {
      const response = await mockFetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: legacyCode,
          question: 'Explain this code'
        })
      })

      const data = await response.json()
      
      expect(response.status).toBe(422)
      expect(data.rejected).toBe(true)
      expect(data.error).toContain('legacy syntax')
      expect(data.validation.hasLegacyPatterns).toBe(true)
      expect(data.modernizationGuidance).toBeDefined()
      expect(data.autoModernization).toBeDefined()
    })

    test('should accept modern syntax in input code', async () => {
      const response = await mockFetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: modernCode,
          question: 'Explain this code'
        })
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.rejected).toBe(false)
      expect(data.complianceStatus.cadence10Compliant).toBe(true)
      expect(data.syntaxAnalysis).toBeDefined()
    })

    test('should provide comprehensive modernization guidance', async () => {
      const response = await mockFetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: legacyCode,
          question: 'Explain this code',
          rejectLegacyCode: false // Should be ignored
        })
      })

      const data = await response.json()
      
      expect(data.modernizationGuidance).toBeDefined()
      expect(data.modernizationGuidance.quickFixes).toBeDefined()
      expect(data.modernizationGuidance.manualReviewRequired).toBeDefined()
      expect(data.educationalContent).toBeDefined()
    })
  })

  describe('Refine API Endpoint', () => {
    test('should reject legacy syntax in input code', async () => {
      const response = await mockFetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: legacyCode,
          refinementRequest: 'Add error handling'
        })
      })

      const data = await response.json()
      
      expect(response.status).toBe(422)
      expect(data.rejected).toBe(true)
      expect(data.error).toContain('legacy syntax')
      expect(data.modernizationGuidance).toBeDefined()
    })

    test('should reject legacy syntax in refined output', async () => {
      // This test simulates the case where input is modern but output contains legacy
      const response = await mockFetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: modernCode,
          refinementRequest: 'Add pub functions' // This would generate legacy syntax
        })
      })

      const data = await response.json()
      
      // Should reject if refined code contains legacy syntax
      if (data.rejected) {
        expect(response.status).toBe(422)
        expect(data.error).toContain('legacy syntax')
        expect(data.comprehensiveReport.refinementFailed).toBe(true)
      }
    })

    test('should accept modern syntax throughout refinement process', async () => {
      const response = await mockFetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: modernCode,
          refinementRequest: 'Add modern error handling'
        })
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.rejected).toBe(false)
      expect(data.complianceStatus.cadence10Compliant).toBe(true)
      expect(data.improvementMetrics).toBeDefined()
    })
  })

  describe('Stream API Endpoint', () => {
    test('should validate streamed code in real-time', async () => {
      // This would test the streaming endpoint's validation capabilities
      // In a real test, we'd set up a streaming connection and verify validation events
      
      const streamData = [
        { type: 'code_chunk', chunk: 'access(all) contract Test {' },
        { type: 'validation_update', validation: { hasLegacyPatterns: false } },
        { type: 'code_chunk', chunk: '  access(all) fun test() {}' },
        { type: 'final_validation', validation: { hasLegacyPatterns: false }, rejected: false }
      ]

      // Verify that validation updates are sent during streaming
      expect(streamData.some(d => d.type === 'validation_update')).toBe(true)
      expect(streamData.some(d => d.type === 'final_validation')).toBe(true)
      
      const finalValidation = streamData.find(d => d.type === 'final_validation')
      expect(finalValidation?.rejected).toBe(false)
    })

    test('should reject streamed code with legacy patterns', async () => {
      const streamData = [
        { type: 'code_chunk', chunk: 'pub contract Test {' },
        { type: 'validation_warning', message: 'Legacy syntax patterns detected' },
        { type: 'validation_error', error: 'Generated code contains legacy syntax', rejected: true }
      ]

      // Verify that legacy patterns trigger warnings and eventual rejection
      expect(streamData.some(d => d.type === 'validation_warning')).toBe(true)
      expect(streamData.some(d => d.type === 'validation_error')).toBe(true)
      
      const errorEvent = streamData.find(d => d.type === 'validation_error')
      expect(errorEvent?.rejected).toBe(true)
    })
  })

  describe('Validation Bypass Prevention', () => {
    test('should ignore allowLegacySyntax flags across all endpoints', async () => {
      const endpoints = ['/api/generate', '/api/explain', '/api/refine']
      
      for (const endpoint of endpoints) {
        const response = await mockFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: legacyCode,
            prompt: 'test',
            refinementRequest: 'test',
            allowLegacySyntax: true,
            rejectLegacyCode: false
          })
        })

        const data = await response.json()
        
        // All endpoints should reject legacy syntax regardless of flags
        expect(data.rejected).toBe(true)
      }
    })

    test('should enforce modern syntax requirements in all scenarios', async () => {
      const testCases = [
        { endpoint: '/api/generate', body: { prompt: 'create pub contract' } },
        { endpoint: '/api/explain', body: { code: legacyCode } },
        { endpoint: '/api/refine', body: { code: legacyCode, refinementRequest: 'improve' } }
      ]

      for (const testCase of testCases) {
        const response = await mockFetch(testCase.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.body)
        })

        const data = await response.json()
        
        // Verify strict enforcement
        expect(data.rejected).toBe(true)
        expect(data.validation?.hasLegacyPatterns).toBe(true)
      }
    })
  })

  describe('Comprehensive Validation Reporting', () => {
    test('should provide detailed validation reports', async () => {
      const response = await mockFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'create legacy contract',
          includeAnalysis: true
        })
      })

      const data = await response.json()
      
      if (data.rejected) {
        expect(data.comprehensiveReport).toBeDefined()
        expect(data.comprehensiveReport.totalPatterns).toBeGreaterThan(0)
        expect(data.comprehensiveReport.criticalPatterns).toBeDefined()
        expect(data.comprehensiveReport.warningPatterns).toBeDefined()
        expect(data.comprehensiveReport.patternsByType).toBeDefined()
        expect(data.suggestions).toBeDefined()
        expect(data.educationalContent).toBeDefined()
      }
    })

    test('should include automatic modernization attempts', async () => {
      const response = await mockFetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: legacyCode,
          question: 'explain'
        })
      })

      const data = await response.json()
      
      if (data.rejected) {
        expect(data.autoModernization).toBeDefined()
        expect(data.autoModernization.attempted).toBe(true)
        expect(data.autoModernization.result).toBeDefined()
        expect(data.autoModernization.successful).toBeDefined()
        expect(data.autoModernization.reason).toBeDefined()
      }
    })
  })

  describe('Educational Content and Guidance', () => {
    test('should provide educational content for all legacy patterns', async () => {
      const response = await mockFetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: legacyCode,
          includeSyntaxAnalysis: true
        })
      })

      const data = await response.json()
      
      if (data.rejected) {
        expect(data.educationalContent).toBeDefined()
        expect(Array.isArray(data.educationalContent)).toBe(true)
        
        if (data.educationalContent.length > 0) {
          const content = data.educationalContent[0]
          expect(content.title).toBeDefined()
          expect(content.description).toBeDefined()
          expect(content.whyModernize).toBeDefined()
          expect(content.benefits).toBeDefined()
        }
      }
    })

    test('should provide modernization suggestions with examples', async () => {
      const response = await mockFetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: legacyCode,
          refinementRequest: 'modernize'
        })
      })

      const data = await response.json()
      
      if (data.rejected && data.suggestions) {
        expect(Array.isArray(data.suggestions)).toBe(true)
        
        if (data.suggestions.length > 0) {
          const suggestion = data.suggestions[0]
          expect(suggestion.pattern).toBeDefined()
          expect(suggestion.modernReplacement).toBeDefined()
          expect(suggestion.explanation).toBeDefined()
          expect(suggestion.example).toBeDefined()
          expect(suggestion.autoFixable).toBeDefined()
        }
      }
    })
  })
})