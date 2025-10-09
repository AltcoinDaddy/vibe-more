/**
 * Regression Tests for Quality Assurance Prevention
 * 
 * Tests to prevent quality degradation and ensure that improvements
 * to the quality assurance system don't break existing functionality.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedGenerationController } from '../enhanced-generation-controller'
import { ComprehensiveValidationSystem } from '../comprehensive-validation-system'
import { UndefinedValueDetector } from '../undefined-value-detector'
import { AutoCorrectionEngine } from '../auto-correction-engine'
import { QualityScoreCalculator } from '../quality-score-calculator'
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

describe('Regression Tests for Quality Assurance Prevention', () => {
  let controller: EnhancedGenerationController
  let validationSystem: ComprehensiveValidationSystem
  let undefinedDetector: UndefinedValueDetector
  let correctionEngine: AutoCorrectionEngine
  let qualityCalculator: QualityScoreCalculator
  let fallbackGenerator: FallbackGenerator

  beforeEach(() => {
    controller = new EnhancedGenerationController()
    validationSystem = new ComprehensiveValidationSystem()
    undefinedDetector = new UndefinedValueDetector()
    correctionEngine = new AutoCorrectionEngine()
    qualityCalculator = new QualityScoreCalculator()
    fallbackGenerator = new FallbackGenerator()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Baseline Quality Standards', () => {
    test('should maintain minimum quality score for simple NFT contracts', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a simple NFT contract',
        context: 'Basic NFT contract for regression testing',
        temperature: 0.5,
        maxRetries: 2,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockResolvedValue(`
        access(all) contract SimpleNFT {
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
      `)

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 75 }
      )

      // Baseline quality requirements
      expect(result.qualityScore).toBeGreaterThanOrEqual(75)
      expect(result.code).not.toContain('undefined')
      expect(result.code).not.toContain('pub ')
      expect(result.code).toContain('access(all)')
      expect(result.code).toContain('init()')
      expect(result.code).toContain('destroy()')
      expect(result.fallbackUsed).toBe(false)
      expect(result.generationMetrics.attemptCount).toBe(1)
    })

    test('should maintain minimum quality score for fungible token contracts', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a fungible token contract',
        context: 'Basic token contract for regression testing',
        temperature: 0.5,
        maxRetries: 2,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockResolvedValue(`
        access(all) contract SimpleToken {
          access(all) var totalSupply: UFix64
          
          access(all) event TokensMinted(amount: UFix64)
          access(all) event TokensWithdrawn(amount: UFix64, from: Address?)
          access(all) event TokensDeposited(amount: UFix64, to: Address?)
          
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
              emit TokensWithdrawn(amount: amount, from: self.owner?.address)
              return <-create Vault(balance: amount)
            }
            
            access(all) fun deposit(from: @Vault) {
              let amount = from.balance
              self.balance = self.balance + amount
              emit TokensDeposited(amount: amount, to: self.owner?.address)
              destroy from
            }
            
            access(all) view fun getBalance(): UFix64 {
              return self.balance
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
      `)

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 80 }
      )

      // Baseline quality requirements for tokens
      expect(result.qualityScore).toBeGreaterThanOrEqual(80)
      expect(result.code).toContain('resource Vault')
      expect(result.code).toContain('withdraw')
      expect(result.code).toContain('deposit')
      expect(result.code).toContain('totalSupply')
      expect(result.code).toContain('event')
      expect(result.fallbackUsed).toBe(false)
    })

    test('should maintain quality standards for DAO contracts', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a DAO governance contract',
        context: 'Basic DAO contract for regression testing',
        temperature: 0.6,
        maxRetries: 2,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockResolvedValue(`
        access(all) contract SimpleDAO {
          access(all) var proposalCount: UInt64
          access(all) var proposals: {UInt64: Proposal}
          access(all) var members: {Address: Member}
          
          access(all) event ProposalCreated(id: UInt64, creator: Address)
          access(all) event VoteCast(proposalId: UInt64, voter: Address, support: Bool)
          
          access(all) struct Proposal {
            access(all) let id: UInt64
            access(all) let creator: Address
            access(all) let description: String
            access(all) var votesFor: UInt64
            access(all) var votesAgainst: UInt64
            access(all) var executed: Bool
            
            init(id: UInt64, creator: Address, description: String) {
              self.id = id
              self.creator = creator
              self.description = description
              self.votesFor = 0
              self.votesAgainst = 0
              self.executed = false
            }
          }
          
          access(all) struct Member {
            access(all) let address: Address
            access(all) let votingPower: UInt64
            
            init(address: Address, votingPower: UInt64) {
              self.address = address
              self.votingPower = votingPower
            }
          }
          
          access(all) fun addMember(address: Address, votingPower: UInt64) {
            self.members[address] = Member(address: address, votingPower: votingPower)
          }
          
          access(all) fun createProposal(creator: Address, description: String): UInt64 {
            pre {
              self.members.containsKey(creator): "Creator must be a member"
            }
            self.proposalCount = self.proposalCount + 1
            let proposal = Proposal(id: self.proposalCount, creator: creator, description: description)
            self.proposals[self.proposalCount] = proposal
            emit ProposalCreated(id: self.proposalCount, creator: creator)
            return self.proposalCount
          }
          
          access(all) fun vote(proposalId: UInt64, voter: Address, support: Bool) {
            pre {
              self.proposals.containsKey(proposalId): "Proposal does not exist"
              self.members.containsKey(voter): "Voter must be a member"
            }
            let proposal = self.proposals[proposalId]!
            let member = self.members[voter]!
            
            if support {
              proposal.votesFor = proposal.votesFor + member.votingPower
            } else {
              proposal.votesAgainst = proposal.votesAgainst + member.votingPower
            }
            self.proposals[proposalId] = proposal
            emit VoteCast(proposalId: proposalId, voter: voter, support: support)
          }
          
          init() {
            self.proposalCount = 0
            self.proposals = {}
            self.members = {}
          }
        }
      `)

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 75 }
      )

      // Baseline quality requirements for DAO
      expect(result.qualityScore).toBeGreaterThanOrEqual(75)
      expect(result.code).toContain('struct Proposal')
      expect(result.code).toContain('struct Member')
      expect(result.code).toContain('createProposal')
      expect(result.code).toContain('vote')
      expect(result.code).toContain('addMember')
      expect(result.fallbackUsed).toBe(false)
    })
  })

  describe('Undefined Value Detection Regression', () => {
    test('should consistently detect all undefined value patterns', async () => {
      const testCases = [
        {
          name: 'literal undefined',
          code: 'access(all) var value: String = undefined',
          shouldDetect: true
        },
        {
          name: 'undefined in function return',
          code: 'access(all) fun getValue(): String { return undefined }',
          shouldDetect: true
        },
        {
          name: 'undefined in resource init',
          code: 'init() { self.value = undefined }',
          shouldDetect: true
        },
        {
          name: 'undefined in array',
          code: 'access(all) var items: [String] = [undefined, "test"]',
          shouldDetect: true
        },
        {
          name: 'undefined in dictionary',
          code: 'access(all) var mapping: {String: String} = {"key": undefined}',
          shouldDetect: true
        },
        {
          name: 'valid code without undefined',
          code: 'access(all) var value: String = "test"',
          shouldDetect: false
        },
        {
          name: 'string containing undefined',
          code: 'access(all) var message: String = "This contains undefined word"',
          shouldDetect: false
        }
      ]

      for (const testCase of testCases) {
        const result = undefinedDetector.scanForUndefinedValues(testCase.code)
        
        if (testCase.shouldDetect) {
          expect(result.hasBlockingIssues).toBe(true)
          expect(result.totalIssues).toBeGreaterThan(0)
        } else {
          expect(result.hasBlockingIssues).toBe(false)
          expect(result.totalIssues).toBe(0)
        }
      }
    })

    test('should maintain detection accuracy for complex undefined patterns', async () => {
      const complexCode = `
        access(all) contract ComplexUndefined {
          access(all) var validValue: String = "test"
          access(all) var undefinedValue: String = undefined
          access(all) var anotherValid: Int = 42
          
          access(all) resource TestResource {
            access(all) var resourceValue: String = undefined
            access(all) var validResourceValue: Int = 100
            
            init() {
              self.resourceValue = undefined
              self.validResourceValue = 200
            }
            
            destroy() {}
          }
          
          access(all) fun validFunction(): String {
            return "valid"
          }
          
          access(all) fun undefinedFunction(): String {
            return undefined
          }
          
          access(all) fun complexFunction(): {String: String} {
            return {
              "valid": "value",
              "invalid": undefined,
              "another": "valid"
            }
          }
          
          init() {
            self.validValue = "initialized"
            self.undefinedValue = undefined
            self.anotherValid = undefined
          }
        }
      `

      const result = undefinedDetector.scanForUndefinedValues(complexCode)
      
      expect(result.hasBlockingIssues).toBe(true)
      expect(result.totalIssues).toBe(6) // Should detect exactly 6 undefined occurrences
      expect(result.criticalIssues).toBe(6) // All should be critical
      expect(result.issues).toHaveLength(6)
      
      // Verify specific patterns are detected
      const issueTypes = result.issues.map(issue => issue.type)
      expect(issueTypes).toContain('literal-undefined')
    })
  })

  describe('Auto-Correction Regression', () => {
    test('should maintain correction accuracy for undefined values', async () => {
      const testCases = [
        {
          name: 'string undefined',
          input: 'access(all) var name: String = undefined',
          expectedPattern: /access\(all\) var name: String = ""/
        },
        {
          name: 'integer undefined',
          input: 'access(all) var count: Int = undefined',
          expectedPattern: /access\(all\) var count: Int = 0/
        },
        {
          name: 'boolean undefined',
          input: 'access(all) var flag: Bool = undefined',
          expectedPattern: /access\(all\) var flag: Bool = false/
        },
        {
          name: 'UFix64 undefined',
          input: 'access(all) var amount: UFix64 = undefined',
          expectedPattern: /access\(all\) var amount: UFix64 = 0\.0/
        },
        {
          name: 'array undefined',
          input: 'access(all) var items: [String] = undefined',
          expectedPattern: /access\(all\) var items: \[String\] = \[\]/
        },
        {
          name: 'dictionary undefined',
          input: 'access(all) var mapping: {String: String} = undefined',
          expectedPattern: /access\(all\) var mapping: \{String: String\} = \{\}/
        }
      ]

      const context: GenerationContext = {
        userPrompt: 'Test correction',
        contractType: { category: 'utility', complexity: 'simple', features: [] } as ContractType,
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 75,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 20000,
            maxValidationTime: 3000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements,
        userExperience: 'intermediate'
      }

      for (const testCase of testCases) {
        const result = await correctionEngine.correctCode(testCase.input, context)
        
        expect(result.success).toBe(true)
        expect(result.correctedCode).toMatch(testCase.expectedPattern)
        expect(result.correctedCode).not.toContain('undefined')
        expect(result.correctionsApplied).toHaveLength(1)
        expect(result.correctionsApplied[0].type).toBe('undefined-fix')
      }
    })

    test('should maintain correction quality for complex scenarios', async () => {
      const complexInput = `
        access(all) contract TestContract {
          access(all) var name: String = undefined
          access(all) var count: Int = undefined
          access(all) var items: [String] = undefined
          
          access(all) resource TestResource {
            access(all) var value: UFix64 = undefined
            
            init() {
              self.value = undefined
            }
            
            destroy() {}
          }
          
          access(all) fun testFunction(): String {
            return undefined
          }
          
          init() {
            self.name = undefined
            self.count = undefined
            self.items = undefined
          }
        }
      `

      const context: GenerationContext = {
        userPrompt: 'Complex correction test',
        contractType: { category: 'utility', complexity: 'intermediate', features: [] } as ContractType,
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 80,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 25000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements,
        userExperience: 'expert'
      }

      const result = await correctionEngine.correctCode(complexInput, context)
      
      expect(result.success).toBe(true)
      expect(result.correctedCode).not.toContain('undefined')
      expect(result.correctionsApplied.length).toBeGreaterThan(5)
      
      // Verify specific corrections
      expect(result.correctedCode).toContain('var name: String = ""')
      expect(result.correctedCode).toContain('var count: Int = 0')
      expect(result.correctedCode).toContain('var items: [String] = []')
      expect(result.correctedCode).toContain('var value: UFix64 = 0.0')
      expect(result.correctedCode).toContain('return ""') // String function should return empty string
    })
  })

  describe('Quality Score Calculation Regression', () => {
    test('should maintain consistent scoring for high-quality code', async () => {
      const highQualityValidationResults = [
        {
          type: 'syntax' as const,
          passed: true,
          issues: [],
          score: 100
        },
        {
          type: 'logic' as const,
          passed: true,
          issues: [],
          score: 95
        },
        {
          type: 'completeness' as const,
          passed: true,
          issues: [],
          score: 90
        },
        {
          type: 'best-practices' as const,
          passed: true,
          issues: [],
          score: 85
        }
      ]

      const qualityScore = qualityCalculator.calculateQualityScore(highQualityValidationResults, {
        contractType: { category: 'nft', complexity: 'intermediate', features: [] } as ContractType,
        requirements: {
          minimumQualityScore: 80,
          requiredFeatures: [],
          prohibitedPatterns: [],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements
      })

      expect(qualityScore.overall).toBeGreaterThanOrEqual(85)
      expect(qualityScore.syntax).toBe(100)
      expect(qualityScore.logic).toBe(95)
      expect(qualityScore.completeness).toBe(90)
      expect(qualityScore.bestPractices).toBe(85)
      expect(qualityScore.productionReadiness).toBeGreaterThanOrEqual(85)
    })

    test('should maintain consistent scoring for low-quality code', async () => {
      const lowQualityValidationResults = [
        {
          type: 'syntax' as const,
          passed: false,
          issues: [
            { severity: 'critical' as const, type: 'syntax-error', location: { line: 1, column: 1 }, message: 'Syntax error', autoFixable: false },
            { severity: 'critical' as const, type: 'missing-brace', location: { line: 2, column: 1 }, message: 'Missing brace', autoFixable: true }
          ],
          score: 40
        },
        {
          type: 'logic' as const,
          passed: false,
          issues: [
            { severity: 'critical' as const, type: 'logic-error', location: { line: 3, column: 1 }, message: 'Logic error', autoFixable: false }
          ],
          score: 30
        },
        {
          type: 'completeness' as const,
          passed: false,
          issues: [
            { severity: 'warning' as const, type: 'incomplete', location: { line: 4, column: 1 }, message: 'Incomplete', autoFixable: true }
          ],
          score: 60
        },
        {
          type: 'best-practices' as const,
          passed: false,
          issues: [
            { severity: 'critical' as const, type: 'undefined-value', location: { line: 5, column: 1 }, message: 'Undefined value', autoFixable: true }
          ],
          score: 20
        }
      ]

      const qualityScore = qualityCalculator.calculateQualityScore(lowQualityValidationResults, {
        contractType: { category: 'utility', complexity: 'simple', features: [] } as ContractType,
        requirements: {
          minimumQualityScore: 70,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 20000,
            maxValidationTime: 3000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements
      })

      expect(qualityScore.overall).toBeLessThan(50)
      expect(qualityScore.syntax).toBe(40)
      expect(qualityScore.logic).toBe(30)
      expect(qualityScore.completeness).toBe(60)
      expect(qualityScore.bestPractices).toBe(20)
      expect(qualityScore.productionReadiness).toBeLessThan(40)
    })
  })

  describe('Fallback Generation Regression', () => {
    test('should maintain fallback quality for NFT contracts', async () => {
      const context: GenerationContext = {
        userPrompt: 'Create an NFT contract with minting',
        contractType: { category: 'nft', complexity: 'intermediate', features: ['minting'] } as ContractType,
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 70,
          requiredFeatures: ['minting'],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements,
        userExperience: 'intermediate'
      }

      const fallbackResult = await fallbackGenerator.generateFallbackContract(
        'Create an NFT contract with minting',
        context
      )

      expect(fallbackResult.code).toBeDefined()
      expect(fallbackResult.code).toContain('contract')
      expect(fallbackResult.code).toContain('resource NFT')
      expect(fallbackResult.code).toContain('mintNFT')
      expect(fallbackResult.code).toContain('init()')
      expect(fallbackResult.code).not.toContain('undefined')
      expect(fallbackResult.code).not.toContain('pub ')
      expect(fallbackResult.qualityScore).toBeGreaterThanOrEqual(60)
      expect(fallbackResult.isGuaranteedWorking).toBe(true)
    })

    test('should maintain fallback quality for fungible token contracts', async () => {
      const context: GenerationContext = {
        userPrompt: 'Create a fungible token contract',
        contractType: { category: 'fungible-token', complexity: 'intermediate', features: ['minting'] } as ContractType,
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 70,
          requiredFeatures: ['vault', 'minting'],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements,
        userExperience: 'intermediate'
      }

      const fallbackResult = await fallbackGenerator.generateFallbackContract(
        'Create a fungible token contract',
        context
      )

      expect(fallbackResult.code).toBeDefined()
      expect(fallbackResult.code).toContain('contract')
      expect(fallbackResult.code).toContain('resource Vault')
      expect(fallbackResult.code).toContain('withdraw')
      expect(fallbackResult.code).toContain('deposit')
      expect(fallbackResult.code).toContain('totalSupply')
      expect(fallbackResult.code).not.toContain('undefined')
      expect(fallbackResult.qualityScore).toBeGreaterThanOrEqual(60)
      expect(fallbackResult.isGuaranteedWorking).toBe(true)
    })

    test('should maintain fallback quality for DAO contracts', async () => {
      const context: GenerationContext = {
        userPrompt: 'Create a DAO governance contract',
        contractType: { category: 'dao', complexity: 'advanced', features: ['voting', 'proposals'] } as ContractType,
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 65,
          requiredFeatures: ['voting', 'proposals'],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 35000,
            maxValidationTime: 7000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements,
        userExperience: 'expert'
      }

      const fallbackResult = await fallbackGenerator.generateFallbackContract(
        'Create a DAO governance contract',
        context
      )

      expect(fallbackResult.code).toBeDefined()
      expect(fallbackResult.code).toContain('contract')
      expect(fallbackResult.code).toContain('proposal')
      expect(fallbackResult.code).toContain('vote')
      expect(fallbackResult.code).toContain('member')
      expect(fallbackResult.code).not.toContain('undefined')
      expect(fallbackResult.qualityScore).toBeGreaterThanOrEqual(55)
      expect(fallbackResult.isGuaranteedWorking).toBe(true)
    })
  })

  describe('Performance Regression', () => {
    test('should maintain validation performance for medium-sized contracts', async () => {
      const mediumContract = `
        access(all) contract MediumContract {
          access(all) var totalSupply: UInt64
          access(all) var name: String
          access(all) var symbol: String
          
          ${Array.from({ length: 20 }, (_, i) => `
          access(all) event Event${i}(value${i}: String)
          `).join('')}
          
          ${Array.from({ length: 15 }, (_, i) => `
          access(all) fun function${i}(param${i}: String): String {
            return param${i}
          }
          `).join('')}
          
          access(all) resource TestResource {
            access(all) let id: UInt64
            access(all) var metadata: {String: String}
            
            init(id: UInt64) {
              self.id = id
              self.metadata = {}
            }
            
            destroy() {}
          }
          
          init() {
            self.totalSupply = 0
            self.name = "Medium Contract"
            self.symbol = "MED"
          }
        }
      `

      const startTime = Date.now()
      const result = await validationSystem.validateCode(mediumContract)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
      expect(result.isValid).toBe(true)
      expect(result.overallScore).toBeGreaterThan(80)
      expect(result.completenessPercentage).toBeGreaterThan(85)
    })

    test('should maintain correction performance for code with multiple issues', async () => {
      const problematicCode = `
        access(all) contract ProblematicContract {
          access(all) var value1: String = undefined
          access(all) var value2: Int = undefined
          access(all) var value3: Bool = undefined
          access(all) var value4: UFix64 = undefined
          access(all) var value5: [String] = undefined
          access(all) var value6: {String: String} = undefined
          
          access(all) fun function1(): String {
            return undefined
          }
          
          access(all) fun function2(): Int {
            return undefined
          }
          
          access(all) fun function3(): Bool {
            return undefined
          }
          
          init() {
            self.value1 = undefined
            self.value2 = undefined
            self.value3 = undefined
            self.value4 = undefined
            self.value5 = undefined
            self.value6 = undefined
          }
        }
      `

      const context: GenerationContext = {
        userPrompt: 'Performance test contract',
        contractType: { category: 'utility', complexity: 'intermediate', features: [] } as ContractType,
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 75,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 25000,
            maxValidationTime: 3000,
            maxRetryAttempts: 3
          }
        } as QualityRequirements,
        userExperience: 'intermediate'
      }

      const startTime = Date.now()
      const result = await correctionEngine.correctCode(problematicCode, context)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1500) // Should complete within 1.5 seconds
      expect(result.success).toBe(true)
      expect(result.correctedCode).not.toContain('undefined')
      expect(result.correctionsApplied.length).toBeGreaterThan(10)
    })
  })

  describe('Integration Stability', () => {
    test('should maintain stable integration between all components', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a comprehensive marketplace contract',
        context: 'Full-featured marketplace for regression testing',
        temperature: 0.7,
        maxRetries: 3,
        strictMode: false
      }

      // Test with a generation function that requires multiple attempts
      let attemptCount = 0
      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        attemptCount++
        
        if (attemptCount === 1) {
          return `
            access(all) contract BrokenMarketplace {
              access(all) var listings: {UInt64: Listing} = undefined
              access(all) var nextId: UInt64 = undefined
              
              init() {
                // Missing initialization
              }
            }
          `
        } else if (attemptCount === 2) {
          return `
            access(all) contract IncompleteMarketplace {
              access(all) var listings: {UInt64: Listing}
              access(all) var nextId: UInt64
              
              access(all) fun createListing() {
                // Missing implementation
              }
              
              init() {
                self.listings = {}
                self.nextId = 1
              }
            }
          `
        } else {
          return `
            access(all) contract StableMarketplace {
              access(all) var listings: {UInt64: Listing}
              access(all) var nextId: UInt64
              
              access(all) event ListingCreated(id: UInt64, seller: Address)
              access(all) event ListingPurchased(id: UInt64, buyer: Address)
              
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
                let listing = Listing(id: self.nextId, seller: seller, price: price)
                self.listings[self.nextId] = listing
                emit ListingCreated(id: self.nextId, seller: seller)
                self.nextId = self.nextId + 1
                return self.nextId - 1
              }
              
              access(all) fun purchaseListing(id: UInt64, buyer: Address) {
                pre {
                  self.listings.containsKey(id): "Listing does not exist"
                  self.listings[id]!.active: "Listing is not active"
                }
                let listing = self.listings[id]!
                listing.active = false
                self.listings[id] = listing
                emit ListingPurchased(id: id, buyer: buyer)
              }
              
              access(all) view fun getListing(id: UInt64): Listing? {
                return self.listings[id]
              }
              
              init() {
                self.listings = {}
                self.nextId = 1
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
          enableFallbackGeneration: true,
          qualityThreshold: 80,
          maxRetries: 3
        }
      )

      // Verify stable integration
      expect(result.code).toBeDefined()
      expect(result.qualityScore).toBeGreaterThanOrEqual(80)
      expect(result.fallbackUsed).toBe(false)
      expect(result.generationMetrics.attemptCount).toBe(3)
      expect(result.code).toContain('StableMarketplace')
      expect(result.code).toContain('createListing')
      expect(result.code).toContain('purchaseListing')
      expect(result.code).not.toContain('undefined')
      expect(result.correctionHistory.length).toBeGreaterThan(0)
      expect(result.generationMetrics.issuesFixed).toBeGreaterThan(0)
    })
  })
})