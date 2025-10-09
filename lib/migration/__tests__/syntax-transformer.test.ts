/**
 * Unit tests for Cadence syntax transformer
 */

import { CadenceSyntaxTransformer } from '../syntax-transformer'
import { MigrationLogger, LogLevel } from '../logger'

describe('CadenceSyntaxTransformer', () => {
  let transformer: CadenceSyntaxTransformer
  let logger: MigrationLogger

  beforeEach(() => {
    logger = new MigrationLogger(LogLevel.ERROR) // Suppress logs during tests
    transformer = new CadenceSyntaxTransformer(logger)
  })

  describe('transformAccessModifiers', () => {
    test('transforms pub to access(all)', () => {
      const input = 'pub fun getValue(): String'
      const expected = 'access(all) fun getValue(): String'
      const result = transformer.transformAccessModifiers(input)
      expect(result).toBe(expected)
    })

    test('transforms pub(set) to access(all)', () => {
      const input = 'pub(set) var balance: UFix64'
      const expected = 'access(all) var balance: UFix64'
      const result = transformer.transformAccessModifiers(input)
      expect(result).toBe(expected)
    })

    test('transforms multiple pub keywords', () => {
      const input = `
        pub contract MyContract {
          pub var totalSupply: UFix64
          pub fun getSupply(): UFix64 {
            return self.totalSupply
          }
        }
      `
      const expected = `
        access(all) contract MyContract {
          access(all) var totalSupply: UFix64
          access(all) fun getSupply(): UFix64 {
            return self.totalSupply
          }
        }
      `
      const result = transformer.transformAccessModifiers(input)
      expect(result).toBe(expected)
    })

    test('handles pub(set) before pub transformation', () => {
      const input = `
        pub contract Test {
          pub(set) var value: Int
          pub fun getValue(): Int
        }
      `
      const expected = `
        access(all) contract Test {
          access(all) var value: Int
          access(all) fun getValue(): Int
        }
      `
      const result = transformer.transformAccessModifiers(input)
      expect(result).toBe(expected)
    })

    test('preserves existing access modifiers', () => {
      const input = `
        access(all) contract Test {
          access(self) var privateValue: Int
          access(contract) var contractValue: Int
          access(account) var accountValue: Int
        }
      `
      const result = transformer.transformAccessModifiers(input)
      expect(result).toBe(input) // Should remain unchanged
    })

    test('handles pub in comments and strings correctly', () => {
      const input = `
        // This is a pub comment
        pub contract Test {
          pub fun test(): String {
            return "This contains pub in string"
          }
        }
      `
      const expected = `
        // This is a pub comment
        access(all) contract Test {
          access(all) fun test(): String {
            return "This contains pub in string"
          }
        }
      `
      const result = transformer.transformAccessModifiers(input)
      expect(result).toBe(expected)
    })

    test('handles empty string', () => {
      const input = ''
      const result = transformer.transformAccessModifiers(input)
      expect(result).toBe('')
    })

    test('handles code without pub keywords', () => {
      const input = `
        access(all) contract Test {
          access(self) var value: Int
          init() {
            self.value = 0
          }
        }
      `
      const result = transformer.transformAccessModifiers(input)
      expect(result).toBe(input)
    })
  })

  describe('transformInterfaceConformance', () => {
    test('transforms comma-separated interfaces to ampersand-separated', () => {
      const input = 'resource Vault: Provider, Receiver {'
      const expected = 'resource Vault: Provider & Receiver {'
      const result = transformer.transformInterfaceConformance(input)
      expect(result).toBe(expected)
    })

    test('transforms multiple interfaces with spaces', () => {
      const input = 'struct Token: Fungible, Mintable, Burnable {'
      const expected = 'struct Token: Fungible & Mintable & Burnable {'
      const result = transformer.transformInterfaceConformance(input)
      expect(result).toBe(expected)
    })

    test('handles contract interface conformance', () => {
      const input = 'contract MyContract: ContractInterface, AnotherInterface {'
      const expected = 'contract MyContract: ContractInterface & AnotherInterface {'
      const result = transformer.transformInterfaceConformance(input)
      expect(result).toBe(expected)
    })

    test('preserves single interface conformance', () => {
      const input = 'resource Vault: Provider {'
      const result = transformer.transformInterfaceConformance(input)
      expect(result).toBe(input) // Should remain unchanged
    })

    test('handles interfaces with extra whitespace', () => {
      const input = 'resource Vault:  Provider,  Receiver,  Balance  {'
      const expected = 'resource Vault: Provider & Receiver & Balance {'
      const result = transformer.transformInterfaceConformance(input)
      expect(result).toBe(expected)
    })

    test('handles complex interface names', () => {
      const input = 'resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {'
      const expected = 'resource NFT: NonFungibleToken.INFT & MetadataViews.Resolver {'
      const result = transformer.transformInterfaceConformance(input)
      expect(result).toBe(expected)
    })

    test('handles empty interface list', () => {
      const input = 'resource Vault: {'
      const result = transformer.transformInterfaceConformance(input)
      expect(result).toBe(input)
    })

    test('handles code without interface conformance', () => {
      const input = `
        contract Test {
          var value: Int
          init() {
            self.value = 0
          }
        }
      `
      const result = transformer.transformInterfaceConformance(input)
      expect(result).toBe(input)
    })
  })

  describe('transformFunctionSignatures', () => {
    test('adds view modifier to getter functions', () => {
      const input = 'access(all) fun getValue(): String {'
      const expected = 'access(all) view fun getValue(): String {'
      const result = transformer.transformFunctionSignatures(input)
      expect(result).toBe(expected)
    })

    test('adds view modifier to read functions', () => {
      const input = 'access(all) fun readBalance(): UFix64 {'
      const expected = 'access(all) view fun readBalance(): UFix64 {'
      const result = transformer.transformFunctionSignatures(input)
      expect(result).toBe(expected)
    })

    test('adds view modifier to check functions', () => {
      const input = 'access(all) fun checkPermission(): Bool {'
      const expected = 'access(all) view fun checkPermission(): Bool {'
      const result = transformer.transformFunctionSignatures(input)
      expect(result).toBe(expected)
    })

    test('preserves existing view modifier', () => {
      const input = 'access(all) view fun getValue(): String {'
      const result = transformer.transformFunctionSignatures(input)
      expect(result).toBe(input) // Should remain unchanged
    })

    test('does not add view to non-getter functions', () => {
      const input = 'access(all) fun deposit(amount: UFix64) {'
      const result = transformer.transformFunctionSignatures(input)
      expect(result).toBe(input) // Should remain unchanged
    })

    test('handles init functions correctly', () => {
      const input = 'init(initialSupply: UFix64) {'
      const result = transformer.transformFunctionSignatures(input)
      expect(result).toBe(input) // Should remain unchanged
    })

    test('handles destroy functions correctly', () => {
      const input = 'destroy() {'
      const result = transformer.transformFunctionSignatures(input)
      expect(result).toBe(input) // Should remain unchanged
    })

    test('handles multiple function signatures', () => {
      const input = `
        access(all) fun getValue(): String {
          return self.value
        }
        
        access(all) fun setValue(newValue: String) {
          self.value = newValue
        }
        
        access(all) fun getBalance(): UFix64 {
          return self.balance
        }
      `
      
      const result = transformer.transformFunctionSignatures(input)
      
      expect(result).toContain('access(all) view fun getValue()')
      expect(result).toContain('access(all) fun setValue(') // Should not have view
      expect(result).toContain('access(all) view fun getBalance()')
    })
  })

  describe('transformStorageAPI', () => {
    test('transforms account.save to account.storage.save', () => {
      const input = 'account.save(vault, to: /storage/vault)'
      const expected = 'account.storage.save(vault, to: /storage/vault)'
      const result = transformer.transformStorageAPI(input)
      expect(result).toBe(expected)
    })

    test('transforms account.load to account.storage.load', () => {
      const input = 'let vault = account.load<@Vault>(from: /storage/vault)'
      const expected = 'let vault = account.storage.load<@Vault>(from: /storage/vault)'
      const result = transformer.transformStorageAPI(input)
      expect(result).toBe(expected)
    })

    test('transforms account.borrow to account.storage.borrow', () => {
      const input = 'let vaultRef = account.borrow<&Vault>(from: /storage/vault)'
      const expected = 'let vaultRef = account.storage.borrow<&Vault>(from: /storage/vault)'
      const result = transformer.transformStorageAPI(input)
      expect(result).toBe(expected)
    })

    test('transforms account.copy to account.storage.copy', () => {
      const input = 'let data = account.copy<Data>(from: /storage/data)'
      const expected = 'let data = account.storage.copy<Data>(from: /storage/data)'
      const result = transformer.transformStorageAPI(input)
      expect(result).toBe(expected)
    })

    test('transforms multiple storage API calls', () => {
      const input = `
        account.save(vault, to: /storage/vault)
        let vaultRef = account.borrow<&Vault>(from: /storage/vault)
        let data = account.load<Data>(from: /storage/data)
      `
      const expected = `
        account.storage.save(vault, to: /storage/vault)
        let vaultRef = account.storage.borrow<&Vault>(from: /storage/vault)
        let data = account.storage.load<Data>(from: /storage/data)
      `
      const result = transformer.transformStorageAPI(input)
      expect(result).toBe(expected)
    })

    test('handles code without storage API calls', () => {
      const input = `
        let vault = Vault()
        vault.deposit(from: <-tokens)
        return vault.balance
      `
      const result = transformer.transformStorageAPI(input)
      expect(result).toBe(input)
    })

    test('preserves existing account.storage calls', () => {
      const input = 'account.storage.save(vault, to: /storage/vault)'
      const result = transformer.transformStorageAPI(input)
      expect(result).toBe(input)
    })
  })

  describe('transformAll', () => {
    test('applies all transformations in sequence', () => {
      const input = `
        pub contract MyContract: Interface1, Interface2 {
          pub var totalSupply: UFix64
          
          pub fun deposit(vault: @Vault) {
            account.save(<-vault, to: /storage/vault)
          }
          
          pub fun withdraw(): @Vault {
            return <-account.load<@Vault>(from: /storage/vault)!
          }
        }
      `
      
      const result = transformer.transformAll(input)
      
      // Should transform pub keywords
      expect(result).toContain('access(all) contract')
      expect(result).toContain('access(all) var')
      expect(result).toContain('access(all) fun')
      
      // Should transform interface conformance
      expect(result).toContain('Interface1 & Interface2')
      
      // Should transform storage API
      expect(result).toContain('account.storage.save')
      expect(result).toContain('account.storage.load')
    })
  })

  describe('getTransformationStats', () => {
    test('calculates transformation statistics', () => {
      const original = `pub contract Test {
        pub var value: Int
      }`
      
      const transformed = `access(all) contract Test {
        access(all) var value: Int
      }`
      
      const stats = transformer.getTransformationStats(original, transformed)
      
      expect(stats.originalLines).toBe(3)
      expect(stats.transformedLines).toBe(3)
      expect(stats.hasChanges).toBe(true)
    })

    test('detects no changes', () => {
      const code = `access(all) contract Test {
        access(all) var value: Int
      }`
      
      const stats = transformer.getTransformationStats(code, code)
      
      expect(stats.hasChanges).toBe(false)
      expect(stats.linesChanged).toBe(0)
    })
  })
})