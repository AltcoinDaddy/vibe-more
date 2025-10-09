/**
 * Integration tests for Comprehensive Validation System
 * 
 * Tests the integration between migration validators and quality assurance components
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { ComprehensiveValidationSystem } from '../comprehensive-validation-system'
import { CodeValidator } from '../../migration/code-validator'

describe('ComprehensiveValidationSystem Integration', () => {
  let validationSystem: ComprehensiveValidationSystem
  let codeValidator: CodeValidator

  beforeEach(() => {
    validationSystem = new ComprehensiveValidationSystem()
    codeValidator = new CodeValidator()
  })

  describe('Function Signature Validation', () => {
    test('validates complete function signatures', async () => {
      const code = `
access(all) contract TestContract {
    access(all) fun completeFunction(param: String): String {
        return param
    }

    access(all) fun incompleteFunction() {
        // Missing return type and implementation
    }

    fun missingAccessModifier(): Int {
        return 42
    }

    init() {
        // Contract initialization
    }
}`

      const result = await validationSystem.validateCode(code)
      
      expect(result.isValid).toBe(false) // Due to incomplete function
      expect(result.syntaxValidation.functionIssues).toHaveLength(2) // incomplete function + missing access modifier
      
      // Check function signature validations
      const functionValidations = validationSystem.validateFunctionSignatures(code)
      expect(functionValidations).toHaveLength(4) // 3 functions + init
      
      const completeFunction = functionValidations.find(f => f.functionName === 'completeFunction')
      expect(completeFunction?.isComplete).toBe(true)
      expect(completeFunction?.hasReturnType).toBe(true)
      expect(completeFunction?.hasBody).toBe(true)
      expect(completeFunction?.completenessScore).toBeGreaterThan(90)
      
      const incompleteFunction = functionValidations.find(f => f.functionName === 'incompleteFunction')
      expect(incompleteFunction?.isComplete).toBe(false)
      expect(incompleteFunction?.issues).toHaveLength(1) // Empty body
      
      const missingAccessFunction = functionValidations.find(f => f.functionName === 'missingAccessModifier')
      expect(missingAccessFunction?.accessModifier).toBeNull()
      expect(missingAccessFunction?.issues.some(i => i.type === 'missing-access-modifier')).toBe(true)
    })

    test('validates function return type consistency', async () => {
      const code = `
access(all) contract TestContract {
    access(all) fun hasReturnTypeButNoReturn(): String {
        // Missing return statement
    }

    access(all) fun hasReturnStatement(): Int {
        return 42
    }

    access(all) fun voidFunction() {
        // No return needed
    }

    init() {}
}`

      const result = await validationSystem.validateCode(code)
      const functionValidations = validationSystem.validateFunctionSignatures(code)
      
      const missingReturnFunction = functionValidations.find(f => f.functionName === 'hasReturnTypeButNoReturn')
      expect(missingReturnFunction?.issues.some(i => i.type === 'missing-return-statement')).toBe(true)
      
      const correctFunction = functionValidations.find(f => f.functionName === 'hasReturnStatement')
      expect(correctFunction?.isComplete).toBe(true)
      
      const voidFunction = functionValidations.find(f => f.functionName === 'voidFunction')
      expect(voidFunction?.isComplete).toBe(true) // No return needed for void functions
    })
  })

  describe('Contract Structure Validation', () => {
    test('validates proper contract structure', async () => {
      const completeContract = `
import NonFungibleToken from 0x1d7e57aa55817448

access(all) contract TestNFT {
    access(all) resource NFT {
        access(all) let id: UInt64
        
        init(id: UInt64) {
            self.id = id
        }
        
        destroy() {
            // Cleanup
        }
    }

    access(all) fun createNFT(id: UInt64): @NFT {
        return <- create NFT(id: id)
    }

    init() {
        // Contract initialization
    }
}`

      const result = await validationSystem.validateCode(completeContract, { 
        contractType: { category: 'nft', complexity: 'simple', features: [] }
      })
      
      expect(result.isValid).toBe(true)
      
      const structureValidation = validationSystem.validateContractStructure(completeContract, 'nft')
      expect(structureValidation.hasContractDeclaration).toBe(true)
      expect(structureValidation.hasInitFunction).toBe(true)
      expect(structureValidation.hasProperAccessModifiers).toBe(true)
      expect(structureValidation.requiredImportsPresent).toContain('NonFungibleToken')
      expect(structureValidation.structureScore).toBeGreaterThan(80)
    })

    test('detects missing contract elements', async () => {
      const incompleteContract = `
// Missing contract declaration and imports
fun someFunction() {
    // Missing access modifier
}
`

      const result = await validationSystem.validateCode(incompleteContract)
      
      expect(result.isValid).toBe(false)
      
      const structureValidation = validationSystem.validateContractStructure(incompleteContract, 'nft')
      expect(structureValidation.hasContractDeclaration).toBe(false)
      expect(structureValidation.hasInitFunction).toBe(false)
      expect(structureValidation.hasProperAccessModifiers).toBe(false)
      expect(structureValidation.missingImports).toContain('NonFungibleToken')
      expect(structureValidation.structureScore).toBeLessThan(50)
    })
  })

  describe('Event Definition Validation', () => {
    test('validates proper event definitions', async () => {
      const code = `
access(all) contract TestContract {
    access(all) event ProperEvent(id: UInt64, name: String)
    access(all) event EmptyEvent()
    event MissingAccessModifier(value: Int)
    access(all) event MalformedParameters(badParam)

    access(all) fun emitEvents() {
        emit ProperEvent(id: 1, name: "test")
        emit EmptyEvent()
        // MissingAccessModifier and MalformedParameters are never emitted
    }

    init() {}
}`

      const result = await validationSystem.validateCode(code)
      const eventValidations = validationSystem.validateEventDefinitions(code)
      
      expect(eventValidations).toHaveLength(4)
      
      const properEvent = eventValidations.find(e => e.eventName === 'ProperEvent')
      expect(properEvent?.hasAccessModifier).toBe(true)
      expect(properEvent?.hasParameters).toBe(true)
      expect(properEvent?.parametersValid).toBe(true)
      expect(properEvent?.isEmitted).toBe(true)
      expect(properEvent?.completenessScore).toBe(100)
      
      const missingAccessEvent = eventValidations.find(e => e.eventName === 'MissingAccessModifier')
      expect(missingAccessEvent?.hasAccessModifier).toBe(false)
      expect(missingAccessEvent?.issues.some(i => i.type === 'missing-event-access-modifier')).toBe(true)
      
      const malformedEvent = eventValidations.find(e => e.eventName === 'MalformedParameters')
      expect(malformedEvent?.parametersValid).toBe(false)
      expect(malformedEvent?.issues.some(i => i.type === 'invalid-event-parameter')).toBe(true)
    })
  })

  describe('Integration with Migration Validator', () => {
    test('integrates with existing CodeValidator for syntax validation', async () => {
      const legacyCode = `
pub contract LegacyContract {
    pub var value: String
    
    pub fun getValue(): String {
        return self.value
    }
    
    init() {
        self.value = "test"
    }
}`

      // Test with migration validator directly
      const migrationResult = codeValidator.validateCode(legacyCode)
      expect(migrationResult.isValid).toBe(false) // Should detect legacy syntax
      expect(migrationResult.errors.some(e => e.includes('pub'))).toBe(true)
      
      // Test with comprehensive validation system
      const comprehensiveResult = await validationSystem.validateCode(legacyCode)
      expect(comprehensiveResult.isValid).toBe(false)
      expect(comprehensiveResult.syntaxValidation.isValid).toBe(false)
      
      // Should detect both legacy syntax and provide comprehensive analysis
      expect(comprehensiveResult.recommendations).toContain('Fix syntax errors to ensure code compiles correctly')
    })

    test('handles modern Cadence syntax correctly', async () => {
      const modernCode = `
access(all) contract ModernContract {
    access(all) var value: String
    
    access(all) fun getValue(): String {
        return self.value
    }
    
    access(all) fun setValue(newValue: String) {
        self.value = newValue
    }
    
    init() {
        self.value = "initialized"
    }
}`

      // Test with migration validator
      const migrationResult = codeValidator.validateCode(modernCode)
      expect(migrationResult.isValid).toBe(true)
      
      // Test with comprehensive validation system
      const comprehensiveResult = await validationSystem.validateCode(modernCode)
      expect(comprehensiveResult.isValid).toBe(true)
      expect(comprehensiveResult.overallScore).toBeGreaterThan(80)
      expect(comprehensiveResult.completenessPercentage).toBeGreaterThan(90)
    })
  })

  describe('Quality Assurance Integration', () => {
    test('integrates with undefined value detection', async () => {
      const codeWithUndefined = `
access(all) contract TestContract {
    access(all) var value: String = undefined
    access(all) var count: Int
    
    access(all) fun getValue(): String {
        return undefined
    }
    
    init() {
        self.count = undefined
    }
}`

      const result = await validationSystem.validateCode(codeWithUndefined)
      
      expect(result.isValid).toBe(false)
      expect(result.undefinedValueScan.hasBlockingIssues).toBe(true)
      expect(result.undefinedValueScan.totalIssues).toBeGreaterThan(0)
      expect(result.recommendations).toContain('Remove undefined values and replace with appropriate defaults')
    })

    test('integrates with comprehensive error detection', async () => {
      const incompleteCode = `
access(all) contract IncompleteContract {
    // Missing init function
    
    access(all) fun incompleteFunction() {
        // TODO: Implement this function
    }
    
    access(all) resource IncompleteResource {
        // Missing destroy method
    }
}`

      const result = await validationSystem.validateCode(incompleteCode)
      
      expect(result.isValid).toBe(false)
      expect(result.errorDetection.totalErrors).toBeGreaterThan(0)
      expect(result.errorDetection.criticalErrors).toBeGreaterThan(0)
      expect(result.completenessPercentage).toBeLessThan(70)
      
      // Should have actionable recommendations
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.errorDetection.actionableRecommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Contract Type Specific Validation', () => {
    test('validates NFT contract requirements', async () => {
      const nftContract = `
import NonFungibleToken from 0x1d7e57aa55817448
import MetadataViews from 0x1d7e57aa55817448

access(all) contract TestNFT {
    access(all) event Minted(id: UInt64)
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)

    access(all) resource NFT {
        access(all) let id: UInt64
        
        init(id: UInt64) {
            self.id = id
        }
        
        destroy() {}
    }

    access(all) resource Collection {
        access(all) var ownedNFTs: @{UInt64: NFT}
        
        init() {
            self.ownedNFTs <- {}
        }
        
        destroy() {
            destroy self.ownedNFTs
        }
    }

    access(all) fun createNFT(id: UInt64): @NFT {
        emit Minted(id: id)
        return <- create NFT(id: id)
    }

    access(all) fun mintNFT(id: UInt64): @NFT {
        return <- self.createNFT(id: id)
    }

    access(all) fun getMetadata(id: UInt64): {String: AnyStruct} {
        return {}
    }

    init() {}
}`

      const result = await validationSystem.validateCode(nftContract, {
        contractType: { category: 'nft', complexity: 'intermediate', features: ['minting', 'metadata'] }
      })
      
      expect(result.contractType).toBe('nft')
      expect(result.isValid).toBe(true)
      expect(result.overallScore).toBeGreaterThan(85)
      
      const structureValidation = validationSystem.validateContractStructure(nftContract, 'nft')
      expect(structureValidation.requiredImportsPresent).toContain('NonFungibleToken')
      expect(structureValidation.requiredImportsPresent).toContain('MetadataViews')
    })

    test('validates fungible token contract requirements', async () => {
      const tokenContract = `
import FungibleToken from 0x9a0766d93b6608b7

access(all) contract TestToken {
    access(all) event TokensMinted(amount: UFix64)
    access(all) event TokensWithdrawn(amount: UFix64)
    access(all) event TokensDeposited(amount: UFix64)

    access(all) resource Vault {
        access(all) var balance: UFix64
        
        init(balance: UFix64) {
            self.balance = balance
        }
        
        destroy() {}
    }

    access(all) resource Minter {
        access(all) fun mintTokens(amount: UFix64): @Vault {
            emit TokensMinted(amount: amount)
            return <- create Vault(balance: amount)
        }
    }

    access(all) fun createVault(balance: UFix64): @Vault {
        return <- create Vault(balance: balance)
    }

    access(all) fun mintTokens(amount: UFix64): @Vault {
        return <- create Vault(balance: amount)
    }

    access(all) fun getBalance(vault: &Vault): UFix64 {
        return vault.balance
    }

    init() {}
}`

      const result = await validationSystem.validateCode(tokenContract, {
        contractType: { category: 'fungible-token', complexity: 'intermediate', features: ['minting'] }
      })
      
      expect(result.contractType).toBe('fungible-token')
      expect(result.isValid).toBe(true)
      expect(result.overallScore).toBeGreaterThan(80)
      
      const structureValidation = validationSystem.validateContractStructure(tokenContract, 'fungible-token')
      expect(structureValidation.requiredImportsPresent).toContain('FungibleToken')
    })
  })

  describe('Performance and Error Handling', () => {
    test('handles validation errors gracefully', async () => {
      const malformedCode = `
This is not valid Cadence code at all!
Random text and symbols @#$%^&*()
`

      const result = await validationSystem.validateCode(malformedCode)
      
      expect(result.isValid).toBe(false)
      expect(result.overallScore).toBe(0)
      expect(result.recommendations).toContain('Fix syntax errors to ensure code compiles correctly')
    })

    test('completes validation within reasonable time', async () => {
      const largeCode = `
access(all) contract LargeContract {
    ${Array.from({ length: 50 }, (_, i) => `
    access(all) fun function${i}(param${i}: String): String {
        return param${i}
    }
    
    access(all) event Event${i}(value${i}: String)
    `).join('\n')}
    
    init() {}
}`

      const startTime = Date.now()
      const result = await validationSystem.validateCode(largeCode)
      const duration = Date.now() - startTime
      
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(result.isValid).toBe(true)
      expect(result.overallScore).toBeGreaterThan(70)
    })
  })

  describe('Validation Context Options', () => {
    test('respects strict mode validation', async () => {
      const codeWithWarnings = `
access(all) contract TestContract {
    access(all) fun functionWithWarning(): String {
        return "test"
    }
    
    access(all) event UnusedEvent(value: String)
    
    init() {}
}`

      const normalResult = await validationSystem.validateCode(codeWithWarnings, { strictMode: false })
      const strictResult = await validationSystem.validateCode(codeWithWarnings, { strictMode: true })
      
      // Normal mode might pass with warnings
      expect(normalResult.isValid).toBe(true)
      
      // Strict mode should be more stringent
      expect(strictResult.overallScore).toBeLessThanOrEqual(normalResult.overallScore)
    })

    test('handles custom validation rules', async () => {
      const code = `
access(all) contract TestContract {
    access(all) fun customFunction(): String {
        return "test"
    }
    
    init() {}
}`

      const customRules = [{
        name: 'custom-naming',
        description: 'Functions should not contain "custom"',
        pattern: /fun\s+\w*custom\w*/g,
        severity: 'warning' as const,
        category: 'best-practice' as const,
        autoFixable: false
      }]

      const result = await validationSystem.validateCode(code, { customRules })
      
      // Should still be valid but with custom rule warnings
      expect(result.isValid).toBe(true)
      // Custom rules would be processed by the underlying validators
    })
  })
})