/**
 * Unit tests for AutoCorrectionEngine
 * 
 * Tests the auto-correction functionality including undefined value fixes,
 * bracket matching, statement completion, and overall correction accuracy.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { AutoCorrectionEngine, CorrectionResult } from '../auto-correction-engine'

describe('AutoCorrectionEngine', () => {
  let engine: AutoCorrectionEngine

  beforeEach(() => {
    engine = new AutoCorrectionEngine()
  })

  describe('correctUndefinedValues', () => {
    test('should replace literal undefined with appropriate default values', () => {
      const codeWithUndefined = `
        access(all) contract TestContract {
          access(all) var name: String = undefined
          access(all) var count: Int = undefined
          access(all) var isActive: Bool = undefined
          access(all) var owner: Address = undefined
        }
      `

      const result = engine.correctUndefinedValues(codeWithUndefined)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBe(4)
      expect(result.correctedCode).toContain('name: String = ""')
      expect(result.correctedCode).toContain('count: Int = 0')
      expect(result.correctedCode).toContain('isActive: Bool = false')
      expect(result.correctedCode).toContain('owner: Address = 0x0')
      expect(result.confidence).toBeGreaterThan(60)
    })

    test('should handle incomplete variable declarations', () => {
      const incompleteCode = `
        access(all) contract TestContract {
          access(all) var name: String = 
          access(all) var count: Int = 
        }
      `

      const result = engine.correctUndefinedValues(incompleteCode)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBe(2)
      expect(result.correctedCode).toContain('name: String = ""')
      expect(result.correctedCode).toContain('count: Int = 0')
    })

    test('should add missing return statements', () => {
      const codeWithMissingReturn = `
        access(all) contract TestContract {
          access(all) fun getName(): String {
            // Missing return statement
          }
          
          access(all) fun getCount(): Int {
            let value = 42
            // Missing return statement
          }
        }
      `

      const result = engine.correctUndefinedValues(codeWithMissingReturn)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBe(2)
      expect(result.correctedCode).toContain('return ""')
      expect(result.correctedCode).toContain('return 0')
    })

    test('should handle complex types correctly', () => {
      const complexTypeCode = `
        access(all) contract TestContract {
          access(all) var items: [String] = undefined
          access(all) var mapping: {String: Int} = undefined
          access(all) var optional: String? = undefined
          access(all) var decimal: UFix64 = undefined
        }
      `

      const result = engine.correctUndefinedValues(complexTypeCode)

      expect(result.success).toBe(true)
      expect(result.correctedCode).toContain('items: [String] = []')
      expect(result.correctedCode).toContain('mapping: {String: Int} = {}')
      expect(result.correctedCode).toContain('optional: String? = nil')
      expect(result.correctedCode).toContain('decimal: UFix64 = 0.0')
    })

    test('should not modify undefined in string literals', () => {
      const codeWithStringUndefined = `
        access(all) contract TestContract {
          access(all) var message: String = "This is undefined behavior"
          access(all) var description: String = 'undefined value'
        }
      `

      const result = engine.correctUndefinedValues(codeWithStringUndefined)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBe(0)
      expect(result.correctedCode).toContain('"This is undefined behavior"')
      expect(result.correctedCode).toContain("'undefined value'")
    })

    test('should not modify undefined in comments', () => {
      const codeWithCommentUndefined = `
        access(all) contract TestContract {
          // This variable is undefined
          access(all) var name: String = "test"
          /* 
           * undefined behavior here
           */
          access(all) var count: Int = 0
        }
      `

      const result = engine.correctUndefinedValues(codeWithCommentUndefined)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBe(0)
      expect(result.correctedCode).toContain('// This variable is undefined')
      expect(result.correctedCode).toContain('undefined behavior here')
    })
  })

  describe('fixBracketMismatches', () => {
    test('should add missing closing braces', () => {
      const codeWithMissingBrace = `
        access(all) contract TestContract {
          access(all) fun test() {
            let value = "test"
            // Missing closing brace
      `

      const result = engine.fixBracketMismatches(codeWithMissingBrace)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBeGreaterThan(0)
      expect(result.correctedCode).toContain('}')
    })

    test('should add missing closing parentheses', () => {
      const codeWithMissingParen = `
        access(all) contract TestContract {
          access(all) fun test(param: String {
            return param
          }
        }
      `

      const result = engine.fixBracketMismatches(codeWithMissingParen)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBeGreaterThan(0)
    })

    test('should add missing closing brackets', () => {
      const codeWithMissingBracket = `
        access(all) contract TestContract {
          access(all) var items: [String = ["item1", "item2"]
        }
      `

      const result = engine.fixBracketMismatches(codeWithMissingBracket)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBeGreaterThan(0)
    })

    test('should handle nested bracket structures', () => {
      const nestedCode = `
        access(all) contract TestContract {
          access(all) fun complexFunction() {
            let data = {
              "items": [1, 2, 3,
              "nested": {
                "value": 42
              // Missing multiple closing brackets
        }
      `

      const result = engine.fixBracketMismatches(nestedCode)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBeGreaterThan(0)
    })

    test('should not modify brackets in string literals', () => {
      const codeWithStringBrackets = `
        access(all) contract TestContract {
          access(all) var message: String = "Missing } bracket"
          access(all) var pattern: String = "Array [1, 2, 3"
        }
      `

      const result = engine.fixBracketMismatches(codeWithStringBrackets)

      // Should not find any bracket mismatches in string literals
      expect(result.correctionsApplied.length).toBe(0)
      expect(result.correctedCode).toContain('"Missing } bracket"')
      expect(result.correctedCode).toContain('"Array [1, 2, 3"')
    })
  })

  describe('completeIncompleteStatements', () => {
    test('should complete incomplete function declarations', () => {
      const incompleteFunction = `
        access(all) contract TestContract {
          access(all) fun getName(): String
          access(all) fun getCount(): Int
        }
      `

      const result = engine.completeIncompleteStatements(incompleteFunction)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBe(2)
      expect(result.correctedCode).toContain('getName(): String {')
      expect(result.correctedCode).toContain('getCount(): Int {')
      expect(result.correctedCode).toContain('// TODO: Implement function')
    })

    test('should complete incomplete assignments', () => {
      const incompleteAssignment = `
        access(all) contract TestContract {
          init() {
            self.name = 
            self.count = 
          }
        }
      `

      const result = engine.completeIncompleteStatements(incompleteAssignment)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBeGreaterThan(0)
    })

    test('should handle incomplete expressions with type inference', () => {
      const incompleteExpression = `
        access(all) contract TestContract {
          init() {
            let name: String = 
            let count: Int = 
            let isActive: Bool = 
          }
        }
      `

      const result = engine.completeIncompleteStatements(incompleteExpression)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBe(3)
      expect(result.correctedCode).toContain('name: String = ""')
      expect(result.correctedCode).toContain('count: Int = 0')
      expect(result.correctedCode).toContain('isActive: Bool = false')
    })
  })

  describe('fixSyntaxErrors', () => {
    test('should handle syntax fixes', () => {
      const codeWithSyntaxIssues = `
        access(all) contract TestContract {
          access(all) var name: String = "test"
        }
      `

      const result = engine.fixSyntaxErrors(codeWithSyntaxIssues)

      expect(result.success).toBe(true)
      // May or may not have corrections depending on the code
    })

    test('should remove trailing commas', () => {
      const codeWithTrailingCommas = `
        access(all) contract TestContract {
          access(all) fun test(param1: String, param2: Int,) {
            return
          }
        }
      `

      const result = engine.fixSyntaxErrors(codeWithTrailingCommas)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBeGreaterThan(0)
      expect(result.correctedCode).toContain('param2: Int)')
      expect(result.correctedCode).not.toContain('param2: Int,)')
    })
  })

  describe('correctCode - integration tests', () => {
    test('should handle multiple types of issues in one pass', async () => {
      const problematicCode = `access(all) contract TestContract {
  access(all) var name: String = undefined
  access(all) var count: Int = 
  
  access(all) fun getName(): String {
    // Missing return statement
  }
  
  access(all) fun getCount(): Int
}`

      const result = await engine.correctCode(problematicCode)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBeGreaterThan(2)
      expect(result.correctedCode).toContain('name: String = ""')
      expect(result.correctedCode).toContain('count: Int = 0')
      expect(result.correctedCode).toContain('getCount(): Int {')
      expect(result.originalIssueCount).toBeGreaterThan(result.remainingIssueCount)
    })

    test('should maintain high confidence for simple fixes', async () => {
      const simpleCode = `
        access(all) contract TestContract {
          access(all) var name: String = undefined
        }
      `

      const result = await engine.correctCode(simpleCode)

      expect(result.success).toBe(true)
      expect(result.confidence).toBeGreaterThan(80)
      expect(result.requiresRegeneration).toBe(false)
    })

    test('should recommend regeneration for complex issues', async () => {
      const complexProblematicCode = `
        access(all) contract TestContract {
          access(all) var data: {String: [Int} = undefined
          access(all) fun process(items: [String, callback: (String) -> Void {
            for item in items {
              callback(item
            // Multiple syntax and logic errors
        }
      `

      const result = await engine.correctCode(complexProblematicCode)

      expect(result.requiresRegeneration).toBe(true)
      expect(result.confidence).toBeLessThan(70)
    })

    test('should handle already correct code gracefully', async () => {
      const correctCode = `access(all) contract TestContract {
  access(all) var name: String
  
  init() {
    self.name = "Test Contract"
  }
  
  access(all) fun getName(): String {
    return self.name
  }
}`

      const result = await engine.correctCode(correctCode)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBeLessThan(5) // Allow for minor corrections
      expect(result.confidence).toBeGreaterThan(80)
      expect(result.requiresRegeneration).toBe(false)
    })
  })

  describe('validateCorrections', () => {
    test('should validate successful corrections', () => {
      const originalCode = `
        access(all) contract TestContract {
          access(all) var name: String = undefined
        }
      `
      
      const correctedCode = `
        access(all) contract TestContract {
          access(all) var name: String = ""
        }
      `

      const validation = engine.validateCorrections(originalCode, correctedCode)

      expect(validation.isValid).toBe(true)
      expect(validation.qualityImprovement).toBeGreaterThan(0)
      expect(validation.riskAssessment).toBe('low')
      expect(validation.newIssuesIntroduced.length).toBe(0)
    })

    test('should detect when corrections introduce new issues', () => {
      const originalCode = `
        access(all) contract TestContract {
          access(all) var name: String = undefined
        }
      `
      
      // Simulated bad correction that introduces syntax error
      const badCorrectedCode = `
        access(all) contract TestContract {
          access(all) var name: String = "unclosed string
        }
      `

      const validation = engine.validateCorrections(originalCode, badCorrectedCode)

      expect(validation.riskAssessment).toBe('high')
      expect(validation.isValid).toBe(false)
    })

    test('should handle validation errors gracefully', () => {
      // Test with code that doesn't have obvious issues but might cause validation problems
      const validation = engine.validateCorrections('', '')

      // Empty code should validate successfully
      expect(validation.isValid).toBe(true)
      expect(validation.riskAssessment).toBe('low')
    })
  })

  describe('edge cases and error handling', () => {
    test('should handle empty code', async () => {
      const result = await engine.correctCode('')

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBe(0)
      expect(result.correctedCode).toBe('')
    })

    test('should handle code with only comments', async () => {
      const commentOnlyCode = `// This is a comment
/* This is a block comment */
// Another comment`

      const result = await engine.correctCode(commentOnlyCode)

      expect(result.success).toBe(true)
      expect(result.correctionsApplied.length).toBeLessThan(5) // Allow for minor corrections
    })

    test('should handle malformed code gracefully', async () => {
      const malformedCode = `
        access(all) contract {{{{{ invalid syntax }}}}}
        undefined undefined undefined
        ))))(((((
      `

      const result = await engine.correctCode(malformedCode)

      // Should not crash, even if it can't fix everything
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    test('should handle very long code efficiently', async () => {
      // Generate a large code sample
      const largeCode = Array(100).fill(`access(all) var item: String = undefined`).join('\n')

      const startTime = Date.now()
      const result = await engine.correctCode(largeCode)
      const duration = Date.now() - startTime

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
    })
  })

  describe('type inference accuracy', () => {
    test('should correctly infer Cadence primitive types', () => {
      const testCases = [
        { type: 'String', expected: '""' },
        { type: 'Int', expected: '0' },
        { type: 'UInt', expected: '0' },
        { type: 'UInt8', expected: '0' },
        { type: 'UInt16', expected: '0' },
        { type: 'UInt32', expected: '0' },
        { type: 'UInt64', expected: '0' },
        { type: 'UInt128', expected: '0' },
        { type: 'UInt256', expected: '0' },
        { type: 'Int8', expected: '0' },
        { type: 'Int16', expected: '0' },
        { type: 'Int32', expected: '0' },
        { type: 'Int64', expected: '0' },
        { type: 'Int128', expected: '0' },
        { type: 'Int256', expected: '0' },
        { type: 'Bool', expected: 'false' },
        { type: 'Address', expected: '0x0' },
        { type: 'UFix64', expected: '0.0' },
        { type: 'Fix64', expected: '0.0' }
      ]

      for (const testCase of testCases) {
        const code = `access(all) var value: ${testCase.type} = undefined`
        const result = engine.correctUndefinedValues(code)
        
        expect(result.success).toBe(true)
        expect(result.correctedCode).toContain(`value: ${testCase.type} = ${testCase.expected}`)
      }
    })

    test('should correctly infer collection types', () => {
      const collectionTests = [
        { type: '[String]', expected: '[]' },
        { type: '[Int]', expected: '[]' },
        { type: '{String: Int}', expected: '{}' },
        { type: '{Address: UFix64}', expected: '{}' },
        { type: 'String?', expected: 'nil' },
        { type: 'Int?', expected: 'nil' }
      ]

      for (const test of collectionTests) {
        const code = `access(all) var value: ${test.type} = undefined`
        const result = engine.correctUndefinedValues(code)
        
        expect(result.success).toBe(true)
        expect(result.correctedCode).toContain(`value: ${test.type} = ${test.expected}`)
      }
    })
  })
})