/**
 * Retry and Recovery Integration Tests
 * 
 * End-to-end integration tests for retry and recovery mechanisms,
 * testing the complete pipeline with real-world scenarios.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { RetryRecoverySystem } from '../retry-recovery-system'
import { 
  GenerationRequest, 
  GenerationContext, 
  ContractType, 
  QualityRequirements
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

describe('Retry and Recovery Integration', () => {
  let retrySystem: RetryRecoverySystem

  const createNFTContext = (): GenerationContext => ({
    userPrompt: 'Create an NFT contract with minting and metadata',
    contractType: {
      category: 'nft',
      complexity: 'intermediate',
      features: ['minting', 'metadata', 'royalties']
    } as ContractType,
    previousAttempts: [],
    qualityRequirements: {
      minimumQualityScore: 80,
      requiredFeatures: ['complete-implementation', 'metadata-views'],
      prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount'],
      performanceRequirements: {
        maxGenerationTime: 30000,
        maxValidationTime: 5000,
        maxRetryAttempts: 3
      }
    } as QualityRequirements,
    userExperience: 'intermediate'
  })

  beforeEach(() => {
    retrySystem = new RetryRecoverySystem()
  })

  describe('Real-world NFT Contract Generation Scenarios', () => {
    test('should handle undefined values in NFT metadata and recover', async () => {
      const request: GenerationRequest = {
        prompt: 'Create an NFT contract with comprehensive metadata support',
        context: 'Flow blockchain NFT with MetadataViews',
        temperature: 0.7,
        maxRetries: 3,
        strictMode: false
      }
      const context = createNFTContext()

      // Simulate generation function that initially produces undefined values
      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string, temperature: number) => {
        attemptCount++
        
        if (attemptCount === 1) {
          // First attempt: code with undefined values
          return `
            access(all) contract TestNFT {
              access(all) var totalSupply: UInt64
              access(all) var name: String = undefined
              access(all) var description: String = undefined
              
              init() {
                self.totalSupply = 0
              }
              
              access(all) fun mintNFT(): @NFT {
                return <- create NFT(id: self.totalSupply)
              }
            }
            
            access(all) resource NFT {
              access(all) let id: UInt64
              access(all) let metadata: {String: String} = undefined
              
              init(id: UInt64) {
                self.id = id
              }
            }
          `
        } else if (attemptCount === 2) {
          // Second attempt: improved but still has issues
          return `
            access(all) contract TestNFT {
              access(all) var totalSupply: UInt64
              access(all) var name: String = ""
              access(all) var description: String = ""
              
              init() {
                self.totalSupply = 0
              }
              
              access(all) fun mintNFT(): @NFT {
                self.totalSupply = self.totalSupply + 1
                return <- create NFT(id: self.totalSupply)
              }
            }
            
            access(all) resource NFT {
              access(all) let id: UInt64
              access(all) let metadata: {String: String}
              
              init(id: UInt64) {
                self.id = id
                // Missing metadata initialization
              }
            }
          `
        } else {
          // Third attempt: complete and correct
          return `
            access(all) contract TestNFT {
              access(all) var totalSupply: UInt64
              access(all) var name: String
              access(all) var description: String
              
              init() {
                self.totalSupply = 0
                self.name = "Test NFT Collection"
                self.description = "A test NFT collection"
              }
              
              access(all) fun mintNFT(): @NFT {
                self.totalSupply = self.totalSupply + 1
                return <- create NFT(id: self.totalSupply)
              }
            }
            
            access(all) resource NFT {
              access(all) let id: UInt64
              access(all) let metadata: {String: String}
              
              init(id: UInt64) {
                self.id = id
                self.metadata = {
                  "name": "Test NFT #".concat(id.toString()),
                  "description": "A unique test NFT"
                }
              }
            }
          `
        }
      })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(3)
      expect(result.fallbackUsed).toBe(false)
      expect(result.finalCode).not.toContain('undefined')
      expect(result.finalCode).toContain('metadata')
      expect(result.finalCode).toContain('init(')
      expect(result.retryHistory).toHaveLength(3)
      
      // Verify progressive enhancement
      expect(result.retryHistory[0].enhancementLevel).toBe('basic')
      expect(result.retryHistory[1].enhancementLevel).toBe('moderate')
      expect(result.retryHistory[2].enhancementLevel).toBe('strict')
      
      // Verify temperature reduction
      expect(result.retryHistory[1].temperature).toBeLessThan(result.retryHistory[0].temperature)
      expect(result.retryHistory[2].temperature).toBeLessThan(result.retryHistory[1].temperature)
    })

    test('should activate fallback for consistently failing NFT generation', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a complex NFT marketplace contract',
        context: 'Advanced NFT marketplace with royalties and escrow',
        temperature: 0.8,
        maxRetries: 2,
        strictMode: true
      }
      const context = createNFTContext()

      // Simulate generation function that always fails
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        return `
          access(all) contract BrokenNFT {
            var totalSupply: UInt64 = undefined
            var broken: String = undefined
            
            init() {
              // Missing initialization
            }
            
            fun mintNFT() {
              // Incomplete function
            }
          }
        `
      })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true) // Should succeed via fallback
      expect(result.fallbackUsed).toBe(true)
      expect(result.totalAttempts).toBe(3) // 2 failed attempts + 1 fallback
      expect(result.recoveryStrategiesUsed).toContain('fallback-generation')
      expect(result.finalCode).not.toContain('undefined')
      expect(result.finalCode).toContain('access(all)')
      
      // Verify all attempts failed before fallback
      expect(result.retryHistory.slice(0, -1).every(attempt => !attempt.success)).toBe(true)
      expect(result.retryHistory[result.retryHistory.length - 1].success).toBe(true)
    })
  })

  describe('Progressive Enhancement Effectiveness', () => {
    test('should demonstrate progressive prompt enhancement effectiveness', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a DAO governance contract',
        context: 'Decentralized governance with voting and proposals',
        temperature: 0.7,
        maxRetries: 4,
        strictMode: false
      }
      
      const context: GenerationContext = {
        userPrompt: 'Create a DAO governance contract',
        contractType: {
          category: 'dao',
          complexity: 'advanced',
          features: ['voting', 'proposals', 'treasury']
        } as ContractType,
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 85,
          requiredFeatures: ['complete-implementation', 'governance-logic'],
          prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount'],
          performanceRequirements: {
            maxGenerationTime: 35000,
            maxValidationTime: 7000,
            maxRetryAttempts: 4
          }
        } as QualityRequirements,
        userExperience: 'expert'
      }

      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async (prompt: string, temperature: number) => {
        attemptCount++
        
        // Each attempt should show improvement due to progressive enhancement
        if (attemptCount <= 3) {
          // Generate progressively better code
          return `
            access(all) contract DAO {
              access(all) var proposalCount: UInt64
              access(all) var proposals: {UInt64: Proposal}
              
              init() {
                self.proposalCount = 0
                self.proposals = {}
              }
              
              access(all) fun createProposal(description: String): UInt64 {
                self.proposalCount = self.proposalCount + 1
                let proposal = Proposal(
                  id: self.proposalCount,
                  description: description,
                  votesFor: 0,
                  votesAgainst: 0,
                  executed: false
                )
                self.proposals[self.proposalCount] = proposal
                return self.proposalCount
              }
            }
            
            access(all) struct Proposal {
              access(all) let id: UInt64
              access(all) let description: String
              access(all) var votesFor: UInt64
              access(all) var votesAgainst: UInt64
              access(all) var executed: Bool
              
              init(id: UInt64, description: String, votesFor: UInt64, votesAgainst: UInt64, executed: Bool) {
                self.id = id
                self.description = description
                self.votesFor = votesFor
                self.votesAgainst = votesAgainst
                self.executed = executed
              }
            }
          `
        } else {
          // Final attempt: complete implementation
          return `
            access(all) contract DAO {
              access(all) var proposalCount: UInt64
              access(all) var proposals: {UInt64: Proposal}
              access(all) var members: {Address: Member}
              access(all) var quorum: UInt64
              
              init() {
                self.proposalCount = 0
                self.proposals = {}
                self.members = {}
                self.quorum = 100
              }
              
              access(all) fun addMember(address: Address, votingPower: UInt64) {
                self.members[address] = Member(address: address, votingPower: votingPower, joinedAt: getCurrentBlock().timestamp)
              }
              
              access(all) fun createProposal(description: String): UInt64 {
                self.proposalCount = self.proposalCount + 1
                let proposal = Proposal(
                  id: self.proposalCount,
                  description: description,
                  votesFor: 0,
                  votesAgainst: 0,
                  executed: false,
                  createdAt: getCurrentBlock().timestamp
                )
                self.proposals[self.proposalCount] = proposal
                emit ProposalCreated(proposalId: self.proposalCount, description: description)
                return self.proposalCount
              }
              
              access(all) fun vote(proposalId: UInt64, support: Bool, voter: Address) {
                pre {
                  self.proposals.containsKey(proposalId): "Proposal does not exist"
                  self.members.containsKey(voter): "Voter is not a member"
                  !self.proposals[proposalId]!.executed: "Proposal already executed"
                }
                let member = self.members[voter]!
                let proposal = self.proposals[proposalId]!
                
                if support {
                  proposal.votesFor = proposal.votesFor + member.votingPower
                } else {
                  proposal.votesAgainst = proposal.votesAgainst + member.votingPower
                }
                self.proposals[proposalId] = proposal
                
                emit VoteCast(proposalId: proposalId, voter: voter, support: support, weight: member.votingPower)
              }
              
              access(all) fun executeProposal(proposalId: UInt64) {
                pre {
                  self.proposals.containsKey(proposalId): "Proposal does not exist"
                  !self.proposals[proposalId]!.executed: "Proposal already executed"
                  self.proposals[proposalId]!.votesFor > self.proposals[proposalId]!.votesAgainst: "Proposal rejected"
                  self.proposals[proposalId]!.votesFor >= self.quorum: "Quorum not met"
                }
                let proposal = self.proposals[proposalId]!
                proposal.executed = true
                self.proposals[proposalId] = proposal
                
                emit ProposalExecuted(proposalId: proposalId)
              }
              
              access(all) event ProposalCreated(proposalId: UInt64, description: String)
              access(all) event VoteCast(proposalId: UInt64, voter: Address, support: Bool, weight: UInt64)
              access(all) event ProposalExecuted(proposalId: UInt64)
            }
            
            access(all) struct Proposal {
              access(all) let id: UInt64
              access(all) let description: String
              access(all) var votesFor: UInt64
              access(all) var votesAgainst: UInt64
              access(all) var executed: Bool
              access(all) let createdAt: UFix64
              
              init(id: UInt64, description: String, votesFor: UInt64, votesAgainst: UInt64, executed: Bool, createdAt: UFix64) {
                self.id = id
                self.description = description
                self.votesFor = votesFor
                self.votesAgainst = votesAgainst
                self.executed = executed
                self.createdAt = createdAt
              }
            }
            
            access(all) struct Member {
              access(all) let address: Address
              access(all) let votingPower: UInt64
              access(all) let joinedAt: UFix64
              
              init(address: Address, votingPower: UInt64, joinedAt: UFix64) {
                self.address = address
                self.votingPower = votingPower
                self.joinedAt = joinedAt
              }
            }
          `
        }
      })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(4)
      expect(result.fallbackUsed).toBe(false)
      
      // Verify progressive enhancement levels
      expect(result.retryHistory[0].enhancementLevel).toBe('basic')
      expect(result.retryHistory[1].enhancementLevel).toBe('moderate')
      expect(result.retryHistory[2].enhancementLevel).toBe('strict')
      expect(result.retryHistory[3].enhancementLevel).toBe('maximum')
      
      // Verify temperature reduction
      const temperatures = result.retryHistory.map(attempt => attempt.temperature)
      for (let i = 1; i < temperatures.length; i++) {
        expect(temperatures[i]).toBeLessThanOrEqual(temperatures[i - 1])
      }
      
      // Verify final code quality
      expect(result.finalCode).toContain('createProposal')
      expect(result.finalCode).toContain('vote')
      expect(result.finalCode).toContain('executeProposal')
      expect(result.finalCode).toContain('event')
      expect(result.finalCode).toContain('Member')
      expect(result.finalCode).toContain('quorum')
      expect(result.finalCode).not.toContain('undefined')
    })
  })

  describe('Error Recovery Scenarios', () => {
    test('should recover from network timeouts and service errors', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a simple utility contract',
        context: 'Basic utility contract for testing',
        temperature: 0.5,
        maxRetries: 3,
        strictMode: false
      }
      
      const context: GenerationContext = {
        userPrompt: 'Create a simple utility contract',
        contractType: {
          category: 'utility',
          complexity: 'simple',
          features: ['basic-functions']
        } as ContractType,
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 75,
          requiredFeatures: ['complete-implementation'],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 20000,
            maxValidationTime: 3000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements,
        userExperience: 'beginner'
      }

      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        attemptCount++
        
        if (attemptCount === 1) {
          throw new Error('Network timeout')
        } else if (attemptCount === 2) {
          throw new Error('Service temporarily unavailable')
        } else {
          return `
            access(all) contract UtilityContract {
              access(all) var counter: UInt64
              
              init() {
                self.counter = 0
              }
              
              access(all) fun increment(): UInt64 {
                self.counter = self.counter + 1
                return self.counter
              }
              
              access(all) fun getCounter(): UInt64 {
                return self.counter
              }
              
              access(all) fun reset() {
                self.counter = 0
              }
            }
          `
        }
      })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(3)
      expect(result.fallbackUsed).toBe(false)
      
      // Verify error handling
      expect(result.retryHistory[0].failureReasons).toContain('generation-error')
      expect(result.retryHistory[1].failureReasons).toContain('generation-error')
      expect(result.retryHistory[2].success).toBe(true)
      
      // Verify final code
      expect(result.finalCode).toContain('UtilityContract')
      expect(result.finalCode).toContain('increment')
      expect(result.finalCode).toContain('getCounter')
      expect(result.finalCode).toContain('reset')
    })
  })

  describe('Performance and Metrics', () => {
    test('should track comprehensive metrics across retry attempts', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a marketplace contract',
        context: 'NFT marketplace with listing and purchasing',
        temperature: 0.6,
        maxRetries: 3,
        strictMode: false
      }
      
      const context: GenerationContext = {
        userPrompt: 'Create a marketplace contract',
        contractType: {
          category: 'marketplace',
          complexity: 'intermediate',
          features: ['listing', 'purchasing', 'escrow']
        } as ContractType,
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 80,
          requiredFeatures: ['complete-implementation', 'escrow-logic'],
          prohibitedPatterns: ['undefined', 'pub '],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements,
        userExperience: 'intermediate'
      }

      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        attemptCount++
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 10))
        
        if (attemptCount <= 2) {
          return `access(all) contract IncompleteMarketplace { var items: {UInt64: String} = undefined; init() {} }`
        } else {
          return `
            access(all) contract Marketplace {
              access(all) var listings: {UInt64: Listing}
              access(all) var nextListingId: UInt64
              
              init() {
                self.listings = {}
                self.nextListingId = 1
              }
              
              access(all) fun createListing(nftId: UInt64, price: UFix64): UInt64 {
                let listing = Listing(id: self.nextListingId, nftId: nftId, price: price, seller: self.account.address)
                self.listings[self.nextListingId] = listing
                self.nextListingId = self.nextListingId + 1
                return self.nextListingId - 1
              }
            }
            
            access(all) struct Listing {
              access(all) let id: UInt64
              access(all) let nftId: UInt64
              access(all) let price: UFix64
              access(all) let seller: Address
              
              init(id: UInt64, nftId: UInt64, price: UFix64, seller: Address) {
                self.id = id
                self.nftId = nftId
                self.price = price
                self.seller = seller
              }
            }
          `
        }
      })

      const result = await retrySystem.executeWithRetry(request, context, mockGenerationFunction)

      expect(result.success).toBe(true)
      expect(result.totalAttempts).toBe(3)
      
      // Verify metrics tracking
      expect(result.metrics).toBeDefined()
      expect(result.metrics.attemptCount).toBe(3)
      expect(result.metrics.totalGenerationTime).toBeGreaterThan(0)
      expect(result.metrics.validationTime).toBeGreaterThan(0)
      expect(result.metrics.finalQualityScore).toBeGreaterThan(0)
      expect(result.metrics.startTime).toBeInstanceOf(Date)
      expect(result.metrics.endTime).toBeInstanceOf(Date)
      
      // Verify retry statistics
      const stats = retrySystem.getRetryStatistics(result.retryHistory)
      expect(stats.averageQualityImprovement).toBeGreaterThan(0)
      expect(stats.mostCommonFailures.length).toBeGreaterThan(0)
      expect(Object.keys(stats.enhancementEffectiveness).length).toBeGreaterThan(0)
    })
  })
})