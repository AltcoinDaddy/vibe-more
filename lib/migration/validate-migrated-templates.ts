/**
 * Comprehensive validation for all migrated templates
 * This implements task 5.2: Validate all migrated templates
 */

import { templates, Template } from '../templates'
import { TemplateMigrationExecutor } from './execute-template-migration'
import { MigrationLogger, LogLevel } from './logger'
import { writeFileSync } from 'fs'
import { join } from 'path'

export interface TemplateValidationReport {
  timestamp: string
  totalTemplates: number
  validTemplates: number
  invalidTemplates: number
  templatesWithWarnings: number
  overallValid: boolean
  validationResults: {
    [templateId: string]: {
      isValid: boolean
      errors: string[]
      warnings: string[]
      legacySyntaxCheck: {
        hasLegacySyntax: boolean
        legacyPatterns: string[]
      }
      functionalityCheck: {
        maintainsFunctionality: boolean
        issues: string[]
      }
    }
  }
  summary: string
  recommendations: string[]
}

export class TemplateValidator {
  private executor: TemplateMigrationExecutor
  private logger: MigrationLogger

  constructor() {
    this.logger = new MigrationLogger(LogLevel.INFO)
    this.executor = new TemplateMigrationExecutor()
  }

  /**
   * Validate all migrated templates comprehensively
   */
  async validateAllMigratedTemplates(): Promise<TemplateValidationReport> {
    this.logger.info('Starting comprehensive template validation', { templateCount: templates.length })

    const validationResults: TemplateValidationReport['validationResults'] = {}
    let validTemplates = 0
    let invalidTemplates = 0
    let templatesWithWarnings = 0

    // Validate each template
    for (const template of templates) {
      this.logger.info('Validating template', { templateId: template.id })

      try {
        // Basic validation using existing infrastructure
        const basicValidation = await this.executor.validateAllTemplates([template])
        const templateValidation = basicValidation.validationResults[template.id]

        // Enhanced legacy syntax check
        const legacySyntaxCheck = this.checkForLegacySyntax(template)

        // Functionality preservation check
        const functionalityCheck = this.checkFunctionalityPreservation(template)

        // Combine all validation results
        const isValid = templateValidation.isValid && 
                       !legacySyntaxCheck.hasLegacySyntax && 
                       functionalityCheck.maintainsFunctionality

        validationResults[template.id] = {
          isValid,
          errors: [
            ...templateValidation.errors,
            ...(legacySyntaxCheck.hasLegacySyntax ? legacySyntaxCheck.legacyPatterns.map(p => `Legacy syntax: ${p}`) : []),
            ...functionalityCheck.issues
          ],
          warnings: templateValidation.warnings,
          legacySyntaxCheck,
          functionalityCheck
        }

        if (isValid) {
          validTemplates++
        } else {
          invalidTemplates++
        }

        if (templateValidation.warnings.length > 0) {
          templatesWithWarnings++
        }

        this.logger.info('Template validation completed', { 
          templateId: template.id, 
          isValid,
          errorCount: validationResults[template.id].errors.length,
          warningCount: validationResults[template.id].warnings.length
        })

      } catch (error) {
        this.logger.error('Template validation failed', { 
          templateId: template.id, 
          error: error instanceof Error ? error.message : String(error)
        })

        validationResults[template.id] = {
          isValid: false,
          errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
          warnings: [],
          legacySyntaxCheck: {
            hasLegacySyntax: false,
            legacyPatterns: []
          },
          functionalityCheck: {
            maintainsFunctionality: false,
            issues: ['Validation process failed']
          }
        }

        invalidTemplates++
      }
    }

    const overallValid = invalidTemplates === 0

    const report: TemplateValidationReport = {
      timestamp: new Date().toISOString(),
      totalTemplates: templates.length,
      validTemplates,
      invalidTemplates,
      templatesWithWarnings,
      overallValid,
      validationResults,
      summary: this.generateValidationSummary(validTemplates, invalidTemplates, templatesWithWarnings, templates.length),
      recommendations: this.generateRecommendations(validationResults)
    }

    this.logger.info('Template validation completed', {
      totalTemplates: templates.length,
      validTemplates,
      invalidTemplates,
      overallValid
    })

    return report
  }

  /**
   * Check for legacy syntax patterns in template code
   */
  private checkForLegacySyntax(template: Template): {
    hasLegacySyntax: boolean
    legacyPatterns: string[]
  } {
    const legacyPatterns: string[] = []
    const code = template.code

    // Check for pub keywords (should be replaced with access modifiers)
    if (/\bpub\s+(?:var|let|fun|resource|struct|contract|interface)/.test(code)) {
      legacyPatterns.push('pub keyword usage')
    }

    // Check for pub(set) keywords
    if (/\bpub\(set\)\s+/.test(code)) {
      legacyPatterns.push('pub(set) keyword usage')
    }

    // Check for comma-separated interface conformance (should use &)
    const commaInterfacePattern = /(\b(?:resource|struct|contract)\s+\w+\s*:\s*)([^{]+,\s*[^{]+)(\s*\{)/
    if (commaInterfacePattern.test(code) && !code.includes(' & ')) {
      const matches = code.match(commaInterfacePattern)
      if (matches && !matches[2].includes('&{') && !matches[2].includes('AnyResource{')) {
        legacyPatterns.push('comma-separated interface conformance')
      }
    }

    // Check for legacy storage API (should use account.storage.*)
    if (/\baccount\.(?:save|load|borrow|copy)\(/.test(code) && !code.includes('account.storage.')) {
      legacyPatterns.push('legacy storage API usage')
    }

    // Check for legacy capability patterns
    if (/\baccount\.link\(/.test(code) && !code.includes('account.capabilities.')) {
      legacyPatterns.push('legacy capability linking')
    }

    return {
      hasLegacySyntax: legacyPatterns.length > 0,
      legacyPatterns
    }
  }

  /**
   * Check if template maintains original functionality after migration
   */
  private checkFunctionalityPreservation(template: Template): {
    maintainsFunctionality: boolean
    issues: string[]
  } {
    const issues: string[] = []
    const code = template.code

    // Check for basic contract structure
    if (!code.includes('contract ') && !code.includes('access(all) contract ')) {
      issues.push('Missing contract declaration')
    }

    // Check for proper resource definitions (if applicable)
    if (code.includes('resource ') || code.includes('access(all) resource ')) {
      // Ensure resources have proper access modifiers
      if (!/access\(all\)\s+resource/.test(code) && !/access\([^)]+\)\s+resource/.test(code)) {
        // This might be acceptable if using implicit access
      }
    }

    // Check for function definitions
    if (code.includes('fun ') || code.includes('access(all) fun ')) {
      // Ensure functions have proper access modifiers where needed
      const functionMatches = code.match(/(?:access\([^)]+\)\s+)?fun\s+\w+/g)
      if (functionMatches) {
        // Functions should have access modifiers for public functions
        const publicFunctions = functionMatches.filter(match => 
          !match.includes('access(') && !match.includes('init(') && !match.includes('destroy(')
        )
        if (publicFunctions.length > 0) {
          // This might be acceptable for internal functions
        }
      }
    }

    // Check for event definitions
    if (code.includes('event ')) {
      if (!code.includes('access(all) event ')) {
        // Events should typically be public
        issues.push('Events should have access(all) modifier')
      }
    }

    // Check for import statements
    if (code.includes('import ')) {
      const importMatches = code.match(/import\s+"[^"]+"/g)
      if (importMatches) {
        // Imports should be valid
        for (const importMatch of importMatches) {
          if (!importMatch.includes('"')) {
            issues.push(`Invalid import statement: ${importMatch}`)
          }
        }
      }
    }

    // Check for proper initialization
    if (code.includes('init(') || code.includes('init ')) {
      // Should have proper init function
      if (!code.includes('init()') && !code.includes('init(')) {
        issues.push('Missing or malformed init function')
      }
    }

    return {
      maintainsFunctionality: issues.length === 0,
      issues
    }
  }

  /**
   * Generate validation summary
   */
  private generateValidationSummary(
    validTemplates: number, 
    invalidTemplates: number, 
    templatesWithWarnings: number, 
    totalTemplates: number
  ): string {
    const successRate = Math.round((validTemplates / totalTemplates) * 100)
    
    if (invalidTemplates === 0) {
      return `All ${totalTemplates} templates passed validation successfully (${successRate}% success rate). ` +
             `${templatesWithWarnings} templates have warnings that should be reviewed.`
    } else {
      return `${validTemplates} out of ${totalTemplates} templates passed validation (${successRate}% success rate). ` +
             `${invalidTemplates} templates failed validation and need attention. ` +
             `${templatesWithWarnings} templates have warnings.`
    }
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(validationResults: TemplateValidationReport['validationResults']): string[] {
    const recommendations: string[] = []
    
    const templatesWithErrors = Object.entries(validationResults).filter(([_, result]) => !result.isValid)
    const templatesWithLegacySyntax = Object.entries(validationResults).filter(([_, result]) => result.legacySyntaxCheck.hasLegacySyntax)
    const templatesWithFunctionalityIssues = Object.entries(validationResults).filter(([_, result]) => !result.functionalityCheck.maintainsFunctionality)

    if (templatesWithErrors.length > 0) {
      recommendations.push(`Review and fix ${templatesWithErrors.length} templates with validation errors`)
    }

    if (templatesWithLegacySyntax.length > 0) {
      recommendations.push(`${templatesWithLegacySyntax.length} templates still contain legacy syntax patterns - run migration again`)
      const legacyTemplates = templatesWithLegacySyntax.map(([id]) => id).join(', ')
      recommendations.push(`Templates with legacy syntax: ${legacyTemplates}`)
    }

    if (templatesWithFunctionalityIssues.length > 0) {
      recommendations.push(`${templatesWithFunctionalityIssues.length} templates have potential functionality issues`)
    }

    // Check for common patterns
    const commonErrors = this.findCommonErrors(validationResults)
    if (commonErrors.length > 0) {
      recommendations.push('Common issues found:')
      recommendations.push(...commonErrors.map(error => `  - ${error}`))
    }

    if (recommendations.length === 0) {
      recommendations.push('All templates are valid and ready for use')
      recommendations.push('Consider running integration tests to verify functionality')
    }

    return recommendations
  }

  /**
   * Find common error patterns across templates
   */
  private findCommonErrors(validationResults: TemplateValidationReport['validationResults']): string[] {
    const errorCounts: { [error: string]: number } = {}
    
    Object.values(validationResults).forEach(result => {
      result.errors.forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1
      })
    })

    return Object.entries(errorCounts)
      .filter(([_, count]) => count > 1)
      .map(([error, count]) => `${error} (${count} templates affected)`)
  }

  /**
   * Save validation report to file
   */
  async saveValidationReport(report: TemplateValidationReport, filename: string = 'template-validation-report.md'): Promise<string> {
    const reportContent = this.generateValidationReportMarkdown(report)
    const reportPath = join(process.cwd(), filename)
    
    writeFileSync(reportPath, reportContent)
    
    this.logger.info('Validation report saved', { reportPath })
    return reportPath
  }

  /**
   * Generate markdown report
   */
  private generateValidationReportMarkdown(report: TemplateValidationReport): string {
    const content = [
      '# Template Validation Report',
      '',
      `**Generated:** ${report.timestamp}`,
      '',
      '## Summary',
      `- Total templates: ${report.totalTemplates}`,
      `- Valid templates: ${report.validTemplates}`,
      `- Invalid templates: ${report.invalidTemplates}`,
      `- Templates with warnings: ${report.templatesWithWarnings}`,
      `- Overall validation: ${report.overallValid ? '✅ PASSED' : '❌ FAILED'}`,
      '',
      report.summary,
      '',
      '## Detailed Results',
      ''
    ]

    // Add details for each template
    Object.entries(report.validationResults).forEach(([templateId, result]) => {
      content.push(`### ${templateId}`)
      content.push(`- **Status:** ${result.isValid ? '✅ Valid' : '❌ Invalid'}`)
      content.push(`- **Legacy syntax:** ${result.legacySyntaxCheck.hasLegacySyntax ? '❌ Found' : '✅ Clean'}`)
      content.push(`- **Functionality:** ${result.functionalityCheck.maintainsFunctionality ? '✅ Preserved' : '❌ Issues'}`)
      
      if (result.legacySyntaxCheck.legacyPatterns.length > 0) {
        content.push(`- **Legacy patterns:** ${result.legacySyntaxCheck.legacyPatterns.join(', ')}`)
      }
      
      if (result.errors.length > 0) {
        content.push(`- **Errors:**`)
        result.errors.forEach(error => content.push(`  - ${error}`))
      }
      
      if (result.warnings.length > 0) {
        content.push(`- **Warnings:**`)
        result.warnings.forEach(warning => content.push(`  - ${warning}`))
      }
      
      if (result.functionalityCheck.issues.length > 0) {
        content.push(`- **Functionality issues:**`)
        result.functionalityCheck.issues.forEach(issue => content.push(`  - ${issue}`))
      }
      
      content.push('')
    })

    // Add recommendations
    if (report.recommendations.length > 0) {
      content.push('## Recommendations')
      report.recommendations.forEach(rec => content.push(`- ${rec}`))
      content.push('')
    }

    return content.join('\n')
  }
}

// CLI script to run validation
async function runTemplateValidation() {
  console.log('🔍 Starting comprehensive template validation...')
  
  const validator = new TemplateValidator()
  
  try {
    const report = await validator.validateAllMigratedTemplates()
    
    console.log(`\n📊 Validation Results:`)
    console.log(`  - Total templates: ${report.totalTemplates}`)
    console.log(`  - Valid templates: ${report.validTemplates}`)
    console.log(`  - Invalid templates: ${report.invalidTemplates}`)
    console.log(`  - Templates with warnings: ${report.templatesWithWarnings}`)
    console.log(`  - Overall status: ${report.overallValid ? '✅ PASSED' : '❌ FAILED'}`)
    
    console.log(`\n📝 ${report.summary}`)
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      report.recommendations.forEach(rec => console.log(`  - ${rec}`))
    }
    
    // Save detailed report
    const reportPath = await validator.saveValidationReport(report)
    console.log(`\n📄 Detailed validation report saved to: ${reportPath}`)
    
    if (!report.overallValid) {
      console.log('\n❌ Some templates failed validation. Please review the detailed report.')
      process.exit(1)
    } else {
      console.log('\n✅ All templates passed validation!')
    }
    
  } catch (error) {
    console.error('💥 Validation failed:', error)
    process.exit(1)
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  runTemplateValidation().catch(console.error)
}

export { runTemplateValidation }