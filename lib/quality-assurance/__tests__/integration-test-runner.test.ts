/**
 * Integration Test Runner
 * 
 * Simple integration tests to verify the quality assurance system works correctly.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedGenerationController } from '../enhanced-generation-controller'
import { 
  GenerationRequest, 
  EnhancedGenerationOptions
} from '../types'

// Mock the logger to avoid console output during tests
vi.mock('../logger', () => ({
  QALogger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })),
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })),
  initializeLogger: vi.fn()
}))

describe('Integration Test Runner', () => {
  let controller: EnhancedGenerationController

  beforeEach(() => {
    controller = new EnhancedGenerationController()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should successfully generate a simple contract', async () => {
    const request: GenerationRequest = {
      prompt: 'Create a simple test contract',
      context: 'Basic test contract',
      temperature: 0.5,
      maxRetries: 2,
      strictMode: false
    }

    const mockGenerationFunction = vi.fn().mockResolvedValue(`
      access(all) contract TestContract {
        access(all) var value: String
        
        access(all) event ContractInitialized()
        
        access(all) fun setValue(newValue: String) {
          self.value = newValue
        }
        
        access(all) view fun getValue(): String {
          return self.value
        }
        
        init() {
          self.value = "initialized"
          emit ContractInitialized()
        }
      }
    `)

    const options: EnhancedGenerationOptions = {
      enableRetryRecovery: true,
      enableAutoCorrection: true,
      enableFallbackGeneration: true,
      qualityThreshold: 70,
      maxRetries: 2,
      strictMode: false
    }

    const result = await controller.generateWithQualityAssurance(
      request,
      mockGenerationFunction,
      options
    )

    // Basic verification
    expect(result).toBeDefined()
    expect(result.code).toBeDefined()
    expect(result.code.length).toBeGreaterThan(0)
    expect(result.qualityScore).toBeGreaterThan(0)
    expect(result.generationMetrics).toBeDefined()
    expect(result.validationResults).toBeDefined()
    
    // Verify the mock was called
    expect(mockGenerationFunction).toHaveBeenCalled()
    
    // Log the actual result for debugging
    console.log('Test result:', {
      codeLength: result.code.length,
      qualityScore: result.qualityScore,
      fallbackUsed: result.fallbackUsed,
      attemptCount: result.generationMetrics.attemptCount
    })
  })

  test('should handle generation with undefined values', async () => {
    const request: GenerationRequest = {
      prompt: 'Create a contract with issues',
      context: 'Test contract with undefined values',
      temperature: 0.6,
      maxRetries: 3,
      strictMode: false
    }

    let attemptCount = 0
    const mockGenerationFunction = vi.fn().mockImplementation(async () => {
      attemptCount++
      
      if (attemptCount === 1) {
        // First attempt: code with undefined values
        return `
          access(all) contract BrokenContract {
            access(all) var value: String = undefined
            access(all) var count: Int = undefined
            
            init() {
              self.value = undefined
              self.count = undefined
            }
          }
        `
      } else {
        // Second attempt: fixed code
        return `
          access(all) contract FixedContract {
            access(all) var value: String
            access(all) var count: Int
            
            access(all) event ContractFixed()
            
            access(all) fun setValue(newValue: String) {
              self.value = newValue
            }
            
            access(all) fun increment() {
              self.count = self.count + 1
            }
            
            init() {
              self.value = "fixed"
              self.count = 0
              emit ContractFixed()
            }
          }
        `
      }
    })

    const options: EnhancedGenerationOptions = {
      enableRetryRecovery: true,
      enableAutoCorrection: true,
      enableFallbackGeneration: true,
      qualityThreshold: 70,
      maxRetries: 3,
      strictMode: false
    }

    const result = await controller.generateWithQualityAssurance(
      request,
      mockGenerationFunction,
      options
    )

    // Verify retry behavior
    expect(result).toBeDefined()
    expect(result.code).toBeDefined()
    expect(result.code.length).toBeGreaterThan(0)
    expect(result.code).not.toContain('undefined')
    expect(result.generationMetrics.attemptCount).toBeGreaterThan(1)
    
    // Log the actual result for debugging
    console.log('Retry test result:', {
      codeLength: result.code.length,
      qualityScore: result.qualityScore,
      fallbackUsed: result.fallbackUsed,
      attemptCount: result.generationMetrics.attemptCount,
      codeContainsFixed: result.code.includes('FixedContract')
    })
  })

  test('should use fallback when generation fails', async () => {
    const request: GenerationRequest = {
      prompt: 'Create a contract that will fail',
      context: 'Test fallback generation',
      temperature: 0.7,
      maxRetries: 1,
      strictMode: false
    }

    // Mock generation function that always fails
    const mockGenerationFunction = vi.fn().mockRejectedValue(
      new Error('Generation failed')
    )

    const options: EnhancedGenerationOptions = {
      enableRetryRecovery: true,
      enableAutoCorrection: true,
      enableFallbackGeneration: true,
      qualityThreshold: 60,
      maxRetries: 1,
      strictMode: false
    }

    const result = await controller.generateWithQualityAssurance(
      request,
      mockGenerationFunction,
      options
    )

    // Verify fallback behavior
    expect(result).toBeDefined()
    expect(result.code).toBeDefined()
    expect(result.code.length).toBeGreaterThan(0)
    expect(result.fallbackUsed).toBe(true)
    expect(result.qualityScore).toBeGreaterThan(0)
    
    // Log the actual result for debugging
    console.log('Fallback test result:', {
      codeLength: result.code.length,
      qualityScore: result.qualityScore,
      fallbackUsed: result.fallbackUsed,
      attemptCount: result.generationMetrics.attemptCount,
      codeContainsContract: result.code.includes('contract')
    })
  })
})