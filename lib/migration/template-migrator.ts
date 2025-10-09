/**
 * Template migration system for Cadence syntax migration
 * Handles scanning, processing, and validation of contract templates
 */

import { Template } from '../templates'
import { TemplateMigrator, ValidationResult, TemplateMigrationResult } from './types'
import { CadenceSyntaxTransformer } from './syntax-transformer'
import { MigrationLogger } from './logger'

export class CadenceTemplateMigrator implements TemplateMigrator {
  private syntaxTransformer: CadenceSyntaxTransformer
  private logger: MigrationLogger

  constructor(logger?: MigrationLogger) {
    this.logger = logger || new MigrationLogger()
    this.syntaxTransformer = new CadenceSyntaxTransformer(this.logger)
  }

  /**
   * Migrate a single template to modern Cadence 1.0 syntax
   */
  migrateTemplate(template: Template): Template {
    this.logger.info('Starting template migration', { templateId: template.id, templateName: template.name })

    try {
      // Check if template needs migration
      if (!this.needsMigration(template.code)) {
        this.logger.info('Template already uses modern syntax, skipping migration', { templateId: template.id })
        return template
      }

      // Apply syntax transformations
      const migratedCode = this.syntaxTransformer.transformAll(template.code)

      // Create migrated template
      const migratedTemplate: Template = {
        ...template,
        code: migratedCode
      }

      // Update template metadata to reflect migration
      const updatedTemplate = this.updateTemplateMetadata(migratedTemplate)

      this.logger.info('Template migration completed successfully', { 
        templateId: template.id,
        originalLength: template.code.length,
        migratedLength: migratedCode.length
      })

      return updatedTemplate
    } catch (error) {
      this.logger.error('Template migration failed', { 
        templateId: template.id, 
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Validate a template after migration
   */
  validateTemplate(template: Template): ValidationResult {
    this.logger.debug('Starting template validation', { templateId: template.id })

    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Check for legacy syntax patterns
      const legacyPatterns = this.findLegacyPatterns(template.code)
      if (legacyPatterns.length > 0) {
        errors.push(...legacyPatterns.map(pattern => `Legacy syntax found: ${pattern}`))
      }

      // Check for basic syntax issues
      const syntaxIssues = this.checkBasicSyntax(template.code)
      if (syntaxIssues.length > 0) {
        errors.push(...syntaxIssues)
      }

      // Check for modern Cadence patterns
      const modernPatterns = this.checkModernPatterns(template.code)
      if (modernPatterns.length > 0) {
        warnings.push(...modernPatterns)
      }

      const isValid = errors.length === 0
      const compilationSuccess = isValid // Simplified for now

      this.logger.info('Template validation completed', { 
        templateId: template.id,
        isValid,
        errorCount: errors.length,
        warningCount: warnings.length
      })

      return {
        isValid,
        errors,
        warnings,
        compilationSuccess
      }
    } catch (error) {
      this.logger.error('Template validation failed', { 
        templateId: template.id, 
        error: error instanceof Error ? error.message : String(error)
      })
      
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        warnings,
        compilationSuccess: false
      }
    }
  }

  /**
   * Update template metadata to reflect Cadence 1.0 compatibility
   */
  updateTemplateMetadata(template: Template): Template {
    this.logger.debug('Updating template metadata', { templateId: template.id })

    // Add Cadence 1.0 tag if not present
    const tags = [...template.tags]
    if (!tags.includes('Cadence 1.0')) {
      tags.push('Cadence 1.0')
    }

    // Update description to mention Cadence 1.0 compatibility
    let description = template.description
    if (!description.toLowerCase().includes('cadence 1.0')) {
      description = `${description} (Updated for Cadence 1.0 compatibility)`
    }

    return {
      ...template,
      tags,
      description
    }
  }

  /**
   * Check if a template needs migration by looking for legacy patterns
   */
  private needsMigration(code: string): boolean {
    const legacyPatterns = [
      /\bpub\s+(?:var|let|fun|resource|struct|contract|interface)/,  // pub keyword
      /\bpub\(set\)\s+/,  // pub(set) keyword
      /:\s*[^{]+,\s*[^{]+\s*\{/,  // comma-separated interface conformance
      /\baccount\.(?:save|load|borrow|copy)\(/,  // legacy storage API
    ]

    return legacyPatterns.some(pattern => pattern.test(code))
  }

  /**
   * Find legacy syntax patterns in code
   */
  private findLegacyPatterns(code: string): string[] {
    const patterns: string[] = []

    // Check for pub keywords
    if (/\bpub\s+(?:var|let|fun|resource|struct|contract|interface)/.test(code)) {
      patterns.push('pub keyword usage')
    }

    // Check for pub(set) keywords
    if (/\bpub\(set\)\s+/.test(code)) {
      patterns.push('pub(set) keyword usage')
    }

    // Check for comma-separated interface conformance
    // Look for patterns like "resource Name: Interface1, Interface2 {" but exclude type annotations like "&{Interface}"
    const commaInterfacePattern = /(\b(?:resource|struct|contract)\s+\w+\s*:\s*)([^{]+,\s*[^{]+)(\s*\{)/
    if (commaInterfacePattern.test(code) && !code.includes(' & ')) {
      // Make sure it's not just a type annotation with braces
      const matches = code.match(commaInterfacePattern)
      if (matches && !matches[2].includes('&{') && !matches[2].includes('AnyResource{')) {
        patterns.push('comma-separated interface conformance')
      }
    }

    // Check for legacy storage API (but not if it already uses .storage.)
    if (/\baccount\.(?:save|load|borrow|copy)\(/.test(code) && !code.includes('account.storage.')) {
      patterns.push('legacy storage API usage')
    }

    return patterns
  }

  /**
   * Check for basic syntax issues
   */
  private checkBasicSyntax(code: string): string[] {
    const issues: string[] = []

    // Check for unmatched braces
    const openBraces = (code.match(/\{/g) || []).length
    const closeBraces = (code.match(/\}/g) || []).length
    if (openBraces !== closeBraces) {
      issues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`)
    }

    // Check for unmatched parentheses
    const openParens = (code.match(/\(/g) || []).length
    const closeParens = (code.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      issues.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`)
    }

    return issues
  }

  /**
   * Check for modern Cadence patterns and suggest improvements
   */
  private checkModernPatterns(code: string): string[] {
    const suggestions: string[] = []

    // Check if using modern access modifiers
    if (!code.includes('access(all)') && !code.includes('access(')) {
      suggestions.push('Consider using explicit access modifiers like access(all)')
    }

    // Check for capability-based patterns
    if (code.includes('account.storage') && !code.includes('account.capabilities')) {
      suggestions.push('Consider using capability-based access patterns where appropriate')
    }

    // Check for view functions
    if (code.includes('fun get') && !code.includes('view fun')) {
      suggestions.push('Consider adding view modifier to getter functions')
    }

    return suggestions
  }

  /**
   * Get migration statistics for a template
   */
  getTemplateMigrationStats(original: Template, migrated: Template) {
    const originalLines = original.code.split('\n').length
    const migratedLines = migrated.code.split('\n').length
    
    return {
      templateId: original.id,
      templateName: original.name,
      originalLines,
      migratedLines,
      linesChanged: Math.abs(migratedLines - originalLines),
      hasChanges: original.code !== migrated.code,
      originalSize: original.code.length,
      migratedSize: migrated.code.length
    }
  }
}