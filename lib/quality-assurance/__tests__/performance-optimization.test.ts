/**
 * Performance Optimization Tests
 * 
 * Tests to ensure quality assurance validation runs within 100ms response time
 * and validates caching, parallel processing, and performance monitoring.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { PerformanceOptimizer, BatchProcessor } from '../performance-optimizer'
import { OptimizedValidationSystem } from '../optimized-validation-system'
import { initializeLogger } from '../logger'

describe('Performance Optimization', () => {
  let performanceOptimizer: PerformanceOptimizer | undefined
  let optimizedValidationSystem: OptimizedValidationSystem | undefined

  beforeEach(() => {
    // Initialize logger for tests
    initializeLogger({
      level: 'error', // Reduce log noise in tests
      enableConsole: false,
      enableFile: false
    })

    try {
      performanceOptimizer = new PerformanceOptimizer({
        maxCacheSize: 100,
        cacheExpirationMs: 60000,
        maxParallelTasks: 4,
        targetResponseTime: 100
      })

      optimizedValidationSystem = new OptimizedValidationSystem({
        enableCaching: true,
        enableParallelProcessing: true,
        maxValidationTime: 100,
        cacheSize: 100,
        maxConcurrency: 4
      })
    } catch (error) {
      console.warn('Failed to initialize test objects:', error)
    }
  })

  afterEach(() => {
    try {
      performanceOptimizer?.clearCaches()
      optimizedValidationSystem?.clearPerformanceCaches()
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  })

  describe('PerformanceOptimizer', () => {
    test('should cache validation results', async () => {
      if (!performanceOptimizer) {
        expect.fail('PerformanceOptimizer not initialized')
        return
      }

      const testFunction = () => Promise.resolve({ result: 'test-data', timestamp: Date.now() })
      
      // First call - should execute function
      const result1 = await performanceOptimizer.optimizedValidation('test-key', testFunction)
      
      // Second call - should use cache
      const result2 = await performanceOptimizer.optimizedValidation('test-key', testFunction)
      
      expect(result1).toEqual(result2)
      
      const stats = performanceOptimizer.getPerformanceStats()
      expect(stats.metrics.cacheHits).toBeGreaterThan(0)
    })

    test('should execute parallel validations', async () => {
      const validations = [
        { name: 'task1', fn: () => Promise.resolve('result1') },
        { name: 'task2', fn: () => Promise.resolve('result2') },
        { name: 'task3', fn: () => Promise.resolve('result3') }
      ]

      const startTime = performance.now()
      const results = await performanceOptimizer.executeParallelValidations(validations)
      const duration = performance.now() - startTime

      expect(results).toEqual(['result1', 'result2', 'result3'])
      expect(duration).toBeLessThan(100) // Should be fast due to parallel execution
    })

    test('should generate fast code hashes', () => {
      const code = 'access(all) contract TestContract { init() {} }'
      
      const startTime = performance.now()
      const hash = performanceOptimizer.generateCodeHash(code)
      const duration = performance.now() - startTime

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(duration).toBeLessThan(1) // Should be very fast
    })

    test('should cache pattern matches', () => {
      const code = 'access(all) fun test() {} access(all) fun test2() {}'
      const pattern = /access\(all\)\s+fun\s+\w+/g
      
      // First call
      const matches1 = performanceOptimizer.getCachedPatternMatches(code, pattern, 'functions')
      
      // Second call - should use cache
      const matches2 = performanceOptimizer.getCachedPatternMatches(code, pattern, 'functions')
      
      expect(matches1).toEqual(matches2)
      expect(matches1).toHaveLength(2)
    })

    test('should monitor performance metrics', () => {
      const metrics = performanceOptimizer.monitorPerformance()
      
      expect(metrics).toHaveProperty('totalTime')
      expect(metrics).toHaveProperty('validationTime')
      expect(metrics).toHaveProperty('cacheHits')
      expect(metrics).toHaveProperty('cacheMisses')
      expect(metrics).toHaveProperty('parallelTasks')
      expect(metrics).toHaveProperty('memoryUsage')
    })

    test('should evict least recently used cache entries', async () => {
      // Fill cache beyond capacity
      const cacheSize = 5
      const optimizer = new PerformanceOptimizer({ maxCacheSize: cacheSize })
      
      // Add more entries than cache size
      for (let i = 0; i < cacheSize + 2; i++) {
        await optimizer.optimizedValidation(`key-${i}`, () => `result-${i}`)
      }
      
      const stats = optimizer.getPerformanceStats()
      expect(stats.cacheSize.syntaxCache).toBeLessThanOrEqual(cacheSize)
    })
  })

  describe('OptimizedValidationSystem', () => {
    test('should validate code within 100ms target', async () => {
      const testCode = `
        access(all) contract TestContract {
          access(all) var value: String
          
          init() {
            self.value = "test"
          }
          
          access(all) fun getValue(): String {
            return self.value
          }
        }
      `

      const startTime = performance.now()
      const result = await optimizedValidationSystem.validateCodeOptimized(testCode)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(100) // Must be under 100ms
      expect(result).toHaveProperty('performanceReport')
      expect(result.performanceReport.totalTime).toBeLessThan(100)
    })

    test('should use caching for repeated validations', async () => {
      const testCode = 'access(all) contract Test { init() {} }'

      // First validation
      const result1 = await optimizedValidationSystem.validateCodeOptimized(testCode)
      
      // Second validation - should be faster due to caching
      const startTime = performance.now()
      const result2 = await optimizedValidationSystem.validateCodeOptimized(testCode)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(10) // Should be very fast from cache
      expect(result1.isValid).toBe(result2.isValid)
    })

    test('should handle large code files efficiently', async () => {
      // Generate a large code file
      const largeCode = `
        access(all) contract LargeContract {
          init() {}
          ${Array.from({ length: 100 }, (_, i) => `
            access(all) fun function${i}(): String {
              return "function${i}"
            }
          `).join('\n')}
        }
      `

      const startTime = performance.now()
      const result = await optimizedValidationSystem.validateLargeCodeFile(largeCode)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(200) // Allow slightly more time for large files
      expect(result.isValid).toBeDefined()
    })

    test('should provide detailed performance metrics', async () => {
      const testCode = 'access(all) contract Test { init() {} }'
      
      await optimizedValidationSystem.validateCodeOptimized(testCode)
      const metrics = optimizedValidationSystem.getPerformanceMetrics()

      expect(metrics).toHaveProperty('totalTime')
      expect(metrics).toHaveProperty('cacheHitRate')
      expect(metrics).toHaveProperty('parallelTasksExecuted')
      expect(metrics).toHaveProperty('memoryUsage')
      expect(metrics).toHaveProperty('validationSteps')
      expect(metrics).toHaveProperty('cacheStats')
      expect(metrics).toHaveProperty('systemMetrics')
    })

    test('should optimize configuration based on performance', () => {
      // This test verifies the optimization logic exists
      expect(() => {
        optimizedValidationSystem.optimizeConfiguration()
      }).not.toThrow()
    })

    test('should handle parallel validation tasks', async () => {
      const testCode = `
        access(all) contract TestContract {
          access(all) var value: String
          init() { self.value = "test" }
          access(all) fun getValue(): String { return self.value }
        }
      `

      const startTime = performance.now()
      const result = await optimizedValidationSystem.validateCodeOptimized(testCode, {
        enableParallelProcessing: true
      })
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(100)
      expect(result.performanceReport.parallelTasksExecuted).toBeGreaterThan(0)
    })
  })

  describe('BatchProcessor', () => {
    test('should process items in batches', async () => {
      const batchProcessor = new BatchProcessor<number, string>(3, 2) // batch size 3, max concurrency 2
      
      const items = Array.from({ length: 10 }, (_, i) => i)
      const processor = async (batch: number[]) => {
        return batch.map(item => `processed-${item}`)
      }

      const startTime = performance.now()
      const results = await batchProcessor.processBatches(items, processor)
      const duration = performance.now() - startTime

      expect(results).toHaveLength(10)
      expect(results[0]).toBe('processed-0')
      expect(results[9]).toBe('processed-9')
      expect(duration).toBeLessThan(100) // Should be fast
    })

    test('should limit concurrency', async () => {
      const batchProcessor = new BatchProcessor<number, string>(2, 1) // max concurrency 1
      
      const items = [1, 2, 3, 4]
      let concurrentCount = 0
      let maxConcurrent = 0

      const processor = async (batch: number[]) => {
        concurrentCount++
        maxConcurrent = Math.max(maxConcurrent, concurrentCount)
        
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 10))
        
        concurrentCount--
        return batch.map(item => `processed-${item}`)
      }

      await batchProcessor.processBatches(items, processor)
      
      expect(maxConcurrent).toBeLessThanOrEqual(1) // Should respect concurrency limit
    })
  })

  describe('Performance Regression Tests', () => {
    test('should maintain performance with complex contracts', async () => {
      const complexContract = `
        import NonFungibleToken from 0x1d7e57aa55817448
        import MetadataViews from 0x1d7e57aa55817448

        access(all) contract ComplexNFTContract: NonFungibleToken {
          access(all) var totalSupply: UInt64
          access(all) event ContractInitialized()
          access(all) event Withdraw(id: UInt64, from: Address?)
          access(all) event Deposit(id: UInt64, to: Address?)

          access(all) resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
            access(all) let id: UInt64
            access(all) let name: String
            access(all) let description: String
            access(all) let thumbnail: String
            access(all) let metadata: {String: AnyStruct}

            init(id: UInt64, name: String, description: String, thumbnail: String, metadata: {String: AnyStruct}) {
              self.id = id
              self.name = name
              self.description = description
              self.thumbnail = thumbnail
              self.metadata = metadata
            }

            access(all) fun getViews(): [Type] {
              return [Type<MetadataViews.Display>()]
            }

            access(all) fun resolveView(_ view: Type): AnyStruct? {
              switch view {
                case Type<MetadataViews.Display>():
                  return MetadataViews.Display(
                    name: self.name,
                    description: self.description,
                    thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
                  )
              }
              return nil
            }

            destroy() {
              emit Withdraw(id: self.id, from: self.owner?.address)
            }
          }

          access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
            access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

            init() {
              self.ownedNFTs <- {}
            }

            access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
              let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
              emit Withdraw(id: token.id, from: self.owner?.address)
              return <-token
            }

            access(all) fun deposit(token: @NonFungibleToken.NFT) {
              let token <- token as! @ComplexNFTContract.NFT
              let id: UInt64 = token.id
              let oldToken <- self.ownedNFTs[id] <- token
              emit Deposit(id: id, to: self.owner?.address)
              destroy oldToken
            }

            access(all) fun getIDs(): [UInt64] {
              return self.ownedNFTs.keys
            }

            access(all) fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
              return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)!
            }

            access(all) fun borrowViewResolver(id: UInt64): &AnyResource{MetadataViews.Resolver} {
              let nft = (&self.ownedNFTs[id] as auth(NonFungibleToken.Withdraw) &NonFungibleToken.NFT?)!
              let complexNFT = nft as! &ComplexNFTContract.NFT
              return complexNFT as &AnyResource{MetadataViews.Resolver}
            }

            destroy() {
              destroy self.ownedNFTs
            }
          }

          access(all) fun createEmptyCollection(): @NonFungibleToken.Collection {
            return <- create Collection()
          }

          access(all) fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}, name: String, description: String, thumbnail: String, metadata: {String: AnyStruct}) {
            let newNFT <- create NFT(id: self.totalSupply, name: name, description: description, thumbnail: thumbnail, metadata: metadata)
            recipient.deposit(token: <-newNFT)
            self.totalSupply = self.totalSupply + 1
          }

          init() {
            self.totalSupply = 0
            emit ContractInitialized()
          }
        }
      `

      const startTime = performance.now()
      const result = await optimizedValidationSystem.validateCodeOptimized(complexContract)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(150) // Allow slightly more time for complex contracts
      expect(result.isValid).toBeDefined()
      expect(result.performanceReport).toBeDefined()
    })

    test('should handle multiple concurrent validations', async () => {
      const testCodes = Array.from({ length: 5 }, (_, i) => `
        access(all) contract TestContract${i} {
          access(all) var value${i}: String
          init() { self.value${i} = "test${i}" }
          access(all) fun getValue${i}(): String { return self.value${i} }
        }
      `)

      const startTime = performance.now()
      const promises = testCodes.map(code => 
        optimizedValidationSystem.validateCodeOptimized(code)
      )
      const results = await Promise.all(promises)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(200) // Should handle concurrent validations efficiently
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result.isValid).toBeDefined()
      })
    })

    test('should maintain cache efficiency under load', async () => {
      const testCode = 'access(all) contract Test { init() {} }'
      
      // Perform multiple validations to test cache efficiency
      const validationPromises = Array.from({ length: 10 }, () =>
        optimizedValidationSystem.validateCodeOptimized(testCode)
      )

      const startTime = performance.now()
      await Promise.all(validationPromises)
      const duration = performance.now() - startTime

      const metrics = optimizedValidationSystem.getPerformanceMetrics()
      
      expect(duration).toBeLessThan(100) // Should be fast due to caching
      expect(metrics.cacheHitRate).toBeGreaterThan(0.5) // Should have good cache hit rate
    })
  })

  describe('Memory Management', () => {
    test('should not leak memory during repeated validations', async () => {
      const testCode = 'access(all) contract Test { init() {} }'
      
      // Get initial memory usage
      const initialMetrics = optimizedValidationSystem.getPerformanceMetrics()
      const initialMemory = initialMetrics.memoryUsage

      // Perform many validations
      for (let i = 0; i < 50; i++) {
        await optimizedValidationSystem.validateCodeOptimized(testCode)
      }

      // Check final memory usage
      const finalMetrics = optimizedValidationSystem.getPerformanceMetrics()
      const finalMemory = finalMetrics.memoryUsage

      // Memory should not grow excessively (allow for some growth due to caching)
      const memoryGrowth = finalMemory - initialMemory
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024) // Less than 10MB growth
    })

    test('should clean up expired cache entries', async () => {
      const shortExpirationOptimizer = new PerformanceOptimizer({
        cacheExpirationMs: 100 // Very short expiration for testing
      })

      // Add cache entries
      await shortExpirationOptimizer.optimizedValidation('key1', () => 'result1')
      await shortExpirationOptimizer.optimizedValidation('key2', () => 'result2')

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))

      // Trigger cleanup by accessing cache
      await shortExpirationOptimizer.optimizedValidation('key3', () => 'result3')

      const stats = shortExpirationOptimizer.getPerformanceStats()
      // Cache should have been cleaned up
      expect(stats.cacheSize.syntaxCache).toBeLessThan(3)
    })
  })
})