/**
 * Quality Assurance Configuration Management
 */

import { QualityRequirements, PerformanceRequirements } from './types'

export interface QualityConfig {
  maxRetryAttempts: number
  qualityThreshold: number
  enableAutoCorrection: boolean
  enableFallbackGeneration: boolean
  strictValidation: boolean
  customValidationRules: ValidationRule[]
  performance: PerformanceRequirements
  logging: LoggingConfig
}

export interface ValidationRule {
  name: string
  pattern: RegExp
  severity: 'error' | 'warning' | 'info'
  message: string
  autoFix?: (match: string) => string
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enableMetrics: boolean
  enablePerformanceTracking: boolean
  enableDetailedErrors: boolean
  maxLogSize: number
}

/**
 * Default quality assurance configuration
 */
export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  maxRetryAttempts: 3,
  qualityThreshold: 80,
  enableAutoCorrection: true,
  enableFallbackGeneration: true,
  strictValidation: false,
  customValidationRules: [
    {
      name: 'no-undefined-values',
      pattern: /\bundefined\b/g,
      severity: 'error',
      message: 'Undefined values are not allowed in generated code',
      autoFix: (match: string) => '""' // Default to empty string for basic cases
    },
    {
      name: 'complete-function-bodies',
      pattern: /\{\s*$/gm,
      severity: 'warning',
      message: 'Function bodies should not be empty'
    },
    {
      name: 'proper-access-modifiers',
      pattern: /^(?!.*access\()/gm,
      severity: 'warning',
      message: 'Functions should have explicit access modifiers'
    }
  ],
  performance: {
    maxGenerationTime: 30000, // 30 seconds
    maxValidationTime: 5000,  // 5 seconds
    maxRetryAttempts: 3
  },
  logging: {
    level: 'info',
    enableMetrics: true,
    enablePerformanceTracking: true,
    enableDetailedErrors: true,
    maxLogSize: 1000000 // 1MB
  }
}

/**
 * Configuration manager for quality assurance settings
 */
export class QualityConfigManager {
  private config: QualityConfig
  private configOverrides: Partial<QualityConfig> = {}

  constructor(initialConfig?: Partial<QualityConfig>) {
    this.config = { ...DEFAULT_QUALITY_CONFIG, ...initialConfig }
  }

  /**
   * Get the current configuration
   */
  getConfig(): QualityConfig {
    return { ...this.config, ...this.configOverrides }
  }

  /**
   * Update configuration with new values
   */
  updateConfig(updates: Partial<QualityConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Set temporary configuration overrides
   */
  setOverrides(overrides: Partial<QualityConfig>): void {
    this.configOverrides = { ...this.configOverrides, ...overrides }
  }

  /**
   * Clear all configuration overrides
   */
  clearOverrides(): void {
    this.configOverrides = {}
  }

  /**
   * Get quality requirements based on user experience level
   */
  getQualityRequirements(userExperience: 'beginner' | 'intermediate' | 'expert'): QualityRequirements {
    const baseRequirements: QualityRequirements = {
      minimumQualityScore: this.config.qualityThreshold,
      requiredFeatures: [],
      prohibitedPatterns: ['undefined', 'null', '// TODO', '// FIXME'],
      performanceRequirements: this.config.performance
    }

    switch (userExperience) {
      case 'beginner':
        return {
          ...baseRequirements,
          minimumQualityScore: Math.max(90, this.config.qualityThreshold),
          requiredFeatures: ['complete-documentation', 'error-handling', 'input-validation'],
          prohibitedPatterns: [...baseRequirements.prohibitedPatterns, 'complex-logic', 'advanced-patterns']
        }
      
      case 'intermediate':
        return {
          ...baseRequirements,
          minimumQualityScore: Math.max(85, this.config.qualityThreshold),
          requiredFeatures: ['error-handling', 'input-validation'],
          prohibitedPatterns: [...baseRequirements.prohibitedPatterns, 'experimental-features']
        }
      
      case 'expert':
        return {
          ...baseRequirements,
          minimumQualityScore: Math.max(75, this.config.qualityThreshold),
          requiredFeatures: ['performance-optimized'],
          prohibitedPatterns: baseRequirements.prohibitedPatterns
        }
      
      default:
        return baseRequirements
    }
  }

  /**
   * Validate configuration settings
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (this.config.maxRetryAttempts < 0 || this.config.maxRetryAttempts > 10) {
      errors.push('maxRetryAttempts must be between 0 and 10')
    }

    if (this.config.qualityThreshold < 0 || this.config.qualityThreshold > 100) {
      errors.push('qualityThreshold must be between 0 and 100')
    }

    if (this.config.performance.maxGenerationTime < 1000) {
      errors.push('maxGenerationTime must be at least 1000ms')
    }

    if (this.config.performance.maxValidationTime < 100) {
      errors.push('maxValidationTime must be at least 100ms')
    }

    // Validate custom validation rules
    this.config.customValidationRules.forEach((rule, index) => {
      if (!rule.name || !rule.pattern || !rule.message) {
        errors.push(`Validation rule at index ${index} is missing required fields`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_QUALITY_CONFIG }
    this.configOverrides = {}
  }
}

// Global configuration instance
export const qualityConfig = new QualityConfigManager()