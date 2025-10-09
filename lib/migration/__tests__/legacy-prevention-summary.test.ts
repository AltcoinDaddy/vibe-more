/**
 * Summary Test for Legacy Prevention System
 * Demonstrates key functionality and validates core requirements
 */

import { describe, test, expect } from 'vitest'
import { RealtimeValidator } from '../realtime-validator'
import { LegacyPatternDetector } from '../legacy-pattern-detector'

describe('Legacy Prevention System - Summary Tests', () => {
  const validator = new RealtimeValidator()
  const detector = new LegacyPatternDetector()

  test('should reject all legacy syntax patterns', async () => {
    const legacyExamples = [
      'pub fun test() {}',
      'pub var balance: UFix64',
      'pub resource Vault {}',
      'account.save(<-resource, to: /storage/path)',
      'account.load<@Resource>(from: /storage/path)',
      'account.borrow<&Resource>(from: /storage/path)',
      'resource Vault: Provider, Receiver'
    ]

    for (const code of legacyExamples) {
      const result = await validator.validateUserInput(code)
      expect(result.hasLegacyPatterns).toBe(true)
      expect(result.patterns.length).toBeGreaterThan(0)
      expect(result.suggestions.length).toBeGreaterThan(0)
    }
  })

  test('should accept all modern syntax patterns', async () => {
    const modernExamples = [
      'access(all) fun test() {}',
      'access(all) var balance: UFix64',
      'access(all) resource Vault {}',
      'account.storage.save(<-resource, to: /storage/path)',
      'account.storage.load<@Resource>(from: /storage/path)',
      'account.capabilities.borrow<&Resource>(/public/path)',
      'resource Vault: Provider & Receiver'
    ]

    for (const code of modernExamples) {
      const result = await validator.validateUserInput(code)
      expect(result.hasLegacyPatterns).toBe(false)
      expect(result.isValid).toBe(true)
      expect(result.patterns.length).toBe(0)
    }
  })

  test('should provide modernization suggestions', async () => {
    const legacyCode = 'pub fun getValue(): String { return self.value }'
    const result = await validator.validateUserInput(legacyCode)
    
    expect(result.suggestions.length).toBeGreaterThan(0)
    const suggestion = result.suggestions[0]
    expect(suggestion.modernReplacement).toContain('access(all)')
    expect(suggestion.explanation).toBeTruthy()
    expect(suggestion.example).toBeDefined()
  })

  test('should auto-modernize legacy code', () => {
    const legacyCode = 'pub fun test() { account.save(<-resource, to: /storage/path) }'
    const result = validator.autoModernizeCode(legacyCode, {
      autoFixCritical: true,
      autoFixWarnings: true,
      preserveComments: true,
      addExplanationComments: false
    })
    
    expect(result.modernizedCode).toContain('access(all)')
    expect(result.modernizedCode).toContain('account.storage.save')
    expect(result.modernizedCode).not.toContain('pub ')
    expect(result.transformationsApplied.length).toBeGreaterThan(0)
  })

  test('should validate quickly (performance requirement)', async () => {
    const testCode = 'pub fun test() { account.save(<-resource, to: /storage/path) }'
    
    const startTime = performance.now()
    const result = await validator.validateUserInput(testCode)
    const endTime = performance.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(100) // Sub-100ms requirement
    expect(result.validationTime).toBeLessThan(100)
    expect(result.hasLegacyPatterns).toBe(true)
  })

  test('should provide educational content', async () => {
    const legacyCode = 'pub fun test() {}'
    const result = await validator.validateUserInput(legacyCode)
    
    expect(result.educationalContent.length).toBeGreaterThan(0)
    const education = result.educationalContent[0]
    expect(education.title).toBeTruthy()
    expect(education.description).toBeTruthy()
    expect(education.benefits).toBeDefined()
    expect(education.benefits.length).toBeGreaterThan(0)
  })

  test('should handle complex contracts correctly', async () => {
    const complexContract = `
      pub contract TestContract {
        pub resource Vault: Provider, Receiver {
          pub var balance: UFix64
          
          pub fun deposit(from: @FungibleToken.Vault) {
            self.balance = self.balance + from.balance
            account.save(<-from, to: /storage/temp)
          }
        }
      }
    `
    
    const result = await validator.validateUserInput(complexContract)
    
    expect(result.hasLegacyPatterns).toBe(true)
    expect(result.patterns.length).toBeGreaterThan(5) // Multiple patterns detected
    expect(result.suggestions.length).toBeGreaterThan(5) // Multiple suggestions provided
    
    // Should detect different types of patterns
    const patternTypes = new Set(result.patterns.map(p => p.type))
    expect(patternTypes.size).toBeGreaterThan(1) // Multiple pattern types
  })

  test('should maintain consistency across multiple runs', async () => {
    const testCode = 'pub fun test() { account.save(<-resource, to: /storage/path) }'
    
    const results = await Promise.all([
      validator.validateUserInput(testCode),
      validator.validateUserInput(testCode),
      validator.validateUserInput(testCode)
    ])
    
    // All results should be consistent
    const firstResult = results[0]
    results.forEach(result => {
      expect(result.hasLegacyPatterns).toBe(firstResult.hasLegacyPatterns)
      expect(result.patterns.length).toBe(firstResult.patterns.length)
      expect(result.suggestions.length).toBe(firstResult.suggestions.length)
    })
  })

  test('should handle edge cases gracefully', async () => {
    const edgeCases = ['', null, undefined, 'invalid syntax {{{']
    
    for (const testCase of edgeCases) {
      try {
        const result = await validator.validateUserInput(testCase as string)
        expect(result).toBeDefined()
        expect(result.validationTime).toBeLessThan(100)
      } catch (error) {
        // Should not crash, but if it throws, that's also acceptable for invalid input
        expect(error).toBeDefined()
      }
    }
  })

  test('should demonstrate end-to-end legacy prevention workflow', async () => {
    // 1. User submits legacy code
    const userCode = `
      pub contract UserContract {
        pub resource UserVault: Provider, Receiver {
          pub var balance: UFix64
          
          pub fun withdraw(amount: UFix64) {
            account.save(<-create UserVault(), to: /storage/vault)
          }
        }
      }
    `
    
    // 2. System validates and detects legacy patterns
    const validationResult = await validator.validateUserInput(userCode)
    expect(validationResult.hasLegacyPatterns).toBe(true)
    expect(validationResult.isValid).toBe(false) // Contains critical patterns
    
    // 3. System provides modernization suggestions
    expect(validationResult.suggestions.length).toBeGreaterThan(0)
    expect(validationResult.educationalContent.length).toBeGreaterThan(0)
    
    // 4. System can auto-modernize the code
    const modernizationResult = validator.autoModernizeCode(userCode, {
      autoFixCritical: true,
      autoFixWarnings: true,
      preserveComments: true,
      addExplanationComments: false
    })
    
    expect(modernizationResult.modernizedCode).not.toContain('pub ')
    expect(modernizationResult.modernizedCode).toContain('access(all)')
    expect(modernizationResult.modernizedCode).toContain('&') // Modern interface syntax
    expect(modernizationResult.modernizedCode).toContain('account.storage.save')
    
    // 5. Modernized code should pass validation
    const finalValidation = await validator.validateUserInput(modernizationResult.modernizedCode)
    expect(finalValidation.hasLegacyPatterns).toBe(false)
    expect(finalValidation.isValid).toBe(true)
    
    console.log('✅ End-to-end legacy prevention workflow completed successfully')
  })
})