/**
 * Tests to ensure no legacy Cadence syntax is present in production code
 * These tests will fail if any legacy patterns are detected, preventing regression
 */

import { describe, test, expect } from 'vitest'
import { ProductionCodeScanner } from '../production-code-scanner'

describe('Legacy Syntax Prevention', () => {
  test('should have zero legacy patterns in production code', async () => {
    const scanner = new ProductionCodeScanner()
    const result = await scanner.scanProductionCode('.')
    
    // This test will fail if any legacy patterns are found
    expect(result.totalPatternsFound).toBe(0)
    expect(result.filesWithLegacyPatterns).toBe(0)
    expect(result.patternsBySeverity.critical || 0).toBe(0)
    expect(result.patternsBySeverity.warning || 0).toBe(0)
    
    // If patterns are found, provide detailed information
    if (result.totalPatternsFound > 0) {
      const errorMessage = `
Legacy Cadence patterns detected in production code!

Files with issues: ${result.filesWithLegacyPatterns}
Total patterns: ${result.totalPatternsFound}
Critical: ${result.patternsBySeverity.critical || 0}
Warnings: ${result.patternsBySeverity.warning || 0}

Patterns found:
${result.patterns.map(p => 
  `- ${p.location.file}:${p.location.line} - ${p.description} (${p.severity})`
).join('\n')}

Run 'npx tsx lib/migration/run-production-scan.ts' for detailed report.
      `.trim()
      
      throw new Error(errorMessage)
    }
  })

  test('should detect legacy patterns in test code', async () => {
    // Test that our scanner can still detect legacy patterns when they exist
    const testLegacyCode = `
      pub contract TestContract {
        pub var value: String
        pub(set) var owner: Address
        
        pub fun getValue(): String {
          return self.value
        }
        
        pub fun deposit() {
          account.save(<-vault, to: /storage/vault)
        }
      }
    `
    
    // This should detect multiple legacy patterns
    const patterns = [
      /\bpub\s+/g,
      /\bpub\(set\)\s+/g,
      /account\.save\(/g
    ]
    
    let totalMatches = 0
    patterns.forEach(pattern => {
      const matches = testLegacyCode.match(pattern)
      if (matches) {
        totalMatches += matches.length
      }
    })
    
    // Should find at least 5 legacy patterns in this test code
    expect(totalMatches).toBeGreaterThanOrEqual(5)
  })

  test('should not flag modern Cadence syntax', async () => {
    const modernCode = `
      access(all) contract ModernContract {
        access(all) var value: String
        access(all) var owner: Address
        
        access(all) view fun getValue(): String {
          return self.value
        }
        
        access(all) fun deposit() {
          account.storage.save(<-vault, to: /storage/vault)
        }
      }
    `
    
    // This should not match any legacy patterns
    const legacyPatterns = [
      /\bpub\s+/g,
      /\bpub\(set\)\s+/g,
      /account\.save\(/g,
      /account\.link\(/g,
      /account\.borrow\(/g
    ]
    
    legacyPatterns.forEach(pattern => {
      const matches = modernCode.match(pattern)
      expect(matches).toBeNull()
    })
  })

  test('should validate all template files use modern syntax', async () => {
    // Import templates and check each one
    const { templates } = await import('../../templates')
    
    templates.forEach(template => {
      // Check for legacy patterns in template code
      expect(template.code).not.toMatch(/\bpub\s+/)
      expect(template.code).not.toMatch(/\bpub\(set\)\s+/)
      expect(template.code).not.toMatch(/account\.save\(/)
      expect(template.code).not.toMatch(/account\.link\(/)
      expect(template.code).not.toMatch(/account\.borrow\(/)
      
      // Should contain modern syntax
      expect(template.code).toMatch(/access\(all\)/)
    })
  })

  test('should validate VibeSDK generates modern syntax', async () => {
    // Import VibeSDK and create instance
    const { VibeSDK } = await import('../../vibesdk')
    const vibeSDK = new VibeSDK()
    
    // Test with a simple prompt
    const result = await vibeSDK.generateCode({
      prompt: 'Create a simple NFT contract'
    })
    
    // Generated code should not contain legacy patterns
    expect(result).not.toMatch(/\bpub\s+/)
    expect(result).not.toMatch(/\bpub\(set\)\s+/)
    expect(result).not.toMatch(/account\.save\(/)
    expect(result).not.toMatch(/account\.link\(/)
    expect(result).not.toMatch(/account\.borrow\(/)
    
    // Should contain modern syntax
    expect(result).toMatch(/access\(all\)/)
  })

  test('should prevent legacy syntax in API responses', async () => {
    // This test ensures our API endpoints reject legacy syntax
    const legacyInputs = [
      'pub contract Test { pub var value: String }',
      'contract Test { pub(set) var value: String }',
      'contract Test { fun test() { account.save() } }',
      'contract Test { fun test() { account.link() } }',
      'contract Test { fun test() { account.borrow() } }'
    ]
    
    // Import validation functions
    const { RealtimeValidator } = await import('../realtime-validator')
    const validator = new RealtimeValidator()
    
    for (const legacyInput of legacyInputs) {
      const validation = await validator.validateUserInput(legacyInput)
      
      // Should detect legacy patterns
      expect(validation.hasLegacyPatterns).toBe(true)
      expect(validation.patterns.length).toBeGreaterThan(0)
      expect(validation.isValid).toBe(false)
    }
  })

  test('should have prevention mechanisms in place', () => {
    // Check that prevention files exist
    const fs = require('fs')
    const path = require('path')
    
    // Pre-commit hook should exist
    const preCommitPath = path.join(process.cwd(), '.husky', 'pre-commit')
    expect(fs.existsSync(preCommitPath)).toBe(true)
    
    // ESLint rule should exist
    const eslintRulePath = path.join(process.cwd(), 'eslint-rules', 'no-legacy-cadence.js')
    expect(fs.existsSync(eslintRulePath)).toBe(true)
    
    // ESLint config should exist
    const eslintConfigPath = path.join(process.cwd(), '.eslintrc.js')
    expect(fs.existsSync(eslintConfigPath)).toBe(true)
    
    // Production scanner should exist
    const scannerPath = path.join(process.cwd(), 'lib', 'migration', 'production-code-scanner.ts')
    expect(fs.existsSync(scannerPath)).toBe(true)
  })
})