/**
 * Tests for the Prompt Enhancement System
 * 
 * These tests verify that the prompt enhancement system correctly:
 * - Enhances prompts with quality-focused instructions
 * - Prevents undefined values in generation
 * - Implements progressive enhancement for retry attempts
 * - Creates context-aware modifications based on failures
 */

import { PromptEnhancer } from '../prompt-enhancer'
import { GenerationContext, FailurePattern, ValidationIssue } from '../types'

describe('PromptEnhancer', () => {
  const mockContext: GenerationContext = {
    userPrompt: 'Create an NFT contract',
    contractType: {
      category: 'nft',
      complexity: 'intermediate',
      features: ['metadata', 'minting']
    },
    previousAttempts: [],
    qualityRequirements: {
      minimumQualityScore: 80,
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

  describe('enhancePromptForQuality', () => {
    it('should enhance basic prompt with quality instructions', () => {
      const result = PromptEnhancer.enhancePromptForQuality(
        'Create an NFT contract',
        mockContext
      )

      expect(result.systemPrompt).toContain('CRITICAL QUALITY REQUIREMENTS')
      expect(result.systemPrompt).toContain('UNDEFINED VALUE PREVENTION')
      expect(result.systemPrompt).toContain('access(all)')
      expect(result.userPrompt).toContain('ZERO undefined values')
      expect(result.enhancementLevel).toBe('basic')
    })

    it('should increase strictness for retry attempts', () => {
      const result = PromptEnhancer.enhancePromptForQuality(
        'Create an NFT contract',
        mockContext,
        { attemptNumber: 3, previousFailures: [], qualityRequirements: mockContext.qualityRequirements, strictMode: false, temperature: 0.7 }
      )

      expect(result.enhancementLevel).toBe('strict')
      expect(result.temperature).toBeLessThan(0.7)
      expect(result.systemPrompt).toContain('TRIPLE-CHECK')
    })
  })

  describe('addQualityConstraints', () => {
    it('should add failure-specific constraints', () => {
      const failures: FailurePattern[] = [
        {
          type: 'undefined-values',
          frequency: 2,
          commonCauses: ['Missing defaults'],
          suggestedSolutions: ['Use concrete values']
        }
      ]

      const result = PromptEnhancer.addQualityConstraints(
        'Create a contract',
        failures
      )

      expect(result).toContain('FAILURE PREVENTION')
      expect(result).toContain('undefined values')
      expect(result).toContain('concrete values')
    })

    it('should handle multiple failure types', () => {
      const failures: FailurePattern[] = [
        {
          type: 'undefined-values',
          frequency: 1,
          commonCauses: [],
          suggestedSolutions: []
        },
        {
          type: 'syntax-errors',
          frequency: 1,
          commonCauses: [],
          suggestedSolutions: []
        }
      ]

      const result = PromptEnhancer.addQualityConstraints(
        'Create a contract',
        failures
      )

      expect(result).toContain('undefined values')
      expect(result).toContain('syntax errors')
    })
  })

  describe('incorporateLearnings', () => {
    it('should incorporate quality history learnings', () => {
      const qualityHistory = [
        {
          issues: [
            {
              severity: 'critical' as const,
              type: 'undefined-literal',
              location: { line: 1, column: 1 },
              message: 'Found undefined value',
              autoFixable: true
            }
          ],
          score: 60
        }
      ]

      const result = PromptEnhancer.incorporateLearnings(
        'Create a contract',
        qualityHistory
      )

      expect(result).toContain('QUALITY LEARNINGS')
      expect(result).toContain('undefined')
      expect(result).toContain('default values')
    })
  })

  describe('createContextAwareModifications', () => {
    it('should add NFT-specific requirements', () => {
      const nftContext: GenerationContext = {
        ...mockContext,
        contractType: {
          category: 'nft',
          complexity: 'intermediate',
          features: ['metadata']
        }
      }

      const result = PromptEnhancer.createContextAwareModifications(
        'Create an NFT contract',
        nftContext
      )

      expect(result).toContain('NFT CONTRACT SPECIFIC REQUIREMENTS')
      expect(result).toContain('MetadataViews')
      expect(result).toContain('collection interfaces')
    })

    it('should add fungible token specific requirements', () => {
      const tokenContext: GenerationContext = {
        ...mockContext,
        contractType: {
          category: 'fungible-token',
          complexity: 'intermediate',
          features: ['minting']
        }
      }

      const result = PromptEnhancer.createContextAwareModifications(
        'Create a token contract',
        tokenContext
      )

      expect(result).toContain('FUNGIBLE TOKEN SPECIFIC REQUIREMENTS')
      expect(result).toContain('FungibleToken interface')
      expect(result).toContain('vault resource')
    })

    it('should adjust for user experience level', () => {
      const beginnerContext: GenerationContext = {
        ...mockContext,
        userExperience: 'beginner'
      }

      const result = PromptEnhancer.createContextAwareModifications(
        'Create a contract',
        beginnerContext
      )

      expect(result).toContain('BEGINNER-FRIENDLY REQUIREMENTS')
      expect(result).toContain('extensive comments')
      expect(result).toContain('clear, descriptive')
    })
  })

  describe('progressive enhancement levels', () => {
    it('should use basic level for first attempt', () => {
      const result = PromptEnhancer.enhancePromptForQuality(
        'Create a contract',
        mockContext,
        { attemptNumber: 1, previousFailures: [], qualityRequirements: mockContext.qualityRequirements, strictMode: false, temperature: 0.7 }
      )

      expect(result.enhancementLevel).toBe('basic')
      expect(result.temperature).toBe(0.7)
    })

    it('should use strict mode when enabled', () => {
      const result = PromptEnhancer.enhancePromptForQuality(
        'Create a contract',
        mockContext,
        { attemptNumber: 1, previousFailures: [], qualityRequirements: mockContext.qualityRequirements, strictMode: true, temperature: 0.7 }
      )

      expect(result.enhancementLevel).toBe('strict')
      expect(result.temperature).toBeLessThan(0.7)
    })

    it('should use maximum level for final attempts', () => {
      const result = PromptEnhancer.enhancePromptForQuality(
        'Create a contract',
        mockContext,
        { attemptNumber: 4, previousFailures: [], qualityRequirements: mockContext.qualityRequirements, strictMode: false, temperature: 0.7 }
      )

      expect(result.enhancementLevel).toBe('maximum')
      expect(result.temperature).toBe(0.1)
      expect(result.systemPrompt).toContain('EXTREME VALIDATION')
    })
  })

  describe('undefined value prevention', () => {
    it('should include comprehensive undefined prevention rules', () => {
      const result = PromptEnhancer.enhancePromptForQuality(
        'Create a contract',
        mockContext
      )

      expect(result.systemPrompt).toContain('UNDEFINED VALUE PREVENTION')
      expect(result.systemPrompt).toContain('NEVER write "undefined"')
      expect(result.systemPrompt).toContain('String variables: use ""')
      expect(result.systemPrompt).toContain('UInt64 variables: use 0')
      expect(result.systemPrompt).toContain('Arrays: use []')
    })

    it('should emphasize undefined prevention in user prompt', () => {
      const result = PromptEnhancer.enhancePromptForQuality(
        'Create a contract',
        mockContext
      )

      expect(result.userPrompt).toContain('ZERO undefined values')
      expect(result.userPrompt).toContain('All variables properly initialized')
    })
  })

  describe('quality constraints', () => {
    it('should build comprehensive quality constraints', () => {
      const result = PromptEnhancer.enhancePromptForQuality(
        'Create a contract',
        mockContext
      )

      expect(result.qualityConstraints.syntaxRequirements).toContain('Use access(all) instead of pub')
      expect(result.qualityConstraints.completenessRequirements).toContain('All functions fully implemented')
      expect(result.qualityConstraints.errorPreventionRules).toContain('No undefined values anywhere')
      expect(result.qualityConstraints.undefinedValuePrevention).toContain('String variables must have concrete values')
    })
  })
})