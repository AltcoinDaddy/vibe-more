/**
 * Error handling framework for quality assurance system
 */

import { QualityAssuranceError } from './types'

// Re-export the interface for convenience
export type { QualityAssuranceError } from './types'

/**
 * Base class for quality assurance errors
 */
export class QAError extends Error implements QualityAssuranceError {
  public readonly code: string
  public readonly severity: 'low' | 'medium' | 'high' | 'critical'
  public readonly context?: Record<string, any>
  public readonly recoverable: boolean
  public readonly timestamp: Date

  constructor(
    message: string,
    code: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    recoverable: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'QAError'
    this.code = code
    this.severity = severity
    this.recoverable = recoverable
    this.context = context
    this.timestamp = new Date()

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QAError)
    }
  }
}

/**
 * Generation-specific errors
 */
export class GenerationError extends QAError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'high', true, context)
    this.name = 'GenerationError'
  }
}

/**
 * Validation-specific errors
 */
export class ValidationError extends QAError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'medium', true, context)
    this.name = 'ValidationError'
  }
}

/**
 * Correction-specific errors
 */
export class CorrectionError extends QAError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'medium', true, context)
    this.name = 'CorrectionError'
  }
}

/**
 * Configuration-specific errors
 */
export class ConfigurationError extends QAError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'critical', false, context)
    this.name = 'ConfigurationError'
  }
}

/**
 * Performance-related errors
 */
export class PerformanceError extends QAError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 'high', true, context)
    this.name = 'PerformanceError'
  }
}

/**
 * Error codes for different types of quality assurance failures
 */
export const ERROR_CODES = {
  // Generation errors
  GENERATION_TIMEOUT: 'GEN_001',
  GENERATION_FAILED: 'GEN_002',
  INVALID_PROMPT: 'GEN_003',
  MODEL_UNAVAILABLE: 'GEN_004',
  TOKEN_LIMIT_EXCEEDED: 'GEN_005',

  // Validation errors
  SYNTAX_VALIDATION_FAILED: 'VAL_001',
  LOGIC_VALIDATION_FAILED: 'VAL_002',
  COMPLETENESS_CHECK_FAILED: 'VAL_003',
  QUALITY_THRESHOLD_NOT_MET: 'VAL_004',
  UNDEFINED_VALUES_DETECTED: 'VAL_005',

  // Correction errors
  AUTO_CORRECTION_FAILED: 'COR_001',
  CORRECTION_INTRODUCED_ERRORS: 'COR_002',
  MAX_CORRECTIONS_EXCEEDED: 'COR_003',
  CORRECTION_TIMEOUT: 'COR_004',

  // Configuration errors
  INVALID_CONFIG: 'CFG_001',
  MISSING_REQUIRED_CONFIG: 'CFG_002',
  CONFIG_VALIDATION_FAILED: 'CFG_003',

  // Performance errors
  VALIDATION_TIMEOUT: 'PERF_001',
  MEMORY_LIMIT_EXCEEDED: 'PERF_002',
  CONCURRENT_LIMIT_EXCEEDED: 'PERF_003',

  // System errors
  FALLBACK_GENERATION_FAILED: 'SYS_001',
  METRICS_COLLECTION_FAILED: 'SYS_002',
  LOGGING_FAILED: 'SYS_003'
} as const

/**
 * Error handler for quality assurance operations
 */
export class QAErrorHandler {
  private errorHistory: QualityAssuranceError[] = []
  private maxHistorySize: number = 1000

  /**
   * Handle a quality assurance error
   */
  handleError(error: QualityAssuranceError): {
    shouldRetry: boolean
    retryDelay?: number
    fallbackAction?: string
    userMessage: string
  } {
    // Add to error history
    this.addToHistory(error)

    // Determine recovery strategy based on error type and severity
    const recovery = this.determineRecoveryStrategy(error)

    // Log the error
    this.logError(error, recovery)

    return recovery
  }

  /**
   * Create a user-friendly error from a technical error
   */
  createUserFriendlyError(error: Error, context?: Record<string, any>): QualityAssuranceError {
    let qaError: QualityAssuranceError

    if (error instanceof QAError) {
      return error
    }

    // Map common errors to QA errors
    if (error.message.includes('timeout')) {
      qaError = new PerformanceError(
        'The operation took too long to complete. Please try again.',
        ERROR_CODES.GENERATION_TIMEOUT,
        context
      )
    } else if (error.message.includes('undefined')) {
      qaError = new ValidationError(
        'The generated code contains undefined values that need to be fixed.',
        ERROR_CODES.UNDEFINED_VALUES_DETECTED,
        context
      )
    } else if (error.message.includes('syntax')) {
      qaError = new ValidationError(
        'The generated code has syntax errors that need to be corrected.',
        ERROR_CODES.SYNTAX_VALIDATION_FAILED,
        context
      )
    } else {
      qaError = new QAError(
        'An unexpected error occurred during code generation.',
        'UNKNOWN_ERROR',
        'medium',
        true,
        context
      )
    }

    return qaError
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number
    errorsByType: Record<string, number>
    errorsBySeverity: Record<string, number>
    recoverableErrors: number
    recentErrors: QualityAssuranceError[]
  } {
    const errorsByType: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}
    let recoverableErrors = 0

    this.errorHistory.forEach(error => {
      errorsByType[error.code] = (errorsByType[error.code] || 0) + 1
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1
      if (error.recoverable) recoverableErrors++
    })

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recoverableErrors,
      recentErrors: this.errorHistory.slice(-10)
    }
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = []
  }

  private addToHistory(error: QualityAssuranceError): void {
    this.errorHistory.push(error)
    
    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize)
    }
  }

  private determineRecoveryStrategy(error: QualityAssuranceError): {
    shouldRetry: boolean
    retryDelay?: number
    fallbackAction?: string
    userMessage: string
  } {
    const baseStrategy = {
      shouldRetry: error.recoverable,
      userMessage: error.message
    }

    switch (error.code) {
      case ERROR_CODES.GENERATION_TIMEOUT:
        return {
          ...baseStrategy,
          shouldRetry: true,
          retryDelay: 2000,
          fallbackAction: 'use-template',
          userMessage: 'Generation timed out. Retrying with optimized settings...'
        }

      case ERROR_CODES.UNDEFINED_VALUES_DETECTED:
        return {
          ...baseStrategy,
          shouldRetry: true,
          fallbackAction: 'auto-correct',
          userMessage: 'Fixing undefined values in generated code...'
        }

      case ERROR_CODES.SYNTAX_VALIDATION_FAILED:
        return {
          ...baseStrategy,
          shouldRetry: true,
          fallbackAction: 'auto-correct',
          userMessage: 'Correcting syntax errors in generated code...'
        }

      case ERROR_CODES.QUALITY_THRESHOLD_NOT_MET:
        return {
          ...baseStrategy,
          shouldRetry: true,
          fallbackAction: 'regenerate-enhanced',
          userMessage: 'Improving code quality with enhanced generation...'
        }

      case ERROR_CODES.MAX_CORRECTIONS_EXCEEDED:
        return {
          ...baseStrategy,
          shouldRetry: false,
          fallbackAction: 'use-template',
          userMessage: 'Using a reliable template as fallback...'
        }

      default:
        return baseStrategy
    }
  }

  private logError(error: QualityAssuranceError, recovery: any): void {
    const logEntry = {
      timestamp: error.timestamp,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        severity: error.severity,
        recoverable: error.recoverable,
        context: error.context
      },
      recovery,
      stack: error.stack
    }

    // In a real implementation, this would use the logging system
    console.error('QA Error:', logEntry)
  }
}

// Global error handler instance
export const qaErrorHandler = new QAErrorHandler()