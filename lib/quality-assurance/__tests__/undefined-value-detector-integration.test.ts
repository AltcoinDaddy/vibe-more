/**
 * Integration tests for UndefinedValueDetector
 * 
 * Tests the detector with realistic Cadence contract examples
 * to ensure it works correctly in real-world scenarios.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { UndefinedValueDetector } from '../undefined-value-detector'

describe('UndefinedValueDetector Integration Tests', () => {
  let detector: UndefinedValueDetector

  beforeEach(() => {
    detector = new UndefinedValueDetector()
  })

  test('detects issues in a realistic NFT contract with problems', () => {
    const problematicNFTContract = `
      access(all) contract ProblematicNFT {
        access(all) var totalSupply: UInt64 = undefined
        access(all) var name: String = 
        
        access(all) resource NFT {
          access(all) let id: UInt64
          access(all) var metadata: {String: String}
          
          init(id: UInt64) {
            self.id = id
            self.metadata = 
          }
        }
        
        access(all) fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}): UInt64 {
          let nft <- create NFT(id: self.totalSupply)
          // Missing return statement
        }
        
        access(all) fun getName(): String {
          // Missing return statement
        }
        
        access(all) fun getMetadata(id: UInt64): {String: String} {
          // Missing return statement
        }
        
        init() {
          self.totalSupply = 0
          self.name = "Test NFT"
        }
      }
    `

    const result = detector.scanForUndefinedValues(problematicNFTContract)

    // Should detect multiple critical issues
    expect(result.hasBlockingIssues).toBe(true)
    expect(result.criticalIssues).toBeGreaterThan(0)
    
    // Should detect literal undefined
    const undefinedIssues = result.issues.filter(issue => issue.undefinedType === 'literal-undefined')
    expect(undefinedIssues.length).toBeGreaterThan(0)
    
    // Should detect incomplete declarations
    const incompleteIssues = result.issues.filter(issue => issue.undefinedType === 'incomplete-declaration')
    expect(incompleteIssues.length).toBeGreaterThan(0)
    
    // Should detect missing returns
    const missingReturnIssues = result.issues.filter(issue => issue.undefinedType === 'missing-return')
    expect(missingReturnIssues.length).toBeGreaterThan(0)
    
    // All critical issues should be auto-fixable or have suggestions
    const criticalIssues = result.issues.filter(issue => issue.severity === 'critical')
    criticalIssues.forEach(issue => {
      expect(issue.suggestedFix).toBeDefined()
    })
  })

  test('passes clean NFT contract without issues', () => {
    const cleanNFTContract = `
      access(all) contract CleanNFT {
        access(all) var totalSupply: UInt64
        access(all) var name: String
        
        access(all) resource NFT {
          access(all) let id: UInt64
          access(all) var metadata: {String: String}
          
          init(id: UInt64) {
            self.id = id
            self.metadata = {}
          }
        }
        
        access(all) fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}): UInt64 {
          let nft <- create NFT(id: self.totalSupply)
          self.totalSupply = self.totalSupply + 1
          return nft.id
        }
        
        access(all) fun getName(): String {
          return self.name
        }
        
        access(all) fun getMetadata(id: UInt64): {String: String} {
          return {}
        }
        
        init() {
          self.totalSupply = 0
          self.name = "Clean NFT"
        }
      }
    `

    const result = detector.scanForUndefinedValues(cleanNFTContract)

    expect(result.totalIssues).toBe(0)
    expect(result.criticalIssues).toBe(0)
    expect(result.hasBlockingIssues).toBe(false)
  })

  test('provides accurate suggestions for different Cadence types', () => {
    const typeTestContract = `
      access(all) contract TypeTest {
        access(all) var stringVal: String = undefined
        access(all) var intVal: Int = undefined
        access(all) var uintVal: UInt64 = undefined
        access(all) var boolVal: Bool = undefined
        access(all) var addressVal: Address = undefined
        access(all) var arrayVal: [String] = undefined
        access(all) var dictVal: {String: Int} = undefined
        access(all) var optionalVal: String? = undefined
      }
    `

    const result = detector.scanForUndefinedValues(typeTestContract)

    const undefinedIssues = result.issues.filter(issue => issue.undefinedType === 'literal-undefined')
    expect(undefinedIssues.length).toBe(8)

    // Check specific type suggestions
    const stringIssue = undefinedIssues.find(issue => issue.location.context?.includes('stringVal'))
    expect(stringIssue?.suggestedValue).toBe('""')

    const intIssue = undefinedIssues.find(issue => issue.location.context?.includes('intVal'))
    expect(intIssue?.suggestedValue).toBe('0')

    const boolIssue = undefinedIssues.find(issue => issue.location.context?.includes('boolVal'))
    expect(boolIssue?.suggestedValue).toBe('false')

    const addressIssue = undefinedIssues.find(issue => issue.location.context?.includes('addressVal'))
    expect(addressIssue?.suggestedValue).toBe('0x0')

    const arrayIssue = undefinedIssues.find(issue => issue.location.context?.includes('arrayVal'))
    expect(arrayIssue?.suggestedValue).toBe('[]')

    const dictIssue = undefinedIssues.find(issue => issue.location.context?.includes('dictVal'))
    expect(dictIssue?.suggestedValue).toBe('{}')

    const optionalIssue = undefinedIssues.find(issue => issue.location.context?.includes('optionalVal'))
    expect(optionalIssue?.suggestedValue).toBe('nil')
  })

  test('handles complex function signatures correctly', () => {
    const complexFunctionContract = `
      access(all) contract ComplexFunctions {
        access(all) fun getComplexArray(): [[String]] {
          // Missing return
        }
        
        access(all) fun getNestedDict(): {String: {Int: Bool}} {
          // Missing return
        }
        
        access(all) fun getOptionalArray(): [String]? {
          // Missing return
        }
        
        access(all) fun processData(data: [String], options: {String: String}?) {
          // Function with optional parameter
        }
      }
    `

    const result = detector.scanForUndefinedValues(complexFunctionContract)

    // Should detect missing returns for complex types
    const missingReturnIssues = result.issues.filter(issue => issue.undefinedType === 'missing-return')
    expect(missingReturnIssues.length).toBe(3)

    // Should detect optional parameter
    const missingDefaultIssues = result.issues.filter(issue => issue.undefinedType === 'missing-default')
    expect(missingDefaultIssues.length).toBe(1)

    // Check complex type suggestions
    const nestedArrayIssue = missingReturnIssues.find(issue => 
      issue.message.includes('[[String]]')
    )
    expect(nestedArrayIssue?.suggestedValue).toBe('[]')

    const nestedDictIssue = missingReturnIssues.find(issue => 
      issue.message.includes('{String: {Int: Bool}}')
    )
    expect(nestedDictIssue?.suggestedValue).toBe('{}')

    const optionalArrayIssue = missingReturnIssues.find(issue => 
      issue.message.includes('[String]?')
    )
    expect(optionalArrayIssue?.suggestedValue).toBe('nil')
  })
})