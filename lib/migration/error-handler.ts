/**
 * Error handling system for migration process
 */

import { MigrationError, MigrationWarning } from './types'
import { MigrationLogger, LogLevel } from './logger'

export class MigrationErrorHandler {
  private errors: MigrationError[] = []
  private warnings: MigrationWarning[] = []
  private logger: MigrationLogger

  constructor(logger: MigrationLogger) {
    this.logger = logger
  }

  addError(error: MigrationError): void {
    this.errors.push(error)
    this.logger.error(
      `Migration error in ${error.file}: ${error.message}`,
      {
        category: error.category,
        severity: error.severity,
        line: error.line,
        column: error.column
      },
      error.file,
      error.line
    )
  }

  addWarning(warning: MigrationWarning): void {
    this.warnings.push(warning)
    this.logger.warn(
      `Migration warning in ${warning.file}: ${warning.message}`,
      {
        suggestion: warning.suggestion,
        line: warning.line
      },
      warning.file,
      warning.line
    )
  }

  createError(
    file: string,
    message: string,
    category: MigrationError['category'],
    severity: MigrationError['severity'] = 'error',
    line?: number,
    column?: number
  ): MigrationError {
    const error: MigrationError = {
      file,
      message,
      category,
      severity,
      line,
      column
    }
    this.addError(error)
    return error
  }

  createWarning(
    file: string,
    message: string,
    line?: number,
    suggestion?: string
  ): MigrationWarning {
    const warning: MigrationWarning = {
      file,
      message,
      line,
      suggestion
    }
    this.addWarning(warning)
    return warning
  }

  handleSyntaxError(file: string, error: Error, line?: number): MigrationError {
    return this.createError(
      file,
      `Syntax error: ${error.message}`,
      'syntax',
      'error',
      line
    )
  }

  handleTransformationError(file: string, rule: string, error: Error, line?: number): MigrationError {
    return this.createError(
      file,
      `Transformation error applying rule '${rule}': ${error.message}`,
      'transformation',
      'error',
      line
    )
  }

  handleValidationError(file: string, error: Error): MigrationError {
    return this.createError(
      file,
      `Validation error: ${error.message}`,
      'validation',
      'error'
    )
  }

  handleSystemError(file: string, error: Error): MigrationError {
    return this.createError(
      file,
      `System error: ${error.message}`,
      'system',
      'error'
    )
  }

  getErrors(): MigrationError[] {
    return [...this.errors]
  }

  getWarnings(): MigrationWarning[] {
    return [...this.warnings]
  }

  getErrorsByFile(file: string): MigrationError[] {
    return this.errors.filter(error => error.file === file)
  }

  getWarningsByFile(file: string): MigrationWarning[] {
    return this.warnings.filter(warning => warning.file === file)
  }

  getErrorsByCategory(category: MigrationError['category']): MigrationError[] {
    return this.errors.filter(error => error.category === category)
  }

  hasErrors(): boolean {
    return this.errors.length > 0
  }

  hasWarnings(): boolean {
    return this.warnings.length > 0
  }

  hasCriticalErrors(): boolean {
    return this.errors.some(error => error.severity === 'error')
  }

  clearErrors(): void {
    this.errors = []
  }

  clearWarnings(): void {
    this.warnings = []
  }

  clearAll(): void {
    this.clearErrors()
    this.clearWarnings()
  }

  getStatistics(): {
    totalErrors: number
    totalWarnings: number
    errorsByCategory: Record<string, number>
    errorsBySeverity: Record<string, number>
    filesWithErrors: string[]
    filesWithWarnings: string[]
  } {
    const errorsByCategory: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}
    const filesWithErrors = new Set<string>()
    const filesWithWarnings = new Set<string>()

    this.errors.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1
      filesWithErrors.add(error.file)
    })

    this.warnings.forEach(warning => {
      filesWithWarnings.add(warning.file)
    })

    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errorsByCategory,
      errorsBySeverity,
      filesWithErrors: Array.from(filesWithErrors),
      filesWithWarnings: Array.from(filesWithWarnings)
    }
  }

  generateErrorReport(): string {
    const stats = this.getStatistics()
    let report = `Migration Error Report\n`
    report += `========================\n\n`
    report += `Total Errors: ${stats.totalErrors}\n`
    report += `Total Warnings: ${stats.totalWarnings}\n\n`

    if (stats.totalErrors > 0) {
      report += `Errors by Category:\n`
      Object.entries(stats.errorsByCategory).forEach(([category, count]) => {
        report += `  ${category}: ${count}\n`
      })
      report += `\n`

      report += `Errors by Severity:\n`
      Object.entries(stats.errorsBySeverity).forEach(([severity, count]) => {
        report += `  ${severity}: ${count}\n`
      })
      report += `\n`

      report += `Files with Errors:\n`
      stats.filesWithErrors.forEach(file => {
        report += `  - ${file}\n`
      })
      report += `\n`
    }

    if (stats.totalWarnings > 0) {
      report += `Files with Warnings:\n`
      stats.filesWithWarnings.forEach(file => {
        report += `  - ${file}\n`
      })
      report += `\n`
    }

    return report
  }
}