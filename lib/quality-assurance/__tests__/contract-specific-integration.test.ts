/**
 * Integration tests for Contract-Specific Validation with Comprehensive Validation System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ComprehensiveValidationSystem } from '../comprehensive-validation-system'
import { ContractType } from '../types'

describe('Contract-Specific Validation Integration', () => {
  let validationSystem: ComprehensiveValidationSystem

  beforeEach(() => {
    validationSystem = new ComprehensiveValidationSystem()
  })

  it('should integrate contract-specific validation for NFT contracts', async () => {
    const nftContract = `
      import NonFungibleToken from 0x1d7e57aa55817448
      import MetadataViews from 0x1d7e57aa55817448

      access(all) contract ExampleNFT: NonFungibleToken {
        access(all) var totalSupply: UInt64

        access(all) resource NFT: NonFungibleToken.INFT {
          access(all) let id: UInt64
          access(all) let name: String

          init(id: UInt64, name: String) {
            self.id = id
            self.name = name
          }

          access(all) fun resolveView(_ view: Type): AnyStruct? {
            return nil
          }

          access(all) fun getViews(): [Type] {
            return []
          }

          destroy() {}
        }

        access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
          access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

          init() {
            self.ownedNFTs <- {}
          }

          access(all) fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @ExampleNFT.NFT
            self.ownedNFTs[token.id] <-! token
          }

          access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID)!
            return <-token
          }

          access(all) fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
          }

          destroy() {
            destroy self.ownedNFTs
          }
        }

        access(all) fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}, name: String) {
          let newNFT <- create NFT(id: self.totalSupply, name: name)
          recipient.deposit(token: <-newNFT)
          self.totalSupply = self.totalSupply + 1
        }

        init() {
          self.totalSupply = 0
        }
      }
    `

    const context = {
      contractType: { category: 'nft', complexity: 'intermediate', features: [] } as ContractType
    }

    const result = await validationSystem.validateCode(nftContract, context)

    expect(result.contractSpecificValidation).toBeDefined()
    expect(result.contractSpecificValidation.contractType).toBe('nft')
    expect(result.contractSpecificValidation.complianceScore).toBeGreaterThan(70)
    // The contract has all required NFT features, so no missing features
    expect(result.contractSpecificValidation.missingFeatures).toHaveLength(0)
    expect(result.contractSpecificValidation.isValid).toBe(true)
  })

  it('should integrate contract-specific validation for fungible token contracts', async () => {
    const tokenContract = `
      import FungibleToken from 0xf233dcee88fe0abe

      access(all) contract ExampleToken: FungibleToken {
        access(all) var totalSupply: UFix64

        access(all) resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
          access(all) var balance: UFix64

          init(balance: UFix64) {
            self.balance = balance
          }

          access(all) fun withdraw(amount: UFix64): @FungibleToken.Vault {
            pre {
              self.balance >= amount: "Insufficient balance"
            }
            self.balance = self.balance - amount
            return <-create Vault(balance: amount)
          }

          access(all) fun deposit(from: @FungibleToken.Vault) {
            let vault <- from as! @ExampleToken.Vault
            self.balance = self.balance + vault.balance
            destroy vault
          }

          access(all) fun getBalance(): UFix64 {
            return self.balance
          }

          destroy() {}
        }

        access(all) resource Minter {
          access(all) fun mintTokens(amount: UFix64): @ExampleToken.Vault {
            ExampleToken.totalSupply = ExampleToken.totalSupply + amount
            return <-create Vault(balance: amount)
          }
        }

        init() {
          self.totalSupply = 0.0
        }
      }
    `

    const context = {
      contractType: { category: 'fungible-token', complexity: 'intermediate', features: [] } as ContractType
    }

    const result = await validationSystem.validateCode(tokenContract, context)

    expect(result.contractSpecificValidation).toBeDefined()
    expect(result.contractSpecificValidation.contractType).toBe('fungible-token')
    expect(result.contractSpecificValidation.complianceScore).toBeGreaterThan(60)
    // The contract is missing Admin Resource (recommended feature)
    expect(result.contractSpecificValidation.missingFeatures).toContain('Admin Resource')
    expect(result.recommendations).toContain('Validate positive amounts in transfer functions')
  })

  it('should integrate contract-specific validation for DAO contracts', async () => {
    const daoContract = `
      access(all) contract ExampleDAO {
        access(all) var proposalCount: UInt64

        access(all) resource Proposal {
          access(all) let id: UInt64
          access(all) let title: String
          access(all) var yesVotes: UInt64
          access(all) var noVotes: UInt64
          access(all) let endTime: UFix64
          access(all) var voters: {Address: Bool}

          init(title: String, votingPeriod: UFix64) {
            self.id = ExampleDAO.proposalCount
            self.title = title
            self.yesVotes = 0
            self.noVotes = 0
            self.endTime = getCurrentBlock().timestamp + votingPeriod
            self.voters = {}
            ExampleDAO.proposalCount = ExampleDAO.proposalCount + 1
          }
        }

        access(all) fun createProposal(title: String, votingPeriod: UFix64): @Proposal {
          return <-create Proposal(title: title, votingPeriod: votingPeriod)
        }

        access(all) fun vote(proposal: &Proposal, vote: Bool, voter: Address) {
          pre {
            !proposal.voters.containsKey(voter): "Already voted"
          }
          proposal.voters[voter] = true
          if vote {
            proposal.yesVotes = proposal.yesVotes + 1
          } else {
            proposal.noVotes = proposal.noVotes + 1
          }
        }

        access(all) fun executeProposal(proposal: &Proposal) {
          pre {
            getCurrentBlock().timestamp > proposal.endTime: "Voting not ended"
            proposal.yesVotes > proposal.noVotes: "Proposal rejected"
          }
          // Execute proposal logic
        }

        init() {
          self.proposalCount = 0
        }
      }
    `

    const context = {
      contractType: { category: 'dao', complexity: 'advanced', features: [] } as ContractType
    }

    const result = await validationSystem.validateCode(daoContract, context)

    expect(result.contractSpecificValidation).toBeDefined()
    expect(result.contractSpecificValidation.contractType).toBe('dao')
    expect(result.contractSpecificValidation.complianceScore).toBeGreaterThan(70)
    expect(result.contractSpecificValidation.isValid).toBe(true)
  })

  it('should integrate contract-specific validation for marketplace contracts', async () => {
    const marketplaceContract = `
      import NonFungibleToken from 0x1d7e57aa55817448
      import FungibleToken from 0xf233dcee88fe0abe

      access(all) contract ExampleMarketplace {
        access(all) var listingCount: UInt64

        access(all) resource Listing {
          access(all) let id: UInt64
          access(all) let nftID: UInt64
          access(all) let price: UFix64
          access(all) let seller: Address

          init(nftID: UInt64, price: UFix64, seller: Address) {
            pre {
              price > 0.0: "Price must be positive"
            }
            self.id = ExampleMarketplace.listingCount
            self.nftID = nftID
            self.price = price
            self.seller = seller
            ExampleMarketplace.listingCount = ExampleMarketplace.listingCount + 1
          }
        }

        access(all) event ListingCreated(id: UInt64, nftID: UInt64, price: UFix64, seller: Address)
        access(all) event Purchase(id: UInt64, buyer: Address, seller: Address)

        access(all) fun createListing(nft: @NonFungibleToken.NFT, price: UFix64, seller: Address): @Listing {
          let listing <- create Listing(nftID: nft.id, price: price, seller: seller)
          emit ListingCreated(id: listing.id, nftID: nft.id, price: price, seller: seller)
          destroy nft
          return <-listing
        }

        access(all) fun purchase(listing: &Listing, payment: @FungibleToken.Vault, buyer: Address) {
          pre {
            payment.balance >= listing.price: "Insufficient payment"
          }
          
          let commission = listing.price * 0.05
          let sellerAmount = listing.price - commission
          
          // Payment distribution logic would go here
          destroy payment
          
          emit Purchase(id: listing.id, buyer: buyer, seller: listing.seller)
        }

        access(all) fun removeListing(listing: &Listing, owner: Address) {
          pre {
            listing.seller == owner: "Only seller can remove"
          }
        }

        access(contract) fun adminFunction() {
          // Admin functionality
        }

        init() {
          self.listingCount = 0
        }
      }
    `

    const context = {
      contractType: { category: 'marketplace', complexity: 'advanced', features: [] } as ContractType
    }

    const result = await validationSystem.validateCode(marketplaceContract, context)

    expect(result.contractSpecificValidation).toBeDefined()
    expect(result.contractSpecificValidation.contractType).toBe('marketplace')
    expect(result.contractSpecificValidation.complianceScore).toBeGreaterThan(80)
    expect(result.contractSpecificValidation.isValid).toBe(true)
  })

  it('should provide contract-specific recommendations in overall recommendations', async () => {
    const incompleteNFTContract = `
      access(all) contract IncompleteNFT {
        access(all) resource NFT {
          access(all) let id: UInt64
          init(id: UInt64) {
            self.id = id
          }
        }

        init() {}
      }
    `

    const context = {
      contractType: { category: 'nft', complexity: 'simple', features: [] } as ContractType
    }

    const result = await validationSystem.validateCode(incompleteNFTContract, context)

    expect(result.recommendations).toContain('Import and implement NonFungibleToken interface for standard compliance')
    expect(result.recommendations).toContain('Implement Collection resource for NFT storage and management')
    expect(result.contractSpecificValidation.missingFeatures).toContain('NonFungibleToken Interface')
    expect(result.contractSpecificValidation.missingFeatures).toContain('Collection Resource')
  })

  it('should handle generic contracts without specific validation rules', async () => {
    const genericContract = `
      access(all) contract GenericContract {
        access(all) var value: String

        access(all) fun getValue(): String {
          return self.value
        }

        init() {
          self.value = "Hello, World!"
        }
      }
    `

    const context = {
      contractType: { category: 'generic', complexity: 'simple', features: [] } as ContractType
    }

    const result = await validationSystem.validateCode(genericContract, context)

    expect(result.contractSpecificValidation).toBeDefined()
    expect(result.contractSpecificValidation.contractType).toBe('generic')
    expect(result.contractSpecificValidation.isValid).toBe(true)
    expect(result.contractSpecificValidation.complianceScore).toBeGreaterThan(80)
  })
})