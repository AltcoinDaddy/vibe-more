/**
 * Comprehensive Test Suite for Legacy Syntax Prevention
 * Tests that verify legacy syntax is always rejected and modernization suggestions work correctly
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { RealtimeValidator } from '../realtime-validator'
import { LegacyPatternDetector } from '../legacy-pattern-detector'
import { ComprehensiveSystemValidator } from '../comprehensive-system-validator'

describe('Legacy Syntax Prevention - Comprehensive Test Suite', () => {
  let validator: RealtimeValidator
  let detector: LegacyPatternDetector
  let systemValidator: ComprehensiveSystemValidator

  beforeEach(() => {
    validator = new RealtimeValidator()
    detector = new LegacyPatternDetector()
    systemValidator = new ComprehensiveSystemValidator()
  })

  describe('Legacy Syntax Rejection Tests', () => {
    const legacyCodeSamples = [
      {
        name: 'pub function declaration',
        code: 'pub fun getValue(): String { return "test" }',
        expectedPatterns: ['pub-function']
      },
      {
        name: 'pub variable declaration',
        code: 'pub var balance: UFix64',
        expectedPatterns: ['pub-variable']
      },
      {
        name: 'pub resource declaration',
        code: 'pub resource Vault { pub var balance: UFix64 }',
        expectedPatterns: ['pub-struct-resource', 'pub-variable']
      },
      {
        name: 'legacy storage API - save',
        code: 'account.save(<-vault, to: /storage/vault)',
        expectedPatterns: ['account-save']
      },
      {
        name: 'legacy storage API - load',
        code: 'let vault <- account.load<@Vault>(from: /storage/vault)',
        expectedPatterns: ['account-load']
      },
      {
        name: 'legacy storage API - borrow',
        code: 'let vaultRef = account.borrow<&Vault>(from: /storage/vault)',
        expectedPatterns: ['account-borrow']
      },
      {
        name: 'legacy storage API - link',
        code: 'account.link<&Vault>(/public/vault, target: /storage/vault)',
        expectedPatterns: ['account-link']
      },
      {
        name: 'comma-separated interface conformance',
        code: 'resource Vault: Provider, Receiver, Balance',
        expectedPatterns: ['comma-separated-interfaces']
      },
      {
        name: 'complex legacy contract',
        code: `
          pub contract TestContract {
            pub resource Vault: Provider, Receiver {
              pub var balance: UFix64
              
              pub fun deposit(from: @FungibleToken.Vault) {
                self.balance = self.balance + from.balance
              }
              
              pub fun withdraw(amount: UFix64): @FungibleToken.Vault {
                return <-create Vault(balance: amount)
              }
            }
            
            pub fun createVault(): @Vault {
              let vault <- create Vault(balance: 0.0)
              account.save(<-vault, to: /storage/vault)
              account.link<&Vault>(/public/vault, target: /storage/vault)
              return <-account.load<@Vault>(from: /storage/vault)!
            }
          }
        `,
        expectedPatterns: ['pub-contract', 'pub-resource', 'comma-separated-interfaces', 'pub-variable', 'pub-function', 'account-save', 'account-link', 'account-load']
      }
    ]

    legacyCodeSamples.forEach(sample => {
      test(`should reject legacy syntax: ${sample.name}`, async () => {
        const result = await validator.validateUserInput(sample.code)
        
        // Should detect legacy patterns
        expect(result.hasLegacyPatterns).toBe(true)
        expect(result.patterns.length).toBeGreaterThan(0)
        
        // Should not be valid if contains critical patterns
        const hasCriticalPatterns = result.patterns.some(p => p.severity === 'critical')
        if (hasCriticalPatterns) {
          expect(result.isValid).toBe(false)
        }
        
        // Should provide suggestions
        expect(result.suggestions.length).toBeGreaterThan(0)
        
        // Should complete validation quickly
        expect(result.validationTime).toBeLessThan(100)
      })
    })

    test('should reject any code containing "pub " keyword', async () => {
      const pubVariations = [
        'pub fun test()',
        'pub var value',
        'pub let constant',
        'pub struct Data',
        'pub resource Token',
        'pub contract MyContract',
        'pub event Transfer'
      ]

      for (const code of pubVariations) {
        const result = await validator.validateUserInput(code)
        expect(result.hasLegacyPatterns).toBe(true)
        expect(result.patterns.some(p => p.description.includes('pub'))).toBe(true)
      }
    })

    test('should reject legacy storage API patterns', async () => {
      const storagePatterns = [
        'account.save(<-resource, to: /storage/path)',
        'account.load<@Resource>(from: /storage/path)',
        'account.borrow<&Resource>(from: /storage/path)',
        'account.link<&Resource>(/public/path, target: /storage/path)',
        'account.unlink(/public/path)'
      ]

      for (const code of storagePatterns) {
        const result = await validator.validateUserInput(code)
        expect(result.hasLegacyPatterns).toBe(true)
        expect(result.patterns.some(p => p.type === 'storage-api')).toBe(true)
      }
    })
  })

  describe('Modernization Suggestion Tests', () => {
    test('should provide accurate modernization suggestions for pub functions', async () => {
      const legacyCode = 'pub fun getValue(): String { return self.value }'
      const result = await validator.validateUserInput(legacyCode)
      
      expect(result.suggestions.length).toBeGreaterThan(0)
      
      const suggestion = result.suggestions[0]
      expect(suggestion.modernReplacement).toContain('access(all)')
      expect(suggestion.explanation).toContain('access control')
      expect(suggestion.example.before).toContain('pub')
      expect(suggestion.example.after).toContain('access(all)')
      expect(suggestion.autoFixable).toBe(true)
    })

    test('should provide modernization suggestions for storage API', async () => {
      const legacyCode = 'account.save(<-vault, to: /storage/vault)'
      const result = await validator.validateUserInput(legacyCode)
      
      const suggestion = result.suggestions.find(s => s.pattern.type === 'storage-api')
      expect(suggestion).toBeDefined()
      expect(suggestion!.modernReplacement).toContain('account.storage.save')
      expect(suggestion!.example.after).toContain('account.storage.save')
    })

    test('should provide suggestions for interface conformance', async () => {
      const legacyCode = 'resource Vault: Provider, Receiver'
      const result = await validator.validateUserInput(legacyCode)
      
      const suggestion = result.suggestions.find(s => s.pattern.type === 'interface-conformance')
      expect(suggestion).toBeDefined()
      expect(suggestion!.modernReplacement).toContain('&')
      expect(suggestion!.example.after).toContain('Provider & Receiver')
    })

    test('should categorize suggestions by severity and confidence', async () => {
      const legacyCode = `
        pub contract Test {
          pub resource Vault: Provider, Receiver {
            pub var balance: UFix64
          }
        }
      `
      
      const result = await validator.validateUserInput(legacyCode)
      
      // Should have suggestions with different severities
      const criticalSuggestions = result.suggestions.filter(s => s.pattern.severity === 'critical')
      const warningSuggestions = result.suggestions.filter(s => s.pattern.severity === 'warning')
      
      expect(criticalSuggestions.length).toBeGreaterThan(0)
      
      // All suggestions should have confidence scores
      result.suggestions.forEach(suggestion => {
        expect(suggestion.confidence).toBeGreaterThan(0)
        expect(suggestion.confidence).toBeLessThanOrEqual(1)
      })
    })

    test('should provide educational content for detected patterns', async () => {
      const legacyCode = 'pub fun test() { account.save(<-resource, to: /storage/path) }'
      const result = await validator.validateUserInput(legacyCode)
      
      expect(result.educationalContent.length).toBeGreaterThan(0)
      
      const accessModifierEducation = result.educationalContent.find(e => e.pattern === 'access-modifier')
      expect(accessModifierEducation).toBeDefined()
      expect(accessModifierEducation!.title).toBeTruthy()
      expect(accessModifierEducation!.description).toBeTruthy()
      expect(accessModifierEducation!.benefits.length).toBeGreaterThan(0)
    })
  })

  describe('Auto-Modernization Tests', () => {
    test('should auto-modernize simple pub functions', () => {
      const legacyCode = 'pub fun getValue(): String { return "test" }'
      const result = validator.autoModernizeCode(legacyCode, {
        autoFixCritical: true,
        autoFixWarnings: false,
        preserveComments: true,
        addExplanationComments: false
      })
      
      expect(result.modernizedCode).toContain('access(all)')
      expect(result.modernizedCode).not.toContain('pub ')
      expect(result.transformationsApplied.length).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    test('should auto-modernize storage API calls', () => {
      const legacyCode = 'account.save(<-vault, to: /storage/vault)'
      const result = validator.autoModernizeCode(legacyCode, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: false
      })
      
      expect(result.modernizedCode).toContain('account.storage.save')
      expect(result.transformationsApplied.length).toBeGreaterThan(0)
    })

    test('should handle complex modernization scenarios', () => {
      const legacyCode = `
        pub resource Vault: Provider, Receiver {
          pub var balance: UFix64
          
          pub fun deposit(from: @FungibleToken.Vault) {
            self.balance = self.balance + from.balance
            account.save(<-from, to: /storage/temp)
          }
        }
      `
      
      const result = validator.autoModernizeCode(legacyCode, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: false
      })
      
      expect(result.modernizedCode).toContain('access(all)')
      expect(result.modernizedCode).toContain('Provider & Receiver')
      expect(result.modernizedCode).toContain('account.storage.save')
      expect(result.modernizedCode).not.toContain('pub ')
      expect(result.transformationsApplied.length).toBeGreaterThan(2)
    })

    test('should flag patterns requiring manual review', () => {
      const complexLegacyCode = `
        pub contract Complex {
          pub fun setupAccount() {
            account.link<&Vault>(/public/vault, target: /storage/vault)
            // Complex capability setup that needs manual review
          }
        }
      `
      
      const result = validator.autoModernizeCode(complexLegacyCode)
      
      expect(result.requiresManualReview).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes('Manual review required'))).toBe(true)
    })
  })

  describe('Real-time Validation Performance Tests', () => {
    test('should validate code within 100ms performance threshold', async () => {
      const testCodes = [
        'pub fun test() {}',
        'access(all) fun modern() {}',
        `pub contract Large {
          pub resource Vault: Provider, Receiver {
            pub var balance: UFix64
            pub fun deposit() {}
            pub fun withdraw() {}
          }
        }`,
        'account.save(<-resource, to: /storage/path)',
        'account.storage.save(<-resource, to: /storage/path)'
      ]
      
      for (const code of testCodes) {
        const result = await validator.validateUserInput(code)
        expect(result.validationTime).toBeLessThan(100)
      }
    })

    test('should handle large code samples efficiently', async () => {
      const largeCode = Array(100).fill(`
        pub fun test${Math.random()}() {
          account.save(<-resource, to: /storage/path)
          let ref = account.borrow<&Resource>(from: /storage/path)
        }
      `).join('\n')
      
      const result = await validator.validateUserInput(largeCode)
      expect(result.validationTime).toBeLessThan(500) // Allow more time for large code
      expect(result.patterns.length).toBeGreaterThan(0)
    })

    test('should maintain performance under concurrent validation requests', async () => {
      const testCode = 'pub fun test() { account.save(<-resource, to: /storage/path) }'
      
      const promises = Array(10).fill(null).map(() => validator.validateUserInput(testCode))
      const results = await Promise.all(promises)
      
      results.forEach(result => {
        expect(result.validationTime).toBeLessThan(100)
        expect(result.hasLegacyPatterns).toBe(true)
      })
    })
  })

  describe('Regression Prevention Tests', () => {
    test('should accept modern Cadence 1.0 syntax without false positives', async () => {
      const modernCodeSamples = [
        'access(all) fun getValue(): String { return self.value }',
        'access(self) var balance: UFix64',
        'access(contract) resource Vault {}',
        'account.storage.save(<-vault, to: /storage/vault)',
        'account.capabilities.borrow<&Vault>(/public/vault)',
        'resource Vault: Provider & Receiver & Balance',
        'access(all) view fun getBalance(): UFix64 { return self.balance }'
      ]
      
      for (const code of modernCodeSamples) {
        const result = await validator.validateUserInput(code)
        expect(result.hasLegacyPatterns).toBe(false)
        expect(result.isValid).toBe(true)
        expect(result.patterns.length).toBe(0)
      }
    })

    test('should not flag modern syntax as legacy', async () => {
      const modernContract = `
        access(all) contract ModernContract {
          access(all) resource Vault: Provider & Receiver {
            access(all) var balance: UFix64
            
            access(all) view fun getBalance(): UFix64 {
              return self.balance
            }
            
            access(all) fun deposit(from: @{FungibleToken.Vault}) {
              self.balance = self.balance + from.balance
            }
          }
          
          access(all) fun createVault(): @Vault {
            let vault <- create Vault(balance: 0.0)
            account.storage.save(<-vault, to: /storage/vault)
            let cap = account.capabilities.storage.issue<&Vault>(/storage/vault)
            account.capabilities.publish(cap, at: /public/vault)
            return <-account.storage.load<@Vault>(from: /storage/vault)!
          }
        }
      `
      
      const result = await validator.validateUserInput(modernContract)
      expect(result.hasLegacyPatterns).toBe(false)
      expect(result.isValid).toBe(true)
      expect(result.patterns.length).toBe(0)
    })

    test('should maintain consistency across multiple validation runs', async () => {
      const testCode = 'pub fun legacy() { account.save(<-resource, to: /storage/path) }'
      
      const results = await Promise.all([
        validator.validateUserInput(testCode),
        validator.validateUserInput(testCode),
        validator.validateUserInput(testCode)
      ])
      
      // All results should be identical
      const firstResult = results[0]
      results.forEach(result => {
        expect(result.hasLegacyPatterns).toBe(firstResult.hasLegacyPatterns)
        expect(result.isValid).toBe(firstResult.isValid)
        expect(result.patterns.length).toBe(firstResult.patterns.length)
        expect(result.suggestions.length).toBe(firstResult.suggestions.length)
      })
    })
  })

  describe('Integration Tests', () => {
    test('should integrate with system validator for comprehensive checks', async () => {
      const systemResult = await systemValidator.validateSystem()
      
      expect(systemResult).toBeDefined()
      expect(systemResult.success).toBeDefined()
      expect(systemResult.codebaseScan).toBeDefined()
      expect(systemResult.apiEndpointTests).toBeDefined()
      expect(systemResult.templateValidation).toBeDefined()
      expect(systemResult.performanceTests).toBeDefined()
      expect(systemResult.summary).toBeDefined()
    })

    test('should work with legacy pattern detector', () => {
      const testCode = 'pub fun test() { account.save(<-resource, to: /storage/path) }'
      const patterns = detector.detectAllLegacyPatterns(testCode)
      
      expect(patterns.length).toBeGreaterThan(0)
      
      const suggestions = validator.generateModernizationSuggestions(patterns)
      expect(suggestions.length).toBe(patterns.length)
      
      suggestions.forEach(suggestion => {
        expect(suggestion.pattern).toBeDefined()
        expect(suggestion.modernReplacement).toBeTruthy()
        expect(suggestion.explanation).toBeTruthy()
        expect(suggestion.example).toBeDefined()
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty code gracefully', async () => {
      const result = await validator.validateUserInput('')
      expect(result.hasLegacyPatterns).toBe(false)
      expect(result.isValid).toBe(true)
      expect(result.patterns.length).toBe(0)
    })

    test('should handle malformed code without crashing', async () => {
      const malformedCodes = [
        'pub fun incomplete(',
        'resource Vault: Provider,',
        'account.save(<-incomplete',
        '}}}}invalid braces{{{{',
        'pub fun test() { /* unclosed comment'
      ]
      
      for (const code of malformedCodes) {
        const result = await validator.validateUserInput(code)
        expect(result).toBeDefined()
        expect(result.validationTime).toBeLessThan(100)
      }
    })

    test('should handle very long code samples', async () => {
      const longCode = 'pub fun test() {}\n'.repeat(1000)
      const result = await validator.validateUserInput(longCode)
      
      expect(result).toBeDefined()
      expect(result.hasLegacyPatterns).toBe(true)
      expect(result.patterns.length).toBe(1000) // One pattern per line
    })

    test('should handle unicode and special characters', async () => {
      const unicodeCode = 'pub fun test_函数() { /* 注释 */ }'
      const result = await validator.validateUserInput(unicodeCode)
      
      expect(result.hasLegacyPatterns).toBe(true)
      expect(result.patterns.some(p => p.description.includes('pub'))).toBe(true)
    })
  })
})