/**
 * Tests for Quality Assurance Infrastructure
 */

import { describe, test, expect, beforeEach } from 'vitest'
import {
  QualityConfigManager,
  DEFAULT_QUALITY_CONFIG,
  QAError,
  GenerationError,
  ValidationError,
  qaErrorHandler,
  ERROR_CODES,
  QALogger,
  initializeLogger
} from '../index'

describe('Quality Assurance Infrastructure', () => {
  describe('QualityConfigManager', () => {
    let configManager: QualityConfigManager

    beforeEach(() => {
      configManager = new QualityConfigManager()
    })

    test('should initialize with default configuration', () => {
      const config = configManager.getConfig()
      expect(config.maxRetryAttempts).toBe(DEFAULT_QUALITY_CONFIG.maxRetryAttempts)
      expect(config.qualityThreshold).toBe(DEFAULT_QUALITY_CONFIG.qualityThreshold)
      expect(config.enableAutoCorrection).toBe(DEFAULT_QUALITY_CONFIG.enableAutoCorrection)
    })

    test('should update configuration correctly', () => {
      configManager.updateConfig({ maxRetryAttempts: 5, qualityThreshold: 90 })
      const config = configManager.getConfig()
      expect(config.maxRetryAttempts).toBe(5)
      expect(config.qualityThreshold).toBe(90)
    })

    test('should handle configuration overrides', () => {
      configManager.setOverrides({ strictValidation: true })
      const config = configManager.getConfig()
      expect(config.strictValidation).toBe(true)

      configManager.clearOverrides()
      const clearedConfig = configManager.getConfig()
      expect(clearedConfig.strictValidation).toBe(DEFAULT_QUALITY_CONFIG.strictValidation)
    })

    test('should validate configuration correctly', () => {
      // Valid configuration
      let validation = configManager.validateConfig()
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)

      // Invalid configuration
      configManager.updateConfig({ maxRetryAttempts: -1, qualityThreshold: 150 })
      validation = configManager.validateConfig()
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    test('should generate quality requirements based on user experience', () => {
      const beginnerReqs = configManager.getQualityRequirements('beginner')
      const expertReqs = configManager.getQualityRequirements('expert')

      expect(beginnerReqs.minimumQualityScore).toBeGreaterThanOrEqual(expertReqs.minimumQualityScore)
      expect(beginnerReqs.requiredFeatures.length).toBeGreaterThanOrEqual(expertReqs.requiredFeatures.length)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      qaErrorHandler.clearHistory()
    })

    test('should create QA errors with proper properties', () => {
      const error = new QAError('Test error', 'TEST_001', 'high', true, { test: 'data' })
      
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_001')
      expect(error.severity).toBe('high')
      expect(error.recoverable).toBe(true)
      expect(error.context).toEqual({ test: 'data' })
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    test('should create specific error types', () => {
      const genError = new GenerationError('Generation failed', ERROR_CODES.GENERATION_FAILED)
      const valError = new ValidationError('Validation failed', ERROR_CODES.SYNTAX_VALIDATION_FAILED)

      expect(genError.name).toBe('GenerationError')
      expect(genError.severity).toBe('high')
      expect(valError.name).toBe('ValidationError')
      expect(valError.severity).toBe('medium')
    })

    test('should handle errors and provide recovery strategies', () => {
      const error = new ValidationError('Undefined values detected', ERROR_CODES.UNDEFINED_VALUES_DETECTED)
      const recovery = qaErrorHandler.handleError(error)

      expect(recovery.shouldRetry).toBe(true)
      expect(recovery.fallbackAction).toBe('auto-correct')
      expect(recovery.userMessage).toContain('undefined values')
    })

    test('should track error statistics', () => {
      const error1 = new GenerationError('Error 1', ERROR_CODES.GENERATION_FAILED)
      const error2 = new ValidationError('Error 2', ERROR_CODES.SYNTAX_VALIDATION_FAILED)

      qaErrorHandler.handleError(error1)
      qaErrorHandler.handleError(error2)

      const stats = qaErrorHandler.getErrorStatistics()
      expect(stats.totalErrors).toBe(2)
      expect(stats.errorsByType[ERROR_CODES.GENERATION_FAILED]).toBe(1)
      expect(stats.errorsByType[ERROR_CODES.SYNTAX_VALIDATION_FAILED]).toBe(1)
    })

    test('should create user-friendly errors from technical errors', () => {
      const technicalError = new Error('Connection timeout occurred')
      const userError = qaErrorHandler.createUserFriendlyError(technicalError)

      expect(userError).toBeInstanceOf(QAError)
      expect(userError.message).toContain('took too long')
      expect(userError.code).toBe(ERROR_CODES.GENERATION_TIMEOUT)
    })
  })

  describe('Logging System', () => {
    let logger: QALogger

    beforeEach(() => {
      logger = new QALogger({
        level: 'debug',
        enableMetrics: true,
        enablePerformanceTracking: true,
        enableDetailedErrors: true,
        maxLogSize: 1000
      })
    })

    test('should log messages at different levels', () => {
      logger.debug('test', 'Debug message')
      logger.info('test', 'Info message')
      logger.warn('test', 'Warning message')
      logger.error('test', 'Error message')

      const logs = logger.exportLogs()
      expect(logs.logs).toHaveLength(4)
      expect(logs.logs[0].level).toBe('debug')
      expect(logs.logs[3].level).toBe('error')
    })

    test('should record performance metrics', () => {
      logger.recordPerformanceMetric('generation', 5000, true, { test: 'data' })
      logger.recordPerformanceMetric('validation', 1500, true)

      const stats = logger.getPerformanceStatistics()
      expect(stats.totalOperations).toBe(2)
      expect(stats.averageDuration.generation).toBe(5000)
      expect(stats.successRate.generation).toBe(1)
    })

    test('should record quality metrics', () => {
      logger.recordQualityMetrics(
        'test-gen-1',
        85,
        [],
        2,
        false,
        'intermediate',
        'nft'
      )

      const qualityStats = logger.getQualityStatistics()
      expect(qualityStats.totalGenerations).toBe(1)
      expect(qualityStats.averageQualityScore).toBe(85)
    })

    test('should export logs with date filtering', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      logger.info('test', 'Test message')

      const allLogs = logger.exportLogs()
      expect(allLogs.logs).toHaveLength(1)

      const filteredLogs = logger.exportLogs(tomorrow, tomorrow)
      expect(filteredLogs.logs).toHaveLength(0)
    })

    test('should handle log size limits', () => {
      // Create a logger with very small log size
      const smallLogger = new QALogger({
        level: 'info',
        enableMetrics: true,
        enablePerformanceTracking: true,
        enableDetailedErrors: true,
        maxLogSize: 5
      })

      // Add more logs than the limit
      for (let i = 0; i < 10; i++) {
        smallLogger.info('test', `Message ${i}`)
      }

      const logs = smallLogger.exportLogs()
      expect(logs.logs.length).toBeLessThanOrEqual(5)
    })
  })

  describe('System Integration', () => {
    test('should initialize logger correctly', () => {
      const config = {
        level: 'info' as const,
        enableMetrics: true,
        enablePerformanceTracking: true,
        enableDetailedErrors: true,
        maxLogSize: 1000
      }

      expect(() => initializeLogger(config)).not.toThrow()
    })

    test('should handle undefined values validation rule', () => {
      const configManager = new QualityConfigManager()
      const config = configManager.getConfig()
      
      const undefinedRule = config.customValidationRules.find(rule => rule.name === 'no-undefined-values')
      expect(undefinedRule).toBeDefined()
      expect(undefinedRule?.pattern.test('var x = undefined')).toBe(true)
      expect(undefinedRule?.pattern.test('var x = "hello"')).toBe(false)
    })
  })
})