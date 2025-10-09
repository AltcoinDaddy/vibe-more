/**
 * Validation test to ensure the migrated fungible token template compiles correctly
 */

import { describe, test, expect } from 'vitest'
import { getTemplateById } from '../../templates'
import { CadenceTemplateMigrator } from '../template-migrator'
import { CadenceSyntaxTransformer } from '../syntax-transformer'

describe('Fungible Token Template Validation', () => {
  test('should validate migrated template has no legacy syntax', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    const migrator = new CadenceTemplateMigrator()
    
    // Test specific legacy patterns in the fungible token template
    const hasPubKeywords = /\bpub\s+(?:var|let|fun|resource|struct|contract|interface)/.test(template.code)
    const hasPubSetKeywords = /\bpub\(set\)\s+/.test(template.code)
    const hasLegacyStorage = /\baccount\.(?:save|load|borrow|copy)\(/.test(template.code) && !template.code.includes('account.storage.')
    
    expect(hasPubKeywords).toBe(false)
    expect(hasPubSetKeywords).toBe(false)
    expect(hasLegacyStorage).toBe(false)
    
    // Validate the template
    const validationResult = migrator.validateTemplate(template)
    expect(validationResult.isValid).toBe(true)
    expect(validationResult.errors).toHaveLength(0)
  })

  test('should have proper Cadence 1.0 syntax patterns', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check for modern access modifiers
    expect(template.code).toMatch(/access\(all\)\s+contract/)
    expect(template.code).toMatch(/access\(all\)\s+var/)
    expect(template.code).toMatch(/access\(all\)\s+fun/)
    expect(template.code).toMatch(/access\(all\)\s+resource/)
    
    // Check for ampersand interface conformance
    expect(template.code).toContain(' & ')
    
    // Check for modern storage API
    expect(template.code).toContain('account.storage.save')
    
    // Ensure no legacy patterns remain
    expect(template.code).not.toMatch(/\bpub\s+/)
    expect(template.code).not.toMatch(/\bpub\(set\)\s+/)
  })

  test('should maintain contract structure integrity', () => {
    const template = getTemplateById('fungible-token')
    expect(template).toBeDefined()
    
    if (!template) return

    // Check balanced braces
    const openBraces = (template.code.match(/\{/g) || []).length
    const closeBraces = (template.code.match(/\}/g) || []).length
    expect(openBraces).toBe(closeBraces)
    
    // Check balanced parentheses
    const openParens = (template.code.match(/\(/g) || []).length
    const closeParens = (template.code.match(/\)/g) || []).length
    expect(openParens).toBe(closeParens)
    
    // Check that essential contract elements are present
    expect(template.code).toContain('contract FungibleToken')
    expect(template.code).toContain('init() {')
    
    // Count init functions (contract init + resource inits)
    const initCount = (template.code.match(/init\(/g) || []).length
    expect(initCount).toBeGreaterThanOrEqual(2) // At least contract init + one resource init
  })
})