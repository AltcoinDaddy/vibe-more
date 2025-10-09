/**
 * Template scanner and processor for Cadence syntax migration
 * Scans all templates and orchestrates the migration process
 */

import { Template, templates } from '../templates'
import { TemplateMigrationResult, ValidationResult, MigrationStatistics } from './types'
import { CadenceTemplateMigrator } from './template-migrator'
import { MigrationLogger } from './logger'

export interface TemplateScanResult {
  totalTemplates: number
  templatesNeedingMigration: Template[]
  templatesAlreadyMigrated: Template[]
  migrationCandidates: string[]
}

export interface TemplateProcessingResult {
  success: boolean
  migratedTemplates: Template[]
  migrationResults: TemplateMigrationResult[]
  statistics: MigrationStatistics
  errors: string[]
  warnings: string[]
}

export class TemplateScanner {
  private templateMigrator: CadenceTemplateMigrator
  private logger: MigrationLogger

  constructor(logger?: MigrationLogger) {
    this.logger = logger || new MigrationLogger()
    this.templateMigrator = new CadenceTemplateMigrator(this.logger)
  }

  /**
   * Scan all templates in lib/templates.ts to identify migration candidates
   */
  scanAllTemplates(): TemplateScanResult {
    this.logger.info('Starting template scan', { totalTemplates: templates.length })

    const templatesNeedingMigration: Template[] = []
    const templatesAlreadyMigrated: Template[] = []
    const migrationCandidates: string[] = []

    for (const template of templates) {
      if (this.needsMigration(template)) {
        templatesNeedingMigration.push(template)
        migrationCandidates.push(template.id)
        this.logger.debug('Template needs migration', { 
          templateId: template.id, 
          templateName: template.name 
        })
      } else {
        templatesAlreadyMigrated.push(template)
        this.logger.debug('Template already migrated', { 
          templateId: template.id, 
          templateName: template.name 
        })
      }
    }

    const result: TemplateScanResult = {
      totalTemplates: templates.length,
      templatesNeedingMigration,
      templatesAlreadyMigrated,
      migrationCandidates
    }

    this.logger.info('Template scan completed', {
      totalTemplates: result.totalTemplates,
      needingMigration: result.templatesNeedingMigration.length,
      alreadyMigrated: result.templatesAlreadyMigrated.length
    })

    return result
  }

  /**
   * Process and migrate all templates that need migration
   */
  async processAllTemplates(): Promise<TemplateProcessingResult> {
    this.logger.info('Starting template processing')

    const scanResult = this.scanAllTemplates()
    const migratedTemplates: Template[] = []
    const migrationResults: TemplateMigrationResult[] = []
    const errors: string[] = []
    const warnings: string[] = []

    let successfulMigrations = 0
    let failedMigrations = 0
    let totalTransformations = 0

    // Keep already migrated templates as-is
    migratedTemplates.push(...scanResult.templatesAlreadyMigrated)

    // Process templates that need migration
    for (const template of scanResult.templatesNeedingMigration) {
      try {
        this.logger.info('Processing template', { templateId: template.id })

        // Migrate the template
        const migratedTemplate = this.templateMigrator.migrateTemplate(template)
        
        // Validate the migrated template
        const validationResult = this.templateMigrator.validateTemplate(migratedTemplate)
        
        // Get transformation statistics
        const stats = this.templateMigrator.getTemplateMigrationStats(template, migratedTemplate)
        
        // Create migration result
        const migrationResult: TemplateMigrationResult = {
          originalTemplate: template,
          migratedTemplate,
          transformationsApplied: this.getTransformationsApplied(template.code, migratedTemplate.code),
          validationResult
        }

        migrationResults.push(migrationResult)

        if (validationResult.isValid) {
          migratedTemplates.push(migratedTemplate)
          successfulMigrations++
          totalTransformations += migrationResult.transformationsApplied.length
          
          this.logger.info('Template migration successful', { 
            templateId: template.id,
            transformations: migrationResult.transformationsApplied.length
          })
        } else {
          // Keep original template if migration failed validation
          migratedTemplates.push(template)
          failedMigrations++
          errors.push(`Template ${template.id} migration failed validation: ${validationResult.errors.join(', ')}`)
          
          this.logger.error('Template migration failed validation', { 
            templateId: template.id,
            errors: validationResult.errors
          })
        }

        // Collect warnings
        if (validationResult.warnings.length > 0) {
          warnings.push(...validationResult.warnings.map(w => `${template.id}: ${w}`))
        }

      } catch (error) {
        failedMigrations++
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push(`Template ${template.id} migration failed: ${errorMessage}`)
        
        // Keep original template on error
        migratedTemplates.push(template)
        
        this.logger.error('Template migration error', { 
          templateId: template.id, 
          error: errorMessage 
        })
      }
    }

    const statistics: MigrationStatistics = {
      totalFilesProcessed: scanResult.templatesNeedingMigration.length,
      successfulMigrations,
      failedMigrations,
      transformationsApplied: totalTransformations,
      linesOfCodeMigrated: this.calculateTotalLinesOfCode(migratedTemplates)
    }

    const result: TemplateProcessingResult = {
      success: failedMigrations === 0,
      migratedTemplates,
      migrationResults,
      statistics,
      errors,
      warnings
    }

    this.logger.info('Template processing completed', {
      success: result.success,
      totalProcessed: statistics.totalFilesProcessed,
      successful: statistics.successfulMigrations,
      failed: statistics.failedMigrations,
      transformations: statistics.transformationsApplied
    })

    return result
  }

  /**
   * Get templates by category for targeted migration
   */
  getTemplatesByCategory(category: string): Template[] {
    return templates.filter(template => template.category === category)
  }

  /**
   * Get specific template by ID
   */
  getTemplateById(id: string): Template | undefined {
    return templates.find(template => template.id === id)
  }

  /**
   * Process a single template by ID
   */
  async processSingleTemplate(templateId: string): Promise<TemplateMigrationResult | null> {
    const template = this.getTemplateById(templateId)
    if (!template) {
      this.logger.error('Template not found', { templateId })
      return null
    }

    try {
      this.logger.info('Processing single template', { templateId })

      const migratedTemplate = this.templateMigrator.migrateTemplate(template)
      const validationResult = this.templateMigrator.validateTemplate(migratedTemplate)
      
      const migrationResult: TemplateMigrationResult = {
        originalTemplate: template,
        migratedTemplate,
        transformationsApplied: this.getTransformationsApplied(template.code, migratedTemplate.code),
        validationResult
      }

      this.logger.info('Single template processing completed', { 
        templateId,
        success: validationResult.isValid
      })

      return migrationResult
    } catch (error) {
      this.logger.error('Single template processing failed', { 
        templateId, 
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * Check if a template needs migration
   */
  private needsMigration(template: Template): boolean {
    const legacyPatterns = [
      /\bpub\s+(?:var|let|fun|resource|struct|contract|interface)/,  // pub keyword
      /\bpub\(set\)\s+/,  // pub(set) keyword
      /:\s*[^{]+,\s*[^{]+\s*\{/,  // comma-separated interface conformance
      /\baccount\.(?:save|load|borrow|copy)\(/,  // legacy storage API
    ]

    return legacyPatterns.some(pattern => pattern.test(template.code))
  }

  /**
   * Determine what transformations were applied by comparing original and migrated code
   */
  private getTransformationsApplied(originalCode: string, migratedCode: string): string[] {
    const transformations: string[] = []

    // Check for access modifier transformations
    if (originalCode.includes('pub ') && !migratedCode.includes('pub ')) {
      transformations.push('access-modifier-transformation')
    }

    // Check for interface conformance transformations
    if (originalCode.match(/:\s*[^{&]+,\s*[^{&]+/) && migratedCode.includes(' & ')) {
      transformations.push('interface-conformance-transformation')
    }

    // Check for storage API transformations
    if (originalCode.includes('account.save') && migratedCode.includes('account.storage.save')) {
      transformations.push('storage-api-transformation')
    }

    // Check for function signature transformations
    if (!originalCode.includes('view fun') && migratedCode.includes('view fun')) {
      transformations.push('function-signature-transformation')
    }

    return transformations
  }

  /**
   * Calculate total lines of code across all templates
   */
  private calculateTotalLinesOfCode(templates: Template[]): number {
    return templates.reduce((total, template) => {
      return total + template.code.split('\n').length
    }, 0)
  }

  /**
   * Generate a migration report
   */
  generateMigrationReport(result: TemplateProcessingResult): string {
    const report = [
      '# Template Migration Report',
      '',
      `**Generated:** ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Total templates processed: ${result.statistics.totalFilesProcessed}`,
      `- Successful migrations: ${result.statistics.successfulMigrations}`,
      `- Failed migrations: ${result.statistics.failedMigrations}`,
      `- Total transformations applied: ${result.statistics.transformationsApplied}`,
      `- Lines of code migrated: ${result.statistics.linesOfCodeMigrated}`,
      '',
      '## Migration Results',
      ''
    ]

    // Add details for each migration
    for (const migrationResult of result.migrationResults) {
      const template = migrationResult.originalTemplate
      report.push(`### ${template.name} (${template.id})`)
      report.push(`- **Category:** ${template.category}`)
      report.push(`- **Status:** ${migrationResult.validationResult.isValid ? '✅ Success' : '❌ Failed'}`)
      report.push(`- **Transformations:** ${migrationResult.transformationsApplied.join(', ') || 'None'}`)
      
      if (migrationResult.validationResult.errors.length > 0) {
        report.push(`- **Errors:** ${migrationResult.validationResult.errors.join(', ')}`)
      }
      
      if (migrationResult.validationResult.warnings.length > 0) {
        report.push(`- **Warnings:** ${migrationResult.validationResult.warnings.join(', ')}`)
      }
      
      report.push('')
    }

    // Add errors and warnings summary
    if (result.errors.length > 0) {
      report.push('## Errors')
      result.errors.forEach(error => report.push(`- ${error}`))
      report.push('')
    }

    if (result.warnings.length > 0) {
      report.push('## Warnings')
      result.warnings.forEach(warning => report.push(`- ${warning}`))
      report.push('')
    }

    return report.join('\n')
  }
}