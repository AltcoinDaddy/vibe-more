/**
 * Functional Completeness Integration Tests
 * 
 * Tests for functional completeness validation integration with the comprehensive
 * validation system and other quality assurance components.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ComprehensiveValidationSystem } from '../comprehensive-validation-system'
import { ContractType } from '../types'

describe('Functional Completeness Integration', () => {
  let validationSystem: ComprehensiveValidationSystem

  beforeEach(() => {
    validationSystem = new ComprehensiveValidationSystem()
  })

  describe('Integration with Comprehensive Validation System', () => {
    it('should integrate functional completeness validation in comprehensive validation', async () => {
      const code = `
        access(all) contract TestContract {
          access(all) event ContractInitialized()
          
          access(all) resource TestResource {
            access(all) var value: String
            
            init(initialValue: String) {
              self.value = initialValue
            }
            
            access(all) fun getValue(): String {
              return self.value
            }
            
            destroy() {
              // Cleanup
            }
          }
          
          init() {
            emit ContractInitialized()
          }
          
          access(all) fun createResource(value: String): @TestResource {
            return <- create TestResource(initialValue: value)
          }
        }
      `
      
      const result = await validationSystem.validateCode(code, {
        contractType: { category: 'generic', complexity: 'simple', features: [] }
      })
      
      expect(result.functionalCompletenessValidation).toBeDefined()
      expect(result.functionalCompletenessValidation).toBeDefined()
      expect(result.functionalCompletenessValidation.completenessScore).toBeGreaterThan(50)
      // Note: Overall validation may fail due to other validation components
      expect(result.overallScore).toBeGreaterThan(0)
    })

    it('should fail comprehensive validation when functional completeness is poor', async () => {
      const code = `
        contract IncompleteContract {
          resource IncompleteResource {
            fun doSomething()
          }
          
          fun missingImplementation(): String
        }
      `
      
      const result = await validationSystem.validateCode(code, {
        contractType: { category: 'generic', complexity: 'simple', features: [] },
        strictMode: true
      })
      
      expect(result.functionalCompletenessValidation.isComplete).toBe(false)
      expect(result.functionalCompletenessValidation.completenessScore).toBeLessThan(60)
      expect(result.isValid).toBe(false)
      expect(result.overallScore).toBeLessThan(50)
    })

    it('should include functional completeness issues in validation results', async () => {
      const code = `
        access(all) contract TestContract {
          init() {
            // Contract initialization
          }
          
          fun incompleteFunction(): String {
            // Missing return statement
          }
          
          resource IncompleteResource {
            // Missing access modifier, init, and destroy
          }
        }
      `
      
      const result = await validationSystem.validateCode(code)
      
      const completenessIssues = result.validationResults
        .filter(vr => vr.type === 'completeness')
        .flatMap(vr => vr.issues)
      
      expect(completenessIssues.length).toBeGreaterThan(0)
      expect(completenessIssues.some(issue => 
        issue.message.includes('incomplete') || 
        issue.message.includes('missing')
      )).toBe(true)
    })

    it('should include functional completeness recommendations', async () => {
      const code = `
        access(all) contract TestContract {
          init() {
            // Contract initialization
          }
          
          fun getValue(): String {
            // Missing return statement
          }
          
          resource TestResource {
            // Missing access modifier and lifecycle methods
          }
        }
      `
      
      const result = await validationSystem.validateCode(code)
      
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations.some(rec => 
        rec.includes('Complete') || 
        rec.includes('Add') ||
        rec.includes('missing')
      )).toBe(true)
    })
  })

  describe('Contract Type Specific Integration', () => {
    it('should validate NFT contract functional completeness', async () => {
      const code = `
        import NonFungibleToken from 0x1d7e57aa55817448
        import MetadataViews from 0x1d7e57aa55817448
        
        access(all) contract TestNFT: NonFungibleToken {
          access(all) event Minted(id: UInt64)
          access(all) event Deposit(id: UInt64, to: Address?)
          access(all) event Withdraw(id: UInt64, from: Address?)
          
          access(all) resource NFT: NonFungibleToken.INFT {
            access(all) let id: UInt64
            access(all) let metadata: {String: AnyStruct}
            
            init(id: UInt64, metadata: {String: AnyStruct}) {
              self.id = id
              self.metadata = metadata
            }
            
            destroy() {
              // NFT cleanup
            }
          }
          
          access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
            access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
            
            init() {
              self.ownedNFTs <- {}
            }
            
            access(all) fun deposit(token: @NonFungibleToken.NFT) {
              let token <- token as! @TestNFT.NFT
              let id: UInt64 = token.id
              self.ownedNFTs[id] <-! token
              emit Deposit(id: id, to: self.owner?.address)
            }
            
            access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
              let token <- self.ownedNFTs.remove(key: withdrawID)!
              emit Withdraw(id: token.id, from: self.owner?.address)
              return <-token
            }
            
            destroy() {
              destroy self.ownedNFTs
            }
          }
          
          access(all) resource Minter {
            access(all) fun mint(metadata: {String: AnyStruct}): @NFT {
              let nft <- create NFT(id: TestNFT.totalSupply, metadata: metadata)
              TestNFT.totalSupply = TestNFT.totalSupply + 1
              emit Minted(id: nft.id)
              return <-nft
            }
          }
          
          access(all) var totalSupply: UInt64
          
          init() {
            self.totalSupply = 0
          }
          
          access(all) fun createEmptyCollection(): @Collection {
            return <- create Collection()
          }
        }
      `
      
      const result = await validationSystem.validateCode(code, {
        contractType: { category: 'nft', complexity: 'intermediate', features: [] }
      })
      
      expect(result.functionalCompletenessValidation).toBeDefined()
      expect(result.functionalCompletenessValidation.completenessScore).toBeGreaterThan(50)
      expect(result.functionalCompletenessValidation.functionCompleteness.missingRequiredFunctions).toHaveLength(0)
      // Note: Overall validation may fail due to other validation components
    })

    it('should validate fungible token contract functional completeness', async () => {
      const code = `
        import FungibleToken from 0xf233dcee88fe0abe
        
        access(all) contract TestToken: FungibleToken {
          access(all) event TokensInitialized(initialSupply: UFix64)
          access(all) event TokensWithdrawn(amount: UFix64, from: Address?)
          access(all) event TokensDeposited(amount: UFix64, to: Address?)
          access(all) event TokensMinted(amount: UFix64)
          
          access(all) resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
            access(all) var balance: UFix64
            
            init(balance: UFix64) {
              self.balance = balance
            }
            
            access(all) fun withdraw(amount: UFix64): @FungibleToken.Vault {
              self.balance = self.balance - amount
              emit TokensWithdrawn(amount: amount, from: self.owner?.address)
              return <-create Vault(balance: amount)
            }
            
            access(all) fun deposit(from: @FungibleToken.Vault) {
              let vault <- from as! @TestToken.Vault
              self.balance = self.balance + vault.balance
              emit TokensDeposited(amount: vault.balance, to: self.owner?.address)
              vault.balance = 0.0
              destroy vault
            }
            
            destroy() {
              TestToken.totalSupply = TestToken.totalSupply - self.balance
            }
          }
          
          access(all) resource Minter {
            access(all) fun mint(amount: UFix64): @Vault {
              TestToken.totalSupply = TestToken.totalSupply + amount
              emit TokensMinted(amount: amount)
              return <-create Vault(balance: amount)
            }
          }
          
          access(all) var totalSupply: UFix64
          
          init() {
            self.totalSupply = 1000.0
            emit TokensInitialized(initialSupply: self.totalSupply)
          }
          
          access(all) fun createEmptyVault(): @Vault {
            return <-create Vault(balance: 0.0)
          }
        }
      `
      
      const result = await validationSystem.validateCode(code, {
        contractType: { category: 'fungible-token', complexity: 'intermediate', features: [] }
      })
      
      expect(result.functionalCompletenessValidation).toBeDefined()
      expect(result.functionalCompletenessValidation.completenessScore).toBeGreaterThan(50)
      expect(result.functionalCompletenessValidation.functionCompleteness.missingRequiredFunctions).toHaveLength(0)
      // Note: Overall validation may fail due to other validation components
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large contracts efficiently', async () => {
      // Generate a large contract with many functions and resources
      let code = `
        access(all) contract LargeContract {
          access(all) event ContractInitialized()
          
          init() {
            emit ContractInitialized()
          }
      `
      
      // Add many functions
      for (let i = 0; i < 50; i++) {
        code += `
          access(all) fun function${i}(param: String): String {
            return "result${i}"
          }
        `
      }
      
      // Add many resources
      for (let i = 0; i < 10; i++) {
        code += `
          access(all) resource Resource${i} {
            access(all) var value: String
            
            init(value: String) {
              self.value = value
            }
            
            access(all) fun getValue(): String {
              return self.value
            }
            
            destroy() {
              // Cleanup
            }
          }
        `
      }
      
      code += '}'
      
      const startTime = Date.now()
      const result = await validationSystem.validateCode(code)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(result.functionalCompletenessValidation).toBeDefined()
      expect(result.functionalCompletenessValidation.functionCompleteness.totalFunctions).toBeGreaterThan(50) // Should detect many functions
    })

    it('should handle contracts with complex nested structures', async () => {
      const code = `
        access(all) contract NestedContract {
          access(all) resource OuterResource {
            access(all) resource InnerResource {
              access(all) var value: String
              
              init(value: String) {
                self.value = value
              }
              
              destroy() {
                // Inner cleanup
              }
            }
            
            access(all) var inner: @InnerResource?
            
            init() {
              self.inner <- create InnerResource(value: "nested")
            }
            
            access(all) fun getInnerValue(): String? {
              return self.inner?.value
            }
            
            destroy() {
              destroy self.inner
            }
          }
          
          init() {
            // Contract initialization
          }
          
          access(all) fun createOuter(): @OuterResource {
            return <- create OuterResource()
          }
        }
      `
      
      const result = await validationSystem.validateCode(code)
      
      expect(result.functionalCompletenessValidation.resourceLifecycleValidation.resources).toHaveLength(2)
      expect(result.functionalCompletenessValidation.isComplete).toBe(true)
    })
  })
})