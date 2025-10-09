/**
 * Integration tests for migrated fungible token template
 * Validates that the migrated template maintains all original functionality
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { templates, getTemplateById } from '../../templates'
import { CadenceTemplateMigrator } from '../template-migrator'
import { CadenceSyntaxTransformer } from '../syntax-transformer'
import { MigrationLogger } from '../logger'

describe('Fungible Token Template Migration', () => {
  let migrator: CadenceTemplateMigrator
  let transformer: CadenceSyntaxTransformer
  let logger: MigrationLogger

  beforeEach(() => {
    logger = new MigrationLogger()
    transformer = new CadenceSyntaxTransformer(logger)
    migrator = new CadenceTemplateMigrator(logger)
  })

  test('should successfully migrate fungible token template', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Validate the template has been migrated
    const validationResult = migrator.validateTemplate(template)
    
    expect(validationResult.isValid).toBe(true)
    expect(validationResult.errors).toHaveLength(0)
    expect(validationResult.compilationSuccess).toBe(true)
  })

  test('should transform all pub keywords to access(all)', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check that no pub keywords remain
    expect(template.code).not.toMatch(/\bpub\s+(?:var|let|fun|resource|struct|contract|interface)/)
    expect(template.code).not.toMatch(/\bpub\(set\)\s+/)
    
    // Check that access(all) is used instead
    expect(template.code).toContain('access(all) contract FungibleToken')
    expect(template.code).toContain('access(all) var totalSupply')
    expect(template.code).toContain('access(all) fun withdraw')
    expect(template.code).toContain('access(all) fun deposit')
    expect(template.code).toContain('access(all) fun createEmptyVault')
    expect(template.code).toContain('access(all) fun mintTokens')
  })

  test('should transform interface conformance to ampersand syntax', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check that comma-separated interface conformance is replaced with ampersand
    expect(template.code).toContain('Vault: Provider & Receiver & Balance')
    
    // Check specifically for resource interface conformance patterns (not function parameters)
    const resourceInterfacePattern = /resource\s+\w+\s*:\s*[^{]+,\s*[^{&]+\s*\{/
    expect(template.code).not.toMatch(resourceInterfacePattern)
  })

  test('should transform storage API to modern syntax', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check that legacy storage API is replaced with modern syntax
    expect(template.code).toContain('account.storage.save')
    expect(template.code).not.toMatch(/\baccount\.save\(/)
  })

  test('should preserve all original functionality', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check that all essential components are preserved
    expect(template.code).toContain('contract FungibleToken')
    expect(template.code).toContain('var totalSupply: UFix64')
    expect(template.code).toContain('event TokensInitialized')
    expect(template.code).toContain('event TokensWithdrawn')
    expect(template.code).toContain('event TokensDeposited')
    
    // Check resource interfaces
    expect(template.code).toContain('resource interface Provider')
    expect(template.code).toContain('resource interface Receiver')
    expect(template.code).toContain('resource interface Balance')
    
    // Check main Vault resource
    expect(template.code).toContain('resource Vault')
    expect(template.code).toContain('fun withdraw(amount: UFix64): @Vault')
    expect(template.code).toContain('fun deposit(from: @Vault)')
    
    // Check utility functions and resources
    expect(template.code).toContain('fun createEmptyVault(): @Vault')
    expect(template.code).toContain('resource Administrator')
    expect(template.code).toContain('resource Minter')
    expect(template.code).toContain('fun mintTokens(amount: UFix64): @Vault')
  })

  test('should maintain proper business logic', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check that business logic is preserved
    expect(template.code).toContain('self.balance = self.balance - amount')
    expect(template.code).toContain('self.balance = self.balance + vault.balance')
    expect(template.code).toContain('FungibleToken.totalSupply = FungibleToken.totalSupply + amount')
    expect(template.code).toContain('FungibleToken.totalSupply = FungibleToken.totalSupply - self.balance')
    
    // Check preconditions
    expect(template.code).toContain('amount > 0.0: "Amount minted must be greater than zero"')
    expect(template.code).toContain('amount <= self.allowedAmount: "Amount minted must be less than the allowed amount"')
    
    // Check event emissions
    expect(template.code).toContain('emit TokensWithdrawn(amount: amount, from: self.owner?.address)')
    expect(template.code).toContain('emit TokensDeposited(amount: vault.balance, to: self.owner?.address)')
    expect(template.code).toContain('emit TokensInitialized(initialSupply: self.totalSupply)')
  })

  test('should have updated metadata for Cadence 1.0', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check that metadata reflects Cadence 1.0 compatibility
    expect(template.tags).toContain('Cadence 1.0')
    expect(template.description).toContain('Cadence 1.0 compatibility')
  })

  test('should validate without errors or warnings', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    const validationResult = migrator.validateTemplate(template)
    
    expect(validationResult.isValid).toBe(true)
    expect(validationResult.errors).toHaveLength(0)
    expect(validationResult.compilationSuccess).toBe(true)
    
    // Should have minimal or no warnings
    expect(validationResult.warnings.length).toBeLessThanOrEqual(2)
  })

  test('should maintain proper resource lifecycle', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check that resource creation and destruction patterns are preserved
    expect(template.code).toContain('return <-create Vault(balance: amount)')
    expect(template.code).toContain('return <-create Vault(balance: 0.0)')
    expect(template.code).toContain('return <-create Minter(allowedAmount: allowedAmount)')
    expect(template.code).toContain('let vault <- from as! @FungibleToken.Vault')
    expect(template.code).toContain('destroy vault')
    
    // Check destroy function
    expect(template.code).toContain('destroy() {')
  })

  test('should preserve initialization logic', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check that contract initialization is preserved
    expect(template.code).toContain('init() {')
    expect(template.code).toContain('self.totalSupply = 1000.0')
    expect(template.code).toContain('let vault <- create Vault(balance: self.totalSupply)')
    expect(template.code).toContain('account.storage.save(<-vault, to: /storage/MainVault)')
    expect(template.code).toContain('account.storage.save(<-create Administrator(), to: /storage/Admin)')
  })

  test('should maintain type safety and casting', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check that type casting and safety measures are preserved
    expect(template.code).toContain('let vault <- from as! @FungibleToken.Vault')
    expect(template.code).toContain(': @Vault')
    expect(template.code).toContain(': UFix64')
    expect(template.code).toContain('self.owner?.address')
  })
})