/**
 * Performance and Regression Tests for Legacy Prevention System
 * Tests to ensure the system maintains performance and prevents regression
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { RealtimeValidator } from '../realtime-validator'
import { LegacyPatternDetector } from '../legacy-pattern-detector'
import { ComprehensiveSystemValidator } from '../comprehensive-system-validator'

describe('Performance and Regression Tests', () => {
  let validator: RealtimeValidator
  let detector: LegacyPatternDetector
  let systemValidator: ComprehensiveSystemValidator
  let performanceMetrics: any[]

  beforeEach(() => {
    validator = new RealtimeValidator()
    detector = new LegacyPatternDetector()
    systemValidator = new ComprehensiveSystemValidator()
    performanceMetrics = []
  })

  afterEach(() => {
    // Log performance metrics for analysis
    if (performanceMetrics.length > 0) {
      const avgTime = performanceMetrics.reduce((sum, m) => sum + m.time, 0) / performanceMetrics.length
      console.log(`Average validation time: ${avgTime.toFixed(2)}ms`)
    }
  })

  describe('Real-time Validation Performance', () => {
    test('should validate simple code within 50ms', async () => {
      const testCases = [
        'pub fun test() {}',
        'access(all) fun modern() {}',
        'account.save(<-resource, to: /storage/path)',
        'account.storage.save(<-resource, to: /storage/path)',
        'resource Vault: Provider, Receiver',
        'resource Vault: Provider & Receiver'
      ]

      for (const code of testCases) {
        const startTime = performance.now()
        const result = await validator.validateUserInput(code)
        const endTime = performance.now()
        const duration = endTime - startTime

        performanceMetrics.push({ code: code.substring(0, 20), time: duration })

        expect(duration).toBeLessThan(50)
        expect(result.validationTime).toBeLessThan(50)
      }
    })

    test('should validate complex contracts within 100ms', async () => {
      const complexContract = `
        pub contract ComplexContract {
          pub resource Vault: Provider, Receiver, Balance {
            pub var balance: UFix64
            pub var metadata: {String: AnyStruct}
            
            pub fun deposit(from: @FungibleToken.Vault) {
              self.balance = self.balance + from.balance
              account.save(<-from, to: /storage/temp)
            }
            
            pub fun withdraw(amount: UFix64): @FungibleToken.Vault {
              let vault <- account.load<@Vault>(from: /storage/vault)
              return <-vault
            }
            
            pub fun getBalance(): UFix64 {
              return self.balance
            }
            
            pub fun updateMetadata(key: String, value: AnyStruct) {
              self.metadata[key] = value
            }
          }
          
          pub fun createVault(): @Vault {
            let vault <- create Vault(balance: 0.0, metadata: {})
            account.save(<-vault, to: /storage/vault)
            account.link<&Vault>(/public/vault, target: /storage/vault)
            return <-account.load<@Vault>(from: /storage/vault)!
          }
          
          pub fun setupAccount() {
            let vault <- self.createVault()
            account.save(<-vault, to: /storage/mainVault)
          }
        }
      `

      const startTime = performance.now()
      const result = await validator.validateUserInput(complexContract)
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)
      expect(result.validationTime).toBeLessThan(100)
      expect(result.hasLegacyPatterns).toBe(true)
      expect(result.patterns.length).toBeGreaterThan(10)
    })

    test('should maintain performance under load', async () => {
      const testCode = 'pub fun test() { account.save(<-resource, to: /storage/path) }'
      const concurrentRequests = 50

      const startTime = performance.now()
      
      const promises = Array(concurrentRequests).fill(null).map(async () => {
        const requestStart = performance.now()
        const result = await validator.validateUserInput(testCode)
        const requestEnd = performance.now()
        
        return {
          result,
          duration: requestEnd - requestStart
        }
      })

      const results = await Promise.all(promises)
      const totalTime = performance.now() - startTime

      // All individual requests should be fast
      results.forEach(({ duration }) => {
        expect(duration).toBeLessThan(100)
      })

      // Total time should be reasonable for concurrent processing
      expect(totalTime).toBeLessThan(5000) // 5 seconds for 50 concurrent requests

      // All results should be consistent
      const firstResult = results[0].result
      results.forEach(({ result }) => {
        expect(result.hasLegacyPatterns).toBe(firstResult.hasLegacyPatterns)
        expect(result.patterns.length).toBe(firstResult.patterns.length)
      })
    })

    test('should handle large code files efficiently', async () => {
      // Generate a large contract with many functions
      const largeFunctions = Array(100).fill(null).map((_, i) => `
        pub fun function${i}() {
          account.save(<-resource${i}, to: /storage/path${i})
          let ref = account.borrow<&Resource>(from: /storage/path${i})
        }
      `).join('\n')

      const largeContract = `
        pub contract LargeContract {
          pub resource LargeResource: Provider, Receiver {
            pub var balance: UFix64
            ${largeFunctions}
          }
        }
      `

      const startTime = performance.now()
      const result = await validator.validateUserInput(largeContract)
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(500) // Allow more time for large files
      expect(result.hasLegacyPatterns).toBe(true)
      expect(result.patterns.length).toBeGreaterThan(200) // Should detect many patterns
    })
  })

  describe('Pattern Detection Performance', () => {
    test('should detect patterns quickly in various code sizes', () => {
      const codeSizes = [
        { name: 'small', lines: 10 },
        { name: 'medium', lines: 100 },
        { name: 'large', lines: 1000 }
      ]

      codeSizes.forEach(({ name, lines }) => {
        const code = Array(lines).fill('pub fun test() {}').join('\n')
        
        const startTime = performance.now()
        const patterns = detector.detectAllLegacyPatterns(code)
        const endTime = performance.now()
        const duration = endTime - startTime

        expect(duration).toBeLessThan(lines * 0.1) // Should be very fast per line
        expect(patterns.length).toBe(lines) // Should detect all patterns

        performanceMetrics.push({ test: `pattern-detection-${name}`, time: duration })
      })
    })

    test('should maintain consistent detection speed', () => {
      const testCode = 'pub fun test() { account.save(<-resource, to: /storage/path) }'
      const iterations = 100
      const durations: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        detector.detectAllLegacyPatterns(testCode)
        const endTime = performance.now()
        durations.push(endTime - startTime)
      }

      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
      const maxDuration = Math.max(...durations)
      const minDuration = Math.min(...durations)

      expect(avgDuration).toBeLessThan(5) // Very fast average
      expect(maxDuration).toBeLessThan(20) // No outliers
      expect(maxDuration - minDuration).toBeLessThan(15) // Consistent performance
    })
  })

  describe('Memory Usage Tests', () => {
    test('should not leak memory during repeated validations', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      const testCode = 'pub fun test() { account.save(<-resource, to: /storage/path) }'

      // Perform many validations
      for (let i = 0; i < 1000; i++) {
        await validator.validateUserInput(testCode)
        
        // Force garbage collection periodically
        if (i % 100 === 0 && global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncreaseMB).toBeLessThan(10)
    })

    test('should handle large code without excessive memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create a very large code sample
      const largeCode = Array(10000).fill('pub fun test() {}').join('\n')
      
      await validator.validateUserInput(largeCode)
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024

      // Should not use excessive memory even for large code
      expect(memoryIncreaseMB).toBeLessThan(50)
    })
  })

  describe('Regression Prevention Tests', () => {
    test('should maintain consistent validation results over time', async () => {
      const testCases = [
        { code: 'pub fun test() {}', expectedLegacy: true },
        { code: 'access(all) fun test() {}', expectedLegacy: false },
        { code: 'account.save(<-r, to: /s/p)', expectedLegacy: true },
        { code: 'account.storage.save(<-r, to: /s/p)', expectedLegacy: false },
        { code: 'resource V: P, R', expectedLegacy: true },
        { code: 'resource V: P & R', expectedLegacy: false }
      ]

      // Run tests multiple times to ensure consistency
      for (let iteration = 0; iteration < 5; iteration++) {
        for (const testCase of testCases) {
          const result = await validator.validateUserInput(testCase.code)
          expect(result.hasLegacyPatterns).toBe(testCase.expectedLegacy)
        }
      }
    })

    test('should not introduce false positives for modern syntax', async () => {
      const modernSyntaxExamples = [
        'access(all) fun getValue(): String { return self.value }',
        'access(self) var privateBalance: UFix64',
        'access(contract) resource InternalVault {}',
        'access(account) fun accountFunction() {}',
        'account.storage.save(<-vault, to: /storage/vault)',
        'account.storage.load<@Vault>(from: /storage/vault)',
        'account.capabilities.borrow<&Vault>(/public/vault)',
        'account.capabilities.storage.issue<&Vault>(/storage/vault)',
        'resource Vault: Provider & Receiver & Balance',
        'access(all) view fun getBalance(): UFix64 { return self.balance }',
        'access(NonFungibleToken.Withdraw) fun withdraw() {}'
      ]

      for (const code of modernSyntaxExamples) {
        const result = await validator.validateUserInput(code)
        expect(result.hasLegacyPatterns).toBe(false)
        expect(result.isValid).toBe(true)
        expect(result.patterns.length).toBe(0)
      }
    })

    test('should maintain pattern detection accuracy', () => {
      const patternTests = [
        {
          code: 'pub fun test() {}',
          expectedPatterns: ['access-modifier'],
          expectedSeverity: 'critical'
        },
        {
          code: 'account.save(<-resource, to: /storage/path)',
          expectedPatterns: ['storage-api'],
          expectedSeverity: 'critical'
        },
        {
          code: 'resource Vault: Provider, Receiver',
          expectedPatterns: ['interface-conformance'],
          expectedSeverity: 'warning'
        }
      ]

      patternTests.forEach(test => {
        const patterns = detector.detectAllLegacyPatterns(test.code)
        
        expect(patterns.length).toBeGreaterThan(0)
        expect(patterns.some(p => test.expectedPatterns.includes(p.type))).toBe(true)
        
        const relevantPattern = patterns.find(p => test.expectedPatterns.includes(p.type))
        expect(relevantPattern?.severity).toBe(test.expectedSeverity)
      })
    })

    test('should prevent regression in modernization suggestions', () => {
      const modernizationTests = [
        {
          legacy: 'pub fun getValue(): String',
          expectedModern: 'access(all) fun getValue(): String'
        },
        {
          legacy: 'pub var balance: UFix64',
          expectedModern: 'access(all) var balance: UFix64'
        },
        {
          legacy: 'account.save(<-vault, to: /storage/vault)',
          expectedModern: 'account.storage.save(<-vault, to: /storage/vault)'
        },
        {
          legacy: 'resource Vault: Provider, Receiver',
          expectedModern: 'resource Vault: Provider & Receiver'
        }
      ]

      modernizationTests.forEach(test => {
        const patterns = detector.detectAllLegacyPatterns(test.legacy)
        expect(patterns.length).toBeGreaterThan(0)
        
        const suggestions = validator.generateModernizationSuggestions(patterns)
        expect(suggestions.length).toBeGreaterThan(0)
        
        const relevantSuggestion = suggestions[0]
        expect(relevantSuggestion.modernReplacement).toContain(
          test.expectedModern.replace(test.legacy, '').trim()
        )
      })
    })
  })

  describe('System Integration Performance', () => {
    test('should complete full system validation within reasonable time', async () => {
      const startTime = performance.now()
      
      // Run a lightweight version of system validation for testing
      const result = await systemValidator.validateSystem()
      
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    test('should maintain performance across different validation scenarios', async () => {
      const scenarios = [
        { name: 'empty-code', code: '' },
        { name: 'modern-code', code: 'access(all) fun test() {}' },
        { name: 'legacy-code', code: 'pub fun test() {}' },
        { name: 'mixed-code', code: 'access(all) fun modern() {}\npub fun legacy() {}' }
      ]

      const results = await Promise.all(
        scenarios.map(async scenario => {
          const startTime = performance.now()
          const result = await validator.validateUserInput(scenario.code)
          const endTime = performance.now()
          
          return {
            scenario: scenario.name,
            duration: endTime - startTime,
            result
          }
        })
      )

      results.forEach(({ scenario, duration, result }) => {
        expect(duration).toBeLessThan(100)
        expect(result.validationTime).toBeLessThan(100)
        
        performanceMetrics.push({ test: `scenario-${scenario}`, time: duration })
      })
    })
  })

  describe('Error Handling Performance', () => {
    test('should handle errors gracefully without performance degradation', async () => {
      const errorCases = [
        null,
        undefined,
        '',
        'invalid syntax {{{',
        'pub fun incomplete(',
        'very long string'.repeat(10000)
      ]

      for (const errorCase of errorCases) {
        const startTime = performance.now()
        
        try {
          const result = await validator.validateUserInput(errorCase as string)
          const endTime = performance.now()
          const duration = endTime - startTime
          
          expect(duration).toBeLessThan(100)
          expect(result).toBeDefined()
        } catch (error) {
          const endTime = performance.now()
          const duration = endTime - startTime
          
          expect(duration).toBeLessThan(100)
        }
      }
    })

    test('should recover quickly from validation errors', async () => {
      // Cause an error
      try {
        await validator.validateUserInput(null as any)
      } catch (error) {
        // Expected error
      }

      // Should work normally after error
      const startTime = performance.now()
      const result = await validator.validateUserInput('pub fun test() {}')
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)
      expect(result.hasLegacyPatterns).toBe(true)
    })
  })
})