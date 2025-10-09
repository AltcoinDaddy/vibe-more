/**
 * Functional Completeness Validator Tests
 * 
 * Tests for validating required function implementations, resource lifecycle management,
 * event emission patterns, and access control completeness.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FunctionalCompletenessValidator } from '../functional-completeness-validator'
import { ContractType } from '../types'

describe('FunctionalCompletenessValidator', () => {
  let validator: FunctionalCompletenessValidator

  beforeEach(() => {
    validator = new FunctionalCompletenessValidator()
  })

  describe('Function Completeness Validation', () => {
    it('should detect complete functions', async () => {
      const code = `
        access(all) contract TestContract {
          init() {
            // Initialization logic
          }
          
          access(all) fun getValue(): String {
            return "test"
          }
          
          access(all) fun setValue(value: String) {
            // Set value logic
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.functionCompleteness.totalFunctions).toBeGreaterThan(0)
      expect(result.functionCompleteness.completeFunctions).toBeGreaterThan(0)
      expect(result.functionCompleteness.incompleteFunctions).toHaveLength(0)
      expect(result.functionCompleteness.completenessPercentage).toBe(100)
    })

    it('should detect incomplete functions', async () => {
      const code = `
        access(all) contract TestContract {
          init() {
            // Initialization logic
          }
          
          fun getValue(): String {
            // Missing access modifier and return statement
          }
          
          access(all) fun setValue(value: String)
          // Missing function body
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.functionCompleteness.totalFunctions).toBeGreaterThan(0)
      expect(result.functionCompleteness.incompleteFunctions.length).toBeGreaterThan(0)
      expect(result.functionCompleteness.completenessPercentage).toBeLessThan(100)
      expect(result.functionCompleteness.completenessPercentage).toBeLessThan(50)
    })

    it('should detect missing required functions for NFT contracts', async () => {
      const code = `
        access(all) contract TestNFT {
          init() {
            // Initialization logic
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'nft',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.functionCompleteness.missingRequiredFunctions).toContain('mint')
      expect(result.functionCompleteness.missingRequiredFunctions).toContain('deposit')
    })

    it('should detect missing required functions for fungible token contracts', async () => {
      const code = `
        access(all) contract TestToken {
          init() {
            // Initialization logic
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'fungible-token',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.functionCompleteness.missingRequiredFunctions).toContain('mint')
      expect(result.functionCompleteness.missingRequiredFunctions).toContain('withdraw')
      expect(result.functionCompleteness.missingRequiredFunctions).toContain('deposit')
    })
  })

  describe('Resource Lifecycle Validation', () => {
    it('should validate complete resource lifecycle', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) resource TestResource {
            init() {
              // Resource initialization
            }
            
            destroy() {
              // Resource cleanup
            }
          }
          
          init() {
            // Contract initialization
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.resourceLifecycleValidation.resources).toHaveLength(1)
      expect(result.resourceLifecycleValidation.resources[0].lifecycleComplete).toBe(true)
      expect(result.resourceLifecycleValidation.lifecycleScore).toBe(100)
    })

    it('should detect missing resource lifecycle methods', async () => {
      const code = `
        access(all) contract TestContract {
          resource TestResource {
            // Missing init and destroy, missing access modifier
          }
          
          init() {
            // Contract initialization
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.resourceLifecycleValidation.resources).toHaveLength(1)
      expect(result.resourceLifecycleValidation.resources[0].lifecycleComplete).toBe(false)
      expect(result.resourceLifecycleValidation.resources[0].hasInit).toBe(false)
      expect(result.resourceLifecycleValidation.resources[0].hasDestroy).toBe(false)
      expect(result.resourceLifecycleValidation.resources[0].hasProperAccess).toBe(false)
      expect(result.resourceLifecycleValidation.lifecycleScore).toBe(0)
    })
  })

  describe('Event Emission Validation', () => {
    it('should validate complete event emission patterns', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) event TestEvent(value: String)
          access(all) event AnotherEvent(id: UInt64)
          
          init() {
            emit TestEvent(value: "initialized")
          }
          
          access(all) fun doSomething() {
            emit AnotherEvent(id: 123)
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.eventEmissionValidation.definedEvents).toHaveLength(2)
      expect(result.eventEmissionValidation.emittedEvents).toContain('TestEvent')
      expect(result.eventEmissionValidation.emittedEvents).toContain('AnotherEvent')
      expect(result.eventEmissionValidation.unusedEvents).toHaveLength(0)
      expect(result.eventEmissionValidation.emissionCompleteness).toBe(100)
    })

    it('should detect unused events', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) event UsedEvent(value: String)
          access(all) event UnusedEvent(id: UInt64)
          
          init() {
            emit UsedEvent(value: "initialized")
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.eventEmissionValidation.definedEvents).toHaveLength(2)
      expect(result.eventEmissionValidation.unusedEvents).toContain('UnusedEvent')
      expect(result.eventEmissionValidation.emissionCompleteness).toBe(50)
    })

    it('should detect missing expected events for NFT contracts', async () => {
      const code = `
        access(all) contract TestNFT {
          init() {
            // No minting events
          }
          
          access(all) fun mint() {
            // Minting without event emission
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'nft',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.eventEmissionValidation.missingEmissions.length).toBeGreaterThan(0)
      expect(result.eventEmissionValidation.missingEmissions.some(e => 
        e.includes('Mint') || e.includes('NFT')
      )).toBe(true)
    })
  })

  describe('Access Control Validation', () => {
    it('should validate complete access control', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) resource TestResource {
            access(all) fun doSomething() {
              // Resource function with access control
            }
          }
          
          init() {
            // Contract initialization
          }
          
          access(all) fun publicFunction() {
            // Public function
          }
          
          access(contract) fun contractFunction() {
            // Contract-only function
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.accessControlValidation.functionsWithAccess).toBeGreaterThan(0)
      expect(result.accessControlValidation.functionsWithoutAccess).toBe(0)
      expect(result.accessControlValidation.resourcesWithAccess).toBe(1)
      expect(result.accessControlValidation.resourcesWithoutAccess).toBe(0)
      expect(result.accessControlValidation.accessControlScore).toBe(100)
    })

    it('should detect missing access modifiers', async () => {
      const code = `
        access(all) contract TestContract {
          resource TestResource {
            fun doSomething() {
              // Missing access modifiers
            }
          }
          
          init() {
            // Contract initialization
          }
          
          fun publicFunction() {
            // Missing access modifier
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.accessControlValidation.functionsWithoutAccess).toBeGreaterThan(0)
      expect(result.accessControlValidation.accessControlScore).toBeLessThan(100)
      expect(result.accessControlValidation.resourcesWithAccess).toBe(0)
      expect(result.accessControlValidation.resourcesWithoutAccess).toBe(1)
      expect(result.accessControlValidation.accessControlScore).toBeLessThan(50)
    })
  })

  describe('Overall Completeness Scoring', () => {
    it('should calculate high completeness score for complete contract', async () => {
      const code = `
        access(all) contract CompleteContract {
          access(all) event ContractInitialized()
          access(all) event ValueChanged(newValue: String)
          
          access(all) resource CompleteResource {
            access(all) var value: String
            
            init(initialValue: String) {
              self.value = initialValue
            }
            
            access(all) fun getValue(): String {
              return self.value
            }
            
            access(all) fun setValue(newValue: String) {
              self.value = newValue
              emit ValueChanged(newValue: newValue)
            }
            
            destroy() {
              // Cleanup logic
            }
          }
          
          init() {
            emit ContractInitialized()
          }
          
          access(all) fun createResource(value: String): @CompleteResource {
            return <- create CompleteResource(initialValue: value)
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'intermediate',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.completenessScore).toBeGreaterThan(80)
      expect(result.isComplete).toBe(true)
      expect(result.recommendations).toHaveLength(0)
    })

    it('should calculate low completeness score for incomplete contract', async () => {
      const code = `
        contract IncompleteContract {
          resource IncompleteResource {
            fun doSomething()
          }
          
          fun missingInit()
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.completenessScore).toBeLessThan(40)
      expect(result.isComplete).toBe(false)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Contract Type Specific Validation', () => {
    it('should validate DAO contract completeness', async () => {
      const code = `
        access(all) contract DAOContract {
          access(all) resource Proposal {
            init() {
              // Proposal initialization
            }
            
            destroy() {
              // Proposal cleanup
            }
          }
          
          init() {
            // DAO initialization
          }
          
          access(all) fun createProposal(): @Proposal {
            return <- create Proposal()
          }
          
          access(all) fun vote(proposalId: UInt64, support: Bool) {
            // Voting logic
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'dao',
        complexity: 'intermediate',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.functionCompleteness.missingRequiredFunctions).toHaveLength(0)
      expect(result.completenessScore).toBeGreaterThan(70)
    })

    it('should validate marketplace contract completeness', async () => {
      const code = `
        access(all) contract MarketplaceContract {
          access(all) resource Listing {
            init() {
              // Listing initialization
            }
            
            destroy() {
              // Listing cleanup
            }
          }
          
          init() {
            // Marketplace initialization
          }
          
          access(all) fun createListing(): @Listing {
            return <- create Listing()
          }
          
          access(all) fun purchase(listingId: UInt64) {
            // Purchase logic
          }
        }
      `
      
      const contractType: ContractType = {
        category: 'marketplace',
        complexity: 'intermediate',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.functionCompleteness.missingRequiredFunctions).toHaveLength(0)
      expect(result.completenessScore).toBeGreaterThan(50)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty contract gracefully', async () => {
      const code = ''
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.completenessScore).toBe(0)
      expect(result.isComplete).toBe(false)
      expect(result.functionCompleteness.totalFunctions).toBe(0)
      expect(result.resourceLifecycleValidation.resources).toHaveLength(0)
    })

    it('should handle malformed code gracefully', async () => {
      const code = `
        access(all) contract {
          fun incomplete(
          resource {
            init(
        }
      `
      
      const contractType: ContractType = {
        category: 'generic',
        complexity: 'simple',
        features: []
      }
      
      const result = await validator.validateFunctionalCompleteness(code, contractType)
      
      expect(result.completenessScore).toBeLessThan(50)
      expect(result.isComplete).toBe(false)
    })
  })
})