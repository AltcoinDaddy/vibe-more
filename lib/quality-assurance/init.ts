/**
 * Quality Assurance System Initialization
 */

import { qualityConfig, DEFAULT_QUALITY_CONFIG } from './config'
import { initializeLogger } from './logger'
import { qaErrorHandler } from './errors'

/**
 * Initialize the Quality Assurance system with default or custom configuration
 */
export function initializeQualityAssurance(customConfig?: Partial<typeof DEFAULT_QUALITY_CONFIG>): void {
  try {
    // Update configuration if custom config provided
    if (customConfig) {
      qualityConfig.updateConfig(customConfig)
    }

    // Validate configuration
    const validation = qualityConfig.validateConfig()
    if (!validation.valid) {
      throw new Error(`Invalid QA configuration: ${validation.errors.join(', ')}`)
    }

    // Initialize logger with configuration
    const config = qualityConfig.getConfig()
    initializeLogger(config.logging)

    // Clear any existing error history
    qaErrorHandler.clearHistory()

    console.log('Quality Assurance system initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Quality Assurance system:', error)
    throw error
  }
}

/**
 * Get system health status
 */
export function getSystemHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: Array<{ name: string; status: 'pass' | 'fail'; message?: string }>
} {
  const checks = []

  // Check configuration validity
  const configValidation = qualityConfig.validateConfig()
  checks.push({
    name: 'Configuration',
    status: configValidation.valid ? 'pass' : 'fail',
    message: configValidation.valid ? undefined : configValidation.errors.join(', ')
  })

  // Check error rates
  const errorStats = qaErrorHandler.getErrorStatistics()
  const recentErrorRate = errorStats.recentErrors.length / 10 // Last 10 operations
  checks.push({
    name: 'Error Rate',
    status: recentErrorRate < 0.5 ? 'pass' : 'fail',
    message: recentErrorRate >= 0.5 ? `High error rate: ${(recentErrorRate * 100).toFixed(1)}%` : undefined
  })

  // Determine overall status
  const failedChecks = checks.filter(check => check.status === 'fail').length
  let status: 'healthy' | 'degraded' | 'unhealthy'
  
  if (failedChecks === 0) {
    status = 'healthy'
  } else if (failedChecks <= checks.length / 2) {
    status = 'degraded'
  } else {
    status = 'unhealthy'
  }

  return { status, checks }
}