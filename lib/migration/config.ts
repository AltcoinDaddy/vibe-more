/**
 * Configuration management for Cadence syntax migration
 */

import { MigrationConfig, TransformationRule } from './types'

export const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  targetCadenceVersion: '1.0',
  preserveComments: true,
  validateAfterMigration: true,
  backupOriginals: true,
  transformationRules: [
    // Access modifier transformations
    {
      pattern: /\bpub\s+/g,
      replacement: 'access(all) ',
      description: 'Convert pub to access(all)',
      category: 'access-modifier'
    },
    {
      pattern: /\bpub\(set\)\s+/g,
      replacement: 'access(all) ',
      description: 'Convert pub(set) to access(all) with setter restrictions',
      category: 'access-modifier'
    },
    // Interface conformance transformations
    {
      pattern: /:\s*([A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)+)/g,
      replacement: (match: string, interfaces: string) => {
        return ': ' + interfaces.split(',').map(i => i.trim()).join(' & ')
      },
      description: 'Convert comma-separated interfaces to ampersand-separated',
      category: 'interface'
    },
    // Storage API transformations
    {
      pattern: /account\.save\(/g,
      replacement: 'account.storage.save(',
      description: 'Update account.save() to account.storage.save()',
      category: 'storage'
    },
    {
      pattern: /account\.borrow\(/g,
      replacement: 'account.capabilities.borrow(',
      description: 'Update account.borrow() to account.capabilities.borrow()',
      category: 'storage'
    },
    // Function signature transformations
    {
      pattern: /\bpub\s+fun\s+/g,
      replacement: 'access(all) fun ',
      description: 'Update function declarations with access modifiers',
      category: 'function'
    }
  ]
}

export class MigrationConfigManager {
  private config: MigrationConfig

  constructor(customConfig?: Partial<MigrationConfig>) {
    this.config = {
      ...DEFAULT_MIGRATION_CONFIG,
      ...customConfig,
      transformationRules: [
        ...DEFAULT_MIGRATION_CONFIG.transformationRules,
        ...(customConfig?.transformationRules || [])
      ]
    }
  }

  getConfig(): MigrationConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<MigrationConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    }
  }

  addTransformationRule(rule: TransformationRule): void {
    this.config.transformationRules.push(rule)
  }

  removeTransformationRule(description: string): void {
    this.config.transformationRules = this.config.transformationRules.filter(
      rule => rule.description !== description
    )
  }

  getTransformationRulesByCategory(category: TransformationRule['category']): TransformationRule[] {
    return this.config.transformationRules.filter(rule => rule.category === category)
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.config.targetCadenceVersion) {
      errors.push('Target Cadence version is required')
    }

    if (this.config.transformationRules.length === 0) {
      errors.push('At least one transformation rule is required')
    }

    // Validate transformation rules
    this.config.transformationRules.forEach((rule, index) => {
      if (!rule.pattern) {
        errors.push(`Transformation rule ${index}: pattern is required`)
      }
      if (!rule.replacement) {
        errors.push(`Transformation rule ${index}: replacement is required`)
      }
      if (!rule.description) {
        errors.push(`Transformation rule ${index}: description is required`)
      }
      if (!rule.category) {
        errors.push(`Transformation rule ${index}: category is required`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}