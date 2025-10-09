/**
 * Example usage of the Quality Assurance Monitoring and Alerting System
 * 
 * This file demonstrates how to set up and use the monitoring system
 * in a production environment.
 */

import { 
  initializeMonitoringController,
  getMonitoringController,
  MonitoringControllerConfig
} from './monitoring-controller'
import { initializeLogger } from './logger'
import { DEFAULT_QUALITY_CONFIG } from './config'

/**
 * Example: Initialize and configure the monitoring system
 */
export async function setupMonitoringSystem(): Promise<void> {
  // Initialize logger first
  initializeLogger(DEFAULT_QUALITY_CONFIG.logging)

  // Configure monitoring system
  const config: Partial<MonitoringControllerConfig> = {
    monitoring: {
      enabled: true,
      checkInterval: 60000, // Check every minute
      alertThresholds: {
        qualityScoreMin: 75,
        successRateMin: 85,
        errorRateMax: 15,
        responseTimeMax: 10000,
        fallbackUsageMax: 25,
        correctionFailureMax: 3
      },
      retentionPeriod: 30,
      enableRealTimeAlerts: true,
      enableTrendAnalysis: true
    },
    alerting: {
      enabled: true,
      channels: [
        {
          name: 'console-alerts',
          type: 'console',
          config: {},
          enabled: true,
          severityFilter: ['medium', 'high', 'critical'],
          typeFilter: []
        },
        {
          name: 'file-logger',
          type: 'file',
          config: {
            filePath: './logs/quality-alerts.log'
          },
          enabled: true,
          severityFilter: [],
          typeFilter: []
        },
        {
          name: 'webhook-notifications',
          type: 'webhook',
          config: {
            url: process.env.WEBHOOK_URL || 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 5000
          },
          enabled: !!process.env.WEBHOOK_URL,
          severityFilter: ['high', 'critical'],
          typeFilter: []
        }
      ],
      escalationRules: [
        {
          name: 'critical-immediate',
          condition: { severity: 'critical' },
          action: { type: 'notify', channels: ['console-alerts', 'webhook-notifications'] },
          delay: 0
        },
        {
          name: 'high-escalate',
          condition: { severity: 'high', unresolvedDuration: 300000 }, // 5 minutes
          action: { type: 'escalate', channels: ['webhook-notifications'] },
          delay: 300000
        }
      ],
      suppressionRules: [
        {
          name: 'night-suppression',
          condition: { 
            severity: 'low',
            timeWindow: { start: '22:00', end: '06:00' }
          },
          duration: 8 * 60 * 60 * 1000, // 8 hours
          reason: 'Suppress low severity alerts during night hours'
        }
      ],
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
        maxDelay: 10000
      }
    },
    healthCheck: {
      enabled: true,
      checkInterval: 30000, // Check every 30 seconds
      timeout: 5000,
      retryAttempts: 2,
      components: [
        {
          name: 'undefined-detector',
          type: 'undefined-detector',
          enabled: true,
          criticalityLevel: 'high',
          dependencies: []
        },
        {
          name: 'auto-corrector',
          type: 'auto-corrector',
          enabled: true,
          criticalityLevel: 'high',
          dependencies: ['undefined-detector']
        },
        {
          name: 'validator',
          type: 'validator',
          enabled: true,
          criticalityLevel: 'critical',
          dependencies: []
        },
        {
          name: 'fallback-generator',
          type: 'fallback-generator',
          enabled: true,
          criticalityLevel: 'medium',
          dependencies: []
        },
        {
          name: 'quality-scorer',
          type: 'quality-scorer',
          enabled: true,
          criticalityLevel: 'medium',
          dependencies: ['validator']
        }
      ]
    },
    integration: {
      enabled: true,
      forwardHealthAlertsToMonitoring: true,
      forwardMonitoringAlertsToAlerting: true,
      enableCrossSystemRecovery: true,
      enableMetricsAggregation: true
    }
  }

  // Initialize monitoring controller
  const controller = initializeMonitoringController(config)

  // Set up status change callback
  controller.onStatusChange((status) => {
    console.log('System status changed:', status.overall)
    
    if (status.overall === 'unhealthy') {
      console.error('🚨 System is unhealthy! Immediate attention required.')
    } else if (status.overall === 'degraded') {
      console.warn('⚠️ System performance is degraded.')
    }
  })

  // Initialize the controller
  await controller.initialize()

  console.log('✅ Quality Assurance Monitoring System initialized successfully')
}

/**
 * Example: Record generation events
 */
export function recordGenerationEvent(
  qualityScore: number,
  success: boolean,
  responseTime: number,
  correctionAttempts: number,
  fallbackUsed: boolean
): void {
  const controller = getMonitoringController()
  controller.recordGenerationEvent(
    qualityScore,
    success,
    responseTime,
    correctionAttempts,
    fallbackUsed
  )
}

/**
 * Example: Get monitoring dashboard data
 */
export function getMonitoringDashboard() {
  const controller = getMonitoringController()
  return controller.getMonitoringDashboard()
}

/**
 * Example: Test alert channels
 */
export async function testAlertChannels() {
  const controller = getMonitoringController()
  const results = await controller.testAlertChannels()
  
  console.log('Alert channel test results:')
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.channel}: ${result.error || 'OK'}`)
  })
  
  return results
}

/**
 * Example: Get recent alerts
 */
export function getRecentAlerts(hours: number = 24) {
  const controller = getMonitoringController()
  return controller.getRecentAlerts(hours)
}

/**
 * Example: Perform manual health check
 */
export async function performHealthCheck() {
  const controller = getMonitoringController()
  const health = await controller.performManualHealthCheck()
  
  console.log('Health check results:')
  console.log(`Overall status: ${health.overall}`)
  console.log(`Components checked: ${health.components.size}`)
  console.log(`Healthy: ${health.summary.healthyComponents}`)
  console.log(`Degraded: ${health.summary.degradedComponents}`)
  console.log(`Unhealthy: ${health.summary.unhealthyComponents}`)
  
  if (health.summary.criticalIssues.length > 0) {
    console.log('Critical issues:')
    health.summary.criticalIssues.forEach(issue => console.log(`  - ${issue}`))
  }
  
  if (health.summary.recommendations.length > 0) {
    console.log('Recommendations:')
    health.summary.recommendations.forEach(rec => console.log(`  - ${rec}`))
  }
  
  return health
}

/**
 * Example: Shutdown monitoring system
 */
export async function shutdownMonitoringSystem(): Promise<void> {
  const controller = getMonitoringController()
  await controller.shutdown()
  console.log('✅ Quality Assurance Monitoring System shutdown complete')
}

/**
 * Example: Usage in an Express.js API endpoint
 */
export function createMonitoringEndpoints() {
  // This would be used in your Express.js routes
  return {
    // GET /api/monitoring/status
    getStatus: () => {
      const controller = getMonitoringController()
      return controller.getSystemStatus()
    },

    // GET /api/monitoring/dashboard
    getDashboard: () => {
      const controller = getMonitoringController()
      return controller.getMonitoringDashboard()
    },

    // GET /api/monitoring/alerts
    getAlerts: (hours: number = 24) => {
      const controller = getMonitoringController()
      return controller.getRecentAlerts(hours)
    },

    // POST /api/monitoring/health-check
    performHealthCheck: async () => {
      const controller = getMonitoringController()
      return await controller.performManualHealthCheck()
    },

    // POST /api/monitoring/test-channels
    testChannels: async () => {
      const controller = getMonitoringController()
      return await controller.testAlertChannels()
    },

    // GET /api/monitoring/metrics
    getMetrics: () => {
      const controller = getMonitoringController()
      return controller.getMetricsForExport()
    }
  }
}

/**
 * Example: Integration with AI generation pipeline
 */
export class MonitoredGenerationPipeline {
  private controller = getMonitoringController()

  async generateCode(prompt: string): Promise<{
    code: string
    qualityScore: number
    success: boolean
    metrics: any
  }> {
    const startTime = Date.now()
    let correctionAttempts = 0
    let fallbackUsed = false
    let success = false
    let qualityScore = 0
    let code = ''

    try {
      // Simulate AI generation process
      // In real implementation, this would call your AI generation logic
      
      // Record the generation event
      const responseTime = Date.now() - startTime
      success = true
      qualityScore = 85 // Would be calculated by quality scorer
      
      this.controller.recordGenerationEvent(
        qualityScore,
        success,
        responseTime,
        correctionAttempts,
        fallbackUsed
      )

      return {
        code,
        qualityScore,
        success,
        metrics: {
          responseTime,
          correctionAttempts,
          fallbackUsed
        }
      }

    } catch (error) {
      // Record system error
      this.controller.recordSystemError(error as any)
      
      const responseTime = Date.now() - startTime
      this.controller.recordGenerationEvent(
        0, // Failed generation
        false,
        responseTime,
        correctionAttempts,
        fallbackUsed
      )

      throw error
    }
  }
}

// Example usage:
/*
async function main() {
  // Set up monitoring
  await setupMonitoringSystem()
  
  // Test the system
  await testAlertChannels()
  await performHealthCheck()
  
  // Use in generation pipeline
  const pipeline = new MonitoredGenerationPipeline()
  const result = await pipeline.generateCode('Create an NFT contract')
  
  // Get dashboard data
  const dashboard = getMonitoringDashboard()
  console.log('Dashboard:', dashboard)
  
  // Shutdown when done
  await shutdownMonitoringSystem()
}
*/