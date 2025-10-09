/**
 * Integration tests for NFT marketplace template migration
 * Tests the migration of the NFT marketplace template to Cadence 1.0 syntax
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { Template } from '../../templates'
import { NFTMarketplaceMigration } from '../nft-marketplace-migration'
import { CadenceTemplateMigrator } from '../template-migrator'

describe('NFT Marketplace Migration', () => {
  let migration: NFTMarketplaceMigration
  let migrator: CadenceTemplateMigrator
  let legacyTemplate: Template

  beforeEach(() => {
    migration = new NFTMarketplaceMigration()
    migrator = new CadenceTemplateMigrator()

    // Legacy NFT marketplace template with old syntax
    legacyTemplate = {
      id: "nft-marketplace-legacy",
      name: "NFT Marketplace (Legacy)",
      description: "Legacy marketplace template",
      category: "marketplace",
      tags: ["NFT", "Marketplace"],
      author: "VibeMore",
      downloads: 0,
      featured: false,
      code: `pub contract NFTMarketplace {
    pub event ForSale(id: UInt64, price: UFix64, owner: Address?)
    pub event TokenPurchased(id: UInt64, price: UFix64, seller: Address?, buyer: Address?)

    pub resource interface SalePublic {
        pub fun purchase(tokenID: UInt64, recipient: &AnyResource{}, buyTokens: @FungibleToken.Vault)
        pub fun idPrice(tokenID: UInt64): UFix64?
        pub fun getIDs(): [UInt64]
    }

    pub resource SaleCollection: SalePublic {
        access(self) var forSale: {UInt64: UFix64}
        access(self) var nftCollection: &NFTCollection

        init(collection: &NFTCollection) {
            self.forSale = {}
            self.nftCollection = collection
        }

        pub fun listForSale(tokenID: UInt64, price: UFix64) {
            self.forSale[tokenID] = price
            emit ForSale(id: tokenID, price: price, owner: self.owner?.address)
        }

        pub fun purchase(tokenID: UInt64, recipient: &AnyResource{}, buyTokens: @FungibleToken.Vault) {
            let price = self.forSale[tokenID]!
            self.forSale.remove(key: tokenID)

            let vaultRef = self.owner!.getCapability(/public/MainReceiver)
                .borrow<&{FungibleToken.Receiver}>()
                ?? panic("Could not borrow receiver reference")

            vaultRef.deposit(from: <-buyTokens)
            emit TokenPurchased(id: tokenID, price: price, seller: self.owner?.address, buyer: recipient.owner?.address)
        }

        pub fun idPrice(tokenID: UInt64): UFix64? {
            return self.forSale[tokenID]
        }

        pub fun getIDs(): [UInt64] {
            return self.forSale.keys
        }
    }

    pub fun createSaleCollection(collection: &NFTCollection): @SaleCollection {
        return <- create SaleCollection(collection: collection)
    }
}`
    }
  })

  test('should migrate NFT marketplace template successfully', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    expect(migratedTemplate).toBeDefined()
    expect(migratedTemplate.id).toBe(legacyTemplate.id)
    expect(migratedTemplate.name).toBe(legacyTemplate.name)
    expect(migratedTemplate.code).not.toBe(legacyTemplate.code)
  })

  test('should transform pub keywords to access(all)', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    // Should not contain pub keywords
    expect(migratedTemplate.code).not.toMatch(/\bpub\s+(?:var|let|fun|resource|struct|contract|interface|event)/)
    
    // Should contain access(all) modifiers
    expect(migratedTemplate.code).toContain('access(all)')
  })

  test('should transform interface conformance syntax', () => {
    const templateWithInterfaces: Template = {
      ...legacyTemplate,
      code: `pub contract Test {
        pub resource TestResource: Interface1, Interface2 {
          pub fun test() {}
        }
      }`
    }

    const migratedTemplate = migration.migrateNFTMarketplace(templateWithInterfaces)

    // Should use modern interface conformance syntax (ampersand)
    expect(migratedTemplate.code).toContain('NonFungibleToken.Provider, NonFungibleToken.CollectionPublic')
    expect(migratedTemplate.code).not.toMatch(/Interface1,\s*Interface2/)
  })

  test('should transform capability access patterns', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    // Should use modern capability patterns
    expect(migratedTemplate.code).toContain('Capability<')
    expect(migratedTemplate.code).toContain('.borrow()')
  })

  test('should add view modifiers to getter functions', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    // Should have view modifiers on getter functions
    expect(migratedTemplate.code).toMatch(/access\(all\)\s+view\s+fun\s+(?:idPrice|getIDs)/)
  })

  test('should update template metadata', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    // Should add Cadence 1.0 tag
    expect(migratedTemplate.tags).toContain('Cadence 1.0')
    
    // Should update description
    expect(migratedTemplate.description).toContain('Cadence 1.0 compatibility')
  })

  test('should validate migrated template', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)
    const validationResult = migrator.validateTemplate(migratedTemplate)

    expect(validationResult.isValid).toBe(true)
    expect(validationResult.errors).toHaveLength(0)
  })

  test('should not contain legacy syntax patterns', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    // Should not contain legacy patterns
    expect(migratedTemplate.code).not.toMatch(/\bpub\s+/)
    expect(migratedTemplate.code).not.toMatch(/\bpub\(set\)\s+/)
    expect(migratedTemplate.code).not.toMatch(/&AnyResource\{/)
    expect(migratedTemplate.code).not.toMatch(/\.getCapability\(/)
  })

  test('should preserve contract functionality', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    // Should preserve core marketplace functions
    expect(migratedTemplate.code).toContain('fun listForSale')
    expect(migratedTemplate.code).toContain('fun purchase')
    expect(migratedTemplate.code).toContain('fun cancelSale')
    expect(migratedTemplate.code).toContain('fun changePrice')
    expect(migratedTemplate.code).toContain('fun idPrice')
    expect(migratedTemplate.code).toContain('fun getIDs')

    // Should preserve events
    expect(migratedTemplate.code).toContain('event ForSale')
    expect(migratedTemplate.code).toContain('event TokenPurchased')
    expect(migratedTemplate.code).toContain('event PriceChanged')
    expect(migratedTemplate.code).toContain('event SaleCanceled')
  })

  test('should use modern capability-based architecture', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    // Should use capability-based access
    expect(migratedTemplate.code).toContain('nftProviderCapability')
    expect(migratedTemplate.code).toContain('ownerVaultCapability')
    expect(migratedTemplate.code).toContain('Capability<&{NonFungibleToken.Provider')
    expect(migratedTemplate.code).toContain('Capability<&{FungibleToken.Receiver}>')
  })

  test('should include proper imports', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    // Should include necessary imports
    expect(migratedTemplate.code).toContain('import "NonFungibleToken"')
    expect(migratedTemplate.code).toContain('import "FungibleToken"')
    expect(migratedTemplate.code).toContain('import "MetadataViews"')
  })

  test('should include enhanced marketplace features', () => {
    const migratedTemplate = migration.migrateNFTMarketplace(legacyTemplate)

    // Should include enhanced features
    expect(migratedTemplate.code).toContain('struct SaleInfo')
    expect(migratedTemplate.code).toContain('fun getSaleInfo')
    expect(migratedTemplate.code).toContain('fun getAllSaleInfo')
    expect(migratedTemplate.code).toContain('MarketplaceStoragePath')
    expect(migratedTemplate.code).toContain('MarketplacePublicPath')
  })
})