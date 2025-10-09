/**
 * Integration tests for enhanced prompt system
 * 
 * These tests verify that enhanced prompts produce higher quality code
 * and effectively prevent common issues like undefined values and syntax errors.
 */

import { describe, it, expect } from 'vitest'
import { PromptEnhancer } from '../prompt-enhancer'
import { GenerationContext, FailurePattern, QualityRequirements } from '../types'

describe('Prompt Enhancement Integration Tests', () => {
  describe('Quality-Focused Prompt Enhancement', () => {
    it('should create enhanced prompts with quality constraints', () => {
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
      
      // Verify enhancement level and temperature
      expect(enhanced.enhancementLevel).toBe('basic')
      expect(enhanced.temperature).toBe(0.7)
      
      // Verify quality constraints
      expect(enhanced.qualityConstraints.syntaxRequirements).toContain('Use access(all) instead of pub')
      expect(enhanced.qualityConstraints.undefinedValuePrevention).toContain('String variables must have concrete values')
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

    it('should adapt prompts based on contract type', () => {
      const nftContext: GenerationContext = {
        userPrompt: 'Create an NFT contract',
        contractType: {
          category: 'nft',
          complexity: 'intermediate',
          features: ['metadata']
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

      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create an NFT contract',
        nftContext
      )

      // Verify NFT-specific requirements are included
      expect(enhanced.systemPrompt).toContain('NFT CONTRACT REQUIREMENTS')
      expect(enhanced.systemPrompt).toContain('MetadataViews')
      expect(enhanced.systemPrompt).toContain('NonFungibleToken')
      expect(enhanced.systemPrompt).toContain('collection resource patterns')
    })

    it('should adjust prompts based on user experience level', () => {
      const beginnerContext: GenerationContext = {
        userPrompt: 'I am new to blockchain. Create a simple contract.',
        contractType: {
          category: 'generic',
          complexity: 'simple',
          features: []
        },
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 85,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        },
        userExperience: 'beginner'
      }

      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create a simple contract',
        beginnerContext
      )

      // Verify that the prompt is enhanced for beginners (basic level with quality focus)
      expect(enhanced.enhancementLevel).toBe('basic')
      expect(enhanced.systemPrompt).toContain('CRITICAL QUALITY REQUIREMENTS')
      expect(enhanced.systemPrompt).toContain('UNDEFINED VALUE PREVENTION')
    })

    it('should include failure-specific prevention rules', () => {
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

      const failures: FailurePattern[] = [
        {
          type: 'undefined-values',
          frequency: 1,
          commonCauses: ['Missing initialization'],
          suggestedSolutions: ['Use concrete values']
        }
      ]

      const enhanced = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 2,
        previousFailures: failures,
        qualityRequirements: context.qualityRequirements,
        strictMode: false,
        temperature: 0.7
      })

      // Check that failure prevention is included
      expect(enhanced.systemPrompt).toContain('CRITICAL FAILURE PREVENTION')
      expect(enhanced.systemPrompt).toContain('undefined-values')
      expect(enhanced.systemPrompt).toContain('These issues MUST be completely avoided')
    })

    it('should create context-aware modifications', () => {
      const basePrompt = 'Create a marketplace contract'
      const context: GenerationContext = {
        userPrompt: basePrompt,
        contractType: {
          category: 'marketplace',
          complexity: 'advanced',
          features: ['listings', 'payments', 'royalties']
        },
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 95,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined', 'pub '],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        },
        userExperience: 'expert'
      }

      const modified = PromptEnhancer.createContextAwareModifications(basePrompt, context)

      // Verify marketplace-specific requirements
      expect(modified).toContain('MARKETPLACE SPECIFIC REQUIREMENTS')
      expect(modified).toContain('listing and purchasing logic')
      expect(modified).toContain('payment handling')
      expect(modified).toContain('royalty distribution')

      // Verify expert-level requirements
      expect(modified).toContain('EXPERT-LEVEL REQUIREMENTS')
      expect(modified).toContain('advanced patterns')
      expect(modified).toContain('sophisticated error handling')
    })

    it('should incorporate learnings from quality history', () => {
      const basePrompt = 'Create a contract'
      const qualityHistory = [
        {
          issues: [
            { type: 'undefined-literal', severity: 'critical' as const, location: { line: 1, column: 1 }, message: 'Undefined value', autoFixable: true },
            { type: 'bracket-mismatch', severity: 'critical' as const, location: { line: 2, column: 1 }, message: 'Missing bracket', autoFixable: true }
          ],
          score: 60
        },
        {
          issues: [
            { type: 'incomplete-function', severity: 'warning' as const, location: { line: 3, column: 1 }, message: 'Incomplete function', autoFixable: false }
          ],
          score: 75
        }
      ]

      const enhanced = PromptEnhancer.incorporateLearnings(basePrompt, qualityHistory)

      expect(enhanced).toContain('QUALITY LEARNINGS FROM PREVIOUS GENERATIONS')
      expect(enhanced).toContain('Avoid any "undefined" literals')
      expect(enhanced).toContain('Count brackets carefully')
      expect(enhanced).toContain('Complete all function implementations')
    })
  })

  describe('Quality Constraint Building', () => {
    it('should build comprehensive quality constraints', () => {
      const context: GenerationContext = {
        userPrompt: 'Create a token contract',
        contractType: {
          category: 'fungible-token',
          complexity: 'intermediate',
          features: ['transfers', 'minting']
        },
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 90,
          requiredFeatures: ['transfers', 'balance-checking'],
          prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        },
        userExperience: 'intermediate'
      }

      const enhanced = PromptEnhancer.enhancePromptForQuality(
        'Create a token contract',
        context
      )

      const constraints = enhanced.qualityConstraints

      // Verify syntax requirements
      expect(constraints.syntaxRequirements).toContain('Use access(all) instead of pub')
      expect(constraints.syntaxRequirements).toContain('Use modern storage API (account.storage.save)')
      expect(constraints.syntaxRequirements).toContain('Use capabilities instead of account.link')

      // Verify completeness requirements
      expect(constraints.completenessRequirements).toContain('All functions fully implemented')
      expect(constraints.completenessRequirements).toContain('All variables initialized')
      expect(constraints.completenessRequirements).toContain('All resources properly managed')

      // Verify error prevention rules
      expect(constraints.errorPreventionRules).toContain('No undefined values anywhere')
      expect(constraints.errorPreventionRules).toContain('No incomplete statements')
      expect(constraints.errorPreventionRules).toContain('No legacy syntax patterns')

      // Verify undefined value prevention
      expect(constraints.undefinedValuePrevention).toContain('String variables must have concrete values')
      expect(constraints.undefinedValuePrevention).toContain('Numeric variables must be initialized')
      expect(constraints.undefinedValuePrevention).toContain('Boolean variables must be true or false')
    })
  })

  describe('Temperature and Strictness Calculation', () => {
    it('should calculate optimal temperature based on attempt number', () => {
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
      expect(attempt1.temperature).toBeGreaterThan(attempt2.temperature)
      expect(attempt2.temperature).toBeGreaterThan(attempt4.temperature)
      expect(attempt4.temperature).toBe(0.1) // Maximum strictness
    })

    it('should use lower temperature in strict mode', () => {
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

      const normalMode = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: context.qualityRequirements,
        strictMode: false,
        temperature: 0.8
      })

      const strictMode = PromptEnhancer.enhancePromptForQuality(context.userPrompt, context, {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: context.qualityRequirements,
        strictMode: true,
        temperature: 0.8
      })

      // Verify strict mode uses lower temperature
      expect(strictMode.temperature).toBeLessThan(normalMode.temperature)
      expect(strictMode.enhancementLevel).toBe('strict')
    })
  })
})