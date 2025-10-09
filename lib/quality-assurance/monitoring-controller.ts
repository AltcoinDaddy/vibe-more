/**
 * Quality Assurance Monitoring Controller
 * 
 * Orchestrates the monitoring, alerting, and health check systems to provide
 * comprehensive quality assurance monitoring with centralized management.
 */

import { QAMonitoringSystem, MonitoringConfig, DEFAULT_MONITORING_CONFIG, Alert } from './monitoring-system'
import { QAAlertingSystem, AlertingConfig, DEFAULT_ALERTING_CONFIG } from './alerting-system'
import { QAHealthCheckSystem, HealthCheckConfig, DEFAULT_HEALTH_CHECK_CONFIG } from './health-check-system'
import { QALogger, getLogger } from './logger'
import { QualityAssuranceError } from './types'

export interface MonitoringControllerConfig {
  monitoring: MonitoringConfig
  alerting: AlertingConfig
  healthCheck: HealthCheckConfig
  integration: IntegrationConfig
}

export interface IntegrationConfig {
  enabled: boolean
  forwardHealthAlertsToMonitoring: boolean
  forwardMonitoringAlertsToAlerting: boolean
  enableCrossSystemRecovery: boolean
  enableMetricsAggregation: boolean
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  monitoring: {
    status: 'running' | 'stopped' | 'error'
    metrics: any
    activeAlerts: number
  }
  alerting: {
    status: 'enabled' | 'disabled' | 'error'
    metrics: any
    channelsActive: number
  }
  healthCheck: {
    status: 'running' | 'stopped' | 'error'
    systemHealth: any
    componentsChecked: number
  }
  lastUpdate: Date
}

export interface MonitoringDashboard {
  systemStatus: SystemStatus
  recentAlerts: Alert[]
  qualityTrends: {
    qualityScore: Array<{ timestamp: Date; value: number }>
    successRate: Array<{ timestamp: Date; value: number }>
    responseTime: Array<{ timestamp: Date; value: number }>
  }
  componentHealth: Array<{
    name: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    lastCheck: Date
    responseTime: number
  }>
  recommendations: string[]
}

/**
 * Quality Assurance Monitoring Controller
 */
export class QAMonitoringController {
  private config: MonitoringControllerConfig
  private logger: QALogger
  private monitoringSystem: QAMonitoringSystem
  private alertingSystem: QAAlertingSystem
  private healthCheckSystem: QAHealthCheckSystem
  private isInitialized: boolean = false
  private statusCallbacks: Array<(status: SystemStatus) => void> = []

  constructor(config?: Partial<MonitoringControllerConfig>) {
    this.config = {
      monitoring: DEFAULT_MONITORING_CONFIG,
      alerting: DEFAULT_ALERTING_CONFIG,
      healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
      integration: {
        enabled: true,
        forwardHealthAlertsToMonitoring: true,
        forwardMonitoringAlertsToAlerting: true,
        enableCrossSystemRecovery: true,
        enableMetricsAggregation: true
      },
      ...config
    }

    this.logger = getLogger()
    
    // Initialize subsystems
    this.monitoringSystem = new QAMonitoringSystem(this.config.monitoring)
    this.alertingSystem = new QAAlertingSystem(this.config.alerting)
    this.healthCheckSystem = new QAHealthCheckSystem(this.config.healthCheck)

    if (this.config.integration.enabled) {
      this.setupIntegration()
    }
  }

  /**
   * Initialize the monitoring controller
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      this.logger.info('monitoring-controller', 'Initializing monitoring controller')

      // Start monitoring system
      if (this.config.monitoring.enabled) {
        this.monitoringSystem.startMonitoring()
        this.logger.info('monitoring-controller', 'Monitoring system started')
      }

      // Start health check system
      if (this.config.healthCheck.enabled) {
        this.healthCheckSystem.startHealthChecks()
        this.logger.info('monitoring-controller', 'Health check system started')
      }

      // Alerting system is always ready (no start method)
      this.logger.info('monitoring-controller', 'Alerting system ready')

      this.isInitialized = true
      this.logger.info('monitoring-controller', 'Monitoring controller initialized successfully')

      // Notify status callbacks
      this.notifyStatusCallbacks()

    } catch (error) {
      this.logger.error('monitoring-controller', 'Failed to initialize monitoring controller', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Shutdown the monitoring controller
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      this.logger.info('monitoring-controller', 'Shutting down monitoring controller')

      // Stop monitoring system
      this.monitoringSystem.stopMonitoring()
      this.logger.info('monitoring-controller', 'Monitoring system stopped')

      // Stop health check system
      this.healthCheckSystem.stopHealthChecks()
      this.logger.info('monitoring-controller', 'Health check system stopped')

      this.isInitialized = false
      this.logger.info('monitoring-controller', 'Monitoring controller shutdown complete')

    } catch (error) {
      this.logger.error('monitoring-controller', 'Error during shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus(): SystemStatus {
    const monitoringMetrics = this.monitoringSystem.getCurrentMetrics()
    const monitoringAlerts = this.monitoringSystem.getActiveAlerts()
    const alertingMetrics = this.alertingSystem.getMetrics()
    const healthStatus = this.healthCheckSystem.getCurrentHealth()

    const monitoringStatus = this.config.monitoring.enabled ? 'running' : 'stopped'
    const alertingStatus = this.config.alerting.enabled ? 'enabled' : 'disabled'
    const healthCheckStatus = this.config.healthCheck.enabled ? 'running' : 'stopped'

    // Determine overall system health
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (healthStatus) {
      if (healthStatus.overall === 'unhealthy') {
        overall = 'unhealthy'
      } else if (healthStatus.overall === 'degraded' && overall === 'healthy') {
        overall = 'degraded'
      }
    }

    if (monitoringAlerts.length > 0) {
      const criticalAlerts = monitoringAlerts.filter(a => a.severity === 'critical')
      const highAlerts = monitoringAlerts.filter(a => a.severity === 'high')
      
      if (criticalAlerts.length > 0) {
        overall = 'unhealthy'
      } else if (highAlerts.length > 0 && overall === 'healthy') {
        overall = 'degraded'
      }
    }

    return {
      overall,
      monitoring: {
        status: monitoringStatus,
        metrics: monitoringMetrics,
        activeAlerts: monitoringAlerts.length
      },
      alerting: {
        status: alertingStatus,
        metrics: alertingMetrics,
        channelsActive: this.config.alerting.channels.filter(c => c.enabled).length
      },
      healthCheck: {
        status: healthCheckStatus,
        systemHealth: healthStatus,
        componentsChecked: healthStatus ? healthStatus.components.size : 0
      },
      lastUpdate: new Date()
    }
  }

  /**
   * Get monitoring dashboard data
   */
  getMonitoringDashboard(): MonitoringDashboard {
    const systemStatus = this.getSystemStatus()
    const recentAlerts = this.monitoringSystem.getAlerts(
      new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    )

    // Get quality trends (simplified for now)
    const qualityTrends = {
      qualityScore: this.generateTrendData('qualityScore'),
      successRate: this.generateTrendData('successRate'),
      responseTime: this.generateTrendData('responseTime')
    }

    // Get component health
    const componentHealth: Array<{
      name: string
      status: 'healthy' | 'degraded' | 'unhealthy'
      lastCheck: Date
      responseTime: number
    }> = []

    if (systemStatus.healthCheck.systemHealth) {
      systemStatus.healthCheck.systemHealth.components.forEach((health: any, name: string) => {
        componentHealth.push({
          name,
          status: health.status,
          lastCheck: health.lastCheck || new Date(),
          responseTime: health.responseTime || 0
        })
      })
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(systemStatus, recentAlerts)

    return {
      systemStatus,
      recentAlerts,
      qualityTrends,
      componentHealth,
      recommendations
    }
  }

  /**
   * Record a generation event
   */
  recordGenerationEvent(
    qualityScore: number,
    success: boolean,
    responseTime: number,
    correctionAttempts: number,
    fallbackUsed: boolean
  ): void {
    this.monitoringSystem.recordGenerationEvent(
      qualityScore,
      success,
      responseTime,
      correctionAttempts,
      fallbackUsed
    )
  }

  /**
   * Record a system error
   */
  recordSystemError(error: QualityAssuranceError): void {
    this.monitoringSystem.recordSystemError(error)
  }

  /**
   * Test alert channels
   */
  async testAlertChannels(): Promise<Array<{ channel: string; success: boolean; error?: string }>> {
    const results: Array<{ channel: string; success: boolean; error?: string }> = []

    for (const channel of this.config.alerting.channels) {
      if (channel.enabled) {
        const result = await this.alertingSystem.testChannel(channel.name)
        results.push({
          channel: channel.name,
          success: result.success,
          error: result.error
        })
      }
    }

    return results
  }

  /**
   * Update configuration
   */
  updateConfiguration(updates: Partial<MonitoringControllerConfig>): void {
    this.config = { ...this.config, ...updates }

    // Update subsystem configurations
    if (updates.monitoring) {
      // Monitoring system doesn't have an update method, would need restart
      this.logger.info('monitoring-controller', 'Monitoring configuration updated - restart required')
    }

    if (updates.alerting) {
      this.alertingSystem.updateConfig(updates.alerting)
      this.logger.info('monitoring-controller', 'Alerting configuration updated')
    }

    if (updates.healthCheck) {
      // Health check system doesn't have an update method, would need restart
      this.logger.info('monitoring-controller', 'Health check configuration updated - restart required')
    }

    this.logger.info('monitoring-controller', 'Configuration updated', { updates })
  }

  /**
   * Register a status change callback
   */
  onStatusChange(callback: (status: SystemStatus) => void): void {
    this.statusCallbacks.push(callback)
  }

  /**
   * Get system metrics for external monitoring
   */
  getMetricsForExport(): {
    monitoring: any
    alerting: any
    healthCheck: any
    timestamp: Date
  } {
    return {
      monitoring: this.monitoringSystem.getCurrentMetrics(),
      alerting: this.alertingSystem.getMetrics(),
      healthCheck: this.healthCheckSystem.getCurrentHealth(),
      timestamp: new Date()
    }
  }

  /**
   * Perform manual health check
   */
  async performManualHealthCheck(): Promise<any> {
    return await this.healthCheckSystem.performHealthChecks()
  }

  /**
   * Get recent alerts with filtering
   */
  getRecentAlerts(
    hours: number = 24,
    severity?: string,
    type?: string
  ): Alert[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    let alerts = this.monitoringSystem.getAlerts(cutoffTime)

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity)
    }

    if (type) {
      alerts = alerts.filter(a => a.type === type)
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private setupIntegration(): void {
    // Forward monitoring alerts to alerting system
    if (this.config.integration.forwardMonitoringAlertsToAlerting) {
      this.monitoringSystem.onAlert(async (alert) => {
        await this.alertingSystem.processAlert(alert)
      })
    }

    // Set up cross-system recovery if enabled
    if (this.config.integration.enableCrossSystemRecovery) {
      this.setupCrossSystemRecovery()
    }

    this.logger.info('monitoring-controller', 'System integration configured')
  }

  private setupCrossSystemRecovery(): void {
    // Monitor for system failures and attempt recovery
    this.monitoringSystem.onAlert(async (alert) => {
      if (alert.type === 'system_error' && alert.severity === 'critical') {
        this.logger.warn('monitoring-controller', 'Critical system error detected, attempting recovery', {
          alertId: alert.id,
          message: alert.message
        })

        // Attempt recovery actions
        await this.attemptSystemRecovery(alert)
      }
    })
  }

  private async attemptSystemRecovery(alert: Alert): Promise<void> {
    try {
      // Basic recovery actions
      if (alert.message.includes('health check')) {
        // Restart health checks
        this.healthCheckSystem.stopHealthChecks()
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.healthCheckSystem.startHealthChecks()
        
        this.logger.info('monitoring-controller', 'Health check system restarted for recovery')
      }

      // Add more recovery strategies as needed

    } catch (error) {
      this.logger.error('monitoring-controller', 'System recovery failed', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private generateTrendData(metric: string): Array<{ timestamp: Date; value: number }> {
    // This would normally pull from historical data
    // For now, generate sample trend data
    const data: Array<{ timestamp: Date; value: number }> = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      let value: number
      
      switch (metric) {
        case 'qualityScore':
          value = 80 + Math.random() * 20 // 80-100
          break
        case 'successRate':
          value = 85 + Math.random() * 15 // 85-100
          break
        case 'responseTime':
          value = 1000 + Math.random() * 2000 // 1000-3000ms
          break
        default:
          value = Math.random() * 100
      }
      
      data.push({ timestamp, value })
    }
    
    return data
  }

  private generateRecommendations(status: SystemStatus, recentAlerts: Alert[]): string[] {
    const recommendations: string[] = []

    // Check overall system health
    if (status.overall === 'unhealthy') {
      recommendations.push('System is unhealthy - immediate attention required')
    } else if (status.overall === 'degraded') {
      recommendations.push('System performance is degraded - monitor closely')
    }

    // Check alert patterns
    const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical')
    if (criticalAlerts.length > 0) {
      recommendations.push(`${criticalAlerts.length} critical alerts in the last 24 hours - investigate immediately`)
    }

    const qualityAlerts = recentAlerts.filter(a => a.type === 'quality_degradation')
    if (qualityAlerts.length > 3) {
      recommendations.push('Frequent quality degradation alerts - review AI model performance')
    }

    const performanceAlerts = recentAlerts.filter(a => a.type === 'performance_issue')
    if (performanceAlerts.length > 5) {
      recommendations.push('Multiple performance issues detected - consider system optimization')
    }

    // Check component health
    if (status.healthCheck.systemHealth) {
      const unhealthyComponents = Array.from(status.healthCheck.systemHealth.components.values())
        .filter((health: any) => health.status === 'unhealthy')
      
      if (unhealthyComponents.length > 0) {
        recommendations.push(`${unhealthyComponents.length} components are unhealthy - check system dependencies`)
      }
    }

    // Check alerting system
    if (status.alerting.channelsActive === 0) {
      recommendations.push('No alert channels are active - configure notification channels')
    }

    // Default recommendation if system is healthy
    if (recommendations.length === 0) {
      recommendations.push('System is operating normally - continue monitoring')
    }

    return recommendations
  }

  private notifyStatusCallbacks(): void {
    const status = this.getSystemStatus()
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        this.logger.error('monitoring-controller', 'Status callback failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })
  }
}

/**
 * Default monitoring controller configuration
 */
export const DEFAULT_MONITORING_CONTROLLER_CONFIG: MonitoringControllerConfig = {
  monitoring: DEFAULT_MONITORING_CONFIG,
  alerting: DEFAULT_ALERTING_CONFIG,
  healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
  integration: {
    enabled: true,
    forwardHealthAlertsToMonitoring: true,
    forwardMonitoringAlertsToAlerting: true,
    enableCrossSystemRecovery: true,
    enableMetricsAggregation: true
  }
}

// Global monitoring controller instance
export let qaMonitoringController: QAMonitoringController

/**
 * Initialize the global monitoring controller
 */
export function initializeMonitoringController(config?: Partial<MonitoringControllerConfig>): QAMonitoringController {
  qaMonitoringController = new QAMonitoringController(config)
  return qaMonitoringController
}

/**
 * Get the global monitoring controller instance
 */
export function getMonitoringController(): QAMonitoringController {
  if (!qaMonitoringController) {
    throw new Error('Monitoring controller not initialized. Call initializeMonitoringController() first.')
  }
  return qaMonitoringController
}