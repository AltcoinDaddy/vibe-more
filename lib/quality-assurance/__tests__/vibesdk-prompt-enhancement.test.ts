/**
 * VibeSDK Prompt Enhancement Integration Tests
 * 
 * These tests verify that the VibeSDK correctly uses enhanced prompts
 * and that the enhanced prompts produce higher quality code.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VibeSDK } from '../../vibesdk'
import { generateText } from 'ai'

// Mock the AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn()
}))

const mockGenerateText = vi.mocked(generateText)

describe('VibeSDK Prompt Enhancement Integration', () => {
  let vibeSDK: VibeSDK

  beforeEach(() => {
    // Set up environment to use AI provider for testing
    process.env.OPENAI_API_KEY = 'test-key'
    vibeSDK = new VibeSDK()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.OPENAI_API_KEY
  })

  describe('Enhanced Prompt Usage in Code Generation', () => {
    it('should use enhanced prompts with quality focus', async () => {
      // Mock successful AI response
      mockGenerateText.mockResolvedValue({
        text: `access(all) contract TestNFT {
          access(all) var totalSupply: UInt64
          
          init() {
            self.totalSupply = 0
          }
          
          access(all) fun getTotalSupply(): UInt64 {
            return self.totalSupply
          }
        }`
      })

      await vibeSDK.generateCode({
        prompt: 'Create a simple NFT contract',
        temperature: 0.7
      })

      // Verify generateText was called with enhanced prompts
      expect(mockGenerateText).toHaveBeenCalledTimes(1)
      const callArgs = mockGenerateText.mock.calls[0][0]
      
      // Verify system prompt contains quality enhancements
      expect(callArgs.system).toContain('CRITICAL QUALITY REQUIREMENTS')
      expect(callArgs.system).toContain('NEVER use "undefined" values')
      expect(callArgs.system).toContain('UNDEFINED VALUE PREVENTION')
      expect(callArgs.system).toContain('access(all)')
      expect(callArgs.system).toContain('ALWAYS use "access(all)"')
      
      // Verify user prompt is enhanced
      expect(callArgs.prompt).toContain('PERFECT Cadence 1.0 smart contract')
      expect(callArgs.prompt).toContain('ZERO undefined values')
      expect(callArgs.prompt).toContain('Complete, production-ready implementation')
    })

    it('should use progressive enhancement for retry attempts', async () => {
      // Mock first attempt with undefined values (should trigger retry)
      mockGenerateText
        .mockResolvedValueOnce({
          text: `access(all) contract BadContract {
            access(all) var value: String = undefined
          }`
        })
        .mockResolvedValueOnce({
          text: `access(all) contract GoodContract {
            access(all) var value: String = ""
            
            init() {
              self.value = "initialized"
            }
          }`
        })

      await vibeSDK.generateCode({
        prompt: 'Create a simple contract',
        temperature: 0.7
      })

      // Verify multiple calls were made (retry logic)
      expect(mockGenerateText).toHaveBeenCalledTimes(2)
      
      // Verify second call has enhanced prompts for retry
      const secondCallArgs = mockGenerateText.mock.calls[1][0]
      expect(secondCallArgs.system).toContain('MODERATE (Attempt 2)')
      expect(secondCallArgs.prompt).toContain('RETRY ATTEMPT 2')
    })

    it('should include contract-type-specific enhancements', async () => {
      mockGenerateText.mockResolvedValue({
        text: `access(all) contract TestNFT {
          access(all) var totalSupply: UInt64
          init() { self.totalSupply = 0 }
        }`
      })

      await vibeSDK.generateCode({
        prompt: 'Create an NFT contract with metadata support',
        temperature: 0.7
      })

      const callArgs = mockGenerateText.mock.calls[0][0]
      
      // Verify NFT-specific requirements are included
      expect(callArgs.prompt).toContain('NFT CONTRACT SPECIFIC REQUIREMENTS')
      expect(callArgs.prompt).toContain('MetadataViews')
      expect(callArgs.prompt).toContain('collection interfaces')
    })

    it('should adapt prompts based on user experience level', async () => {
      mockGenerateText.mockResolvedValue({
        text: `access(all) contract SimpleContract {
          access(all) var value: String
          init() { self.value = "" }
        }`
      })

      // Test with beginner-level prompt
      await vibeSDK.generateCode({
        prompt: 'Create a simple contract for learning',
        temperature: 0.7
      })

      const callArgs = mockGenerateText.mock.calls[0][0]
      
      // Verify beginner-friendly enhancements
      expect(callArgs.prompt).toContain('BEGINNER-FRIENDLY')
      expect(callArgs.prompt).toContain('extensive comments')
      expect(callArgs.prompt).toContain('clear, descriptive')
    })
  })

  describe('Quality Validation Integration', () => {
    it('should reject code with undefined values and retry', async () => {
      // Mock responses: first bad, then good
      mockGenerateText
        .mockResolvedValueOnce({
          text: `access(all) contract BadContract {
            access(all) var name: String = undefined
            access(all) var count: UInt64 = undefined
          }`
        })
        .mockResolvedValueOnce({
          text: `access(all) contract GoodContract {
            access(all) var name: String = ""
            access(all) var count: UInt64 = 0
            
            init() {
              self.name = "Test Contract"
              self.count = 0
            }
          }`
        })

      const result = await vibeSDK.generateCode({
        prompt: 'Create a contract with name and count',
        temperature: 0.7
      })

      // Verify retry occurred and final result is good
      expect(mockGenerateText).toHaveBeenCalledTimes(2)
      expect(result).not.toContain('undefined')
      expect(result).toContain('name: String = ""')
      expect(result).toContain('count: UInt64 = 0')
    })

    it('should use fallback when all retry attempts fail', async () => {
      // Mock all attempts to fail
      mockGenerateText
        .mockResolvedValueOnce({ text: 'access(all) contract Bad1 { var x = undefined }' })
        .mockResolvedValueOnce({ text: 'access(all) contract Bad2 { var y = undefined }' })
        .mockResolvedValueOnce({ text: 'access(all) contract Bad3 { var z = undefined }' })
        .mockResolvedValueOnce({ text: 'access(all) contract Bad4 { var w = undefined }' })

      const result = await vibeSDK.generateCode({
        prompt: 'Create a simple contract',
        temperature: 0.7
      })

      // Verify multiple retry attempts were made
      expect(mockGenerateText).toHaveBeenCalledTimes(4)
      
      // Verify fallback was used (should be a perfect mock response)
      expect(result).toContain('Perfect Cadence 1.0')
      expect(result).not.toContain('undefined')
    })
  })

  describe('Enhanced Prompt Features', () => {
    it('should include failure-specific enhancements on retry', async () => {
      // Mock first attempt with syntax errors
      mockGenerateText
        .mockResolvedValueOnce({
          text: `access(all) contract SyntaxError {
            access(all) var value: String = "test"
            // Missing closing brace`
        })
        .mockResolvedValueOnce({
          text: `access(all) contract Fixed {
            access(all) var value: String = "test"
            init() { self.value = "initialized" }
          }`
        })

      await vibeSDK.generateCode({
        prompt: 'Create a contract',
        temperature: 0.7
      })

      // Verify second call includes failure-specific enhancements
      const secondCallArgs = mockGenerateText.mock.calls[1][0]
      expect(secondCallArgs.prompt).toContain('FAILURE PREVENTION')
      expect(secondCallArgs.system).toContain('Double-check all variable initializations')
    })

    it('should use maximum strictness for final attempts', async () => {
      // Mock multiple failures to trigger maximum strictness
      mockGenerateText
        .mockResolvedValue({ text: 'access(all) contract Bad { var x = undefined }' })

      await vibeSDK.generateCode({
        prompt: 'Create a contract',
        temperature: 0.7
      })

      // Verify final attempt uses maximum strictness
      const finalCallArgs = mockGenerateText.mock.calls[3][0] // 4th attempt
      expect(finalCallArgs.system).toContain('EXTREME VALIDATION')
      expect(finalCallArgs.system).toContain('ZERO TOLERANCE')
      expect(finalCallArgs.temperature).toBeLessThan(0.5) // Lower temperature for final attempts
    })
  })

  describe('Context-Aware Enhancement', () => {
    it('should enhance prompts for different contract types', async () => {
      mockGenerateText.mockResolvedValue({
        text: `access(all) contract TestContract { init() {} }`
      })

      // Test DAO contract
      await vibeSDK.generateCode({
        prompt: 'Create a DAO governance contract',
        temperature: 0.7
      })

      const daoCallArgs = mockGenerateText.mock.calls[0][0]
      expect(daoCallArgs.prompt).toContain('DAO CONTRACT SPECIFIC REQUIREMENTS')
      expect(daoCallArgs.prompt).toContain('voting mechanisms')
      expect(daoCallArgs.prompt).toContain('governance controls')

      vi.clearAllMocks()

      // Test marketplace contract
      await vibeSDK.generateCode({
        prompt: 'Create a marketplace contract',
        temperature: 0.7
      })

      const marketplaceCallArgs = mockGenerateText.mock.calls[0][0]
      expect(marketplaceCallArgs.prompt).toContain('MARKETPLACE SPECIFIC REQUIREMENTS')
      expect(marketplaceCallArgs.prompt).toContain('listing and purchasing')
      expect(marketplaceCallArgs.prompt).toContain('escrow patterns')
    })

    it('should adapt temperature based on attempt number', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'access(all) contract Bad { var x = undefined }'
      })

      await vibeSDK.generateCode({
        prompt: 'Create a contract',
        temperature: 0.8
      })

      // Verify temperature decreases with each attempt
      const calls = mockGenerateText.mock.calls
      expect(calls[0][0].temperature).toBe(0.8) // First attempt
      expect(calls[1][0].temperature).toBeLessThan(0.8) // Second attempt
      expect(calls[2][0].temperature).toBeLessThanOrEqual(calls[1][0].temperature) // Third attempt
      expect(calls[3][0].temperature).toBeLessThanOrEqual(calls[2][0].temperature) // Final attempt
    })
  })

  describe('Quality Score Integration', () => {
    it('should include quality score requirements in prompts', async () => {
      mockGenerateText.mockResolvedValue({
        text: `access(all) contract QualityContract {
          access(all) var value: String = ""
          init() { self.value = "high quality" }
        }`
      })

      await vibeSDK.generateCode({
        prompt: 'Create a high-quality contract',
        temperature: 0.7
      })

      const callArgs = mockGenerateText.mock.calls[0][0]
      expect(callArgs.prompt).toContain('QUALITY TARGET')
      expect(callArgs.prompt).toContain('quality score of 90+')
    })
  })
})