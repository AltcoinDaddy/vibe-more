/**
 * Unit tests for template scanner and processor
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TemplateScanner } from '../template-scanner'
import { CadenceTemplateMigrator } from '../template-migrator'
import { MigrationLogger } from '../logger'
import { Template } from '../../templates'

describe('TemplateScanner', () => {
  let scanner: TemplateScanner
  let logger: MigrationLogger

  beforeEach(() => {
    logger = new MigrationLogger()
    scanner = new TemplateScanner(logger)
  })

  describe('scanAllTemplates', () => {
    it('should identify templates that need migration', () => {
      const result = scanner.scanAllTemplates()
      
      expect(result.totalTemplates).toBeGreaterThan(0)
      expect(result.templatesNeedingMigration).toBeDefined()
      expect(result.templatesAlreadyMigrated).toBeDefined()
      expect(result.migrationCandidates).toBeDefined()
      
      // Should have some templates that need migration (based on current templates.ts)
      expect(result.templatesNeedingMigration.length).toBeGreaterThan(0)
      
      // Migration candidates should match templates needing migration
      expect(result.migrationCandidates.length).toBe(result.templatesNeedingMigration.length)
    })

    it('should correctly categorize templates', () => {
      const result = scanner.scanAllTemplates()
      
      // Total should equal sum of categories
      expect(result.totalTemplates).toBe(
        result.templatesNeedingMigration.length + result.templatesAlreadyMigrated.length
      )
      
      // Each template should be in exactly one category
      const allTemplateIds = [
        ...result.templatesNeedingMigration.map(t => t.id),
        ...result.templatesAlreadyMigrated.map(t => t.id)
      ]
      expect(new Set(allTemplateIds).size).toBe(allTemplateIds.length)
    })
  })

  describe('getTemplatesByCategory', () => {
    it('should return templates for valid category', () => {
      const nftTemplates = scanner.getTemplatesByCategory('nft')
      expect(Array.isArray(nftTemplates)).toBe(true)
      
      if (nftTemplates.length > 0) {
        nftTemplates.forEach(template => {
          expect(template.category).toBe('nft')
        })
      }
    })

    it('should return empty array for invalid category', () => {
      const invalidTemplates = scanner.getTemplatesByCategory('invalid-category')
      expect(invalidTemplates).toEqual([])
    })
  })

  describe('getTemplateById', () => {
    it('should return template for valid ID', () => {
      // Test with known template ID
      const template = scanner.getTemplateById('nft-basic')
      expect(template).toBeDefined()
      if (template) {
        expect(template.id).toBe('nft-basic')
      }
    })

    it('should return undefined for invalid ID', () => {
      const template = scanner.getTemplateById('invalid-id')
      expect(template).toBeUndefined()
    })
  })

  describe('processSingleTemplate', () => {
    it('should process a template that needs migration', async () => {
      // Find a template that needs migration
      const scanResult = scanner.scanAllTemplates()
      if (scanResult.templatesNeedingMigration.length === 0) {
        // Skip test if no templates need migration
        return
      }

      const templateToMigrate = scanResult.templatesNeedingMigration[0]
      const result = await scanner.processSingleTemplate(templateToMigrate.id)
      
      expect(result).toBeDefined()
      if (result) {
        expect(result.originalTemplate.id).toBe(templateToMigrate.id)
        expect(result.migratedTemplate).toBeDefined()
        expect(result.transformationsApplied).toBeDefined()
        expect(result.validationResult).toBeDefined()
      }
    })

    it('should return null for invalid template ID', async () => {
      const result = await scanner.processSingleTemplate('invalid-id')
      expect(result).toBeNull()
    })
  })

  describe('processAllTemplates', () => {
    it('should process all templates and return results', async () => {
      const result = await scanner.processAllTemplates()
      
      expect(result.success).toBeDefined()
      expect(result.migratedTemplates).toBeDefined()
      expect(result.migrationResults).toBeDefined()
      expect(result.statistics).toBeDefined()
      expect(result.errors).toBeDefined()
      expect(result.warnings).toBeDefined()
      
      // Statistics should be consistent
      expect(result.statistics.totalFilesProcessed).toBeGreaterThanOrEqual(0)
      expect(result.statistics.successfulMigrations + result.statistics.failedMigrations)
        .toBeLessThanOrEqual(result.statistics.totalFilesProcessed)
    })

    it('should maintain template count after processing', async () => {
      const scanResult = scanner.scanAllTemplates()
      const processResult = await scanner.processAllTemplates()
      
      // Should have same number of templates after processing
      expect(processResult.migratedTemplates.length).toBe(scanResult.totalTemplates)
    })
  })

  describe('generateMigrationReport', () => {
    it('should generate a valid migration report', async () => {
      const processResult = await scanner.processAllTemplates()
      const report = scanner.generateMigrationReport(processResult)
      
      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)
      expect(report).toContain('# Template Migration Report')
      expect(report).toContain('## Summary')
      expect(report).toContain('Total templates processed')
    })
  })
})

describe('CadenceTemplateMigrator', () => {
  let migrator: CadenceTemplateMigrator
  let logger: MigrationLogger

  beforeEach(() => {
    logger = new MigrationLogger()
    migrator = new CadenceTemplateMigrator(logger)
  })

  describe('migrateTemplate', () => {
    it('should migrate template with legacy syntax', () => {
      const legacyTemplate: Template = {
        id: 'test-legacy',
        name: 'Test Legacy',
        description: 'Test template with legacy syntax',
        category: 'token',
        tags: ['Test'],
        author: 'Test',
        downloads: 0,
        featured: false,
        code: `pub contract TestContract {
          pub var totalSupply: UFix64
          
          pub resource Vault: Provider, Receiver {
            pub var balance: UFix64
            
            pub fun withdraw(amount: UFix64): @Vault {
              return <-create Vault(balance: amount)
            }
          }
        }`
      }

      const migratedTemplate = migrator.migrateTemplate(legacyTemplate)
      
      expect(migratedTemplate.code).not.toContain('pub ')
      expect(migratedTemplate.code).toContain('access(all)')
      expect(migratedTemplate.code).toContain('Provider & Receiver')
    })

    it('should skip migration for already modern template', () => {
      const modernTemplate: Template = {
        id: 'test-modern',
        name: 'Test Modern',
        description: 'Test template with modern syntax',
        category: 'token',
        tags: ['Test'],
        author: 'Test',
        downloads: 0,
        featured: false,
        code: `access(all) contract TestContract {
          access(all) var totalSupply: UFix64
          
          access(all) resource Vault: Provider & Receiver {
            access(all) var balance: UFix64
            
            access(all) fun withdraw(amount: UFix64): @Vault {
              return <-create Vault(balance: amount)
            }
          }
        }`
      }

      const migratedTemplate = migrator.migrateTemplate(modernTemplate)
      
      // Should be unchanged
      expect(migratedTemplate.code).toBe(modernTemplate.code)
    })
  })

  describe('validateTemplate', () => {
    it('should validate modern template successfully', () => {
      const modernTemplate: Template = {
        id: 'test-modern',
        name: 'Test Modern',
        description: 'Test template with modern syntax',
        category: 'token',
        tags: ['Test'],
        author: 'Test',
        downloads: 0,
        featured: false,
        code: `access(all) contract TestContract {
          access(all) var totalSupply: UFix64
        }`
      }

      const result = migrator.validateTemplate(modernTemplate)
      
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should detect legacy syntax in validation', () => {
      const legacyTemplate: Template = {
        id: 'test-legacy',
        name: 'Test Legacy',
        description: 'Test template with legacy syntax',
        category: 'token',
        tags: ['Test'],
        author: 'Test',
        downloads: 0,
        featured: false,
        code: `pub contract TestContract {
          pub var totalSupply: UFix64
        }`
      }

      const result = migrator.validateTemplate(legacyTemplate)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(error => error.includes('pub keyword'))).toBe(true)
    })
  })

  describe('updateTemplateMetadata', () => {
    it('should add Cadence 1.0 tag and update description', () => {
      const template: Template = {
        id: 'test',
        name: 'Test',
        description: 'Test template',
        category: 'token',
        tags: ['Test'],
        author: 'Test',
        downloads: 0,
        featured: false,
        code: 'test code'
      }

      const updated = migrator.updateTemplateMetadata(template)
      
      expect(updated.tags).toContain('Cadence 1.0')
      expect(updated.description).toContain('Cadence 1.0 compatibility')
    })

    it('should not duplicate Cadence 1.0 tag', () => {
      const template: Template = {
        id: 'test',
        name: 'Test',
        description: 'Test template (Updated for Cadence 1.0 compatibility)',
        category: 'token',
        tags: ['Test', 'Cadence 1.0'],
        author: 'Test',
        downloads: 0,
        featured: false,
        code: 'test code'
      }

      const updated = migrator.updateTemplateMetadata(template)
      
      const cadence10Tags = updated.tags.filter(tag => tag === 'Cadence 1.0')
      expect(cadence10Tags.length).toBe(1)
    })
  })
})