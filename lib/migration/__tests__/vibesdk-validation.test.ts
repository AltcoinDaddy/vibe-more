/**
 * Unit tests for VibeSDK code generation validation integration
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { VibeSDK } from '../../vibesdk'

// Mock the AI SDK to control generated responses
vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn()
}))

describe('VibeSDK Code Generation Validation', () => {
  let vibeSDK: VibeSDK
  
  beforeEach(() => {
    // Reset environment variables to ensure mock mode
    delete process.env.OPENAI_API_KEY
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.AI_GATEWAY_API_KEY
    delete process.env.VERCEL_OIDC_TOKEN
    
    vibeSDK = new VibeSDK()
  })

  describe('validateGeneratedCode', () => {
    test('should validate modern Cadence 1.0 code as valid', () => {
      const modernCode = `
        access(all) contract ModernContract {
          access(all) var value: String
          
          access(all) fun getValue(): String {
            return self.value
          }
          
          init() {
            self.value = "modern"
            self.account.storage.save("data", to: /storage/data)
          }
        }
      `
      
      const result = vibeSDK.validateGeneratedCode(modernCode)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.compilationSuccess).toBe(true)
    })

    test('should validate legacy code as invalid', () => {
      const legacyCode = `
        pub contract LegacyContract {
          pub var value: String
          
          pub fun getValue(): String {
            return self.value
          }
        }
      `
      
      const result = vibeSDK.validateGeneratedCode(legacyCode)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Legacy "pub" keyword detected')
    })

    test('should handle validation options', () => {
      const codeWithWarnings = `
        access(all) contract TestContract {
          access(all) fun test(account: AuthAccount) {
            // AuthAccount usage should generate warning
          }
        }
      `
      
      const strictResult = vibeSDK.validateGeneratedCode(codeWithWarnings, { allowWarnings: false })
      expect(strictResult.isValid).toBe(false)
      
      const lenientResult = vibeSDK.validateGeneratedCode(codeWithWarnings, { allowWarnings: true })
      expect(lenientResult.isValid).toBe(true)
      expect(lenientResult.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('shouldRejectGeneratedCode', () => {
    test('should reject code with pub keywords', () => {
      const legacyCode = 'pub contract Test { pub var value: String }'
      const result = vibeSDK.shouldRejectGeneratedCode(legacyCode)
      
      expect(result.shouldReject).toBe(true)
      expect(result.reason).toContain('pub')
    })

    test('should reject code with legacy storage API', () => {
      const legacyCode = `
        access(all) contract Test {
          init() {
            account.save("data", to: /storage/data)
          }
        }
      `
      const result = vibeSDK.shouldRejectGeneratedCode(legacyCode)
      
      expect(result.shouldReject).toBe(true)
      expect(result.reason).toContain('storage API')
    })

    test('should not reject modern code', () => {
      const modernCode = `
        access(all) contract Test {
          access(all) var value: String
          init() {
            self.value = "modern"
            self.account.storage.save("data", to: /storage/data)
          }
        }
      `
      const result = vibeSDK.shouldRejectGeneratedCode(modernCode)
      
      expect(result.shouldReject).toBe(false)
      expect(result.reason).toBe('')
    })
  })

  describe('generateCodeWithValidation', () => {
    test('should return validation results with generated code', async () => {
      const result = await vibeSDK.generateCodeWithValidation({
        prompt: 'Create a simple NFT contract'
      })
      
      expect(result).toHaveProperty('code')
      expect(result).toHaveProperty('validation')
      expect(result).toHaveProperty('rejected')
      expect(typeof result.code).toBe('string')
      expect(typeof result.validation.isValid).toBe('boolean')
      expect(typeof result.rejected).toBe('boolean')
    })

    test('should generate modern syntax in mock responses', async () => {
      const result = await vibeSDK.generateCodeWithValidation({
        prompt: 'Create an NFT contract'
      })
      
      // Mock responses should use modern syntax
      expect(result.code).not.toContain('pub ')
      expect(result.code).toContain('access(all)')
      expect(result.validation.isValid).toBe(true)
      expect(result.rejected).toBe(false)
    })

    test('should handle validation failure gracefully', async () => {
      // This test would be more meaningful with actual AI integration
      // For now, we test that the method completes without throwing
      const result = await vibeSDK.generateCodeWithValidation({
        prompt: 'Create a contract'
      })
      
      expect(result).toBeDefined()
      expect(result.code).toBeDefined()
      expect(result.validation).toBeDefined()
    })
  })

  describe('getCodeFixSuggestions', () => {
    test('should provide suggestions for legacy code', () => {
      const legacyCode = `
        pub contract LegacyContract {
          pub var value: String
          
          init() {
            account.save("data", to: /storage/data)
          }
        }
      `
      
      const suggestions = vibeSDK.getCodeFixSuggestions(legacyCode)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.includes('pub'))).toBe(true)
      expect(suggestions.some(s => s.includes('storage'))).toBe(true)
    })

    test('should provide no suggestions for modern code', () => {
      const modernCode = `
        access(all) contract ModernContract {
          access(all) var value: String
          
          init() {
            self.value = "modern"
            self.account.storage.save("data", to: /storage/data)
          }
        }
      `
      
      const suggestions = vibeSDK.getCodeFixSuggestions(modernCode)
      expect(suggestions).toHaveLength(0)
    })
  })

  describe('analyzeLegacyPatterns', () => {
    test('should analyze legacy patterns in code', () => {
      const legacyCode = `
        pub contract LegacyContract {
          pub var value: String
          
          init() {
            account.save("data", to: /storage/data)
            account.link<&String>(/public/data, target: /storage/data)
          }
        }
      `
      
      const analysis = vibeSDK.analyzeLegacyPatterns(legacyCode)
      expect(analysis.hasLegacyPatterns).toBe(true)
      expect(analysis.criticalIssues).toBeGreaterThan(0)
      expect(analysis.patterns.length).toBeGreaterThan(0)
      expect(analysis.patterns).toContain('Legacy "pub" keyword detected')
    })

    test('should analyze modern code with no issues', () => {
      const modernCode = `
        access(all) contract ModernContract {
          access(all) var value: String
          
          init() {
            self.value = "modern"
            self.account.storage.save("data", to: /storage/data)
          }
        }
      `
      
      const analysis = vibeSDK.analyzeLegacyPatterns(modernCode)
      expect(analysis.hasLegacyPatterns).toBe(false)
      expect(analysis.criticalIssues).toBe(0)
      expect(analysis.warnings).toBe(0)
      expect(analysis.patterns).toHaveLength(0)
    })
  })

  describe('mock response validation', () => {
    test('should generate valid mock NFT contract', async () => {
      const code = await vibeSDK.generateCode({ prompt: 'Create an NFT contract' })
      const validation = vibeSDK.validateGeneratedCode(code)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(code).toContain('access(all)')
      expect(code).not.toContain('pub ')
    })

    test('should generate valid mock general contract', async () => {
      const code = await vibeSDK.generateCode({ prompt: 'Create a simple contract' })
      const validation = vibeSDK.validateGeneratedCode(code)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(code).toContain('access(all)')
      expect(code).not.toContain('pub ')
    })

    test('should use modern storage API in mock responses', async () => {
      const code = await vibeSDK.generateCode({ prompt: 'Create a contract with storage' })
      
      expect(code).toContain('account.storage.save')
      expect(code).toContain('account.capabilities')
      expect(code).not.toContain('account.save(')
      expect(code).not.toContain('account.link(')
      expect(code).not.toContain('account.borrow(')
    })
  })

  describe('generateValidationReport', () => {
    test('should generate comprehensive validation report', () => {
      const modernCode = `
        access(all) contract ModernContract {
          access(all) var value: String
          
          access(all) fun getValue(): String {
            return self.value
          }
          
          init() {
            self.value = "modern"
            self.account.storage.save("data", to: /storage/data)
          }
        }
      `
      
      const report = vibeSDK.generateValidationReport(modernCode)
      
      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('codeMetrics')
      expect(report).toHaveProperty('validation')
      expect(report).toHaveProperty('analysis')
      expect(report).toHaveProperty('rejection')
      expect(report).toHaveProperty('suggestions')
      expect(report).toHaveProperty('compliance')
      expect(report).toHaveProperty('recommendations')
      
      expect(report.compliance.isCadence10Compliant).toBe(true)
      expect(report.compliance.complianceScore).toBe(100)
      expect(report.compliance.readyForProduction).toBe(true)
    })

    test('should generate report for legacy code', () => {
      const legacyCode = `
        pub contract LegacyContract {
          pub var value: String
          
          init() {
            account.save("data", to: /storage/data)
          }
        }
      `
      
      const report = vibeSDK.generateValidationReport(legacyCode)
      
      expect(report.compliance.isCadence10Compliant).toBe(false)
      expect(report.compliance.complianceScore).toBeLessThan(100)
      expect(report.compliance.readyForProduction).toBe(false)
      expect(report.rejection.shouldReject).toBe(true)
      expect(report.recommendations.some(r => r.includes('CRITICAL'))).toBe(true)
    })

    test('should handle validation options in report', () => {
      const codeWithWarnings = `
        access(all) contract TestContract {
          access(all) fun test(account: AuthAccount) {
            // AuthAccount usage should generate warning
          }
        }
      `
      
      const strictReport = vibeSDK.generateValidationReport(codeWithWarnings, { allowWarnings: false })
      const lenientReport = vibeSDK.generateValidationReport(codeWithWarnings, { allowWarnings: true })
      
      expect(strictReport.validation.isValid).toBe(false)
      expect(lenientReport.validation.isValid).toBe(true)
      expect(lenientReport.compliance.readyForProduction).toBe(false) // warnings prevent production readiness
    })
  })

  describe('integration with existing methods', () => {
    test('should maintain backward compatibility with generateCode', async () => {
      const code = await vibeSDK.generateCode({ prompt: 'Create a test contract' })
      
      expect(typeof code).toBe('string')
      expect(code.length).toBeGreaterThan(0)
      
      // Should automatically validate and use modern syntax
      const validation = vibeSDK.validateGeneratedCode(code)
      expect(validation.isValid).toBe(true)
    })

    test('should work with different prompt types', async () => {
      const prompts = [
        'Create an NFT contract',
        'Build a fungible token',
        'Make a DAO voting contract',
        'Create a marketplace contract'
      ]
      
      for (const prompt of prompts) {
        const code = await vibeSDK.generateCode({ prompt })
        const validation = vibeSDK.validateGeneratedCode(code)
        
        expect(validation.isValid).toBe(true)
        expect(code).not.toContain('pub ')
        expect(code).toContain('access(all)')
      }
    })

    test('should generate consistent validation reports for generated code', async () => {
      const code = await vibeSDK.generateCode({ prompt: 'Create an NFT contract' })
      const report = vibeSDK.generateValidationReport(code)
      
      expect(report.compliance.isCadence10Compliant).toBe(true)
      expect(report.compliance.complianceScore).toBe(100)
      expect(report.validation.isValid).toBe(true)
      expect(report.rejection.shouldReject).toBe(false)
    })
  })
})