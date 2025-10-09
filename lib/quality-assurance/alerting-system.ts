/**
 * Quality Assurance Alerting System
 * 
 * Provides comprehensive alerting capabilities for quality degradation,
 * high failure rates, and system health issues with multiple notification channels.
 */

import { Alert, AlertType, AlertSeverity } from './monitoring-system'
import { QALogger, getLogger } from './logger'

export interface AlertingConfig {
  enabled: boolean
  channels: AlertChannel[]
  escalationRules: EscalationRule[]
  suppressionRules: SuppressionRule[]
  retryPolicy: RetryPolicy
}

export interface AlertChannel {
  name: string
  type: 'email' | 'webhook' | 'console' | 'file' | 'custom'
  config: Record<string, any>
  enabled: boolean
  severityFilter: AlertSeverity[]
  typeFilter: AlertType[]
}

export interface EscalationRule {
  name: string
  condition: EscalationCondition
  action: EscalationAction
  delay: number // milliseconds
}

export interface EscalationCondition {
  alertType?: AlertType
  severity?: AlertSeverity
  unresolvedDuration?: number // milliseconds
  repeatCount?: number
}

export interface EscalationAction {
  type: 'notify' | 'escalate' | 'auto-resolve' | 'custom'
  channels: string[]
  customHandler?: (alert: Alert) => Promise<void>
}

export interface SuppressionRule {
  name: string
  condition: SuppressionCondition
  duration: number // milliseconds
  reason: string
}

export interface SuppressionCondition {
  alertType?: AlertType
  severity?: AlertSeverity
  pattern?: RegExp
  timeWindow?: { start: string; end: string } // HH:MM format
}

export interface RetryPolicy {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
  maxDelay: number
}

export interface AlertNotification {
  alert: Alert
  channel: AlertChannel
  timestamp: Date
  success: boolean
  error?: string
  retryCount: number
}

export interface AlertingMetrics {
  totalAlerts: number
  alertsByType: Record<AlertType, number>
  alertsBySeverity: Record<AlertSeverity, number>
  notificationsSent: number
  notificationFailures: number
  averageResolutionTime: number
  escalatedAlerts: number
  suppressedAlerts: number
}

/**
 * Quality Assurance Alerting System
 */
export class QAAlertingSystem {
  private config: AlertingConfig
  private logger: QALogger
  private notifications: AlertNotification[] = []
  private suppressedAlerts: Map<string, Date> = new Map()
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map()
  private customChannelHandlers: Map<string, (alert: Alert, config: Record<string, any>) => Promise<void>> = new Map()

  constructor(config: AlertingConfig) {
    this.config = config
    this.logger = getLogger()
    
    this.setupDefaultChannelHandlers()
  }

  /**
   * Process an alert through the alerting system
   */
  async processAlert(alert: Alert): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    // Check suppression rules
    if (this.isAlertSuppressed(alert)) {
      this.logger.debug('alerting', 'Alert suppressed', {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity
      })
      return
    }

    // Send notifications to configured channels
    await this.sendNotifications(alert)

    // Set up escalation if needed
    this.setupEscalation(alert)

    this.logger.info('alerting', 'Alert processed', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      channelsNotified: this.getEligibleChannels(alert).length
    })
  }

  /**
   * Register a custom channel handler
   */
  registerCustomChannel(
    name: string,
    handler: (alert: Alert, config: Record<string, any>) => Promise<void>
  ): void {
    this.customChannelHandlers.set(name, handler)
    this.logger.info('alerting', 'Custom channel registered', { name })
  }

  /**
   * Get alerting metrics
   */
  getMetrics(): AlertingMetrics {
    const notifications = this.notifications
    const totalAlerts = new Set(notifications.map(n => n.alert.id)).size

    const alertsByType: Record<AlertType, number> = {
      quality_degradation: 0,
      high_failure_rate: 0,
      performance_issue: 0,
      system_error: 0,
      threshold_breach: 0,
      trend_anomaly: 0
    }

    const alertsBySeverity: Record<AlertSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    const uniqueAlerts = new Map<string, Alert>()
    notifications.forEach(n => {
      uniqueAlerts.set(n.alert.id, n.alert)
    })

    uniqueAlerts.forEach(alert => {
      alertsByType[alert.type]++
      alertsBySeverity[alert.severity]++
    })

    const successfulNotifications = notifications.filter(n => n.success).length
    const failedNotifications = notifications.length - successfulNotifications

    // Calculate average resolution time for resolved alerts
    const resolvedAlerts = Array.from(uniqueAlerts.values()).filter(a => a.resolved && a.resolvedAt)
    const averageResolutionTime = resolvedAlerts.length > 0
      ? resolvedAlerts.reduce((sum, alert) => {
          const resolutionTime = alert.resolvedAt!.getTime() - alert.timestamp.getTime()
          return sum + resolutionTime
        }, 0) / resolvedAlerts.length
      : 0

    return {
      totalAlerts,
      alertsByType,
      alertsBySeverity,
      notificationsSent: successfulNotifications,
      notificationFailures: failedNotifications,
      averageResolutionTime,
      escalatedAlerts: this.escalationTimers.size,
      suppressedAlerts: this.suppressedAlerts.size
    }
  }

  /**
   * Test alert channel configuration
   */
  async testChannel(channelName: string): Promise<{ success: boolean; error?: string }> {
    const channel = this.config.channels.find(c => c.name === channelName)
    if (!channel) {
      return { success: false, error: 'Channel not found' }
    }

    const testAlert: Alert = {
      id: 'test-alert',
      type: 'system_error',
      severity: 'low',
      title: 'Test Alert',
      message: 'This is a test alert to verify channel configuration',
      timestamp: new Date(),
      data: { test: true },
      resolved: false
    }

    try {
      await this.sendToChannel(testAlert, channel)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update alerting configuration
   */
  updateConfig(updates: Partial<AlertingConfig>): void {
    this.config = { ...this.config, ...updates }
    this.logger.info('alerting', 'Configuration updated', { updates })
  }

  /**
   * Clear escalation for a resolved alert
   */
  clearEscalation(alertId: string): void {
    const timer = this.escalationTimers.get(alertId)
    if (timer) {
      clearTimeout(timer)
      this.escalationTimers.delete(alertId)
      this.logger.debug('alerting', 'Escalation cleared', { alertId })
    }
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    const eligibleChannels = this.getEligibleChannels(alert)
    
    const notificationPromises = eligibleChannels.map(async (channel) => {
      const notification: AlertNotification = {
        alert,
        channel,
        timestamp: new Date(),
        success: false,
        retryCount: 0
      }

      try {
        await this.sendToChannelWithRetry(alert, channel, notification)
        notification.success = true
      } catch (error) {
        notification.success = false
        notification.error = error instanceof Error ? error.message : 'Unknown error'
        
        this.logger.error('alerting', 'Notification failed', {
          alertId: alert.id,
          channel: channel.name,
          error: notification.error
        })
      }

      this.notifications.push(notification)
      this.maintainNotificationsSize()
    })

    await Promise.allSettled(notificationPromises)
  }

  private async sendToChannelWithRetry(
    alert: Alert,
    channel: AlertChannel,
    notification: AlertNotification
  ): Promise<void> {
    const { maxRetries, initialDelay, backoffMultiplier, maxDelay } = this.config.retryPolicy
    let delay = initialDelay

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.sendToChannel(alert, channel)
        notification.retryCount = attempt
        return
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * backoffMultiplier, maxDelay)
      }
    }
  }

  private async sendToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    switch (channel.type) {
      case 'console':
        this.sendToConsole(alert, channel.config)
        break
      
      case 'file':
        await this.sendToFile(alert, channel.config)
        break
      
      case 'webhook':
        await this.sendToWebhook(alert, channel.config)
        break
      
      case 'email':
        await this.sendToEmail(alert, channel.config)
        break
      
      case 'custom':
        await this.sendToCustomChannel(alert, channel)
        break
      
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`)
    }
  }

  private sendToConsole(alert: Alert, config: Record<string, any>): void {
    const message = this.formatAlertMessage(alert, 'console')
    
    switch (alert.severity) {
      case 'critical':
      case 'high':
        console.error(message)
        break
      case 'medium':
        console.warn(message)
        break
      case 'low':
        console.info(message)
        break
    }
  }

  private async sendToFile(alert: Alert, config: Record<string, any>): Promise<void> {
    const fs = await import('fs/promises')
    const path = config.filePath || './alerts.log'
    const message = this.formatAlertMessage(alert, 'file')
    
    await fs.appendFile(path, message + '\n')
  }

  private async sendToWebhook(alert: Alert, config: Record<string, any>): Promise<void> {
    const { url, headers = {}, timeout = 5000 } = config
    
    if (!url) {
      throw new Error('Webhook URL not configured')
    }

    const payload = {
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        data: alert.data
      },
      timestamp: new Date().toISOString()
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`)
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async sendToEmail(alert: Alert, config: Record<string, any>): Promise<void> {
    // Email implementation would require an email service
    // For now, we'll log that an email would be sent
    this.logger.info('alerting', 'Email notification would be sent', {
      alertId: alert.id,
      recipients: config.recipients,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`
    })
    
    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    throw new Error('Email notifications not implemented - configure webhook or custom channel instead')
  }

  private async sendToCustomChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    const handler = this.customChannelHandlers.get(channel.name)
    if (!handler) {
      throw new Error(`Custom channel handler not found: ${channel.name}`)
    }

    await handler(alert, channel.config)
  }

  private getEligibleChannels(alert: Alert): AlertChannel[] {
    return this.config.channels.filter(channel => {
      if (!channel.enabled) return false
      
      // Check severity filter
      if (channel.severityFilter.length > 0 && !channel.severityFilter.includes(alert.severity)) {
        return false
      }
      
      // Check type filter
      if (channel.typeFilter.length > 0 && !channel.typeFilter.includes(alert.type)) {
        return false
      }
      
      return true
    })
  }

  private isAlertSuppressed(alert: Alert): boolean {
    for (const rule of this.config.suppressionRules) {
      if (this.matchesSuppressionRule(alert, rule)) {
        const suppressionKey = `${rule.name}-${alert.type}-${alert.severity}`
        const suppressedUntil = this.suppressedAlerts.get(suppressionKey)
        
        if (suppressedUntil && suppressedUntil > new Date()) {
          return true
        }
        
        // Set new suppression period
        const suppressUntil = new Date(Date.now() + rule.duration)
        this.suppressedAlerts.set(suppressionKey, suppressUntil)
        return true
      }
    }
    
    return false
  }

  private matchesSuppressionRule(alert: Alert, rule: SuppressionRule): boolean {
    const { condition } = rule
    
    if (condition.alertType && condition.alertType !== alert.type) {
      return false
    }
    
    if (condition.severity && condition.severity !== alert.severity) {
      return false
    }
    
    if (condition.pattern && !condition.pattern.test(alert.message)) {
      return false
    }
    
    if (condition.timeWindow) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      if (currentTime < condition.timeWindow.start || currentTime > condition.timeWindow.end) {
        return false
      }
    }
    
    return true
  }

  private setupEscalation(alert: Alert): void {
    for (const rule of this.config.escalationRules) {
      if (this.matchesEscalationRule(alert, rule)) {
        const timer = setTimeout(async () => {
          await this.executeEscalation(alert, rule)
        }, rule.delay)
        
        this.escalationTimers.set(alert.id, timer)
        
        this.logger.debug('alerting', 'Escalation scheduled', {
          alertId: alert.id,
          rule: rule.name,
          delay: rule.delay
        })
        
        break // Only apply first matching rule
      }
    }
  }

  private matchesEscalationRule(alert: Alert, rule: EscalationRule): boolean {
    const { condition } = rule
    
    if (condition.alertType && condition.alertType !== alert.type) {
      return false
    }
    
    if (condition.severity && condition.severity !== alert.severity) {
      return false
    }
    
    return true
  }

  private async executeEscalation(alert: Alert, rule: EscalationRule): Promise<void> {
    this.logger.info('alerting', 'Executing escalation', {
      alertId: alert.id,
      rule: rule.name,
      action: rule.action.type
    })

    switch (rule.action.type) {
      case 'notify':
        await this.sendEscalationNotifications(alert, rule.action.channels)
        break
      
      case 'escalate':
        // Create a new escalated alert
        const escalatedAlert: Alert = {
          ...alert,
          id: `${alert.id}-escalated`,
          severity: this.escalateSeverity(alert.severity),
          title: `[ESCALATED] ${alert.title}`,
          message: `Escalated: ${alert.message}`,
          timestamp: new Date()
        }
        await this.processAlert(escalatedAlert)
        break
      
      case 'auto-resolve':
        alert.resolved = true
        alert.resolvedAt = new Date()
        this.logger.info('alerting', 'Alert auto-resolved by escalation rule', {
          alertId: alert.id
        })
        break
      
      case 'custom':
        if (rule.action.customHandler) {
          await rule.action.customHandler(alert)
        }
        break
    }

    this.escalationTimers.delete(alert.id)
  }

  private async sendEscalationNotifications(alert: Alert, channelNames: string[]): Promise<void> {
    const channels = this.config.channels.filter(c => channelNames.includes(c.name))
    
    for (const channel of channels) {
      try {
        await this.sendToChannel(alert, channel)
      } catch (error) {
        this.logger.error('alerting', 'Escalation notification failed', {
          alertId: alert.id,
          channel: channel.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  private escalateSeverity(severity: AlertSeverity): AlertSeverity {
    switch (severity) {
      case 'low': return 'medium'
      case 'medium': return 'high'
      case 'high': return 'critical'
      case 'critical': return 'critical'
    }
  }

  private formatAlertMessage(alert: Alert, format: 'console' | 'file' | 'webhook'): string {
    const timestamp = alert.timestamp.toISOString()
    const severity = alert.severity.toUpperCase()
    const type = alert.type.replace('_', ' ').toUpperCase()
    
    switch (format) {
      case 'console':
        return `🚨 [${severity}] ${type}: ${alert.title}\n   ${alert.message}\n   Time: ${timestamp}\n   ID: ${alert.id}`
      
      case 'file':
        return `[${timestamp}] [${severity}] [${type}] ${alert.title}: ${alert.message} (ID: ${alert.id})`
      
      case 'webhook':
        return JSON.stringify({
          timestamp,
          severity,
          type,
          title: alert.title,
          message: alert.message,
          id: alert.id,
          data: alert.data
        }, null, 2)
      
      default:
        return `${alert.title}: ${alert.message}`
    }
  }

  private setupDefaultChannelHandlers(): void {
    // Register a simple console logger as default custom handler
    this.registerCustomChannel('default-console', async (alert, config) => {
      this.sendToConsole(alert, config)
    })
  }

  private maintainNotificationsSize(): void {
    const maxNotifications = 10000
    if (this.notifications.length > maxNotifications) {
      this.notifications = this.notifications.slice(-Math.floor(maxNotifications * 0.8))
    }
  }
}

/**
 * Default alerting configuration
 */
export const DEFAULT_ALERTING_CONFIG: AlertingConfig = {
  enabled: true,
  channels: [
    {
      name: 'console',
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
        filePath: './quality-alerts.log'
      },
      enabled: true,
      severityFilter: [],
      typeFilter: []
    }
  ],
  escalationRules: [
    {
      name: 'critical-immediate',
      condition: { severity: 'critical' },
      action: { type: 'notify', channels: ['console'] },
      delay: 0
    },
    {
      name: 'high-escalate',
      condition: { severity: 'high', unresolvedDuration: 300000 }, // 5 minutes
      action: { type: 'escalate', channels: ['console'] },
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
}