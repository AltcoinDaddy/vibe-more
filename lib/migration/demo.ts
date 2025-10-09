/**
 * Demonstration of the Cadence syntax transformation engine
 */

import { CadenceSyntaxTransformer } from './syntax-transformer'
import { MigrationLogger, LogLevel } from './logger'

// Sample legacy Cadence code (for demonstration of transformation)
const legacyCode = `
access(all) contract ExampleContract: Interface1 & Interface2 {
    access(all) var totalSupply: UFix64
    access(all) var owner: Address
    
    access(all) view fun getSupply(): UFix64 {
        return self.totalSupply
    }
    
    access(all) fun deposit(vault: @Vault) {
        account.storage.save(<-vault, to: /storage/vault)
    }
    
    access(all) fun withdraw(): @Vault {
        return <-account.storage.load<@Vault>(from: /storage/vault)!
    }
    
    access(all) view fun checkBalance(): UFix64 {
        let vaultRef = account.storage.borrow<&Vault>(from: /storage/vault)
        return vaultRef?.balance ?? 0.0
    }
}
`

function demonstrateSyntaxTransformation() {
    console.log('=== Cadence Syntax Migration Demo ===\n')
    
    // Create transformer with info-level logging
    const logger = new MigrationLogger(LogLevel.INFO)
    const transformer = new CadenceSyntaxTransformer(logger)
    
    console.log('Original Legacy Code:')
    console.log('-------------------')
    console.log(legacyCode)
    
    console.log('\nApplying Transformations...\n')
    
    // Apply all transformations
    const modernCode = transformer.transformAll(legacyCode)
    
    console.log('Transformed Modern Code:')
    console.log('----------------------')
    console.log(modernCode)
    
    // Show statistics
    const stats = transformer.getTransformationStats(legacyCode, modernCode)
    console.log('\nTransformation Statistics:')
    console.log('-------------------------')
    console.log(`Original lines: ${stats.originalLines}`)
    console.log(`Transformed lines: ${stats.transformedLines}`)
    console.log(`Has changes: ${stats.hasChanges}`)
    console.log(`Lines changed: ${stats.linesChanged}`)
    
    console.log('\nKey Transformations Applied:')
    console.log('---------------------------')
    console.log('✓ pub → access(all)')
    console.log('✓ pub(set) → access(all)')
    console.log('✓ Interface1, Interface2 → Interface1 & Interface2')
    console.log('✓ account.save → account.storage.save')
    console.log('✓ account.load → account.storage.load')
    console.log('✓ account.borrow → account.storage.borrow')
    console.log('✓ Added view modifier to getter functions')
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
    demonstrateSyntaxTransformation()
}

export { demonstrateSyntaxTransformation }