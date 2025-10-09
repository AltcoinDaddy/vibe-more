/**
 * Integration tests for Fallback Generator with Quality Assurance System
 * Tests the fallback generator's integration readiness and standalone functionality
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { FallbackGenerator } from '../fallback-generator'

describe('Fallback Generator Integration', () => {
  let fallbackGenerator: FallbackGenerator

  beforeEach(() => {
    fallbackGenerator = new FallbackGenerator()
  })

  describe('Quality Assurance Integration Readiness', () => {
    test('fallback contracts are free of undefined values', async () => {
      const prompts = [
        'Create an NFT contract',
        'Create a fungible token',
        'Create a marketplace',
        'Create a DAO voting system',
        'Create a staking contract',
        'Create a multi-sig wallet'
      ]

      for (const prompt of prompts) {
        const result = await fallbackGenerator.generateFallbackContract(prompt)
        
        // Should not contain undefined values
        expect(result.code).not.toContain('undefined')
        expect(result.code).not.toContain('null')
        
        // Should have proper variable declarations
        expect(result.code).not.toMatch(/var\s+\w+\s*$/) // No incomplete var declarations
        expect(result.code).not.toMatch(/let\s+\w+\s*$/) // No incomplete let declarations
      }
    })

    test('fallback contracts have complete syntax', async () => {
      const result = await fallbackGenerator.generateFallbackContract('Create an NFT contract')
      
      // Should have balanced braces, parentheses, and brackets
      const braceCount = (result.code.match(/\{/g) || []).length - (result.code.match(/\}/g) || []).length
      const parenCount = (result.code.match(/\(/g) || []).length - (result.code.match(/\)/g) || []).length
      const bracketCount = (result.code.match(/\[/g) || []).length - (result.code.match(/\]/g) || []).length
      
      expect(braceCount).toBe(0)
      expect(parenCount).toBe(0)
      expect(bracketCount).toBe(0)
    })

    test('fallback contracts require minimal corrections', async () => {
      const prompts = [
        'Create an NFT contract',
        'Create a fungible token',
        'Create a marketplace'
      ]

      for (const prompt of prompts) {
        const result = await fallbackGenerator.generateFallbackContract(prompt)
        
        // Should already be well-formed
        expect(result.code).toContain('access(all) contract')
        expect(result.code).toMatch(/init\s*\([^)]*\)/)
        expect(result.code).not.toContain('// TODO')
        expect(result.code).not.toContain('// FIXME')
        expect(result.code).not.toContain('// PLACEHOLDER')
      }
    })
  })

  describe('Quality Assurance Pipeline Integration', () => {
    test('fallback contracts meet quality thresholds', async () => {
      const prompts = [
        'Create an NFT contract',
        'Create a fungible token',
        'Create a marketplace',
        'Create a DAO voting system'
      ]

      for (const prompt of prompts) {
        const result = await fallbackGenerator.generateFallbackContract(prompt)
        
        // Validate basic quality requirements
        expect(result.code).toContain('access(all) contract')
        expect(result.code).toMatch(/init\s*\([^)]*\)/)
        expect(result.code).not.toContain('undefined')
        expect(result.code).not.toContain('null')
        expect(result.code).not.toContain('// TODO')
        expect(result.code).not.toContain('// FIXME')
        
        // Validate Cadence 1.0 compliance
        expect(result.code).toContain('access(all)')
        expect(result.code).not.toContain('pub ')
        
        // Validate structural completeness
        const braceCount = (result.code.match(/\{/g) || []).length - (result.code.match(/\}/g) || []).length
        expect(braceCount).toBe(0) // Balanced braces
        
        const parenCount = (result.code.match(/\(/g) || []).length - (result.code.match(/\)/g) || []).length
        expect(parenCount).toBe(0) // Balanced parentheses
      }
    })

    test('fallback contracts are production ready', async () => {
      const result = await fallbackGenerator.generateFallbackContract('Create an NFT marketplace')
      
      // Should have proper event definitions
      expect(result.code).toMatch(/access\(all\)\s+event\s+\w+/)
      
      // Should have proper function definitions
      expect(result.code).toMatch(/access\(all\)\s+fun\s+\w+/)
      
      // Should have proper resource or struct definitions
      expect(result.code).toMatch(/(resource|struct)\s+\w+/)
      
      // Should have proper initialization
      expect(result.code).toMatch(/init\s*\([^)]*\)\s*\{/)
      
      // Should not have placeholder comments
      expect(result.code).not.toContain('// TODO')
      expect(result.code).not.toContain('// PLACEHOLDER')
      expect(result.code).not.toContain('// IMPLEMENT')
    })
  })

  describe('Error Recovery Integration', () => {
    test('provides reliable fallback when other systems fail', async () => {
      // Test with edge case prompts that might cause issues
      const edgeCasePrompts = [
        '', // Empty prompt
        'Create something weird and unknown',
        'Generate a contract with @#$%^&*() special characters',
        'A'.repeat(10000), // Very long prompt
        '123456789', // Numeric prompt
        'null undefined void error crash'
      ]

      for (const prompt of edgeCasePrompts) {
        const result = await fallbackGenerator.generateFallbackContract(prompt)
        
        // Should always provide a working contract
        expect(result.code).toContain('contract')
        expect(result.code).toMatch(/init\s*\([^)]*\)/)
        expect(result.code).not.toContain('undefined')
        
        // Should pass quality validation
        const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
        expect(isValid).toBe(true)
      }
    })

    test('maintains consistency across multiple fallback requests', async () => {
      const prompt = 'Create an NFT contract'
      const results = await Promise.all([
        fallbackGenerator.generateFallbackContract(prompt),
        fallbackGenerator.generateFallbackContract(prompt),
        fallbackGenerator.generateFallbackContract(prompt)
      ])

      // Should use the same template
      expect(results[0].templateUsed).toBe(results[1].templateUsed)
      expect(results[1].templateUsed).toBe(results[2].templateUsed)
      
      // Should have the same contract type
      expect(results[0].contractType.category).toBe(results[1].contractType.category)
      expect(results[1].contractType.category).toBe(results[2].contractType.category)
      
      // All should be valid
      for (const result of results) {
        const isValid = await fallbackGenerator.validateFallbackQuality(result.code)
        expect(isValid).toBe(true)
      }
    })
  })

  describe('Performance Integration', () => {
    test('fallback generation completes within time limits', async () => {
      const prompts = [
        'Create an NFT contract',
        'Create a complex multi-signature wallet with advanced features',
        'Create a comprehensive marketplace with auction functionality'
      ]

      for (const prompt of prompts) {
        const startTime = Date.now()
        const result = await fallbackGenerator.generateFallbackContract(prompt)
        const endTime = Date.now()
        
        const duration = endTime - startTime
        
        // Should complete within 1 second (much faster than AI generation)
        expect(duration).toBeLessThan(1000)
        expect(result.success).toBe(true)
      }
    })

    test('handles concurrent fallback requests efficiently', async () => {
      const prompts = Array(10).fill(0).map((_, i) => `Create NFT contract ${i}`)
      
      const startTime = Date.now()
      const results = await Promise.all(
        prompts.map(prompt => fallbackGenerator.generateFallbackContract(prompt))
      )
      const endTime = Date.now()
      
      const duration = endTime - startTime
      
      // Should handle 10 concurrent requests within 2 seconds
      expect(duration).toBeLessThan(2000)
      
      // All should be successful (using NFT prompts which should work)
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.code).toContain('contract')
      })
    })
  })

  describe('Template System Integration', () => {
    test('uses appropriate templates for different contract types', async () => {
      const contractTypes = [
        { prompt: 'Create an NFT collection', expectedCategory: 'nft' },
        { prompt: 'Create a fungible token', expectedCategory: 'fungible-token' },
        { prompt: 'Create a marketplace', expectedCategory: 'marketplace' },
        { prompt: 'Create a DAO', expectedCategory: 'dao' },
        { prompt: 'Create a staking contract', expectedCategory: 'defi' },
        { prompt: 'Create a multi-sig wallet', expectedCategory: 'utility' }
      ]

      for (const { prompt, expectedCategory } of contractTypes) {
        const result = await fallbackGenerator.generateFallbackContract(prompt)
        
        expect(result.contractType.category).toBe(expectedCategory)
        expect(result.success).toBe(true)
        
        // Should use a template appropriate for the category
        expect(result.templateUsed).toBeTruthy()
        expect(result.templateUsed).not.toBe('emergency-fallback')
      }
    })

    test('template-based fallbacks are guaranteed working', async () => {
      const categories = ['nft', 'fungible-token', 'marketplace', 'dao', 'defi', 'utility']
      
      for (const category of categories) {
        const code = fallbackGenerator.getTemplateBasedFallback({ category })
        
        expect(code).toContain('contract')
        expect(code).toMatch(/init\s*\([^)]*\)/)
        expect(code).not.toContain('undefined')
        
        const isValid = await fallbackGenerator.validateFallbackQuality(code)
        expect(isValid).toBe(true)
      }
    })
  })
})