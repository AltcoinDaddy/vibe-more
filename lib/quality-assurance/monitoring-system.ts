/**
 * Quality Assurance Monitoring System
 * 
 * Implements comprehensive monitoring for generation success rates, quality scores,
 * and system health with real-time alerting capabilities.
 */

import { QualityMetrics, QualityTrends, IssuePattern, QualityAssuranceError } from './types'
import { QALogger, getLogger } from './logger'

export interface MonitoringConfig {
  enabled: boolean
  checkInterval: number // milliseconds
  alertThresholds: AlertThresholds
  retentionPeriod: number // days
  enableRealTimeAlerts: boolean
  enableTrendAnalysis: boolean
}

export interface AlertThresholds {
  qualityScoreMin: number
  successRateMin: number
  errorRateMax: number
  responseTimeMax: number
  fallbackUsageMax: number
  correctionFailureMax: number
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  timestamp: Date
  data: Record<string, any>
  resolved: boolean
  resolvedAt?: Date
}

export type AlertType = 
  | 'quality_degradation'
  | 'high_failure_rate'
  | 'performance_issue'
  | 'system_error'
  | 'threshold_breach'
  | 'trend_anomaly'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface HealthCheck {
  component: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: Date
  responseTime: number
  details: Record<string, any>
  errors: string[]
}

export interface MonitoringMetrics {
  timestamp: Date
  qualityScore: {
    current: number
    average24h: number
    trend: 'improving' | 'stable' | 'degrading'
  }
  successRate: {
    current: number
    average24h: number
    trend: 'improving' | 'stable' | 'degrading'
  }
  errorRate: {
    current: number
    average24h: number
    trend: 'improving' | 'stable' | 'degrading'
  }
  responseTime: {
    current: number
    average24h: number
    p95: number
    trend: 'improving' | 'stable' | 'degrading'
  }
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    components: HealthCheck[]
  }
}

/**
 * Quality Assurance Monitoring System
 */
export class QAMonitoringSystem {
  private config: MonitoringConfig
  private logger: QALogger
  private alerts: Alert[] = []
  private metrics: MonitoringMetrics[] = []
  private healthChecks: Map<string, HealthCheck> = new Map()
  private monitoringInterval?: NodeJS.Timeout
  private alertCallbacks: Array<(alert: Alert) => void> = []

  constructor(config: MonitoringConfig) {
    this.config = config
    this.logger = getLogger()
    
    if (config.enabled) {
      this.startMonitoring()
    }
  }

  /**
   * Start the monitoring system
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks()
      this.collectMetrics()
      this.analyzeMetrics()
    }, this.config.checkInterval)

    this.logger.info('monitoring', 'Monitoring system started', {
      checkInterval: this.config.checkInterval,
      alertThresholds: this.config.alertThresholds
    })
  }

  /**
   * Stop the monitoring system
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    this.logger.info('monitoring', 'Monitoring system stopped')
  }

  /**
   * Register an alert callback
   */
  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * Get current monitoring metrics
   */
  getCurrentMetrics(): MonitoringMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  /**
   * Get all alerts within a time range
   */
  getAlerts(startDate?: Date, endDate?: Date): Alert[] {
    return this.alerts.filter(alert => {
      if (startDate && alert.timestamp < startDate) return false
      if (endDate && alert.timestamp > endDate) return false
      return true
    })
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      
      this.logger.info('monitoring', 'Alert resolved', {
        alertId,
        type: alert.type,
        severity: alert.severity
      })
      
      return true
    }
    return false
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    components: HealthCheck[]
    lastUpdate: Date
  } {
    const components = Array.from(this.healthChecks.values())
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length
    const degradedCount = components.filter(c => c.status === 'degraded').length
    
    let overall: 'healthy' | 'degraded' | 'unhealthy'
    if (unhealthyCount > 0) {
      overall = 'unhealthy'
    } else if (degradedCount > 0) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    return {
      overall,
      components,
      lastUpdate: new Date()
    }
  }

  /**
   * Record a quality generation event
   */
  recordGenerationEvent(
    qualityScore: number,
    success: boolean,
    responseTime: number,
    correctionAttempts: number,
    fallbackUsed: boolean
  ): void {
    // This will be used by the metrics collection system
    this.logger.recordQualityMetrics(
      this.generateId(),
      qualityScore,
      [],
      correctionAttempts,
      fallbackUsed,
      'unknown',
      'unknown'
    )

    // Check for immediate threshold breaches
    this.checkImmediateThresholds({
      qualityScore,
      success,
      responseTime,
      correctionAttempts,
      fallbackUsed
    })
  }

  /**
   * Record a system error
   */
  recordSystemError(error: QualityAssuranceError): void {
    this.logger.logError(error)

    // Create alert for critical errors
    if (error.severity === 'critical') {
      this.createAlert({
        type: 'system_error',
        severity: 'critical',
        title: 'Critical System Error',
        message: `Critical error in quality assurance system: ${error.message}`,
        data: {
          errorCode: error.code,
          context: error.context,
          recoverable: error.recoverable
        }
      })
    }
  }

  private performHealthChecks(): void {
    const components = [
      'undefined-detector',
      'auto-corrector',
      'validator',
      'fallback-generator',
      'quality-scorer'
    ]

    components.forEach(component => {
      const startTime = Date.now()
      
      try {
        const healthCheck = this.checkComponentHealth(component)
        const responseTime = Date.now() - startTime
        
        const check: HealthCheck = {
          component,
          status: healthCheck.healthy ? 'healthy' : 'degraded',
          lastCheck: new Date(),
          responseTime,
          details: healthCheck.details,
          errors: healthCheck.errors
        }

        this.healthChecks.set(component, check)

        // Alert on unhealthy components
        if (!healthCheck.healthy) {
          this.createAlert({
            type: 'system_error',
            severity: healthCheck.errors.length > 0 ? 'high' : 'medium',
            title: `Component Health Issue: ${component}`,
            message: `Component ${component} is reporting health issues`,
            data: {
              component,
              errors: healthCheck.errors,
              details: healthCheck.details
            }
          })
        }

      } catch (error) {
        const responseTime = Date.now() - startTime
        
        const check: HealthCheck = {
          component,
          status: 'unhealthy',
          lastCheck: new Date(),
          responseTime,
          details: {},
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }

        this.healthChecks.set(component, check)

        this.createAlert({
          type: 'system_error',
          severity: 'critical',
          title: `Component Failure: ${component}`,
          message: `Component ${component} failed health check`,
          data: {
            component,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    })
  }

  private checkComponentHealth(component: string): {
    healthy: boolean
    details: Record<string, any>
    errors: string[]
  } {
    // Simulate health checks for different components
    // In a real implementation, these would check actual component status
    
    const errors: string[] = []
    const details: Record<string, any> = {
      lastActivity: new Date(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    }

    // Simulate some basic health checks
    const memoryUsage = process.memoryUsage()
    if (memoryUsage.heapUsed > memoryUsage.heapTotal * 0.9) {
      errors.push('High memory usage detected')
    }

    return {
      healthy: errors.length === 0,
      details,
      errors
    }
  }

  private collectMetrics(): void {
    const qualityStats = this.logger.getQualityStatistics()
    const performanceStats = this.logger.getPerformanceStatistics()
    
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    // Calculate current metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp > last24h)
    
    const currentQualityScore = qualityStats.averageQualityScore
    const average24hQuality = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.qualityScore.current, 0) / recentMetrics.length
      : currentQualityScore

    const totalGenerations = qualityStats.totalGenerations
    const successfulGenerations = qualityStats.generationSuccess.firstAttempt + 
                                 qualityStats.generationSuccess.afterCorrection
    const currentSuccessRate = totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 100

    const currentErrorRate = totalGenerations > 0 
      ? ((totalGenerations - successfulGenerations) / totalGenerations) * 100 
      : 0

    const avgResponseTime = performanceStats.averageDuration.generation || 0
    const average24hResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime.current, 0) / recentMetrics.length
      : avgResponseTime

    const metrics: MonitoringMetrics = {
      timestamp: now,
      qualityScore: {
        current: currentQualityScore,
        average24h: average24hQuality,
        trend: this.calculateTrend(recentMetrics.map(m => m.qualityScore.current), currentQualityScore)
      },
      successRate: {
        current: currentSuccessRate,
        average24h: currentSuccessRate, // Simplified for now
        trend: 'stable'
      },
      errorRate: {
        current: currentErrorRate,
        average24h: currentErrorRate, // Simplified for now
        trend: 'stable'
      },
      responseTime: {
        current: avgResponseTime,
        average24h: average24hResponseTime,
        p95: avgResponseTime * 1.5, // Simplified calculation
        trend: this.calculateTrend(recentMetrics.map(m => m.responseTime.current), avgResponseTime)
      },
      systemHealth: this.getSystemHealth()
    }

    this.metrics.push(metrics)
    this.maintainMetricsSize()

    this.logger.debug('monitoring', 'Metrics collected', {
      qualityScore: metrics.qualityScore.current,
      successRate: metrics.successRate.current,
      errorRate: metrics.errorRate.current,
      responseTime: metrics.responseTime.current
    })
  }

  private analyzeMetrics(): void {
    const currentMetrics = this.getCurrentMetrics()
    if (!currentMetrics) return

    // Check quality score threshold
    if (currentMetrics.qualityScore.current < this.config.alertThresholds.qualityScoreMin) {
      this.createAlert({
        type: 'quality_degradation',
        severity: 'high',
        title: 'Quality Score Below Threshold',
        message: `Current quality score (${currentMetrics.qualityScore.current.toFixed(1)}) is below minimum threshold (${this.config.alertThresholds.qualityScoreMin})`,
        data: {
          currentScore: currentMetrics.qualityScore.current,
          threshold: this.config.alertThresholds.qualityScoreMin,
          trend: currentMetrics.qualityScore.trend
        }
      })
    }

    // Check success rate threshold
    if (currentMetrics.successRate.current < this.config.alertThresholds.successRateMin) {
      this.createAlert({
        type: 'high_failure_rate',
        severity: 'high',
        title: 'Success Rate Below Threshold',
        message: `Current success rate (${currentMetrics.successRate.current.toFixed(1)}%) is below minimum threshold (${this.config.alertThresholds.successRateMin}%)`,
        data: {
          currentRate: currentMetrics.successRate.current,
          threshold: this.config.alertThresholds.successRateMin,
          trend: currentMetrics.successRate.trend
        }
      })
    }

    // Check error rate threshold
    if (currentMetrics.errorRate.current > this.config.alertThresholds.errorRateMax) {
      this.createAlert({
        type: 'high_failure_rate',
        severity: 'medium',
        title: 'Error Rate Above Threshold',
        message: `Current error rate (${currentMetrics.errorRate.current.toFixed(1)}%) is above maximum threshold (${this.config.alertThresholds.errorRateMax}%)`,
        data: {
          currentRate: currentMetrics.errorRate.current,
          threshold: this.config.alertThresholds.errorRateMax,
          trend: currentMetrics.errorRate.trend
        }
      })
    }

    // Check response time threshold
    if (currentMetrics.responseTime.current > this.config.alertThresholds.responseTimeMax) {
      this.createAlert({
        type: 'performance_issue',
        severity: 'medium',
        title: 'Response Time Above Threshold',
        message: `Current response time (${currentMetrics.responseTime.current.toFixed(0)}ms) is above maximum threshold (${this.config.alertThresholds.responseTimeMax}ms)`,
        data: {
          currentTime: currentMetrics.responseTime.current,
          threshold: this.config.alertThresholds.responseTimeMax,
          trend: currentMetrics.responseTime.trend
        }
      })
    }

    // Check for trend anomalies
    if (this.config.enableTrendAnalysis) {
      this.analyzeTrends(currentMetrics)
    }
  }

  private analyzeTrends(metrics: MonitoringMetrics): void {
    // Alert on degrading trends
    if (metrics.qualityScore.trend === 'degrading') {
      this.createAlert({
        type: 'trend_anomaly',
        severity: 'medium',
        title: 'Quality Score Degrading Trend',
        message: 'Quality scores are showing a degrading trend over time',
        data: {
          currentScore: metrics.qualityScore.current,
          average24h: metrics.qualityScore.average24h,
          trend: metrics.qualityScore.trend
        }
      })
    }

    if (metrics.responseTime.trend === 'degrading') {
      this.createAlert({
        type: 'trend_anomaly',
        severity: 'low',
        title: 'Response Time Degrading Trend',
        message: 'Response times are showing a degrading trend over time',
        data: {
          currentTime: metrics.responseTime.current,
          average24h: metrics.responseTime.average24h,
          trend: metrics.responseTime.trend
        }
      })
    }
  }

  private checkImmediateThresholds(event: {
    qualityScore: number
    success: boolean
    responseTime: number
    correctionAttempts: number
    fallbackUsed: boolean
  }): void {
    // Check for immediate quality issues
    if (event.qualityScore < this.config.alertThresholds.qualityScoreMin) {
      this.createAlert({
        type: 'threshold_breach',
        severity: 'medium',
        title: 'Low Quality Generation',
        message: `Generation produced quality score of ${event.qualityScore.toFixed(1)}, below threshold`,
        data: event
      })
    }

    // Check for excessive response time
    if (event.responseTime > this.config.alertThresholds.responseTimeMax) {
      this.createAlert({
        type: 'performance_issue',
        severity: 'low',
        title: 'Slow Generation Response',
        message: `Generation took ${event.responseTime.toFixed(0)}ms, above threshold`,
        data: event
      })
    }

    // Check for excessive correction attempts
    if (event.correctionAttempts > this.config.alertThresholds.correctionFailureMax) {
      this.createAlert({
        type: 'quality_degradation',
        severity: 'medium',
        title: 'Excessive Correction Attempts',
        message: `Generation required ${event.correctionAttempts} correction attempts`,
        data: event
      })
    }
  }

  private createAlert(alertData: {
    type: AlertType
    severity: AlertSeverity
    title: string
    message: string
    data: Record<string, any>
  }): void {
    // Check for duplicate alerts (same type and similar data within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentSimilarAlert = this.alerts.find(alert => 
      alert.type === alertData.type &&
      alert.timestamp > fiveMinutesAgo &&
      !alert.resolved
    )

    if (recentSimilarAlert) {
      // Update existing alert instead of creating duplicate
      recentSimilarAlert.timestamp = new Date()
      recentSimilarAlert.data = { ...recentSimilarAlert.data, ...alertData.data }
      return
    }

    const alert: Alert = {
      id: this.generateId(),
      type: alertData.type,
      severity: alertData.severity,
      title: alertData.title,
      message: alertData.message,
      timestamp: new Date(),
      data: alertData.data,
      resolved: false
    }

    this.alerts.push(alert)
    this.maintainAlertsSize()

    this.logger.warn('monitoring', 'Alert created', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title
    })

    // Notify alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        this.logger.error('monitoring', 'Alert callback failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })
  }

  private calculateTrend(values: number[], current: number): 'improving' | 'stable' | 'degrading' {
    if (values.length < 2) return 'stable'
    
    const recent = values.slice(-5) // Last 5 values
    const older = values.slice(-10, -5) // Previous 5 values
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100
    
    if (change > 5) return 'improving'
    if (change < -5) return 'degrading'
    return 'stable'
  }

  private maintainMetricsSize(): void {
    const maxMetrics = 10000
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-Math.floor(maxMetrics * 0.8))
    }
  }

  private maintainAlertsSize(): void {
    const maxAlerts = 1000
    if (this.alerts.length > maxAlerts) {
      // Keep resolved alerts for a shorter time
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      this.alerts = this.alerts.filter(alert => 
        !alert.resolved || alert.timestamp > oneWeekAgo
      )
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Default monitoring configuration
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  checkInterval: 60000, // 1 minute
  alertThresholds: {
    qualityScoreMin: 75,
    successRateMin: 85,
    errorRateMax: 15,
    responseTimeMax: 10000, // 10 seconds
    fallbackUsageMax: 20, // 20% fallback usage
    correctionFailureMax: 3
  },
  retentionPeriod: 30, // 30 days
  enableRealTimeAlerts: true,
  enableTrendAnalysis: true
}