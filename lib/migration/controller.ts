/**
 * Migration controller framework - orchestrates the entire migration process
 */

import { 
  MigrationController, 
  MigrationResult, 
  ValidationResult, 
  MigrationReport,
  MigrationStatistics 
} from './types'
import { MigrationConfigManager } from './config'
import { MigrationLogger, LogLevel } from './logger'
import { MigrationErrorHandler } from './error-handler'

export class CadenceMigrationController implements MigrationController {
  private configManager: MigrationConfigManager
  private logger: MigrationLogger
  private errorHandler: MigrationErrorHandler
  private startTime?: Date
  private endTime?: Date

  constructor(configManager?: MigrationConfigManager) {
    this.configManager = configManager || new MigrationConfigManager()
    this.logger = new MigrationLogger(LogLevel.INFO)
    this.errorHandler = new MigrationErrorHandler(this.logger)
  }

  async executeMigration(): Promise<MigrationResult> {
    this.startTime = new Date()
    this.logger.info('Starting Cadence syntax migration process')

    try {
      // Validate configuration
      const configValidation = this.configManager.validateConfig()
      if (!configValidation.isValid) {
        configValidation.errors.forEach(error => {
          this.errorHandler.createError('config', error, 'system')
        })
        return this.createFailureResult([])
      }

      const config = this.configManager.getConfig()
      this.logger.info('Migration configuration validated', { 
        targetVersion: config.targetCadenceVersion,
        rulesCount: config.transformationRules.length 
      })

      // Initialize migration statistics
      const statistics: MigrationStatistics = {
        totalFilesProcessed: 0,
        successfulMigrations: 0,
        failedMigrations: 0,
        transformationsApplied: 0,
        linesOfCodeMigrated: 0
      }

      const migratedFiles: string[] = []

      // TODO: In subsequent tasks, this will be implemented to:
      // 1. Scan for files requiring migration
      // 2. Apply syntax transformations
      // 3. Validate migrated code
      // 4. Update templates and AI generation system

      this.logger.info('Migration process placeholder - implementation will be added in subsequent tasks')

      this.endTime = new Date()
      
      return {
        success: !this.errorHandler.hasErrors(),
        migratedFiles,
        errors: this.errorHandler.getErrors(),
        warnings: this.errorHandler.getWarnings(),
        statistics
      }

    } catch (error) {
      this.endTime = new Date()
      this.errorHandler.handleSystemError('migration-controller', error as Error)
      this.logger.error('Migration process failed with unexpected error', { error: (error as Error).message })
      
      return this.createFailureResult([])
    }
  }

  async validateMigration(): Promise<ValidationResult> {
    this.logger.info('Starting migration validation')

    try {
      // TODO: In subsequent tasks, this will validate:
      // 1. All migrated contracts compile successfully
      // 2. Functional equivalence between original and migrated code
      // 3. Proper import statement compatibility

      this.logger.info('Migration validation placeholder - implementation will be added in subsequent tasks')

      return {
        isValid: true,
        errors: [],
        warnings: [],
        compilationSuccess: true
      }

    } catch (error) {
      this.errorHandler.handleValidationError('validation', error as Error)
      return {
        isValid: false,
        errors: [(error as Error).message],
        warnings: [],
        compilationSuccess: false
      }
    }
  }

  generateReport(): MigrationReport {
    const duration = this.calculateDuration()
    const result = this.createCurrentResult()
    
    const report: MigrationReport = {
      timestamp: new Date(),
      duration,
      result,
      summary: this.generateSummary(result),
      recommendations: this.generateRecommendations(result)
    }

    this.logger.info('Migration report generated', {
      duration,
      success: result.success,
      filesProcessed: result.statistics.totalFilesProcessed
    })

    return report
  }

  private createFailureResult(migratedFiles: string[]): MigrationResult {
    return {
      success: false,
      migratedFiles,
      errors: this.errorHandler.getErrors(),
      warnings: this.errorHandler.getWarnings(),
      statistics: {
        totalFilesProcessed: 0,
        successfulMigrations: 0,
        failedMigrations: this.errorHandler.getErrors().length,
        transformationsApplied: 0,
        linesOfCodeMigrated: 0
      }
    }
  }

  private createCurrentResult(): MigrationResult {
    return {
      success: !this.errorHandler.hasErrors(),
      migratedFiles: [], // Will be populated in actual implementation
      errors: this.errorHandler.getErrors(),
      warnings: this.errorHandler.getWarnings(),
      statistics: {
        totalFilesProcessed: 0,
        successfulMigrations: 0,
        failedMigrations: this.errorHandler.getErrors().length,
        transformationsApplied: 0,
        linesOfCodeMigrated: 0
      }
    }
  }

  private calculateDuration(): number {
    if (!this.startTime) return 0
    const endTime = this.endTime || new Date()
    return endTime.getTime() - this.startTime.getTime()
  }

  private generateSummary(result: MigrationResult): string {
    const { statistics, success } = result
    
    if (success) {
      return `Migration completed successfully. Processed ${statistics.totalFilesProcessed} files, ` +
             `applied ${statistics.transformationsApplied} transformations, ` +
             `migrated ${statistics.linesOfCodeMigrated} lines of code.`
    } else {
      return `Migration completed with ${result.errors.length} errors and ${result.warnings.length} warnings. ` +
             `${statistics.successfulMigrations} files migrated successfully, ` +
             `${statistics.failedMigrations} files failed.`
    }
  }

  private generateRecommendations(result: MigrationResult): string[] {
    const recommendations: string[] = []

    if (result.errors.length > 0) {
      recommendations.push('Review and fix migration errors before proceeding')
      
      const syntaxErrors = result.errors.filter(e => e.category === 'syntax').length
      if (syntaxErrors > 0) {
        recommendations.push(`${syntaxErrors} syntax errors found - check for complex patterns requiring manual intervention`)
      }

      const transformationErrors = result.errors.filter(e => e.category === 'transformation').length
      if (transformationErrors > 0) {
        recommendations.push(`${transformationErrors} transformation errors found - review transformation rules`)
      }
    }

    if (result.warnings.length > 0) {
      recommendations.push('Review migration warnings for potential improvements')
    }

    if (result.statistics.totalFilesProcessed === 0) {
      recommendations.push('No files were processed - verify file discovery and filtering logic')
    }

    return recommendations
  }

  // Utility methods for external access
  getLogger(): MigrationLogger {
    return this.logger
  }

  getErrorHandler(): MigrationErrorHandler {
    return this.errorHandler
  }

  getConfigManager(): MigrationConfigManager {
    return this.configManager
  }

  setLogLevel(level: LogLevel): void {
    this.logger.setLogLevel(level)
  }

  exportLogs(): string {
    return this.logger.exportLogs()
  }

  getLogStatistics() {
    return this.logger.getStatistics()
  }

  getErrorStatistics() {
    return this.errorHandler.getStatistics()
  }
}