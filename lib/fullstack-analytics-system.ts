/**
 * Full-Stack Analytics System
 * 
 * Comprehensive monitoring and analytics for full-stack dApp generation,
 * tracking success rates, performance metrics, and user experience insights.
 */

import { 
  FullStackGenerationOptions, 
  FullStackGenerationResult, 
  ParsedPromptResult 
} from './vibesdk'
import { QALogger } from './quality-assurance/logger'

export interface GenerationSession {
  id: string
  startTime: Date
  endTime?: Date
  projectName: string
  options: FullStackGenerationOptions
  parsedPrompt: ParsedPromptResult
  result?: FullStackGenerationResult
  error?: string
  duration?: number
  cacheHits: number
  cacheMisses: number
  componentsGenerated: number
  contractsGenerated: number
  apiRoutesGenerated: number
  memoryUsage: number
  userId?: string
}

export interface SuccessMetrics {
  totalGenerations: number
  successfulGenerations: number
  failedGenerations: number
  successRate: number
  averageDuration: number
  medianDuration: number
  p95Duration: number
  p99Duration: number
}

export interface PerformanceMetrics {
  averageGenerationTime: number
  averageContractGenerationTime: number
  averageComponentGenerationTime: number
  averageAPIGenerationTime: number
  cacheHitRate: number
  memoryEfficiency: number
  throughput: number // generations per hour
}

export interface AnalyticsReport {
  timeRange: { start: Date; end: Date }
  summary: {
    totalSessions: number
    totalGenerations: number
    uniqueUsers: number
    totalDuration: number
  }
  success: SuccessMetrics
  performance: PerformanceMetrics
  insights: string[]
  recommendations: string[]
}

export class FullStackAnalyticsSystem {
  private sessions = new Map<string, GenerationSession>()
  private logger: QALogger
  private maxHistorySize: number

  constructor(config: { maxHistorySize?: number } = {}) {
    this.maxHistorySize = config.maxHistorySize || 10000
    this.logger = new QALogger({
      level: 'info',
      enableMetrics: true,
      enablePerformanceTracking: true,
      maxLogSize: 1000
    })
  }

  /**
   * Start tracking a new generation session
   */
  startSession(
    projectName: string,
    options: FullStackGenerationOptions,
    parsedPrompt: ParsedPromptResult,
    userId?: string
  ): string {
    const sessionId = this.generateSessionId()
    
    const session: GenerationSession = {
      id: sessionId,
      startTime: new Date(),
      projectName,
      options,
      parsedPrompt,
      cacheHits: 0,
      cacheMisses: 0,
      componentsGenerated: 0,
      contractsGenerated: 0,
      apiRoutesGenerated: 0,
      memoryUsage: this.getCurrentMemoryUsage(),
      userId
    }

    this.sessions.set(sessionId, session)
    
    this.logger.info('Generation session started', {
      sessionId,
      projectName,
      projectType: parsedPrompt.projectType,
      userId
    })

    return sessionId
  }

  /**
   * Complete a generation session
   */
  completeSession(
    sessionId: string,
    result: FullStackGenerationResult,
    error?: string
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      this.logger.warn('Attempted to complete unknown session', { sessionId })
      return
    }

    session.endTime = new Date()
    session.duration = session.endTime.getTime() - session.startTime.getTime()
    session.result = result
    session.error = error

    if (result) {
      session.contractsGenerated = result.smartContracts.length
      session.componentsGenerated = result.frontendComponents.length
      session.apiRoutesGenerated = result.apiRoutes.length
    }

    this.logger.info('Generation session completed', {
      sessionId,
      success: !error,
      duration: session.duration,
      contractsGenerated: session.contractsGenerated,
      componentsGenerated: session.componentsGenerated,
      apiRoutesGenerated: session.apiRoutesGenerated
    })
  }

  /**
   * Record cache hit/miss
   */
  recordCacheEvent(sessionId: string, hit: boolean): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (hit) {
      session.cacheHits++
    } else {
      session.cacheMisses++
    }
  }

  /**
   * Generate analytics report
   */
  generateReport(timeRange?: { start: Date; end: Date }): AnalyticsReport {
    const sessions = this.getSessionsInRange(timeRange)
    const summary = this.calculateSummary(sessions)
    const success = this.calculateSuccessMetrics(sessions)
    const performance = this.calculatePerformanceMetrics(sessions)
    const insights = this.generateInsights(sessions)
    const recommendations = this.generateRecommendations(success, performance)

    return {
      timeRange: timeRange || { start: new Date(0), end: new Date() },
      summary,
      success,
      performance,
      insights,
      recommendations
    }
  }

  /**
   * Get real-time dashboard metrics
   */
  getDashboardMetrics() {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentSessions = this.getSessionsInRange({ start: last24Hours, end: now })

    return {
      activeSessions: Array.from(this.sessions.values()).filter(s => !s.endTime).length,
      generationsToday: recentSessions.length,
      successRateToday: this.calculateSuccessMetrics(recentSessions).successRate,
      averageDurationToday: this.calculateSuccessMetrics(recentSessions).averageDuration
    }
  }

  // Private helper methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  private getSessionsInRange(timeRange?: { start: Date; end: Date }): GenerationSession[] {
    const sessions = Array.from(this.sessions.values())
    
    if (!timeRange) {
      return sessions
    }

    return sessions.filter(session => 
      session.startTime >= timeRange.start && session.startTime <= timeRange.end
    )
  }

  private calculateSummary(sessions: GenerationSession[]) {
    const uniqueUsers = new Set(sessions.map(s => s.userId).filter(Boolean)).size
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)

    return {
      totalSessions: sessions.length,
      totalGenerations: sessions.filter(s => s.endTime).length,
      uniqueUsers,
      totalDuration
    }
  }

  private calculateSuccessMetrics(sessions: GenerationSession[]): SuccessMetrics {
    const completedSessions = sessions.filter(s => s.endTime)
    const successfulSessions = completedSessions.filter(s => !s.error)

    const durations = successfulSessions
      .map(s => s.duration!)
      .filter(d => d > 0)
      .sort((a, b) => a - b)

    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0

    const medianDuration = durations.length > 0 
      ? durations[Math.floor(durations.length / 2)] 
      : 0

    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)

    return {
      totalGenerations: completedSessions.length,
      successfulGenerations: successfulSessions.length,
      failedGenerations: completedSessions.length - successfulSessions.length,
      successRate: completedSessions.length > 0 
        ? (successfulSessions.length / completedSessions.length) * 100 
        : 0,
      averageDuration,
      medianDuration,
      p95Duration: durations[p95Index] || 0,
      p99Duration: durations[p99Index] || 0
    }
  }

  private calculatePerformanceMetrics(sessions: GenerationSession[]): PerformanceMetrics {
    const successfulSessions = sessions.filter(s => s.endTime && !s.error)
    
    if (successfulSessions.length === 0) {
      return {
        averageGenerationTime: 0,
        averageContractGenerationTime: 0,
        averageComponentGenerationTime: 0,
        averageAPIGenerationTime: 0,
        cacheHitRate: 0,
        memoryEfficiency: 0,
        throughput: 0
      }
    }

    const totalDuration = successfulSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const averageGenerationTime = totalDuration / successfulSessions.length

    const totalCacheRequests = successfulSessions.reduce((sum, s) => sum + s.cacheHits + s.cacheMisses, 0)
    const totalCacheHits = successfulSessions.reduce((sum, s) => sum + s.cacheHits, 0)
    const cacheHitRate = totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0

    const timeSpan = sessions.length > 1 ? 
      (Math.max(...sessions.map(s => s.startTime.getTime())) - 
       Math.min(...sessions.map(s => s.startTime.getTime()))) / (1000 * 60 * 60) : 1
    const throughput = successfulSessions.length / timeSpan

    return {
      averageGenerationTime,
      averageContractGenerationTime: averageGenerationTime * 0.4,
      averageComponentGenerationTime: averageGenerationTime * 0.4,
      averageAPIGenerationTime: averageGenerationTime * 0.2,
      cacheHitRate,
      memoryEfficiency: 1.0, // Placeholder
      throughput
    }
  }

  private generateInsights(sessions: GenerationSession[]): string[] {
    const insights: string[] = []
    
    const successfulSessions = sessions.filter(s => s.result && !s.error)
    const successRate = sessions.length > 0 ? (successfulSessions.length / sessions.length) * 100 : 0

    if (successRate > 90) {
      insights.push('Excellent generation success rate indicates stable system performance')
    } else if (successRate < 70) {
      insights.push('Low success rate detected - investigate common failure patterns')
    }

    const totalCacheRequests = sessions.reduce((sum, s) => sum + s.cacheHits + s.cacheMisses, 0)
    const totalCacheHits = sessions.reduce((sum, s) => sum + s.cacheHits, 0)
    const cacheHitRate = totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0
    
    if (cacheHitRate > 0.8) {
      insights.push('High cache hit rate indicates effective caching strategy')
    } else if (cacheHitRate < 0.3) {
      insights.push('Low cache hit rate - review caching strategy and cache size')
    }

    return insights
  }

  private generateRecommendations(success: SuccessMetrics, performance: PerformanceMetrics): string[] {
    const recommendations: string[] = []

    if (success.successRate < 80) {
      recommendations.push('Improve error handling and validation to increase success rate')
    }

    if (performance.averageGenerationTime > 20000) {
      recommendations.push('Optimize generation algorithms and increase caching to improve performance')
    }

    if (performance.cacheHitRate < 0.5) {
      recommendations.push('Increase cache size and improve cache key strategies')
    }

    return recommendations
  }
}

/**
 * Global analytics instance
 */
let globalAnalyticsSystem: FullStackAnalyticsSystem | null = null

export function getAnalyticsSystem(config?: { maxHistorySize?: number }): FullStackAnalyticsSystem {
  if (!globalAnalyticsSystem) {
    globalAnalyticsSystem = new FullStackAnalyticsSystem(config)
  }
  return globalAnalyticsSystem
}