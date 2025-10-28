/**
 * Performance Analytics API Route
 * 
 * Provides detailed performance metrics and monitoring data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsSystem } from '@/lib/fullstack-analytics-system'
import { getPerformanceMonitor } from '@/lib/quality-assurance/performance-monitor'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange')
    const includeDetails = searchParams.get('details') === 'true'

    const analytics = getAnalyticsSystem()
    const performanceMonitor = getPerformanceMonitor()

    let analyticsTimeRange: { start: Date; end: Date } | undefined

    if (timeRange) {
      const now = new Date()
      switch (timeRange) {
        case '1h':
          analyticsTimeRange = {
            start: new Date(now.getTime() - 60 * 60 * 1000),
            end: now
          }
          break
        case '24h':
          analyticsTimeRange = {
            start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            end: now
          }
          break
        case '7d':
          analyticsTimeRange = {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: now
          }
          break
        case '30d':
          analyticsTimeRange = {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            end: now
          }
          break
      }
    }

    // Get performance report from analytics
    const report = analytics.generateReport(analyticsTimeRange)

    // Get system health from performance monitor
    const systemHealth = performanceMonitor.getSystemHealth()
    const performanceReport = performanceMonitor.getPerformanceReport()

    const response = {
      timestamp: new Date().toISOString(),
      timeRange: analyticsTimeRange || { start: new Date(0), end: new Date() },
      performance: {
        generation: report.performance,
        system: systemHealth,
        trends: performanceReport.trends,
        alerts: performanceReport.alerts
      },
      success: report.success,
      recommendations: report.recommendations
    }

    if (includeDetails) {
      response.performance = {
        ...response.performance,
        detailed: {
          validationMetrics: performanceReport.health,
          performanceTrends: performanceReport.trends,
          activeAlerts: performanceReport.alerts,
          recommendations: performanceReport.recommendations
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Performance analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    const performanceMonitor = getPerformanceMonitor()

    switch (action) {
      case 'update-thresholds':
        if (data?.thresholds) {
          performanceMonitor.updateThresholds(data.thresholds)
          return NextResponse.json({ 
            success: true, 
            message: 'Performance thresholds updated successfully' 
          })
        }
        return NextResponse.json(
          { error: 'Thresholds data required' },
          { status: 400 }
        )

      case 'reset-metrics':
        performanceMonitor.reset()
        return NextResponse.json({ 
          success: true, 
          message: 'Performance metrics reset successfully' 
        })

      case 'record-validation':
        if (data?.duration !== undefined) {
          performanceMonitor.recordValidation(
            data.duration,
            data.cacheHit || false,
            data.error ? new Error(data.error) : undefined
          )
          return NextResponse.json({ 
            success: true, 
            message: 'Validation recorded successfully' 
          })
        }
        return NextResponse.json(
          { error: 'Duration data required' },
          { status: 400 }
        )

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Performance analytics POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}