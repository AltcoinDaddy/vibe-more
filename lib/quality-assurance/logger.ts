/**
 * Logging system for quality metrics and debugging
 */

import { QualityMetrics, GenerationMetrics, QualityAssuranceError, ValidationResult } from './types'
import { LoggingConfig } from './config'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  data?: Record<string, any>
  correlationId?: string
}

export interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: Date
  success: boolean
  metadata?: Record<string, any>
}

export interface QualityMetricEntry {
  timestamp: Date
  generationId: string
  qualityScore: number
  validationResults: ValidationResult[]
  correctionAttempts: number
  fallbackUsed: boolean
  userExperience: string
  contractType: string
}

/**
 * Quality Assurance Logger
 */
export class QALogger {
  private logs: LogEntry[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private qualityMetrics: QualityMetricEntry[] = []
  private config: LoggingConfig
  private maxLogSize: number

  constructor(config: LoggingConfig) {
    this.config = config
    this.maxLogSize = config.maxLogSize || 1000000
  }

  /**
   * Log a debug message
   */
  debug(category: string, message: string, data?: Record<string, any>, correlationId?: string): void {
    this.log('debug', category, message, data, correlationId)
  }

  /**
   * Log an info message
   */
  info(category: string, message: string, data?: Record<string, any>, correlationId?: string): void {
    this.log('info', category, message, data, correlationId)
  }

  /**
   * Log a warning message
   */
  warn(category: string, message: string, data?: Record<string, any>, correlationId?: string): void {
    this.log('warn', category, message, data, correlationId)
  }

  /**
   * Log an error message
   */
  error(category: string, message: string, data?: Record<string, any>, correlationId?: string): void {
    this.log('error', category, message, data, correlationId)
  }

  /**
   * Log a quality assurance error
   */
  logError(error: QualityAssuranceError, correlationId?: string): void {
    this.error('qa-error', error.message, {
      code: error.code,
      severity: error.severity,
      recoverable: error.recoverable,
      context: error.context,
      stack: error.stack
    }, correlationId)
  }

  /**
   * Log generation start
   */
  logGenerationStart(prompt: string, context?: Record<string, any>, correlationId?: string): void {
    this.info('generation', 'Generation started', {
      prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
      context
    }, correlationId)
  }

  /**
   * Log generation completion
   */
  logGenerationComplete(
    result: string,
    metrics: GenerationMetrics,
    correlationId?: string
  ): void {
    this.info('generation', 'Generation completed', {
      codeLength: result.length,
      metrics: {
        attemptCount: metrics.attemptCount,
        totalTime: metrics.totalGenerationTime,
        qualityScore: metrics.finalQualityScore,
        issuesDetected: metrics.issuesDetected,
        issuesFixed: metrics.issuesFixed
      }
    }, correlationId)

    // Record performance metric
    if (this.config.enablePerformanceTracking) {
      this.recordPerformanceMetric('generation', metrics.totalGenerationTime, true, {
        attemptCount: metrics.attemptCount,
        qualityScore: metrics.finalQualityScore
      })
    }
  }

  /**
   * Log validation results
   */
  logValidationResults(results: ValidationResult[], correlationId?: string): void {
    const passed = results.filter(r => r.passed).length
    const failed = results.length - passed
    
    this.info('validation', 'Validation completed', {
      totalChecks: results.length,
      passed,
      failed,
      results: results.map(r => ({
        type: r.type,
        passed: r.passed,
        score: r.score,
        issueCount: r.issues.length
      }))
    }, correlationId)
  }

  /**
   * Log correction attempt
   */
  logCorrectionAttempt(
    attemptNumber: number,
    corrections: any[],
    success: boolean,
    correlationId?: string
  ): void {
    this.info('correction', `Correction attempt ${attemptNumber}`, {
      correctionCount: corrections.length,
      success,
      corrections: corrections.map(c => ({
        type: c.type,
        confidence: c.confidence,
        reasoning: c.reasoning
      }))
    }, correlationId)
  }

  /**
   * Record a performance metric
   */
  recordPerformanceMetric(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enablePerformanceTracking) return

    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      metadata
    }

    this.performanceMetrics.push(metric)
    this.maintainMetricsSize()

    // Log slow operations
    const slowThreshold = this.getSlowOperationThreshold(operation)
    if (duration > slowThreshold) {
      this.warn('performance', `Slow operation detected: ${operation}`, {
        duration,
        threshold: slowThreshold,
        metadata
      })
    }
  }

  /**
   * Record quality metrics
   */
  recordQualityMetrics(
    generationId: string,
    qualityScore: number,
    validationResults: ValidationResult[],
    correctionAttempts: number,
    fallbackUsed: boolean,
    userExperience: string,
    contractType: string
  ): void {
    if (!this.config.enableMetrics) return

    const entry: QualityMetricEntry = {
      timestamp: new Date(),
      generationId,
      qualityScore,
      validationResults,
      correctionAttempts,
      fallbackUsed,
      userExperience,
      contractType
    }

    this.qualityMetrics.push(entry)
    this.maintainMetricsSize()

    this.info('quality-metrics', 'Quality metrics recorded', {
      generationId,
      qualityScore,
      correctionAttempts,
      fallbackUsed
    })
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics(): {
    averageDuration: Record<string, number>
    successRate: Record<string, number>
    slowOperations: PerformanceMetric[]
    totalOperations: number
  } {
    const operationStats: Record<string, { total: number; success: number; totalDuration: number }> = {}
    const slowOperations: PerformanceMetric[] = []

    this.performanceMetrics.forEach(metric => {
      if (!operationStats[metric.operation]) {
        operationStats[metric.operation] = { total: 0, success: 0, totalDuration: 0 }
      }

      const stats = operationStats[metric.operation]
      stats.total++
      stats.totalDuration += metric.duration
      if (metric.success) stats.success++

      // Identify slow operations
      const threshold = this.getSlowOperationThreshold(metric.operation)
      if (metric.duration > threshold) {
        slowOperations.push(metric)
      }
    })

    const averageDuration: Record<string, number> = {}
    const successRate: Record<string, number> = {}

    Object.entries(operationStats).forEach(([operation, stats]) => {
      averageDuration[operation] = stats.totalDuration / stats.total
      successRate[operation] = stats.success / stats.total
    })

    return {
      averageDuration,
      successRate,
      slowOperations: slowOperations.slice(-20), // Last 20 slow operations
      totalOperations: this.performanceMetrics.length
    }
  }

  /**
   * Get quality statistics
   */
  getQualityStatistics(): QualityMetrics {
    if (this.qualityMetrics.length === 0) {
      return {
        generationSuccess: { firstAttempt: 0, afterCorrection: 0, fallbackUsed: 0 },
        commonIssues: { undefinedValues: 0, syntaxErrors: 0, incompleteLogic: 0, validationFailures: 0 },
        averageQualityScore: 0,
        userSatisfaction: 0,
        totalGenerations: 0,
        timeRange: { start: new Date(), end: new Date() }
      }
    }

    const firstAttemptSuccess = this.qualityMetrics.filter(m => m.correctionAttempts === 0).length
    const afterCorrectionSuccess = this.qualityMetrics.filter(m => m.correctionAttempts > 0 && !m.fallbackUsed).length
    const fallbackUsed = this.qualityMetrics.filter(m => m.fallbackUsed).length

    const totalQualityScore = this.qualityMetrics.reduce((sum, m) => sum + m.qualityScore, 0)
    const averageQualityScore = totalQualityScore / this.qualityMetrics.length

    // Count common issues
    const commonIssues = {
      undefinedValues: 0,
      syntaxErrors: 0,
      incompleteLogic: 0,
      validationFailures: 0
    }

    this.qualityMetrics.forEach(metric => {
      metric.validationResults.forEach(result => {
        result.issues.forEach(issue => {
          if (issue.message.toLowerCase().includes('undefined')) {
            commonIssues.undefinedValues++
          } else if (issue.type === 'syntax') {
            commonIssues.syntaxErrors++
          } else if (issue.type === 'completeness') {
            commonIssues.incompleteLogic++
          }
        })
        if (!result.passed) {
          commonIssues.validationFailures++
        }
      })
    })

    const timestamps = this.qualityMetrics.map(m => m.timestamp)
    const timeRange = {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime())))
    }

    return {
      generationSuccess: {
        firstAttempt: firstAttemptSuccess,
        afterCorrection: afterCorrectionSuccess,
        fallbackUsed
      },
      commonIssues,
      averageQualityScore,
      userSatisfaction: Math.min(100, averageQualityScore + 10), // Simplified calculation
      totalGenerations: this.qualityMetrics.length,
      timeRange
    }
  }

  /**
   * Export logs for analysis
   */
  exportLogs(startDate?: Date, endDate?: Date): {
    logs: LogEntry[]
    performanceMetrics: PerformanceMetric[]
    qualityMetrics: QualityMetricEntry[]
  } {
    const filterByDate = (item: { timestamp: Date }) => {
      if (startDate && item.timestamp < startDate) return false
      if (endDate && item.timestamp > endDate) return false
      return true
    }

    return {
      logs: this.logs.filter(filterByDate),
      performanceMetrics: this.performanceMetrics.filter(filterByDate),
      qualityMetrics: this.qualityMetrics.filter(filterByDate)
    }
  }

  /**
   * Clear all logs and metrics
   */
  clearAll(): void {
    this.logs = []
    this.performanceMetrics = []
    this.qualityMetrics = []
  }

  private log(level: LogLevel, category: string, message: string, data?: Record<string, any>, correlationId?: string): void {
    // Check if this log level should be recorded
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      correlationId
    }

    this.logs.push(entry)
    this.maintainLogSize()

    // Also output to console in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = console[level] || console.log
      logMethod(`[${level.toUpperCase()}] ${category}: ${message}`, data || '')
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const configLevelIndex = levels.indexOf(this.config.level)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= configLevelIndex
  }

  private maintainLogSize(): void {
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-Math.floor(this.maxLogSize * 0.8))
    }
  }

  private maintainMetricsSize(): void {
    const maxMetrics = 10000
    if (this.performanceMetrics.length > maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-Math.floor(maxMetrics * 0.8))
    }
    if (this.qualityMetrics.length > maxMetrics) {
      this.qualityMetrics = this.qualityMetrics.slice(-Math.floor(maxMetrics * 0.8))
    }
  }

  private getSlowOperationThreshold(operation: string): number {
    const thresholds: Record<string, number> = {
      'generation': 10000,      // 10 seconds
      'validation': 1000,       // 1 second
      'correction': 2000,       // 2 seconds
      'fallback': 500           // 0.5 seconds
    }
    return thresholds[operation] || 5000 // Default 5 seconds
  }
}

// Global logger instance
export let qaLogger: QALogger

/**
 * Initialize the QA logger with configuration
 */
export function initializeLogger(config: LoggingConfig): void {
  qaLogger = new QALogger(config)
}

/**
 * Get the global QA logger instance
 */
export function getLogger(): QALogger {
  if (!qaLogger) {
    throw new Error('QA Logger not initialized. Call initializeLogger() first.')
  }
  return qaLogger
}