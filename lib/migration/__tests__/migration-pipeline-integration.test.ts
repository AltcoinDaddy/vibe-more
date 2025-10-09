/**
 * Integration tests for complete migration pipeline
 * Tests end-to-end migration process, regression testing, performance, and error handling
 */

import { 
  CadenceMigrationController,
  MigrationConfigManager,
  CadenceSyntaxTransformer,
  CadenceTemplateMigrator,
  MigrationLogger,
  LogLevel,
  createMigrationController
} from '../index'
import { MigrationResult, ValidationResult, MigrationConfig } from '../types'
import { templates } from '../../templates'

describe('Migration Pipeline Integration Tests', () => {
  let controller: CadenceMigrationController
  let configManager: MigrationConfigManager
  let logger: MigrationLogger

  beforeEach(() => {
    logger = new MigrationLogger(LogLevel.ERROR) // Suppress logs during tests
    configManager = new MigrationConfigManager()
    controller = new CadenceMigrationController(configManager)
    controller.setLogLevel(LogLevel.ERROR)
  })

  describe('End-to-End Migration Process', () => {
    test('should execute complete migration pipeline successfully', async () => {
      // Execute the full migration process
      const migrationResult = await controller.executeMigration()
      
      // Verify migration result structure
      expect(migrationResult).toHaveProperty('success')
      expect(migrationResult).toHaveProperty('migratedFiles')
      expect(migrationResult).toHaveProperty('errors')
      expect(migrationResult).toHaveProperty('warnings')
      expect(migrationResult).toHaveProperty('statistics')
      
      // Verify statistics structure
      expect(migrationResult.statistics).toHaveProperty('totalFilesProcessed')
      expect(migrationResult.statistics).toHaveProperty('successfulMigrations')
      expect(migrationResult.statistics).toHaveProperty('failedMigrations')
      expect(migrationResult.statistics).toHaveProperty('transformationsApplied')
      expect(migrationResult.statistics).toHaveProperty('linesOfCodeMigrated')
      
      // Verify arrays are properly initialized
      expect(Array.isArray(migrationResult.migratedFiles)).toBe(true)
      expect(Array.isArray(migrationResult.errors)).toBe(true)
      expect(Array.isArray(migrationResult.warnings)).toBe(true)
    })

    test('should validate migration after execution', async () => {
      // Execute migration first
      await controller.executeMigration()
      
      // Then validate the migration
      const validationResult = await controller.validateMigration()
      
      expect(validationResult).toHaveProperty('isValid')
      expect(validationResult).toHaveProperty('errors')
      expect(validationResult).toHaveProperty('warnings')
      expect(validationResult).toHaveProperty('compilationSuccess')
      
      expect(Array.isArray(validationResult.errors)).toBe(true)
      expect(Array.isArray(validationResult.warnings)).toBe(true)
    })

    test('should generate comprehensive migration report', async () => {
      // Execute migration
      await controller.executeMigration()
      
      // Generate report
      const report = controller.generateReport()
      
      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('duration')
      expect(report).toHaveProperty('result')
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('recommendations')
      
      expect(report.timestamp).toBeInstanceOf(Date)
      expect(typeof report.duration).toBe('number')
      expect(typeof report.summary).toBe('string')
      expect(Array.isArray(report.recommendations)).toBe(true)
    })

    test('should handle migration with custom configuration', async () => {
      const customConfig: Partial<MigrationConfig> = {
        targetCadenceVersion: '1.1',
        preserveComments: false,
        validateAfterMigration: false
      }
      
      const customController = createMigrationController(customConfig)
      const result = await customController.executeMigration()
      
      expect(result).toHaveProperty('success')
      expect(customController.getConfigManager().getConfig().targetCadenceVersion).toBe('1.1')
      expect(customController.getConfigManager().getConfig().preserveComments).toBe(false)
    })

    test('should track migration timing and performance', async () => {
      const startTime = Date.now()
      
      // Add a small delay to ensure measurable duration
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const result = await controller.executeMigration()
      const report = controller.generateReport()
      
      const endTime = Date.now()
      const actualDuration = endTime - startTime
      
      // Report duration should be reasonable
      expect(report.duration).toBeGreaterThanOrEqual(0)
      expect(report.duration).toBeLessThan(actualDuration * 2) // More lenient timing check
    })
  })

  describe('Regression Testing', () => {
    test('should preserve original functionality after migration', async () => {
      // Test with a sample contract that has known functionality
      const sampleContract = `
        pub contract TestContract {
          pub var totalSupply: UFix64
          
          pub fun getTotalSupply(): UFix64 {
            return self.totalSupply
          }
          
          pub fun updateSupply(newSupply: UFix64) {
            self.totalSupply = newSupply
          }
          
          init() {
            self.totalSupply = 1000.0
          }
        }
      `
      
      const transformer = new CadenceSyntaxTransformer(logger)
      const migrated = transformer.transformAll(sampleContract)
      
      // Verify core functionality is preserved
      expect(migrated).toContain('totalSupply: UFix64')
      expect(migrated).toContain('getTotalSupply()')
      expect(migrated).toContain('updateSupply(')
      expect(migrated).toContain('init()')
      expect(migrated).toContain('1000.0')
      
      // Verify syntax is modernized
      expect(migrated).not.toContain('pub ')
      expect(migrated).toContain('access(all)')
    })

    test('should maintain resource ownership patterns', async () => {
      const resourceContract = `
        pub contract ResourceTest {
          pub resource Vault {
            pub var balance: UFix64
            
            pub fun deposit(from: @Vault) {
              self.balance = self.balance + from.balance
              destroy from
            }
            
            pub fun withdraw(amount: UFix64): @Vault {
              self.balance = self.balance - amount
              return <-create Vault(balance: amount)
            }
            
            init(balance: UFix64) {
              self.balance = balance
            }
          }
        }
      `
      
      const transformer = new CadenceSyntaxTransformer(logger)
      const migrated = transformer.transformAll(resourceContract)
      
      // Verify resource patterns are preserved
      expect(migrated).toContain('resource Vault')
      expect(migrated).toContain('@Vault')
      expect(migrated).toContain('<-')
      expect(migrated).toContain('destroy')
      expect(migrated).toContain('create')
      
      // Verify syntax is updated
      expect(migrated).toContain('access(all)')
      expect(migrated).not.toContain('pub ')
    })

    test('should preserve event functionality', async () => {
      const eventContract = `
        pub contract EventTest {
          pub event TokensDeposited(amount: UFix64, to: Address?)
          pub event TokensWithdrawn(amount: UFix64, from: Address?)
          
          pub fun deposit(amount: UFix64, to: Address?) {
            emit TokensDeposited(amount: amount, to: to)
          }
          
          pub fun withdraw(amount: UFix64, from: Address?) {
            emit TokensWithdrawn(amount: amount, from: from)
          }
        }
      `
      
      const transformer = new CadenceSyntaxTransformer(logger)
      const migrated = transformer.transformAll(eventContract)
      
      // Verify events are preserved
      expect(migrated).toContain('event TokensDeposited')
      expect(migrated).toContain('event TokensWithdrawn')
      expect(migrated).toContain('emit TokensDeposited')
      expect(migrated).toContain('emit TokensWithdrawn')
      
      // Verify syntax is updated
      expect(migrated).toContain('access(all)')
      expect(migrated).not.toContain('pub ')
    })

    test('should maintain interface conformance semantics', async () => {
      const interfaceContract = `
        pub contract InterfaceTest {
          pub resource interface Provider {
            pub fun withdraw(amount: UFix64): @Vault
          }
          
          pub resource interface Receiver {
            pub fun deposit(from: @Vault)
          }
          
          pub resource Vault: Provider, Receiver {
            pub var balance: UFix64
            
            pub fun withdraw(amount: UFix64): @Vault {
              return <-create Vault(balance: amount)
            }
            
            pub fun deposit(from: @Vault) {
              destroy from
            }
            
            init(balance: UFix64) {
              self.balance = balance
            }
          }
        }
      `
      
      const transformer = new CadenceSyntaxTransformer(logger)
      const migrated = transformer.transformAll(interfaceContract)
      
      // Verify interface conformance is updated correctly
      expect(migrated).toContain('Provider & Receiver')
      expect(migrated).not.toContain('Provider, Receiver')
      
      // Verify interface definitions are preserved
      expect(migrated).toContain('resource interface Provider')
      expect(migrated).toContain('resource interface Receiver')
      
      // Verify syntax is updated
      expect(migrated).toContain('access(all)')
      expect(migrated).not.toContain('pub ')
    })
  })

  describe('Performance Testing', () => {
    test('should complete migration within reasonable time limits', async () => {
      const startTime = Date.now()
      
      await controller.executeMigration()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Migration should complete within 5 seconds for basic operations
      expect(duration).toBeLessThan(5000)
    })

    test('should handle large code blocks efficiently', async () => {
      // Create a large contract for performance testing
      const largeContract = `
        pub contract LargeContract {
          ${Array.from({ length: 100 }, (_, i) => `
            pub var value${i}: UFix64
            
            pub fun getValue${i}(): UFix64 {
              return self.value${i}
            }
            
            pub fun setValue${i}(newValue: UFix64) {
              self.value${i} = newValue
            }
          `).join('\n')}
          
          init() {
            ${Array.from({ length: 100 }, (_, i) => `
              self.value${i} = ${i}.0
            `).join('\n')}
          }
        }
      `
      
      const transformer = new CadenceSyntaxTransformer(logger)
      const startTime = Date.now()
      
      const migrated = transformer.transformAll(largeContract)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should handle large contracts within reasonable time (2 seconds)
      expect(duration).toBeLessThan(2000)
      
      // Verify transformation was applied
      expect(migrated).not.toContain('pub ')
      expect(migrated).toContain('access(all)')
    })

    test('should provide performance metrics in migration report', async () => {
      // Add a small delay to ensure measurable duration
      await new Promise(resolve => setTimeout(resolve, 5))
      
      await controller.executeMigration()
      const report = controller.generateReport()
      
      expect(typeof report.duration).toBe('number')
      expect(report.duration).toBeGreaterThanOrEqual(0)
      
      // Should include performance-related information in summary
      expect(typeof report.summary).toBe('string')
      expect(report.summary.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid configuration gracefully', async () => {
      const invalidConfig = new MigrationConfigManager({
        targetCadenceVersion: '', // Invalid empty version
        transformationRules: [] // No transformation rules
      })
      
      const invalidController = new CadenceMigrationController(invalidConfig)
      const result = await invalidController.executeMigration()
      
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should handle empty code gracefully', async () => {
      const transformer = new CadenceSyntaxTransformer(logger)
      
      const emptyResult = transformer.transformAll('')
      expect(emptyResult).toBe('')
      
      const whitespaceResult = transformer.transformAll('   \n\n   ')
      expect(whitespaceResult).toBe('   \n\n   ')
    })

    test('should handle malformed Cadence code', async () => {
      const malformedCode = `
        pub contract {
          pub var incomplete
          pub fun missingBrace() {
        // Missing closing brace and other syntax errors
      `
      
      const transformer = new CadenceSyntaxTransformer(logger)
      
      // Should not throw an error, but should attempt transformation
      expect(() => {
        transformer.transformAll(malformedCode)
      }).not.toThrow()
    })

    test('should collect and categorize errors properly', async () => {
      const controller = new CadenceMigrationController()
      const errorHandler = controller.getErrorHandler()
      
      // Simulate various error types
      errorHandler.createError('test1.cdc', 'Syntax error', 'syntax')
      errorHandler.createError('test2.cdc', 'Transformation error', 'transformation')
      errorHandler.createError('test3.cdc', 'Validation error', 'validation')
      errorHandler.createWarning('test4.cdc', 'Warning message')
      
      const result = await controller.executeMigration()
      
      expect(result.errors.length).toBe(3)
      expect(result.warnings.length).toBe(1)
      expect(result.success).toBe(false)
      
      // Verify error categorization
      const syntaxErrors = result.errors.filter(e => e.category === 'syntax')
      const transformErrors = result.errors.filter(e => e.category === 'transformation')
      const validationErrors = result.errors.filter(e => e.category === 'validation')
      
      expect(syntaxErrors.length).toBe(1)
      expect(transformErrors.length).toBe(1)
      expect(validationErrors.length).toBe(1)
    })

    test('should provide meaningful error messages', async () => {
      const controller = new CadenceMigrationController()
      const errorHandler = controller.getErrorHandler()
      
      errorHandler.createError('complex.cdc', 'Complex pattern requires manual intervention', 'transformation', 'error', 10, 5)
      
      const result = await controller.executeMigration()
      const error = result.errors[0]
      
      expect(error.file).toBe('complex.cdc')
      expect(error.message).toContain('manual intervention')
      expect(error.category).toBe('transformation')
      expect(error.line).toBe(10)
      expect(error.column).toBe(5)
    })

    test('should handle concurrent migration attempts', async () => {
      const controller1 = new CadenceMigrationController()
      const controller2 = new CadenceMigrationController()
      
      // Run migrations concurrently
      const [result1, result2] = await Promise.all([
        controller1.executeMigration(),
        controller2.executeMigration()
      ])
      
      // Both should complete successfully
      expect(result1).toHaveProperty('success')
      expect(result2).toHaveProperty('success')
    })

    test('should provide rollback information on failure', async () => {
      const controller = new CadenceMigrationController()
      const report = controller.generateReport()
      
      expect(Array.isArray(report.recommendations)).toBe(true)
      
      // Should provide actionable recommendations
      if (report.recommendations.length > 0) {
        report.recommendations.forEach(recommendation => {
          expect(typeof recommendation).toBe('string')
          expect(recommendation.length).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('Integration with Template System', () => {
    test('should work with existing template structure', async () => {
      // Verify templates are available for testing
      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)
      
      // Test that migration can process template-like structures
      const templateMigrator = new CadenceTemplateMigrator(logger)
      
      // Should be able to create migrator without errors
      expect(templateMigrator).toBeDefined()
    })

    test('should maintain template metadata during migration', async () => {
      const sampleTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template for migration',
        code: `
          pub contract TestTemplate {
            pub var value: String
            
            pub fun getValue(): String {
              return self.value
            }
            
            init() {
              self.value = "test"
            }
          }
        `,
        category: 'utility',
        tags: ['test', 'utility'],
        author: 'Test',
        downloads: 0,
        featured: false
      }
      
      const templateMigrator = new CadenceTemplateMigrator(logger)
      const result = templateMigrator.migrateTemplate(sampleTemplate)
      
      // Verify metadata is preserved (description may be updated for Cadence 1.0 compatibility)
      expect(result.id).toBe(sampleTemplate.id)
      expect(result.name).toBe(sampleTemplate.name)
      expect(result.description).toContain('A test template for migration')
      expect(result.category).toBe(sampleTemplate.category)
      
      // Verify code is transformed
      expect(result.code).not.toContain('pub ')
      expect(result.code).toContain('access(all)')
    })
  })

  describe('Logging and Monitoring', () => {
    test('should provide comprehensive logging during migration', async () => {
      const verboseLogger = new MigrationLogger(LogLevel.DEBUG)
      const verboseController = new CadenceMigrationController(new MigrationConfigManager())
      verboseController.setLogLevel(LogLevel.DEBUG)
      
      await verboseController.executeMigration()
      
      const logs = verboseController.exportLogs()
      expect(typeof logs).toBe('string')
      expect(logs.length).toBeGreaterThan(0)
    })

    test('should track migration statistics accurately', async () => {
      const result = await controller.executeMigration()
      const stats = result.statistics
      
      // Statistics should be non-negative numbers
      expect(stats.totalFilesProcessed).toBeGreaterThanOrEqual(0)
      expect(stats.successfulMigrations).toBeGreaterThanOrEqual(0)
      expect(stats.failedMigrations).toBeGreaterThanOrEqual(0)
      expect(stats.transformationsApplied).toBeGreaterThanOrEqual(0)
      expect(stats.linesOfCodeMigrated).toBeGreaterThanOrEqual(0)
      
      // Failed + successful should not exceed total processed
      expect(stats.successfulMigrations + stats.failedMigrations).toBeLessThanOrEqual(stats.totalFilesProcessed)
    })

    test('should provide detailed error statistics', async () => {
      const controller = new CadenceMigrationController()
      const errorHandler = controller.getErrorHandler()
      
      // Add some test errors
      errorHandler.createError('file1.cdc', 'Error 1', 'syntax')
      errorHandler.createError('file2.cdc', 'Error 2', 'transformation')
      errorHandler.createWarning('file3.cdc', 'Warning 1')
      
      const errorStats = errorHandler.getStatistics()
      
      expect(errorStats.totalErrors).toBe(2)
      expect(errorStats.totalWarnings).toBe(1)
      expect(errorStats.filesWithErrors).toContain('file1.cdc')
      expect(errorStats.filesWithErrors).toContain('file2.cdc')
      expect(errorStats.filesWithWarnings).toContain('file3.cdc')
    })
  })
})