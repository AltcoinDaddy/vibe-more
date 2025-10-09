/**
 * Integration tests for comprehensive syntax validation system
 * Tests the enhanced CodeValidator with function signatures, structure validation, and event definitions
 */

import { describe, test, expect } from 'vitest'
import { CodeValidator } from '../code-validator'

describe('Comprehensive Syntax Validation', () => {
  const validator = new CodeValidator()

  describe('Function Signature Validation', () => {
    test('should detect incomplete function signatures', () => {
      const incompleteCode = `
        access(all) contract TestContract {
          access(all) fun incompleteFunction(
        }
      `
      
      const result = validator.validateSyntax(incompleteCode)
      expect(result.isValid).toBe(false)
      expect(result.functionIssues).toHaveLength(1)
      expect(result.functionIssues[0].type).toBe('incomplete-signature')
      expect(result.functionIssues[0].message).toContain('Incomplete function signature')
    })

    test('should detect missing return types for functions with return statements', () => {
      const codeWithMissingReturnType = `
        access(all) contract TestContract {
          access(all) fun getValue() {
            return "hello"
          }
        }
      `
      
      const result = validator.validateSyntax(codeWithMissingReturnType)
      expect(result.functionIssues.some(issue => issue.type === 'missing-return-type')).toBe(true)
      expect(result.functionIssues.find(issue => issue.type === 'missing-return-type')?.message)
        .toContain('has return statement but no return type specified')
    })

    test('should not flag init functions for missing return types', () => {
      const initCode = `
        access(all) contract TestContract {
          init() {
            // initialization code
          }
        }
      `
      
      const result = validator.validateSyntax(initCode)
      expect(result.functionIssues.filter(issue => issue.type === 'missing-return-type')).toHaveLength(0)
    })

    test('should detect functions without implementation body', () => {
      const codeWithoutBody = `
        access(all) contract TestContract {
          access(all) fun missingBody(): String
        }
      `
      
      const result = validator.validateSyntax(codeWithoutBody)
      expect(result.functionIssues.some(issue => issue.type === 'missing-body')).toBe(true)
      expect(result.functionIssues.find(issue => issue.type === 'missing-body')?.message)
        .toContain('is missing implementation body')
    })

    test('should validate complete function signatures correctly', () => {
      const completeCode = `
        access(all) contract TestContract {
          access(all) fun getValue(): String {
            return "hello"
          }
          
          access(all) fun setValue(value: String) {
            // setter implementation
          }
          
          init() {
            // initialization
          }
        }
      `
      
      const result = validator.validateSyntax(completeCode)
      expect(result.functionIssues).toHaveLength(0)
    })
  })

  describe('Bracket Matching Validation', () => {
    test('should detect mismatched brackets', () => {
      const mismatchedCode = `
        access(all) contract TestContract {
          access(all) fun test() {
            let value = getValue(]
          }
        }
      `
      
      const result = validator.validateSyntax(mismatchedCode)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.type === 'bracket-mismatch')).toBe(true)
      expect(result.errors.find(error => error.type === 'bracket-mismatch')?.message)
        .toContain('Mismatched brackets')
    })

    test('should detect unclosed brackets', () => {
      const unclosedCode = `
        access(all) contract TestContract {
          access(all) fun test() {
            let value = getValue(
      `
      
      const result = validator.validateSyntax(unclosedCode)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.type === 'bracket-mismatch')).toBe(true)
      expect(result.errors.find(error => error.type === 'bracket-mismatch')?.message)
        .toContain('Unclosed bracket')
    })

    test('should detect unexpected closing brackets', () => {
      const extraClosingCode = `
        access(all) contract TestContract {
          access(all) fun test() {
            let value = "hello"
          }}
        }
      `
      
      const result = validator.validateSyntax(extraClosingCode)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.type === 'bracket-mismatch')).toBe(true)
      expect(result.errors.find(error => error.type === 'bracket-mismatch')?.message)
        .toContain('Unexpected closing bracket')
    })

    test('should validate properly matched brackets', () => {
      const wellFormedCode = `
        access(all) contract TestContract {
          access(all) fun test(): [String] {
            let array = ["hello", "world"]
            return array
          }
        }
      `
      
      const result = validator.validateSyntax(wellFormedCode)
      expect(result.errors.filter(error => error.type === 'bracket-mismatch')).toHaveLength(0)
    })
  })

  describe('Contract and Resource Structure Validation', () => {
    test('should detect missing access modifiers on contracts', () => {
      const noAccessModifierCode = `
        contract TestContract {
          init() {}
        }
      `
      
      const result = validator.validateSyntax(noAccessModifierCode)
      expect(result.structureIssues.some(issue => issue.type === 'invalid-access-modifier')).toBe(true)
      expect(result.structureIssues.find(issue => issue.type === 'invalid-access-modifier')?.message)
        .toContain('is missing access modifier')
    })

    test('should detect missing init function in contracts', () => {
      const noInitCode = `
        access(all) contract TestContract {
          access(all) var value: String
        }
      `
      
      const result = validator.validateSyntax(noInitCode)
      expect(result.structureIssues.some(issue => issue.type === 'missing-init')).toBe(true)
      expect(result.structureIssues.find(issue => issue.type === 'missing-init')?.message)
        .toContain('is missing init() function')
    })

    test('should detect missing access modifiers on resources', () => {
      const resourceNoAccessCode = `
        access(all) contract TestContract {
          resource TestResource {
            init() {}
          }
          init() {}
        }
      `
      
      const result = validator.validateSyntax(resourceNoAccessCode)
      expect(result.structureIssues.some(issue => 
        issue.type === 'invalid-access-modifier' && issue.message.includes('Resource')
      )).toBe(true)
    })

    test('should warn about missing destroy function in resources', () => {
      const resourceNoDestroyCode = `
        access(all) contract TestContract {
          access(all) resource TestResource {
            init() {}
          }
          init() {}
        }
      `
      
      const result = validator.validateSyntax(resourceNoDestroyCode)
      expect(result.structureIssues.some(issue => issue.type === 'invalid-resource-structure')).toBe(true)
      expect(result.structureIssues.find(issue => issue.type === 'invalid-resource-structure')?.message)
        .toContain('is missing destroy() function')
    })

    test('should validate well-structured contracts and resources', () => {
      const wellStructuredCode = `
        access(all) contract TestContract {
          access(all) resource TestResource {
            init() {}
            destroy() {}
          }
          
          init() {}
        }
      `
      
      const result = validator.validateSyntax(wellStructuredCode)
      expect(result.structureIssues.filter(issue => issue.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Event Definition Validation', () => {
    test('should detect missing access modifiers on events', () => {
      const eventNoAccessCode = `
        access(all) contract TestContract {
          event TestEvent(value: String)
          init() {}
        }
      `
      
      const result = validator.validateSyntax(eventNoAccessCode)
      expect(result.eventIssues.some(issue => issue.type === 'invalid-definition')).toBe(true)
      expect(result.eventIssues.find(issue => issue.type === 'invalid-definition')?.message)
        .toContain('is missing access modifier')
    })

    test('should detect incomplete event declarations', () => {
      const incompleteEventCode = `
        access(all) contract TestContract {
          access(all) event TestEvent
          init() {}
        }
      `
      
      const result = validator.validateSyntax(incompleteEventCode)
      expect(result.eventIssues.some(issue => issue.type === 'incomplete-event')).toBe(true)
      expect(result.eventIssues.find(issue => issue.type === 'incomplete-event')?.message)
        .toContain('declaration is incomplete')
    })

    test('should detect missing parameter type annotations', () => {
      const eventMissingTypesCode = `
        access(all) contract TestContract {
          access(all) event TestEvent(value, count: Int)
          init() {}
        }
      `
      
      const result = validator.validateSyntax(eventMissingTypesCode)
      expect(result.eventIssues.some(issue => issue.type === 'invalid-parameter-types')).toBe(true)
      expect(result.eventIssues.find(issue => issue.type === 'invalid-parameter-types')?.message)
        .toContain('is missing type annotation')
    })

    test('should detect malformed event parameters', () => {
      const malformedEventCode = `
        access(all) contract TestContract {
          access(all) event TestEvent(value:, :String)
          init() {}
        }
      `
      
      const result = validator.validateSyntax(malformedEventCode)
      expect(result.eventIssues.some(issue => issue.type === 'invalid-parameter-types')).toBe(true)
      expect(result.eventIssues.find(issue => issue.type === 'invalid-parameter-types')?.message)
        .toContain('has malformed parameter')
    })

    test('should validate well-formed event definitions', () => {
      const wellFormedEventCode = `
        access(all) contract TestContract {
          access(all) event TestEvent(value: String, count: Int, optional: String?)
          access(all) event EmptyEvent()
          init() {}
        }
      `
      
      const result = validator.validateSyntax(wellFormedEventCode)
      expect(result.eventIssues).toHaveLength(0)
    })

    test('should validate complex event parameter types', () => {
      const complexEventCode = `
        access(all) contract TestContract {
          access(all) event ComplexEvent(
            array: [String], 
            optional: Int?, 
            reference: &String,
            custom: MyCustomType
          )
          init() {}
        }
      `
      
      const result = validator.validateSyntax(complexEventCode)
      expect(result.eventIssues.filter(issue => issue.type === 'invalid-parameter-types')).toHaveLength(0)
    })
  })

  describe('Statement Completeness Validation', () => {
    test('should detect missing semicolons on statements', () => {
      const missingSemicolonCode = `
        access(all) contract TestContract {
          init() {
            let value = "hello"
            return
          }
        }
      `
      
      const result = validator.validateSyntax(missingSemicolonCode)
      expect(result.errors.some(error => error.type === 'incomplete-statement')).toBe(true)
      expect(result.errors.find(error => error.type === 'incomplete-statement')?.message)
        .toContain('missing semicolon')
    })

    test('should detect incomplete variable declarations', () => {
      const incompleteVarCode = `
        access(all) contract TestContract {
          init() {
            var incomplete
          }
        }
      `
      
      const result = validator.validateSyntax(incompleteVarCode)
      expect(result.errors.some(error => error.type === 'incomplete-statement')).toBe(true)
      expect(result.errors.find(error => error.type === 'incomplete-statement')?.message)
        .toContain('missing type annotation or initialization')
    })

    test('should validate complete statements', () => {
      const completeStatementsCode = `
        access(all) contract TestContract {
          init() {
            let value: String = "hello";
            var count: Int = 0;
            emit TestEvent(value: value);
          }
        }
      `
      
      const result = validator.validateSyntax(completeStatementsCode)
      expect(result.errors.filter(error => error.type === 'incomplete-statement')).toHaveLength(0)
    })
  })

  describe('Style and Best Practice Warnings', () => {
    test('should warn about spacing issues', () => {
      const spacingIssuesCode = `
        access(all) contract TestContract {
          access(all) fun test () {
            let value=1+2
          }
          init() {}
        }
      `
      
      const result = validator.validateSyntax(spacingIssuesCode)
      expect(result.warnings.some(warning => warning.type === 'style')).toBe(true)
    })

    test('should warn about naming convention issues', () => {
      const namingIssuesCode = `
        access(all) contract TestContract {
          access(all) fun TestFunction(): String {
            return "test"
          }
          init() {}
        }
      `
      
      const result = validator.validateSyntax(namingIssuesCode)
      expect(result.warnings.some(warning => warning.type === 'best-practice')).toBe(true)
      expect(result.warnings.find(warning => warning.type === 'best-practice')?.message)
        .toContain('should use camelCase')
    })

    test('should warn about potential resource handling issues', () => {
      const resourceHandlingCode = `
        access(all) contract TestContract {
          access(all) fun moveResource() {
            let resource <- createResource()
          }
          init() {}
        }
      `
      
      const result = validator.validateSyntax(resourceHandlingCode)
      expect(result.warnings.some(warning => warning.type === 'potential-issue')).toBe(true)
      expect(result.warnings.find(warning => warning.type === 'potential-issue')?.message)
        .toContain('Resource move operation detected')
    })
  })

  describe('Integration with Legacy Pattern Detection', () => {
    test('should combine syntax validation with legacy pattern detection', () => {
      const codeWithBothIssues = `
        pub contract TestContract {
          pub fun getValue() {
            return account.save("data", to: /storage/data
          }
        }
      `
      
      const result = validator.validateCode(codeWithBothIssues)
      expect(result.isValid).toBe(false)
      
      // Should detect legacy patterns
      expect(result.errors.some(error => error.includes('Legacy "pub" keyword'))).toBe(true)
      expect(result.errors.some(error => error.includes('Legacy storage API'))).toBe(true)
      
      // Should detect syntax issues
      expect(result.errors.some(error => error.includes('Unclosed bracket'))).toBe(true)
      expect(result.errors.some(error => error.includes('missing init() function'))).toBe(true)
    })

    test('should validate modern code with proper syntax', () => {
      const modernWellFormedCode = `
        access(all) contract TestContract {
          access(all) var value: String
          
          access(all) event ValueChanged(newValue: String)
          
          access(all) fun getValue(): String {
            return self.value
          }
          
          access(all) fun setValue(newValue: String) {
            self.value = newValue;
            emit ValueChanged(newValue: newValue);
          }
          
          init() {
            self.value = "initial";
            self.account.storage.save("data", to: /storage/data);
          }
        }
      `
      
      const result = validator.validateCode(modernWellFormedCode)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.compilationSuccess).toBe(true)
    })
  })

  describe('Complex Integration Scenarios', () => {
    test('should handle complex contract with multiple issues', () => {
      const complexProblematicCode = `
        contract TestContract {
          resource TestResource {
            init() {}
          }
          
          event TestEvent(value)
          
          fun getValue() {
            return "test"
          }
          
          fun incompleteFunction(
        }
      `
      
      const result = validator.validateCode(complexProblematicCode)
      expect(result.isValid).toBe(false)
      
      // Should detect multiple types of issues
      const errorMessages = result.errors.join(' ')
      expect(errorMessages).toContain('missing access modifier')
      expect(errorMessages).toContain('missing type annotation')
      expect(errorMessages).toContain('has return statement but no return type')
      expect(errorMessages).toContain('Incomplete function signature')
      expect(errorMessages).toContain('Incomplete function signature')
    })

    test('should provide comprehensive validation for production-ready code', () => {
      const productionCode = `
        access(all) contract NFTContract {
          access(all) resource NFT {
            access(all) let id: UInt64
            access(all) let metadata: {String: String}
            
            init(id: UInt64, metadata: {String: String}) {
              self.id = id;
              self.metadata = metadata;
            }
            
            destroy() {
              emit NFTDestroyed(id: self.id);
            }
          }
          
          access(all) event NFTMinted(id: UInt64, to: Address)
          access(all) event NFTDestroyed(id: UInt64)
          
          access(all) var totalSupply: UInt64
          
          access(all) fun mintNFT(recipient: Address, metadata: {String: String}): @NFT {
            let nft <- create NFT(id: self.totalSupply, metadata: metadata);
            self.totalSupply = self.totalSupply + 1;
            emit NFTMinted(id: nft.id, to: recipient);
            return <- nft;
          }
          
          access(all) fun getTotalSupply(): UInt64 {
            return self.totalSupply;
          }
          
          init() {
            self.totalSupply = 0;
          }
        }
      `
      
      const result = validator.validateCode(productionCode, { allowWarnings: true })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.compilationSuccess).toBe(true)
    })
  })
})