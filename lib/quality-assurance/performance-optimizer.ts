/**
 * Performance Optimizer for Quality Assurance Pipeline
 * 
 * Implements caching, parallel processing, and performance monitoring
 * to ensure validation runs within 100ms response time.
 */

import { ValidationResult, CodeLocation, QualityScore } from './types'
import { QALogger, getLogger } from './logger'

export interface PerformanceMetrics {
  totalTime: number
  validationTime: number
  cacheHits: number
  cacheMisses: number
  parallelTasks: number
  memoryUsage: number
  cpuUsage?: number
}

export interface CacheEntry {
  key: string
  result: any
  timestamp: number
  accessCount: number
  size: number
}

export interface ValidationCache {
  syntaxCache: Map<string, any>
  errorCache: Map<string, any>
  undefinedCache: Map<string, any>
  qualityCache: Map<string, QualityScore>
  patternCache: Map<string, RegExpMatchArray[]>
}

export interface PerformanceConfig {
  maxCacheSize: number
  cacheExpirationMs: number
  maxParallelTasks: number
  enableProfiling: boolean
  targetResponseTime: number
  memoryThreshold: number
}

export class PerformanceOptimizer {
  private cache: ValidationCache
  private metrics: PerformanceMetrics
  private config: PerformanceConfig
  private logger: QALogger
  private cacheStats: Map<string, { hits: number; misses: number }>

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      maxCacheSize: 1000,
      cacheExpirationMs: 5 * 60 * 1000, // 5 minutes
      maxParallelTasks: 4,
      enableProfiling: true,
      targetResponseTime: 100, // 100ms
      memoryThreshold: 100 * 1024 * 1024, // 100MB
      ...config
    }

    this.cache = {
      syntaxCache: new Map(),
      errorCache: new Map(),
      undefinedCache: new Map(),
      qualityCache: new Map(),
      patternCache: new Map()
    }

    this.metrics = {
      totalTime: 0,
      validationTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      parallelTasks: 0,
      memoryUsage: 0
    }

    this.cacheStats = new Map()
    this.logger = getLogger()

    // Start cache cleanup interval
    this.startCacheCleanup()
  }

  /**
   * Optimized validation with caching and parallel processing
   */
  async optimizedValidation<T>(
    cacheKey: string,
    validationFn: () => Promise<T> | T,
    cacheType: keyof ValidationCache = 'syntaxCache'
  ): Promise<T> {
    const startTime = performance.now()

    // Check cache first
    const cachedResult = this.getCachedResult<T>(cacheKey, cacheType)
    if (cachedResult !== null) {
      this.metrics.cacheHits++
      this.updateCacheStats(cacheType, 'hit')
      return cachedResult
    }

    // Cache miss - perform validation
    this.metrics.cacheMisses++
    this.updateCacheStats(cacheType, 'miss')

    const result = await validationFn()
    
    // Cache the result
    this.setCachedResult(cacheKey, result, cacheType)

    const duration = performance.now() - startTime
    this.metrics.validationTime += duration

    return result
  }

  /**
   * Parallel validation execution
   */
  async executeParallelValidations<T>(
    validations: Array<{
      name: string
      fn: () => Promise<T> | T
      cacheKey?: string
      cacheType?: keyof ValidationCache
    }>
  ): Promise<T[]> {
    const startTime = performance.now()
    
    // Limit concurrent executions
    const chunks = this.chunkArray(validations, this.config.maxParallelTasks)
    const results: T[] = []

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (validation) => {
        if (validation.cacheKey && validation.cacheType) {
          return this.optimizedValidation(
            validation.cacheKey,
            validation.fn,
            validation.cacheType
          )
        } else {
          return validation.fn()
        }
      })

      const chunkResults = await Promise.all(chunkPromises)
      results.push(...chunkResults)
      this.metrics.parallelTasks += chunk.length
    }

    const duration = performance.now() - startTime
    this.metrics.totalTime += duration

    return results
  }

  /**
   * Optimized pattern matching with caching
   */
  getCachedPatternMatches(code: string, pattern: RegExp, patternName: string): RegExpMatchArray[] {
    const cacheKey = this.generatePatternCacheKey(code, pattern, patternName)
    
    const cached = this.cache.patternCache.get(cacheKey)
    if (cached) {
      this.metrics.cacheHits++
      return cached
    }

    // Perform pattern matching
    const matches = Array.from(code.matchAll(pattern))
    
    // Cache the results
    this.cache.patternCache.set(cacheKey, matches)
    this.metrics.cacheMisses++

    return matches
  }

  /**
   * Fast code hashing for cache keys
   */
  generateCodeHash(code: string): string {
    // Simple but fast hash function for cache keys
    let hash = 0
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  /**
   * Optimized location finding with caching
   */
  findLocationInCodeOptimized(code: string, index: number): CodeLocation {
    const cacheKey = `location_${this.generateCodeHash(code)}_${index}`
    
    const cached = this.getCachedResult<CodeLocation>(cacheKey, 'syntaxCache')
    if (cached) {
      return cached
    }

    // Calculate location
    const beforeMatch = code.substring(0, index)
    const lines = beforeMatch.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length

    const location: CodeLocation = { line, column }
    
    // Cache the result
    this.setCachedResult(cacheKey, location, 'syntaxCache')
    
    return location
  }

  /**
   * Memory-efficient code chunking for large files
   */
  processCodeInChunks<T>(
    code: string,
    chunkSize: number,
    processor: (chunk: string, offset: number) => T[]
  ): T[] {
    const results: T[] = []
    
    for (let i = 0; i < code.length; i += chunkSize) {
      const chunk = code.substring(i, i + chunkSize)
      const chunkResults = processor(chunk, i)
      results.push(...chunkResults)
    }

    return results
  }

  /**
   * Performance monitoring and alerting
   */
  monitorPerformance(): PerformanceMetrics {
    // Update memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.metrics.memoryUsage = process.memoryUsage().heapUsed
    }

    // Check if performance is degrading
    if (this.metrics.totalTime > this.config.targetResponseTime) {
      this.logger.warn('Performance degradation detected', {
        actualTime: this.metrics.totalTime,
        targetTime: this.config.targetResponseTime,
        cacheHitRate: this.getCacheHitRate()
      })
    }

    // Check memory usage
    if (this.metrics.memoryUsage > this.config.memoryThreshold) {
      this.logger.warn('High memory usage detected', {
        memoryUsage: this.metrics.memoryUsage,
        threshold: this.config.memoryThreshold
      })
      this.performEmergencyCleanup()
    }

    return { ...this.metrics }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    metrics: PerformanceMetrics
    cacheStats: Record<string, { hits: number; misses: number; hitRate: number }>
    cacheSize: Record<keyof ValidationCache, number>
  } {
    const cacheStats: Record<string, { hits: number; misses: number; hitRate: number }> = {}
    
    for (const [key, stats] of this.cacheStats.entries()) {
      const total = stats.hits + stats.misses
      cacheStats[key] = {
        ...stats,
        hitRate: total > 0 ? stats.hits / total : 0
      }
    }

    const cacheSize = {
      syntaxCache: this.cache.syntaxCache.size,
      errorCache: this.cache.errorCache.size,
      undefinedCache: this.cache.undefinedCache.size,
      qualityCache: this.cache.qualityCache.size,
      patternCache: this.cache.patternCache.size
    }

    return {
      metrics: { ...this.metrics },
      cacheStats,
      cacheSize
    }
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalTime: 0,
      validationTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      parallelTasks: 0,
      memoryUsage: 0
    }
    this.cacheStats.clear()
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.cache.syntaxCache.clear()
    this.cache.errorCache.clear()
    this.cache.undefinedCache.clear()
    this.cache.qualityCache.clear()
    this.cache.patternCache.clear()
    
    this.logger.info('All caches cleared')
  }

  // Private helper methods

  private getCachedResult<T>(key: string, cacheType: keyof ValidationCache): T | null {
    const cache = this.cache[cacheType] as Map<string, CacheEntry>
    const entry = cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check expiration
    if (Date.now() - entry.timestamp > this.config.cacheExpirationMs) {
      cache.delete(key)
      return null
    }

    // Update access count
    entry.accessCount++
    
    return entry.result as T
  }

  private setCachedResult<T>(key: string, result: T, cacheType: keyof ValidationCache): void {
    const cache = this.cache[cacheType] as Map<string, CacheEntry>
    
    // Check cache size limit
    if (cache.size >= this.config.maxCacheSize) {
      this.evictLeastRecentlyUsed(cache)
    }

    const entry: CacheEntry = {
      key,
      result,
      timestamp: Date.now(),
      accessCount: 1,
      size: this.estimateSize(result)
    }

    cache.set(key, entry)
  }

  private generatePatternCacheKey(code: string, pattern: RegExp, patternName: string): string {
    const codeHash = this.generateCodeHash(code)
    const patternHash = this.generateCodeHash(pattern.source + pattern.flags)
    return `pattern_${patternName}_${codeHash}_${patternHash}`
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private updateCacheStats(cacheType: string, type: 'hit' | 'miss'): void {
    if (!this.cacheStats.has(cacheType)) {
      this.cacheStats.set(cacheType, { hits: 0, misses: 0 })
    }
    
    const stats = this.cacheStats.get(cacheType)!
    if (type === 'hit') {
      stats.hits++
    } else {
      stats.misses++
    }
  }

  private getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses
    return total > 0 ? this.metrics.cacheHits / total : 0
  }

  private evictLeastRecentlyUsed(cache: Map<string, CacheEntry>): void {
    let lruKey = ''
    let lruTimestamp = Date.now()
    let lruAccessCount = Infinity

    for (const [key, entry] of cache.entries()) {
      if (entry.accessCount < lruAccessCount || 
          (entry.accessCount === lruAccessCount && entry.timestamp < lruTimestamp)) {
        lruKey = key
        lruTimestamp = entry.timestamp
        lruAccessCount = entry.accessCount
      }
    }

    if (lruKey) {
      cache.delete(lruKey)
    }
  }

  private estimateSize(obj: any): number {
    // Simple size estimation
    const str = JSON.stringify(obj)
    return str.length * 2 // Rough estimate for UTF-16
  }

  private startCacheCleanup(): void {
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanupExpiredEntries()
    }, 60000)
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [cacheType, cache] of Object.entries(this.cache)) {
      const cacheMap = cache as Map<string, CacheEntry>
      
      for (const [key, entry] of cacheMap.entries()) {
        if (now - entry.timestamp > this.config.cacheExpirationMs) {
          cacheMap.delete(key)
          cleanedCount++
        }
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`)
    }
  }

  private performEmergencyCleanup(): void {
    // Clear half of each cache, keeping most recently used entries
    for (const [cacheType, cache] of Object.entries(this.cache)) {
      const cacheMap = cache as Map<string, CacheEntry>
      const entries = Array.from(cacheMap.entries())
      
      // Sort by access count and timestamp (most recently used first)
      entries.sort((a, b) => {
        if (a[1].accessCount !== b[1].accessCount) {
          return b[1].accessCount - a[1].accessCount
        }
        return b[1].timestamp - a[1].timestamp
      })

      // Keep only the first half
      const keepCount = Math.floor(entries.length / 2)
      cacheMap.clear()
      
      for (let i = 0; i < keepCount; i++) {
        cacheMap.set(entries[i][0], entries[i][1])
      }
    }

    this.logger.warn('Emergency cache cleanup performed due to high memory usage')
  }
}

/**
 * Performance monitoring decorator
 */
export function performanceMonitor(target: any, propertyName: string, descriptor?: PropertyDescriptor) {
  if (!descriptor) {
    // Handle case where descriptor is undefined
    return target
  }
  
  const method = descriptor.value

  if (typeof method !== 'function') {
    return descriptor
  }

  descriptor.value = async function (...args: any[]) {
    const startTime = performance.now()
    
    try {
      const result = await method.apply(this, args)
      const duration = performance.now() - startTime
      
      if (this.logger) {
        this.logger.debug(`${propertyName} completed in ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      if (this.logger) {
        this.logger.error(`${propertyName} failed after ${duration.toFixed(2)}ms`, error)
      }
      
      throw error
    }
  }

  return descriptor
}

/**
 * Batch processing utility for large validation tasks
 */
export class BatchProcessor<T, R> {
  private batchSize: number
  private maxConcurrency: number

  constructor(batchSize: number = 100, maxConcurrency: number = 4) {
    this.batchSize = batchSize
    this.maxConcurrency = maxConcurrency
  }

  async processBatches(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const batches: T[][] = []
    
    // Create batches
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize))
    }

    const results: R[] = []
    
    // Process batches with limited concurrency
    for (let i = 0; i < batches.length; i += this.maxConcurrency) {
      const concurrentBatches = batches.slice(i, i + this.maxConcurrency)
      const batchPromises = concurrentBatches.map(batch => processor(batch))
      const batchResults = await Promise.all(batchPromises)
      
      for (const batchResult of batchResults) {
        results.push(...batchResult)
      }
    }

    return results
  }
}