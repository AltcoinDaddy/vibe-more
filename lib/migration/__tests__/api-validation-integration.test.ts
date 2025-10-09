/**
 * Integration tests for API endpoint validation
 * Tests the actual validation logic without mocking
 */

import { describe, test, expect } from 'vitest'
import { RealtimeValidator } from '../realtime-validator'

describe('API Validation Integration', () => {
  const validator = new RealtimeValidator()

  const legacyCode = `
    pub contract TestContract {
      pub fun getValue(): String {
        return "test"
      }
      
      pub resource Vault: Provider, Receiver {
        pub var balance: UFix64
        
        init(balance: UFix64) {
          self.balance = balance
        }
      }
    }
  `

  const modernCode = `
    access(all) contract TestContract {
      access(all) fun getValue(): String {
        return "test"
      }
      
      access(all) resource Vault: Provider & Receiver {
        access(all) var balance: UFix64
        
        init(balance: UFix64) {
          self.balance = balance
        }
      }
    }
  `

  describe('RealtimeValidator', () => {
    test('should detect legacy patterns in code', async () => {
      const result = await validator.validateUserInput(legacyCode)
      
      expect(result.hasLegacyPatterns).toBe(true)
      expect(result.patterns.length).toBeGreaterThan(0)
      expect(result.patterns.some(p => p.type === 'access-modifier')).toBe(true)
      expect(result.patterns.some(p => p.severity === 'critical')).toBe(true)
      expect(result.validationTime).toBeLessThan(100) // Sub-100ms requirement
    })

    test('should not detect legacy patterns in modern code', async () => {
      const result = await validator.validateUserInput(modernCode)
      
      expect(result.hasLegacyPatterns).toBe(false)
      expect(result.patterns.length).toBe(0)
      expect(result.isValid).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    test('should generate modernization suggestions', async () => {
      const result = await validator.validateUserInput(legacyCode)
      
      expect(result.suggestions.length).toBeGreaterThan(0)
      
      const suggestion = result.suggestions[0]
      expect(suggestion.pattern).toBeDefined()
      expect(suggestion.modernReplacement).toBeDefined()
      expect(suggestion.explanation).toBeDefined()
      expect(suggestion.example).toBeDefined()
      expect(typeof suggestion.autoFixable).toBe('boolean')
    })

    test('should provide educational content', async () => {
      const result = await validator.validateUserInput(legacyCode)
      
      expect(result.educationalContent.length).toBeGreaterThan(0)
      
      const content = result.educationalContent[0]
      expect(content.title).toBeDefined()
      expect(content.description).toBeDefined()
      expect(content.whyModernize).toBeDefined()
      expect(Array.isArray(content.benefits)).toBe(true)
    })

    test('should auto-modernize code successfully', () => {
      const result = validator.autoModernizeCode(legacyCode, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: false
      })
      
      expect(result.modernizedCode).toBeDefined()
      expect(result.modernizedCode).not.toContain('pub ')
      expect(result.modernizedCode).toContain('access(all)')
      expect(result.transformationsApplied.length).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0)
    })

    test('should handle interface conformance modernization', async () => {
      const legacyInterfaceCode = `
        pub resource Vault: Provider, Receiver, Balance {
          pub var balance: UFix64
        }
      `
      
      // First check that it detects the pattern
      const validation = await validator.validateUserInput(legacyInterfaceCode)
      expect(validation.hasLegacyPatterns).toBe(true)
      
      const result = validator.autoModernizeCode(legacyInterfaceCode, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: false
      })
      
      // Should modernize access modifiers at minimum
      expect(result.modernizedCode).toContain('access(all)')
      expect(result.modernizedCode).not.toContain('pub ')
      expect(result.transformationsApplied.length).toBeGreaterThan(0)
    })
  })

  describe('Validation Performance', () => {
    test('should validate code in under 100ms', async () => {
      const startTime = performance.now()
      await validator.validateUserInput(legacyCode)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100)
    })

    test('should handle large code files efficiently', async () => {
      const largeCode = legacyCode.repeat(50) // Simulate large file
      
      const startTime = performance.now()
      const result = await validator.validateUserInput(largeCode)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(500) // Should still be fast
      expect(result.hasLegacyPatterns).toBe(true)
    })
  })

  describe('API Response Structure Validation', () => {
    test('should provide comprehensive validation report structure', async () => {
      const result = await validator.validateUserInput(legacyCode)
      
      // Verify the structure matches what our API endpoints expect
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('hasLegacyPatterns')
      expect(result).toHaveProperty('patterns')
      expect(result).toHaveProperty('suggestions')
      expect(result).toHaveProperty('educationalContent')
      expect(result).toHaveProperty('validationTime')
      expect(result).toHaveProperty('confidence')
      
      // Verify patterns have required properties
      if (result.patterns.length > 0) {
        const pattern = result.patterns[0]
        expect(pattern).toHaveProperty('type')
        expect(pattern).toHaveProperty('severity')
        expect(pattern).toHaveProperty('description')
        expect(pattern).toHaveProperty('location')
        expect(pattern).toHaveProperty('suggestedFix')
        expect(pattern).toHaveProperty('modernReplacement')
      }
    })

    test('should provide auto-modernization result structure', () => {
      const result = validator.autoModernizeCode(legacyCode)
      
      // Verify the structure matches what our API endpoints expect
      expect(result).toHaveProperty('originalCode')
      expect(result).toHaveProperty('modernizedCode')
      expect(result).toHaveProperty('transformationsApplied')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('requiresManualReview')
      expect(result).toHaveProperty('warnings')
      
      expect(Array.isArray(result.transformationsApplied)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
      expect(typeof result.confidence).toBe('number')
      expect(typeof result.requiresManualReview).toBe('boolean')
    })
  })

  describe('Strict Validation Logic', () => {
    test('should identify all critical legacy patterns', async () => {
      const complexLegacyCode = `
        pub contract ComplexContract {
          pub fun publicFunction(): String {
            return "test"
          }
          
          pub var publicVariable: String
          
          pub resource TestResource: Interface1, Interface2 {
            pub fun resourceFunction() {
              account.save(<-create TestResource(), to: /storage/test)
              let ref = account.borrow<&TestResource>(from: /storage/test)
            }
          }
        }
      `
      
      const result = await validator.validateUserInput(complexLegacyCode)
      
      expect(result.hasLegacyPatterns).toBe(true)
      
      // Should detect multiple types of legacy patterns
      const patternTypes = new Set(result.patterns.map(p => p.type))
      expect(patternTypes.has('access-modifier')).toBe(true)
      
      // Should have critical patterns that would cause rejection
      const criticalPatterns = result.patterns.filter(p => p.severity === 'critical')
      expect(criticalPatterns.length).toBeGreaterThan(0)
    })

    test('should not flag modern code as legacy', async () => {
      const modernComplexCode = `
        access(all) contract ModernContract {
          access(all) fun publicFunction(): String {
            return "test"
          }
          
          access(all) var publicVariable: String
          
          access(all) resource TestResource: Interface1 & Interface2 {
            access(all) fun resourceFunction() {
              account.storage.save(<-create TestResource(), to: /storage/test)
              let ref = account.capabilities.borrow<&TestResource>(from: /storage/test)
            }
          }
        }
      `
      
      const result = await validator.validateUserInput(modernComplexCode)
      
      expect(result.hasLegacyPatterns).toBe(false)
      expect(result.patterns.length).toBe(0)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty code gracefully', async () => {
      const result = await validator.validateUserInput('')
      
      expect(result.hasLegacyPatterns).toBe(false)
      expect(result.patterns.length).toBe(0)
      expect(result.validationTime).toBeLessThan(100)
    })

    test('should handle malformed code gracefully', async () => {
      const malformedCode = 'pub contract { invalid syntax }'
      
      const result = await validator.validateUserInput(malformedCode)
      
      // Should still detect legacy patterns even in malformed code
      expect(result.hasLegacyPatterns).toBe(true)
      expect(result.validationTime).toBeLessThan(100)
    })

    test('should handle code with mixed legacy and modern patterns', async () => {
      const mixedCode = `
        access(all) contract MixedContract {
          pub fun legacyFunction(): String {
            return "test"
          }
          
          access(all) fun modernFunction(): String {
            return "modern"
          }
        }
      `
      
      const result = await validator.validateUserInput(mixedCode)
      
      expect(result.hasLegacyPatterns).toBe(true)
      expect(result.patterns.length).toBeGreaterThan(0)
      
      // Should provide suggestions for fixing the legacy parts
      expect(result.suggestions.length).toBeGreaterThan(0)
    })
  })
})