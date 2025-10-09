/**
 * Edge Cases and Unusual Prompt Patterns Integration Tests
 * 
 * Tests the quality assurance system's handling of edge cases,
 * unusual prompt patterns, and boundary conditions.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedGenerationController } from '../enhanced-generation-controller'
import { ComprehensiveValidationSystem } from '../comprehensive-validation-system'
import { UndefinedValueDetector } from '../undefined-value-detector'
import { AutoCorrectionEngine } from '../auto-correction-engine'
import { FallbackGenerator } from '../fallback-generator'
import { 
  GenerationRequest, 
  GenerationContext, 
  ContractType, 
  QualityRequirements,
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

describe('Edge Cases and Unusual Prompt Patterns', () => {
  let controller: EnhancedGenerationController
  let validationSystem: ComprehensiveValidationSystem
  let undefinedDetector: UndefinedValueDetector
  let correctionEngine: AutoCorrectionEngine
  let fallbackGenerator: FallbackGenerator

  beforeEach(() => {
    controller = new EnhancedGenerationController()
    validationSystem = new ComprehensiveValidationSystem()
    undefinedDetector = new UndefinedValueDetector()
    correctionEngine = new AutoCorrectionEngine()
    fallbackGenerator = new FallbackGenerator()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Unusual Prompt Patterns', () => {
    test('should handle extremely short prompts', async () => {
      const shortPrompts = [
        'NFT',
        'Token',
        'DAO',
        'Contract',
        'Mint',
        'Vote',
        'Trade'
      ]

      for (const prompt of shortPrompts) {
        const request: GenerationRequest = {
          prompt,
          context: '',
          temperature: 0.7,
          maxRetries: 2,
          strictMode: false
        }

        const mockGenerationFunction = vi.fn().mockResolvedValue(`
          access(all) contract GeneratedContract {
            access(all) var value: String
            
            access(all) event ContractInitialized()
            
            access(all) fun setValue(newValue: String) {
              self.value = newValue
            }
            
            access(all) view fun getValue(): String {
              return self.value
            }
            
            init() {
              self.value = "initialized from prompt: ${prompt}"
              emit ContractInitialized()
            }
          }
        `)

        const result = await controller.generateWithQualityAssurance(
          request,
          mockGenerationFunction,
          { qualityThreshold: 70 }
        )

        expect(result.code).toBeDefined()
        expect(result.qualityScore).toBeGreaterThanOrEqual(70)
        expect(result.code).toContain('contract')
        expect(result.code).toContain('init()')
        expect(result.code).not.toContain('undefined')
      }
    })

    test('should handle prompts with special characters and unicode', async () => {
      const specialPrompts = [
        'Create a contract with émojis 🚀💎 and spëcial chars',
        'Créer un contrat NFT avec des caractères français àéèùç',
        'Create contract with symbols: @#$%^&*()_+-=[]{}|;:,.<>?',
        'Contract with numbers: 123456789 and mixed: abc123XYZ',
        'Multi-line\nprompt\nwith\nbreaks',
        'Contract with "quotes" and \'apostrophes\' and `backticks`'
      ]

      for (const prompt of specialPrompts) {
        const request: GenerationRequest = {
          prompt,
          context: 'Special characters test',
          temperature: 0.6,
          maxRetries: 2,
          strictMode: false
        }

        const mockGenerationFunction = vi.fn().mockResolvedValue(`
          access(all) contract SpecialCharContract {
            access(all) var description: String
            access(all) var metadata: {String: String}
            
            access(all) event ContractCreated(description: String)
            
            access(all) fun updateDescription(newDescription: String) {
              self.description = newDescription
            }
            
            access(all) fun setMetadata(key: String, value: String) {
              self.metadata[key] = value
            }
            
            access(all) view fun getDescription(): String {
              return self.description
            }
            
            access(all) view fun getMetadata(): {String: String} {
              return self.metadata
            }
            
            init() {
              self.description = "Contract created from special prompt"
              self.metadata = {}
              emit ContractCreated(description: self.description)
            }
          }
        `)

        const result = await controller.generateWithQualityAssurance(
          request,
          mockGenerationFunction,
          { qualityThreshold: 70 }
        )

        expect(result.code).toBeDefined()
        expect(result.qualityScore).toBeGreaterThanOrEqual(70)
        expect(result.code).toContain('SpecialCharContract')
        expect(result.code).not.toContain('undefined')
        expect(result.fallbackUsed).toBe(false)
      }
    })

    test('should handle contradictory or conflicting prompts', async () => {
      const conflictingPrompts = [
        'Create a simple complex contract',
        'Make an NFT that is not an NFT',
        'Create a fungible non-fungible token',
        'Build a decentralized centralized system',
        'Make a contract without any functions that has many functions',
        'Create a public private contract',
        'Build a secure insecure smart contract'
      ]

      for (const prompt of conflictingPrompts) {
        const request: GenerationRequest = {
          prompt,
          context: 'Conflicting requirements test',
          temperature: 0.7,
          maxRetries: 3,
          strictMode: false
        }

        const mockGenerationFunction = vi.fn().mockResolvedValue(`
          access(all) contract ConflictResolutionContract {
            access(all) var resolvedApproach: String
            access(all) var conflictNotes: [String]
            
            access(all) event ConflictResolved(approach: String)
            
            access(all) fun recordConflictResolution(approach: String, notes: [String]) {
              self.resolvedApproach = approach
              self.conflictNotes = notes
              emit ConflictResolved(approach: approach)
            }
            
            access(all) view fun getResolution(): String {
              return self.resolvedApproach
            }
            
            access(all) view fun getConflictNotes(): [String] {
              return self.conflictNotes
            }
            
            init() {
              self.resolvedApproach = "Resolved conflicting requirements by choosing primary intent"
              self.conflictNotes = ["Analyzed conflicting terms", "Chose most logical interpretation"]
            }
          }
        `)

        const result = await controller.generateWithQualityAssurance(
          request,
          mockGenerationFunction,
          { qualityThreshold: 70, enableFallbackGeneration: true }
        )

        expect(result.code).toBeDefined()
        expect(result.qualityScore).toBeGreaterThanOrEqual(60) // May be lower due to conflicts
        expect(result.code).toContain('contract')
        expect(result.code).toContain('init()')
        expect(result.code).not.toContain('undefined')
      }
    })
  })

  describe('Boundary Conditions', () => {
    test('should handle empty or whitespace-only prompts', async () => {
      const emptyPrompts = [
        '',
        '   ',
        '\n\n\n',
        '\t\t\t',
        '   \n  \t  \n   '
      ]

      for (const prompt of emptyPrompts) {
        const request: GenerationRequest = {
          prompt,
          context: 'Empty prompt test',
          temperature: 0.5,
          maxRetries: 1,
          strictMode: false
        }

        const mockGenerationFunction = vi.fn().mockResolvedValue(`
          access(all) contract DefaultContract {
            access(all) var initialized: Bool
            
            access(all) event DefaultContractCreated()
            
            access(all) fun initialize() {
              self.initialized = true
            }
            
            access(all) view fun isInitialized(): Bool {
              return self.initialized
            }
            
            init() {
              self.initialized = false
              emit DefaultContractCreated()
            }
          }
        `)

        const result = await controller.generateWithQualityAssurance(
          request,
          mockGenerationFunction,
          { enableFallbackGeneration: true, qualityThreshold: 60 }
        )

        expect(result.code).toBeDefined()
        expect(result.code).toContain('contract')
        expect(result.code).toContain('init()')
        expect(result.code).not.toContain('undefined')
        // May use fallback for empty prompts
        expect(result.qualityScore).toBeGreaterThanOrEqual(50)
      }
    })

    test('should handle maximum temperature values', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a creative experimental contract',
        context: 'High temperature test',
        temperature: 1.0, // Maximum temperature
        maxRetries: 3,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockResolvedValue(`
        access(all) contract ExperimentalContract {
          access(all) var creativityLevel: UFix64
          access(all) var experimentalFeatures: {String: Bool}
          access(all) var randomSeed: UInt64
          
          access(all) event ExperimentInitiated(seed: UInt64)
          access(all) event CreativityLevelChanged(newLevel: UFix64)
          
          access(all) fun initiateExperiment() {
            self.randomSeed = UInt64(getCurrentBlock().timestamp)
            self.creativityLevel = 1.0
            self.experimentalFeatures["quantum_entanglement"] = true
            self.experimentalFeatures["temporal_mechanics"] = true
            emit ExperimentInitiated(seed: self.randomSeed)
          }
          
          access(all) fun adjustCreativity(level: UFix64) {
            pre {
              level >= 0.0 && level <= 1.0: "Creativity level must be between 0 and 1"
            }
            self.creativityLevel = level
            emit CreativityLevelChanged(newLevel: level)
          }
          
          access(all) fun enableFeature(feature: String) {
            self.experimentalFeatures[feature] = true
          }
          
          access(all) view fun getCreativityLevel(): UFix64 {
            return self.creativityLevel
          }
          
          access(all) view fun getExperimentalFeatures(): {String: Bool} {
            return self.experimentalFeatures
          }
          
          init() {
            self.creativityLevel = 0.5
            self.experimentalFeatures = {}
            self.randomSeed = 0
          }
        }
      `)

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 70, maxRetries: 3 }
      )

      expect(result.code).toBeDefined()
      expect(result.qualityScore).toBeGreaterThanOrEqual(70)
      expect(result.code).toContain('ExperimentalContract')
      expect(result.code).not.toContain('undefined')
      expect(result.fallbackUsed).toBe(false)
    })

    test('should handle minimum temperature values', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a precise deterministic contract',
        context: 'Low temperature test',
        temperature: 0.0, // Minimum temperature
        maxRetries: 2,
        strictMode: true
      }

      const mockGenerationFunction = vi.fn().mockResolvedValue(`
        access(all) contract DeterministicContract {
          access(all) var precisionLevel: UFix64
          access(all) var calculations: {String: UFix64}
          access(all) var isCalibrated: Bool
          
          access(all) event PrecisionSet(level: UFix64)
          access(all) event CalculationPerformed(operation: String, result: UFix64)
          access(all) event CalibrationCompleted()
          
          access(all) fun setPrecision(level: UFix64) {
            pre {
              level >= 0.0 && level <= 1.0: "Precision level must be between 0 and 1"
            }
            self.precisionLevel = level
            emit PrecisionSet(level: level)
          }
          
          access(all) fun performCalculation(operation: String, value: UFix64): UFix64 {
            pre {
              operation.length > 0: "Operation name cannot be empty"
              self.isCalibrated: "Contract must be calibrated first"
            }
            
            let result = value * self.precisionLevel
            self.calculations[operation] = result
            emit CalculationPerformed(operation: operation, result: result)
            return result
          }
          
          access(all) fun calibrate() {
            self.isCalibrated = true
            self.precisionLevel = 1.0
            emit CalibrationCompleted()
          }
          
          access(all) view fun getPrecisionLevel(): UFix64 {
            return self.precisionLevel
          }
          
          access(all) view fun getCalculations(): {String: UFix64} {
            return self.calculations
          }
          
          access(all) view fun isSystemCalibrated(): Bool {
            return self.isCalibrated
          }
          
          init() {
            self.precisionLevel = 0.0
            self.calculations = {}
            self.isCalibrated = false
          }
        }
      `)

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 85, strictMode: true }
      )

      expect(result.code).toBeDefined()
      expect(result.qualityScore).toBeGreaterThanOrEqual(85)
      expect(result.code).toContain('DeterministicContract')
      expect(result.code).toContain('pre {')
      expect(result.code).not.toContain('undefined')
      expect(result.fallbackUsed).toBe(false)
    })
  })

  describe('Malformed Input Handling', () => {
    test('should handle prompts with invalid JSON-like structures', async () => {
      const malformedPrompts = [
        'Create contract {name: "test", type: invalid}',
        'Contract with [array, without, proper, syntax]',
        'Make {incomplete: json structure',
        'Contract with {"nested": {"incomplete": }',
        'Create contract with {valid: "json", but: "weird context"}'
      ]

      for (const prompt of malformedPrompts) {
        const request: GenerationRequest = {
          prompt,
          context: 'Malformed input test',
          temperature: 0.6,
          maxRetries: 2,
          strictMode: false
        }

        const mockGenerationFunction = vi.fn().mockResolvedValue(`
          access(all) contract MalformedInputContract {
            access(all) var inputProcessed: Bool
            access(all) var sanitizedInput: String
            
            access(all) event InputProcessed(sanitized: String)
            
            access(all) fun processInput(input: String) {
              self.sanitizedInput = self.sanitizeInput(input)
              self.inputProcessed = true
              emit InputProcessed(sanitized: self.sanitizedInput)
            }
            
            access(all) fun sanitizeInput(_ input: String): String {
              // Basic sanitization logic
              return "sanitized_input"
            }
            
            access(all) view fun getSanitizedInput(): String {
              return self.sanitizedInput
            }
            
            access(all) view fun isInputProcessed(): Bool {
              return self.inputProcessed
            }
            
            init() {
              self.inputProcessed = false
              self.sanitizedInput = ""
            }
          }
        `)

        const result = await controller.generateWithQualityAssurance(
          request,
          mockGenerationFunction,
          { qualityThreshold: 70, enableFallbackGeneration: true }
        )

        expect(result.code).toBeDefined()
        expect(result.qualityScore).toBeGreaterThanOrEqual(60)
        expect(result.code).toContain('contract')
        expect(result.code).not.toContain('undefined')
      }
    })

    test('should handle prompts with code injection attempts', async () => {
      const injectionPrompts = [
        'Create contract; DROP TABLE users; --',
        'Contract with <script>alert("xss")</script>',
        'Make contract ${process.env.SECRET}',
        'Contract with `rm -rf /`',
        'Create contract && curl malicious-site.com'
      ]

      for (const prompt of injectionPrompts) {
        const request: GenerationRequest = {
          prompt,
          context: 'Security test',
          temperature: 0.5,
          maxRetries: 2,
          strictMode: true
        }

        const mockGenerationFunction = vi.fn().mockResolvedValue(`
          access(all) contract SecureContract {
            access(all) var securityLevel: String
            access(all) var inputValidated: Bool
            
            access(all) event SecurityCheckPassed()
            access(all) event InputValidated(level: String)
            
            access(all) fun validateInput() {
              self.inputValidated = true
              self.securityLevel = "high"
              emit InputValidated(level: self.securityLevel)
              emit SecurityCheckPassed()
            }
            
            access(all) view fun getSecurityLevel(): String {
              return self.securityLevel
            }
            
            access(all) view fun isInputValidated(): Bool {
              return self.inputValidated
            }
            
            init() {
              self.securityLevel = "maximum"
              self.inputValidated = true
              emit SecurityCheckPassed()
            }
          }
        `)

        const result = await controller.generateWithQualityAssurance(
          request,
          mockGenerationFunction,
          { qualityThreshold: 80, strictMode: true }
        )

        expect(result.code).toBeDefined()
        expect(result.qualityScore).toBeGreaterThanOrEqual(80)
        expect(result.code).toContain('SecureContract')
        expect(result.code).not.toContain('undefined')
        expect(result.code).not.toContain('<script>')
        expect(result.code).not.toContain('DROP TABLE')
        expect(result.code).not.toContain('rm -rf')
      }
    })
  })

  describe('Resource Exhaustion Edge Cases', () => {
    test('should handle generation of extremely large contracts', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a contract with 50 functions and 25 events',
        context: 'Large contract stress test',
        temperature: 0.5,
        maxRetries: 2,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockImplementation(async () => {
        // Simulate processing time for large contract
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const functions = Array.from({ length: 50 }, (_, i) => `
          access(all) fun function${i}(param${i}: String): String {
            return param${i}.concat(" processed by function ${i}")
          }
        `).join('')
        
        const events = Array.from({ length: 25 }, (_, i) => `
          access(all) event Event${i}(value${i}: String, index${i}: UInt64)
        `).join('')
        
        return `
          access(all) contract LargeContract {
            access(all) var functionCount: UInt64
            access(all) var eventCount: UInt64
            access(all) var data: {String: String}
            
            ${events}
            
            ${functions}
            
            access(all) fun processAllFunctions() {
              var i = 0
              while i < 50 {
                let result = self.function0("test")
                self.data[i.toString()] = result
                i = i + 1
              }
            }
            
            access(all) view fun getFunctionCount(): UInt64 {
              return self.functionCount
            }
            
            access(all) view fun getEventCount(): UInt64 {
              return self.eventCount
            }
            
            access(all) view fun getData(): {String: String} {
              return self.data
            }
            
            init() {
              self.functionCount = 50
              self.eventCount = 25
              self.data = {}
            }
          }
        `
      })

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 70, maxRetries: 2 }
      )

      expect(result.code).toBeDefined()
      expect(result.code.length).toBeGreaterThan(5000) // Should be a large contract
      expect(result.qualityScore).toBeGreaterThanOrEqual(70)
      expect(result.code).toContain('LargeContract')
      expect(result.code).toContain('function49') // Should have all 50 functions
      expect(result.code).toContain('Event24') // Should have all 25 events
      expect(result.code).not.toContain('undefined')
    })
  })

  describe('Validation Edge Cases', () => {
    test('should handle contracts with unusual but valid Cadence patterns', async () => {
      const request: GenerationRequest = {
        prompt: 'Create a contract with advanced Cadence features',
        context: 'Advanced Cadence patterns test',
        temperature: 0.7,
        maxRetries: 2,
        strictMode: false
      }

      const mockGenerationFunction = vi.fn().mockResolvedValue(`
        access(all) contract AdvancedPatternsContract {
          access(all) var capabilities: {String: String}
          access(all) var references: {String: AnyStruct}
          
          access(all) event CapabilityCreated(name: String)
          access(all) event ReferenceStored(name: String, type: String)
          
          access(all) resource interface ResourceInterface {
            access(all) fun interfaceFunction(): String
          }
          
          access(all) resource ConcreteResource: ResourceInterface {
            access(all) var data: String
            
            init(data: String) {
              self.data = data
            }
            
            access(all) fun interfaceFunction(): String {
              return self.data
            }
            
            access(all) fun concreteFunction(): String {
              return "concrete: ".concat(self.data)
            }
            
            destroy() {}
          }
          
          access(all) struct interface StructInterface {
            access(all) fun structInterfaceFunction(): String
          }
          
          access(all) struct ConcreteStruct: StructInterface {
            access(all) var value: String
            
            init(value: String) {
              self.value = value
            }
            
            access(all) fun structInterfaceFunction(): String {
              return self.value
            }
            
            access(all) fun concreteStructFunction(): String {
              return "struct: ".concat(self.value)
            }
          }
          
          access(all) fun createResource(data: String): @ConcreteResource {
            return <- create ConcreteResource(data: data)
          }
          
          access(all) fun createStruct(value: String): ConcreteStruct {
            return ConcreteStruct(value: value)
          }
          
          access(all) fun storeReference<T: AnyStruct>(name: String, ref: T) {
            self.references[name] = ref
            emit ReferenceStored(name: name, type: "AnyStruct")
          }
          
          access(all) fun getReference(name: String): AnyStruct? {
            return self.references[name]
          }
          
          access(all) fun processWithOptional(value: String?): String {
            if let unwrapped = value {
              return "processed: ".concat(unwrapped)
            } else {
              return "no value provided"
            }
          }
          
          access(all) fun processWithForceUnwrap(value: String?): String {
            return "force unwrapped: ".concat(value!)
          }
          
          access(all) view fun getCapabilities(): {String: String} {
            return self.capabilities
          }
          
          access(all) view fun getReferences(): {String: AnyStruct} {
            return self.references
          }
          
          init() {
            self.capabilities = {}
            self.references = {}
          }
        }
      `)

      const result = await controller.generateWithQualityAssurance(
        request,
        mockGenerationFunction,
        { qualityThreshold: 80 }
      )

      expect(result.code).toBeDefined()
      expect(result.qualityScore).toBeGreaterThanOrEqual(80)
      expect(result.code).toContain('AdvancedPatternsContract')
      expect(result.code).toContain('resource interface')
      expect(result.code).toContain('struct interface')
      expect(result.code).toContain('AnyStruct')
      expect(result.code).not.toContain('undefined')
    })
  })
})