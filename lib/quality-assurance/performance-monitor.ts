/**
 * Performance Monitor
 * 
 * Real-time performance monitoring and alerting system for quality assurance pipeline.
 * Tracks validation times, cache performance, and system health.
 */

import { QALogger, getLogger } from './logger'

export interface PerformanceAlert {
  id: string
  type: 'performance' | 'memory' | 'cache' | 'error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  metrics: Record<string, number>
  threshold: number
  actualValue: number
}

export interface PerformanceThresholds {
  maxValidationTime: number
  minCacheHitRate: number
  maxMemoryUsage: number
  maxErrorRate: number
  maxConcurrentValidations: number
}

export interface SystemHealthMetrics {
  averageValidationTime: number
  cacheHitRate: number
  memoryUsage: number
  errorRate: number
  concurrentValidations: number
  totalValidations: number
  uptime: number
}

export interface PerformanceTrend {
  timestamp: number
  validationTime: number
  cacheHitRate: number
  memoryUsage: number
  errorCount: number
}

export class PerformanceMonitor {
  private logger: QALogger
  private thresholds: PerformanceThresholds
  private alerts: PerformanceAlert[] = []
  private trends: PerformanceTrend[] = []
  private startTime: number
  private validationTimes: number[] = []
  private cacheStats: { hits: number; misses: number } = { hits: 0, misses: 0 }
  private errorCount: number = 0
  private totalValidations: number = 0
  private concurrentValidations: number = 0
  private maxTrendHistory: number = 1000

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.logger = getLogger()
    this.startTime = Date.now()
    
    this.thresholds = {
      maxValidationTime: 100, // 100ms
      minCacheHitRate: 0.7, // 70%
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxErrorRate: 0.05, // 5%
      maxConcurrentValidations: 10,
      ...thresholds
    }

    // Start monitoring interval
    this.startMonitoring()
  }

  /**
   * Record a validation performance metric
   */
  recordValidation(duration: number, cacheHit: boolean, error?: Error): void {
    this.totalValidations++
    this.validationTimes.push(duration)
    
    // Keep only recent validation times (last 100)
    if (this.validationTimes.length > 100) {
      this.validationTimes.shift()
    }

    // Update cache stats
    if (cacheHit) {
      this.cacheStats.hits++
    } else {
      this.cacheStats.misses++
    }

    // Record error if present
    if (error) {
      this.errorCount++
      this.checkErrorRateThreshold()
    }

    // Check performance thresholds
    this.checkPerformanceThresholds(duration)
  }

  /**
   * Record concurrent validation start
   */
  recordValidationStart(): void {
    this.concurrentValidations++
    this.checkConcurrencyThreshold()
  }

  /**
   * Record concurrent validation end
   */
  recordValidationEnd(): void {
    this.concurrentValidations = Math.max(0, this.concurrentValidations - 1)
  }

  /**
   * Get current system health metrics
   */
  getSystemHealth(): SystemHealthMetrics {
    const averageValidationTime = this.validationTimes.length > 0 
      ? this.validationTimes.reduce((sum, time) => sum + time, 0) / this.validationTimes.length
      : 0

    const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses
    const cacheHitRate = totalCacheRequests > 0 
      ? this.cacheStats.hits / totalCacheRequests 
      : 0

    const errorRate = this.totalValidations > 0 
      ? this.errorCount / this.totalValidations 
      : 0

    const memoryUsage = this.getMemoryUsage()
    const uptime = Date.now() - this.startTime

    return {
      averageValidationTime,
      cacheHitRate,
      memoryUsage,
      errorRate,
      concurrentValidations: this.concurrentValidations,
      totalValidations: this.totalValidations,
      uptime
    }
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(limit: number = 100): PerformanceTrend[] {
    return this.trends.slice(-limit)
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    // Return alerts from the last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    return this.alerts.filter(alert => alert.timestamp > oneHourAgo)
  }

  /**
   * Get performance summary report
   */
  getPerformanceReport(): {
    health: SystemHealthMetrics
    trends: PerformanceTrend[]
    alerts: PerformanceAlert[]
    recommendations: string[]
  } {
    const health = this.getSystemHealth()
    const trends = this.getPerformanceTrends(50)
    const alerts = this.getActiveAlerts()
    const recommendations = this.generateRecommendations(health, trends, alerts)

    return {
      health,
      trends,
      alerts,
      recommendations
    }
  }

  /**
   * Clear all monitoring data
   */
  reset(): void {
    this.alerts = []
    this.trends = []
    this.validationTimes = []
    this.cacheStats = { hits: 0, misses: 0 }
    this.errorCount = 0
    this.totalValidations = 0
    this.concurrentValidations = 0
    this.startTime = Date.now()
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
    this.logger.info('Performance thresholds updated', newThresholds)
  }

  // Private methods

  private startMonitoring(): void {
    // Record performance trends every 30 seconds
    setInterval(() => {
      this.recordPerformanceTrend()
    }, 30000)

    // Clean up old data every 5 minutes
    setInterval(() => {
      this.cleanupOldData()
    }, 5 * 60 * 1000)
  }

  private recordPerformanceTrend(): void {
    const health = this.getSystemHealth()
    
    const trend: PerformanceTrend = {
      timestamp: Date.now(),
      validationTime: health.averageValidationTime,
      cacheHitRate: health.cacheHitRate,
      memoryUsage: health.memoryUsage,
      errorCount: this.errorCount
    }

    this.trends.push(trend)

    // Keep only recent trends
    if (this.trends.length > this.maxTrendHistory) {
      this.trends.shift()
    }
  }

  private checkPerformanceThresholds(validationTime: number): void {
    // Check validation time threshold
    if (validationTime > this.thresholds.maxValidationTime) {
      this.createAlert({
        type: 'performance',
        severity: validationTime > this.thresholds.maxValidationTime * 2 ? 'critical' : 'high',
        message: `Validation time exceeded threshold: ${validationTime.toFixed(2)}ms`,
        threshold: this.thresholds.maxValidationTime,
        actualValue: validationTime,
        metrics: { validationTime }
      })
    }

    // Check cache hit rate
    const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses
    if (totalCacheRequests > 10) { // Only check after some cache activity
      const cacheHitRate = this.cacheStats.hits / totalCacheRequests
      if (cacheHitRate < this.thresholds.minCacheHitRate) {
        this.createAlert({
          type: 'cache',
          severity: cacheHitRate < this.thresholds.minCacheHitRate * 0.5 ? 'high' : 'medium',
          message: `Cache hit rate below threshold: ${(cacheHitRate * 100).toFixed(1)}%`,
          threshold: this.thresholds.minCacheHitRate,
          actualValue: cacheHitRate,
          metrics: { cacheHitRate, cacheHits: this.cacheStats.hits, cacheMisses: this.cacheStats.misses }
        })
      }
    }

    // Check memory usage
    const memoryUsage = this.getMemoryUsage()
    if (memoryUsage > this.thresholds.maxMemoryUsage) {
      this.createAlert({
        type: 'memory',
        severity: memoryUsage > this.thresholds.maxMemoryUsage * 1.5 ? 'critical' : 'high',
        message: `Memory usage exceeded threshold: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        threshold: this.thresholds.maxMemoryUsage,
        actualValue: memoryUsage,
        metrics: { memoryUsage }
      })
    }
  }

  private checkErrorRateThreshold(): void {
    if (this.totalValidations > 10) { // Only check after some validations
      const errorRate = this.errorCount / this.totalValidations
      if (errorRate > this.thresholds.maxErrorRate) {
        this.createAlert({
          type: 'error',
          severity: errorRate > this.thresholds.maxErrorRate * 2 ? 'critical' : 'high',
          message: `Error rate exceeded threshold: ${(errorRate * 100).toFixed(1)}%`,
          threshold: this.thresholds.maxErrorRate,
          actualValue: errorRate,
          metrics: { errorRate, errorCount: this.errorCount, totalValidations: this.totalValidations }
        })
      }
    }
  }

  private checkConcurrencyThreshold(): void {
    if (this.concurrentValidations > this.thresholds.maxConcurrentValidations) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `High concurrent validations: ${this.concurrentValidations}`,
        threshold: this.thresholds.maxConcurrentValidations,
        actualValue: this.concurrentValidations,
        metrics: { concurrentValidations: this.concurrentValidations }
      })
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...alertData
    }

    this.alerts.push(alert)
    
    // Log the alert
    const logLevel = alert.severity === 'critical' ? 'error' : 
                    alert.severity === 'high' ? 'warn' : 'info'
    
    this.logger[logLevel](`Performance Alert: ${alert.message}`, {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      metrics: alert.metrics
    })

    // Keep only recent alerts (last 1000)
    if (this.alerts.length > 1000) {
      this.alerts.shift()
    }
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  private cleanupOldData(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    
    // Clean up old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo)
    
    // Clean up old trends (keep last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    this.trends = this.trends.filter(trend => trend.timestamp > oneDayAgo)
  }

  private generateRecommendations(
    health: SystemHealthMetrics,
    trends: PerformanceTrend[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = []

    // Performance recommendations
    if (health.averageValidationTime > this.thresholds.maxValidationTime) {
      recommendations.push('Consider enabling caching or parallel processing to improve validation times')
    }

    // Cache recommendations
    if (health.cacheHitRate < this.thresholds.minCacheHitRate) {
      recommendations.push('Increase cache size or adjust cache expiration to improve hit rate')
    }

    // Memory recommendations
    if (health.memoryUsage > this.thresholds.maxMemoryUsage * 0.8) {
      recommendations.push('Monitor memory usage closely - consider clearing caches or reducing batch sizes')
    }

    // Error rate recommendations
    if (health.errorRate > this.thresholds.maxErrorRate * 0.5) {
      recommendations.push('Investigate validation errors and improve error handling')
    }

    // Trend-based recommendations
    if (trends.length > 10) {
      const recentTrends = trends.slice(-10)
      const avgRecentTime = recentTrends.reduce((sum, t) => sum + t.validationTime, 0) / recentTrends.length
      const avgOlderTime = trends.slice(-20, -10).reduce((sum, t) => sum + t.validationTime, 0) / 10

      if (avgRecentTime > avgOlderTime * 1.2) {
        recommendations.push('Performance is degrading over time - consider system optimization')
      }
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter(a => a.severity === 'critical')
    if (criticalAlerts.length > 0) {
      recommendations.push('Address critical performance alerts immediately')
    }

    return recommendations
  }
}

/**
 * Global performance monitor instance
 */
let globalPerformanceMonitor: PerformanceMonitor | null = null

export function getPerformanceMonitor(thresholds?: Partial<PerformanceThresholds>): PerformanceMonitor {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor(thresholds)
  }
  return globalPerformanceMonitor
}

/**
 * Performance monitoring decorator for methods
 */
export function monitorPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value
  const monitor = getPerformanceMonitor()

  descriptor.value = async function (...args: any[]) {
    const startTime = performance.now()
    monitor.recordValidationStart()
    
    try {
      const result = await method.apply(this, args)
      const duration = performance.now() - startTime
      monitor.recordValidation(duration, false) // Assume cache miss for decorated methods
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      monitor.recordValidation(duration, false, error as Error)
      throw error
    } finally {
      monitor.recordValidationEnd()
    }
  }

  return descriptor
}

/**
 * Performance metrics collector for React components or other UI
 */
export class PerformanceMetricsCollector {
  private monitor: PerformanceMonitor

  constructor() {
    this.monitor = getPerformanceMonitor()
  }

  /**
   * Get real-time performance data for dashboards
   */
  getRealtimeMetrics(): {
    health: SystemHealthMetrics
    recentTrends: PerformanceTrend[]
    activeAlerts: PerformanceAlert[]
  } {
    return {
      health: this.monitor.getSystemHealth(),
      recentTrends: this.monitor.getPerformanceTrends(20),
      activeAlerts: this.monitor.getActiveAlerts()
    }
  }

  /**
   * Subscribe to performance updates (for real-time dashboards)
   */
  subscribe(callback: (metrics: any) => void): () => void {
    const interval = setInterval(() => {
      callback(this.getRealtimeMetrics())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }
}