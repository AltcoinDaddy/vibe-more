/**
 * Tests for migration infrastructure and core utilities
 */

import { 
  CadenceMigrationController,
  MigrationConfigManager,
  MigrationLogger,
  MigrationErrorHandler,
  LogLevel,
  DEFAULT_MIGRATION_CONFIG,
  createMigrationController
} from '../index'

describe('Migration Infrastructure', () => {
  describe('MigrationConfigManager', () => {
    test('should create config with defaults', () => {
      const configManager = new MigrationConfigManager()
      const config = configManager.getConfig()
      
      expect(config.targetCadenceVersion).toBe('1.0')
      expect(config.preserveComments).toBe(true)
      expect(config.validateAfterMigration).toBe(true)
      expect(config.backupOriginals).toBe(true)
      expect(config.transformationRules.length).toBeGreaterThan(0)
    })

    test('should merge custom config with defaults', () => {
      const customConfig = {
        targetCadenceVersion: '1.1',
        preserveComments: false
      }
      
      const configManager = new MigrationConfigManager(customConfig)
      const config = configManager.getConfig()
      
      expect(config.targetCadenceVersion).toBe('1.1')
      expect(config.preserveComments).toBe(false)
      expect(config.validateAfterMigration).toBe(true) // Should keep default
    })

    test('should validate config correctly', () => {
      const configManager = new MigrationConfigManager()
      const validation = configManager.validateConfig()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should add and remove transformation rules', () => {
      const configManager = new MigrationConfigManager()
      const initialRulesCount = configManager.getConfig().transformationRules.length
      
      configManager.addTransformationRule({
        pattern: /test/g,
        replacement: 'TEST',
        description: 'Test rule',
        category: 'access-modifier'
      })
      
      expect(configManager.getConfig().transformationRules.length).toBe(initialRulesCount + 1)
      
      configManager.removeTransformationRule('Test rule')
      expect(configManager.getConfig().transformationRules.length).toBe(initialRulesCount)
    })
  })

  describe('MigrationLogger', () => {
    test('should log messages at appropriate levels', () => {
      const logger = new MigrationLogger(LogLevel.DEBUG)
      
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(4)
      expect(logs[0].level).toBe(LogLevel.DEBUG)
      expect(logs[1].level).toBe(LogLevel.INFO)
      expect(logs[2].level).toBe(LogLevel.WARN)
      expect(logs[3].level).toBe(LogLevel.ERROR)
    })

    test('should filter logs by level', () => {
      const logger = new MigrationLogger(LogLevel.WARN)
      
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(2) // Only WARN and ERROR should be logged
    })

    test('should export logs as string', () => {
      const logger = new MigrationLogger(LogLevel.INFO)
      logger.info('Test message')
      
      const exported = logger.exportLogs()
      expect(exported).toContain('Test message')
      expect(exported).toContain('[INFO]')
    })
  })

  describe('MigrationErrorHandler', () => {
    test('should handle errors and warnings', () => {
      const logger = new MigrationLogger()
      const errorHandler = new MigrationErrorHandler(logger)
      
      errorHandler.createError('test.cdc', 'Test error', 'syntax')
      errorHandler.createWarning('test.cdc', 'Test warning')
      
      expect(errorHandler.hasErrors()).toBe(true)
      expect(errorHandler.hasWarnings()).toBe(true)
      expect(errorHandler.getErrors()).toHaveLength(1)
      expect(errorHandler.getWarnings()).toHaveLength(1)
    })

    test('should categorize errors correctly', () => {
      const logger = new MigrationLogger()
      const errorHandler = new MigrationErrorHandler(logger)
      
      errorHandler.createError('test1.cdc', 'Syntax error', 'syntax')
      errorHandler.createError('test2.cdc', 'Transform error', 'transformation')
      
      const syntaxErrors = errorHandler.getErrorsByCategory('syntax')
      const transformErrors = errorHandler.getErrorsByCategory('transformation')
      
      expect(syntaxErrors).toHaveLength(1)
      expect(transformErrors).toHaveLength(1)
    })

    test('should generate error statistics', () => {
      const logger = new MigrationLogger()
      const errorHandler = new MigrationErrorHandler(logger)
      
      errorHandler.createError('test1.cdc', 'Error 1', 'syntax')
      errorHandler.createError('test2.cdc', 'Error 2', 'transformation')
      errorHandler.createWarning('test3.cdc', 'Warning 1')
      
      const stats = errorHandler.getStatistics()
      expect(stats.totalErrors).toBe(2)
      expect(stats.totalWarnings).toBe(1)
      expect(stats.filesWithErrors).toContain('test1.cdc')
      expect(stats.filesWithErrors).toContain('test2.cdc')
      expect(stats.filesWithWarnings).toContain('test3.cdc')
    })
  })

  describe('CadenceMigrationController', () => {
    test('should create controller with default config', () => {
      const controller = new CadenceMigrationController()
      
      expect(controller).toBeInstanceOf(CadenceMigrationController)
      expect(controller.getConfigManager()).toBeInstanceOf(MigrationConfigManager)
      expect(controller.getLogger()).toBeInstanceOf(MigrationLogger)
      expect(controller.getErrorHandler()).toBeInstanceOf(MigrationErrorHandler)
    })

    test('should execute migration process', async () => {
      const controller = new CadenceMigrationController()
      const result = await controller.executeMigration()
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('migratedFiles')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('statistics')
    })

    test('should validate migration', async () => {
      const controller = new CadenceMigrationController()
      const validation = await controller.validateMigration()
      
      expect(validation).toHaveProperty('isValid')
      expect(validation).toHaveProperty('errors')
      expect(validation).toHaveProperty('warnings')
      expect(validation).toHaveProperty('compilationSuccess')
    })

    test('should generate migration report', () => {
      const controller = new CadenceMigrationController()
      const report = controller.generateReport()
      
      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('duration')
      expect(report).toHaveProperty('result')
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('recommendations')
    })
  })

  describe('Factory function', () => {
    test('should create controller with custom config', () => {
      const customConfig = { targetCadenceVersion: '1.1' }
      const controller = createMigrationController(customConfig)
      
      expect(controller).toBeInstanceOf(CadenceMigrationController)
      expect(controller.getConfigManager().getConfig().targetCadenceVersion).toBe('1.1')
    })
  })
})