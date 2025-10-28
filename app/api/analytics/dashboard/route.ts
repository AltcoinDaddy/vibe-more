/**
 * Analytics Dashboard API Route
 * 
 * Provides real-time analytics data for the full-stack generation dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsSystem } from '@/lib/fullstack-analytics-system'
import { getGenerationCache } from '@/lib/fullstack-generation-cache'

export async function GET(request: NextRequest) {
  try {
    const analytics = getAnalyticsSystem()
    const cache = getGenerationCache()

    // Get dashboard metrics
    const dashboardMetrics = analytics.getDashboardMetrics()
    const cacheStats = cache.getStats()

    // Combine analytics and cache data
    const response = {
      timestamp: new Date().toISOString(),
      realTime: dashboardMetrics,
      cache: {
        hitRate: cacheStats.hitRate,
        totalEntries: cacheStats.totalEntries,
        memoryUsage: cacheStats.memoryUsage,
        totalSize: cacheStats.totalSize
      },
      performance: {
        cacheEfficiency: cacheStats.hitRate > 0.7 ? 'excellent' : cacheStats.hitRate > 0.5 ? 'good' : 'needs-improvement',
        memoryEfficiency: cacheStats.memoryUsage < 50 * 1024 * 1024 ? 'excellent' : 'moderate', // 50MB threshold
        systemHealth: 'healthy' // Would be calculated based on various metrics
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analytics dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    const analytics = getAnalyticsSystem()
    const cache = getGenerationCache()

    switch (action) {
      case 'clear-cache':
        cache.clearAll()
        return NextResponse.json({ success: true, message: 'Cache cleared successfully' })

      case 'optimize-memory':
        const evictedCount = cache.optimizeMemory()
        return NextResponse.json({ 
          success: true, 
          message: `Optimized memory usage, evicted ${evictedCount} entries` 
        })

      case 'generate-report':
        const timeRange = data?.timeRange ? {
          start: new Date(data.timeRange.start),
          end: new Date(data.timeRange.end)
        } : undefined

        const report = analytics.generateReport(timeRange)
        return NextResponse.json(report)

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Analytics dashboard POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}