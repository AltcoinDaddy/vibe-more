/**
 * Load Testing for Concurrent Generation Requests
 * 
 * Tests the quality assurance system's performance and reliability
 * under high load with multiple concurrent generation requests.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedGenerationController } from '../enhanced-generation-controller'
import { 
  GenerationRequest, 
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

describe('Load Testing for Concurrent Generation Requests', () => {
  let controller: EnhancedGenerationController

  beforeEach(() => {
    controller = new EnhancedGenerationController()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Concurrent Request Handling', () => {
    test('should handle 10 concurrent simple contract requests', async () => {
      const requests: GenerationRequest[] = Array.from({ length: 10 }, (_, i) => ({
        prompt: `Create a simple utility contract ${i + 1}`,
        context: `Utility contract ${i + 1} for load testing`,
        temperature: 0.5,
        maxRetries: 2,
        strictMode: false
      }))

      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string) => {
        // Simulate variable processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
        
        const contractNumber = prompt.match(/contract (\d+)/)?.[1] || '1'
        return `
          access(all) contract UtilityContract${contractNumber} {
            access(all) var counter: UInt64
            access(all) var name: String
            
            access(all) event CounterIncremented(newValue: UInt64)
            access(all) event ContractInitialized(name: String)
            
            access(all) fun increment(): UInt64 {
              self.counter = self.counter + 1
              emit CounterIncremented(newValue: self.counter)
              return self.counter
            }
            
            access(all) fun decrement(): UInt64 {
              pre {
                self.counter > 0: "Counter cannot be negative"
              }
              self.counter = self.counter - 1
              return self.counter
            }
            
            access(all) view fun getCounter(): UInt64 {
              return self.counter
            }
            
            access(all) fun reset() {
              self.counter = 0
            }
            
            access(all) fun setName(newName: String) {
              self.name = newName
            }
            
            access(all) view fun getName(): String {
              return self.name
            }
            
            init() {
              self.counter = 0
              self.name = "UtilityContract${contractNumber}"
              emit ContractInitialized(name: self.name)
            }
          }
        `
      })

      const options: EnhancedGenerationOptions = {
        enableRetryRecovery: true,
        enableAutoCorrection: true,
        enableFallbackGeneration: true,
        qualityThreshold: 75,
        maxRetries: 2,
        strictMode: false
      }

      const startTime = Date.now()
      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(request, mockGenerationFunction, options)
      )

      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // Verify all requests completed successfully
      expect(results).toHaveLength(10)
      results.forEach((result, index) => {
        expect(result.code).toBeDefined()
        expect(result.code).toContain(`UtilityContract${index + 1}`)
        expect(result.qualityScore).toBeGreaterThanOrEqual(75)
        expect(result.fallbackUsed).toBe(false)
        expect(result.generationMetrics.attemptCount).toBe(1)
      })

      // Verify reasonable performance
      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds
      expect(mockGenerationFunction).toHaveBeenCalledTimes(10)

      // Verify concurrent execution (should be faster than sequential)
      const averageTime = totalTime / 10
      expect(averageTime).toBeLessThan(500) // Average per request should be under 500ms
    })

    test('should handle 25 concurrent NFT contract requests with varying complexity', async () => {
      const requests: GenerationRequest[] = Array.from({ length: 25 }, (_, i) => ({
        prompt: `Create an NFT contract ${i + 1} with ${i % 3 === 0 ? 'basic' : i % 3 === 1 ? 'intermediate' : 'advanced'} features`,
        context: `NFT contract ${i + 1} for concurrent load testing`,
        temperature: 0.6 + (i % 5) * 0.1, // Vary temperature
        maxRetries: 2 + (i % 3), // Vary retry count
        strictMode: i % 4 === 0 // Some strict mode
      }))

      let callCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string) => {
        callCount++
        // Simulate realistic processing time with some variation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))
        
        const contractNumber = prompt.match(/contract (\d+)/)?.[1] || '1'
        const complexity = prompt.includes('basic') ? 'basic' : 
                          prompt.includes('intermediate') ? 'intermediate' : 'advanced'
        
        let contractCode = `
          access(all) contract NFTContract${contractNumber} {
            access(all) var totalSupply: UInt64
            access(all) var name: String
            access(all) var description: String
            
            access(all) event ContractInitialized()
            access(all) event Withdraw(id: UInt64, from: Address?)
            access(all) event Deposit(id: UInt64, to: Address?)
            access(all) event Minted(id: UInt64, to: Address)
            
            access(all) resource NFT {
              access(all) let id: UInt64
              access(all) let metadata: {String: AnyStruct}
              
              init(id: UInt64, metadata: {String: AnyStruct}) {
                self.id = id
                self.metadata = metadata
              }
              
              destroy() {
                emit Withdraw(id: self.id, from: self.owner?.address)
              }
            }
            
            access(all) resource Collection {
              access(all) var ownedNFTs: @{UInt64: NFT}
              
              init() {
                self.ownedNFTs <- {}
              }
              
              access(all) view fun getIDs(): [UInt64] {
                return self.ownedNFTs.keys
              }
              
              access(all) fun borrowNFT(_ id: UInt64): &NFT? {
                return &self.ownedNFTs[id] as &NFT?
              }
              
              access(all) fun deposit(token: @NFT) {
                let id = token.id
                let oldToken <- self.ownedNFTs[id] <- token
                emit Deposit(id: id, to: self.owner?.address)
                destroy oldToken
              }
              
              access(all) fun withdraw(withdrawID: UInt64): @NFT {
                let token <- self.ownedNFTs.remove(key: withdrawID) 
                  ?? panic("missing NFT")
                emit Withdraw(id: token.id, from: self.owner?.address)
                return <-token
              }
              
              destroy() {
                destroy self.ownedNFTs
              }
            }
            
            access(all) fun createEmptyCollection(): @Collection {
              return <- create Collection()
            }
            
            access(all) fun mintNFT(metadata: {String: AnyStruct}): @NFT {
              let nft <- create NFT(id: self.totalSupply, metadata: metadata)
              self.totalSupply = self.totalSupply + 1
              emit Minted(id: nft.id, to: self.account.address)
              return <-nft
            }
        `

        // Add complexity-specific features
        if (complexity === 'intermediate' || complexity === 'advanced') {
          contractCode += `
            access(all) var royalties: [Royalty]
            
            access(all) struct Royalty {
              access(all) let recipient: Address
              access(all) let percentage: UFix64
              
              init(recipient: Address, percentage: UFix64) {
                self.recipient = recipient
                self.percentage = percentage
              }
            }
            
            access(all) fun setRoyalties(_ royalties: [Royalty]) {
              self.royalties = royalties
            }
          `
        }

        if (complexity === 'advanced') {
          contractCode += `
            access(all) var tradingEnabled: Bool
            access(all) var maxSupply: UInt64?
            
            access(all) fun enableTrading() {
              self.tradingEnabled = true
            }
            
            access(all) fun disableTrading() {
              self.tradingEnabled = false
            }
            
            access(all) fun setMaxSupply(_ maxSupply: UInt64) {
              pre {
                self.maxSupply == nil: "Max supply already set"
                maxSupply > self.totalSupply: "Max supply must be greater than current supply"
              }
              self.maxSupply = maxSupply
            }
          `
        }

        contractCode += `
            init() {
              self.totalSupply = 0
              self.name = "NFT Contract ${contractNumber}"
              self.description = "A ${complexity} NFT contract for load testing"
        `

        if (complexity === 'intermediate' || complexity === 'advanced') {
          contractCode += `
              self.royalties = []
          `
        }

        if (complexity === 'advanced') {
          contractCode += `
              self.tradingEnabled = true
              self.maxSupply = nil
          `
        }

        contractCode += `
              emit ContractInitialized()
            }
          }
        `

        return contractCode
      })

      const options: EnhancedGenerationOptions = {
        enableRetryRecovery: true,
        enableAutoCorrection: true,
        enableFallbackGeneration: true,
        qualityThreshold: 80,
        maxRetries: 3,
        strictMode: false
      }

      const startTime = Date.now()
      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(request, mockGenerationFunction, options)
      )

      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // Verify all requests completed successfully
      expect(results).toHaveLength(25)
      results.forEach((result, index) => {
        expect(result.code).toBeDefined()
        expect(result.code).toContain(`NFTContract${index + 1}`)
        expect(result.qualityScore).toBeGreaterThanOrEqual(80)
        expect(result.code).toContain('resource NFT')
        expect(result.code).toContain('resource Collection')
        expect(result.code).toContain('mintNFT')
        expect(result.code).not.toContain('undefined')
      })

      // Verify performance under load
      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
      expect(mockGenerationFunction).toHaveBeenCalledTimes(25)

      // Verify quality consistency under load
      const averageQuality = results.reduce((sum, result) => sum + result.qualityScore, 0) / results.length
      expect(averageQuality).toBeGreaterThanOrEqual(85)
    })

    test('should handle mixed contract types under concurrent load', async () => {
      const contractTypes = ['nft', 'fungible-token', 'dao', 'marketplace', 'utility']
      const requests: GenerationRequest[] = Array.from({ length: 20 }, (_, i) => {
        const type = contractTypes[i % contractTypes.length]
        return {
          prompt: `Create a ${type} contract ${i + 1}`,
          context: `${type} contract ${i + 1} for mixed load testing`,
          temperature: 0.5 + (i % 4) * 0.1,
          maxRetries: 2,
          strictMode: i % 5 === 0
        }
      })

      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string) => {
        // Simulate realistic processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75))
        
        const contractNumber = prompt.match(/contract (\d+)/)?.[1] || '1'
        const type = prompt.match(/Create a (\w+)/)?.[1] || 'utility'
        
        switch (type) {
          case 'nft':
            return `
              access(all) contract NFT${contractNumber} {
                access(all) var totalSupply: UInt64
                access(all) resource NFT {
                  access(all) let id: UInt64
                  init(id: UInt64) { self.id = id }
                  destroy() {}
                }
                access(all) fun mintNFT(): @NFT {
                  self.totalSupply = self.totalSupply + 1
                  return <-create NFT(id: self.totalSupply)
                }
                init() { self.totalSupply = 0 }
              }
            `
          case 'fungible-token':
            return `
              access(all) contract Token${contractNumber} {
                access(all) var totalSupply: UFix64
                access(all) resource Vault {
                  access(all) var balance: UFix64
                  init(balance: UFix64) { self.balance = balance }
                  access(all) fun withdraw(amount: UFix64): @Vault {
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
                init() { self.totalSupply = 1000.0 }
              }
            `
          case 'dao':
            return `
              access(all) contract DAO${contractNumber} {
                access(all) var proposalCount: UInt64
                access(all) var proposals: {UInt64: Proposal}
                access(all) struct Proposal {
                  access(all) let id: UInt64
                  access(all) let description: String
                  access(all) var votesFor: UInt64
                  access(all) var votesAgainst: UInt64
                  init(id: UInt64, description: String) {
                    self.id = id
                    self.description = description
                    self.votesFor = 0
                    self.votesAgainst = 0
                  }
                }
                access(all) fun createProposal(description: String): UInt64 {
                  self.proposalCount = self.proposalCount + 1
                  let proposal = Proposal(id: self.proposalCount, description: description)
                  self.proposals[self.proposalCount] = proposal
                  return self.proposalCount
                }
                init() {
                  self.proposalCount = 0
                  self.proposals = {}
                }
              }
            `
          case 'marketplace':
            return `
              access(all) contract Marketplace${contractNumber} {
                access(all) var listings: {UInt64: Listing}
                access(all) var nextListingId: UInt64
                access(all) struct Listing {
                  access(all) let id: UInt64
                  access(all) let seller: Address
                  access(all) let price: UFix64
                  init(id: UInt64, seller: Address, price: UFix64) {
                    self.id = id
                    self.seller = seller
                    self.price = price
                  }
                }
                access(all) fun createListing(seller: Address, price: UFix64): UInt64 {
                  let listing = Listing(id: self.nextListingId, seller: seller, price: price)
                  self.listings[self.nextListingId] = listing
                  self.nextListingId = self.nextListingId + 1
                  return self.nextListingId - 1
                }
                init() {
                  self.listings = {}
                  self.nextListingId = 1
                }
              }
            `
          default: // utility
            return `
              access(all) contract Utility${contractNumber} {
                access(all) var counter: UInt64
                access(all) fun increment(): UInt64 {
                  self.counter = self.counter + 1
                  return self.counter
                }
                access(all) view fun getCounter(): UInt64 {
                  return self.counter
                }
                init() { self.counter = 0 }
              }
            `
        }
      })

      const options: EnhancedGenerationOptions = {
        enableRetryRecovery: true,
        enableAutoCorrection: true,
        enableFallbackGeneration: true,
        qualityThreshold: 75,
        maxRetries: 2,
        strictMode: false
      }

      const startTime = Date.now()
      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(request, mockGenerationFunction, options)
      )

      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // Verify all requests completed successfully
      expect(results).toHaveLength(20)
      results.forEach((result, index) => {
        const expectedType = contractTypes[index % contractTypes.length]
        expect(result.code).toBeDefined()
        expect(result.qualityScore).toBeGreaterThanOrEqual(75)
        expect(result.fallbackUsed).toBe(false)
        
        // Verify type-specific content
        switch (expectedType) {
          case 'nft':
            expect(result.code).toContain('resource NFT')
            expect(result.code).toContain('mintNFT')
            break
          case 'fungible-token':
            expect(result.code).toContain('resource Vault')
            expect(result.code).toContain('withdraw')
            expect(result.code).toContain('deposit')
            break
          case 'dao':
            expect(result.code).toContain('struct Proposal')
            expect(result.code).toContain('createProposal')
            break
          case 'marketplace':
            expect(result.code).toContain('struct Listing')
            expect(result.code).toContain('createListing')
            break
          case 'utility':
            expect(result.code).toContain('increment')
            expect(result.code).toContain('getCounter')
            break
        }
      })

      // Verify performance with mixed types
      expect(totalTime).toBeLessThan(8000) // Should complete within 8 seconds
      expect(mockGenerationFunction).toHaveBeenCalledTimes(20)
    })
  })

  describe('Error Recovery Under Load', () => {
    test('should handle concurrent requests with mixed success/failure rates', async () => {
      const requests: GenerationRequest[] = Array.from({ length: 15 }, (_, i) => ({
        prompt: `Create a test contract ${i + 1}`,
        context: `Test contract ${i + 1} for error recovery load testing`,
        temperature: 0.6,
        maxRetries: 3,
        strictMode: false
      }))

      let callCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string) => {
        callCount++
        const contractNumber = parseInt(prompt.match(/contract (\d+)/)?.[1] || '1')
        
        // Simulate different failure patterns
        if (contractNumber % 5 === 1) {
          // 20% fail on first attempt, succeed on second
          if (callCount <= 3) {
            throw new Error(`Network timeout for contract ${contractNumber}`)
          }
        } else if (contractNumber % 5 === 2) {
          // 20% fail on first two attempts, succeed on third
          if (callCount <= 6) {
            throw new Error(`Service unavailable for contract ${contractNumber}`)
          }
        } else if (contractNumber % 5 === 3) {
          // 20% produce undefined values on first attempt
          if (callCount <= 9) {
            return `
              access(all) contract TestContract${contractNumber} {
                access(all) var value: String = undefined
                init() { self.value = undefined }
              }
            `
          }
        }
        
        // Successful generation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
        return `
          access(all) contract TestContract${contractNumber} {
            access(all) var value: String
            access(all) var counter: UInt64
            
            access(all) event ValueChanged(newValue: String)
            access(all) event CounterIncremented(newValue: UInt64)
            
            access(all) fun setValue(newValue: String) {
              self.value = newValue
              emit ValueChanged(newValue: newValue)
            }
            
            access(all) fun increment(): UInt64 {
              self.counter = self.counter + 1
              emit CounterIncremented(newValue: self.counter)
              return self.counter
            }
            
            access(all) view fun getValue(): String {
              return self.value
            }
            
            access(all) view fun getCounter(): UInt64 {
              return self.counter
            }
            
            init() {
              self.value = "initialized"
              self.counter = 0
            }
          }
        `
      })

      const options: EnhancedGenerationOptions = {
        enableRetryRecovery: true,
        enableAutoCorrection: true,
        enableFallbackGeneration: true,
        qualityThreshold: 75,
        maxRetries: 3,
        strictMode: false
      }

      const startTime = Date.now()
      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(request, mockGenerationFunction, options)
      )

      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // Verify all requests eventually succeeded
      expect(results).toHaveLength(15)
      results.forEach((result, index) => {
        expect(result.code).toBeDefined()
        expect(result.code).toContain(`TestContract${index + 1}`)
        expect(result.qualityScore).toBeGreaterThanOrEqual(75)
        expect(result.code).not.toContain('undefined')
        
        // Some should have required retries
        if ((index + 1) % 5 <= 3) {
          expect(result.generationMetrics.attemptCount).toBeGreaterThan(1)
        }
      })

      // Verify reasonable performance despite errors
      expect(totalTime).toBeLessThan(12000) // Should complete within 12 seconds
      
      // Verify retry statistics
      const totalAttempts = results.reduce((sum, result) => sum + result.generationMetrics.attemptCount, 0)
      expect(totalAttempts).toBeGreaterThan(15) // Should have more attempts than requests due to retries
    })

    test('should maintain fallback quality under concurrent load', async () => {
      const requests: GenerationRequest[] = Array.from({ length: 12 }, (_, i) => ({
        prompt: `Create a contract ${i + 1} that will fail`,
        context: `Failing contract ${i + 1} for fallback load testing`,
        temperature: 0.7,
        maxRetries: 1, // Low retry count to force fallbacks
        strictMode: false
      }))

      // Mock generation function that always fails
      const mockGenerationFunction = vi.fn().mockRejectedValue(
        new Error('Generation service completely unavailable')
      )

      const options: EnhancedGenerationOptions = {
        enableRetryRecovery: true,
        enableAutoCorrection: true,
        enableFallbackGeneration: true,
        qualityThreshold: 60,
        maxRetries: 1,
        strictMode: false
      }

      const startTime = Date.now()
      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(request, mockGenerationFunction, options)
      )

      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // Verify all requests succeeded via fallback
      expect(results).toHaveLength(12)
      results.forEach((result, index) => {
        expect(result.code).toBeDefined()
        expect(result.fallbackUsed).toBe(true)
        expect(result.qualityScore).toBeGreaterThanOrEqual(50) // Fallback quality
        expect(result.code).toContain('contract')
        expect(result.code).toContain('init()')
        expect(result.code).not.toContain('undefined')
        expect(result.generationMetrics.attemptCount).toBe(2) // 1 failed attempt + 1 fallback
      })

      // Verify fallback performance under load
      expect(totalTime).toBeLessThan(8000) // Should complete within 8 seconds
      expect(mockGenerationFunction).toHaveBeenCalledTimes(12)
    })
  })

  describe('Resource Management Under Load', () => {
    test('should manage memory efficiently during concurrent processing', async () => {
      const requests: GenerationRequest[] = Array.from({ length: 30 }, (_, i) => ({
        prompt: `Create a large contract ${i + 1} with many functions`,
        context: `Large contract ${i + 1} for memory management testing`,
        temperature: 0.5,
        maxRetries: 2,
        strictMode: false
      }))

      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string) => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 25))
        
        const contractNumber = prompt.match(/contract (\d+)/)?.[1] || '1'
        
        // Generate a reasonably large contract
        const functions = Array.from({ length: 20 }, (_, i) => `
          access(all) fun function${i}(param${i}: String): String {
            return param${i}.concat(" processed by function ${i}")
          }
        `).join('')
        
        const events = Array.from({ length: 10 }, (_, i) => `
          access(all) event Event${i}(value${i}: String, timestamp${i}: UFix64)
        `).join('')
        
        return `
          access(all) contract LargeContract${contractNumber} {
            access(all) var counter: UInt64
            access(all) var data: {String: String}
            access(all) var flags: {String: Bool}
            
            ${events}
            
            ${functions}
            
            access(all) fun processData(key: String, value: String) {
              self.data[key] = value
              self.counter = self.counter + 1
              emit Event0(value0: value, timestamp0: getCurrentBlock().timestamp)
            }
            
            access(all) fun toggleFlag(key: String) {
              let currentValue = self.flags[key] ?? false
              self.flags[key] = !currentValue
            }
            
            access(all) view fun getData(key: String): String? {
              return self.data[key]
            }
            
            access(all) view fun getFlag(key: String): Bool {
              return self.flags[key] ?? false
            }
            
            access(all) view fun getStats(): {String: AnyStruct} {
              return {
                "counter": self.counter,
                "dataCount": self.data.length,
                "flagCount": self.flags.length
              }
            }
            
            init() {
              self.counter = 0
              self.data = {}
              self.flags = {}
            }
          }
        `
      })

      const options: EnhancedGenerationOptions = {
        enableRetryRecovery: true,
        enableAutoCorrection: true,
        enableFallbackGeneration: false, // Disable to test memory management of main pipeline
        qualityThreshold: 75,
        maxRetries: 2,
        strictMode: false
      }

      const startTime = Date.now()
      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(request, mockGenerationFunction, options)
      )

      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // Verify all requests completed successfully
      expect(results).toHaveLength(30)
      results.forEach((result, index) => {
        expect(result.code).toBeDefined()
        expect(result.code).toContain(`LargeContract${index + 1}`)
        expect(result.qualityScore).toBeGreaterThanOrEqual(75)
        expect(result.code.length).toBeGreaterThan(2000) // Should be reasonably large
        expect(result.fallbackUsed).toBe(false)
      })

      // Verify memory-efficient performance
      expect(totalTime).toBeLessThan(15000) // Should complete within 15 seconds
      expect(mockGenerationFunction).toHaveBeenCalledTimes(30)
      
      // Verify consistent quality despite large contracts
      const averageQuality = results.reduce((sum, result) => sum + result.qualityScore, 0) / results.length
      expect(averageQuality).toBeGreaterThanOrEqual(80)
    })

    test('should handle timeout scenarios gracefully under load', async () => {
      const requests: GenerationRequest[] = Array.from({ length: 8 }, (_, i) => ({
        prompt: `Create a contract ${i + 1} with potential timeout`,
        context: `Timeout test contract ${i + 1}`,
        temperature: 0.6,
        maxRetries: 2,
        strictMode: false
      }))

      let callCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string) => {
        callCount++
        const contractNumber = parseInt(prompt.match(/contract (\d+)/)?.[1] || '1')
        
        // Simulate timeouts for some requests
        if (contractNumber % 3 === 1 && callCount <= 4) {
          // Simulate timeout by taking too long
          await new Promise(resolve => setTimeout(resolve, 2000))
          throw new Error('Request timeout')
        }
        
        // Normal processing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
        return `
          access(all) contract TimeoutTestContract${contractNumber} {
            access(all) var processed: Bool
            access(all) var timestamp: UFix64
            
            access(all) event ProcessingCompleted(timestamp: UFix64)
            
            access(all) fun process() {
              self.processed = true
              self.timestamp = getCurrentBlock().timestamp
              emit ProcessingCompleted(timestamp: self.timestamp)
            }
            
            access(all) view fun isProcessed(): Bool {
              return self.processed
            }
            
            access(all) view fun getTimestamp(): UFix64 {
              return self.timestamp
            }
            
            init() {
              self.processed = false
              self.timestamp = getCurrentBlock().timestamp
            }
          }
        `
      })

      const options: EnhancedGenerationOptions = {
        enableRetryRecovery: true,
        enableAutoCorrection: true,
        enableFallbackGeneration: true,
        qualityThreshold: 70,
        maxRetries: 2,
        strictMode: false
      }

      const startTime = Date.now()
      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(request, mockGenerationFunction, options)
      )

      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // Verify all requests eventually completed
      expect(results).toHaveLength(8)
      results.forEach((result, index) => {
        expect(result.code).toBeDefined()
        expect(result.qualityScore).toBeGreaterThanOrEqual(60) // Some may use fallback
        
        if (result.fallbackUsed) {
          expect(result.code).toContain('contract')
          expect(result.code).toContain('init()')
        } else {
          expect(result.code).toContain(`TimeoutTestContract${index + 1}`)
          expect(result.code).toContain('process')
        }
      })

      // Verify reasonable total time despite timeouts
      expect(totalTime).toBeLessThan(20000) // Should complete within 20 seconds
      
      // Some requests should have used fallback due to timeouts
      const fallbackCount = results.filter(result => result.fallbackUsed).length
      expect(fallbackCount).toBeGreaterThan(0)
    })
  })

  describe('Quality Consistency Under Load', () => {
    test('should maintain quality standards across all concurrent requests', async () => {
      const requests: GenerationRequest[] = Array.from({ length: 20 }, (_, i) => ({
        prompt: `Create a quality test contract ${i + 1}`,
        context: `Quality consistency test contract ${i + 1}`,
        temperature: 0.5,
        maxRetries: 2,
        strictMode: true // Use strict mode for higher quality requirements
      }))

      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
        
        const contractNumber = prompt.match(/contract (\d+)/)?.[1] || '1'
        return `
          access(all) contract QualityTestContract${contractNumber} {
            access(all) var totalOperations: UInt64
            access(all) var operationHistory: [Operation]
            access(all) var isActive: Bool
            
            access(all) event ContractInitialized()
            access(all) event OperationExecuted(id: UInt64, type: String, timestamp: UFix64)
            access(all) event ContractDeactivated()
            
            access(all) struct Operation {
              access(all) let id: UInt64
              access(all) let type: String
              access(all) let timestamp: UFix64
              access(all) let data: {String: AnyStruct}
              
              init(id: UInt64, type: String, data: {String: AnyStruct}) {
                self.id = id
                self.type = type
                self.timestamp = getCurrentBlock().timestamp
                self.data = data
              }
            }
            
            access(all) fun executeOperation(type: String, data: {String: AnyStruct}): UInt64 {
              pre {
                self.isActive: "Contract is not active"
                type.length > 0: "Operation type cannot be empty"
              }
              
              self.totalOperations = self.totalOperations + 1
              let operation = Operation(id: self.totalOperations, type: type, data: data)
              self.operationHistory.append(operation)
              
              emit OperationExecuted(
                id: self.totalOperations, 
                type: type, 
                timestamp: operation.timestamp
              )
              
              return self.totalOperations
            }
            
            access(all) fun deactivate() {
              pre {
                self.isActive: "Contract is already inactive"
              }
              self.isActive = false
              emit ContractDeactivated()
            }
            
            access(all) fun activate() {
              pre {
                !self.isActive: "Contract is already active"
              }
              self.isActive = true
            }
            
            access(all) view fun getOperation(id: UInt64): Operation? {
              if id == 0 || id > self.totalOperations {
                return nil
              }
              return self.operationHistory[id - 1]
            }
            
            access(all) view fun getRecentOperations(count: UInt64): [Operation] {
              let startIndex = self.operationHistory.length > Int(count) ? 
                self.operationHistory.length - Int(count) : 0
              return self.operationHistory.slice(from: startIndex, upTo: self.operationHistory.length)
            }
            
            access(all) view fun getStats(): {String: AnyStruct} {
              return {
                "totalOperations": self.totalOperations,
                "isActive": self.isActive,
                "historyLength": self.operationHistory.length
              }
            }
            
            init() {
              self.totalOperations = 0
              self.operationHistory = []
              self.isActive = true
              emit ContractInitialized()
            }
          }
        `
      })

      const options: EnhancedGenerationOptions = {
        enableRetryRecovery: true,
        enableAutoCorrection: true,
        enableFallbackGeneration: true,
        qualityThreshold: 85, // High quality threshold
        maxRetries: 2,
        strictMode: true
      }

      const startTime = Date.now()
      const promises = requests.map(request =>
        controller.generateWithQualityAssurance(request, mockGenerationFunction, options)
      )

      const results = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // Verify all requests met high quality standards
      expect(results).toHaveLength(20)
      results.forEach((result, index) => {
        expect(result.code).toBeDefined()
        expect(result.qualityScore).toBeGreaterThanOrEqual(85)
        expect(result.code).toContain(`QualityTestContract${index + 1}`)
        expect(result.code).toContain('struct Operation')
        expect(result.code).toContain('executeOperation')
        expect(result.code).toContain('pre {')
        expect(result.code).toContain('emit ')
        expect(result.code).not.toContain('undefined')
        expect(result.code).not.toContain('pub ')
        expect(result.fallbackUsed).toBe(false) // Should not need fallback for high-quality generation
      })

      // Verify consistent high performance
      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
      
      // Verify quality consistency
      const qualityScores = results.map(result => result.qualityScore)
      const minQuality = Math.min(...qualityScores)
      const maxQuality = Math.max(...qualityScores)
      const qualityVariance = maxQuality - minQuality
      
      expect(minQuality).toBeGreaterThanOrEqual(85)
      expect(qualityVariance).toBeLessThan(15) // Quality should be consistent
      
      // Verify average quality
      const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      expect(averageQuality).toBeGreaterThanOrEqual(90)
    })
  })
})