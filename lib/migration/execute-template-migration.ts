/**
 * Execute template migrations using existing infrastructure
 * This script runs the template migration for remaining legacy templates
 */

import { templates, Template } from '../templates'
import { TemplateScanner } from './template-scanner'
import { MigrationLogger, LogLevel } from './logger'

export interface TemplateMigrationExecutionResult {
  success: boolean
  migratedTemplates: Template[]
  migrationReport: string
  errors: string[]
  warnings: string[]
  statistics: {
    totalProcessed: number
    successfulMigrations: number
    failedMigrations: number
    transformationsApplied: number
  }
}

export class TemplateMigrationExecutor {
  private scanner: TemplateScanner
  private logger: MigrationLogger

  constructor() {
    this.logger = new MigrationLogger(LogLevel.INFO)
    this.scanner = new TemplateScanner(this.logger)
  }

  /**
   * Execute migration for all templates that need it
   */
  async executeAllTemplateMigrations(): Promise<TemplateMigrationExecutionResult> {
    this.logger.info('Starting template migration execution')

    try {
      // First, scan to identify templates needing migration
      const scanResult = this.scanner.scanAllTemplates()
      
      this.logger.info('Template scan results', {
        total: scanResult.totalTemplates,
        needingMigration: scanResult.templatesNeedingMigration.length,
        alreadyMigrated: scanResult.templatesAlreadyMigrated.length,
        candidates: scanResult.migrationCandidates
      })

      // Process all templates
      const processingResult = await this.scanner.processAllTemplates()

      // Generate migration report
      const migrationReport = this.scanner.generateMigrationReport(processingResult)

      const result: TemplateMigrationExecutionResult = {
        success: processingResult.success,
        migratedTemplates: processingResult.migratedTemplates,
        migrationReport,
        errors: processingResult.errors,
        warnings: processingResult.warnings,
        statistics: {
          totalProcessed: processingResult.statistics.totalFilesProcessed,
          successfulMigrations: processingResult.statistics.successfulMigrations,
          failedMigrations: processingResult.statistics.failedMigrations,
          transformationsApplied: processingResult.statistics.transformationsApplied
        }
      }

      this.logger.info('Template migration execution completed', {
        success: result.success,
        totalProcessed: result.statistics.totalProcessed,
        successful: result.statistics.successfulMigrations,
        failed: result.statistics.failedMigrations
      })

      return result

    } catch (error) {
      this.logger.error('Template migration execution failed', { 
        error: error instanceof Error ? error.message : String(error) 
      })

      return {
        success: false,
        migratedTemplates: [],
        migrationReport: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        statistics: {
          totalProcessed: 0,
          successfulMigrations: 0,
          failedMigrations: 1,
          transformationsApplied: 0
        }
      }
    }
  }

  /**
   * Execute migration for specific templates by ID
   */
  async executeSpecificTemplateMigrations(templateIds: string[]): Promise<TemplateMigrationExecutionResult> {
    this.logger.info('Starting specific template migrations', { templateIds })

    const migratedTemplates: Template[] = []
    const errors: string[] = []
    const warnings: string[] = []
    let successfulMigrations = 0
    let failedMigrations = 0
    let transformationsApplied = 0

    // Keep all templates that are not being migrated
    const templatesToKeep = templates.filter(t => !templateIds.includes(t.id))
    migratedTemplates.push(...templatesToKeep)

    // Process specified templates
    for (const templateId of templateIds) {
      try {
        const migrationResult = await this.scanner.processSingleTemplate(templateId)
        
        if (migrationResult) {
          if (migrationResult.validationResult.isValid) {
            migratedTemplates.push(migrationResult.migratedTemplate)
            successfulMigrations++
            transformationsApplied += migrationResult.transformationsApplied.length
            
            this.logger.info('Template migration successful', { 
              templateId,
              transformations: migrationResult.transformationsApplied.length
            })
          } else {
            // Keep original template if migration failed
            const originalTemplate = templates.find(t => t.id === templateId)
            if (originalTemplate) {
              migratedTemplates.push(originalTemplate)
            }
            failedMigrations++
            errors.push(`Template ${templateId} migration failed validation: ${migrationResult.validationResult.errors.join(', ')}`)
          }

          // Collect warnings
          if (migrationResult.validationResult.warnings.length > 0) {
            warnings.push(...migrationResult.validationResult.warnings.map(w => `${templateId}: ${w}`))
          }
        } else {
          failedMigrations++
          errors.push(`Template ${templateId} not found or migration failed`)
        }

      } catch (error) {
        failedMigrations++
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push(`Template ${templateId} migration failed: ${errorMessage}`)
        
        // Keep original template on error
        const originalTemplate = templates.find(t => t.id === templateId)
        if (originalTemplate) {
          migratedTemplates.push(originalTemplate)
        }
      }
    }

    const migrationReport = this.generateSpecificMigrationReport(templateIds, successfulMigrations, failedMigrations, errors, warnings)

    return {
      success: failedMigrations === 0,
      migratedTemplates,
      migrationReport,
      errors,
      warnings,
      statistics: {
        totalProcessed: templateIds.length,
        successfulMigrations,
        failedMigrations,
        transformationsApplied
      }
    }
  }

  /**
   * Get templates that need migration
   */
  getTemplatesNeedingMigration(): string[] {
    const scanResult = this.scanner.scanAllTemplates()
    return scanResult.migrationCandidates
  }

  /**
   * Validate all templates after migration
   */
  async validateAllTemplates(templates: Template[]): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    validationResults: { [templateId: string]: { isValid: boolean, errors: string[], warnings: string[] } }
  }> {
    this.logger.info('Starting template validation', { templateCount: templates.length })

    const errors: string[] = []
    const warnings: string[] = []
    const validationResults: { [templateId: string]: { isValid: boolean, errors: string[], warnings: string[] } } = {}

    for (const template of templates) {
      try {
        const validationResult = await this.scanner['templateMigrator'].validateTemplate(template)
        
        validationResults[template.id] = {
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        }

        if (!validationResult.isValid) {
          errors.push(...validationResult.errors.map(e => `${template.id}: ${e}`))
        }

        if (validationResult.warnings.length > 0) {
          warnings.push(...validationResult.warnings.map(w => `${template.id}: ${w}`))
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push(`${template.id}: Validation failed - ${errorMessage}`)
        validationResults[template.id] = {
          isValid: false,
          errors: [errorMessage],
          warnings: []
        }
      }
    }

    const isValid = errors.length === 0

    this.logger.info('Template validation completed', {
      isValid,
      errorCount: errors.length,
      warningCount: warnings.length
    })

    return {
      isValid,
      errors,
      warnings,
      validationResults
    }
  }

  private generateSpecificMigrationReport(
    templateIds: string[], 
    successful: number, 
    failed: number, 
    errors: string[], 
    warnings: string[]
  ): string {
    const report = [
      '# Specific Template Migration Report',
      '',
      `**Generated:** ${new Date().toISOString()}`,
      `**Templates:** ${templateIds.join(', ')}`,
      '',
      '## Summary',
      `- Templates processed: ${templateIds.length}`,
      `- Successful migrations: ${successful}`,
      `- Failed migrations: ${failed}`,
      ''
    ]

    if (errors.length > 0) {
      report.push('## Errors')
      errors.forEach(error => report.push(`- ${error}`))
      report.push('')
    }

    if (warnings.length > 0) {
      report.push('## Warnings')
      warnings.forEach(warning => report.push(`- ${warning}`))
      report.push('')
    }

    return report.join('\n')
  }
}