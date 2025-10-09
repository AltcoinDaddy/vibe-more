/**
 * AutoCorrectionEngine
 * 
 * Automatically corrects common issues in AI-generated Cadence code including
 * undefined values, syntax errors, incomplete statements, and bracket mismatches.
 */

import { Correction, CodeLocation, CorrectionAttempt } from './types'
import { UndefinedValueDetector, UndefinedValueIssue } from './undefined-value-detector'
import { QALogger } from './logger'

export interface CorrectionResult {
  correctedCode: string
  correctionsApplied: Correction[]
  confidence: number
  requiresRegeneration: boolean
  success: boolean
  originalIssueCount: number
  remainingIssueCount: number
}

export interface CorrectionValidation {
  isValid: boolean
  newIssuesIntroduced: ValidationIssue[]
  qualityImprovement: number
  riskAssessment: 'low' | 'medium' | 'high'
}

export interface ValidationIssue {
  type: string
  severity: 'critical' | 'warning' | 'info'
  location: CodeLocation
  message: string
}

export interface BracketMismatch {
  type: 'missing-open' | 'missing-close' | 'mismatched'
  location: CodeLocation
  expectedBracket: string
  actualBracket?: string
  autoFixable: boolean
}

export interface IncompleteStatement {
  type: 'incomplete-expression' | 'incomplete-declaration' | 'incomplete-function'
  location: CodeLocation
  context: string
  suggestedCompletion: string
  confidence: number
}

export class AutoCorrectionEngine {
  private logger: QALogger
  private undefinedDetector: UndefinedValueDetector

  constructor() {
    this.logger = new QALogger('AutoCorrectionEngine')
    this.undefinedDetector = new UndefinedValueDetector()
  }

  /**
   * Main correction method that applies all available corrections
   */
  public async correctCode(code: string, context?: any): Promise<CorrectionResult> {
    this.logger.info('Starting auto-correction process')
    const startTime = Date.now()
    
    let correctedCode = code
    const correctionsApplied: Correction[] = []
    let confidence = 100
    let requiresRegeneration = false

    try {
      // Step 1: Fix undefined values
      const undefinedResult = this.correctUndefinedValues(correctedCode)
      if (undefinedResult.success) {
        correctedCode = undefinedResult.correctedCode
        correctionsApplied.push(...undefinedResult.correctionsApplied)
        confidence = Math.min(confidence, undefinedResult.confidence)
      }

      // Step 2: Fix bracket and parentheses mismatches
      const bracketResult = this.fixBracketMismatches(correctedCode)
      if (bracketResult.success) {
        correctedCode = bracketResult.correctedCode
        correctionsApplied.push(...bracketResult.correctionsApplied)
        confidence = Math.min(confidence, bracketResult.confidence)
      }

      // Step 3: Complete incomplete statements
      const statementResult = this.completeIncompleteStatements(correctedCode)
      if (statementResult.success) {
        correctedCode = statementResult.correctedCode
        correctionsApplied.push(...statementResult.correctionsApplied)
        confidence = Math.min(confidence, statementResult.confidence)
      }

      // Step 4: Fix syntax errors
      const syntaxResult = this.fixSyntaxErrors(correctedCode)
      if (syntaxResult.success) {
        correctedCode = syntaxResult.correctedCode
        correctionsApplied.push(...syntaxResult.correctionsApplied)
        confidence = Math.min(confidence, syntaxResult.confidence)
      }

      // Determine if regeneration is needed based on confidence and remaining issues
      requiresRegeneration = confidence < 70 || this.hasRemainingCriticalIssues(correctedCode)

      const originalIssueCount = this.countIssues(code)
      const remainingIssueCount = this.countIssues(correctedCode)

      const result: CorrectionResult = {
        correctedCode,
        correctionsApplied,
        confidence,
        requiresRegeneration,
        success: correctionsApplied.length > 0 || originalIssueCount === 0,
        originalIssueCount,
        remainingIssueCount
      }

      const duration = Date.now() - startTime
      this.logger.info(`Auto-correction completed in ${duration}ms`, {
        correctionsApplied: correctionsApplied.length,
        confidence,
        requiresRegeneration
      })

      return result

    } catch (error) {
      this.logger.error('Auto-correction failed', error)
      return {
        correctedCode: code,
        correctionsApplied: [],
        confidence: 0,
        requiresRegeneration: true,
        success: false,
        originalIssueCount: this.countIssues(code),
        remainingIssueCount: this.countIssues(code)
      }
    }
  }

  /**
   * Corrects undefined values in the code
   */
  public correctUndefinedValues(code: string): CorrectionResult {
    this.logger.debug('Correcting undefined values')
    
    const scanResult = this.undefinedDetector.scanForUndefinedValues(code)
    if (scanResult.totalIssues === 0) {
      return {
        correctedCode: code,
        correctionsApplied: [],
        confidence: 100,
        requiresRegeneration: false,
        success: true,
        originalIssueCount: 0,
        remainingIssueCount: 0
      }
    }

    let correctedCode = code
    const correctionsApplied: Correction[] = []
    let confidence = 90

    // Sort issues by line number (descending) to avoid position shifts during correction
    const sortedIssues = scanResult.issues
      .filter(issue => issue.autoFixable && issue.suggestedValue)
      .sort((a, b) => b.location.line - a.location.line)

    for (const issue of sortedIssues) {
      try {
        const correction = this.applyUndefinedValueFix(correctedCode, issue)
        if (correction) {
          correctedCode = correction.correctedCode
          correctionsApplied.push(correction.correction)
          
          // Reduce confidence slightly for each correction
          confidence = Math.max(confidence - 5, 60)
        }
      } catch (error) {
        this.logger.warn(`Failed to apply undefined value fix at line ${issue.location.line}`, error)
        confidence = Math.max(confidence - 10, 40)
      }
    }

    return {
      correctedCode,
      correctionsApplied,
      confidence,
      requiresRegeneration: confidence < 70,
      success: correctionsApplied.length > 0,
      originalIssueCount: scanResult.totalIssues,
      remainingIssueCount: this.undefinedDetector.scanForUndefinedValues(correctedCode).totalIssues
    }
  }

  /**
   * Fixes bracket and parentheses mismatches
   */
  public fixBracketMismatches(code: string): CorrectionResult {
    this.logger.debug('Fixing bracket mismatches')
    
    const mismatches = this.detectBracketMismatches(code)
    if (mismatches.length === 0) {
      return {
        correctedCode: code,
        correctionsApplied: [],
        confidence: 100,
        requiresRegeneration: false,
        success: true,
        originalIssueCount: 0,
        remainingIssueCount: 0
      }
    }

    let correctedCode = code
    const correctionsApplied: Correction[] = []
    let confidence = 85

    // Fix bracket mismatches (process from end to beginning to avoid position shifts)
    const sortedMismatches = mismatches
      .filter(mismatch => mismatch.autoFixable)
      .sort((a, b) => b.location.line - a.location.line)

    for (const mismatch of sortedMismatches) {
      try {
        const correction = this.applyBracketFix(correctedCode, mismatch)
        if (correction) {
          correctedCode = correction.correctedCode
          correctionsApplied.push(correction.correction)
          confidence = Math.max(confidence - 3, 50)
        }
      } catch (error) {
        this.logger.warn(`Failed to apply bracket fix at line ${mismatch.location.line}`, error)
        confidence = Math.max(confidence - 10, 30)
      }
    }

    return {
      correctedCode,
      correctionsApplied,
      confidence,
      requiresRegeneration: confidence < 60,
      success: correctionsApplied.length > 0,
      originalIssueCount: mismatches.length,
      remainingIssueCount: this.detectBracketMismatches(correctedCode).length
    }
  }

  /**
   * Completes incomplete statements and expressions
   */
  public completeIncompleteStatements(code: string): CorrectionResult {
    this.logger.debug('Completing incomplete statements')
    
    const incompleteStatements = this.detectIncompleteStatements(code)
    if (incompleteStatements.length === 0) {
      return {
        correctedCode: code,
        correctionsApplied: [],
        confidence: 100,
        requiresRegeneration: false,
        success: true,
        originalIssueCount: 0,
        remainingIssueCount: 0
      }
    }

    let correctedCode = code
    const correctionsApplied: Correction[] = []
    let confidence = 80

    // Sort by line number (descending) to avoid position shifts
    const sortedStatements = incompleteStatements
      .filter(stmt => stmt.confidence > 60)
      .sort((a, b) => b.location.line - a.location.line)

    for (const statement of sortedStatements) {
      try {
        const correction = this.applyStatementCompletion(correctedCode, statement)
        if (correction) {
          correctedCode = correction.correctedCode
          correctionsApplied.push(correction.correction)
          confidence = Math.max(confidence - 5, 40)
        }
      } catch (error) {
        this.logger.warn(`Failed to complete statement at line ${statement.location.line}`, error)
        confidence = Math.max(confidence - 10, 30)
      }
    }

    return {
      correctedCode,
      correctionsApplied,
      confidence,
      requiresRegeneration: confidence < 60,
      success: correctionsApplied.length > 0,
      originalIssueCount: incompleteStatements.length,
      remainingIssueCount: this.detectIncompleteStatements(correctedCode).length
    }
  }

  /**
   * Fixes general syntax errors
   */
  public fixSyntaxErrors(code: string): CorrectionResult {
    this.logger.debug('Fixing syntax errors')
    
    let correctedCode = code
    const correctionsApplied: Correction[] = []
    let confidence = 90
    let totalMatches = 0

    // Fix common syntax patterns
    const syntaxFixes = [
      // Fix trailing commas in function parameters
      {
        pattern: /,(\s*\))/g,
        replacement: '$1',
        type: 'syntax-fix' as const,
        reasoning: 'Removed trailing comma'
      }
    ]

    for (const fix of syntaxFixes) {
      const matches = Array.from(correctedCode.matchAll(fix.pattern))
      totalMatches += matches.length
      
      if (matches.length > 0) {
        const newCode = correctedCode.replace(fix.pattern, fix.replacement)
        
        for (const match of matches) {
          const location = this.findLocationInCode(correctedCode, match.index || 0)
          correctionsApplied.push({
            type: fix.type,
            location,
            originalValue: match[0],
            correctedValue: fix.replacement,
            reasoning: fix.reasoning,
            confidence: 85
          })
        }
        
        correctedCode = newCode
        confidence = Math.max(confidence - 2, 70)
      }
    }

    return {
      correctedCode,
      correctionsApplied,
      confidence,
      requiresRegeneration: false,
      success: true, // Always successful, even if no corrections were needed
      originalIssueCount: totalMatches,
      remainingIssueCount: 0
    }
  }

  /**
   * Validates corrections to ensure they don't introduce new issues
   */
  public validateCorrections(originalCode: string, correctedCode: string): CorrectionValidation {
    this.logger.debug('Validating corrections')
    
    try {
      const originalIssues = this.undefinedDetector.scanForUndefinedValues(originalCode)
      const correctedIssues = this.undefinedDetector.scanForUndefinedValues(correctedCode)
      
      const qualityImprovement = originalIssues.totalIssues - correctedIssues.totalIssues
      const newIssuesIntroduced: ValidationIssue[] = []
      
      // Check if new critical issues were introduced
      if (correctedIssues.criticalIssues > originalIssues.criticalIssues) {
        newIssuesIntroduced.push({
          type: 'correction-introduced-error',
          severity: 'critical',
          location: { line: 0, column: 0 },
          message: 'Corrections may have introduced new critical issues'
        })
      }

      // Simple syntax error detection for validation
      const hasSyntaxErrors = this.hasBasicSyntaxErrors(correctedCode)
      if (hasSyntaxErrors && !this.hasBasicSyntaxErrors(originalCode)) {
        newIssuesIntroduced.push({
          type: 'syntax-error-introduced',
          severity: 'critical',
          location: { line: 0, column: 0 },
          message: 'Corrections introduced syntax errors'
        })
      }

      const riskAssessment: 'low' | 'medium' | 'high' = 
        newIssuesIntroduced.length === 0 ? 'low' :
        newIssuesIntroduced.filter(i => i.severity === 'critical').length > 0 ? 'high' : 'medium'

      return {
        isValid: newIssuesIntroduced.length === 0 && qualityImprovement >= 0,
        newIssuesIntroduced,
        qualityImprovement,
        riskAssessment
      }
    } catch (error) {
      this.logger.error('Validation failed', error)
      return {
        isValid: false,
        newIssuesIntroduced: [{
          type: 'validation-error',
          severity: 'critical',
          location: { line: 0, column: 0 },
          message: 'Failed to validate corrections'
        }],
        qualityImprovement: 0,
        riskAssessment: 'high'
      }
    }
  }

  private hasBasicSyntaxErrors(code: string): boolean {
    // Simple check for unclosed string literals
    const lines = code.split('\n')
    for (const line of lines) {
      // Skip comment lines
      if (line.trim().startsWith('//') || line.trim().startsWith('/*')) continue
      
      // Check for unclosed string literals
      let inString = false
      let stringChar = ''
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (!inString && (char === '"' || char === "'")) {
          inString = true
          stringChar = char
        } else if (inString && char === stringChar && line[i - 1] !== '\\') {
          inString = false
          stringChar = ''
        }
      }
      if (inString) return true
    }
    return false
  }

  // Private helper methods

  private applyUndefinedValueFix(code: string, issue: UndefinedValueIssue): { correctedCode: string; correction: Correction } | null {
    if (!issue.suggestedValue) return null

    const lines = code.split('\n')
    const lineIndex = issue.location.line - 1
    
    if (lineIndex < 0 || lineIndex >= lines.length) return null

    const line = lines[lineIndex]
    let correctedLine: string

    switch (issue.undefinedType) {
      case 'literal-undefined':
        correctedLine = line.replace(/\bundefined\b/g, issue.suggestedValue)
        break
      case 'incomplete-declaration':
        correctedLine = line + issue.suggestedValue
        break
      case 'missing-return':
        // Find the function body and add return statement before closing brace
        const functionBodyStart = line.indexOf('{')
        if (functionBodyStart !== -1) {
          // Find the matching closing brace
          let braceCount = 1
          let insertLine = lineIndex
          
          for (let i = lineIndex + 1; i < lines.length && braceCount > 0; i++) {
            const currentLine = lines[i]
            for (const char of currentLine) {
              if (char === '{') braceCount++
              else if (char === '}') braceCount--
            }
            if (braceCount === 0) {
              insertLine = i
              break
            }
          }
          
          // Insert return statement before the closing brace
          if (insertLine > lineIndex) {
            const indentation = '        ' // 8 spaces for proper indentation
            lines.splice(insertLine, 0, `${indentation}return ${issue.suggestedValue}`)
            return {
              correctedCode: lines.join('\n'),
              correction: {
                type: 'undefined-fix',
                location: issue.location,
                originalValue: 'missing return',
                correctedValue: `return ${issue.suggestedValue}`,
                reasoning: `Added missing return statement with default value`,
                confidence: 80
              }
            }
          }
        }
        return null
      default:
        return null
    }

    lines[lineIndex] = correctedLine

    return {
      correctedCode: lines.join('\n'),
      correction: {
        type: 'undefined-fix',
        location: issue.location,
        originalValue: issue.undefinedType === 'literal-undefined' ? 'undefined' : 'incomplete statement',
        correctedValue: issue.suggestedValue,
        reasoning: `Replaced ${issue.undefinedType} with appropriate default value`,
        confidence: 85
      }
    }
  }

  private detectBracketMismatches(code: string): BracketMismatch[] {
    const mismatches: BracketMismatch[] = []
    const lines = code.split('\n')
    const bracketPairs = [
      { open: '{', close: '}' },
      { open: '(', close: ')' },
      { open: '[', close: ']' }
    ]

    for (const pair of bracketPairs) {
      const stack: Array<{ line: number; column: number }> = []
      
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex]
        
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
          const char = line[charIndex]
          
          // Skip characters in string literals or comments
          if (this.isInStringOrComment(line, charIndex)) continue
          
          if (char === pair.open) {
            stack.push({ line: lineIndex + 1, column: charIndex })
          } else if (char === pair.close) {
            if (stack.length === 0) {
              mismatches.push({
                type: 'missing-open',
                location: { line: lineIndex + 1, column: charIndex },
                expectedBracket: pair.open,
                actualBracket: pair.close,
                autoFixable: false
              })
            } else {
              stack.pop()
            }
          }
        }
      }
      
      // Remaining items in stack are missing closing brackets
      for (const openBracket of stack) {
        mismatches.push({
          type: 'missing-close',
          location: openBracket,
          expectedBracket: pair.close,
          autoFixable: true
        })
      }
    }

    return mismatches
  }

  private applyBracketFix(code: string, mismatch: BracketMismatch): { correctedCode: string; correction: Correction } | null {
    if (mismatch.type !== 'missing-close') return null

    const lines = code.split('\n')
    
    // Find the best place to add the missing closing bracket
    // For now, add it at the end of the file or at the end of the current block
    const insertionPoint = this.findBestInsertionPoint(lines, mismatch)
    
    if (insertionPoint.line >= 0 && insertionPoint.line < lines.length) {
      lines[insertionPoint.line] = lines[insertionPoint.line] + mismatch.expectedBracket
      
      return {
        correctedCode: lines.join('\n'),
        correction: {
          type: 'syntax-fix',
          location: mismatch.location,
          originalValue: 'missing bracket',
          correctedValue: mismatch.expectedBracket,
          reasoning: `Added missing ${mismatch.expectedBracket} bracket`,
          confidence: 75
        }
      }
    }

    return null
  }

  private detectIncompleteStatements(code: string): IncompleteStatement[] {
    const statements: IncompleteStatement[] = []
    const lines = code.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('/*')) continue

      // Detect incomplete function declarations
      if (line.match(/access\([^)]+\)\s+fun\s+\w+\s*\([^)]*\)\s*:\s*\w+\s*$/)) {
        statements.push({
          type: 'incomplete-function',
          location: { line: i + 1, column: 0 },
          context: line,
          suggestedCompletion: ' {\n        // TODO: Implement function\n    }',
          confidence: 90
        })
      }

      // Detect incomplete variable assignments
      if (line.match(/\w+\s*=\s*$/)) {
        const typeHint = this.inferTypeFromContext(lines, i)
        statements.push({
          type: 'incomplete-expression',
          location: { line: i + 1, column: line.length },
          context: line,
          suggestedCompletion: typeHint || '/* TODO: Add value */',
          confidence: 70
        })
      }
    }

    return statements
  }

  private applyStatementCompletion(code: string, statement: IncompleteStatement): { correctedCode: string; correction: Correction } | null {
    const lines = code.split('\n')
    const lineIndex = statement.location.line - 1
    
    if (lineIndex < 0 || lineIndex >= lines.length) return null

    const originalLine = lines[lineIndex]
    const correctedLine = originalLine + statement.suggestedCompletion

    lines[lineIndex] = correctedLine

    return {
      correctedCode: lines.join('\n'),
      correction: {
        type: 'logic-enhancement',
        location: statement.location,
        originalValue: originalLine,
        correctedValue: correctedLine,
        reasoning: `Completed ${statement.type}`,
        confidence: statement.confidence
      }
    }
  }

  private findFunctionEnd(lines: string[], startLine: number): number {
    let braceCount = 0
    let foundStart = false

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i]
      
      for (const char of line) {
        if (char === '{') {
          braceCount++
          foundStart = true
        } else if (char === '}') {
          braceCount--
          if (foundStart && braceCount === 0) {
            return i + 1 // Return the line after the closing brace
          }
        }
      }
    }

    return lines.length // If no closing brace found, return end of file
  }

  private findBestInsertionPoint(lines: string[], mismatch: BracketMismatch): { line: number; column: number } {
    // Simple heuristic: add at the end of the file
    return { line: lines.length - 1, column: lines[lines.length - 1]?.length || 0 }
  }

  private inferTypeFromContext(lines: string[], lineIndex: number): string | null {
    const line = lines[lineIndex]
    
    // Look for type hints in variable declarations
    const typeMatch = line.match(/:\s*(\w+)/)
    if (typeMatch) {
      const type = typeMatch[1]
      switch (type) {
        case 'String': return '""'
        case 'Int': case 'UInt': return '0'
        case 'Bool': return 'false'
        case 'Address': return '0x0'
        default: return 'nil'
      }
    }

    return null
  }

  private isInStringOrComment(line: string, position: number): boolean {
    // Simple check for string literals and comments
    const beforePosition = line.substring(0, position)
    const inString = (beforePosition.match(/"/g) || []).length % 2 === 1
    const inComment = beforePosition.includes('//')
    
    return inString || inComment
  }

  private findLocationInCode(code: string, index: number): CodeLocation {
    const beforeMatch = code.substring(0, index)
    const lines = beforeMatch.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length

    return { line, column }
  }

  private countIssues(code: string): number {
    const undefinedIssues = this.undefinedDetector.scanForUndefinedValues(code)
    const bracketIssues = this.detectBracketMismatches(code)
    const statementIssues = this.detectIncompleteStatements(code)
    
    return undefinedIssues.totalIssues + bracketIssues.length + statementIssues.length
  }

  private hasRemainingCriticalIssues(code: string): boolean {
    const undefinedIssues = this.undefinedDetector.scanForUndefinedValues(code)
    return undefinedIssues.criticalIssues > 0
  }
}