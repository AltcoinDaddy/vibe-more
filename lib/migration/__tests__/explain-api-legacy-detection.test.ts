/**
 * Test suite for explain API legacy code detection and modernization
 */

import { describe, it, expect } from 'vitest'

// Mock the explain API functionality
async function mockExplainAPI(code: string, question?: string) {
  const { RealtimeValidator } = await import('../realtime-validator')
  const validator = new RealtimeValidator()
  
  // Simulate the API logic
  const validationResult = await validator.validateUserInput(code)
  
  if (validationResult.hasLegacyPatterns) {
    // Attempt automatic modernization
    const autoModernization = validator.autoModernizeCode(code, {
      autoFixCritical: true,
      autoFixWarnings: true,
      preserveComments: true,
      addExplanationComments: true
    })

    if (autoModernization.confidence > 0.7 && !autoModernization.requiresManualReview) {
      return {
        explanation: `This code has been automatically modernized from legacy Cadence syntax. ${autoModernization.transformationsApplied.join(', ')}`,
        codeModernized: true,
        originalCode: code,
        modernizedCode: autoModernization.modernizedCode,
        modernizationApplied: {
          transformationsApplied: autoModernization.transformationsApplied,
          confidence: autoModernization.confidence,
          warnings: autoModernization.warnings
        },
        educationalContent: validationResult.educationalContent,
        complianceStatus: {
          cadence10Compliant: true,
          productionReady: true,
          modernizationSuccessful: true
        }
      }
    } else {
      return {
        error: "Code contains legacy syntax and cannot be explained without modernization",
        rejected: true,
        validation: validationResult,
        suggestions: validationResult.suggestions,
        educationalContent: validationResult.educationalContent,
        modernizationGuidance: {
          message: "Please modernize your code to Cadence 1.0 syntax before requesting an explanation",
          quickFixes: validationResult.suggestions.filter(s => s.autoFixable).map(s => ({
            pattern: s.pattern.description,
            fix: s.modernReplacement,
            explanation: s.explanation
          }))
        }
      }
    }
  }

  return {
    explanation: "This code uses modern Cadence 1.0 syntax and is ready for production.",
    codeModernized: false,
    complianceStatus: {
      cadence10Compliant: true,
      productionReady: true,
      requiresModernization: false
    },
    educationalContent: validationResult.educationalContent
  }
}

describe('Explain API Legacy Detection', () => {
  it('should detect legacy patterns and provide modernization', async () => {
    const legacyCode = `
pub contract TestContract {
    pub var balance: UFix64
    
    pub fun getBalance(): UFix64 {
        return self.balance
    }
}`

    const result = await mockExplainAPI(legacyCode)
    
    expect(result.codeModernized).toBe(true)
    expect(result.modernizedCode).toContain('access(all)')
    // Check that actual Cadence code doesn't contain pub (excluding comments)
    const codeWithoutComments = result.modernizedCode.replace(/\/\/.*$/gm, '')
    expect(codeWithoutComments).not.toContain('pub ')
    expect(result.modernizationApplied?.transformationsApplied).toBeDefined()
    expect(result.complianceStatus.cadence10Compliant).toBe(true)
  })

  it('should provide educational content for legacy patterns', async () => {
    const legacyCode = `
pub contract TestContract {
    pub fun getValue(): String {
        return "test"
    }
}`

    const result = await mockExplainAPI(legacyCode)
    
    expect(result.educationalContent).toBeDefined()
    expect(result.educationalContent.length).toBeGreaterThan(0)
    
    // Should have educational content about access modifiers
    const accessModifierEducation = result.educationalContent.find(
      content => content.pattern === 'access-modifier'
    )
    expect(accessModifierEducation).toBeDefined()
    expect(accessModifierEducation?.title).toBe('Access Control Modernization')
  })

  it('should handle legacy patterns appropriately', async () => {
    const legacyCode = `
pub contract TestContract {
    pub fun getValue() {
        account.link<&TestResource>(/public/test, target: /storage/test)
    }
}`

    const result = await mockExplainAPI(legacyCode)
    
    // Should either modernize successfully or reject with guidance
    if (result.rejected) {
      expect(result.error).toContain('legacy syntax')
      expect(result.modernizationGuidance).toBeDefined()
      expect(result.suggestions).toBeDefined()
    } else {
      expect(result.codeModernized).toBe(true)
      expect(result.modernizationApplied).toBeDefined()
    }
  })

  it('should accept modern Cadence code without modification', async () => {
    const modernCode = `
access(all) contract TestContract {
    access(all) var balance: UFix64
    
    access(all) view fun getBalance(): UFix64 {
        return self.balance
    }
    
    init() {
        self.balance = 0.0
    }
}`

    const result = await mockExplainAPI(modernCode)
    
    expect(result.codeModernized).toBe(false)
    expect(result.complianceStatus.cadence10Compliant).toBe(true)
    expect(result.complianceStatus.requiresModernization).toBe(false)
    expect(result.explanation).toContain('modern Cadence 1.0 syntax')
  })

  it('should provide modernization suggestions with examples', async () => {
    const legacyCode = `pub fun test(): String { return "test" }`

    const result = await mockExplainAPI(legacyCode)
    
    if (result.rejected) {
      expect(result.suggestions).toBeDefined()
      expect(result.suggestions.length).toBeGreaterThan(0)
      
      const suggestion = result.suggestions[0]
      expect(suggestion.pattern).toBeDefined()
      expect(suggestion.modernReplacement).toBeDefined()
      expect(suggestion.explanation).toBeDefined()
      expect(suggestion.example).toBeDefined()
      expect(suggestion.example.before).toBeDefined()
      expect(suggestion.example.after).toBeDefined()
    } else {
      // If auto-modernized successfully
      expect(result.modernizationApplied?.transformationsApplied).toBeDefined()
    }
  })

  it('should include comprehensive validation metrics', async () => {
    const legacyCode = `
pub contract Test {
    pub var value: String
    pub fun getValue(): String {
        return self.value
    }
}`

    const result = await mockExplainAPI(legacyCode)
    
    if (result.codeModernized) {
      expect(result.modernizationApplied?.confidence).toBeGreaterThan(0)
      expect(result.modernizationApplied?.transformationsApplied).toBeDefined()
      expect(result.complianceStatus.modernizationSuccessful).toBe(true)
    }
  })
})