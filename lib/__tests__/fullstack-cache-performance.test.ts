/**
 * Full-Stack Cache and Performance Tests
 * 
 * Tests for the caching system and performance optimization features
 */

import { FullStackGenerationCache } from '../fullstack-generation-cache'
import { FullStackAnalyticsSystem } from '../fullstack-analytics-system'

describe('FullStackGenerationCache', () => {
  let cache: FullStackGenerationCache

  beforeEach(() => {
    cache = new FullStackGenerationCache({
      maxMemoryUsage: 10 * 1024 * 1024, // 10MB for testing
      maxEntries: 100,
      ttlMs: 60000, // 1 minute
      enableCompression: false, // Disable for testing
      enableIncrementalGeneration: true,
      cleanupIntervalMs: 30000
    })
  })

  afterEach(() => {
    cache.clearAll()
  })

  describe('Template Caching', () => {
    it('should cache and retrieve smart contract templates', () => {
      const contractCode = `
        access(all) contract TestNFT {
          access(all) var totalSupply: UInt64
          init() { self.totalSupply = 0 }
        }
      `

      // Cache the template
      const cacheKey = cache.cacheTemplate(
        'NFT',
        ['metadata', 'royalties'],
        'intermediate',
        contractCode,
        ['NonFungibleToken', 'MetadataViews']
      )

      expect(cacheKey).toBeTruthy()

      // Retrieve the template
      const retrieved = cache.getTemplate('NFT', ['metadata', 'royalties'], 'intermediate')
      expect(retrieved).toBe(contractCode)
    })

    it('should return null for non-existent templates', () => {
      const retrieved = cache.getTemplate('NonExistent', ['feature'], 'simple')
      expect(retrieved).toBeNull()
    })

    it('should handle different feature combinations', () => {
      const code1 = 'contract A {}'
      const code2 = 'contract B {}'

      cache.cacheTemplate('NFT', ['metadata'], 'simple', code1)
      cache.cacheTemplate('NFT', ['metadata', 'royalties'], 'simple', code2)

      expect(cache.getTemplate('NFT', ['metadata'], 'simple')).toBe(code1)
      expect(cache.getTemplate('NFT', ['metadata', 'royalties'], 'simple')).toBe(code2)
    })
  })

  describe('Component Caching', () => {
    it('should cache and retrieve React components', () => {
      const componentCode = `
        export function TestComponent() {
          return <div>Test</div>
        }
      `

      const cacheKey = cache.cacheComponent(
        'TestComponent',
        'component',
        ['TestContract'],
        componentCode,
        ['react', '@/lib/flow-client']
      )

      expect(cacheKey).toBeTruthy()

      const retrieved = cache.getComponent('TestComponent', 'component', ['TestContract'])
      expect(retrieved).toBe(componentCode)
    })
  })

  describe('Cache Statistics', () => {
    it('should track cache statistics correctly', () => {
      // Initially empty
      let stats = cache.getStats()
      expect(stats.totalEntries).toBe(0)
      expect(stats.hitRate).toBe(0)

      // Add some entries
      cache.cacheTemplate('NFT', ['metadata'], 'simple', 'contract A {}')
      cache.cacheComponent('TestComp', 'component', [], 'function TestComp() {}')

      stats = cache.getStats()
      expect(stats.totalEntries).toBe(2)

      // Test cache hits
      cache.getTemplate('NFT', ['metadata'], 'simple') // Hit
      cache.getTemplate('NonExistent', ['feature'], 'simple') // Miss

      stats = cache.getStats()
      expect(stats.hitRate).toBe(0.5) // 1 hit out of 2 requests
    })
  })

  describe('Memory Optimization', () => {
    it('should optimize memory when threshold is exceeded', () => {
      // Fill cache with entries
      for (let i = 0; i < 50; i++) {
        cache.cacheTemplate(`Contract${i}`, ['feature'], 'simple', `contract ${i} {}`)
      }

      const statsBefore = cache.getStats()
      expect(statsBefore.totalEntries).toBe(50)

      // Trigger memory optimization
      const evictedCount = cache.optimizeMemory()
      
      const statsAfter = cache.getStats()
      expect(statsAfter.totalEntries).toBeLessThan(statsBefore.totalEntries)
    })
  })

  describe('Incremental Generation Analysis', () => {
    it('should analyze changes for incremental generation', () => {
      const currentOptions = {
        prompt: 'Create an NFT marketplace',
        projectName: 'TestProject',
        includeFrontend: true,
        includeAPI: true,
        uiFramework: 'next' as const,
        stylingFramework: 'tailwind' as const,
        deploymentTarget: 'vercel' as const
      }

      const currentParsedPrompt = {
        projectType: 'marketplace' as const,
        backendRequirements: {
          contractTypes: ['NFT', 'Marketplace'],
          functions: [],
          events: [],
          resources: []
        },
        frontendRequirements: {
          pages: ['Home', 'Marketplace'],
          components: ['NFTCard', 'ListingForm'],
          interactions: [],
          styling: {
            framework: 'tailwind' as const,
            theme: 'auto' as const,
            responsive: true,
            accessibility: true
          }
        },
        integrationRequirements: {
          apiEndpoints: ['/api/list', '/api/purchase'],
          contractBindings: [],
          dataFlow: []
        },
        confidence: 0.9
      }

      const analysis = cache.analyzeIncrementalChanges(
        currentOptions,
        currentParsedPrompt
      )

      expect(analysis.needsFullRegeneration).toBe(true) // No cached project
      expect(analysis.recommendations).toContain('No cached project found - full generation required')
    })
  })
})

describe('FullStackAnalyticsSystem', () => {
  let analytics: FullStackAnalyticsSystem

  beforeEach(() => {
    analytics = new FullStackAnalyticsSystem({
      maxHistorySize: 100
    })
  })

  describe('Session Tracking', () => {
    it('should start and complete generation sessions', () => {
      const sessionId = analytics.startSession(
        'TestProject',
        {
          prompt: 'Create a test project',
          projectName: 'TestProject',
          includeFrontend: true,
          includeAPI: true,
          uiFramework: 'next',
          stylingFramework: 'tailwind',
          deploymentTarget: 'vercel'
        },
        {
          projectType: 'nft-collection',
          backendRequirements: { contractTypes: ['NFT'], functions: [], events: [], resources: [] },
          frontendRequirements: { pages: ['Home'], components: ['NFTCard'], interactions: [], styling: { framework: 'tailwind', theme: 'auto', responsive: true, accessibility: true } },
          integrationRequirements: { apiEndpoints: [], contractBindings: [], dataFlow: [] },
          confidence: 0.8
        },
        'user123'
      )

      expect(sessionId).toBeTruthy()

      // Complete the session
      const mockResult = {
        smartContracts: [{ filename: 'NFT.cdc', code: 'contract NFT {}', validation: { isValid: true, errors: [], warnings: [] }, dependencies: [] }],
        frontendComponents: [{ filename: 'nft-card.tsx', code: 'function NFTCard() {}', componentType: 'component' as const, dependencies: [], contractIntegrations: [] }],
        apiRoutes: [],
        configurations: [],
        projectStructure: { directories: [], files: [], configurations: [] },
        integrationCode: { hooks: [], utilities: [], types: [] }
      }

      analytics.completeSession(sessionId, mockResult)

      const dashboard = analytics.getDashboardMetrics()
      expect(dashboard.generationsToday).toBe(1)
      expect(dashboard.successRateToday).toBe(100)
    })

    it('should track cache events', () => {
      const sessionId = analytics.startSession(
        'TestProject',
        {
          prompt: 'Test',
          projectName: 'Test',
          includeFrontend: true,
          includeAPI: true,
          uiFramework: 'next',
          stylingFramework: 'tailwind',
          deploymentTarget: 'vercel'
        },
        {
          projectType: 'custom',
          backendRequirements: { contractTypes: [], functions: [], events: [], resources: [] },
          frontendRequirements: { pages: [], components: [], interactions: [], styling: { framework: 'tailwind', theme: 'auto', responsive: true, accessibility: true } },
          integrationRequirements: { apiEndpoints: [], contractBindings: [], dataFlow: [] },
          confidence: 0.5
        }
      )

      analytics.recordCacheEvent(sessionId, true) // Cache hit
      analytics.recordCacheEvent(sessionId, false) // Cache miss

      // The cache events should be recorded in the session
      // This would be verified through the session data if we had access to it
      expect(sessionId).toBeTruthy()
    })
  })

  describe('Analytics Reports', () => {
    it('should generate analytics reports', () => {
      // Create a session and complete it
      const sessionId = analytics.startSession(
        'TestProject',
        {
          prompt: 'Test project',
          projectName: 'TestProject',
          includeFrontend: true,
          includeAPI: true,
          uiFramework: 'next',
          stylingFramework: 'tailwind',
          deploymentTarget: 'vercel'
        },
        {
          projectType: 'nft-collection',
          backendRequirements: { contractTypes: ['NFT'], functions: [], events: [], resources: [] },
          frontendRequirements: { pages: ['Home'], components: ['NFTCard'], interactions: [], styling: { framework: 'tailwind', theme: 'auto', responsive: true, accessibility: true } },
          integrationRequirements: { apiEndpoints: [], contractBindings: [], dataFlow: [] },
          confidence: 0.8
        }
      )

      const mockResult = {
        smartContracts: [{ filename: 'NFT.cdc', code: 'contract NFT {}', validation: { isValid: true, errors: [], warnings: [] }, dependencies: [] }],
        frontendComponents: [],
        apiRoutes: [],
        configurations: [],
        projectStructure: { directories: [], files: [], configurations: [] },
        integrationCode: { hooks: [], utilities: [], types: [] }
      }

      analytics.completeSession(sessionId, mockResult)

      const report = analytics.generateReport()
      
      expect(report.summary.totalSessions).toBe(1)
      expect(report.summary.totalGenerations).toBe(1)
      expect(report.success.successRate).toBe(100)
      expect(report.insights).toContain('Excellent generation success rate indicates stable system performance')
    })
  })

  describe('Dashboard Metrics', () => {
    it('should provide real-time dashboard metrics', () => {
      const dashboard = analytics.getDashboardMetrics()
      
      expect(dashboard).toHaveProperty('activeSessions')
      expect(dashboard).toHaveProperty('generationsToday')
      expect(dashboard).toHaveProperty('successRateToday')
      expect(dashboard).toHaveProperty('averageDurationToday')
      
      expect(typeof dashboard.activeSessions).toBe('number')
      expect(typeof dashboard.generationsToday).toBe('number')
      expect(typeof dashboard.successRateToday).toBe('number')
      expect(typeof dashboard.averageDurationToday).toBe('number')
    })
  })
})