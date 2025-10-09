/**
 * Integration tests for enhanced prompt system in AI generation
 * 
 * These tests verify that enhanced prompts produce higher quality code
 * and effectively prevent common issues like undefined values and syntax errors.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { VibeSDK } from '../../vibesdk'
import { PromptEnhancer } from '../prompt-enhancer'
import { GenerationContext, FailurePattern, QualityRequirements } from '../types'

// Mock the AI SDK to control responses for testing
vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn()
}))

// Mock the code validator
vi.mock('../../../lib/migration/code-validator', () => ({
  codeValidator: {
    validateCode: vi.fn(),
    shouldRejectCode: vi.fn()
  }
}))

describe('Enhanced Prompt Integration Tests', () => {
  let vibeSDK: VibeSDK
  let mockGenerateText: any
  let mockValidateCode: any
  let mockShouldRejectCode: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Import mocked functions
    const { generateText } = require('ai')
    const { codeValidator } = require('../../../lib/migration/code-validator')
    
    mockGenerateText = generateText as any
    mockValidateCode = codeValidator.validateCode as any
    mockShouldRejectCode = codeValidator.shouldRejectCode as any
    
    // Create fresh VibeSDK instance
    vibeSDK = new VibeSDK()
    
    // Set up environment for AI availability
    process.env.OPENAI_API_KEY = 'test-key'
  })

  afterEach(() => {
    // Clean up environment
    delete process.env.OPENAI_API_KEY
  })

  describe('Quality-Focused Prompt Enhancement', () => {
    it('should enhance prompts to prevent undefined values', async () => {
      // Mock AI response with undefined values (simulating poor quality)
      mockGenerateText
        .mockResolvedValueOnce({
          text: 'access(all) contract Test { access(all) var value: String = undefined }'
        })
        .mockResolvedValueOnce({
          text: 'access(all) contract Test { access(all) var value: String = "initialized" }'
        })

      // Mock validation to reject first attempt, accept second
      mockValidateCode
        .mockReturnValueOnce({ isValid: false, errors: ['Contains undefined values'] })
        .mockReturnValueOnce({ isValid: true, errors: [] })

      mockShouldRejectCode
        .mockReturnValueOnce({ shouldReject: true, reason: 'Contains undefined values' })
        .mockReturnValueOnce({ shouldReject: false, reason: '' })

      const result = await vibeSDK.generateCode({
        prompt: 'Create a simple contract with a string variable'
      })

      // Verify the final result doesn't contain undefined
      expect(result).not.toContain('undefined')
      expect(result).toContain('initialized')
      
      // Verify that generateText was called twice (retry mechanism)
      expect(mockGenerateText).toHaveBeenCalledTimes(2)
      
      // Verify the second call used enhanced prompts with failure prevention
      const secondCall = mockGenerateText.mock.calls[1][0]
      expect(secondCall.system).toContain('NEVER use "undefined" values')
      expect(secondCall.system).toContain('undefined-values')
    })

    it('should progressively enhance prompts with each retry attempt', async () => {
      // Mock multiple failed attempts followed by success
      mockGenerateText
        .mockResolvedValueOnce({ text: 'pub contract Test { }' }) // Legacy syntax
        .mockResolvedValueOnce({ text: 'access(all) contract Test { var x = undefined }' }) // Undefined values
        .mockResolvedValueOnce({ text: 'access(all) contract Test { access(all) var x: String = "test" }' }) // Success

      // Mock validation failures for first two attempts
      mockValidateCode
        .mockReturnValueOnce({ isValid: false, errors: ['Legacy syntax'] })
        .mockReturnValueOnce({ isValid: false, errors: ['Undefined values'] })
        .mockReturnValueOnce({ isValid: true, errors: [] })

      mockShouldRejectCode
        .mockReturnValueOnce({ shouldReject: true, reason: 'Legacy pub keyword' })
        .mockReturnValueOnce({ shouldReject: true, reason: 'Contains undefined' })
        .mockReturnValueOnce({ shouldReject: false, reason: '' })

      const result = await vibeSDK.generateCode({
        prompt: 'Create a contract'
      })

      // Verify progressive enhancement
      expect(mockGenerateText).toHaveBeenCalledTimes(3)
      
      // Check that each call had increasingly strict prompts
      const calls = mockGenerateText.mock.calls
      
      // First call should be basic enhancement
      expect(calls[0][0].temperature).toBeGreaterThan(calls[1][0].temperature)
      
      // Second call should be more strict
      expect(calls[1][0].temperature).toBeGreaterThan(calls[2][0].temperature)
      
      // Third call should be maximum strictness
      expect(calls[2][0].system).toContain('STRICT')
      expect(calls[2][0].temperature).toBeLessThan(0.5)
    })

    it('should adapt prompts based on contract type', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'access(all) contract NFTContract { }'
      })
      
      mockValidateCode.mockReturnValue({ isValid: true, errors: [] })
      mockShouldRejectCode.mockReturnValue({ shouldReject: false, reason: '' })

      await vibeSDK.generateCode({
        prompt: 'Create an NFT contract with metadata support'
      })

      const systemPrompt = mockGenerateText.mock.calls[0][0].system
      
      // Verify NFT-specific requirements are included
      expect(systemPrompt).toContain('NFT CONTRACT SPECIFIC REQUIREMENTS')
      expect(systemPrompt).toContain('MetadataViews')
      expect(systemPrompt).toContain('NonFungibleToken')
      expect(systemPrompt).toContain('collection interfaces')
    })

    it('should adjust prompts based on user experience level', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'access(all) contract BeginnerContract { }'
      })
      
      mockValidateCode.mockReturnValue({ isValid: true, errors: [] })
      mockShouldRejectCode.mockReturnValue({ shouldReject: false, reason: '' })

      // Test beginner-level prompt
      await vibeSDK.generateCode({
        prompt: 'I am new to blockchain. Create a simple contract to store a message.'
      })

      const systemPrompt = mockGenerateText.mock.calls[0][0].system
      
      // Verify beginner-specific enhancements
      expect(systemPrompt).toContain('BEGINNER-FRIENDLY REQUIREMENTS')
      expect(systemPrompt).toContain('extensive comments')
      expect(systemPrompt).toContain('explanatory comments')
    })

    it('should include failure-specific prevention rules', async () => {
      // First call fails with undefined values
      mockGenerateText
        .mockResolvedValueOnce({ text: 'access(all) contract Test { var x = undefined }' })
        .mockResolvedValueOnce({ text: 'access(all) contract Test { access(all) var x: String = "value" }' })

      mockValidateCode
        .mockReturnValueOnce({ isValid: false, errors: ['Undefined values detected'] })
        .mockReturnValueOnce({ isValid: true, errors: [] })

      mockShouldRejectCode
        .mockReturnValueOnce({ shouldReject: true, reason: 'Contains undefined values' })
        .mockReturnValueOnce({ shouldReject: false, reason: '' })

      await vibeSDK.generateCode({
        prompt: 'Create a contract'
      })

      // Check that the retry call includes specific failure prevention
      const retryCall = mockGenerateText.mock.calls[1][0]
      expect(retryCall.system).toContain('CRITICAL FAILURE PREVENTION')
      expect(retryCall.system).toContain('undefined-values')
      expect(retryCall.system).toContain('These issues MUST be completely avoided')
    })
  })

  describe('PromptEnhancer Unit Tests', () => {
    it('should create quality-focused system prompts', () => {
      const context: GenerationContext = {
        userPrompt: 'Create an NFT contract',
        contractType: {
          category: 'nft',
          complexity: 'intermediate',
          features: ['metadata', 'royalties']
        },
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 90,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined', 'pub '],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        },
        userExperience: 'intermediate'
      }

      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create an NFT contract',
        context
      )

      // Verify quality-focused instructions are included
      expect(enhanced.systemPrompt).toContain('NEVER use "undefined" values')
      expect(enhanced.systemPrompt).toContain('NEVER use "pub" keyword')
      expect(enhanced.systemPrompt).toContain('ALWAYS use "access(all)"')
      expect(enhanced.systemPrompt).toContain('UNDEFINED VALUE PREVENTION')
      
      // Verify NFT-specific requirements
      expect(enhanced.systemPrompt).toContain('NFT CONTRACT REQUIREMENTS')
      expect(enhanced.systemPrompt).toContain('NonFungibleToken interface')
      
      // Verify enhancement level
      expect(enhanced.enhancementLevel).toBe('basic')
      expect(enhanced.temperature).toBe(0.7)
    })

    it('should increase strictness with retry attempts', () => {
      const context: GenerationContext = {
        userPrompt: 'Create a contract',
        contractType: {
          category: 'generic',
          complexity: 'simple',
          features: []
        },
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 90,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        },
        userExperience: 'intermediate'
      }

      // Test different attempt numbers
      const attempt1 = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: context.qualityRequirements,
        strictMode: false,
        temperature: 0.7
      })

      const attempt3 = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 3,
        previousFailures: [],
        qualityRequirements: context.qualityRequirements,
        strictMode: false,
        temperature: 0.7
      })

      // Verify progressive strictness
      expect(attempt1.enhancementLevel).toBe('basic')
      expect(attempt3.enhancementLevel).toBe('strict')
      
      // Verify temperature reduction
      expect(attempt3.temperature).toBeLessThan(attempt1.temperature)
      
      // Verify stricter instructions
      expect(attempt3.systemPrompt).toContain('TRIPLE-CHECK')
      expect(attempt3.systemPrompt).toContain('VALIDATE')
    })

    it('should add failure-specific constraints', () => {
      const basePrompt = 'Create a contract'
      const failures: FailurePattern[] = [
        {
          type: 'undefined-values',
          frequency: 1,
          commonCauses: ['Missing initialization'],
          suggestedSolutions: ['Use concrete values']
        },
        {
          type: 'syntax-errors',
          frequency: 1,
          commonCauses: ['Bracket mismatch'],
          suggestedSolutions: ['Check brackets']
        }
      ]

      const enhanced = PromptEnhancer.addQualityConstraints(basePrompt, failures)

      expect(enhanced).toContain('FAILURE PREVENTION')
      expect(enhanced).toContain('undefined values')
      expect(enhanced).toContain('syntax errors')
      expect(enhanced).toContain('These issues MUST be avoided')
    })
  })

  describe('Code Quality Verification', () => {
    it('should generate code without undefined values', async () => {
      mockGenerateText.mockResolvedValue({
        text: `access(all) contract QualityContract {
          access(all) var name: String
          access(all) var counter: UInt64
          
          init() {
            self.name = "Quality Contract"
            self.counter = 0
          }
        }`
      })
      
      mockValidateCode.mockReturnValue({ isValid: true, errors: [] })
      mockShouldRejectCode.mockReturnValue({ shouldReject: false, reason: '' })

      const result = await vibeSDK.generateCode({
        prompt: 'Create a contract with a name and counter'
      })

      // Verify no undefined values
      expect(result).not.toContain('undefined')
      
      // Verify proper initialization
      expect(result).toContain('self.name = "Quality Contract"')
      expect(result).toContain('self.counter = 0')
      
      // Verify modern syntax
      expect(result).toContain('access(all)')
      expect(result).not.toContain('pub ')
    })

    it('should generate complete function implementations', async () => {
      mockGenerateText.mockResolvedValue({
        text: `access(all) contract CompleteContract {
          access(all) var value: String
          
          init() {
            self.value = "initialized"
          }
          
          access(all) fun setValue(newValue: String) {
            pre {
              newValue.length > 0: "Value cannot be empty"
            }
            self.value = newValue
          }
          
          access(all) view fun getValue(): String {
            return self.value
          }
        }`
      })
      
      mockValidateCode.mockReturnValue({ isValid: true, errors: [] })
      mockShouldRejectCode.mockReturnValue({ shouldReject: false, reason: '' })

      const result = await vibeSDK.generateCode({
        prompt: 'Create a contract with getter and setter functions'
      })

      // Verify complete function implementations
      expect(result).toContain('fun setValue(newValue: String) {')
      expect(result).toContain('self.value = newValue')
      expect(result).toContain('fun getValue(): String {')
      expect(result).toContain('return self.value')
      
      // Verify proper error handling
      expect(result).toContain('pre {')
      expect(result).toContain('newValue.length > 0')
    })

    it('should use modern Cadence 1.0 syntax exclusively', async () => {
      mockGenerateText.mockResolvedValue({
        text: `access(all) contract ModernContract {
          access(all) let StoragePath: StoragePath
          
          init() {
            self.StoragePath = /storage/ModernContract
            
            let resource <- create Resource()
            self.account.storage.save(<-resource, to: self.StoragePath)
            
            let cap = self.account.capabilities.storage.issue<&Resource>(self.StoragePath)
            self.account.capabilities.publish(cap, at: /public/ModernContract)
          }
          
          access(all) resource Resource {
            access(all) let id: UInt64
            
            init() {
              self.id = 1
            }
          }
        }`
      })
      
      mockValidateCode.mockReturnValue({ isValid: true, errors: [] })
      mockShouldRejectCode.mockReturnValue({ shouldReject: false, reason: '' })

      const result = await vibeSDK.generateCode({
        prompt: 'Create a contract with a resource and storage'
      })

      // Verify modern syntax usage
      expect(result).toContain('access(all)')
      expect(result).toContain('account.storage.save')
      expect(result).toContain('account.capabilities.storage.issue')
      expect(result).toContain('account.capabilities.publish')
      
      // Verify no legacy syntax
      expect(result).not.toContain('pub ')
      expect(result).not.toContain('AuthAccount')
      expect(result).not.toContain('account.save')
      expect(result).not.toContain('account.link')
    })
  })

  describe('Error Recovery and Fallback', () => {
    it('should use fallback when all enhancement attempts fail', async () => {
      // Mock all attempts to fail
      mockGenerateText
        .mockResolvedValueOnce({ text: 'invalid code with undefined' })
        .mockResolvedValueOnce({ text: 'still invalid with undefined' })
        .mockResolvedValueOnce({ text: 'final attempt with undefined' })

      mockValidateCode.mockReturnValue({ isValid: false, errors: ['Invalid code'] })
      mockShouldRejectCode.mockReturnValue({ shouldReject: true, reason: 'Contains undefined' })

      const result = await vibeSDK.generateCode({
        prompt: 'Create a simple contract'
      })

      // Should fall back to mock response which is guaranteed to be quality
      expect(result).toContain('access(all) contract GeneratedContract')
      expect(result).not.toContain('undefined')
      expect(result).toContain('Perfect Cadence 1.0')
      
      // Verify all retry attempts were made
      expect(mockGenerateText).toHaveBeenCalledTimes(3)
    })

    it('should provide quality-focused error messages', async () => {
      // Test the validation and rejection methods directly
      const testCode = 'pub contract Test { var x = undefined }'
      
      mockValidateCode.mockReturnValue({
        isValid: false,
        errors: ['Legacy pub keyword', 'Undefined value detected']
      })
      
      mockShouldRejectCode.mockReturnValue({
        shouldReject: true,
        reason: 'Contains undefined values and legacy syntax'
      })

      const validation = vibeSDK.validateGeneratedCode(testCode)
      const rejection = vibeSDK.shouldRejectGeneratedCode(testCode)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Legacy pub keyword')
      expect(validation.errors).toContain('Undefined value detected')
      
      expect(rejection.shouldReject).toBe(true)
      expect(rejection.reason).toContain('undefined values')
      expect(rejection.reason).toContain('legacy syntax')
    })
  })

  describe('Performance and Metrics', () => {
    it('should track generation attempts and quality improvements', async () => {
      // Mock successful generation on second attempt
      mockGenerateText
        .mockResolvedValueOnce({ text: 'access(all) contract Test { var x = undefined }' })
        .mockResolvedValueOnce({ text: 'access(all) contract Test { access(all) var x: String = "value" }' })

      mockValidateCode
        .mockReturnValueOnce({ isValid: false, errors: ['Undefined values'] })
        .mockReturnValueOnce({ isValid: true, errors: [] })

      mockShouldRejectCode
        .mockReturnValueOnce({ shouldReject: true, reason: 'Contains undefined' })
        .mockReturnValueOnce({ shouldReject: false, reason: '' })

      const startTime = Date.now()
      const result = await vibeSDK.generateCode({
        prompt: 'Create a contract'
      })
      const endTime = Date.now()

      // Verify successful generation
      expect(result).not.toContain('undefined')
      expect(result).toContain('value')
      
      // Verify retry mechanism worked
      expect(mockGenerateText).toHaveBeenCalledTimes(2)
      
      // Verify reasonable performance (should be fast in test environment)
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
})