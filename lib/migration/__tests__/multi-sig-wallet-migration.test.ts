/**
 * Integration tests for multi-signature wallet template migration
 * Validates that security patterns remain intact after migration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CadenceTemplateMigrator } from '../template-migrator'
import { getTemplateById } from '../../templates'
import { MigrationLogger } from '../logger'

describe('Multi-Signature Wallet Migration', () => {
  let migrator: CadenceTemplateMigrator
  let logger: MigrationLogger

  beforeEach(() => {
    logger = new MigrationLogger()
    migrator = new CadenceTemplateMigrator(logger)
  })

  describe('Template Migration', () => {
    it('should successfully migrate multi-sig wallet template', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      // Validate the template has been migrated
      expect(template.code).not.toContain('pub ')
      expect(template.code).toContain('access(all)')
      expect(template.description).toContain('Cadence 1.0 compatibility')
      expect(template.tags).toContain('Cadence 1.0')
    })

    it('should validate migrated template passes validation', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const validationResult = migrator.validateTemplate(template)
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.errors).toHaveLength(0)
      expect(validationResult.compilationSuccess).toBe(true)
    })

    it('should preserve all original contract functionality', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Check that all essential functions are present
      expect(code).toContain('fun submitTransaction')
      expect(code).toContain('fun confirmTransaction')
      expect(code).toContain('fun executeTransaction')
      expect(code).toContain('fun getTransaction')

      // Check that all essential events are present
      expect(code).toContain('event Deposit')
      expect(code).toContain('event SubmitTransaction')
      expect(code).toContain('event ConfirmTransaction')
      expect(code).toContain('event ExecuteTransaction')

      // Check that Transaction struct is present with all fields
      expect(code).toContain('struct Transaction')
      expect(code).toContain('let id: UInt64')
      expect(code).toContain('let to: Address')
      expect(code).toContain('let amount: UFix64')
      expect(code).toContain('var confirmations: UInt64')
      expect(code).toContain('var executed: Bool')
    })

    it('should maintain security patterns and access controls', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Check that private state variables use access(self)
      expect(code).toContain('access(self) var owners')
      expect(code).toContain('access(self) var required')
      expect(code).toContain('access(self) var transactions')
      expect(code).toContain('access(self) var confirmations')

      // Check that executeTransaction is access(self) for security
      expect(code).toContain('access(self) fun executeTransaction')

      // Check that preconditions are preserved
      expect(code).toContain('pre {')
      expect(code).toContain('self.transactions[txId] != nil: "Transaction does not exist"')
      expect(code).toContain('!self.transactions[txId]!.executed: "Transaction already executed"')
      expect(code).toContain('self.confirmations[txId]![owner] == nil: "Already confirmed"')

      // Check init preconditions
      expect(code).toContain('owners.length > 0: "Owners required"')
      expect(code).toContain('required > 0 && required <= UInt64(owners.length): "Invalid required confirmations"')
    })

    it('should add view modifiers to getter functions', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Check that getter functions have view modifier
      expect(code).toContain('access(all) view fun getTransaction')
      expect(code).toContain('access(all) view fun getOwners')
      expect(code).toContain('access(all) view fun getRequiredConfirmations')
      expect(code).toContain('access(all) view fun getTransactionCount')
      expect(code).toContain('access(all) view fun isOwner')
      expect(code).toContain('access(all) view fun getConfirmationCount')
      expect(code).toContain('access(all) view fun hasConfirmed')
    })

    it('should preserve transaction approval and execution logic', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Check transaction submission logic
      expect(code).toContain('let tx = Transaction(id: self.transactionCount, to: to, amount: amount)')
      expect(code).toContain('self.transactions[self.transactionCount] = tx')
      expect(code).toContain('self.confirmations[self.transactionCount] = {}')
      expect(code).toContain('self.transactionCount = self.transactionCount + 1')

      // Check confirmation logic
      expect(code).toContain('let tx = self.transactions[txId]!')
      expect(code).toContain('tx.confirm()')
      expect(code).toContain('self.transactions[txId] = tx')
      expect(code).toContain('self.confirmations[txId]!.insert(key: owner, true)')

      // Check automatic execution when threshold is met
      expect(code).toContain('if tx.confirmations >= self.required {')
      expect(code).toContain('self.executeTransaction(txId: txId)')

      // Check execution logic
      expect(code).toContain('tx.execute()')
      expect(code).toContain('emit ExecuteTransaction(txId: txId)')
    })

    it('should maintain proper event emission', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Check that events are emitted at the right times
      expect(code).toContain('emit SubmitTransaction(txId: self.transactionCount, to: to, amount: amount)')
      expect(code).toContain('emit ConfirmTransaction(owner: owner, txId: txId)')
      expect(code).toContain('emit ExecuteTransaction(txId: txId)')
    })

    it('should have enhanced functionality with additional view functions', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Check for additional utility functions that enhance usability
      expect(code).toContain('fun getOwners(): [Address]')
      expect(code).toContain('fun getRequiredConfirmations(): UInt64')
      expect(code).toContain('fun getTransactionCount(): UInt64')
      expect(code).toContain('fun isOwner(address: Address): Bool')
      expect(code).toContain('fun getConfirmationCount(txId: UInt64): UInt64')
      expect(code).toContain('fun hasConfirmed(txId: UInt64, owner: Address): Bool')

      // Check implementations
      expect(code).toContain('return self.owners')
      expect(code).toContain('return self.required')
      expect(code).toContain('return self.transactionCount')
      expect(code).toContain('return self.owners.contains(address)')
    })
  })

  describe('Security Validation', () => {
    it('should not contain any legacy syntax patterns', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const validationResult = migrator.validateTemplate(template)
      
      // Should not have any legacy syntax errors
      const legacyErrors = validationResult.errors.filter(error => 
        error.includes('Legacy syntax') || error.includes('pub keyword')
      )
      expect(legacyErrors).toHaveLength(0)
    })

    it('should maintain proper access control hierarchy', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Public interface functions should be access(all)
      const publicFunctions = [
        'submitTransaction',
        'confirmTransaction',
        'getTransaction',
        'getOwners',
        'getRequiredConfirmations',
        'getTransactionCount',
        'isOwner',
        'getConfirmationCount',
        'hasConfirmed'
      ]

      publicFunctions.forEach(funcName => {
        // Some functions have view modifier, so check for either pattern
        const hasFunction = code.includes(`access(all) fun ${funcName}`) || 
                           code.includes(`access(all) view fun ${funcName}`)
        expect(hasFunction).toBe(true)
      })

      // Private functions should be access(self)
      expect(code).toContain('access(self) fun executeTransaction')

      // State variables should have appropriate access
      expect(code).toContain('access(all) var transactionCount')
      expect(code).toContain('access(self) var owners')
      expect(code).toContain('access(self) var required')
      expect(code).toContain('access(self) var transactions')
      expect(code).toContain('access(self) var confirmations')
    })

    it('should preserve all security preconditions', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Count precondition blocks
      const preBlocks = (code.match(/pre \{/g) || []).length
      expect(preBlocks).toBeGreaterThanOrEqual(2) // At least in confirmTransaction and init

      // Specific security checks
      expect(code).toContain('"Transaction does not exist"')
      expect(code).toContain('"Transaction already executed"')
      expect(code).toContain('"Already confirmed"')
      expect(code).toContain('"Owners required"')
      expect(code).toContain('"Invalid required confirmations"')
    })
  })

  describe('Functionality Enhancement', () => {
    it('should provide comprehensive query interface', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Should provide ways to query all important state
      expect(code).toContain('getOwners()')
      expect(code).toContain('getRequiredConfirmations()')
      expect(code).toContain('getTransactionCount()')
      expect(code).toContain('isOwner(address: Address)')
      expect(code).toContain('getConfirmationCount(txId: UInt64)')
      expect(code).toContain('hasConfirmed(txId: UInt64, owner: Address)')

      // All query functions should be view functions
      const viewFunctions = (code.match(/access\(all\) view fun/g) || []).length
      expect(viewFunctions).toBeGreaterThanOrEqual(6)
    })

    it('should maintain backward compatibility for existing functionality', () => {
      const template = getTemplateById('multi-sig-wallet')
      expect(template).toBeDefined()
      
      if (!template) return

      const code = template.code

      // Original core functions should still exist with same signatures
      expect(code).toContain('fun submitTransaction(to: Address, amount: UFix64): UInt64')
      expect(code).toContain('fun confirmTransaction(txId: UInt64, owner: Address)')
      expect(code).toContain('fun getTransaction(txId: UInt64): Transaction?')

      // Original struct should maintain same fields
      expect(code).toContain('struct Transaction')
      expect(code).toContain('let id: UInt64')
      expect(code).toContain('let to: Address')
      expect(code).toContain('let amount: UFix64')
      expect(code).toContain('var confirmations: UInt64')
      expect(code).toContain('var executed: Bool')
    })
  })
})