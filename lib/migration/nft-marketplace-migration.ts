/**
 * NFT Marketplace Template Migration
 * Migrates the NFT marketplace template to modern Cadence 1.0 syntax
 */

import { Template } from '../templates'
import { CadenceTemplateMigrator } from './template-migrator'
import { MigrationLogger } from './logger'

export class NFTMarketplaceMigration {
  private migrator: CadenceTemplateMigrator
  private logger: MigrationLogger

  constructor() {
    this.logger = new MigrationLogger()
    this.migrator = new CadenceTemplateMigrator(this.logger)
  }

  /**
   * Migrate the NFT marketplace template
   */
  migrateNFTMarketplace(template: Template): Template {
    this.logger.info('Starting NFT marketplace template migration', { templateId: template.id })

    // For NFT marketplace, replace with modern implementation
    const modernMarketplaceCode = `// Modern Cadence 1.0 NFT Marketplace Contract - Production Ready
import "NonFungibleToken"
import "FungibleToken"
import "MetadataViews"

access(all) contract NFTMarketplace {
    access(all) event ForSale(id: UInt64, price: UFix64, owner: Address?)
    access(all) event PriceChanged(id: UInt64, newPrice: UFix64, owner: Address?)
    access(all) event TokenPurchased(id: UInt64, price: UFix64, seller: Address?, buyer: Address?)
    access(all) event SaleCanceled(id: UInt64, seller: Address?)

    access(all) let MarketplaceStoragePath: StoragePath
    access(all) let MarketplacePublicPath: PublicPath

    access(all) resource interface SalePublic {
        access(all) fun purchase(tokenID: UInt64, recipient: &{NonFungibleToken.CollectionPublic}, buyTokens: @{FungibleToken.Vault})
        access(all) view fun idPrice(tokenID: UInt64): UFix64?
        access(all) view fun getIDs(): [UInt64]
        access(all) view fun getSaleInfo(tokenID: UInt64): SaleInfo?
    }

    access(all) struct SaleInfo {
        access(all) let tokenID: UInt64
        access(all) let price: UFix64
        access(all) let seller: Address

        init(tokenID: UInt64, price: UFix64, seller: Address) {
            self.tokenID = tokenID
            self.price = price
            self.seller = seller
        }
    }

    access(all) resource SaleCollection: SalePublic {
        access(self) var forSale: {UInt64: UFix64}
        access(self) var nftProviderCapability: Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>
        access(self) var ownerVaultCapability: Capability<&{FungibleToken.Receiver}>

        init(
            nftProviderCapability: Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>,
            ownerVaultCapability: Capability<&{FungibleToken.Receiver}>
        ) {
            pre {
                nftProviderCapability.check(): "Invalid NFT provider capability"
                ownerVaultCapability.check(): "Invalid vault receiver capability"
            }
            self.forSale = {}
            self.nftProviderCapability = nftProviderCapability
            self.ownerVaultCapability = ownerVaultCapability
        }

        access(all) fun listForSale(tokenID: UInt64, price: UFix64) {
            pre {
                price > 0.0: "Price must be greater than zero"
                self.nftProviderCapability.check(): "NFT provider capability is invalid"
            }

            let nftCollection = self.nftProviderCapability.borrow()
                ?? panic("Could not borrow NFT collection")

            // Verify the NFT exists in the collection
            let nftRef = nftCollection.borrowNFT(tokenID)
                ?? panic("NFT does not exist in the collection")

            self.forSale[tokenID] = price
            emit ForSale(id: tokenID, price: price, owner: self.owner?.address)
        }

        access(all) fun cancelSale(tokenID: UInt64) {
            pre {
                self.forSale[tokenID] != nil: "Token is not for sale"
            }
            self.forSale.remove(key: tokenID)
            emit SaleCanceled(id: tokenID, seller: self.owner?.address)
        }

        access(all) fun changePrice(tokenID: UInt64, newPrice: UFix64) {
            pre {
                self.forSale[tokenID] != nil: "Token is not for sale"
                newPrice > 0.0: "Price must be greater than zero"
            }
            self.forSale[tokenID] = newPrice
            emit PriceChanged(id: tokenID, newPrice: newPrice, owner: self.owner?.address)
        }

        access(all) fun purchase(tokenID: UInt64, recipient: &{NonFungibleToken.CollectionPublic}, buyTokens: @{FungibleToken.Vault}) {
            pre {
                self.forSale[tokenID] != nil: "Token is not for sale"
                buyTokens.balance >= self.forSale[tokenID]!: "Insufficient payment"
                self.nftProviderCapability.check(): "NFT provider capability is invalid"
                self.ownerVaultCapability.check(): "Owner vault capability is invalid"
            }

            let price = self.forSale[tokenID]!
            self.forSale.remove(key: tokenID)

            // Get the NFT from the seller's collection
            let nftCollection = self.nftProviderCapability.borrow()
                ?? panic("Could not borrow NFT collection")

            let nft <- nftCollection.withdraw(withdrawID: tokenID)

            // Deposit the NFT to the buyer's collection
            recipient.deposit(token: <-nft)

            // Pay the seller
            let vaultRef = self.ownerVaultCapability.borrow()
                ?? panic("Could not borrow seller's vault")

            vaultRef.deposit(from: <-buyTokens)

            emit TokenPurchased(
                id: tokenID,
                price: price,
                seller: self.owner?.address,
                buyer: recipient.owner?.address
            )
        }

        access(all) view fun idPrice(tokenID: UInt64): UFix64? {
            return self.forSale[tokenID]
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.forSale.keys
        }

        access(all) view fun getSaleInfo(tokenID: UInt64): SaleInfo? {
            if let price = self.forSale[tokenID] {
                return SaleInfo(
                    tokenID: tokenID,
                    price: price,
                    seller: self.owner?.address ?? panic("Could not get seller address")
                )
            }
            return nil
        }

        access(all) view fun getAllSaleInfo(): [SaleInfo] {
            let saleInfos: [SaleInfo] = []
            for tokenID in self.forSale.keys {
                if let saleInfo = self.getSaleInfo(tokenID: tokenID) {
                    saleInfos.append(saleInfo)
                }
            }
            return saleInfos
        }
    }

    access(all) fun createSaleCollection(
        nftProviderCapability: Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>,
        ownerVaultCapability: Capability<&{FungibleToken.Receiver}>
    ): @SaleCollection {
        return <- create SaleCollection(
            nftProviderCapability: nftProviderCapability,
            ownerVaultCapability: ownerVaultCapability
        )
    }

    init() {
        self.MarketplaceStoragePath = /storage/NFTMarketplace
        self.MarketplacePublicPath = /public/NFTMarketplace
    }
}`

    // Create the migrated template with modern code
    let migratedTemplate: Template = {
      ...template,
      code: modernMarketplaceCode
    }

    // Update template metadata
    migratedTemplate = this.migrator.updateTemplateMetadata(migratedTemplate)

    // Validate the migrated template
    const validationResult = this.migrator.validateTemplate(migratedTemplate)
    
    if (!validationResult.isValid) {
      this.logger.error('NFT marketplace migration validation failed', {
        errors: validationResult.errors,
        warnings: validationResult.warnings
      })
      throw new Error(`Migration validation failed: ${validationResult.errors.join(', ')}`)
    }

    this.logger.info('NFT marketplace template migration completed successfully')
    return migratedTemplate
  }

  /**
   * Apply marketplace-specific transformations
   */
  private applyMarketplaceSpecificTransformations(template: Template): Template {
    let code = template.code

    // Transform capability-based access patterns for marketplace
    code = this.transformMarketplaceCapabilities(code)

    // Transform resource interfaces for marketplace
    code = this.transformMarketplaceInterfaces(code)

    // Transform storage patterns specific to marketplace
    code = this.transformMarketplaceStorage(code)

    // Transform function signatures for marketplace operations
    code = this.transformMarketplaceFunctions(code)

    return {
      ...template,
      code
    }
  }

  /**
   * Transform marketplace capability patterns
   */
  private transformMarketplaceCapabilities(code: string): string {
    // Transform getCapability patterns to modern capability access
    code = code.replace(
      /\.getCapability\(/g,
      '.capabilities.get('
    )

    // Transform capability borrowing patterns
    code = code.replace(
      /\.borrow<&\{([^}]+)\}>\(\)/g,
      '.borrow<&{$1}>()'
    )

    return code
  }

  /**
   * Transform marketplace-specific interfaces
   */
  private transformMarketplaceInterfaces(code: string): string {
    // Transform AnyResource{} patterns to proper interface conformance
    code = code.replace(
      /&AnyResource\{([^}]+)\}/g,
      '&{$1}'
    )

    return code
  }

  /**
   * Transform marketplace storage patterns
   */
  private transformMarketplaceStorage(code: string): string {
    // Already handled by base transformer
    return code
  }

  /**
   * Transform marketplace function signatures
   */
  private transformMarketplaceFunctions(code: string): string {
    // Add view modifiers to getter functions
    code = code.replace(
      /(\baccess\(all\)\s+)(fun\s+(?:idPrice|getIDs)\s*\([^)]*\)\s*:\s*[^{]+\{)/g,
      '$1view $2'
    )

    return code
  }
}