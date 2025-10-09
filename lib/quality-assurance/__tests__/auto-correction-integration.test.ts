/**
 * Integration tests for AutoCorrectionEngine with the quality assurance system
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { AutoCorrectionEngine } from '../auto-correction-engine'
import { UndefinedValueDetector } from '../undefined-value-detector'

describe('AutoCorrectionEngine Integration', () => {
  let engine: AutoCorrectionEngine
  let detector: UndefinedValueDetector

  beforeEach(() => {
    engine = new AutoCorrectionEngine()
    detector = new UndefinedValueDetector()
  })

  test('should integrate with UndefinedValueDetector for comprehensive correction', async () => {
    const problematicCode = `
      access(all) contract TestContract {
        access(all) var name: String = undefined
        access(all) var count: Int = undefined
        access(all) var items: [String] = undefined
        
        access(all) fun getName(): String {
          // Missing return statement
        }
        
        access(all) fun getItems(): [String] {
          // Missing return statement
        }
      }
    `

    // First, detect issues
    const initialScan = detector.scanForUndefinedValues(problematicCode)
    expect(initialScan.totalIssues).toBeGreaterThan(0)
    expect(initialScan.hasBlockingIssues).toBe(true)

    // Then, apply corrections
    const correctionResult = await engine.correctCode(problematicCode)
    expect(correctionResult.success).toBe(true)
    expect(correctionResult.correctionsApplied.length).toBeGreaterThan(0)

    // Finally, verify corrections reduced issues
    const finalScan = detector.scanForUndefinedValues(correctionResult.correctedCode)
    expect(finalScan.totalIssues).toBeLessThan(initialScan.totalIssues)
    expect(finalScan.criticalIssues).toBeLessThan(initialScan.criticalIssues)

    // Verify specific corrections
    expect(correctionResult.correctedCode).toContain('name: String = ""')
    expect(correctionResult.correctedCode).toContain('count: Int = 0')
    expect(correctionResult.correctedCode).toContain('items: [String] = []')
  })

  test('should handle complex Cadence contract patterns', async () => {
    const complexContract = `
      access(all) contract NFTMarketplace {
        access(all) var totalSupply: UInt64 = undefined
        access(all) var marketplaceFee: UFix64 = undefined
        access(all) var listings: {UInt64: Listing} = undefined
        
        access(all) struct Listing {
          access(all) let id: UInt64
          access(all) let price: UFix64
          access(all) let seller: Address
          
          init(id: UInt64, price: UFix64, seller: Address) {
            self.id = id
            self.price = price
            self.seller = seller
          }
        }
        
        access(all) fun createListing(id: UInt64, price: UFix64): UInt64 {
          // Missing implementation
        }
        
        access(all) fun purchaseNFT(listingId: UInt64): @NonFungibleToken.NFT {
          // Missing implementation
        }
      }
    `

    const result = await engine.correctCode(complexContract)
    
    expect(result.success).toBe(true)
    expect(result.correctionsApplied.length).toBeGreaterThan(0)
    
    // Verify undefined values were corrected
    expect(result.correctedCode).toContain('totalSupply: UInt64 = 0')
    expect(result.correctedCode).toContain('marketplaceFee: UFix64 = 0.0')
    expect(result.correctedCode).toContain('listings: {UInt64: Listing} = {}')
    
    // Verify return statements were added
    expect(result.correctedCode).toContain('return 0')
  })

  test('should maintain code quality while making corrections', async () => {
    const codeWithMixedIssues = `
      access(all) contract TokenContract {
        access(all) var name: String = undefined
        access(all) var symbol: String = undefined
        access(all) var totalSupply: UInt64 = undefined
        
        init(name: String, symbol: String, totalSupply: UInt64) {
          self.name = name
          self.symbol = symbol
          self.totalSupply = totalSupply
        }
        
        access(all) fun getName(): String {
          return self.name
        }
        
        access(all) fun getSymbol(): String {
          return self.symbol
        }
        
        access(all) fun getTotalSupply(): UInt64 {
          return self.totalSupply
        }
      }
    `

    const result = await engine.correctCode(codeWithMixedIssues)
    
    expect(result.success).toBe(true)
    expect(result.confidence).toBeGreaterThan(70)
    
    // Verify that existing correct code wasn't broken
    expect(result.correctedCode).toContain('init(name: String, symbol: String, totalSupply: UInt64)')
    expect(result.correctedCode).toContain('return self.name')
    expect(result.correctedCode).toContain('return self.symbol')
    expect(result.correctedCode).toContain('return self.totalSupply')
    
    // Verify undefined values were fixed
    expect(result.correctedCode).not.toContain('= undefined')
  })

  test('should provide detailed correction history', async () => {
    const simpleCode = `
      access(all) contract SimpleContract {
        access(all) var value: String = undefined
        access(all) var count: Int = undefined
      }
    `

    const result = await engine.correctCode(simpleCode)
    
    expect(result.correctionsApplied.length).toBe(2)
    
    // Verify correction details
    const corrections = result.correctionsApplied
    expect(corrections.some(c => c.type === 'undefined-fix')).toBe(true)
    expect(corrections.some(c => c.originalValue === 'undefined')).toBe(true)
    expect(corrections.some(c => c.correctedValue === '""')).toBe(true)
    expect(corrections.some(c => c.correctedValue === '0')).toBe(true)
    
    // Verify all corrections have proper metadata
    corrections.forEach(correction => {
      expect(correction.location).toBeDefined()
      expect(correction.location.line).toBeGreaterThan(0)
      expect(correction.reasoning).toBeDefined()
      expect(correction.confidence).toBeGreaterThan(0)
    })
  })

  test('should handle edge cases gracefully', async () => {
    const edgeCases = [
      '', // Empty code
      '// Just a comment', // Comment only
      'access(all) contract ValidContract { }', // Already valid
      'invalid syntax here', // Invalid syntax
    ]

    for (const code of edgeCases) {
      const result = await engine.correctCode(code)
      
      // Should not crash and should provide a result
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.correctedCode).toBeDefined()
      expect(result.correctionsApplied).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
    }
  })
})