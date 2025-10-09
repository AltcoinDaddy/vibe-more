/**
 * Integration Example: Comprehensive Validation System
 * 
 * Demonstrates how the comprehensive validation system integrates
 * migration validators with quality assurance components.
 */

import { ComprehensiveValidationSystem } from './comprehensive-validation-system'
import { CodeValidator } from '../migration/code-validator'

/**
 * Example demonstrating comprehensive validation integration
 */
export async function demonstrateValidationIntegration() {
  const validationSystem = new ComprehensiveValidationSystem()
  const migrationValidator = new CodeValidator()

  // Example 1: Modern Cadence contract with quality issues
  const modernContractWithIssues = `
access(all) contract ExampleContract {
    access(all) var value: String = undefined  // Quality issue: undefined value
    access(all) var count: Int
    
    // Missing access modifier (detected by migration validator)
    fun incompleteFunction() {
        // TODO: Implement this function (completeness issue)
    }
    
    access(all) fun completeFunction(param: String): String {
        return param
    }
    
    access(all) event ExampleEvent(id: UInt64, name: String)
    access(all) event UnusedEvent(value: Int)  // Never emitted
    
    // Missing init function (structural issue)
}`

  console.log('=== Comprehensive Validation Integration Demo ===\n')

  // Step 1: Migration validator check
  console.log('1. Migration Validator Results:')
  const migrationResult = migrationValidator.validateCode(modernContractWithIssues)
  console.log(`   - Valid: ${migrationResult.isValid}`)
  console.log(`   - Errors: ${migrationResult.errors.length}`)
  console.log(`   - Warnings: ${migrationResult.warnings.length}`)
  
  if (migrationResult.errors.length > 0) {
    console.log('   - Sample error:', migrationResult.errors[0])
  }

  // Step 2: Comprehensive validation
  console.log('\n2. Comprehensive Validation Results:')
  const comprehensiveResult = await validationSystem.validateCode(modernContractWithIssues, {
    strictMode: true,
    enableAutoFix: true
  })

  console.log(`   - Overall Valid: ${comprehensiveResult.isValid}`)
  console.log(`   - Overall Score: ${comprehensiveResult.overallScore}/100`)
  console.log(`   - Completeness: ${comprehensiveResult.completenessPercentage}%`)
  console.log(`   - Contract Type: ${comprehensiveResult.contractType}`)

  // Step 3: Detailed validation breakdown
  console.log('\n3. Validation Breakdown:')
  console.log(`   - Syntax Valid: ${comprehensiveResult.syntaxValidation.isValid}`)
  console.log(`   - Syntax Errors: ${comprehensiveResult.syntaxValidation.errors.length}`)
  console.log(`   - Function Issues: ${comprehensiveResult.syntaxValidation.functionIssues.length}`)
  console.log(`   - Structure Issues: ${comprehensiveResult.syntaxValidation.structureIssues.length}`)
  console.log(`   - Event Issues: ${comprehensiveResult.syntaxValidation.eventIssues.length}`)

  // Step 4: Quality assurance integration
  console.log('\n4. Quality Assurance Integration:')
  console.log(`   - Undefined Value Issues: ${comprehensiveResult.undefinedValueScan.totalIssues}`)
  console.log(`   - Has Blocking Issues: ${comprehensiveResult.undefinedValueScan.hasBlockingIssues}`)
  console.log(`   - Critical Errors: ${comprehensiveResult.errorDetection.criticalErrors}`)
  console.log(`   - Total Errors: ${comprehensiveResult.errorDetection.totalErrors}`)

  // Step 5: Function signature analysis
  console.log('\n5. Function Signature Analysis:')
  const functionValidations = validationSystem.validateFunctionSignatures(modernContractWithIssues)
  functionValidations.forEach(func => {
    console.log(`   - ${func.functionName}: Complete=${func.isComplete}, Score=${func.completenessScore}%`)
    if (func.issues.length > 0) {
      console.log(`     Issues: ${func.issues.map(i => i.type).join(', ')}`)
    }
  })

  // Step 6: Contract structure analysis
  console.log('\n6. Contract Structure Analysis:')
  const structureValidation = validationSystem.validateContractStructure(modernContractWithIssues, 'generic')
  console.log(`   - Has Contract Declaration: ${structureValidation.hasContractDeclaration}`)
  console.log(`   - Has Init Function: ${structureValidation.hasInitFunction}`)
  console.log(`   - Proper Access Modifiers: ${structureValidation.hasProperAccessModifiers}`)
  console.log(`   - Structure Score: ${structureValidation.structureScore}%`)
  console.log(`   - Missing Imports: ${structureValidation.missingImports.join(', ') || 'None'}`)

  // Step 7: Event definition analysis
  console.log('\n7. Event Definition Analysis:')
  const eventValidations = validationSystem.validateEventDefinitions(modernContractWithIssues)
  eventValidations.forEach(event => {
    console.log(`   - ${event.eventName}: Valid=${event.parametersValid}, Emitted=${event.isEmitted}`)
  })

  // Step 8: Recommendations
  console.log('\n8. Actionable Recommendations:')
  comprehensiveResult.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`)
  })

  // Example 2: Perfect modern contract
  console.log('\n\n=== Perfect Contract Example ===\n')
  
  const perfectContract = `
access(all) contract PerfectContract {
    access(all) var value: String
    access(all) var count: Int
    
    access(all) event ValueChanged(oldValue: String, newValue: String)
    access(all) event CountIncremented(newCount: Int)
    
    access(all) fun setValue(newValue: String) {
        let oldValue = self.value
        self.value = newValue
        emit ValueChanged(oldValue: oldValue, newValue: newValue)
    }
    
    access(all) fun getValue(): String {
        return self.value
    }
    
    access(all) fun incrementCount() {
        self.count = self.count + 1
        emit CountIncremented(newCount: self.count)
    }
    
    access(all) fun getCount(): Int {
        return self.count
    }
    
    init() {
        self.value = "initialized"
        self.count = 0
    }
}`

  const perfectResult = await validationSystem.validateCode(perfectContract)
  console.log(`Perfect Contract Results:`)
  console.log(`   - Valid: ${perfectResult.isValid}`)
  console.log(`   - Overall Score: ${perfectResult.overallScore}/100`)
  console.log(`   - Completeness: ${perfectResult.completenessPercentage}%`)
  console.log(`   - Quality Score: Syntax=${perfectResult.qualityScore.syntax}, Logic=${perfectResult.qualityScore.logic}, Completeness=${perfectResult.qualityScore.completeness}`)

  return {
    problematicContract: {
      migrationResult,
      comprehensiveResult
    },
    perfectContract: {
      result: perfectResult
    }
  }
}

/**
 * Example of using validation system for different contract types
 */
export async function demonstrateContractTypeValidation() {
  const validationSystem = new ComprehensiveValidationSystem()

  console.log('\n=== Contract Type Specific Validation ===\n')

  // NFT Contract Example
  const nftContract = `
import NonFungibleToken from 0x1d7e57aa55817448
import MetadataViews from 0x1d7e57aa55817448

access(all) contract ExampleNFT {
    access(all) event Minted(id: UInt64, to: Address?)
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)

    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) let metadata: {String: AnyStruct}
        
        init(id: UInt64, metadata: {String: AnyStruct}) {
            self.id = id
            self.metadata = metadata
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

    access(all) fun createNFT(id: UInt64, metadata: {String: AnyStruct}): @NFT {
        emit Minted(id: id, to: nil)
        return <- create NFT(id: id, metadata: metadata)
    }

    access(all) fun mintNFT(id: UInt64): @NFT {
        let metadata: {String: AnyStruct} = {}
        return <- self.createNFT(id: id, metadata: metadata)
    }

    access(all) fun getMetadata(id: UInt64): {String: AnyStruct} {
        return {}
    }

    init() {}
}`

  const nftResult = await validationSystem.validateCode(nftContract, {
    contractType: { category: 'nft', complexity: 'intermediate', features: ['minting', 'metadata'] }
  })

  console.log('NFT Contract Validation:')
  console.log(`   - Contract Type Detected: ${nftResult.contractType}`)
  console.log(`   - Valid: ${nftResult.isValid}`)
  console.log(`   - Overall Score: ${nftResult.overallScore}/100`)
  console.log(`   - Required Functions Present: ${nftResult.errorDetection.actionableRecommendations.length === 0 ? 'Yes' : 'Some Missing'}`)

  // Fungible Token Contract Example
  const tokenContract = `
import FungibleToken from 0x9a0766d93b6608b7

access(all) contract ExampleToken {
    access(all) event TokensMinted(amount: UFix64, to: Address?)
    access(all) event TokensWithdrawn(amount: UFix64, from: Address?)
    access(all) event TokensDeposited(amount: UFix64, to: Address?)

    access(all) resource Vault {
        access(all) var balance: UFix64
        
        init(balance: UFix64) {
            self.balance = balance
        }
        
        destroy() {}
    }

    access(all) fun createVault(balance: UFix64): @Vault {
        return <- create Vault(balance: balance)
    }

    access(all) fun mintTokens(amount: UFix64): @Vault {
        emit TokensMinted(amount: amount, to: nil)
        return <- create Vault(balance: amount)
    }

    access(all) fun getBalance(vault: &Vault): UFix64 {
        return vault.balance
    }

    init() {}
}`

  const tokenResult = await validationSystem.validateCode(tokenContract, {
    contractType: { category: 'fungible-token', complexity: 'simple', features: ['minting'] }
  })

  console.log('\nFungible Token Contract Validation:')
  console.log(`   - Contract Type Detected: ${tokenResult.contractType}`)
  console.log(`   - Valid: ${tokenResult.isValid}`)
  console.log(`   - Overall Score: ${tokenResult.overallScore}/100`)
  console.log(`   - Structure Score: ${tokenResult.completenessPercentage}%`)

  return {
    nftContract: nftResult,
    tokenContract: tokenResult
  }
}

// Export for use in other modules
export { ComprehensiveValidationSystem } from './comprehensive-validation-system'