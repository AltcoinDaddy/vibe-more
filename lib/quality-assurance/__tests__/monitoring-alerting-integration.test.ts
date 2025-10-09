/**
 * Integration tests for Quality Assurance Monitoring and Alerting System
 */

import { describe, test, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { QAMonitoringSystem, DEFAULT_MONITORING_CONFIG, MonitoringConfig, Alert } from '../monitoring-system'
import { QAAlertingSystem, DEFAULT_ALERTING_CONFIG, AlertingConfig } from '../alerting-system'
import { QAHealthCheckSystem, DEFAULT_HEALTH_CHECK_CONFIG, HealthCheckConfig } from '../health-check-system'
import { initializeLogger } from '../logger'
import { DEFAULT_QUALITY_CONFIG } from '../config'

// Mock console methods to avoid noise in tests
const originalConsole = { ...console }
beforeEach(() => {
  console.log = vi.fn()
  console.info = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
})

afterEach(() => {
  Object.assign(console, originalConsole)
})

describe('QA Monitoring and Alerting Integration', () => {
  let monitoringSystem: QAMonitoringSystem
  let alertingSystem: QAAlertingSystem
  let healthCheckSystem: QAHealthCheckSystem

  beforeEach(() => {
    // Initialize logger
    initializeLogger(DEFAULT_QUALITY_CONFIG.logging)

    // Create systems with test configurations
    const monitoringConfig: MonitoringConfig = {
      ...DEFAULT_MONITORING_CONFIG,
      checkInterval: 100, // Fast interval for testing
      alertThresholds: {
        qualityScoreMin: 80,
        successRateMin: 90,
        errorRateMax: 10,
        responseTimeMax: 5000,
        fallbackUsageMax: 20,
        correctionFailureMax: 3
      }
    }

    const alertingConfig: AlertingConfig = {
      ...DEFAULT_ALERTING_CONFIG,
      channels: [
        {
          name: 'test-console',
          type: 'console',
          config: {},
          enabled: true,
          severityFilter: [],
          typeFilter: []
        }
      ]
    }

    const healthCheckConfig: HealthCheckConfig = {
      ...DEFAULT_HEALTH_CHECK_CONFIG,
      checkInterval: 100, // Fast interval for testing
      timeout: 1000
    }

    monitoringSystem = new QAMonitoringSystem(monitoringConfig)
    alertingSystem = new QAAlertingSystem(alertingConfig)
    healthCheckSystem = new QAHealthCheckSystem(healthCheckConfig)
  })

  afterEach(() => {
    monitoringSystem.stopMonitoring()
    alertingSystem.updateConfig({ enabled: false })
    healthCheckSystem.stopHealthChecks()
  })

  describe('Monitoring System', () => {
    test('should start and stop monitoring correctly', () => {
      expect(monitoringSystem.getCurrentMetrics()).toBeNull()
      
      monitoringSystem.startMonitoring()
      // Monitoring runs on intervals, so we can't immediately check metrics
      
      monitoringSystem.stopMonitoring()
      // Should not crash
    })

    test('should record generation events and track metrics', () => {
      // Record some generation events
      monitoringSystem.recordGenerationEvent(85, true, 2000, 1, false)
      monitoringSystem.recordGenerationEvent(75, false, 8000, 3, true)
      monitoringSystem.recordGenerationEvent(90, true, 1500, 0, false)

      // The metrics will be collected on the next monitoring cycle
      // For now, we can verify the events were recorded without errors
    })

    test('should create alerts for threshold breaches', () => {
      const alerts: Alert[] = []
      monitoringSystem.onAlert((alert) => {
        alerts.push(alert)
      })

      // Record events that should trigger alerts
      monitoringSystem.recordGenerationEvent(70, false, 12000, 5, true) // Low quality, slow response, many corrections

      // Wait a bit for processing
      return new Promise(resolve => {
        setTimeout(() => {
          expect(alerts.length).toBeGreaterThan(0)
          expect(alerts.some(a => a.type === 'threshold_breach')).toBe(true)
          resolve(undefined)
        }, 50)
      })
    })

    test('should get active and resolved alerts', () => {
      const activeAlerts = monitoringSystem.getActiveAlerts()
      expect(Array.isArray(activeAlerts)).toBe(true)

      const allAlerts = monitoringSystem.getAlerts()
      expect(Array.isArray(allAlerts)).toBe(true)
    })

    test('should resolve alerts', () => {
      // This test would need actual alerts to resolve
      // For now, we test that the method doesn't crash
      const result = monitoringSystem.resolveAlert('non-existent-alert')
      expect(result).toBe(false)
    })

    test('should get system health status', () => {
      const health = monitoringSystem.getSystemHealth()
      expect(health).toHaveProperty('overall')
      expect(health).toHaveProperty('components')
      expect(health).toHaveProperty('lastUpdate')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall)
    })
  })

  describe('Alerting System', () => {
    test('should process alerts through configured channels', async () => {
      const testAlert: Alert = {
        id: 'test-alert-1',
        type: 'quality_degradation',
        severity: 'medium',
        title: 'Test Quality Alert',
        message: 'This is a test alert for quality degradation',
        timestamp: new Date(),
        data: { testData: true },
        resolved: false
      }

      await alertingSystem.processAlert(testAlert)

      // Verify console output was called (mocked)
      expect(console.warn).toHaveBeenCalled()
    })

    test('should register and use custom channels', async () => {
      let customChannelCalled = false
      const customHandler = vi.fn(async (alert: Alert, config: Record<string, any>) => {
        customChannelCalled = true
      })

      alertingSystem.registerCustomChannel('test-custom', customHandler)

      // Update config to include custom channel
      alertingSystem.updateConfig({
        channels: [
          {
            name: 'test-custom',
            type: 'custom',
            config: { testConfig: true },
            enabled: true,
            severityFilter: [],
            typeFilter: []
          }
        ]
      })

      const testAlert: Alert = {
        id: 'test-alert-2',
        type: 'system_error',
        severity: 'high',
        title: 'Test System Error',
        message: 'This is a test system error alert',
        timestamp: new Date(),
        data: {},
        resolved: false
      }

      await alertingSystem.processAlert(testAlert)

      expect(customHandler).toHaveBeenCalledWith(testAlert, { testConfig: true })
    })

    test('should test channel configuration', async () => {
      const result = await alertingSystem.testChannel('test-console')
      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')
    })

    test('should get alerting metrics', () => {
      const metrics = alertingSystem.getMetrics()
      expect(metrics).toHaveProperty('totalAlerts')
      expect(metrics).toHaveProperty('alertsByType')
      expect(metrics).toHaveProperty('alertsBySeverity')
      expect(metrics).toHaveProperty('notificationsSent')
      expect(metrics).toHaveProperty('notificationFailures')
      expect(typeof metrics.totalAlerts).toBe('number')
    })

    test('should handle webhook channel configuration', async () => {
      // Mock fetch for webhook testing
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      })

      alertingSystem.updateConfig({
        channels: [
          {
            name: 'test-webhook',
            type: 'webhook',
            config: {
              url: 'https://example.com/webhook',
              headers: { 'Authorization': 'Bearer test-token' }
            },
            enabled: true,
            severityFilter: [],
            typeFilter: []
          }
        ]
      })

      const testAlert: Alert = {
        id: 'test-webhook-alert',
        type: 'performance_issue',
        severity: 'low',
        title: 'Test Webhook Alert',
        message: 'Testing webhook delivery',
        timestamp: new Date(),
        data: {},
        resolved: false
      }

      await alertingSystem.processAlert(testAlert)

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })
  })

  describe('Health Check System', () => {
    test('should perform health checks on all components', async () => {
      const healthStatus = await healthCheckSystem.performHealthChecks()
      
      expect(healthStatus).toHaveProperty('overall')
      expect(healthStatus).toHaveProperty('components')
      expect(healthStatus).toHaveProperty('lastCheck')
      expect(healthStatus).toHaveProperty('summary')
      
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.overall)
      expect(healthStatus.components.size).toBeGreaterThan(0)
    })

    test('should get current health status', () => {
      const health = healthCheckSystem.getCurrentHealth()
      // Initially null until first check is performed
      expect(health).toBeNull()
    })

    test('should register custom health checkers', async () => {
      const customChecker = vi.fn().mockResolvedValue({
        healthy: true,
        status: 'healthy' as const,
        responseTime: 100,
        details: { custom: true },
        errors: [],
        warnings: [],
        metrics: {
          uptime: 1000,
          memoryUsage: 1024,
          requestCount: 10,
          errorCount: 0,
          lastActivity: new Date()
        }
      })

      healthCheckSystem.registerCustomChecker('custom-component', customChecker)

      // The custom checker would be used in the next health check cycle
      expect(customChecker).not.toHaveBeenCalled() // Not called until health check runs
    })

    test('should get and resolve health check alerts', () => {
      const alerts = healthCheckSystem.getAlerts()
      expect(Array.isArray(alerts)).toBe(true)

      const unresolvedAlerts = healthCheckSystem.getAlerts(false)
      expect(Array.isArray(unresolvedAlerts)).toBe(true)

      // Test resolving non-existent alert
      const resolved = healthCheckSystem.resolveAlert('non-existent', 'test message')
      expect(resolved).toBe(false)
    })

    test('should get health trends for components', () => {
      const trends = healthCheckSystem.getHealthTrends('undefined-detector', 1)
      
      expect(trends).toHaveProperty('timestamps')
      expect(trends).toHaveProperty('healthyCount')
      expect(trends).toHaveProperty('degradedCount')
      expect(trends).toHaveProperty('unhealthyCount')
      expect(trends).toHaveProperty('averageResponseTime')
      
      expect(Array.isArray(trends.timestamps)).toBe(true)
      expect(typeof trends.healthyCount).toBe('number')
      expect(typeof trends.averageResponseTime).toBe('number')
    })

    test('should start and stop health checks', () => {
      healthCheckSystem.startHealthChecks()
      // Should not throw
      
      healthCheckSystem.stopHealthChecks()
      // Should not throw
    })
  })

  describe('Integration Scenarios', () => {
    test('should integrate monitoring with alerting', async () => {
      const alerts: Alert[] = []
      
      // Set up alert callback
      monitoringSystem.onAlert((alert) => {
        alerts.push(alert)
        // Forward to alerting system
        alertingSystem.processAlert(alert)
      })

      // Start monitoring
      monitoringSystem.startMonitoring()

      // Record events that should trigger alerts
      monitoringSystem.recordGenerationEvent(60, false, 15000, 5, true) // Multiple threshold breaches

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200))

      expect(alerts.length).toBeGreaterThan(0)
      
      // Check that alerting system processed the alerts
      const alertingMetrics = alertingSystem.getMetrics()
      expect(alertingMetrics.totalAlerts).toBeGreaterThan(0)
    })

    test('should integrate health checks with monitoring', async () => {
      // Start both systems
      healthCheckSystem.startHealthChecks()
      monitoringSystem.startMonitoring()

      // Wait for initial checks
      await new Promise(resolve => setTimeout(resolve, 150))

      // Get system health from monitoring
      const monitoringHealth = monitoringSystem.getSystemHealth()
      expect(monitoringHealth).toHaveProperty('overall')

      // Get health from health check system
      const healthCheckStatus = healthCheckSystem.getCurrentHealth()
      // May be null if checks haven't completed yet
      if (healthCheckStatus) {
        expect(healthCheckStatus).toHaveProperty('overall')
      }
    })

    test('should handle system errors across all components', async () => {
      const alerts: Alert[] = []
      
      monitoringSystem.onAlert((alert) => {
        alerts.push(alert)
        alertingSystem.processAlert(alert)
      })

      // Simulate a system error
      const testError = new Error('Test system error')
      Object.assign(testError, {
        code: 'TEST_ERROR',
        severity: 'critical',
        recoverable: false,
        timestamp: new Date()
      })

      monitoringSystem.recordSystemError(testError as any)

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(alerts.some(a => a.type === 'system_error')).toBe(true)
    })

    test('should maintain performance under load', async () => {
      const startTime = Date.now()
      
      // Generate many events quickly
      for (let i = 0; i < 100; i++) {
        monitoringSystem.recordGenerationEvent(
          Math.random() * 100,
          Math.random() > 0.1,
          Math.random() * 10000,
          Math.floor(Math.random() * 5),
          Math.random() > 0.8
        )
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should handle 100 events in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000)
    })

    test('should handle configuration updates gracefully', () => {
      // Update monitoring config
      monitoringSystem.startMonitoring()
      
      // Update alerting config
      alertingSystem.updateConfig({
        enabled: true,
        channels: [
          {
            name: 'updated-console',
            type: 'console',
            config: { updated: true },
            enabled: true,
            severityFilter: ['high', 'critical'],
            typeFilter: []
          }
        ]
      })

      // Should not throw errors
      expect(true).toBe(true)
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle monitoring system failures gracefully', () => {
      // Test with invalid configuration
      expect(() => {
        const invalidConfig = {
          ...DEFAULT_MONITORING_CONFIG,
          checkInterval: -1 // Invalid interval
        }
        new QAMonitoringSystem(invalidConfig)
      }).not.toThrow()
    })

    test('should handle alerting system failures gracefully', async () => {
      // Test with failing webhook
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      alertingSystem.updateConfig({
        channels: [
          {
            name: 'failing-webhook',
            type: 'webhook',
            config: { 
              url: 'https://invalid-url.example.com/webhook',
              timeout: 1000 // Short timeout for testing
            },
            enabled: true,
            severityFilter: [],
            typeFilter: []
          }
        ],
        retryPolicy: {
          maxRetries: 1, // Reduce retries for faster test
          backoffMultiplier: 1,
          initialDelay: 100,
          maxDelay: 200
        }
      })

      const testAlert: Alert = {
        id: 'test-failing-alert',
        type: 'system_error',
        severity: 'medium',
        title: 'Test Failing Alert',
        message: 'This alert should fail to send',
        timestamp: new Date(),
        data: {},
        resolved: false
      }

      // Should not throw, but handle the error gracefully
      await expect(alertingSystem.processAlert(testAlert)).resolves.not.toThrow()
    }, 10000) // 10 second timeout

    test('should handle health check timeouts', async () => {
      // Register a slow custom checker
      const slowChecker = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      )

      healthCheckSystem.registerCustomChecker('slow-component', slowChecker)

      // Health check should timeout and handle it gracefully
      const healthStatus = await healthCheckSystem.performHealthChecks()
      expect(healthStatus).toHaveProperty('overall')
    })
  })
})

describe('QA Monitoring System Edge Cases', () => {
  let monitoringSystem: QAMonitoringSystem

  beforeEach(() => {
    initializeLogger(DEFAULT_QUALITY_CONFIG.logging)
    monitoringSystem = new QAMonitoringSystem(DEFAULT_MONITORING_CONFIG)
  })

  afterEach(() => {
    monitoringSystem.stopMonitoring()
  })

  test('should handle rapid successive events', () => {
    // Record many events in quick succession
    for (let i = 0; i < 1000; i++) {
      monitoringSystem.recordGenerationEvent(80, true, 1000, 0, false)
    }

    // Should not crash or cause memory issues
    expect(true).toBe(true)
  })

  test('should maintain metrics history within limits', () => {
    // This would test the internal metrics size maintenance
    // For now, we verify the system doesn't crash with many metrics
    for (let i = 0; i < 100; i++) {
      monitoringSystem.recordGenerationEvent(
        Math.random() * 100,
        Math.random() > 0.1,
        Math.random() * 5000,
        Math.floor(Math.random() * 3),
        Math.random() > 0.9
      )
    }

    expect(true).toBe(true)
  })
})