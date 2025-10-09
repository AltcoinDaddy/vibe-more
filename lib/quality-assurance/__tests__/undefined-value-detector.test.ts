/**
 * Unit tests for UndefinedValueDetector
 * 
 * Tests the accuracy of undefined value detection, severity classification,
 * and suggested fixes for various types of undefined value issues.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { UndefinedValueDetector, UndefinedValueIssue } from '../undefined-value-detector'

describe('UndefinedValueDetector', () => {
  let detector: UndefinedValueDetector

  beforeEach(() => {
    detector = new UndefinedValueDetector()
  })

  describe('Literal undefined detection', () => {
    test('detects literal undefined values in variable declarations', () => {
      const code = `
        access(all) contract TestContract {
          access(all) var name: String = undefined
          access(all) var count: Int = undefined
        }
      `

      const result = detector.scanForUndefinedValues(code)

      expect(result.totalIssues).toBe(2)
      expect(result.criticalIssues).toBe(2)
      expect(result.hasBlockingIssues).toBe(true)

      const undefinedIssues = result.issues.filter(issue => issue.undefinedType === 'literal-undefined')
      expect(undefinedIssues).toHaveLength(2)

      // Check first undefined issue
      const nameIssue = undefinedIssues.find(issue => issue.location.context?.includes('name'))
      expect(nameIssue).toBeDefined()
      expect(nameIssue?.severity).toBe('critical')
      expect(nameIssue?.suggestedValue).toBe('""')
      expect(nameIssue?.autoFixable).toBe(true)

      // Check second undefined issue
      const countIssue = undefinedIssues.find(issue => issue.location.context?.includes('count'))
      expect(countIssue).toBeDefined()
      expect(countIssue?.severity).toBe('critical')
      expect(countIssue?.suggestedValue).toBe('0')
    })

    test('detects undefined in different contexts', () => {
      const code = `
        access(all) fun getValue(): String {
          let result: String = undefined
          return result
        }
      `

      const result = detector.scanForUndefinedValues(code)

      expect(result.totalIssues).toBe(1)
      const issue = result.issues[0]
      expect(issue.undefinedType).toBe('literal-undefined')
      expect(issue.suggestedValue).toBe('""')
    })

    test('handles case-insensitive undefined detection', () => {
      const code = `
        access(all) var value1: String = undefined
        access(all) var value2: String = UNDEFINED
        access(all) var value3: String = Undefined
      `

      const result = detector.scanForUndefinedValues(code)

      expect(result.totalIssues).toBe(3)
      expect(result.criticalIssues).toBe(3)
    })
  })

  describe('Incomplete declaration detection', () => {
    test('detects incomplete variable declarations', () => {
      const code = `
        access(all) contract TestContract {
          access(all) var name: String = 
          access(all) var count: Int = 
        }
      `

      const result = detector.scanForUndefinedValues(code)

      const incompleteIssues = result.issues.filter(issue => issue.undefinedType === 'incomplete-declaration')
      expect(incompleteIssues).toHaveLength(2)

      incompleteIssues.forEach(issue => {
        expect(issue.severity).toBe('critical')
        expect(issue.autoFixable).toBe(true)
        expect(issue.suggestedValue).toBeDefined()
      })
    })

    test('detects incomplete assignments', () => {
      const code = `
        access(all) fun updateValue() {
          self.name = 
          self.count = 
        }
      `

      const result = detector.scanForUndefinedValues(code)

      const incompleteIssues = result.issues.filter(issue => issue.type === 'incomplete-assignment')
      expect(incompleteIssues).toHaveLength(2)

      incompleteIssues.forEach(issue => {
        expect(issue.severity).toBe('critical')
        expect(issue.undefinedType).toBe('incomplete-declaration')
      })
    })

    test('suggests appropriate default values for different types', () => {
      const code = `
        access(all) var stringVal: String = 
        access(all) var intVal: Int = 
        access(all) var boolVal: Bool = 
        access(all) var addressVal: Address = 
        access(all) var uintVal: UInt64 = 
      `

      const result = detector.scanForUndefinedValues(code)

      const issues = result.issues.filter(issue => issue.undefinedType === 'incomplete-declaration')
      expect(issues).toHaveLength(5)

      const stringIssue = issues.find(issue => issue.location.context?.includes('stringVal'))
      expect(stringIssue?.suggestedValue).toBe('""')

      const intIssue = issues.find(issue => issue.location.context?.includes('intVal'))
      expect(intIssue?.suggestedValue).toBe('0')

      const boolIssue = issues.find(issue => issue.location.context?.includes('boolVal'))
      expect(boolIssue?.suggestedValue).toBe('false')

      const addressIssue = issues.find(issue => issue.location.context?.includes('addressVal'))
      expect(addressIssue?.suggestedValue).toBe('0x0')

      const uintIssue = issues.find(issue => issue.location.context?.includes('uintVal'))
      expect(uintIssue?.suggestedValue).toBe('0')
    })
  })

  describe('Missing return value detection', () => {
    test('detects functions missing return statements', () => {
      const code = `
        access(all) fun getName(): String {
          let name = "test"
          // Missing return statement
        }
        
        access(all) fun getCount(): Int {
          let count = 42
          // Missing return statement
        }
      `

      const result = detector.scanForUndefinedValues(code)

      const missingReturnIssues = result.issues.filter(issue => issue.undefinedType === 'missing-return')
      expect(missingReturnIssues).toHaveLength(2)

      const stringFunctionIssue = missingReturnIssues.find(issue => 
        issue.message.includes('String')
      )
      expect(stringFunctionIssue).toBeDefined()
      expect(stringFunctionIssue?.severity).toBe('critical')
      expect(stringFunctionIssue?.suggestedValue).toBe('""')
      expect(stringFunctionIssue?.autoFixable).toBe(true)

      const intFunctionIssue = missingReturnIssues.find(issue => 
        issue.message.includes('Int')
      )
      expect(intFunctionIssue).toBeDefined()
      expect(intFunctionIssue?.suggestedValue).toBe('0')
    })

    test('does not flag functions with return statements', () => {
      const code = `
        access(all) fun getName(): String {
          return "test"
        }
        
        access(all) fun getCount(): Int {
          return 42
        }
      `

      const result = detector.scanForUndefinedValues(code)

      const missingReturnIssues = result.issues.filter(issue => issue.undefinedType === 'missing-return')
      expect(missingReturnIssues).toHaveLength(0)
    })

    test('handles complex return types', () => {
      const code = `
        access(all) fun getArray(): [String] {
          // Missing return
        }
        
        access(all) fun getDictionary(): {String: Int} {
          // Missing return
        }
      `

      const result = detector.scanForUndefinedValues(code)

      const missingReturnIssues = result.issues.filter(issue => issue.undefinedType === 'missing-return')
      expect(missingReturnIssues).toHaveLength(2)

      // Array return type should suggest empty array
      const arrayIssue = missingReturnIssues.find(issue => 
        issue.message.includes('[String]')
      )
      expect(arrayIssue?.suggestedValue).toBe('[]')

      // Dictionary return type should suggest empty dictionary
      const dictIssue = missingReturnIssues.find(issue => 
        issue.message.includes('{String: Int}')
      )
      expect(dictIssue?.suggestedValue).toBe('{}')
    })
  })

  describe('Missing parameter defaults detection', () => {
    test('detects optional parameters without defaults', () => {
      const code = `
        access(all) fun processData(data: String, options: {String: String}?) {
          // Function with optional parameter
        }
      `

      const result = detector.scanForUndefinedValues(code)

      const missingDefaultIssues = result.issues.filter(issue => issue.undefinedType === 'missing-default')
      expect(missingDefaultIssues).toHaveLength(1)

      const issue = missingDefaultIssues[0]
      expect(issue.severity).toBe('warning')
      expect(issue.autoFixable).toBe(false)
      expect(issue.message).toContain('Optional parameter could benefit from a default value')
    })

    test('does not flag required parameters', () => {
      const code = `
        access(all) fun processData(data: String, count: Int) {
          // Function with required parameters only
        }
      `

      const result = detector.scanForUndefinedValues(code)

      const missingDefaultIssues = result.issues.filter(issue => issue.undefinedType === 'missing-default')
      expect(missingDefaultIssues).toHaveLength(0)
    })
  })

  describe('Severity classification', () => {
    test('classifies literal undefined as critical', () => {
      const issue: UndefinedValueIssue = {
        severity: 'critical',
        type: 'undefined-value',
        undefinedType: 'literal-undefined',
        location: { line: 1, column: 1 },
        message: 'test',
        autoFixable: true
      }

      const severity = UndefinedValueDetector.classifySeverity(issue)
      expect(severity).toBe('critical')
    })

    test('classifies incomplete declarations as critical', () => {
      const issue: UndefinedValueIssue = {
        severity: 'critical',
        type: 'incomplete-declaration',
        undefinedType: 'incomplete-declaration',
        location: { line: 1, column: 1 },
        message: 'test',
        autoFixable: true
      }

      const severity = UndefinedValueDetector.classifySeverity(issue)
      expect(severity).toBe('critical')
    })

    test('classifies missing returns as critical', () => {
      const issue: UndefinedValueIssue = {
        severity: 'critical',
        type: 'missing-return',
        undefinedType: 'missing-return',
        location: { line: 1, column: 1 },
        message: 'test',
        autoFixable: true
      }

      const severity = UndefinedValueDetector.classifySeverity(issue)
      expect(severity).toBe('critical')
    })

    test('classifies missing defaults as warning', () => {
      const issue: UndefinedValueIssue = {
        severity: 'warning',
        type: 'missing-default',
        undefinedType: 'missing-default',
        location: { line: 1, column: 1 },
        message: 'test',
        autoFixable: false
      }

      const severity = UndefinedValueDetector.classifySeverity(issue)
      expect(severity).toBe('warning')
    })
  })

  describe('Auto-fixable detection', () => {
    test('identifies auto-fixable issues with suggested values', () => {
      const autoFixableIssue: UndefinedValueIssue = {
        severity: 'critical',
        type: 'undefined-value',
        undefinedType: 'literal-undefined',
        location: { line: 1, column: 1 },
        message: 'test',
        autoFixable: true,
        suggestedValue: '""'
      }

      expect(UndefinedValueDetector.isAutoFixable(autoFixableIssue)).toBe(true)
    })

    test('identifies non-auto-fixable issues', () => {
      const nonAutoFixableIssue: UndefinedValueIssue = {
        severity: 'warning',
        type: 'missing-default',
        undefinedType: 'missing-default',
        location: { line: 1, column: 1 },
        message: 'test',
        autoFixable: false
      }

      expect(UndefinedValueDetector.isAutoFixable(nonAutoFixableIssue)).toBe(false)
    })

    test('requires suggested value for auto-fixable classification', () => {
      const issueWithoutSuggestion: UndefinedValueIssue = {
        severity: 'critical',
        type: 'undefined-value',
        undefinedType: 'literal-undefined',
        location: { line: 1, column: 1 },
        message: 'test',
        autoFixable: true
        // No suggestedValue
      }

      expect(UndefinedValueDetector.isAutoFixable(issueWithoutSuggestion)).toBe(false)
    })
  })

  describe('Complex code scenarios', () => {
    test('handles mixed undefined issues in complex contract', () => {
      const code = `
        access(all) contract ComplexContract {
          access(all) var name: String = undefined
          access(all) var count: Int = 
          
          access(all) fun getName(): String {
            // Missing return
          }
          
          access(all) fun processData(data: String, options: {String: String}?) {
            self.value = 
          }
        }
      `

      const result = detector.scanForUndefinedValues(code)

      expect(result.totalIssues).toBeGreaterThan(0)
      expect(result.criticalIssues).toBeGreaterThan(0)
      expect(result.hasBlockingIssues).toBe(true)

      // Should have various types of issues
      const issueTypes = new Set(result.issues.map(issue => issue.undefinedType))
      expect(issueTypes.size).toBeGreaterThan(1)
    })

    test('handles code with no undefined issues', () => {
      const code = `
        access(all) contract CleanContract {
          access(all) var name: String = "default"
          access(all) var count: Int = 0
          
          access(all) fun getName(): String {
            return self.name
          }
          
          access(all) fun getCount(): Int {
            return self.count
          }
        }
      `

      const result = detector.scanForUndefinedValues(code)

      expect(result.totalIssues).toBe(0)
      expect(result.criticalIssues).toBe(0)
      expect(result.warningIssues).toBe(0)
      expect(result.hasBlockingIssues).toBe(false)
    })

    test('provides accurate location information', () => {
      const code = `line 1
        access(all) var name: String = undefined
        line 3`

      const result = detector.scanForUndefinedValues(code)

      expect(result.totalIssues).toBe(1)
      const issue = result.issues[0]
      expect(issue.location.line).toBe(2)
      expect(issue.location.context).toContain('name: String = undefined')
    })
  })

  describe('Edge cases', () => {
    test('handles empty code', () => {
      const result = detector.scanForUndefinedValues('')

      expect(result.totalIssues).toBe(0)
      expect(result.hasBlockingIssues).toBe(false)
    })

    test('handles code with only whitespace', () => {
      const result = detector.scanForUndefinedValues('   \n\n   \t  ')

      expect(result.totalIssues).toBe(0)
      expect(result.hasBlockingIssues).toBe(false)
    })

    test('handles undefined in comments (should not detect)', () => {
      const code = `
        // This is undefined behavior
        /* 
         * undefined values are bad
         */
        access(all) var name: String = "valid"
      `

      const result = detector.scanForUndefinedValues(code)

      // Should not detect undefined in comments
      expect(result.totalIssues).toBe(0)
    })

    test('handles undefined in string literals (should not detect)', () => {
      const code = `
        access(all) var message: String = "This contains undefined word"
        access(all) var description: String = "undefined is not allowed"
      `

      const result = detector.scanForUndefinedValues(code)

      // Should not detect undefined within string literals
      expect(result.totalIssues).toBe(0)
    })
  })
})