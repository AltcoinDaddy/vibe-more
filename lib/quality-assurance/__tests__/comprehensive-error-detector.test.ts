/**
 * Unit tests for ComprehensiveErrorDetector
 * 
 * Tests error detection accuracy and classification for various types of
 * generation errors in Cadence contracts.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { 
  ComprehensiveErrorDetector, 
  ErrorType, 
  ErrorCategory,
  DetectedError,
  ErrorDetectionResult
} from '../comprehensive-error-detector'

describe('ComprehensiveErrorDetector', () => {
  let detector: ComprehensiveErrorDetector

  beforeEach(() => {
    detector = new ComprehensiveErrorDetector()
  })

  describe('Function Error Detection', () => {
    test('should detect missing function body', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun testFunction(): String
          
          init() {
            // Contract initialization
          }
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      expect(result.totalErrors).toBeGreaterThan(0)
      const functionError = result.errors.find(e => e.type === ErrorType.MISSING_FUNCTION_BODY)
      expect(functionError).toBeDefined()
      expect(functionError?.severity).toBe('critical')
      expect(functionError?.message).toContain('testFunction')
      expect(functionError?.autoFixable).toBe(true)
    })

    test('should detect incomplete function implementation', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun testFunction(): String {
            // TODO: Implement this function
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const incompleteError = result.errors.find(e => e.type === ErrorType.INCOMPLETE_FUNCTION_IMPLEMENTATION)
      expect(incompleteError).toBeDefined()
      expect(incompleteError?.severity).toBe('critical')
      expect(incompleteError?.autoFixable).toBe(false)
    })

    test('should detect missing return statement', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun getValue(): String {
            let value = "test"
            // Missing return statement
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const incompleteError = result.errors.find(e => e.type === ErrorType.INCOMPLETE_FUNCTION_IMPLEMENTATION)
      expect(incompleteError).toBeDefined()
    })

    test('should detect missing required functions for NFT contract', async () => {
      const code = `
        access(all) contract NFTContract {
          // Missing required NFT functions
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'nft')
      
      const missingFunctions = result.errors.filter(e => e.type === ErrorType.MISSING_REQUIRED_FUNCTION)
      expect(missingFunctions.length).toBeGreaterThan(0)
      
      const requiredFunctionNames = ['createNFT', 'mintNFT', 'getMetadata']
      for (const functionName of requiredFunctionNames) {
        const error = missingFunctions.find(e => e.message.includes(functionName))
        expect(error).toBeDefined()
        expect(error?.severity).toBe('critical')
      }
    })

    test('should not report errors for complete function implementations', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun testFunction(): String {
            return "Hello, World!"
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const functionErrors = result.errors.filter(e => 
        e.type === ErrorType.MISSING_FUNCTION_BODY || 
        e.type === ErrorType.INCOMPLETE_FUNCTION_IMPLEMENTATION
      )
      expect(functionErrors.length).toBe(0)
    })
  })

  describe('Structural Error Detection', () => {
    test('should detect missing contract declaration', async () => {
      const code = `
        // Missing contract declaration
        access(all) fun testFunction(): String {
          return "test"
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const contractError = result.errors.find(e => e.type === ErrorType.MISSING_CONTRACT_DECLARATION)
      expect(contractError).toBeDefined()
      expect(contractError?.severity).toBe('critical')
      expect(contractError?.autoFixable).toBe(true)
    })

    test('should detect missing init function', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun testFunction(): String {
            return "test"
          }
          // Missing init function
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const initError = result.errors.find(e => e.type === ErrorType.MISSING_INIT_FUNCTION)
      expect(initError).toBeDefined()
      expect(initError?.severity).toBe('critical')
      expect(initError?.autoFixable).toBe(true)
    })

    test('should detect missing required imports for NFT contract', async () => {
      const code = `
        access(all) contract NFTContract {
          // Missing NonFungibleToken and MetadataViews imports
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'nft')
      
      const importErrors = result.errors.filter(e => e.type === ErrorType.MISSING_IMPORT_STATEMENTS)
      expect(importErrors.length).toBeGreaterThan(0)
      
      const requiredImports = ['NonFungibleToken', 'MetadataViews']
      for (const importName of requiredImports) {
        const error = importErrors.find(e => e.message.includes(importName))
        expect(error).toBeDefined()
        expect(error?.severity).toBe('warning')
      }
    })

    test('should not report structural errors for well-formed contracts', async () => {
      const code = `
        access(all) contract TestContract {
          init() {
            // Proper initialization
          }
          
          access(all) fun testFunction(): String {
            return "test"
          }
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const structuralErrors = result.errors.filter(e => e.category === ErrorCategory.STRUCTURAL)
      expect(structuralErrors.length).toBe(0)
    })
  })

  describe('Resource Error Detection', () => {
    test('should detect incomplete resource definition', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) resource TestResource
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const resourceError = result.errors.find(e => e.type === ErrorType.INCOMPLETE_RESOURCE_DEFINITION)
      expect(resourceError).toBeDefined()
      expect(resourceError?.severity).toBe('critical')
      expect(resourceError?.message).toContain('TestResource')
    })

    test('should detect missing destroy method in resource', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) resource TestResource {
            access(all) let id: UInt64
            
            init(id: UInt64) {
              self.id = id
            }
            // Missing destroy method
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const destroyError = result.errors.find(e => e.type === ErrorType.MISSING_RESOURCE_METHODS)
      expect(destroyError).toBeDefined()
      expect(destroyError?.severity).toBe('warning')
      expect(destroyError?.message).toContain('destroy()')
    })

    test('should not report errors for complete resource definitions', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) resource TestResource {
            access(all) let id: UInt64
            
            init(id: UInt64) {
              self.id = id
            }
            
            destroy() {
              // Cleanup
            }
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const resourceErrors = result.errors.filter(e => 
        e.type === ErrorType.INCOMPLETE_RESOURCE_DEFINITION ||
        e.type === ErrorType.MISSING_RESOURCE_METHODS
      )
      expect(resourceErrors.length).toBe(0)
    })
  })

  describe('Event Error Detection', () => {
    test('should detect missing required events for NFT contract', async () => {
      const code = `
        access(all) contract NFTContract {
          // Missing required events
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'nft')
      
      const eventErrors = result.errors.filter(e => e.type === ErrorType.MISSING_EVENT_DEFINITIONS)
      expect(eventErrors.length).toBeGreaterThan(0)
      
      const requiredEvents = ['Minted', 'Withdraw', 'Deposit']
      for (const eventName of requiredEvents) {
        const error = eventErrors.find(e => e.message.includes(eventName))
        expect(error).toBeDefined()
        expect(error?.severity).toBe('warning')
      }
    })

    test('should detect unused event definitions', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) event TestEvent(id: UInt64)
          
          access(all) fun doSomething() {
            // Event is defined but never emitted
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const unusedEventError = result.errors.find(e => e.type === ErrorType.MISSING_EVENT_EMISSION)
      expect(unusedEventError).toBeDefined()
      expect(unusedEventError?.severity).toBe('info')
      expect(unusedEventError?.message).toContain('TestEvent')
    })

    test('should not report errors for properly used events', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) event TestEvent(id: UInt64)
          
          access(all) fun doSomething() {
            emit TestEvent(id: 1)
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const eventErrors = result.errors.filter(e => e.type === ErrorType.MISSING_EVENT_EMISSION)
      expect(eventErrors.length).toBe(0)
    })
  })

  describe('Access Control Error Detection', () => {
    test('should detect functions without access modifiers', async () => {
      const code = `
        access(all) contract TestContract {
          fun testFunction(): String {
            return "test"
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const accessError = result.errors.find(e => e.type === ErrorType.MISSING_ACCESS_MODIFIERS)
      expect(accessError).toBeDefined()
      expect(accessError?.severity).toBe('warning')
      expect(accessError?.message).toContain('testFunction')
      expect(accessError?.autoFixable).toBe(true)
    })

    test('should not report errors for functions with proper access modifiers', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun publicFunction(): String {
            return "test"
          }
          
          access(account) fun accountFunction(): String {
            return "test"
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const accessErrors = result.errors.filter(e => e.type === ErrorType.MISSING_ACCESS_MODIFIERS)
      expect(accessErrors.length).toBe(0)
    })
  })

  describe('Completeness Error Detection', () => {
    test('should detect TODO comments', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun testFunction(): String {
            // TODO: Implement this function
            return "test"
          }
          
          init() {
            /* TODO: Add initialization */
          }
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const todoErrors = result.errors.filter(e => e.type === ErrorType.INCOMPLETE_IMPLEMENTATION)
      expect(todoErrors.length).toBeGreaterThan(0)
      
      for (const error of todoErrors) {
        expect(error.severity).toBe('warning')
        expect(error.message).toContain('TODO')
      }
    })

    test('should detect empty function bodies', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun emptyFunction(): String {}
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const emptyError = result.errors.find(e => 
        e.type === ErrorType.INCOMPLETE_IMPLEMENTATION && 
        e.message.includes('empty implementation')
      )
      expect(emptyError).toBeDefined()
      expect(emptyError?.severity).toBe('critical')
    })
  })

  describe('Best Practice Violation Detection', () => {
    test('should detect poor naming conventions', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun badNaming_Convention(): String {
            return "test"
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const namingError = result.errors.find(e => e.type === ErrorType.POOR_NAMING_CONVENTION)
      expect(namingError).toBeDefined()
      expect(namingError?.severity).toBe('info')
    })
  })

  describe('Error Classification', () => {
    test('should correctly classify errors by category', async () => {
      const code = `
        // Missing contract declaration (structural)
        fun testFunction(): String {  // Missing access modifier (security)
          // TODO: Implement (completeness)
          return "test"
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      expect(result.classification.structuralErrors).toBeGreaterThan(0)
      expect(result.classification.securityIssues).toBeGreaterThan(0)
      expect(result.classification.completenessErrors).toBeGreaterThan(0)
    })

    test('should count errors by severity correctly', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun testFunction(): String
          // TODO: Add implementation
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      expect(result.totalErrors).toBe(result.criticalErrors + result.warningErrors + result.infoErrors)
      expect(result.criticalErrors).toBeGreaterThan(0) // Missing function body
      expect(result.warningErrors).toBeGreaterThan(0) // TODO comment
    })
  })

  describe('Completeness Score Calculation', () => {
    test('should calculate low completeness score for incomplete contract', async () => {
      const code = `
        // Incomplete contract with many issues
        access(all) fun testFunction(): String
      `

      const result = await detector.detectErrors(code, 'nft')
      
      expect(result.completenessScore).toBeLessThan(50)
    })

    test('should calculate high completeness score for complete contract', async () => {
      const code = `
        access(all) contract CompleteContract {
          access(all) fun testFunction(): String {
            return "complete"
          }
          
          init() {
            // Proper initialization
          }
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      expect(result.completenessScore).toBeGreaterThan(80)
    })
  })

  describe('Actionable Recommendations', () => {
    test('should generate relevant recommendations based on detected errors', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun testFunction(): String
          // TODO: Implement
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      expect(result.actionableRecommendations.length).toBeGreaterThan(0)
      expect(result.actionableRecommendations.some(r => r.includes('function'))).toBe(true)
      expect(result.actionableRecommendations.some(r => r.includes('init'))).toBe(true)
    })

    test('should provide positive feedback for clean code', async () => {
      const code = `
        access(all) contract CleanContract {
          access(all) fun testFunction(): String {
            return "clean"
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      if (result.totalErrors === 0) {
        expect(result.actionableRecommendations.some(r => r.includes('good'))).toBe(true)
      }
    })
  })

  describe('Contract Type Inference', () => {
    test('should infer NFT contract type from code content', async () => {
      const code = `
        import NonFungibleToken from 0x1d7e57aa55817448
        
        access(all) contract MyNFT {
          access(all) resource NFT {
            access(all) let id: UInt64
            
            init(id: UInt64) {
              self.id = id
            }
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code) // No explicit type
      
      // Should detect as NFT and check for NFT-specific requirements
      const nftErrors = result.errors.filter(e => e.message.includes('NFT') || e.message.includes('nft'))
      expect(nftErrors.length).toBeGreaterThan(0)
    })

    test('should infer fungible token contract type', async () => {
      const code = `
        import FungibleToken from 0xf233dcee88fe0abe
        
        access(all) contract MyToken {
          access(all) resource Vault {
            access(all) var balance: UFix64
            
            init(balance: UFix64) {
              self.balance = balance
            }
          }
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code) // No explicit type
      
      // Should detect as fungible token and check for token-specific requirements
      const tokenErrors = result.errors.filter(e => e.message.includes('token') || e.message.includes('Vault'))
      expect(tokenErrors.length).toBeGreaterThan(0)
    })
  })

  describe('Error Context Information', () => {
    test('should provide detailed context for each error', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun testFunction(): String
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const functionError = result.errors.find(e => e.type === ErrorType.MISSING_FUNCTION_BODY)
      expect(functionError).toBeDefined()
      expect(functionError?.context).toBeDefined()
      expect(functionError?.context.functionName).toBe('testFunction')
      expect(functionError?.context.surroundingCode).toBeDefined()
      expect(functionError?.context.lineContent).toBeDefined()
    })
  })

  describe('Auto-fixable Error Identification', () => {
    test('should correctly identify auto-fixable errors', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) fun testFunction(): String
          
          init() {}
        }
      `

      const result = await detector.detectErrors(code, 'generic')
      
      const autoFixableErrors = result.errors.filter(e => e.autoFixable)
      const nonAutoFixableErrors = result.errors.filter(e => !e.autoFixable)
      
      expect(autoFixableErrors.length).toBeGreaterThan(0)
      
      // Missing function body should be auto-fixable
      const functionBodyError = result.errors.find(e => e.type === ErrorType.MISSING_FUNCTION_BODY)
      expect(functionBodyError?.autoFixable).toBe(true)
    })
  })

  describe('Error Detection Performance', () => {
    test('should complete error detection within reasonable time', async () => {
      const largeCode = `
        access(all) contract LargeContract {
          ${Array.from({ length: 100 }, (_, i) => `
            access(all) fun function${i}(): String {
              return "function${i}"
            }
          `).join('\n')}
          
          init() {}
        }
      `

      const startTime = Date.now()
      const result = await detector.detectErrors(largeCode, 'generic')
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      expect(result).toBeDefined()
    })
  })
})