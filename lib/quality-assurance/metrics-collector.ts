/**
 * MetricsCollector - Comprehensive metrics collection system for AI generation quality
 * 
 * This class tracks generation success rates, quality trends, common issues,
 * and provides detailed reporting capabilities for monitoring system performance.
 */

import { 
  QualityAssuredResult, 
  GenerationRequest, 
  GenerationMetrics,
  QualityMetrics,
  QualityTrends,
  IssuePattern,
  QualityReport,
  ValidationIssue,
  CorrectionAttempt,
  FailurePattern
} from './types'
import { QALogger } from './logger'

export interface MetricsCollectorConfig {
  enableRealTimeTracking: boolean
  maxHistorySize: number
  aggregationInterval: number // minutes
  enableTrendAnalysis: boolean
  enablePerformanceTracking: boolean
}

export interface GenerationSession {
  id: string
  timestamp: Date
  request: GenerationRequest
  result: QualityAssuredResult
  duration: number
  success: boolean
  retryCount: number
  fallbackUsed: boolean
  issuesDetected: ValidationIssue[]
  correctionsApplied: CorrectionAttempt[]
}

export interface PerformanceMetrics {
  averageGenerationTime: number
  averageValidationTime: number
  averageCorrectionTime: number
  p95GenerationTime: number
  p99GenerationTime: number
  throughput: number // generations per minute
  errorRate: number
}

export interface DashboardData {
  realTimeMetrics: {
    currentQualityScore: number
    generationsToday: number
    successRate: number
    activeIssues: number
  }
  trends: {
    qualityTrend: Array<{ time: Date; score: number }>
    volumeTrend: Array<{ time: Date; count: number }>
    errorTrend: Array<{ time: Date; rate: number }>
  }
  topIssues: Array<{
    type: string
    count: number
    trend: 'up' | 'down' | 'stable'
    severity: 'critical' | 'warning' | 'info'
  }>
  performance: PerformanceMetrics
}

export class MetricsCollector {
  private sessions: Map<string, GenerationSession> = new Map()
  private aggregatedMetrics: QualityMetrics[] = []
  private issuePatterns: Map<string, IssuePattern> = new Map()
  private performanceHistory: PerformanceMetrics[] = []
  private logger: QALogger
  private config: MetricsCollectorConfig

  constructor(config: Partial<MetricsCollectorConfig> = {}) {
    this.config = {
      enableRealTimeTracking: true,
      maxHistorySize: 10000,
      aggregationInterval: 15,
      enableTrendAnalysis: true,
      enablePerformanceTracking: true,
      ...config
    }
    
    this.logger = new QALogger({
      level: 'info',
      enableMetrics: true,
      enablePerformanceTracking: true,
      maxLogSize: 10000
    })
    
    // Start periodic aggregation if real-time tracking is enabled
    if (this.config.enableRealTimeTracking) {
      this.startPeriodicAggregation()
    }
  }

  /**
   * Record a complete generation session with all metrics
   */
  recordGenerationSession(
    request: GenerationRequest, 
    result: QualityAssuredResult,
    sessionId?: string
  ): string {
    const id = sessionId || this.generateSessionId()
    const timestamp = new Date()
    
    const session: GenerationSession = {
      id,
      timestamp,
      request,
      result,
      duration: result.generationMetrics.totalGenerationTime,
      success: result.qualityScore >= 70, // Configurable threshold
      retryCount: result.generationMetrics.attemptCount - 1,
      fallbackUsed: result.fallbackUsed,
      issuesDetected: this.extractIssuesFromResult(result),
      correctionsApplied: result.correctionHistory
    }

    this.sessions.set(id, session)
    
    // Update issue patterns
    this.updateIssuePatterns(session.issuesDetected)
    
    // Log the session
    this.logger.info('metrics', 'Generation session recorded', {
      sessionId: id,
      success: session.success,
      qualityScore: result.qualityScore,
      duration: session.duration,
      retryCount: session.retryCount,
      fallbackUsed: session.fallbackUsed
    })

    // Cleanup old sessions if we exceed max history size
    this.cleanupOldSessions()

    return id
  }

  /**
   * Track quality trends over time
   */
  trackQualityTrends(timeRange?: { start: Date; end: Date }): QualityTrends {
    const sessions = this.getSessionsInRange(timeRange)
    
    const qualityScoreOverTime = sessions.map(session => ({
      timestamp: session.timestamp,
      score: session.result.qualityScore
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const issueFrequencyTrends = this.calculateIssueFrequencyTrends(sessions)
    const correctionSuccessRate = this.calculateCorrectionSuccessRate(sessions)
    const fallbackUsageRate = this.calculateFallbackUsageRate(sessions)

    return {
      qualityScoreOverTime,
      issueFrequencyTrends,
      correctionSuccessRate,
      fallbackUsageRate
    }
  }

  /**
   * Identify common issues and patterns
   */
  identifyCommonIssues(): IssuePattern[] {
    return Array.from(this.issuePatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20) // Top 20 issues
  }

  /**
   * Generate comprehensive quality report
   */
  generateQualityReport(timeRange?: { start: Date; end: Date }): QualityReport {
    const sessions = this.getSessionsInRange(timeRange)
    const summary = this.calculateQualityMetrics(sessions)
    const trends = this.trackQualityTrends(timeRange)
    const commonIssues = this.identifyCommonIssues()
    const recommendations = this.generateRecommendations(summary, trends, commonIssues)

    return {
      summary,
      trends,
      commonIssues,
      recommendations,
      generatedAt: new Date()
    }
  }

  /**
   * Get real-time dashboard data
   */
  getDashboardData(): DashboardData {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const todaySessions = this.getSessionsInRange({ start: today, end: now })
    const recentSessions = this.getSessionsInRange({ start: last24Hours, end: now })

    const realTimeMetrics = {
      currentQualityScore: this.calculateAverageQualityScore(recentSessions),
      generationsToday: todaySessions.length,
      successRate: this.calculateSuccessRate(recentSessions),
      activeIssues: this.countActiveIssues(recentSessions)
    }

    const trends = this.generateDashboardTrends(recentSessions)
    const topIssues = this.getTopIssues(recentSessions)
    const performance = this.calculatePerformanceMetrics(recentSessions)

    return {
      realTimeMetrics,
      trends,
      topIssues,
      performance
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetrics {
    const sessions = this.getSessionsInRange(timeRange)
    return this.calculatePerformanceMetrics(sessions)
  }

  /**
   * Export metrics data for external analysis
   */
  exportMetricsData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      sessions: Array.from(this.sessions.values()),
      aggregatedMetrics: this.aggregatedMetrics,
      issuePatterns: Array.from(this.issuePatterns.values()),
      performanceHistory: this.performanceHistory,
      exportedAt: new Date()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else {
      return this.convertToCSV(data)
    }
  }

  /**
   * Clear all collected metrics (use with caution)
   */
  clearMetrics(): void {
    this.sessions.clear()
    this.aggregatedMetrics = []
    this.issuePatterns.clear()
    this.performanceHistory = []
    
    this.logger.warn('metrics', 'All metrics data cleared')
  }

  // Private helper methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private extractIssuesFromResult(result: QualityAssuredResult): ValidationIssue[] {
    return result.validationResults.flatMap(vr => vr.issues)
  }

  private updateIssuePatterns(issues: ValidationIssue[]): void {
    issues.forEach(issue => {
      const key = `${issue.type}_${issue.severity}`
      const existing = this.issuePatterns.get(key)
      
      if (existing) {
        existing.frequency++
      } else {
        this.issuePatterns.set(key, {
          type: issue.type,
          description: issue.message,
          frequency: 1,
          severity: issue.severity,
          commonSolutions: issue.suggestedFix ? [issue.suggestedFix] : [],
          preventionStrategies: []
        })
      }
    })
  }

  private getSessionsInRange(timeRange?: { start: Date; end: Date }): GenerationSession[] {
    const sessions = Array.from(this.sessions.values())
    
    if (!timeRange) {
      return sessions
    }

    return sessions.filter(session => {
      // Use the generation start time if available, otherwise use session timestamp
      const sessionTime = session.result.generationMetrics.startTime || session.timestamp
      return sessionTime >= timeRange.start && sessionTime <= timeRange.end
    })
  }

  private calculateQualityMetrics(sessions: GenerationSession[]): QualityMetrics {
    if (sessions.length === 0) {
      return this.getEmptyQualityMetrics()
    }

    const successfulSessions = sessions.filter(s => s.success)
    const firstAttemptSuccess = sessions.filter(s => s.success && s.retryCount === 0).length
    const correctionSuccess = sessions.filter(s => s.success && s.retryCount > 0 && !s.fallbackUsed).length
    const fallbackUsed = sessions.filter(s => s.fallbackUsed).length

    const issueTypes = ['undefinedValues', 'syntaxErrors', 'incompleteLogic', 'validationFailures']
    const commonIssues = issueTypes.reduce((acc, type) => {
      acc[type] = sessions.reduce((count, session) => 
        count + session.issuesDetected.filter(issue => issue.type.includes(type)).length, 0
      )
      return acc
    }, {} as any)

    const averageQualityScore = sessions.reduce((sum, s) => sum + s.result.qualityScore, 0) / sessions.length
    const timeRange = sessions.length > 0 ? {
      start: new Date(Math.min(...sessions.map(s => s.timestamp.getTime()))),
      end: new Date(Math.max(...sessions.map(s => s.timestamp.getTime())))
    } : { start: new Date(), end: new Date() }

    return {
      generationSuccess: {
        firstAttempt: (firstAttemptSuccess / sessions.length) * 100,
        afterCorrection: (correctionSuccess / sessions.length) * 100,
        fallbackUsed: (fallbackUsed / sessions.length) * 100
      },
      commonIssues,
      averageQualityScore,
      userSatisfaction: this.calculateUserSatisfaction(sessions),
      totalGenerations: sessions.length,
      timeRange
    }
  }

  private calculateIssueFrequencyTrends(sessions: GenerationSession[]): Array<{ type: string; frequency: number; trend: 'increasing' | 'decreasing' | 'stable' }> {
    // Group sessions by time periods and calculate trends
    const timeWindows = this.groupSessionsByTimeWindows(sessions, 'hour')
    const issueTypes = new Set(sessions.flatMap(s => s.issuesDetected.map(i => i.type)))

    return Array.from(issueTypes).map(type => {
      const frequencies = timeWindows.map(window => 
        window.sessions.reduce((count, session) => 
          count + session.issuesDetected.filter(issue => issue.type === type).length, 0
        )
      )

      const trend = this.calculateTrend(frequencies)
      const totalFrequency = frequencies.reduce((sum, freq) => sum + freq, 0)

      return {
        type,
        frequency: totalFrequency,
        trend
      }
    })
  }

  private calculateCorrectionSuccessRate(sessions: GenerationSession[]): number {
    const sessionsWithCorrections = sessions.filter(s => s.correctionsApplied.length > 0)
    if (sessionsWithCorrections.length === 0) return 0

    const successfulCorrections = sessionsWithCorrections.filter(s => s.success).length
    return (successfulCorrections / sessionsWithCorrections.length) * 100
  }

  private calculateFallbackUsageRate(sessions: GenerationSession[]): number {
    if (sessions.length === 0) return 0
    const fallbackSessions = sessions.filter(s => s.fallbackUsed).length
    return (fallbackSessions / sessions.length) * 100
  }

  private calculatePerformanceMetrics(sessions: GenerationSession[]): PerformanceMetrics {
    if (sessions.length === 0) {
      return {
        averageGenerationTime: 0,
        averageValidationTime: 0,
        averageCorrectionTime: 0,
        p95GenerationTime: 0,
        p99GenerationTime: 0,
        throughput: 0,
        errorRate: 0
      }
    }

    const durations = sessions.map(s => s.duration).sort((a, b) => a - b)
    const validationTimes = sessions.map(s => s.result.generationMetrics.validationTime)
    const correctionTimes = sessions.map(s => s.result.generationMetrics.correctionTime)
    
    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)
    
    const timeSpan = sessions.length > 1 ? 
      (Math.max(...sessions.map(s => s.timestamp.getTime())) - 
       Math.min(...sessions.map(s => s.timestamp.getTime()))) / (1000 * 60) : 1 // minutes

    const errorCount = sessions.filter(s => !s.success).length

    return {
      averageGenerationTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      averageValidationTime: validationTimes.reduce((sum, t) => sum + t, 0) / validationTimes.length,
      averageCorrectionTime: correctionTimes.reduce((sum, t) => sum + t, 0) / correctionTimes.length,
      p95GenerationTime: durations[p95Index] || 0,
      p99GenerationTime: durations[p99Index] || 0,
      throughput: sessions.length / timeSpan,
      errorRate: (errorCount / sessions.length) * 100
    }
  }

  private generateRecommendations(
    summary: QualityMetrics, 
    trends: QualityTrends, 
    commonIssues: IssuePattern[]
  ): string[] {
    const recommendations: string[] = []

    // Quality score recommendations
    if (summary.averageQualityScore < 80) {
      recommendations.push('Consider enhancing AI prompts to improve overall quality scores')
    }

    // Success rate recommendations
    if (summary.generationSuccess.firstAttempt < 70) {
      recommendations.push('First-attempt success rate is low - review prompt engineering strategies')
    }

    // Fallback usage recommendations
    if (summary.generationSuccess.fallbackUsed > 20) {
      recommendations.push('High fallback usage detected - investigate common generation failures')
    }

    // Issue-specific recommendations
    const criticalIssues = commonIssues.filter(issue => issue.severity === 'critical')
    if (criticalIssues.length > 0) {
      recommendations.push(`Address critical issues: ${criticalIssues.map(i => i.type).join(', ')}`)
    }

    // Trend-based recommendations
    const decliningTrends = trends.issueFrequencyTrends.filter(t => t.trend === 'increasing')
    if (decliningTrends.length > 0) {
      recommendations.push(`Monitor increasing issue trends: ${decliningTrends.map(t => t.type).join(', ')}`)
    }

    return recommendations
  }

  private cleanupOldSessions(): void {
    if (this.sessions.size <= this.config.maxHistorySize) return

    const sessions = Array.from(this.sessions.entries())
      .sort(([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime())

    // Keep only the most recent sessions
    const toKeep = sessions.slice(0, this.config.maxHistorySize)
    this.sessions.clear()
    toKeep.forEach(([id, session]) => this.sessions.set(id, session))

    this.logger.info('metrics', `Cleaned up old sessions, kept ${toKeep.length} most recent`)
  }

  private startPeriodicAggregation(): void {
    setInterval(() => {
      this.aggregateMetrics()
    }, this.config.aggregationInterval * 60 * 1000)
  }

  private aggregateMetrics(): void {
    const now = new Date()
    const intervalStart = new Date(now.getTime() - this.config.aggregationInterval * 60 * 1000)
    
    const recentSessions = this.getSessionsInRange({ start: intervalStart, end: now })
    if (recentSessions.length === 0) return

    const aggregated = this.calculateQualityMetrics(recentSessions)
    this.aggregatedMetrics.push(aggregated)

    // Keep only recent aggregated metrics
    const maxAggregatedHistory = 1000
    if (this.aggregatedMetrics.length > maxAggregatedHistory) {
      this.aggregatedMetrics = this.aggregatedMetrics.slice(-maxAggregatedHistory)
    }
  }

  // Additional helper methods for dashboard and analysis

  private calculateAverageQualityScore(sessions: GenerationSession[]): number {
    if (sessions.length === 0) return 0
    return sessions.reduce((sum, s) => sum + s.result.qualityScore, 0) / sessions.length
  }

  private calculateSuccessRate(sessions: GenerationSession[]): number {
    if (sessions.length === 0) return 0
    const successful = sessions.filter(s => s.success).length
    return (successful / sessions.length) * 100
  }

  private countActiveIssues(sessions: GenerationSession[]): number {
    const recentIssues = sessions.flatMap(s => s.issuesDetected)
    return new Set(recentIssues.map(i => i.type)).size
  }

  private generateDashboardTrends(sessions: GenerationSession[]) {
    const hourlyGroups = this.groupSessionsByTimeWindows(sessions, 'hour')
    
    return {
      qualityTrend: hourlyGroups.map(group => ({
        time: group.timestamp,
        score: this.calculateAverageQualityScore(group.sessions)
      })),
      volumeTrend: hourlyGroups.map(group => ({
        time: group.timestamp,
        count: group.sessions.length
      })),
      errorTrend: hourlyGroups.map(group => ({
        time: group.timestamp,
        rate: (1 - this.calculateSuccessRate(group.sessions) / 100)
      }))
    }
  }

  private getTopIssues(sessions: GenerationSession[]) {
    const issueCount = new Map<string, number>()
    sessions.forEach(session => {
      session.issuesDetected.forEach(issue => {
        const count = issueCount.get(issue.type) || 0
        issueCount.set(issue.type, count + 1)
      })
    })

    return Array.from(issueCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({
        type,
        count,
        trend: 'stable' as const, // Would need historical data for real trend
        severity: 'warning' as const // Would need to look up from issue patterns
      }))
  }

  private groupSessionsByTimeWindows(sessions: GenerationSession[], interval: 'hour' | 'day' | 'minute') {
    const groups = new Map<string, GenerationSession[]>()
    
    sessions.forEach(session => {
      const key = this.getTimeWindowKey(session.timestamp, interval)
      const existing = groups.get(key) || []
      existing.push(session)
      groups.set(key, existing)
    })

    return Array.from(groups.entries()).map(([key, sessions]) => ({
      timestamp: this.parseTimeWindowKey(key, interval),
      sessions
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private getTimeWindowKey(date: Date, interval: 'hour' | 'day' | 'minute'): string {
    switch (interval) {
      case 'minute':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`
      case 'hour':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
      case 'day':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    }
  }

  private parseTimeWindowKey(key: string, interval: 'hour' | 'day' | 'minute'): Date {
    const parts = key.split('-').map(Number)
    switch (interval) {
      case 'minute':
        return new Date(parts[0], parts[1], parts[2], parts[3], parts[4])
      case 'hour':
        return new Date(parts[0], parts[1], parts[2], parts[3])
      case 'day':
        return new Date(parts[0], parts[1], parts[2])
    }
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable'
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length
    
    const threshold = 0.1 // 10% change threshold
    const change = (secondAvg - firstAvg) / (firstAvg || 1)
    
    if (change > threshold) return 'increasing'
    if (change < -threshold) return 'decreasing'
    return 'stable'
  }

  private calculateUserSatisfaction(sessions: GenerationSession[]): number {
    // Simplified satisfaction calculation based on success rate and quality
    const successRate = this.calculateSuccessRate(sessions)
    const avgQuality = this.calculateAverageQualityScore(sessions)
    return (successRate + avgQuality) / 2
  }

  private getEmptyQualityMetrics(): QualityMetrics {
    return {
      generationSuccess: {
        firstAttempt: 0,
        afterCorrection: 0,
        fallbackUsed: 0
      },
      commonIssues: {
        undefinedValues: 0,
        syntaxErrors: 0,
        incompleteLogic: 0,
        validationFailures: 0
      },
      averageQualityScore: 0,
      userSatisfaction: 0,
      totalGenerations: 0,
      timeRange: { start: new Date(), end: new Date() }
    }
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion - would need more sophisticated implementation
    const sessions = data.sessions
    const headers = ['timestamp', 'success', 'qualityScore', 'duration', 'retryCount', 'fallbackUsed']
    const rows = sessions.map((session: GenerationSession) => [
      session.timestamp.toISOString(),
      session.success,
      session.result.qualityScore,
      session.duration,
      session.retryCount,
      session.fallbackUsed
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }
}