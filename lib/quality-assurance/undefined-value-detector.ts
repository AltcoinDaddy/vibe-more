/**
 * UndefinedValueDetector
 * 
 * Scans generated Cadence code for undefined values, incomplete declarations,
 * and missing function return values/parameter defaults.
 */

import { ValidationIssue, CodeLocation } from './types'

export interface UndefinedValueIssue extends ValidationIssue {
  undefinedType: 'literal-undefined' | 'incomplete-declaration' | 'missing-return' | 'missing-default'
  suggestedValue?: string
}

export interface UndefinedScanResult {
  issues: UndefinedValueIssue[]
  totalIssues: number
  criticalIssues: number
  warningIssues: number
  hasBlockingIssues: boolean
}

export class UndefinedValueDetector {
  private static readonly UNDEFINED_PATTERNS = {
    // Direct undefined keyword usage (not in strings or comments)
    LITERAL_UNDEFINED: /\bundefined\b/gi,
    
    // Incomplete variable declarations
    INCOMPLETE_VAR_DECLARATION: /(?:var|let)\s+\w+\s*:\s*\w+\s*=\s*$/gm,
    
    // Incomplete assignments
    INCOMPLETE_ASSIGNMENT: /\w+\s*=\s*$/gm,
    
    // Functions without return statements
    MISSING_RETURN: /access\([^)]+\)\s+fun\s+\w+\([^)]*\)\s*:\s*\w+\s*\{[^}]*\}/gs,
    
    // Function parameters without defaults where they might be expected
    MISSING_PARAM_DEFAULT: /fun\s+\w+\([^)]*(\w+\s*:\s*\w+\?)[^)]*\)/gm,
    
    // Resource declarations without proper initialization
    INCOMPLETE_RESOURCE: /resource\s+\w+\s*\{[^}]*\}/gm
  }

  private static readonly CADENCE_TYPES = {
    STRING: 'String',
    INT: 'Int',
    UINT: 'UInt',
    BOOL: 'Bool',
    ADDRESS: 'Address',
    ARRAY: 'Array',
    DICTIONARY: 'Dictionary'
  }

  /**
   * Scans code for undefined values and related issues
   */
  public scanForUndefinedValues(code: string): UndefinedScanResult {
    const issues: UndefinedValueIssue[] = []

    // Scan for each type of undefined issue
    issues.push(...this.detectLiteralUndefined(code))
    issues.push(...this.detectIncompleteDeclarations(code))
    issues.push(...this.detectMissingReturns(code))
    issues.push(...this.detectMissingDefaults(code))

    // Calculate summary statistics
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length
    const warningIssues = issues.filter(issue => issue.severity === 'warning').length
    const hasBlockingIssues = criticalIssues > 0

    return {
      issues,
      totalIssues: issues.length,
      criticalIssues,
      warningIssues,
      hasBlockingIssues
    }
  }

  /**
   * Detects literal "undefined" keywords in code
   */
  private detectLiteralUndefined(code: string): UndefinedValueIssue[] {
    const issues: UndefinedValueIssue[] = []
    const lines = code.split('\n')
    
    lines.forEach((line, lineIndex) => {
      // Skip lines that are comments or contain string literals
      if (this.isCommentOrStringLiteral(line)) {
        return
      }
      
      const matches = Array.from(line.matchAll(UndefinedValueDetector.UNDEFINED_PATTERNS.LITERAL_UNDEFINED))
      
      matches.forEach(match => {
        // Double-check that this undefined is not within a string literal
        if (this.isWithinStringLiteral(line, match.index || 0)) {
          return
        }
        
        const location = this.createLocation(lineIndex + 1, match.index || 0, match[0].length, line)
        const suggestedValue = this.inferDefaultValue(line) || this.inferDefaultValueFromDeclaration(line)
        
        issues.push({
          severity: 'critical',
          type: 'undefined-value',
          undefinedType: 'literal-undefined',
          location,
          message: 'Found literal "undefined" value in code. This will cause compilation errors.',
          suggestedFix: suggestedValue ? `Replace with: ${suggestedValue}` : 'Replace with appropriate default value',
          suggestedValue,
          autoFixable: true
        })
      })
    })

    return issues
  }

  /**
   * Detects incomplete variable declarations and assignments
   */
  private detectIncompleteDeclarations(code: string): UndefinedValueIssue[] {
    const issues: UndefinedValueIssue[] = []
    const lines = code.split('\n')

    lines.forEach((line, lineIndex) => {
      // Check for incomplete variable declarations (var/let with type but no value)
      const incompleteVarMatch = line.match(/(?:var|let)\s+\w+\s*:\s*\w+\s*=\s*$/)
      if (incompleteVarMatch) {
        const location = this.createLocation(lineIndex + 1, 0, line.length, line)
        const suggestedValue = this.inferDefaultValueFromDeclaration(line)
        
        issues.push({
          severity: 'critical',
          type: 'incomplete-declaration',
          undefinedType: 'incomplete-declaration',
          location,
          message: 'Variable declaration is incomplete - missing initialization value.',
          suggestedFix: `Add initialization value: ${suggestedValue}`,
          suggestedValue,
          autoFixable: true
        })
      } else {
        // Check for incomplete assignments (only if not a variable declaration)
        const incompleteAssignMatch = line.match(/\w+\s*=\s*$/)
        if (incompleteAssignMatch && !line.includes('var') && !line.includes('let')) {
          const location = this.createLocation(lineIndex + 1, 0, line.length, line)
          
          issues.push({
            severity: 'critical',
            type: 'incomplete-assignment',
            undefinedType: 'incomplete-declaration',
            location,
            message: 'Assignment statement is incomplete - missing value.',
            suggestedFix: 'Add appropriate value after the equals sign',
            autoFixable: false
          })
        }
      }
    })

    return issues
  }

  /**
   * Detects functions missing return statements
   */
  private detectMissingReturns(code: string): UndefinedValueIssue[] {
    const issues: UndefinedValueIssue[] = []
    
    // Find function declarations by looking for the pattern and then parsing manually
    const functionStartPattern = /access\([^)]+\)\s+fun\s+(\w+)\s*\([^)]*\)\s*:\s*/g
    let match
    
    while ((match = functionStartPattern.exec(code)) !== null) {
      const functionName = match[1]
      const afterColon = code.substring(match.index + match[0].length)
      
      // Find the function body opening brace (not part of a type definition)
      // We need to be careful about braces in type definitions like {String: Int}
      let braceIndex = -1
      let inTypeDefinition = false
      let typeDepth = 0
      
      for (let i = 0; i < afterColon.length; i++) {
        const char = afterColon[i]
        
        if (char === '{') {
          if (!inTypeDefinition) {
            // This might be the start of a type definition or function body
            // Check if there's a colon after this brace (indicating type definition)
            const remainingText = afterColon.substring(i)
            const nextBrace = remainingText.indexOf('}')
            const hasColon = nextBrace > 0 && remainingText.substring(0, nextBrace).includes(':')
            
            if (hasColon) {
              inTypeDefinition = true
              typeDepth = 1
            } else {
              // This is the function body opening brace
              braceIndex = i
              break
            }
          } else {
            typeDepth++
          }
        } else if (char === '}' && inTypeDefinition) {
          typeDepth--
          if (typeDepth === 0) {
            inTypeDefinition = false
          }
        } else if (char === '{' && !inTypeDefinition) {
          // This is the function body opening brace
          braceIndex = i
          break
        }
      }
      
      if (braceIndex === -1) continue
      
      const returnType = afterColon.substring(0, braceIndex).trim()
      
      // Find the matching closing brace
      let braceCount = 1
      let bodyEnd = braceIndex + 1
      while (bodyEnd < afterColon.length && braceCount > 0) {
        if (afterColon[bodyEnd] === '{') braceCount++
        else if (afterColon[bodyEnd] === '}') braceCount--
        bodyEnd++
      }
      
      const functionBody = afterColon.substring(braceIndex + 1, bodyEnd - 1)
      
      // Check if function body contains a return statement (not in comments)
      const hasReturn = this.hasReturnStatement(functionBody)
      
      if (!hasReturn) {
        const location = this.findLocationInCode(code, match.index)
        const suggestedValue = this.getDefaultValueForType(returnType)
        
        issues.push({
          severity: 'critical',
          type: 'missing-return',
          undefinedType: 'missing-return',
          location,
          message: `Function "${functionName}" with return type "${returnType}" is missing a return statement.`,
          suggestedFix: `Add return statement: return ${suggestedValue}`,
          suggestedValue,
          autoFixable: true
        })
      }
    }

    return issues
  }

  /**
   * Detects function parameters that might need default values
   */
  private detectMissingDefaults(code: string): UndefinedValueIssue[] {
    const issues: UndefinedValueIssue[] = []
    
    // Look for optional parameters (ending with ?) that might benefit from defaults
    const optionalParamPattern = /fun\s+\w+\s*\([^)]*(\w+\s*:\s*[^,)]+\?)[^)]*\)/g
    const matches = Array.from(code.matchAll(optionalParamPattern))

    matches.forEach(match => {
      const location = this.findLocationInCode(code, match.index || 0)
      
      issues.push({
        severity: 'warning',
        type: 'missing-default',
        undefinedType: 'missing-default',
        location,
        message: 'Optional parameter could benefit from a default value.',
        suggestedFix: 'Consider adding a default value for better usability',
        autoFixable: false
      })
    })

    return issues
  }

  /**
   * Infers appropriate default value from context
   */
  private inferDefaultValue(line: string): string | undefined {
    // Try to infer type from variable declaration (including complex types)
    const typeMatch = line.match(/:\s*([^=]+)/)
    if (typeMatch) {
      return this.getDefaultValueForType(typeMatch[1].trim())
    }

    // Try to infer from assignment context
    if (line.includes('String')) return '""'
    if (line.includes('Int') || line.includes('UInt')) return '0'
    if (line.includes('Bool')) return 'false'
    if (line.includes('Address')) return '0x0'

    return undefined
  }

  /**
   * Infers default value from variable declaration
   */
  private inferDefaultValueFromDeclaration(line: string): string {
    const typeMatch = line.match(/:\s*([^=]+)/)
    if (typeMatch) {
      return this.getDefaultValueForType(typeMatch[1].trim())
    }
    return '/* TODO: Add appropriate value */'
  }

  /**
   * Gets default value for a given Cadence type
   */
  private getDefaultValueForType(type: string): string {
    const trimmedType = type.trim()
    
    switch (trimmedType) {
      case 'String':
        return '""'
      case 'Int':
      case 'UInt':
      case 'UInt8':
      case 'UInt16':
      case 'UInt32':
      case 'UInt64':
      case 'UInt128':
      case 'UInt256':
      case 'Int8':
      case 'Int16':
      case 'Int32':
      case 'Int64':
      case 'Int128':
      case 'Int256':
        return '0'
      case 'Bool':
        return 'false'
      case 'Address':
        return '0x0'
      case 'UFix64':
      case 'Fix64':
        return '0.0'
      default:
        // Handle array types like [String], [Int], etc.
        if (trimmedType.startsWith('[') && trimmedType.endsWith(']')) return '[]'
        // Handle dictionary types like {String: Int}, {Address: UFix64}, etc.
        if (trimmedType.startsWith('{') && trimmedType.includes(':') && trimmedType.endsWith('}')) return '{}'
        // Handle optional types
        if (trimmedType.endsWith('?')) return 'nil'
        return 'nil'
    }
  }

  /**
   * Extracts return type from function signature
   */
  private extractReturnType(functionCode: string): string {
    const returnTypeMatch = functionCode.match(/:\s*(\w+)\s*\{/)
    return returnTypeMatch ? returnTypeMatch[1] : 'Unknown'
  }

  /**
   * Creates a CodeLocation object
   */
  private createLocation(line: number, column: number, length: number, context: string): CodeLocation {
    return {
      line,
      column,
      length,
      context: context.trim()
    }
  }

  /**
   * Finds location of a match within the full code
   */
  private findLocationInCode(code: string, index: number): CodeLocation {
    const beforeMatch = code.substring(0, index)
    const lines = beforeMatch.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length
    const contextLine = code.split('\n')[line - 1] || ''

    return this.createLocation(line, column, 0, contextLine)
  }

  /**
   * Checks if a line is a comment or contains only comments
   */
  private isCommentOrStringLiteral(line: string): boolean {
    const trimmed = line.trim()
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')
  }

  /**
   * Checks if a position in a line is within a string literal
   */
  private isWithinStringLiteral(line: string, position: number): boolean {
    let inString = false
    let stringChar = ''
    
    for (let i = 0; i < position; i++) {
      const char = line[i]
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true
        stringChar = char
      } else if (inString && char === stringChar && line[i - 1] !== '\\') {
        inString = false
        stringChar = ''
      }
    }
    
    return inString
  }

  /**
   * Checks if function body has a return statement (not in comments)
   */
  private hasReturnStatement(functionBody: string): boolean {
    const lines = functionBody.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Skip comment lines
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        continue
      }
      
      // Check for return statement
      if (/\breturn\s+/.test(line)) {
        return true
      }
    }
    
    return false
  }

  /**
   * Classifies the severity of undefined value issues
   */
  public static classifySeverity(issue: UndefinedValueIssue): 'critical' | 'warning' | 'info' {
    switch (issue.undefinedType) {
      case 'literal-undefined':
      case 'incomplete-declaration':
      case 'missing-return':
        return 'critical'
      case 'missing-default':
        return 'warning'
      default:
        return 'info'
    }
  }

  /**
   * Checks if an issue is auto-fixable
   */
  public static isAutoFixable(issue: UndefinedValueIssue): boolean {
    return issue.undefinedType !== 'missing-default' && !!issue.suggestedValue
  }
}