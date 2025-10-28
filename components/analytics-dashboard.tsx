/**
 * Analytics Dashboard Component
 * 
 * Real-time monitoring dashboard for full-stack generation performance,
 * cache efficiency, and system health metrics.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Database, 
  RefreshCw, 
  TrendingUp, 
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface DashboardMetrics {
  timestamp: string
  realTime: {
    activeSessions: number
    generationsToday: number
    successRateToday: number
    averageDurationToday: number
  }
  cache: {
    hitRate: number
    totalEntries: number
    memoryUsage: number
    totalSize: number
  }
  performance: {
    cacheEfficiency: 'excellent' | 'good' | 'needs-improvement'
    memoryEfficiency: 'excellent' | 'moderate' | 'poor'
    systemHealth: 'healthy' | 'warning' | 'critical'
  }
}

interface PerformanceData {
  timestamp: string
  performance: {
    generation: {
      averageGenerationTime: number
      cacheHitRate: number
      throughput: number
    }
    system: {
      averageValidationTime: number
      memoryUsage: number
      errorRate: number
    }
  }
  success: {
    successRate: number
    averageDuration: number
    totalGenerations: number
  }
  recommendations: string[]
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchMetrics = async () => {
    try {
      const [dashboardResponse, performanceResponse] = await Promise.all([
        fetch('/api/analytics/dashboard'),
        fetch('/api/analytics/performance?timeRange=24h')
      ])

      if (dashboardResponse.ok && performanceResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        const performanceData = await performanceResponse.json()
        
        setMetrics(dashboardData)
        setPerformance(performanceData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMetrics()
  }

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      })

      if (response.ok) {
        await fetchMetrics() // Refresh data after clearing cache
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const handleOptimizeMemory = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize-memory' })
      })

      if (response.ok) {
        await fetchMetrics() // Refresh data after optimization
      }
    } catch (error) {
      console.error('Failed to optimize memory:', error)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (!metrics || !performance) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p>Failed to load analytics data</p>
          <Button onClick={handleRefresh} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>
      case 'warning':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>
      case 'critical':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Critical</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'needs-improvement': return 'text-yellow-600'
      case 'moderate': return 'text-orange-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of full-stack generation performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimizeMemory}
          >
            <Zap className="h-4 w-4 mr-2" />
            Optimize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
          >
            <Database className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getHealthBadge(metrics.performance.systemHealth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.realTime.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently generating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.realTime.successRateToday.toFixed(1)}%</div>
            <Progress value={metrics.realTime.successRateToday} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.realTime.averageDurationToday / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">Per generation</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="recommendations">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Activity</CardTitle>
                <CardDescription>Generation activity for the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Generations</span>
                  <span className="font-bold">{metrics.realTime.generationsToday}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Success Rate</span>
                  <span className="font-bold">{metrics.realTime.successRateToday.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Duration</span>
                  <span className="font-bold">{(metrics.realTime.averageDurationToday / 1000).toFixed(1)}s</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Current system efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Cache Efficiency</span>
                  <span className={`font-bold capitalize ${getEfficiencyColor(metrics.performance.cacheEfficiency)}`}>
                    {metrics.performance.cacheEfficiency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Memory Efficiency</span>
                  <span className={`font-bold capitalize ${getEfficiencyColor(metrics.performance.memoryEfficiency)}`}>
                    {metrics.performance.memoryEfficiency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Throughput</span>
                  <span className="font-bold">{performance.performance.generation.throughput.toFixed(1)}/hr</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Generation Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Avg Generation Time</span>
                  <span className="font-mono text-sm">
                    {(performance.performance.generation.averageGenerationTime / 1000).toFixed(2)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cache Hit Rate</span>
                  <span className="font-mono text-sm">
                    {(performance.performance.generation.cacheHitRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Throughput</span>
                  <span className="font-mono text-sm">
                    {performance.performance.generation.throughput.toFixed(1)}/hr
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Validation Time</span>
                  <span className="font-mono text-sm">
                    {performance.performance.system.averageValidationTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span className="font-mono text-sm">
                    {(performance.performance.system.memoryUsage / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Error Rate</span>
                  <span className="font-mono text-sm">
                    {(performance.performance.system.errorRate * 100).toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-mono text-sm">
                    {performance.success.successRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Generations</span>
                  <span className="font-mono text-sm">
                    {performance.success.totalGenerations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Duration</span>
                  <span className="font-mono text-sm">
                    {(performance.success.averageDuration / 1000).toFixed(2)}s
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
                <CardDescription>Current cache performance and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Hit Rate</span>
                  <span className="font-bold">{(metrics.cache.hitRate * 100).toFixed(1)}%</span>
                </div>
                <Progress value={metrics.cache.hitRate * 100} className="w-full" />
                
                <div className="flex justify-between items-center">
                  <span>Total Entries</span>
                  <span className="font-bold">{metrics.cache.totalEntries}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Memory Usage</span>
                  <span className="font-bold">
                    {(metrics.cache.memoryUsage / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Total Size</span>
                  <span className="font-bold">
                    {(metrics.cache.totalSize / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Management</CardTitle>
                <CardDescription>Optimize cache performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleOptimizeMemory}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Memory
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleClearCache}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Clear All Cache
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  <p>• Optimize Memory: Remove least recently used entries</p>
                  <p>• Clear Cache: Remove all cached data</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
              <CardDescription>
                AI-generated insights to improve system performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performance.recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {performance.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  No specific recommendations at this time. System is performing well!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(metrics.timestamp).toLocaleString()}
      </div>
    </div>
  )
}