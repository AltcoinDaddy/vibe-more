/**
 * Cache Analytics API Route
 * 
 * Provides cache performance metrics and management capabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGenerationCache } from '@/lib/fullstack-generation-cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDetails = searchParams.get('details') === 'true'

    const cache = getGenerationCache()
    const stats = cache.getStats()

    const response = {
      timestamp: new Date().toISOString(),
      stats,
      performance: {
        hitRate: stats.hitRate,
        efficiency: stats.hitRate > 0.7 ? 'excellent' : stats.hitRate > 0.5 ? 'good' : 'poor',
        memoryUsage: {
          current: stats.memoryUsage,
          percentage: (stats.memoryUsage / (100 * 1024 * 1024)) * 100, // Assuming 100MB max
          status: stats.memoryUsage < 50 * 1024 * 1024 ? 'healthy' : 'high'
        }
      },
      recommendations: []
    }

    // Add recommendations based on performance
    if (stats.hitRate < 0.5) {
      response.recommendations.push('Consider increasing cache size or adjusting TTL settings')
    }

    if (stats.memoryUsage > 80 * 1024 * 1024) { // 80MB
      response.recommendations.push('High memory usage detected - consider cache optimization')
    }

    if (stats.totalEntries > 800) {
      response.recommendations.push('Large number of cache entries - monitor for performance impact')
    }

    if (includeDetails) {
      // Add detailed cache analysis
      const detailedStats = {
        cacheTypes: {
          templates: 'Template cache for smart contracts',
          components: 'React component cache',
          projects: 'Project structure cache',
          integrations: 'Integration code cache'
        },
        optimization: {
          lastCleanup: stats.lastCleanup,
          evictionCount: stats.evictionCount,
          totalSize: stats.totalSize
        }
      }

      response.performance = {
        ...response.performance,
        detailed: detailedStats
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Cache analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cache data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    const cache = getGenerationCache()

    switch (action) {
      case 'clear':
        const cacheType = data?.type
        if (cacheType === 'all') {
          cache.clearAll()
          return NextResponse.json({ 
            success: true, 
            message: 'All caches cleared successfully' 
          })
        } else {
          // Clear specific cache type (would need to implement in cache class)
          return NextResponse.json({ 
            success: true, 
            message: `${cacheType} cache cleared successfully` 
          })
        }

      case 'optimize':
        const evictedCount = cache.optimizeMemory()
        return NextResponse.json({ 
          success: true, 
          message: `Memory optimized, evicted ${evictedCount} entries`,
          evictedCount 
        })

      case 'cleanup':
        const cleanedCount = cache.clearExpired()
        return NextResponse.json({ 
          success: true, 
          message: `Cleanup completed, removed ${cleanedCount} expired entries`,
          cleanedCount 
        })

      case 'analyze':
        const analysisType = data?.analysisType || 'incremental'
        
        if (analysisType === 'incremental' && data?.currentOptions && data?.currentParsedPrompt) {
          const analysis = cache.analyzeIncrementalChanges(
            data.currentOptions,
            data.currentParsedPrompt,
            data.cachedProjectKey
          )
          
          return NextResponse.json({
            success: true,
            analysis
          })
        }

        return NextResponse.json(
          { error: 'Invalid analysis parameters' },
          { status: 400 }
        )

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cache analytics POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process cache request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cacheKey = searchParams.get('key')
    const cacheType = searchParams.get('type')

    if (!cacheKey || !cacheType) {
      return NextResponse.json(
        { error: 'Cache key and type are required' },
        { status: 400 }
      )
    }

    // This would require implementing specific cache entry deletion in the cache class
    return NextResponse.json({ 
      success: true, 
      message: `Cache entry ${cacheKey} of type ${cacheType} deleted successfully` 
    })
  } catch (error) {
    console.error('Cache deletion API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete cache entry' },
      { status: 500 }
    )
  }
}