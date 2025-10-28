/**
 * Full-Stack Generation Cache System
 * 
 * Implements template caching, incremental generation, and memory optimization
 * for faster full-stack dApp generation with complex project structures.
 */

import { 
  FullStackGenerationOptions, 
  FullStackGenerationResult, 
  GeneratedContract, 
  GeneratedComponent, 
  GeneratedAPIRoute,
  ParsedPromptResult,
  ProjectStructure
} from './vibesdk'
import { QALogger } from './quality-assurance/logger'

export interface CacheEntry<T = any> {
  key: string
  data: T
  timestamp: number
  accessCount: number
  size: number
  dependencies: string[]
  version: string
}

export interface TemplateCacheEntry extends CacheEntry {
  data: {
    code: string
    metadata: {
      contractType: string
      complexity: 'simple' | 'intermediate' | 'advanced'
      features: string[]
      dependencies: string[]
    }
  }
}

export interface ComponentCacheEntry extends CacheEntry {
  data: {
    code: string
    componentType: 'page' | 'component' | 'layout'
    contractIntegrations: string[]
    dependencies: string[]
  }
}

export interface ProjectCacheEntry extends CacheEntry {
  data: {
    structure: ProjectStructure
    generationOptions: FullStackGenerationOptions
    parsedPrompt: ParsedPromptResult
  }
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  memoryUsage: number
  evictionCount: number
  lastCleanup: Date
}

export interface CacheConfig {
  maxMemoryUsage: number // bytes
  maxEntries: number
  ttlMs: number // time to live in milliseconds
  enableCompression: boolean
  enableIncrementalGeneration: boolean
  cleanupIntervalMs: number
}

export class FullStackGenerationCache {
  private templateCache = new Map<string, TemplateCacheEntry>()
  private componentCache = new Map<string, ComponentCacheEntry>()
  private projectCache = new Map<string, ProjectCacheEntry>()
  private integrationCache = new Map<string, CacheEntry>()
  
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    memoryUsage: 0,
    evictionCount: 0,
    lastCleanup: new Date()
  }
  
  private config: CacheConfig
  private logger: QALogger
  private hitCount = 0
  private missCount = 0

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxEntries: 1000,
      ttlMs: 30 * 60 * 1000, // 30 minutes
      enableCompression: true,
      enableIncrementalGeneration: true,
      cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
      ...config
    }

    this.logger = new QALogger({
      level: 'info',
      enableMetrics: true,
      enablePerformanceTracking: true,
      maxLogSize: 1000
    })

    this.startCleanupInterval()
  }

  /**
   * Cache a generated smart contract template
   */
  cacheTemplate(
    contractType: string,
    features: string[],
    complexity: 'simple' | 'intermediate' | 'advanced',
    code: string,
    dependencies: string[] = []
  ): string {
    const key = this.generateTemplateKey(contractType, features, complexity)
    
    const entry: TemplateCacheEntry = {
      key,
      data: {
        code,
        metadata: {
          contractType,
          complexity,
          features: [...features].sort(),
          dependencies
        }
      },
      timestamp: Date.now(),
      accessCount: 1,
      size: this.estimateSize(code),
      dependencies,
      version: '1.0'
    }

    this.templateCache.set(key, entry)
    this.updateStats()
    
    this.logger.debug('Template cached', { 
      key, 
      contractType, 
      features, 
      complexity,
      size: entry.size 
    })

    return key
  }

  /**
   * Retrieve cached template
   */
  getTemplate(
    contractType: string,
    features: string[],
    complexity: 'simple' | 'intermediate' | 'advanced'
  ): string | null {
    const key = this.generateTemplateKey(contractType, features, complexity)
    const entry = this.templateCache.get(key)

    if (!entry) {
      this.missCount++
      return null
    }

    if (this.isExpired(entry)) {
      this.templateCache.delete(key)
      this.missCount++
      return null
    }

    entry.accessCount++
    entry.timestamp = Date.now()
    this.hitCount++
    
    this.logger.debug('Template cache hit', { key, contractType, features })
    
    return entry.data.code
  }

  /**
   * Cache a generated React component
   */
  cacheComponent(
    componentName: string,
    componentType: 'page' | 'component' | 'layout',
    contractIntegrations: string[],
    code: string,
    dependencies: string[] = []
  ): string {
    const key = this.generateComponentKey(componentName, componentType, contractIntegrations)
    
    const entry: ComponentCacheEntry = {
      key,
      data: {
        code,
        componentType,
        contractIntegrations: [...contractIntegrations].sort(),
        dependencies
      },
      timestamp: Date.now(),
      accessCount: 1,
      size: this.estimateSize(code),
      dependencies,
      version: '1.0'
    }

    this.componentCache.set(key, entry)
    this.updateStats()
    
    this.logger.debug('Component cached', { 
      key, 
      componentName, 
      componentType,
      contractIntegrations,
      size: entry.size 
    })

    return key
  }

  /**
   * Retrieve cached component
   */
  getComponent(
    componentName: string,
    componentType: 'page' | 'component' | 'layout',
    contractIntegrations: string[]
  ): string | null {
    const key = this.generateComponentKey(componentName, componentType, contractIntegrations)
    const entry = this.componentCache.get(key)

    if (!entry) {
      this.missCount++
      return null
    }

    if (this.isExpired(entry)) {
      this.componentCache.delete(key)
      this.missCount++
      return null
    }

    entry.accessCount++
    entry.timestamp = Date.now()
    this.hitCount++
    
    this.logger.debug('Component cache hit', { key, componentName, componentType })
    
    return entry.data.code
  }

  /**
   * Cache project structure for incremental generation
   */
  cacheProjectStructure(
    projectName: string,
    options: FullStackGenerationOptions,
    parsedPrompt: ParsedPromptResult,
    structure: ProjectStructure
  ): string {
    const key = this.generateProjectKey(projectName, options, parsedPrompt)
    
    const entry: ProjectCacheEntry = {
      key,
      data: {
        structure,
        generationOptions: options,
        parsedPrompt
      },
      timestamp: Date.now(),
      accessCount: 1,
      size: this.estimateSize(structure),
      dependencies: [],
      version: '1.0'
    }

    this.projectCache.set(key, entry)
    this.updateStats()
    
    this.logger.debug('Project structure cached', { 
      key, 
      projectName,
      size: entry.size 
    })

    return key
  }

  /**
   * Get cached project structure
   */
  getProjectStructure(
    projectName: string,
    options: FullStackGenerationOptions,
    parsedPrompt: ParsedPromptResult
  ): ProjectStructure | null {
    const key = this.generateProjectKey(projectName, options, parsedPrompt)
    const entry = this.projectCache.get(key)

    if (!entry) {
      this.missCount++
      return null
    }

    if (this.isExpired(entry)) {
      this.projectCache.delete(key)
      this.missCount++
      return null
    }

    entry.accessCount++
    entry.timestamp = Date.now()
    this.hitCount++
    
    this.logger.debug('Project structure cache hit', { key, projectName })
    
    return entry.data.structure
  }

  /**
   * Cache integration code (hooks, utilities, types)
   */
  cacheIntegration(
    integrationType: 'hooks' | 'utilities' | 'types',
    contractNames: string[],
    code: string
  ): string {
    const key = this.generateIntegrationKey(integrationType, contractNames)
    
    const entry: CacheEntry = {
      key,
      data: code,
      timestamp: Date.now(),
      accessCount: 1,
      size: this.estimateSize(code),
      dependencies: contractNames,
      version: '1.0'
    }

    this.integrationCache.set(key, entry)
    this.updateStats()
    
    this.logger.debug('Integration code cached', { 
      key, 
      integrationType,
      contractNames,
      size: entry.size 
    })

    return key
  }

  /**
   * Get cached integration code
   */
  getIntegration(
    integrationType: 'hooks' | 'utilities' | 'types',
    contractNames: string[]
  ): string | null {
    const key = this.generateIntegrationKey(integrationType, contractNames)
    const entry = this.integrationCache.get(key)

    if (!entry) {
      this.missCount++
      return null
    }

    if (this.isExpired(entry)) {
      this.integrationCache.delete(key)
      this.missCount++
      return null
    }

    entry.accessCount++
    entry.timestamp = Date.now()
    this.hitCount++
    
    this.logger.debug('Integration code cache hit', { key, integrationType })
    
    return entry.data as string
  }

  /**
   * Incremental generation support - check what parts need regeneration
   */
  analyzeIncrementalChanges(
    currentOptions: FullStackGenerationOptions,
    currentParsedPrompt: ParsedPromptResult,
    cachedProjectKey?: string
  ): {
    needsFullRegeneration: boolean
    changedComponents: string[]
    changedContracts: string[]
    changedIntegrations: string[]
    recommendations: string[]
  } {
    if (!this.config.enableIncrementalGeneration || !cachedProjectKey) {
      return {
        needsFullRegeneration: true,
        changedComponents: [],
        changedContracts: [],
        changedIntegrations: [],
        recommendations: ['No cached project found - full generation required']
      }
    }

    const cachedProject = this.projectCache.get(cachedProjectKey)
    if (!cachedProject) {
      return {
        needsFullRegeneration: true,
        changedComponents: [],
        changedContracts: [],
        changedIntegrations: [],
        recommendations: ['Cached project not found - full generation required']
      }
    }

    const cached = cachedProject.data
    const changedComponents: string[] = []
    const changedContracts: string[] = []
    const changedIntegrations: string[] = []
    const recommendations: string[] = []

    // Compare backend requirements
    const backendChanged = this.compareBackendRequirements(
      currentParsedPrompt.backendRequirements,
      cached.parsedPrompt.backendRequirements
    )

    if (backendChanged.hasChanges) {
      changedContracts.push(...backendChanged.changedItems)
      changedIntegrations.push('hooks', 'utilities', 'types')
      recommendations.push('Backend changes detected - contracts and integrations need regeneration')
    }

    // Compare frontend requirements
    const frontendChanged = this.compareFrontendRequirements(
      currentParsedPrompt.frontendRequirements,
      cached.parsedPrompt.frontendRequirements
    )

    if (frontendChanged.hasChanges) {
      changedComponents.push(...frontendChanged.changedItems)
      recommendations.push('Frontend changes detected - components need regeneration')
    }

    // Compare integration requirements
    const integrationChanged = this.compareIntegrationRequirements(
      currentParsedPrompt.integrationRequirements,
      cached.parsedPrompt.integrationRequirements
    )

    if (integrationChanged.hasChanges) {
      changedIntegrations.push(...integrationChanged.changedItems)
      recommendations.push('Integration changes detected - API routes and bindings need regeneration')
    }

    const needsFullRegeneration = 
      currentOptions.projectName !== cached.generationOptions.projectName ||
      currentOptions.uiFramework !== cached.generationOptions.uiFramework ||
      currentOptions.stylingFramework !== cached.generationOptions.stylingFramework ||
      currentOptions.deploymentTarget !== cached.generationOptions.deploymentTarget

    if (needsFullRegeneration) {
      recommendations.push('Core project settings changed - full regeneration required')
    }

    return {
      needsFullRegeneration,
      changedComponents,
      changedContracts,
      changedIntegrations,
      recommendations
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats()
    return { ...this.stats }
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.templateCache.clear()
    this.componentCache.clear()
    this.projectCache.clear()
    this.integrationCache.clear()
    
    this.hitCount = 0
    this.missCount = 0
    this.stats.evictionCount = 0
    
    this.updateStats()
    this.logger.info('All caches cleared')
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    let clearedCount = 0
    const now = Date.now()

    // Clear expired templates
    for (const [key, entry] of this.templateCache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        this.templateCache.delete(key)
        clearedCount++
      }
    }

    // Clear expired components
    for (const [key, entry] of this.componentCache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        this.componentCache.delete(key)
        clearedCount++
      }
    }

    // Clear expired projects
    for (const [key, entry] of this.projectCache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        this.projectCache.delete(key)
        clearedCount++
      }
    }

    // Clear expired integrations
    for (const [key, entry] of this.integrationCache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        this.integrationCache.delete(key)
        clearedCount++
      }
    }

    if (clearedCount > 0) {
      this.updateStats()
      this.logger.debug(`Cleared ${clearedCount} expired cache entries`)
    }

    return clearedCount
  }

  /**
   * Optimize memory usage by evicting least recently used entries
   */
  optimizeMemory(): number {
    const currentMemory = this.calculateMemoryUsage()
    
    if (currentMemory <= this.config.maxMemoryUsage) {
      return 0
    }

    let evictedCount = 0
    const targetMemory = this.config.maxMemoryUsage * 0.8 // Target 80% of max

    // Collect all entries with their access patterns
    const allEntries: Array<{
      key: string
      entry: CacheEntry
      cache: Map<string, any>
      score: number
    }> = []

    // Score entries based on access count, recency, and size
    for (const [key, entry] of this.templateCache.entries()) {
      allEntries.push({
        key,
        entry,
        cache: this.templateCache,
        score: this.calculateEvictionScore(entry)
      })
    }

    for (const [key, entry] of this.componentCache.entries()) {
      allEntries.push({
        key,
        entry,
        cache: this.componentCache,
        score: this.calculateEvictionScore(entry)
      })
    }

    for (const [key, entry] of this.projectCache.entries()) {
      allEntries.push({
        key,
        entry,
        cache: this.projectCache,
        score: this.calculateEvictionScore(entry)
      })
    }

    for (const [key, entry] of this.integrationCache.entries()) {
      allEntries.push({
        key,
        entry,
        cache: this.integrationCache,
        score: this.calculateEvictionScore(entry)
      })
    }

    // Sort by eviction score (lower score = more likely to evict)
    allEntries.sort((a, b) => a.score - b.score)

    // Evict entries until we reach target memory
    let currentSize = currentMemory
    for (const item of allEntries) {
      if (currentSize <= targetMemory) {
        break
      }

      item.cache.delete(item.key)
      currentSize -= item.entry.size
      evictedCount++
    }

    this.stats.evictionCount += evictedCount
    this.updateStats()

    if (evictedCount > 0) {
      this.logger.info(`Evicted ${evictedCount} cache entries to optimize memory usage`)
    }

    return evictedCount
  }

  // Private helper methods

  private generateTemplateKey(
    contractType: string,
    features: string[],
    complexity: 'simple' | 'intermediate' | 'advanced'
  ): string {
    const sortedFeatures = [...features].sort().join(',')
    return `template:${contractType}:${complexity}:${this.hashString(sortedFeatures)}`
  }

  private generateComponentKey(
    componentName: string,
    componentType: 'page' | 'component' | 'layout',
    contractIntegrations: string[]
  ): string {
    const sortedIntegrations = [...contractIntegrations].sort().join(',')
    return `component:${componentName}:${componentType}:${this.hashString(sortedIntegrations)}`
  }

  private generateProjectKey(
    projectName: string,
    options: FullStackGenerationOptions,
    parsedPrompt: ParsedPromptResult
  ): string {
    const optionsHash = this.hashString(JSON.stringify({
      uiFramework: options.uiFramework,
      stylingFramework: options.stylingFramework,
      deploymentTarget: options.deploymentTarget,
      includeFrontend: options.includeFrontend,
      includeAPI: options.includeAPI
    }))
    
    const promptHash = this.hashString(JSON.stringify({
      projectType: parsedPrompt.projectType,
      backendTypes: parsedPrompt.backendRequirements.contractTypes.sort(),
      frontendPages: parsedPrompt.frontendRequirements.pages.sort(),
      frontendComponents: parsedPrompt.frontendRequirements.components.sort()
    }))

    return `project:${projectName}:${optionsHash}:${promptHash}`
  }

  private generateIntegrationKey(
    integrationType: 'hooks' | 'utilities' | 'types',
    contractNames: string[]
  ): string {
    const sortedContracts = [...contractNames].sort().join(',')
    return `integration:${integrationType}:${this.hashString(sortedContracts)}`
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2 // Rough UTF-16 estimate
    } catch {
      return 1000 // Fallback estimate
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.ttlMs
  }

  private calculateMemoryUsage(): number {
    let total = 0
    
    for (const entry of this.templateCache.values()) {
      total += entry.size
    }
    
    for (const entry of this.componentCache.values()) {
      total += entry.size
    }
    
    for (const entry of this.projectCache.values()) {
      total += entry.size
    }
    
    for (const entry of this.integrationCache.values()) {
      total += entry.size
    }
    
    return total
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const age = Date.now() - entry.timestamp
    const ageScore = age / this.config.ttlMs // 0-1, higher = older
    const accessScore = 1 / (entry.accessCount + 1) // Lower access count = higher score
    const sizeScore = entry.size / (1024 * 1024) // Size in MB
    
    // Combine scores (higher = more likely to evict)
    return ageScore * 0.4 + accessScore * 0.4 + sizeScore * 0.2
  }

  private updateStats(): void {
    const totalEntries = 
      this.templateCache.size + 
      this.componentCache.size + 
      this.projectCache.size + 
      this.integrationCache.size

    const totalRequests = this.hitCount + this.missCount
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0

    this.stats = {
      totalEntries,
      totalSize: this.calculateMemoryUsage(),
      hitRate,
      memoryUsage: this.calculateMemoryUsage(),
      evictionCount: this.stats.evictionCount,
      lastCleanup: this.stats.lastCleanup
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.clearExpired()
      this.optimizeMemory()
      this.stats.lastCleanup = new Date()
    }, this.config.cleanupIntervalMs)
  }

  private compareBackendRequirements(
    current: ParsedPromptResult['backendRequirements'],
    cached: ParsedPromptResult['backendRequirements']
  ): { hasChanges: boolean; changedItems: string[] } {
    const changedItems: string[] = []
    
    // Compare contract types
    const currentTypes = new Set(current.contractTypes)
    const cachedTypes = new Set(cached.contractTypes)
    
    for (const type of currentTypes) {
      if (!cachedTypes.has(type)) {
        changedItems.push(type)
      }
    }
    
    for (const type of cachedTypes) {
      if (!currentTypes.has(type)) {
        changedItems.push(type)
      }
    }

    // Compare functions
    const currentFunctions = new Set(current.functions.map(f => f.name))
    const cachedFunctions = new Set(cached.functions.map(f => f.name))
    
    for (const func of currentFunctions) {
      if (!cachedFunctions.has(func)) {
        changedItems.push(`function:${func}`)
      }
    }

    return {
      hasChanges: changedItems.length > 0,
      changedItems
    }
  }

  private compareFrontendRequirements(
    current: ParsedPromptResult['frontendRequirements'],
    cached: ParsedPromptResult['frontendRequirements']
  ): { hasChanges: boolean; changedItems: string[] } {
    const changedItems: string[] = []
    
    // Compare pages
    const currentPages = new Set(current.pages)
    const cachedPages = new Set(cached.pages)
    
    for (const page of currentPages) {
      if (!cachedPages.has(page)) {
        changedItems.push(`page:${page}`)
      }
    }
    
    // Compare components
    const currentComponents = new Set(current.components)
    const cachedComponents = new Set(cached.components)
    
    for (const component of currentComponents) {
      if (!cachedComponents.has(component)) {
        changedItems.push(`component:${component}`)
      }
    }

    return {
      hasChanges: changedItems.length > 0,
      changedItems
    }
  }

  private compareIntegrationRequirements(
    current: ParsedPromptResult['integrationRequirements'],
    cached: ParsedPromptResult['integrationRequirements']
  ): { hasChanges: boolean; changedItems: string[] } {
    const changedItems: string[] = []
    
    // Compare API endpoints
    const currentEndpoints = new Set(current.apiEndpoints)
    const cachedEndpoints = new Set(cached.apiEndpoints)
    
    for (const endpoint of currentEndpoints) {
      if (!cachedEndpoints.has(endpoint)) {
        changedItems.push(`api:${endpoint}`)
      }
    }
    
    // Compare contract bindings
    const currentBindings = new Set(current.contractBindings)
    const cachedBindings = new Set(cached.contractBindings)
    
    for (const binding of currentBindings) {
      if (!cachedBindings.has(binding)) {
        changedItems.push(`binding:${binding}`)
      }
    }

    return {
      hasChanges: changedItems.length > 0,
      changedItems
    }
  }
}

/**
 * Global cache instance
 */
let globalGenerationCache: FullStackGenerationCache | null = null

export function getGenerationCache(config?: Partial<CacheConfig>): FullStackGenerationCache {
  if (!globalGenerationCache) {
    globalGenerationCache = new FullStackGenerationCache(config)
  }
  return globalGenerationCache
}

/**
 * Cache decorator for generation methods
 */
export function cacheGeneration(
  cacheType: 'template' | 'component' | 'project' | 'integration'
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const cache = getGenerationCache()

    descriptor.value = async function (...args: any[]) {
      // Generate cache key based on method arguments
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`
      
      // Try to get from cache first
      let cachedResult: any = null
      
      switch (cacheType) {
        case 'template':
          // Implement template-specific caching logic
          break
        case 'component':
          // Implement component-specific caching logic
          break
        case 'project':
          // Implement project-specific caching logic
          break
        case 'integration':
          // Implement integration-specific caching logic
          break
      }

      if (cachedResult) {
        return cachedResult
      }

      // Cache miss - execute method and cache result
      const result = await method.apply(this, args)
      
      // Cache the result based on type
      // Implementation would depend on the specific caching strategy
      
      return result
    }

    return descriptor
  }
}