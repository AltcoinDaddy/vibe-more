/**
 * Code generation validation for Cadence 1.0 syntax compliance
 * Ensures generated code follows modern Cadence patterns and rejects legacy syntax
 */

import { ValidationResult } from './types'

export interface CodeValidationOptions {
  strictMode?: boolean
  allowWarnings?: boolean
  customPatterns?: LegacyPattern[]
}

export interface LegacyPattern {
  pattern: RegExp
  message: string
  severity: 'error' | 'warning'
  suggestion?: string
}

export interface ValidationIssue {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
  pattern: string
  suggestion?: string
}

export interface SyntaxValidationResult {
  isValid: boolean
  errors: SyntaxError[]
  warnings: SyntaxWarning[]
  structureIssues: StructureIssue[]
  functionIssues: FunctionIssue[]
  eventIssues: EventIssue[]
}

export interface SyntaxError {
  type: 'bracket-mismatch' | 'incomplete-statement' | 'invalid-syntax' | 'missing-keyword'
  location: CodeLocation
  message: string
  suggestion?: string
}

export interface SyntaxWarning {
  type: 'style' | 'best-practice' | 'potential-issue'
  location: CodeLocation
  message: string
  suggestion?: string
}

export interface StructureIssue {
  type: 'missing-init' | 'invalid-access-modifier' | 'incomplete-contract' | 'invalid-resource-structure'
  location: CodeLocation
  message: string
  severity: 'error' | 'warning'
  suggestion?: string
}

export interface FunctionIssue {
  type: 'incomplete-signature' | 'missing-return-type' | 'invalid-parameters' | 'missing-body'
  location: CodeLocation
  functionName: string
  message: string
  suggestion?: string
}

export interface EventIssue {
  type: 'invalid-definition' | 'missing-parameters' | 'invalid-parameter-types' | 'incomplete-event'
  location: CodeLocation
  eventName: string
  message: string
  suggestion?: string
}

export interface CodeLocation {
  line: number
  column: number
  length?: number
}

/**
 * Validates generated Cadence code for modern syntax compliance
 */
export class CodeValidator {
  private legacyPatterns: LegacyPattern[]

  constructor() {
    this.legacyPatterns = this.initializeLegacyPatterns()
  }

  /**
   * Comprehensive syntax validation for Cadence code
   */
  validateSyntax(code: string): SyntaxValidationResult {
    const errors: SyntaxError[] = []
    const warnings: SyntaxWarning[] = []
    const structureIssues: StructureIssue[] = []
    const functionIssues: FunctionIssue[] = []
    const eventIssues: EventIssue[] = []

    const lines = code.split('\n')
    
    // Validate bracket matching
    const bracketErrors = this.validateBracketMatching(code)
    errors.push(...bracketErrors)

    // Validate function signatures
    const funcIssues = this.validateFunctionSignatures(code)
    functionIssues.push(...funcIssues)

    // Validate contract and resource structure
    const structIssues = this.validateStructure(code)
    structureIssues.push(...structIssues)

    // Validate event definitions
    const evtIssues = this.validateEventDefinitions(code)
    eventIssues.push(...evtIssues)

    // Validate statement completeness
    const statementErrors = this.validateStatementCompleteness(code)
    errors.push(...statementErrors)

    // Check for common syntax issues
    const syntaxWarnings = this.validateSyntaxPatterns(code)
    warnings.push(...syntaxWarnings)

    const isValid = errors.length === 0 && structureIssues.filter(i => i.severity === 'error').length === 0 && functionIssues.length === 0 && eventIssues.length === 0

    return {
      isValid,
      errors,
      warnings,
      structureIssues,
      functionIssues,
      eventIssues
    }
  }

  /**
   * Validate bracket matching (parentheses, braces, square brackets)
   */
  private validateBracketMatching(code: string): SyntaxError[] {
    const errors: SyntaxError[] = []
    const stack: Array<{ char: string; line: number; column: number }> = []
    const lines = code.split('\n')
    const openBrackets = ['(', '{', '[']
    const closeBrackets = [')', '}', ']']
    const bracketPairs: { [key: string]: string } = { ')': '(', '}': '{', ']': '[' }

    // Remove strings and comments to avoid false positives
    const cleanedCode = this.removeCommentsAndStrings(code)
    const cleanedLines = cleanedCode.split('\n')

    cleanedLines.forEach((line, lineIndex) => {
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (openBrackets.includes(char)) {
          stack.push({ char, line: lineIndex + 1, column: i + 1 })
        } else if (closeBrackets.includes(char)) {
          if (stack.length === 0) {
            errors.push({
              type: 'bracket-mismatch',
              location: { line: lineIndex + 1, column: i + 1 },
              message: `Unexpected closing bracket '${char}'`,
              suggestion: `Remove the extra '${char}' or add matching opening bracket`
            })
          } else {
            const last = stack.pop()!
            if (last.char !== bracketPairs[char]) {
              errors.push({
                type: 'bracket-mismatch',
                location: { line: lineIndex + 1, column: i + 1 },
                message: `Mismatched brackets: expected '${last.char === '(' ? ')' : last.char === '{' ? '}' : ']'}' but found '${char}'`,
                suggestion: `Change '${char}' to match opening bracket '${last.char}' at line ${last.line}`
              })
            }
          }
        }
      }
    })

    // Check for unclosed brackets
    stack.forEach(bracket => {
      const expectedClose = bracket.char === '(' ? ')' : bracket.char === '{' ? '}' : ']'
      errors.push({
        type: 'bracket-mismatch',
        location: { line: bracket.line, column: bracket.column },
        message: `Unclosed bracket '${bracket.char}'`,
        suggestion: `Add closing bracket '${expectedClose}'`
      })
    })

    return errors
  }

  /**
   * Validate function signature completeness
   */
  private validateFunctionSignatures(code: string): FunctionIssue[] {
    const issues: FunctionIssue[] = []
    const lines = code.split('\n')
    
    lines.forEach((line, lineIndex) => {
      // Check for function declarations
      if (line.includes('fun ')) {
        const funMatch = line.match(/fun\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (funMatch) {
          const functionName = funMatch[1]
          
          // Check if the line has unmatched parentheses (incomplete signature)
          const openParens = (line.match(/\(/g) || []).length
          const closeParens = (line.match(/\)/g) || []).length
          
          if (openParens > closeParens) {
            issues.push({
              type: 'incomplete-signature',
              location: { line: lineIndex + 1, column: funMatch.index || 0 },
              functionName,
              message: `Incomplete function signature for '${functionName}'`,
              suggestion: 'Complete the function signature with parameters and return type'
            })
          } else if (openParens === closeParens && line.includes(')')) {
            // Complete signature, check for missing body
            if (!line.includes('{') && !line.includes(';')) {
              issues.push({
                type: 'missing-body',
                location: { line: lineIndex + 1, column: line.indexOf('fun') },
                functionName,
                message: `Function '${functionName}' is missing implementation body`,
                suggestion: 'Add function body with curly braces { }'
              })
            }
          }
          
          // Check for missing return type if function has return statement (for all complete functions)
          if (openParens === closeParens && line.includes(')') && functionName !== 'init' && functionName !== 'destroy' && !line.includes(': ')) {
            // Look ahead to see if there's a return statement in the function body
            let hasReturnStatement = false
            let braceCount = 0
            let foundOpenBrace = line.includes('{')
            
            if (foundOpenBrace) {
              braceCount += (line.match(/\{/g) || []).length
              braceCount -= (line.match(/\}/g) || []).length
            }
            
            for (let i = lineIndex; i < Math.min(lines.length, lineIndex + 20); i++) {
              const bodyLine = lines[i]
              
              if (!foundOpenBrace && bodyLine.includes('{')) {
                foundOpenBrace = true
                braceCount += (bodyLine.match(/\{/g) || []).length
                braceCount -= (bodyLine.match(/\}/g) || []).length
              }
              
              if (foundOpenBrace) {
                if (i > lineIndex) {
                  braceCount += (bodyLine.match(/\{/g) || []).length
                  braceCount -= (bodyLine.match(/\}/g) || []).length
                }
                
                if (bodyLine.includes('return ') && !bodyLine.trim().startsWith('//')) {
                  hasReturnStatement = true
                  break
                }
                
                if (braceCount <= 0 && i > lineIndex) break
              }
            }
            
            if (hasReturnStatement) {
              issues.push({
                type: 'missing-return-type',
                location: { line: lineIndex + 1, column: funMatch.index || 0 },
                functionName,
                message: `Function '${functionName}' has return statement but no return type specified`,
                suggestion: 'Add return type to function signature (e.g., ": String", ": Int", etc.)'
              })
            }
          }
        }
      }
    })

    return issues
  }

  /**
   * Validate contract and resource structure
   */
  private validateStructure(code: string): StructureIssue[] {
    const issues: StructureIssue[] = []
    const lines = code.split('\n')
    
    // Check for contract/resource declarations
    const contractPattern = /(?:access\([^)]+\)\s+)?contract\s+([a-zA-Z_][a-zA-Z0-9_]*)/
    const resourcePattern = /(?:access\([^)]+\)\s+)?resource\s+([a-zA-Z_][a-zA-Z0-9_]*)/
    
    let hasContract = false
    let hasInit = false
    let contractName = ''
    
    lines.forEach((line, lineIndex) => {
      // Check contract declaration
      const contractMatch = line.match(contractPattern)
      if (contractMatch) {
        hasContract = true
        contractName = contractMatch[1]
        
        // Validate access modifier
        if (!line.includes('access(')) {
          issues.push({
            type: 'invalid-access-modifier',
            location: { line: lineIndex + 1, column: line.indexOf('contract') },
            message: `Contract '${contractName}' is missing access modifier`,
            severity: 'error',
            suggestion: 'Add access modifier like "access(all)" before contract keyword'
          })
        }
      }
      
      // Check resource declaration
      const resourceMatch = line.match(resourcePattern)
      if (resourceMatch) {
        const resourceName = resourceMatch[1]
        
        // Validate access modifier for resource
        if (!line.includes('access(')) {
          issues.push({
            type: 'invalid-access-modifier',
            location: { line: lineIndex + 1, column: line.indexOf('resource') },
            message: `Resource '${resourceName}' is missing access modifier`,
            severity: 'error',
            suggestion: 'Add access modifier like "access(all)" before resource keyword'
          })
        }
        
        // Check for proper resource structure (should have destroy function)
        let hasDestroy = false
        let braceCount = 0
        let foundOpenBrace = false
        
        for (let i = lineIndex; i < Math.min(lines.length, lineIndex + 50); i++) {
          const bodyLine = lines[i]
          if (bodyLine.includes('{')) {
            foundOpenBrace = true
            braceCount += (bodyLine.match(/\{/g) || []).length
          }
          if (bodyLine.includes('}')) {
            braceCount -= (bodyLine.match(/\}/g) || []).length
          }
          if (foundOpenBrace && bodyLine.includes('destroy(')) {
            hasDestroy = true
            break
          }
          if (braceCount === 0 && foundOpenBrace) break
        }
        
        if (!hasDestroy) {
          issues.push({
            type: 'invalid-resource-structure',
            location: { line: lineIndex + 1, column: resourceMatch.index || 0 },
            message: `Resource '${resourceName}' is missing destroy() function`,
            severity: 'warning',
            suggestion: 'Add destroy() function to properly handle resource cleanup'
          })
        }
      }
      
      // Check for init function
      if (line.includes('init(')) {
        hasInit = true
      }
    })
    
    // If we have a contract but no init function, that's an issue
    if (hasContract && !hasInit) {
      issues.push({
        type: 'missing-init',
        location: { line: 1, column: 0 },
        message: `Contract '${contractName}' is missing init() function`,
        severity: 'error',
        suggestion: 'Add init() function to initialize contract state'
      })
    }
    
    return issues
  }

  /**
   * Validate event definitions and parameter types
   */
  private validateEventDefinitions(code: string): EventIssue[] {
    const issues: EventIssue[] = []
    const lines = code.split('\n')
    
    // Pattern to match event declarations
    const eventPattern = /(?:access\([^)]+\)\s+)?event\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/g
    
    lines.forEach((line, lineIndex) => {
      const eventMatches = Array.from(line.matchAll(eventPattern))
      
      eventMatches.forEach(match => {
        const eventName = match[1]
        const parameters = match[2]
        
        // Check if event has proper access modifier
        if (!line.includes('access(')) {
          issues.push({
            type: 'invalid-definition',
            location: { line: lineIndex + 1, column: match.index || 0 },
            eventName,
            message: `Event '${eventName}' is missing access modifier`,
            suggestion: 'Add access modifier like "access(all)" before event keyword'
          })
        }
        
        // Validate parameter types
        if (parameters.trim()) {
          const paramList = parameters.split(',').map(p => p.trim())
          
          paramList.forEach((param, paramIndex) => {
            // Check if parameter has type annotation
            if (!param.includes(':')) {
              issues.push({
                type: 'invalid-parameter-types',
                location: { line: lineIndex + 1, column: (match.index || 0) + match[0].indexOf(param) },
                eventName,
                message: `Event '${eventName}' parameter '${param}' is missing type annotation`,
                suggestion: 'Add type annotation (e.g., "paramName: String")'
              })
            } else {
              // Validate parameter format
              const [paramName, paramType] = param.split(':').map(p => p.trim())
              
              if (!paramName || !paramType) {
                issues.push({
                  type: 'invalid-parameter-types',
                  location: { line: lineIndex + 1, column: (match.index || 0) + match[0].indexOf(param) },
                  eventName,
                  message: `Event '${eventName}' has malformed parameter '${param}'`,
                  suggestion: 'Use format "parameterName: ParameterType"'
                })
              }
              
              // Check for valid type names (basic validation)
              const validTypes = ['String', 'Int', 'UInt', 'UInt8', 'UInt16', 'UInt32', 'UInt64', 'UInt128', 'UInt256', 
                                'Int8', 'Int16', 'Int32', 'Int64', 'Int128', 'Int256', 'Bool', 'Address', 'UFix64', 'Fix64']
              const isArrayType = paramType.startsWith('[') && paramType.endsWith(']')
              const isOptionalType = paramType.endsWith('?')
              const isReferenceType = paramType.startsWith('&')
              const baseType = paramType.replace(/[\[\]?&]/g, '')
              
              if (!validTypes.includes(baseType) && !baseType.includes('.') && !/^[A-Z][a-zA-Z0-9_]*$/.test(baseType)) {
                issues.push({
                  type: 'invalid-parameter-types',
                  location: { line: lineIndex + 1, column: (match.index || 0) + match[0].indexOf(paramType) },
                  eventName,
                  message: `Event '${eventName}' parameter '${paramName}' has potentially invalid type '${paramType}'`,
                  suggestion: 'Ensure type name follows Cadence naming conventions'
                })
              }
            }
          })
        }
      })
      
      // Check for incomplete event declarations - events without parentheses
      if (line.includes('event ')) {
        const match = line.match(/event\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
        if (match) {
          issues.push({
            type: 'incomplete-event',
            location: { line: lineIndex + 1, column: line.indexOf('event') },
            eventName: match[1],
            message: `Event '${match[1]}' declaration is incomplete`,
            suggestion: 'Add parameter list in parentheses, even if empty: "()"'
          })
        }
      }
    })
    
    return issues
  }

  /**
   * Validate statement completeness
   */
  private validateStatementCompleteness(code: string): SyntaxError[] {
    const errors: SyntaxError[] = []
    const lines = code.split('\n')
    
    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim()
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return
      }
      
      // Check for statements that should end with semicolon or have proper structure
      const needsSemicolon = /^(let|var|return|emit|destroy|panic)\s/.test(trimmed)
      const isDeclaration = /^(access\([^)]+\)\s+)?(contract|resource|struct|interface|event|fun|init)\s/.test(trimmed)
      const isControlFlow = /^(if|while|for|switch)\s/.test(trimmed)
      const endsWithBrace = trimmed.endsWith('{') || trimmed.endsWith('}')
      

      
      // Check for incomplete variable declarations
      if (trimmed.startsWith('var ') || trimmed.startsWith('let ')) {
        const varMatch = trimmed.match(/^(var|let)\s+(\w+)\s*$/);
        if (varMatch) {
          // Variable declaration with just name, no type or initialization
          errors.push({
            type: 'incomplete-statement',
            location: { line: lineIndex + 1, column: 0 },
            message: `Variable declaration is missing type annotation or initialization`,
            suggestion: 'Add type annotation (: Type) or initialization (= value)'
          })
        } else if (!trimmed.includes(':') && !trimmed.includes('=') && !trimmed.endsWith(';')) {
          errors.push({
            type: 'incomplete-statement',
            location: { line: lineIndex + 1, column: 0 },
            message: `Variable declaration is missing type annotation or initialization`,
            suggestion: 'Add type annotation (: Type) or initialization (= value)'
          })
        }
      }
      
      // Check for statements that should end with semicolon (excluding return statements)
      const needsSemicolonExcludingReturn = /^(let|var|emit|destroy|panic)\s/.test(trimmed)
      if (needsSemicolonExcludingReturn && !trimmed.endsWith(';') && !endsWithBrace) {
        errors.push({
          type: 'incomplete-statement',
          location: { line: lineIndex + 1, column: trimmed.length },
          message: `Statement appears to be missing semicolon`,
          suggestion: 'Add semicolon at the end of the statement'
        })
      }
    })
    
    return errors
  }

  /**
   * Validate common syntax patterns and style issues
   */
  private validateSyntaxPatterns(code: string): SyntaxWarning[] {
    const warnings: SyntaxWarning[] = []
    const lines = code.split('\n')
    
    lines.forEach((line, lineIndex) => {
      // Check for inconsistent spacing - function calls should have no space before parentheses
      const spacingMatch = line.match(/\w\s+\(/);
      if (spacingMatch && !line.includes('fun ') && !line.includes('if ') && !line.includes('while ') && !line.includes('for ')) {
        warnings.push({
          type: 'style',
          location: { line: lineIndex + 1, column: line.indexOf(spacingMatch[0]) },
          message: 'Unnecessary space before parentheses in function call',
          suggestion: 'Remove space before opening parenthesis'
        })
      }
      
      // Check for missing spaces around operators (excluding path literals)
      if (!line.includes('/storage/') && !line.includes('/public/') && !line.includes('/private/')) {
        const operatorPattern = /\w[+\-*/=<>!]=?\w/g
        const operatorMatches = Array.from(line.matchAll(operatorPattern))
        operatorMatches.forEach(match => {
          warnings.push({
            type: 'style',
            location: { line: lineIndex + 1, column: match.index || 0 },
            message: 'Missing spaces around operator',
            suggestion: 'Add spaces around operators for better readability'
          })
        })
      }
      
      // Check for potential naming convention issues
      const functionMatch = line.match(/fun\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (functionMatch) {
        const functionName = functionMatch[1]
        // Check if function name starts with uppercase (not camelCase)
        if (functionName !== 'init' && functionName !== 'destroy' && /^[A-Z]/.test(functionName)) {
          warnings.push({
            type: 'best-practice',
            location: { line: lineIndex + 1, column: line.indexOf(functionName) },
            message: `Function name '${functionName}' should use camelCase`,
            suggestion: 'Use camelCase for function names (e.g., "myFunction")'
          })
        }
      }
      
      // Check for potential resource handling issues
      if (line.includes('<-') && !line.includes('destroy')) {
        warnings.push({
          type: 'potential-issue',
          location: { line: lineIndex + 1, column: line.indexOf('<-') },
          message: 'Resource move operation detected - ensure proper resource handling',
          suggestion: 'Verify that resources are properly managed and destroyed when no longer needed'
        })
      }
    })
    
    return warnings
  }

  /**
   * Initialize patterns that indicate legacy Cadence syntax
   */
  private initializeLegacyPatterns(): LegacyPattern[] {
    return [
      // Critical errors - must be rejected
      {
        pattern: /\bpub\s+/g,
        message: 'Legacy "pub" keyword detected',
        severity: 'error',
        suggestion: 'Use "access(all)" instead of "pub"'
      },
      {
        pattern: /\bpub\(set\)\s+/g,
        message: 'Legacy "pub(set)" keyword detected',
        severity: 'error',
        suggestion: 'Use "access(all)" with proper setter access control'
      },
      {
        pattern: /\baccount\.save\(/g,
        message: 'Legacy storage API detected',
        severity: 'error',
        suggestion: 'Use "account.storage.save()" instead'
      },
      {
        pattern: /\baccount\.link\b/g,
        message: 'Legacy linking API detected',
        severity: 'error',
        suggestion: 'Use modern capability-based linking with account.capabilities'
      },
      {
        pattern: /\baccount\.borrow\b/g,
        message: 'Legacy borrow API detected',
        severity: 'error',
        suggestion: 'Use "account.capabilities.borrow()" instead'
      },
      {
        pattern: /\baccount\.getCapability\b/g,
        message: 'Legacy capability API detected',
        severity: 'error',
        suggestion: 'Use "account.capabilities.get()" instead'
      },
      {
        pattern: /\bresource\s+\w+\s*:\s*[A-Za-z_][A-Za-z0-9_.]*\s*,\s*[A-Za-z_][A-Za-z0-9_.]*\s*\{/g,
        message: 'Legacy interface conformance syntax detected',
        severity: 'error',
        suggestion: 'Use "&" to separate multiple interfaces (e.g., "Interface1 & Interface2")'
      },

      // Warnings - potentially outdated patterns
      {
        pattern: /AuthAccount/g,
        message: 'AuthAccount type may be deprecated',
        severity: 'warning',
        suggestion: 'Consider using modern account access patterns'
      },
      {
        pattern: /PublicAccount/g,
        message: 'PublicAccount type may be deprecated',
        severity: 'warning',
        suggestion: 'Consider using modern account access patterns'
      },
      {
        pattern: /\.copy\(\)/g,
        message: 'Copy method usage detected',
        severity: 'warning',
        suggestion: 'Ensure copy semantics are appropriate for your use case'
      },

      {
        pattern: /import\s+\w+\s+from\s+0x[a-fA-F0-9]+/g,
        message: 'Hardcoded contract address in import',
        severity: 'warning',
        suggestion: 'Consider using named imports for standard contracts'
      },
      {
        pattern: /panic\s*\(\s*"[^"]*"\s*\)/g,
        message: 'Generic panic message detected',
        severity: 'warning',
        suggestion: 'Use descriptive panic messages for better debugging'
      },

    ]
  }

  /**
   * Validate generated code for Cadence 1.0 compliance
   */
  validateCode(code: string, options: CodeValidationOptions = {}): ValidationResult {
    const issues: ValidationIssue[] = []
    const lines = code.split('\n')
    const cleanedLines = this.removeCommentsAndStrings(code).split('\n')
    
    // Use default patterns plus any custom ones
    const patterns = [...this.legacyPatterns, ...(options.customPatterns || [])]

    // Check each line for legacy patterns (use cleaned lines to avoid false positives)
    cleanedLines.forEach((line, lineIndex) => {
      patterns.forEach(legacyPattern => {
        const matches = Array.from(line.matchAll(legacyPattern.pattern))
        
        matches.forEach(match => {
          const issue: ValidationIssue = {
            line: lineIndex + 1,
            column: match.index || 0,
            message: legacyPattern.message,
            severity: legacyPattern.severity,
            pattern: legacyPattern.pattern.source,
            suggestion: legacyPattern.suggestion
          }
          issues.push(issue)
        })
      })
    })

    // Run comprehensive syntax validation
    const syntaxValidation = this.validateSyntax(code)
    
    // Combine legacy pattern issues with syntax validation issues
    const allErrors = [
      ...issues.filter(issue => issue.severity === 'error').map(e => `Line ${e.line}:${e.column} - ${e.message}${e.suggestion ? ` (${e.suggestion})` : ''}`),
      ...syntaxValidation.errors.map(e => `Line ${e.location.line}:${e.location.column} - ${e.message}${e.suggestion ? ` (${e.suggestion})` : ''}`),
      ...syntaxValidation.structureIssues.filter(i => i.severity === 'error').map(i => `Line ${i.location.line}:${i.location.column} - ${i.message}${i.suggestion ? ` (${i.suggestion})` : ''}`),
      ...syntaxValidation.functionIssues.map(f => `Line ${f.location.line}:${f.location.column} - ${f.message}${f.suggestion ? ` (${f.suggestion})` : ''}`),
      ...syntaxValidation.eventIssues.map(e => `Line ${e.location.line}:${e.location.column} - ${e.message}${e.suggestion ? ` (${e.suggestion})` : ''}`)
    ]
    
    const allWarnings = [
      ...issues.filter(issue => issue.severity === 'warning').map(w => `Line ${w.line}:${w.column} - ${w.message}${w.suggestion ? ` (${w.suggestion})` : ''}`),
      ...syntaxValidation.warnings.map(w => `Line ${w.location.line}:${w.location.column} - ${w.message}${w.suggestion ? ` (${w.suggestion})` : ''}`),
      ...syntaxValidation.structureIssues.filter(i => i.severity === 'warning').map(i => `Line ${i.location.line}:${i.location.column} - ${i.message}${i.suggestion ? ` (${i.suggestion})` : ''}`)
    ]

    // Determine if validation passes
    const hasErrors = allErrors.length > 0
    const hasWarnings = allWarnings.length > 0
    const isValid = !hasErrors && (options.allowWarnings || !hasWarnings)

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
      compilationSuccess: isValid
    }
  }

  /**
   * Check if code contains any legacy "pub" keywords (excluding comments and strings)
   */
  containsLegacyPubKeywords(code: string): boolean {
    // Remove comments and strings to avoid false positives
    const cleanedCode = this.removeCommentsAndStrings(code)
    const pubPattern = /\bpub\s+/g
    const pubSetPattern = /\bpub\(set\)\s+/g
    
    return pubPattern.test(cleanedCode) || pubSetPattern.test(cleanedCode)
  }

  /**
   * Remove comments and string literals to avoid false pattern matches
   */
  private removeCommentsAndStrings(code: string): string {
    // Remove single-line comments
    let cleaned = code.replace(/\/\/.*$/gm, '')
    
    // Remove multi-line comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '')
    
    // Remove string literals (both single and double quotes)
    cleaned = cleaned.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""')
    cleaned = cleaned.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "''")
    
    return cleaned
  }

  /**
   * Get detailed analysis of legacy patterns in code
   */
  analyzeLegacyPatterns(code: string): {
    hasLegacyPatterns: boolean
    criticalIssues: number
    warnings: number
    patterns: string[]
  } {
    const validation = this.validateCode(code)
    const criticalIssues = validation.errors.length
    const warnings = validation.warnings.length
    
    // Extract unique pattern names
    const lines = code.split('\n')
    const foundPatterns = new Set<string>()
    
    lines.forEach(line => {
      this.legacyPatterns.forEach(pattern => {
        if (pattern.pattern.test(line)) {
          foundPatterns.add(pattern.message)
        }
      })
    })

    return {
      hasLegacyPatterns: criticalIssues > 0 || warnings > 0,
      criticalIssues,
      warnings,
      patterns: Array.from(foundPatterns)
    }
  }

  /**
   * Automatically reject code containing critical legacy patterns
   */
  shouldRejectCode(code: string): { shouldReject: boolean; reason: string } {
    // Check for critical legacy patterns that should cause automatic rejection
    const criticalPatterns = [
      { pattern: /\bpub\s+/g, reason: 'Contains legacy "pub" keyword' },
      { pattern: /\bpub\(set\)\s+/g, reason: 'Contains legacy "pub(set)" keyword' },
      { pattern: /\baccount\.save\(/g, reason: 'Uses legacy storage API' },
      { pattern: /\baccount\.link\b/g, reason: 'Uses legacy linking API' },
      { pattern: /\baccount\.borrow\b/g, reason: 'Uses legacy borrow API' }
    ]

    for (const { pattern, reason } of criticalPatterns) {
      if (pattern.test(code)) {
        return { shouldReject: true, reason }
      }
    }

    return { shouldReject: false, reason: '' }
  }

  /**
   * Generate suggestions for fixing legacy code
   */
  generateFixSuggestions(code: string): string[] {
    const suggestions: string[] = []
    const validation = this.validateCode(code)

    if (validation.errors.length > 0) {
      suggestions.push('Critical issues found that must be fixed:')
      validation.errors.forEach(error => {
        suggestions.push(`  • ${error}`)
      })
    }

    if (validation.warnings.length > 0) {
      suggestions.push('Potential improvements:')
      validation.warnings.forEach(warning => {
        suggestions.push(`  • ${warning}`)
      })
    }

    // Add general modernization suggestions
    if (code.includes('pub ')) {
      suggestions.push('Replace all "pub" keywords with appropriate access modifiers like "access(all)"')
    }

    if (code.includes('account.save') || code.includes('account.link') || code.includes('account.borrow')) {
      suggestions.push('Update to modern storage and capability APIs')
    }

    return suggestions
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(code: string, options: CodeValidationOptions = {}): ValidationReport {
    const validation = this.validateCode(code, options)
    const analysis = this.analyzeLegacyPatterns(code)
    const suggestions = this.generateFixSuggestions(code)
    const rejection = this.shouldRejectCode(code)

    const lines = code.split('\n')
    const totalLines = lines.length
    const nonEmptyLines = lines.filter(line => line.trim().length > 0).length

    return {
      timestamp: new Date(),
      codeMetrics: {
        totalLines,
        nonEmptyLines,
        hasContent: nonEmptyLines > 0
      },
      validation,
      analysis,
      rejection,
      suggestions,
      compliance: {
        isCadence10Compliant: validation.isValid && !rejection.shouldReject,
        complianceScore: this.calculateComplianceScore(validation, analysis),
        readyForProduction: validation.isValid && !rejection.shouldReject && validation.warnings.length === 0
      },
      recommendations: this.generateRecommendations(validation, analysis, rejection)
    }
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(validation: ValidationResult, analysis: any): number {
    let score = 100

    // Deduct points for errors (critical)
    score -= validation.errors.length * 20

    // Deduct points for warnings (minor)
    score -= validation.warnings.length * 5

    // Deduct points for legacy patterns
    score -= analysis.criticalIssues * 15

    return Math.max(0, score)
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(validation: ValidationResult, analysis: any, rejection: any): string[] {
    const recommendations: string[] = []

    if (rejection.shouldReject) {
      recommendations.push(`🚨 CRITICAL: ${rejection.reason} - Code must be fixed before deployment`)
    }

    if (validation.errors.length > 0) {
      recommendations.push(`🔧 Fix ${validation.errors.length} critical error(s) to ensure Cadence 1.0 compatibility`)
    }

    if (validation.warnings.length > 0) {
      recommendations.push(`⚠️ Address ${validation.warnings.length} warning(s) to improve code quality`)
    }

    if (analysis.hasLegacyPatterns) {
      recommendations.push('🔄 Modernize legacy patterns to follow current Cadence best practices')
    }

    if (validation.isValid && !rejection.shouldReject && validation.warnings.length === 0) {
      recommendations.push('✅ Code is fully compliant with Cadence 1.0 and ready for production')
    }

    return recommendations
  }
}

export interface ValidationReport {
  timestamp: Date
  codeMetrics: {
    totalLines: number
    nonEmptyLines: number
    hasContent: boolean
  }
  validation: ValidationResult
  analysis: {
    hasLegacyPatterns: boolean
    criticalIssues: number
    warnings: number
    patterns: string[]
  }
  rejection: {
    shouldReject: boolean
    reason: string
  }
  suggestions: string[]
  compliance: {
    isCadence10Compliant: boolean
    complianceScore: number
    readyForProduction: boolean
  }
  recommendations: string[]
}

// Export singleton instance
export const codeValidator = new CodeValidator()