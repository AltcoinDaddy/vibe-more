/**
 * Enhanced Prompt Quality Verification Tests
 * 
 * These tests verify that the enhanced prompt system produces higher quality code
 * by testing the prompt enhancement features and validating their effectiveness.
 */

import { describe, it, expect } from 'vitest'
import { VibeSDK } from '../../vibesdk'
import { PromptEnhancer } from '../prompt-enhancer'
import { GenerationContext, FailurePattern, QualityRequirements } from '../types'

describe('Enhanced Prompt Quality Verification', () => {
  const mockContext: GenerationContext = {
    userPrompt: 'Create an NFT contract',
    contractType: {
      category: 'nft',
      complexity: 'intermediate',
      features: ['metadata', 'minting']
    },
    previousAttempts: [],
    qualityRequirements: {
      minimumQualityScore: 90,
      requiredFeatures: ['metadata', 'collection'],
      prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount'],
      performanceRequirements: {
        maxGenerationTime: 30000,
        maxValidationTime: 5000,
        maxRetryAttempts: 3
      }
    },
    userExperience: 'intermediate'
  }

  describe('Quality-Focused System Prompts', () => {
    it('should include comprehensive undefined value prevention', () => {
      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create an NFT contract',
        mockContext
      )

      // Verify undefined prevention is comprehensive
      expect(enhanced.systemPrompt).toContain('UNDEFINED VALUE PREVENTION')
      expect(enhanced.systemPrompt).toContain('NEVER write "undefined"')
      expect(enhanced.systemPrompt).toContain('String variables: use ""')
      expect(enhanced.systemPrompt).toContain('UInt64/UInt32/UInt8 variables: use 0')
      expect(enhanced.systemPrompt).toContain('Bool variables: use true or false')
      expect(enhanced.systemPrompt).toContain('Arrays: use []')
      expect(enhanced.systemPrompt).toContain('Dictionaries: use {}')
      expect(enhanced.systemPrompt).toContain('NEVER leave function bodies empty')
    })

    it('should emphasize modern Cadence 1.0 syntax', () => {
      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create a token contract',
        mockContext
      )

      // Verify modern syntax requirements
      expect(enhanced.systemPrompt).toContain('NEVER use "pub" keyword')
      expect(enhanced.systemPrompt).toContain('ALWAYS use "access(all)"')
      expect(enhanced.systemPrompt).toContain('NEVER use "AuthAccount"')
      expect(enhanced.systemPrompt).toContain('account.storage.save()')
      expect(enhanced.systemPrompt).toContain('account.capabilities')
      expect(enhanced.systemPrompt).toContain('modern account access patterns')
    })

    it('should include production readiness requirements', () => {
      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create a marketplace contract',
        mockContext
      )

      // Verify production readiness focus
      expect(enhanced.systemPrompt).toContain('PRODUCTION READINESS')
      expect(enhanced.systemPrompt).toContain('immediately deployable')
      expect(enhanced.systemPrompt).toContain('Security considerations')
      expect(enhanced.systemPrompt).toContain('edge cases must be handled')
      expect(enhanced.systemPrompt).toContain('comprehensive error handling')
    })

    it('should include comprehensive completeness requirements', () => {
      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create a DAO contract',
        mockContext
      )

      // Verify completeness requirements
      expect(enhanced.systemPrompt).toContain('COMPLETENESS REQUIREMENTS')
      expect(enhanced.systemPrompt).toContain('ALL functions must have complete implementations')
      expect(enhanced.systemPrompt).toContain('ALL variables must be properly initialized')
      expect(enhanced.systemPrompt).toContain('ALL resources must have proper lifecycle management')
      expect(enhanced.systemPrompt).toContain('ALL events must be properly defined')
    })
  })

  describe('Progressive Enhancement Levels', () => {
    it('should create progressively stricter prompts', () => {
      const context = {
        ...mockContext,
        qualityRequirements: {
          ...mockContext.qualityRequirements,
          minimumQualityScore: 95
        }
      }

      // Test progressive strictness
      const attempts = [1, 2, 3, 4].map(attemptNumber => 
        PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
          attemptNumber,
          previousFailures: [],
          qualityRequirements: context.qualityRequirements,
          strictMode: false,
          temperature: 0.7
        })
      )

      // Verify progressive enhancement
      expect(attempts[0].enhancementLevel).toBe('basic')
      expect(attempts[1].enhancementLevel).toBe('moderate')
      expect(attempts[2].enhancementLevel).toBe('strict')
      expect(attempts[3].enhancementLevel).toBe('maximum')

      // Verify temperature decreases
      expect(attempts[0].temperature).toBeGreaterThan(attempts[1].temperature)
      expect(attempts[1].temperature).toBeGreaterThan(attempts[2].temperature)
      expect(attempts[2].temperature).toBeGreaterThan(attempts[3].temperature)

      // Verify increasing strictness in system prompts
      expect(attempts[3].systemPrompt).toContain('EXTREME VALIDATION')
      expect(attempts[3].systemPrompt).toContain('ZERO TOLERANCE')
      expect(attempts[2].systemPrompt).toContain('TRIPLE-CHECK')
    })

    it('should use strict mode immediately when enabled', () => {
      const strictResult = PromptEnhancer.enhancePromptForQuality(
        mockContext.userPrompt,
        mockContext,
        {
          attemptNumber: 1,
          previousFailures: [],
          qualityRequirements: mockContext.qualityRequirements,
          strictMode: true,
          temperature: 0.7
        }
      )

      expect(strictResult.enhancementLevel).toBe('strict')
      expect(strictResult.temperature).toBeLessThan(0.7)
      expect(strictResult.systemPrompt).toContain('TRIPLE-CHECK')
    })
  })

  describe('Prompt Enhancement Verification', () => {
    it('should enhance user prompts with quality focus', () => {
      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create a simple NFT contract',
        mockContext
      )

      // Verify user prompt enhancements
      expect(enhanced.userPrompt).toContain('PERFECT Cadence 1.0 smart contract')
      expect(enhanced.userPrompt).toContain('ZERO undefined values')
      expect(enhanced.userPrompt).toContain('Complete, production-ready implementation')
      expect(enhanced.userPrompt).toContain('All functions fully implemented')
      expect(enhanced.userPrompt).toContain('Perfect syntax with no errors')
    })

    it('should include contract-specific requirements', () => {
      const nftContext = {
        ...mockContext,
        contractType: {
          category: 'nft' as const,
          complexity: 'intermediate' as const,
          features: ['metadata', 'royalties']
        }
      }

      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create an NFT contract',
        nftContext
      )

      // Verify NFT-specific requirements
      expect(enhanced.userPrompt).toContain('NFT CONTRACT SPECIFIC REQUIREMENTS')
      expect(enhanced.userPrompt).toContain('MetadataViews interfaces')
      expect(enhanced.userPrompt).toContain('collection interfaces')
      expect(enhanced.userPrompt).toContain('proper event emissions for minting')
    })

    it('should adapt to user experience level', () => {
      const beginnerContext = {
        ...mockContext,
        userExperience: 'beginner' as const
      }

      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create a simple contract',
        beginnerContext
      )

      // Verify beginner-friendly enhancements
      expect(enhanced.userPrompt).toContain('BEGINNER-FRIENDLY QUALITY REQUIREMENTS')
      expect(enhanced.userPrompt).toContain('extensive comments')
      expect(enhanced.userPrompt).toContain('clear, descriptive variable names')
      expect(enhanced.userPrompt).toContain('explanatory comments')
    })
  })

  describe('Failure-Specific Enhancements', () => {
    it('should add specific constraints for undefined value failures', () => {
      const failures: FailurePattern[] = [
        {
          type: 'undefined-values',
          frequency: 2,
          commonCauses: ['Missing defaults', 'Incomplete initialization'],
          suggestedSolutions: ['Use concrete values', 'Complete initialization']
        }
      ]

      const enhanced = PromptEnhancer.enhancePromptForQuality(mockContext.userPrompt, mockContext, {
        attemptNumber: 2,
        previousFailures: failures,
        qualityRequirements: mockContext.qualityRequirements,
        strictMode: false,
        temperature: 0.7
      })

      // Verify failure-specific enhancements
      expect(enhanced.userPrompt).toContain('UNDEFINED VALUE PREVENTION')
      expect(enhanced.userPrompt).toContain('previous failures')
      expect(enhanced.userPrompt).toContain('concrete defaults')
    })

    it('should add specific constraints for syntax error failures', () => {
      const failures: FailurePattern[] = [
        {
          type: 'syntax-errors',
          frequency: 1,
          commonCauses: ['Bracket mismatches'],
          suggestedSolutions: ['Match brackets carefully']
        }
      ]

      const enhanced = PromptEnhancer.enhancePromptForQuality(mockContext.userPrompt, mockContext, {
        attemptNumber: 2,
        previousFailures: failures,
        qualityRequirements: mockContext.qualityRequirements,
        strictMode: false,
        temperature: 0.7
      })

      // Verify syntax-specific enhancements
      expect(enhanced.userPrompt).toContain('SYNTAX ERROR PREVENTION')
      expect(enhanced.userPrompt).toContain('brackets')
      expect(enhanced.userPrompt).toContain('closing bracket')
    })
  })

  describe('Context-Aware Modifications', () => {
    it('should add marketplace-specific requirements', () => {
      const marketplaceContext = {
        ...mockContext,
        contractType: {
          category: 'marketplace' as const,
          complexity: 'advanced' as const,
          features: ['escrow', 'royalties']
        }
      }

      const modified = PromptEnhancer.createContextAwareModifications(
        'Create a marketplace contract',
        marketplaceContext
      )

      // Verify marketplace-specific requirements
      expect(modified).toContain('MARKETPLACE SPECIFIC REQUIREMENTS')
      expect(modified).toContain('listing and purchasing logic')
      expect(modified).toContain('payment handling')
      expect(modified).toContain('royalty distribution')
      expect(modified).toContain('escrow patterns')
    })

    it('should incorporate quality learnings from history', () => {
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

      const enhanced = PromptEnhancer.incorporateLearnings(
        'Create a contract',
        qualityHistory
      )

      expect(enhanced).toContain('QUALITY LEARNINGS FROM PREVIOUS GENERATIONS')
      expect(enhanced).toContain('undefined')
      expect(enhanced).toContain('default values')
    })
  })

  describe('Quality Constraint Building', () => {
    it('should build comprehensive quality constraints', () => {
      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create a token contract',
        mockContext
      )

      const constraints = enhanced.qualityConstraints

      // Verify syntax requirements
      expect(constraints.syntaxRequirements).toContain('Use access(all) instead of pub')
      expect(constraints.syntaxRequirements).toContain('Use modern storage API (account.storage.save)')
      expect(constraints.syntaxRequirements).toContain('Proper bracket matching')

      // Verify completeness requirements
      expect(constraints.completenessRequirements).toContain('All functions fully implemented')
      expect(constraints.completenessRequirements).toContain('All variables initialized')
      expect(constraints.completenessRequirements).toContain('All resources properly managed')

      // Verify error prevention rules
      expect(constraints.errorPreventionRules).toContain('No undefined values anywhere')
      expect(constraints.errorPreventionRules).toContain('No incomplete statements')
      expect(constraints.errorPreventionRules).toContain('No unmatched brackets')

      // Verify undefined value prevention
      expect(constraints.undefinedValuePrevention).toContain('String variables must have concrete values')
      expect(constraints.undefinedValuePrevention).toContain('Numeric variables must be initialized')
    })
  })

  describe('Temperature and Strictness Optimization', () => {
    it('should optimize temperature based on attempt number', () => {
      const context = mockContext

      // Test progressive temperature reduction
      const attempt1 = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: context.qualityRequirements,
        strictMode: false,
        temperature: 0.8
      })

      const attempt2 = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 2,
        previousFailures: [],
        qualityRequirements: context.qualityRequirements,
        strictMode: false,
        temperature: 0.8
      })

      const attempt4 = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 4,
        previousFailures: [],
        qualityRequirements: context.qualityRequirements,
        strictMode: false,
        temperature: 0.8
      })

      // Verify progressive temperature reduction
      expect(attempt1.temperature).toBe(0.8) // First attempt keeps original
      expect(attempt2.temperature).toBeLessThan(0.8) // Second attempt reduces
      expect(attempt4.temperature).toBe(0.1) // Final attempt uses minimum
    })

    it('should use lower temperature in strict mode', () => {
      const context = mockContext

      const normalMode = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: context.qualityRequirements,
        strictMode: false,
        temperature: 0.7
      })

      const strictMode = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: context.qualityRequirements,
        strictMode: true,
        temperature: 0.7
      })

      // Verify strict mode uses lower temperature
      expect(strictMode.temperature).toBeLessThan(normalMode.temperature)
    })
  })

  describe('Progressive Enhancement Methods', () => {
    it('should create progressive enhancement messages', () => {
      const basePrompt = 'Create an NFT contract'
      
      const attempt1 = PromptEnhancer.createProgressiveEnhancement(basePrompt, 1, [])
      const attempt2 = PromptEnhancer.createProgressiveEnhancement(basePrompt, 2, [])
      const attempt3 = PromptEnhancer.createProgressiveEnhancement(basePrompt, 3, [])

      expect(attempt1).toContain('FIRST ATTEMPT - HIGH QUALITY FOCUS')
      expect(attempt2).toContain('SECOND ATTEMPT - ENHANCED QUALITY CONTROL')
      expect(attempt3).toContain('THIRD ATTEMPT - MAXIMUM QUALITY ENFORCEMENT')
    })

    it('should create failure-specific modifications', () => {
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

      const modified = PromptEnhancer.createFailureSpecificModifications(
        'Create a contract',
        failures
      )

      expect(modified).toContain('CRITICAL FAILURE PREVENTION')
      expect(modified).toContain('UNDEFINED VALUE PREVENTION')
      expect(modified).toContain('SYNTAX ERROR PREVENTION')
    })
  })
})