/**
 * Error Recovery and Fallback Scenarios Integration Tests
 * 
 * Tests error recovery mechanisms and fallback systems under various failure scenarios,
 * ensuring the system gracefully handles all types of failures.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedGenerationController } from '../enhanced-generation-controller'
import { RetryRecoverySystem } from '../retry-recovery-system'
import { FallbackGenerator } from '../fallback-generator'
import { 
  GenerationRequest, 
  GenerationContext, 
  ContractType, 
  QualityRequirements,
  EnhancedGenerationOptions
} from '../types'

// Mock the logger to avoid console output during tests
vi.mock('../logger', () => ({
  QALogger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })),
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })),
  initializeLogger: vi.fn()
}))

describe('Error Recovery and Fallback Scenarios', () => {
  let controller: EnhancedGenerationController
  let retrySystem: RetryRecoverySystem
  let fallbackGenerator: FallbackGenerator

  beforeEach(() => {
    controller = new EnhancedGenerationController()
    retrySystem = new RetryRecoverySystem()
    fallbackGenerator = new FallbackGenerator()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('AI Service Failure Scenarios', () => {
    test('should recover from network timeout errors', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a simple NFT contract',
        context: 'Basic NFT contract for testing error recovery',
        temperature: 0.7,
        maxRetries: 3,
        strictMode: false
      }

      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        attemptCount++
        
        if (attemptCount <= 2) {
          // Simulate network timeout
          throw new Error('Network timeout: Request timed out after 30 seconds')
        } else {
          // Third attempt succeeds
          return `
            access(all) contract RecoveredNFT {
              access(all) var totalSupply: UInt64
              
              access(all) event Minted(id: UInt64)
              
              access(all) resource NFT {
                access(all) let id: UInt64
                
                init(id: UInt64) {
                  self.id = id
                }
                
                destroy() {}
              }
              
              access(all) fun mintNFT(): @NFT {
                self.totalSupply = self.totalSupply + 1
                let nft <- create NFT(id: self.totalSupply)
                emit Minted(id: self.totalSupply)
                return <-nft
              }
              
              init() {
                self.totalSupply = 0
              }
            }
          `
        }
      })

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableRetryRecovery: true, maxRetries: 3 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(false)
      expect(result.generationMetrics.attemptCount).toBe(3)
      expect(result.code).toContain('RecoveredNFT')
      expect(result.code).toContain('mintNFT')
      expect(result.qualityScore).toBeGreaterThan(70)
    })

    test('should recover from rate limiting errors', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a fungible token contract',
        context: 'Token contract for rate limit recovery testing',
        temperature: 0.6,
        maxRetries: 4,
        strictMode: false
      }

      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        attemptCount++
        
        if (attemptCount <= 3) {
          // Simulate rate limiting with different error messages
          const errors = [
            'Rate limit exceeded: Too many requests',
            'API quota exceeded: Please try again later',
            'Service temporarily unavailable: Rate limited'
          ]
          throw new Error(errors[attemptCount - 1])
        } else {
          return `
            access(all) contract RecoveredToken {
              access(all) var totalSupply: UFix64
              
              access(all) event TokensMinted(amount: UFix64)
              access(all) event TokensTransferred(amount: UFix64, from: Address?, to: Address?)
              
              access(all) resource Vault {
                access(all) var balance: UFix64
                
                init(balance: UFix64) {
                  self.balance = balance
                }
                
                access(all) fun withdraw(amount: UFix64): @Vault {
                  pre {
                    self.balance >= amount: "Insufficient balance"
                  }
                  self.balance = self.balance - amount
                  return <-create Vault(balance: amount)
                }
                
                access(all) fun deposit(from: @Vault) {
                  self.balance = self.balance + from.balance
                  destroy from
                }
                
                destroy() {}
              }
              
              access(all) fun createEmptyVault(): @Vault {
                return <-create Vault(balance: 0.0)
              }
              
              access(all) fun mintTokens(amount: UFix64): @Vault {
                self.totalSupply = self.totalSupply + amount
                emit TokensMinted(amount: amount)
                return <-create Vault(balance: amount)
              }
              
              init() {
                self.totalSupply = 0.0
              }
            }
          `
        }
      })

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableRetryRecovery: true, maxRetries: 4 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(false)
      expect(result.generationMetrics.attemptCount).toBe(4)
      expect(result.code).toContain('RecoveredToken')
      expect(result.code).toContain('Vault')
      expect(result.code).toContain('mintTokens')
      expect(result.qualityScore).toBeGreaterThan(75)
    })

    test('should activate fallback when AI service is completely unavailable', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a DAO governance contract',
        context: 'DAO contract for complete service failure testing',
        temperature: 0.8,
        maxRetries: 2,
        strictMode: false
      }

      // Mock complete service failure
      const mockGenerationFunction = vi.fn().mockRejectedValue(
        new Error('AI service completely unavailable: All endpoints down')
      )

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableFallbackGeneration: true, maxRetries: 2 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
      expect(result.generationMetrics.attemptCount).toBe(3) // 2 failed attempts + 1 fallback
      expect(result.code).toContain('contract')
      expect(result.code).toContain('init()')
      expect(result.code).not.toContain('undefined')
      expect(result.qualityScore).toBeGreaterThan(50) // Fallback should provide reasonable quality
    })

    test('should handle malformed AI responses gracefully', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a marketplace contract',
        context: 'Marketplace contract for malformed response testing',
        temperature: 0.5,
        maxRetries: 3,
        strictMode: false
      }

      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        attemptCount++
        
        if (attemptCount === 1) {
          // Return completely invalid response
          return 'This is not Cadence code at all! Just random text.'
        } else if (attemptCount === 2) {
          // Return partial/truncated response
          return `
            access(all) contract IncompleteMarketplace {
              access(all) var listings: {UInt64: Listing
              // Response truncated here...
          `
        } else {
          // Return valid response
          return `
            access(all) contract Marketplace {
              access(all) var listings: {UInt64: Listing}
              access(all) var nextListingId: UInt64
              
              access(all) event ListingCreated(id: UInt64, seller: Address)
              
              access(all) struct Listing {
                access(all) let id: UInt64
                access(all) let seller: Address
                access(all) let price: UFix64
                access(all) var active: Bool
                
                init(id: UInt64, seller: Address, price: UFix64) {
                  self.id = id
                  self.seller = seller
                  self.price = price
                  self.active = true
                }
              }
              
              access(all) fun createListing(seller: Address, price: UFix64): UInt64 {
                let listing = Listing(id: self.nextListingId, seller: seller, price: price)
                self.listings[self.nextListingId] = listing
                emit ListingCreated(id: self.nextListingId, seller: seller)
                self.nextListingId = self.nextListingId + 1
                return self.nextListingId - 1
              }
              
              access(all) view fun getListing(id: UInt64): Listing? {
                return self.listings[id]
              }
              
              init() {
                self.listings = {}
                self.nextListingId = 1
              }
            }
          `
        }
      })

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableRetryRecovery: true, enableAutoCorrection: true, maxRetries: 3 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(false)
      expect(result.generationMetrics.attemptCount).toBe(3)
      expect(result.code).toContain('Marketplace')
      expect(result.code).toContain('createListing')
      expect(result.code).toContain('struct Listing')
      expect(result.qualityScore).toBeGreaterThan(70)
    })
  })

  describe('Validation Failure Recovery', () => {
    test('should recover from persistent undefined value issues', async () => {
      const request: GenerationRequest = {
        prompt: 'Create an NFT contract with metadata',
        context: 'NFT contract for undefined value recovery testing',
        temperature: 0.7,
        maxRetries: 4,
        strictMode: false
      }

      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        attemptCount++
        
        if (attemptCount <= 3) {
          // Keep generating code with undefined values
          return `
            access(all) contract PersistentUndefinedNFT {
              access(all) var totalSupply: UInt64 = undefined
              access(all) var name: String = undefined
              access(all) var description: String = undefined
              
              access(all) resource NFT {
                access(all) let id: UInt64
                access(all) let metadata: {String: String} = undefined
                
                init(id: UInt64) {
                  self.id = id
                }
                
                destroy() {}
              }
              
              access(all) fun mintNFT(): @NFT {
                return <- create NFT(id: undefined)
              }
              
              init() {
                self.totalSupply = undefined
              }
            }
          `
        } else {
          // Finally generate clean code
          return `
            access(all) contract CleanNFT {
              access(all) var totalSupply: UInt64
              access(all) var name: String
              access(all) var description: String
              
              access(all) event Minted(id: UInt64, to: Address?)
              
              access(all) resource NFT {
                access(all) let id: UInt64
                access(all) let metadata: {String: String}
                
                init(id: UInt64, metadata: {String: String}) {
                  self.id = id
                  self.metadata = metadata
                }
                
                destroy() {}
              }
              
              access(all) fun mintNFT(metadata: {String: String}): @NFT {
                self.totalSupply = self.totalSupply + 1
                let nft <- create NFT(id: self.totalSupply, metadata: metadata)
                emit Minted(id: self.totalSupply, to: self.account.address)
                return <-nft
              }
              
              init() {
                self.totalSupply = 0
                self.name = "Clean NFT Collection"
                self.description = "A properly initialized NFT collection"
              }
            }
          `
        }
      })

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { 
          enableRetryRecovery: true, 
          enableAutoCorrection: true, 
          maxRetries: 4,
          qualityThreshold: 80
        }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(false)
      expect(result.generationMetrics.attemptCount).toBe(4)
      expect(result.code).not.toContain('undefined')
      expect(result.code).toContain('CleanNFT')
      expect(result.code).toContain('mintNFT')
      expect(result.qualityScore).toBeGreaterThan(80)
      expect(result.generationMetrics.issuesFixed).toBeGreaterThan(0)
    })

    test('should activate fallback for unresolvable syntax errors', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a token contract with advanced features',
        context: 'Token contract for syntax error recovery testing',
        temperature: 0.6,
        maxRetries: 2,
        strictMode: true
      }

      // Mock generation that always produces syntax errors
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        return `
          access(all) contract BrokenToken {
            access(all) var totalSupply: UFix64 = {
            access(all) var name: String = "Broken Token"
            
            access(all) resource Vault {
              access(all) var balance: UFix64
              
              init(balance: UFix64 {
                self.balance = balance
              }
              
              access(all) fun withdraw(amount: UFix64): @Vault
                pre {
                  self.balance >= amount: "Insufficient balance"
                }
                self.balance = self.balance - amount
                return <-create Vault(balance: amount
              }
              
              destroy() {
            }
            
            init() {
              self.totalSupply = 1000.0
            }
        `
      })

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { 
          enableFallbackGeneration: true, 
          enableAutoCorrection: true,
          maxRetries: 2,
          strictMode: true
        }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
      expect(result.generationMetrics.attemptCount).toBe(3) // 2 failed attempts + 1 fallback
      expect(result.code).toContain('contract')
      expect(result.code).toContain('init()')
      expect(result.code).not.toContain('undefined')
      
      // Fallback should provide syntactically correct code
      const braceCount = (result.code.match(/\{/g) || []).length - (result.code.match(/\}/g) || []).length
      expect(braceCount).toBe(0) // Balanced braces
    })

    test('should handle legacy syntax detection and recovery', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a modern NFT contract',
        context: 'NFT contract for legacy syntax recovery testing',
        temperature: 0.5,
        maxRetries: 3,
        strictMode: true
      }

      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        attemptCount++
        
        if (attemptCount <= 2) {
          // Generate code with legacy syntax
          return `
            pub contract LegacyNFT {
              pub var totalSupply: UInt64
              
              pub resource NFT {
                pub let id: UInt64
                
                init(id: UInt64) {
                  self.id = id
                }
                
                destroy() {}
              }
              
              pub fun mintNFT(): @NFT {
                self.totalSupply = self.totalSupply + 1
                return <- create NFT(id: self.totalSupply)
              }
              
              init() {
                self.totalSupply = 0
              }
            }
          `
        } else {
          // Generate modern syntax
          return `
            access(all) contract ModernNFT {
              access(all) var totalSupply: UInt64
              
              access(all) event Minted(id: UInt64)
              
              access(all) resource NFT {
                access(all) let id: UInt64
                
                init(id: UInt64) {
                  self.id = id
                }
                
                destroy() {}
              }
              
              access(all) fun mintNFT(): @NFT {
                self.totalSupply = self.totalSupply + 1
                let nft <- create NFT(id: self.totalSupply)
                emit Minted(id: self.totalSupply)
                return <-nft
              }
              
              init() {
                self.totalSupply = 0
              }
            }
          `
        }
      })

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { 
          enableRetryRecovery: true, 
          enableAutoCorrection: true,
          maxRetries: 3,
          strictMode: true
        }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(false)
      expect(result.generationMetrics.attemptCount).toBe(3)
      expect(result.code).not.toContain('pub ')
      expect(result.code).toContain('access(all)')
      expect(result.code).toContain('ModernNFT')
      expect(result.qualityScore).toBeGreaterThan(80)
    })
  })

  describe('Fallback System Reliability', () => {
    test('should provide appropriate fallback for NFT contracts', async () => {
      const request: GenerationRequest = {
        prompt: 'Create an NFT contract with minting and collection management',
        context: 'Comprehensive NFT contract with advanced features',
        temperature: 0.8,
        maxRetries: 1,
        strictMode: false
      }

      // Mock complete generation failure
      const mockGenerationFunction = vi.fn().mockRejectedValue(
        new Error('Complete generation system failure')
      )

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableFallbackGeneration: true, maxRetries: 1 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
      expect(result.code).toContain('contract')
      expect(result.code).toContain('resource NFT')
      expect(result.code).toContain('resource Collection')
      expect(result.code).toContain('mintNFT')
      expect(result.code).toContain('init()')
      expect(result.code).not.toContain('undefined')
      expect(result.qualityScore).toBeGreaterThan(60)
    })

    test('should provide appropriate fallback for fungible token contracts', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a fungible token with minting and burning capabilities',
        context: 'Advanced fungible token contract',
        temperature: 0.7,
        maxRetries: 1,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockRejectedValue(
        new Error('Token generation service unavailable')
      )

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableFallbackGeneration: true, maxRetries: 1 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
      expect(result.code).toContain('contract')
      expect(result.code).toContain('resource Vault')
      expect(result.code).toContain('totalSupply')
      expect(result.code).toContain('withdraw')
      expect(result.code).toContain('deposit')
      expect(result.code).toContain('init()')
      expect(result.qualityScore).toBeGreaterThan(60)
    })

    test('should provide appropriate fallback for DAO contracts', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a DAO governance contract with voting and proposals',
        context: 'Decentralized governance system',
        temperature: 0.9,
        maxRetries: 1,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockRejectedValue(
        new Error('DAO generation service failure')
      )

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableFallbackGeneration: true, maxRetries: 1 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
      expect(result.code).toContain('contract')
      expect(result.code).toContain('proposal')
      expect(result.code).toContain('vote')
      expect(result.code).toContain('init()')
      expect(result.qualityScore).toBeGreaterThan(50)
    })

    test('should handle fallback generation failures gracefully', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a complex marketplace contract',
        context: 'Advanced marketplace with escrow',
        temperature: 0.8,
        maxRetries: 1,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockRejectedValue(
        new Error('Primary generation failed')
      )

      // Mock fallback generator to also fail initially
      const originalGetFallbackCode = controller.getFallbackCode
      const mockGetFallbackCode = vi.fn()
        .mockRejectedValueOnce(new Error('Fallback generation failed'))
        .mockResolvedValueOnce(`
          access(all) contract EmergencyFallback {
            access(all) var initialized: Bool
            
            access(all) event ContractInitialized()
            
            access(all) fun initialize() {
              pre {
                !self.initialized: "Already initialized"
              }
              self.initialized = true
              emit ContractInitialized()
            }
            
            access(all) view fun isInitialized(): Bool {
              return self.initialized
            }
            
            init() {
              self.initialized = false
              emit ContractInitialized()
            }
          }
        `)

      controller.getFallbackCode = mockGetFallbackCode

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableFallbackGeneration: true, maxRetries: 1 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
      expect(result.code).toContain('EmergencyFallback')
      expect(result.code).toContain('initialize')
      expect(result.code).toContain('init()')
      expect(result.qualityScore).toBeGreaterThan(10) // Emergency fallback has low but non-zero quality

      // Restore original method
      controller.getFallbackCode = originalGetFallbackCode
    })
  })

  describe('Concurrent Failure Scenarios', () => {
    test('should handle multiple concurrent generation failures', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        prompt: `Create a test contract ${i + 1}`,
        context: `Test contract ${i + 1} for concurrent failure testing`,
        temperature: 0.5,
        maxRetries: 2,
        strictMode: false
      }))

      // Mock generation function that fails for all requests
      const mockGenerationFunction = vi.fn().mockRejectedValue(
        new Error('Service overloaded: Too many concurrent requests')
      )

      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(
          request,
          mockGenerationFunction,
          { enableFallbackGeneration: true, maxRetries: 2 }
        )
      )

      const results = await Promise.all(promises)

      // All should succeed via fallback
      results.forEach((result, index) => {
        expect(result.code).toBeDefined()
        expect(result.fallbackUsed).toBe(true)
        expect(result.code).toContain('contract')
        expect(result.code).toContain('init()')
        expect(result.qualityScore).toBeGreaterThan(30)
      })
    })

    test('should maintain performance under concurrent error recovery', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => ({
        prompt: `Create an NFT contract variant ${i + 1}`,
        context: `NFT contract ${i + 1} for performance testing`,
        temperature: 0.6,
        maxRetries: 3,
        strictMode: false
      }))

      let attemptCounts = [0, 0, 0]
      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string) => {
        const index = parseInt(prompt.match(/variant (\d+)/)?.[1] || '1') - 1
        attemptCounts[index]++
        
        if (attemptCounts[index] <= 2) {
          throw new Error(`Temporary failure for contract ${index + 1}`)
        }
        
        return `
          access(all) contract NFTVariant${index + 1} {
            access(all) var totalSupply: UInt64
            
            access(all) resource NFT {
              access(all) let id: UInt64
              
              init(id: UInt64) {
                self.id = id
              }
              
              destroy() {}
            }
            
            access(all) fun mintNFT(): @NFT {
              self.totalSupply = self.totalSupply + 1
              return <-create NFT(id: self.totalSupply)
            }
            
            init() {
              self.totalSupply = 0
            }
          }
        `
      })

      const startTime = Date.now()
      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(
          request,
          mockGenerationFunction,
          { enableRetryRecovery: true, maxRetries: 3 }
        )
      )

      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // Verify all succeeded
      results.forEach((result, index) => {
        expect(result.code).toBeDefined()
        expect(result.fallbackUsed).toBe(false)
        expect(result.code).toContain(`NFTVariant${index + 1}`)
        expect(result.generationMetrics.attemptCount).toBe(3)
        expect(result.qualityScore).toBeGreaterThan(70)
      })

      // Verify reasonable performance despite retries
      expect(totalTime).toBeLessThan(15000) // Should complete within 15 seconds
    })
  })

  describe('Edge Case Error Scenarios', () => {
    test('should handle extremely large error responses', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a simple contract',
        context: 'Simple contract for large error testing',
        temperature: 0.5,
        maxRetries: 2,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        // Generate extremely large error message
        const largeErrorMessage = 'Error: '.repeat(10000) + 'Generation failed'
        throw new Error(largeErrorMessage)
      })

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableFallbackGeneration: true, maxRetries: 2 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
      expect(result.code).toContain('contract')
      expect(result.qualityScore).toBeGreaterThan(30)
    })

    test('should handle circular dependency errors', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a contract with complex dependencies',
        context: 'Contract for circular dependency testing',
        temperature: 0.7,
        maxRetries: 2,
        strictMode: false
      }

      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        attemptCount++
        
        if (attemptCount <= 2) {
          throw new Error('Circular dependency detected: Contract A depends on Contract B which depends on Contract A')
        }
        
        return `
          access(all) contract IndependentContract {
            access(all) var value: String
            
            access(all) fun setValue(newValue: String) {
              self.value = newValue
            }
            
            access(all) view fun getValue(): String {
              return self.value
            }
            
            init() {
              self.value = "initialized"
            }
          }
        `
      })

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableRetryRecovery: true, maxRetries: 2 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(false)
      expect(result.code).toContain('IndependentContract')
      expect(result.generationMetrics.attemptCount).toBe(3)
      expect(result.qualityScore).toBeGreaterThan(70)
    })

    test('should handle memory exhaustion errors', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a lightweight contract',
        context: 'Contract for memory exhaustion testing',
        temperature: 0.4,
        maxRetries: 1,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockRejectedValue(
        new Error('Out of memory: Generation process exhausted available memory')
      )

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { enableFallbackGeneration: true, maxRetries: 1 }
      )

      expect(result.code).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
      expect(result.code).toContain('contract')
      expect(result.code.length).toBeLessThan(5000) // Fallback should be lightweight
      expect(result.qualityScore).toBeGreaterThan(40)
    })
  })
})