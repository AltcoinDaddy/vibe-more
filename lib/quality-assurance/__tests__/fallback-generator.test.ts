/**
 * Comprehensive tests for the Fallback Generator system
 * Ensures all fallback contracts are syntactically correct and functional
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { FallbackGenerator } from '../fallback-generator'
import { ContractType } from '../types'

describe('FallbackGenerator', () => {
  let fallbackGenerator: FallbackGenerator

  beforeEach(() => {
    fallbackGenerator = new FallbackGenerator()
  })

  describe('Contract Type Detection', () => {
    test('detects NFT contracts from prompts', () => {
      const prompts = [
        'Create an NFT collection for digital art',
        'I want to mint unique collectibles',
        'Build a non-fungible token contract',
        'Create a collection of digital assets'
      ]

      prompts.forEach(prompt => {
        const result = fallbackGenerator.detectContractType(prompt)
        expect(result.contractType.category).toBe('nft')
        expect(result.confidence).toBeGreaterThan(0.3)
        expect(result.keywords.length).toBeGreaterThan(0)
      })
    })

    test('detects fungible token contracts from prompts', () => {
      const prompts = [
        'Create a fungible token contract',
        'I need a token with transfer capabilities',
        'Build a coin contract with minting',
        'Create a currency for my platform'
      ]

      prompts.forEach(prompt => {
        const result = fallbackGenerator.detectContractType(prompt)
        expect(result.contractType.category).toBe('fungible-token')
        expect(result.confidence).toBeGreaterThan(0.3)
      })
    })

    test('detects marketplace contracts from prompts', () => {
      const prompts = [
        'Create a marketplace for trading NFTs',
        'Build a platform where users can buy and sell',
        'I want an auction system',
        'Create a trading platform with listings'
      ]

      prompts.forEach(prompt => {
        const result = fallbackGenerator.detectContractType(prompt)
        expect(result.contractType.category).toBe('marketplace')
        expect(result.confidence).toBeGreaterThan(0.3)
      })
    })

    test('detects DAO contracts from prompts', () => {
      const prompts = [
        'Create a DAO voting system',
        'Build governance for my community',
        'I need proposal and voting functionality',
        'Create a decentralized decision system'
      ]

      prompts.forEach(prompt => {
        const result = fallbackGenerator.detectContractType(prompt)
        expect(result.contractType.category).toBe('dao')
        expect(result.confidence).toBeGreaterThan(0.3)
      })
    })

    test('detects DeFi contracts from prompts', () => {
      const prompts = [
        'Create a staking contract with rewards',
        'Build a yield farming platform',
        'I want liquidity pool functionality',
        'Create a lending protocol'
      ]

      prompts.forEach(prompt => {
        const result = fallbackGenerator.detectContractType(prompt)
        expect(result.contractType.category).toBe('defi')
        expect(result.confidence).toBeGreaterThan(0.3)
      })
    })

    test('detects utility contracts from prompts', () => {
      const prompts = [
        'Create a multi-signature wallet',
        'Build a utility contract for helpers',
        'I need an escrow system',
        'Create a proxy contract'
      ]

      prompts.forEach(prompt => {
        const result = fallbackGenerator.detectContractType(prompt)
        expect(result.contractType.category).toBe('utility')
        expect(result.confidence).toBeGreaterThan(0.3)
      })
    })

    test('determines contract complexity correctly', () => {
      const simplePrompt = 'Create a basic NFT contract'
      const complexPrompt = 'Create an advanced multi-signature wallet with timelock functionality, role-based access control, and comprehensive audit logging for enterprise use'

      const simpleResult = fallbackGenerator.detectContractType(simplePrompt)
      const complexResult = fallbackGenerator.detectContractType(complexPrompt)

      expect(simpleResult.contractType.complexity).toBe('simple')
      // The complex prompt should be at least intermediate or advanced
      expect(['intermediate', 'advanced']).toContain(complexResult.contractType.complexity)
    })

    test('extracts features from prompts', () => {
      const prompt = 'Create an NFT contract with royalties and batch minting'
      const result = fallbackGenerator.detectContractType(prompt)

      expect(result.contractType.features).toContain('royalty')
      expect(result.contractType.features.length).toBeGreaterThan(0)
    })
  })

  describe('Fallback Generation', () => {
    test('generates working NFT fallback contract', async () => {
      const prompt = 'Create an NFT collection'
      const result = await fallbackGenerator.generateFallbackContract(prompt)

      expect(result.success).toBe(true)
      expect(result.contractType.category).toBe('nft')
      expect(result.code).toContain('contract')
      expect(result.code).toContain('NonFungibleToken')
      expect(result.code).toContain('init()')
      expect(result.code).not.toContain('undefined')
      
      // Validate syntax
      const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
      expect(isValid).toBe(true)
    })

    test('generates working fungible token fallback contract', async () => {
      const prompt = 'Create a fungible token'
      const result = await fallbackGenerator.generateFallbackContract(prompt)

      expect(result.success).toBe(true)
      expect(result.contractType.category).toBe('fungible-token')
      expect(result.code).toContain('contract')
      expect(result.code).toContain('Vault')
      expect(result.code).toContain('init()')
      expect(result.code).not.toContain('undefined')
      
      const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
      expect(isValid).toBe(true)
    })

    test('generates working marketplace fallback contract', async () => {
      const prompt = 'Create a marketplace for trading'
      const result = await fallbackGenerator.generateFallbackContract(prompt)

      expect(result.success).toBe(true)
      expect(result.contractType.category).toBe('marketplace')
      expect(result.code).toContain('contract')
      expect(result.code).toContain('init()')
      expect(result.code).not.toContain('undefined')
      
      const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
      expect(isValid).toBe(true)
    })

    test('generates working DAO fallback contract', async () => {
      const prompt = 'Create a DAO voting system'
      const result = await fallbackGenerator.generateFallbackContract(prompt)

      expect(result.success).toBe(true)
      expect(result.contractType.category).toBe('dao')
      expect(result.code).toContain('contract')
      expect(result.code).toContain('init()')
      expect(result.code).not.toContain('undefined')
      
      const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
      expect(isValid).toBe(true)
    })

    test('generates working DeFi fallback contract', async () => {
      const prompt = 'Create a staking contract'
      const result = await fallbackGenerator.generateFallbackContract(prompt)

      expect(result.success).toBe(true)
      expect(result.contractType.category).toBe('defi')
      expect(result.code).toContain('contract')
      expect(result.code).toContain('init()')
      expect(result.code).not.toContain('undefined')
      
      const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
      expect(isValid).toBe(true)
    })

    test('generates working utility fallback contract', async () => {
      const prompt = 'Create a multi-sig wallet'
      const result = await fallbackGenerator.generateFallbackContract(prompt)

      expect(result.success).toBe(true)
      expect(result.contractType.category).toBe('utility')
      expect(result.code).toContain('contract')
      expect(result.code).toMatch(/init\s*\([^)]*\)/) // Match init with any parameters
      expect(result.code).not.toContain('undefined')
      
      const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
      expect(isValid).toBe(true)
    })

    test('customizes contract names from prompts', async () => {
      const prompt = 'Create a MyAwesome NFT collection'
      const result = await fallbackGenerator.generateFallbackContract(prompt)

      expect(result.code).toContain('contract MyAwesome')
    })

    test('adds fallback explanation comments', async () => {
      const prompt = 'Create an NFT contract'
      const result = await fallbackGenerator.generateFallbackContract(prompt)

      expect(result.code).toContain('// This contract was generated using a fallback template')
      expect(result.code).toContain('// Template ID:')
      expect(result.code).toContain('// Generated due to AI generation issues')
    })

    test('handles unknown contract types gracefully', async () => {
      const prompt = 'Create something completely unknown and weird'
      const result = await fallbackGenerator.generateFallbackContract(prompt)

      expect(result.success).toBe(false)
      expect(result.contractType.category).toBe('generic')
      expect(result.code).toContain('contract')
      expect(result.code).toContain('init()')
      
      const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
      expect(isValid).toBe(true)
    })

    test('provides emergency fallback on errors', async () => {
      // Simulate error by passing invalid input
      const result = await fallbackGenerator.generateFallbackContract('')

      expect(result.code).toContain('EmergencyFallback')
      expect(result.templateUsed).toBe('emergency-fallback')
      expect(result.reasoning).toContain('Emergency fallback')
      
      const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
      expect(isValid).toBe(true)
    })
  })

  describe('Template-Based Fallbacks', () => {
    test('returns template-based fallback for specific requirements', () => {
      const requirements = { category: 'nft', features: ['royalties'] }
      const code = fallbackGenerator.getTemplateBasedFallback(requirements)

      expect(code).toContain('contract')
      expect(code).toContain('init()')
      expect(code).not.toContain('undefined')
    })

    test('returns generic fallback for unknown categories', () => {
      const requirements = { category: 'unknown-category' }
      const code = fallbackGenerator.getTemplateBasedFallback(requirements)

      expect(code).toContain('EmergencyFallback')
      expect(code).toContain('init()')
    })
  })

  describe('Minimal Working Contracts', () => {
    test('creates minimal NFT contract', () => {
      const code = fallbackGenerator.createMinimalWorkingContract({
        name: 'TestNFT',
        category: 'nft'
      })

      expect(code).toContain('contract TestNFT')
      expect(code).toContain('NonFungibleToken')
      expect(code).toContain('resource NFT')
      expect(code).toContain('resource Collection')
      expect(code).toContain('init()')
      expect(code).not.toContain('undefined')
    })

    test('creates minimal token contract', () => {
      const code = fallbackGenerator.createMinimalWorkingContract({
        name: 'TestToken',
        category: 'fungible-token'
      })

      expect(code).toContain('contract TestToken')
      expect(code).toContain('resource Vault')
      expect(code).toContain('totalSupply')
      expect(code).toContain('init()')
      expect(code).not.toContain('undefined')
    })

    test('creates minimal marketplace contract', () => {
      const code = fallbackGenerator.createMinimalWorkingContract({
        name: 'TestMarketplace',
        category: 'marketplace'
      })

      expect(code).toContain('contract TestMarketplace')
      expect(code).toContain('struct Listing')
      expect(code).toContain('listItem')
      expect(code).toContain('init()')
      expect(code).not.toContain('undefined')
    })

    test('creates minimal utility contract for unknown categories', () => {
      const code = fallbackGenerator.createMinimalWorkingContract({
        name: 'TestUtility',
        category: 'unknown'
      })

      expect(code).toContain('contract TestUtility')
      expect(code).toContain('setValue')
      expect(code).toContain('getValue')
      expect(code).toContain('init()')
      expect(code).not.toContain('undefined')
    })

    test('uses default names when not provided', () => {
      const code = fallbackGenerator.createMinimalWorkingContract({})

      expect(code).toContain('contract MinimalContract')
      expect(code).toContain('init()')
    })
  })

  describe('Quality Validation', () => {
    test('validates syntactically correct contracts', async () => {
      const validCode = `
        access(all) contract TestContract {
          access(all) var value: String
          
          access(all) fun setValue(newValue: String) {
            self.value = newValue
          }
          
          init() {
            self.value = "test"
          }
        }
      `

      const isValid = await fallbackGenerator.validateFallbackQuality(validCode)
      expect(isValid).toBe(true)
    })

    test('rejects contracts with undefined values', async () => {
      const invalidCode = `
        access(all) contract TestContract {
          access(all) var value: String = undefined
          
          init() {
            self.value = "test"
          }
        }
      `

      const isValid = await fallbackGenerator.validateFallbackQuality(invalidCode)
      expect(isValid).toBe(false)
    })

    test('rejects contracts with unbalanced braces', async () => {
      const invalidCode = `
        access(all) contract TestContract {
          access(all) var value: String
          
          init() {
            self.value = "test"
          
        }
      `

      const isValid = await fallbackGenerator.validateFallbackQuality(invalidCode)
      expect(isValid).toBe(false)
    })

    test('rejects contracts without proper access modifiers', async () => {
      const invalidCode = `
        contract TestContract {
          var value: String
          
          init() {
            self.value = "test"
          }
        }
      `

      const isValid = await fallbackGenerator.validateFallbackQuality(invalidCode)
      expect(isValid).toBe(false)
    })

    test('rejects contracts without init function', async () => {
      const invalidCode = `
        access(all) contract TestContract {
          access(all) var value: String
        }
      `

      const isValid = await fallbackGenerator.validateFallbackQuality(invalidCode)
      expect(isValid).toBe(false)
    })

    test('handles validation errors gracefully', async () => {
      // Test with null/undefined input
      const isValid = await fallbackGenerator.validateFallbackQuality(null as any)
      expect(isValid).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('handles empty prompts', async () => {
      const result = await fallbackGenerator.generateFallbackContract('')
      
      expect(result.code).toContain('contract')
      expect(result.code).toContain('init()')
      expect(result.success).toBe(false) // Should use emergency fallback
    })

    test('handles very long prompts', async () => {
      const longPrompt = 'Create an advanced sophisticated complex enterprise NFT contract with multiple features and comprehensive functionality for large scale deployment with custom metadata management and royalty distribution systems'
      
      const result = await fallbackGenerator.generateFallbackContract(longPrompt)
      
      // Should successfully generate a contract regardless of complexity detection
      expect(result.code).toContain('contract')
      expect(result.code).toMatch(/init\s*\([^)]*\)/)
      expect(result.code).not.toContain('undefined')
      expect(result.success).toBe(true)
    })

    test('handles prompts with special characters', async () => {
      const prompt = 'Create an NFT contract with @#$%^&*() special chars'
      const result = await fallbackGenerator.generateFallbackContract(prompt)
      
      expect(result.code).toContain('contract')
      expect(result.code).toContain('init()')
    })

    test('handles prompts in different cases', async () => {
      const prompts = [
        'CREATE AN NFT CONTRACT',
        'create an nft contract',
        'CrEaTe An NfT cOnTrAcT'
      ]

      for (const prompt of prompts) {
        const result = await fallbackGenerator.generateFallbackContract(prompt)
        expect(result.contractType.category).toBe('nft')
      }
    })

    test('maintains consistent results for similar prompts', async () => {
      const prompt1 = 'Create an NFT collection'
      const prompt2 = 'Create an NFT collection for art'
      
      const result1 = await fallbackGenerator.generateFallbackContract(prompt1)
      const result2 = await fallbackGenerator.generateFallbackContract(prompt2)
      
      expect(result1.contractType.category).toBe(result2.contractType.category)
      expect(result1.templateUsed).toBe(result2.templateUsed)
    })
  })

  describe('Performance and Reliability', () => {
    test('generates fallbacks within reasonable time', async () => {
      const startTime = Date.now()
      const prompt = 'Create a complex NFT marketplace with advanced features'
      
      await fallbackGenerator.generateFallbackContract(prompt)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within 1 second
      expect(duration).toBeLessThan(1000)
    })

    test('handles concurrent fallback generation', async () => {
      const prompts = [
        'Create an NFT contract',
        'Create a token contract',
        'Create a marketplace contract',
        'Create a DAO contract',
        'Create a staking contract'
      ]

      const promises = prompts.map(prompt => 
        fallbackGenerator.generateFallbackContract(prompt)
      )

      const results = await Promise.all(promises)
      
      results.forEach(result => {
        expect(result.code).toContain('contract')
        expect(result.code).toContain('init()')
      })
    })

    test('all generated fallbacks pass quality validation', async () => {
      const prompts = [
        'Create an NFT contract',
        'Create a fungible token',
        'Create a marketplace',
        'Create a DAO voting system',
        'Create a staking contract',
        'Create a multi-sig wallet',
        'Create something unknown'
      ]

      for (const prompt of prompts) {
        const result = await fallbackGenerator.generateFallbackContract(prompt)
        const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
        
        expect(isValid).toBe(true)
        expect(result.code).not.toContain('undefined')
        expect(result.code).toMatch(/init\s*\([^)]*\)/) // Match init with any parameters
      }
    })
  })
})