/**
 * Unit tests for code generation validation
 */

import { describe, test, expect } from 'vitest'
import { CodeValidator, LegacyPattern } from '../code-validator'

describe('CodeValidator', () => {
  const validator = new CodeValidator()

  describe('validateCode', () => {
    test('should pass validation for modern Cadence 1.0 syntax', () => {
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
      
      const result = validator.validateCode(modernCode)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.compilationSuccess).toBe(true)
    })

    test('should fail validation for legacy pub keyword', () => {
      const legacyCode = `
        pub contract LegacyContract {
          pub var value: String
          
          pub fun getValue(): String {
            return self.value
          }
        }
      `
      
      const result = validator.validateCode(legacyCode)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Legacy "pub" keyword detected')
      expect(result.compilationSuccess).toBe(false)
    })

    test('should fail validation for legacy pub(set) keyword', () => {
      const legacyCode = `
        access(all) contract TestContract {
          pub(set) var value: String
        }
      `
      
      const result = validator.validateCode(legacyCode)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Legacy "pub(set)" keyword detected')
    })

    test('should fail validation for legacy storage API', () => {
      const legacyCode = `
        access(all) contract TestContract {
          init() {
            account.save("data", to: /storage/data)
            account.link<&String>(/public/data, target: /storage/data)
            let ref = account.borrow<&String>(from: /storage/data)
          }
        }
      `
      
      const result = validator.validateCode(legacyCode)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('Legacy storage API detected'))).toBe(true)
      expect(result.errors.some(e => e.includes('Legacy linking API detected'))).toBe(true)
      expect(result.errors.some(e => e.includes('Legacy borrow API detected'))).toBe(true)
    })

    test('should detect legacy interface conformance syntax', () => {
      const legacyCode = `
        access(all) resource TestResource: Interface1, Interface2 {
          // resource implementation
        }
      `
      
      const result = validator.validateCode(legacyCode)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Legacy interface conformance syntax detected'))).toBe(true)
    })

    test('should generate warnings for potentially outdated patterns', () => {
      const warningCode = `
        access(all) contract TestContract {
          access(all) fun test(account: AuthAccount) {
            let publicAccount: PublicAccount = account
            let copied = someValue.copy()
          }
        }
      `
      
      const result = validator.validateCode(warningCode, { allowWarnings: true })
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes('AuthAccount type may be deprecated'))).toBe(true)
      expect(result.warnings.some(w => w.includes('PublicAccount type may be deprecated'))).toBe(true)
    })

    test('should handle custom patterns', () => {
      const customPatterns: LegacyPattern[] = [
        {
          pattern: /customLegacyFunction\(/g,
          message: 'Custom legacy function detected',
          severity: 'error',
          suggestion: 'Use modernCustomFunction instead'
        }
      ]

      const codeWithCustomPattern = `
        access(all) contract TestContract {
          access(all) fun test() {
            customLegacyFunction()
          }
        }
      `
      
      const result = validator.validateCode(codeWithCustomPattern, { customPatterns })
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Custom legacy function detected'))).toBe(true)
    })
  })

  describe('containsLegacyPubKeywords', () => {
    test('should detect pub keywords', () => {
      const codeWithPub = 'pub contract Test { pub var value: String }'
      expect(validator.containsLegacyPubKeywords(codeWithPub)).toBe(true)
    })

    test('should detect pub(set) keywords', () => {
      const codeWithPubSet = 'access(all) contract Test { pub(set) var value: String }'
      expect(validator.containsLegacyPubKeywords(codeWithPubSet)).toBe(true)
    })

    test('should not detect false positives', () => {
      const modernCode = 'access(all) contract Test { access(all) var value: String }'
      expect(validator.containsLegacyPubKeywords(modernCode)).toBe(false)
    })

    test('should not detect pub in comments or strings', () => {
      const codeWithPubInString = `
        access(all) contract Test {
          // This is a comment about pub keyword
          access(all) var description: String = "This contract was pub before"
        }
      `
      expect(validator.containsLegacyPubKeywords(codeWithPubInString)).toBe(false)
    })
  })

  describe('shouldRejectCode', () => {
    test('should reject code with pub keywords', () => {
      const legacyCode = 'pub contract Test {}'
      const result = validator.shouldRejectCode(legacyCode)
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
      const result = validator.shouldRejectCode(legacyCode)
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
      const result = validator.shouldRejectCode(modernCode)
      expect(result.shouldReject).toBe(false)
      expect(result.reason).toBe('')
    })
  })

  describe('analyzeLegacyPatterns', () => {
    test('should analyze code with multiple legacy patterns', () => {
      const legacyCode = `
        pub contract LegacyContract {
          pub var value: String
          
          init() {
            account.save("data", to: /storage/data)
            account.link<&String>(/public/data, target: /storage/data)
          }
        }
      `
      
      const analysis = validator.analyzeLegacyPatterns(legacyCode)
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
      
      const analysis = validator.analyzeLegacyPatterns(modernCode)
      expect(analysis.hasLegacyPatterns).toBe(false)
      expect(analysis.criticalIssues).toBe(0)
      expect(analysis.warnings).toBe(0)
      expect(analysis.patterns).toHaveLength(0)
    })
  })

  describe('generateFixSuggestions', () => {
    test('should generate suggestions for legacy code', () => {
      const legacyCode = `
        pub contract LegacyContract {
          pub var value: String
          
          init() {
            account.save("data", to: /storage/data)
          }
        }
      `
      
      const suggestions = validator.generateFixSuggestions(legacyCode)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.includes('pub'))).toBe(true)
      expect(suggestions.some(s => s.includes('storage'))).toBe(true)
    })

    test('should provide minimal suggestions for modern code', () => {
      const modernCode = `
        access(all) contract ModernContract {
          access(all) var value: String
          
          init() {
            self.value = "modern"
            self.account.storage.save("data", to: /storage/data)
          }
        }
      `
      
      const suggestions = validator.generateFixSuggestions(modernCode)
      expect(suggestions).toHaveLength(0)
    })
  })

  describe('generateValidationReport', () => {
    test('should generate comprehensive report for modern code', () => {
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
      
      const report = validator.generateValidationReport(modernCode)
      
      expect(report.timestamp).toBeInstanceOf(Date)
      expect(report.codeMetrics.totalLines).toBeGreaterThan(0)
      expect(report.codeMetrics.hasContent).toBe(true)
      expect(report.validation.isValid).toBe(true)
      expect(report.compliance.isCadence10Compliant).toBe(true)
      expect(report.compliance.complianceScore).toBe(100)
      expect(report.compliance.readyForProduction).toBe(true)
      expect(report.recommendations).toContain('✅ Code is fully compliant with Cadence 1.0 and ready for production')
    })

    test('should generate report for legacy code with critical issues', () => {
      const legacyCode = `
        pub contract LegacyContract {
          pub var value: String
          
          init() {
            account.save("data", to: /storage/data)
          }
        }
      `
      
      const report = validator.generateValidationReport(legacyCode)
      
      expect(report.validation.isValid).toBe(false)
      expect(report.analysis.hasLegacyPatterns).toBe(true)
      expect(report.analysis.criticalIssues).toBeGreaterThan(0)
      expect(report.rejection.shouldReject).toBe(true)
      expect(report.compliance.isCadence10Compliant).toBe(false)
      expect(report.compliance.complianceScore).toBeLessThan(100)
      expect(report.compliance.readyForProduction).toBe(false)
      expect(report.recommendations.some(r => r.includes('CRITICAL'))).toBe(true)
    })

    test('should generate report for code with warnings only', () => {
      const warningCode = `
        access(all) contract TestContract {
          access(all) fun test(account: AuthAccount) {
            let publicAccount: PublicAccount = account;
          }
          
          init() {}
        }
      `
      
      const report = validator.generateValidationReport(warningCode, { allowWarnings: true })
      
      expect(report.validation.isValid).toBe(true)
      expect(report.validation.warnings.length).toBeGreaterThan(0)
      expect(report.compliance.isCadence10Compliant).toBe(true)
      expect(report.compliance.readyForProduction).toBe(false) // warnings prevent production readiness
      expect(report.recommendations.some(r => r.includes('warning'))).toBe(true)
    })

    test('should calculate compliance score correctly', () => {
      const codeWithMultipleIssues = `
        pub contract TestContract {
          pub var value: String
          fun missingAccess(): String {
            return account.borrow<&String>(from: /storage/data)?.value ?? ""
          }
        }
      `
      
      const report = validator.generateValidationReport(codeWithMultipleIssues)
      
      expect(report.compliance.complianceScore).toBeLessThan(100)
      expect(report.compliance.complianceScore).toBeGreaterThanOrEqual(0)
    })

    test('should handle empty code in report', () => {
      const report = validator.generateValidationReport('')
      
      expect(report.codeMetrics.totalLines).toBe(1) // empty string has 1 line
      expect(report.codeMetrics.nonEmptyLines).toBe(0)
      expect(report.codeMetrics.hasContent).toBe(false)
      expect(report.validation.isValid).toBe(true)
      expect(report.compliance.complianceScore).toBe(100)
    })
  })

  describe('enhanced warning detection', () => {
    test('should detect hardcoded contract addresses', () => {
      const codeWithHardcodedAddress = `
        import NonFungibleToken from 0x1d7e57aa55817448
        
        access(all) contract TestContract {}
      `
      
      const result = validator.validateCode(codeWithHardcodedAddress, { allowWarnings: true })
      expect(result.warnings.some(w => w.includes('Hardcoded contract address'))).toBe(true)
    })

    test('should detect generic panic messages', () => {
      const codeWithGenericPanic = `
        access(all) contract TestContract {
          access(all) fun test() {
            panic("error")
          }
        }
      `
      
      const result = validator.validateCode(codeWithGenericPanic, { allowWarnings: true })
      expect(result.warnings.some(w => w.includes('Generic panic message'))).toBe(true)
    })
  })

  describe('edge cases', () => {
    test('should handle empty code', () => {
      const result = validator.validateCode('')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    test('should handle code with only comments', () => {
      const commentOnlyCode = `
        // This is a comment
        /* This is a block comment */
      `
      const result = validator.validateCode(commentOnlyCode)
      expect(result.isValid).toBe(true)
    })

    test('should handle malformed code gracefully', () => {
      const malformedCode = `
        access(all) contract {
          pub var incomplete
          fun missingBraces() {
        // Missing closing braces
      `
      
      // Should still detect legacy patterns even in malformed code
      const result = validator.validateCode(malformedCode)
      expect(result.errors.some(e => e.includes('pub'))).toBe(true)
    })

    test('should handle very long lines', () => {
      const longLine = 'pub var ' + 'a'.repeat(10000) + ': String'
      const result = validator.validateCode(longLine)
      expect(result.errors.some(e => e.includes('pub'))).toBe(true)
    })
  })
})