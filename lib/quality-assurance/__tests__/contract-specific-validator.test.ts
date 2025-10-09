/**
 * Tests for Contract-Specific Validation Rules
 * 
 * Tests validation rules for NFT, fungible token, DAO, and marketplace contracts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ContractSpecificValidator } from '../contract-specific-validator'
import { ContractType } from '../types'

describe('ContractSpecificValidator', () => {
  let validator: ContractSpecificValidator

  beforeEach(() => {
    validator = new ContractSpecificValidator()
  })

  describe('NFT Contract Validation', () => {
    const nftContractType: ContractType = {
      category: 'nft',
      complexity: 'intermediate',
      features: ['metadata', 'collection']
    }

    it('should validate complete NFT contract', async () => {
      const completeNFTContract = `
        import NonFungibleToken from 0x1d7e57aa55817448
        import MetadataViews from 0x1d7e57aa55817448

        access(all) contract ExampleNFT: NonFungibleToken {
          access(all) var totalSupply: UInt64

          access(all) resource NFT: NonFungibleToken.INFT {
            access(all) let id: UInt64
            access(all) let name: String
            access(all) let description: String
            access(all) let image: String

            init(id: UInt64, name: String, description: String, image: String) {
              self.id = id
              self.name = name
              self.description = description
              self.image = image
            }

            access(all) fun resolveView(_ view: Type): AnyStruct? {
              return nil
            }

            access(all) fun getViews(): [Type] {
              return []
            }

            destroy() {
              // Cleanup logic
            }
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

          access(all) fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}, name: String, description: String, image: String) {
            let newNFT <- create NFT(id: self.totalSupply, name: name, description: description, image: image)
            recipient.deposit(token: <-newNFT)
            self.totalSupply = self.totalSupply + 1
          }

          init() {
            self.totalSupply = 0
          }
        }
      `

      const result = await validator.validateContract(completeNFTContract, nftContractType)

      expect(result.contractType).toBe('nft')
      expect(result.isValid).toBe(true)
      expect(result.complianceScore).toBeGreaterThan(80)
      expect(result.missingFeatures).toHaveLength(0)
    })

    it('should identify missing NFT interface', async () => {
      const incompleteNFTContract = `
        access(all) contract ExampleNFT {
          access(all) var totalSupply: UInt64

          access(all) resource NFT {
            access(all) let id: UInt64
            init(id: UInt64) {
              self.id = id
            }
          }

          init() {
            self.totalSupply = 0
          }
        }
      `

      const result = await validator.validateContract(incompleteNFTContract, nftContractType)

      expect(result.isValid).toBe(false)
      expect(result.specificIssues.some(issue => issue.type === 'missing-nonfungibletoken-interface')).toBe(true)
      expect(result.missingFeatures).toContain('NonFungibleToken Interface')
    })

    it('should identify missing Collection resource', async () => {
      const nftWithoutCollection = `
        import NonFungibleToken from 0x1d7e57aa55817448

        access(all) contract ExampleNFT: NonFungibleToken {
          access(all) resource NFT: NonFungibleToken.INFT {
            access(all) let id: UInt64
            init(id: UInt64) {
              self.id = id
            }
          }

          init() {}
        }
      `

      const result = await validator.validateContract(nftWithoutCollection, nftContractType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-collection-resource')).toBe(true)
      expect(result.missingFeatures).toContain('Collection Resource')
    })

    it('should recommend MetadataViews support', async () => {
      const nftWithoutMetadata = `
        import NonFungibleToken from 0x1d7e57aa55817448

        access(all) contract ExampleNFT: NonFungibleToken {
          access(all) resource NFT: NonFungibleToken.INFT {
            access(all) let id: UInt64
            init(id: UInt64) {
              self.id = id
            }
          }

          access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
            access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
            init() {
              self.ownedNFTs <- {}
            }
            destroy() {
              destroy self.ownedNFTs
            }
          }

          init() {}
        }
      `

      const result = await validator.validateContract(nftWithoutMetadata, nftContractType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-metadataviews-support')).toBe(true)
      expect(result.recommendations).toContain('Add MetadataViews support for better marketplace compatibility')
    })
  })

  describe('Fungible Token Contract Validation', () => {
    const fungibleTokenType: ContractType = {
      category: 'fungible-token',
      complexity: 'intermediate',
      features: ['minting', 'burning']
    }

    it('should validate complete fungible token contract', async () => {
      const completeFungibleToken = `
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
                amount > 0.0: "Amount must be positive"
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

            destroy() {
              ExampleToken.totalSupply = ExampleToken.totalSupply - self.balance
            }
          }

          access(all) resource Minter {
            access(all) fun mintTokens(amount: UFix64): @ExampleToken.Vault {
              pre {
                amount > 0.0: "Amount must be positive"
              }
              ExampleToken.totalSupply = ExampleToken.totalSupply + amount
              return <-create Vault(balance: amount)
            }
          }

          access(all) resource Administrator {
            access(all) fun createNewMinter(): @Minter {
              return <-create Minter()
            }
          }

          init() {
            self.totalSupply = 0.0
          }
        }
      `

      const result = await validator.validateContract(completeFungibleToken, fungibleTokenType)

      expect(result.contractType).toBe('fungible-token')
      expect(result.isValid).toBe(true)
      expect(result.complianceScore).toBeGreaterThan(80)
      expect(result.missingFeatures).toHaveLength(0)
    })

    it('should identify missing FungibleToken interface', async () => {
      const tokenWithoutInterface = `
        access(all) contract ExampleToken {
          access(all) var totalSupply: UFix64

          access(all) resource Vault {
            access(all) var balance: UFix64
            init(balance: UFix64) {
              self.balance = balance
            }
          }

          init() {
            self.totalSupply = 0.0
          }
        }
      `

      const result = await validator.validateContract(tokenWithoutInterface, fungibleTokenType)

      expect(result.isValid).toBe(false)
      expect(result.specificIssues.some(issue => issue.type === 'missing-fungibletoken-interface')).toBe(true)
      expect(result.missingFeatures).toContain('FungibleToken Interface')
    })

    it('should identify missing supply tracking', async () => {
      const tokenWithoutSupply = `
        import FungibleToken from 0xf233dcee88fe0abe

        access(all) contract ExampleToken: FungibleToken {
          access(all) resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
            access(all) var balance: UFix64
            init(balance: UFix64) {
              self.balance = balance
            }
          }

          init() {}
        }
      `

      const result = await validator.validateContract(tokenWithoutSupply, fungibleTokenType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-supply-management')).toBe(true)
      expect(result.missingFeatures).toContain('Supply Management')
    })

    it('should recommend balance validation', async () => {
      const tokenWithoutValidation = `
        import FungibleToken from 0xf233dcee88fe0abe

        access(all) contract ExampleToken: FungibleToken {
          access(all) var totalSupply: UFix64

          access(all) resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
            access(all) var balance: UFix64

            access(all) fun withdraw(amount: UFix64): @FungibleToken.Vault {
              self.balance = self.balance - amount
              return <-create Vault(balance: amount)
            }

            access(all) fun deposit(from: @FungibleToken.Vault) {
              let vault <- from as! @ExampleToken.Vault
              self.balance = self.balance + vault.balance
              destroy vault
            }

            init(balance: UFix64) {
              self.balance = balance
            }
          }

          init() {
            self.totalSupply = 0.0
          }
        }
      `

      const result = await validator.validateContract(tokenWithoutValidation, fungibleTokenType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-balance-validation')).toBe(true)
      expect(result.recommendations).toContain('Add balance validation to prevent overdrafts')
    })
  })

  describe('DAO Contract Validation', () => {
    const daoContractType: ContractType = {
      category: 'dao',
      complexity: 'advanced',
      features: ['voting', 'proposals', 'governance']
    }

    it('should validate complete DAO contract', async () => {
      const completeDAOContract = `
        access(all) contract ExampleDAO {
          access(all) var proposalCount: UInt64

          access(all) resource Proposal {
            access(all) let id: UInt64
            access(all) let title: String
            access(all) let description: String
            access(all) var yesVotes: UInt64
            access(all) var noVotes: UInt64
            access(all) let endTime: UFix64
            access(all) var voters: {Address: Bool}
            access(all) var executed: Bool

            init(title: String, description: String, votingPeriod: UFix64) {
              self.id = ExampleDAO.proposalCount
              self.title = title
              self.description = description
              self.yesVotes = 0
              self.noVotes = 0
              self.endTime = getCurrentBlock().timestamp + votingPeriod
              self.voters = {}
              self.executed = false
              ExampleDAO.proposalCount = ExampleDAO.proposalCount + 1
            }
          }

          access(all) fun createProposal(title: String, description: String, votingPeriod: UFix64): @Proposal {
            return <-create Proposal(title: title, description: description, votingPeriod: votingPeriod)
          }

          access(all) fun vote(proposal: &Proposal, vote: Bool, voter: Address, votingPower: UInt64) {
            pre {
              getCurrentBlock().timestamp <= proposal.endTime: "Voting period has ended"
              !proposal.voters.containsKey(voter): "Already voted"
              votingPower > 0: "Must have voting power"
            }

            proposal.voters[voter] = true
            if vote {
              proposal.yesVotes = proposal.yesVotes + votingPower
            } else {
              proposal.noVotes = proposal.noVotes + votingPower
            }
          }

          access(all) fun executeProposal(proposal: &Proposal, quorum: UInt64) {
            pre {
              getCurrentBlock().timestamp > proposal.endTime: "Voting period not ended"
              !proposal.executed: "Already executed"
              proposal.yesVotes + proposal.noVotes >= quorum: "Quorum not met"
              proposal.yesVotes > proposal.noVotes: "Proposal rejected"
            }

            proposal.executed = true
            // Execute proposal logic here
          }

          init() {
            self.proposalCount = 0
          }
        }
      `

      const result = await validator.validateContract(completeDAOContract, daoContractType)

      expect(result.contractType).toBe('dao')
      expect(result.isValid).toBe(true)
      expect(result.complianceScore).toBeGreaterThan(70)
    })

    it('should identify missing voting mechanism', async () => {
      const daoWithoutVoting = `
        access(all) contract ExampleDAO {
          access(all) resource Proposal {
            access(all) let id: UInt64
            access(all) let title: String

            init(title: String) {
              self.id = 0
              self.title = title
            }
          }

          access(all) fun createProposal(title: String): @Proposal {
            return <-create Proposal(title: title)
          }

          init() {}
        }
      `

      const result = await validator.validateContract(daoWithoutVoting, daoContractType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-voting-mechanism')).toBe(true)
      expect(result.missingFeatures).toContain('Voting Mechanism')
    })

    it('should identify missing double vote prevention', async () => {
      const daoWithoutPrevention = `
        access(all) contract ExampleDAO {
          access(all) resource Proposal {
            access(all) let id: UInt64
            access(all) var yesVotes: UInt64
            access(all) var noVotes: UInt64

            init() {
              self.id = 0
              self.yesVotes = 0
              self.noVotes = 0
            }
          }

          access(all) fun vote(proposal: &Proposal, vote: Bool) {
            if vote {
              proposal.yesVotes = proposal.yesVotes + 1
            } else {
              proposal.noVotes = proposal.noVotes + 1
            }
          }

          init() {}
        }
      `

      const result = await validator.validateContract(daoWithoutPrevention, daoContractType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-double-vote-prevention')).toBe(true)
      expect(result.recommendations).toContain('Implement double voting prevention mechanism')
    })
  })

  describe('Marketplace Contract Validation', () => {
    const marketplaceType: ContractType = {
      category: 'marketplace',
      complexity: 'advanced',
      features: ['listings', 'purchases', 'commissions']
    }

    it('should validate complete marketplace contract', async () => {
      const completeMarketplace = `
        import NonFungibleToken from 0x1d7e57aa55817448
        import FungibleToken from 0xf233dcee88fe0abe

        access(all) contract ExampleMarketplace {
          access(all) var listingCount: UInt64

          access(all) resource Listing {
            access(all) let id: UInt64
            access(all) let nftID: UInt64
            access(all) let price: UFix64
            access(all) let seller: Address
            access(all) var active: Bool

            init(nftID: UInt64, price: UFix64, seller: Address) {
              pre {
                price > 0.0: "Price must be positive"
              }
              self.id = ExampleMarketplace.listingCount
              self.nftID = nftID
              self.price = price
              self.seller = seller
              self.active = true
              ExampleMarketplace.listingCount = ExampleMarketplace.listingCount + 1
            }
          }

          access(all) event ListingCreated(id: UInt64, nftID: UInt64, price: UFix64, seller: Address)
          access(all) event Purchase(id: UInt64, nftID: UInt64, price: UFix64, buyer: Address, seller: Address)

          access(all) fun createListing(nft: @NonFungibleToken.NFT, price: UFix64, seller: Address): @Listing {
            pre {
              price > 0.0: "Price must be positive"
            }
            
            let listing <- create Listing(nftID: nft.id, price: price, seller: seller)
            emit ListingCreated(id: listing.id, nftID: nft.id, price: price, seller: seller)
            
            // Store NFT in escrow
            destroy nft
            
            return <-listing
          }

          access(all) fun purchase(listing: &Listing, payment: @FungibleToken.Vault, buyer: Address): @NonFungibleToken.NFT? {
            pre {
              listing.active: "Listing not active"
              payment.balance >= listing.price: "Insufficient payment"
            }

            listing.active = false
            
            // Calculate commission (5%)
            let commission = listing.price * 0.05
            let sellerAmount = listing.price - commission
            
            // Distribute payment to seller
            let sellerPayment <- payment.withdraw(amount: sellerAmount)
            // Send sellerPayment to seller (implementation depends on setup)
            destroy sellerPayment
            
            // Keep commission
            destroy payment
            
            emit Purchase(id: listing.id, nftID: listing.nftID, price: listing.price, buyer: buyer, seller: listing.seller)
            
            // Return NFT to buyer (implementation depends on escrow setup)
            return nil
          }

          access(all) fun removeListing(listing: &Listing, owner: Address) {
            pre {
              listing.seller == owner: "Only seller can remove listing"
            }
            listing.active = false
          }

          access(contract) fun adminFunction() {
            // Admin-only functionality
          }

          init() {
            self.listingCount = 0
          }
        }
      `

      const result = await validator.validateContract(completeMarketplace, marketplaceType)

      expect(result.contractType).toBe('marketplace')
      expect(result.isValid).toBe(true)
      expect(result.complianceScore).toBeGreaterThan(70)
    })

    it('should identify missing purchase function', async () => {
      const marketplaceWithoutPurchase = `
        access(all) contract ExampleMarketplace {
          access(all) resource Listing {
            access(all) let id: UInt64
            access(all) let price: UFix64

            init(price: UFix64) {
              self.id = 0
              self.price = price
            }
          }

          access(all) fun createListing(price: UFix64): @Listing {
            return <-create Listing(price: price)
          }

          init() {}
        }
      `

      const result = await validator.validateContract(marketplaceWithoutPurchase, marketplaceType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-purchase-function')).toBe(true)
      expect(result.missingFeatures).toContain('Purchase Function')
    })

    it('should identify missing payment distribution', async () => {
      const marketplaceWithoutDistribution = `
        import FungibleToken from 0xf233dcee88fe0abe

        access(all) contract ExampleMarketplace {
          access(all) resource Listing {
            access(all) let price: UFix64
            init(price: UFix64) {
              self.price = price
            }
          }

          access(all) fun purchase(listing: &Listing, payment: @FungibleToken.Vault) {
            // Missing payment distribution logic
            destroy payment
          }

          init() {}
        }
      `

      const result = await validator.validateContract(marketplaceWithoutDistribution, marketplaceType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-payment-distribution')).toBe(true)
      expect(result.recommendations).toContain('Implement proper payment distribution to sellers')
    })
  })

  describe('Generic Contract Validation', () => {
    const genericType: ContractType = {
      category: 'generic',
      complexity: 'simple',
      features: []
    }

    it('should validate basic contract structure', async () => {
      const basicContract = `
        access(all) contract ExampleContract {
          access(all) var value: String

          init() {
            self.value = "Hello, World!"
          }

          access(all) fun getValue(): String {
            return self.value
          }
        }
      `

      const result = await validator.validateContract(basicContract, genericType)

      expect(result.contractType).toBe('generic')
      expect(result.isValid).toBe(true)
      expect(result.complianceScore).toBeGreaterThan(80)
    })

    it('should identify missing contract declaration', async () => {
      const invalidContract = `
        access(all) var value: String

        init() {
          value = "Hello"
        }
      `

      const result = await validator.validateContract(invalidContract, genericType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-contract-declaration')).toBe(true)
      expect(result.missingFeatures).toContain('Contract Declaration')
    })

    it('should identify missing init function', async () => {
      const contractWithoutInit = `
        access(all) contract ExampleContract {
          access(all) var value: String
        }
      `

      const result = await validator.validateContract(contractWithoutInit, genericType)

      expect(result.specificIssues.some(issue => issue.type === 'missing-init-function')).toBe(true)
      expect(result.missingFeatures).toContain('Init Function')
    })
  })

  describe('Error Handling', () => {
    it('should handle validation failures gracefully', async () => {
      const validator = new ContractSpecificValidator()
      
      // Mock a validation failure by passing invalid input
      const result = await validator.validateContract('', {
        category: 'nft',
        complexity: 'simple',
        features: []
      })

      expect(result.isValid).toBe(false)
      expect(result.complianceScore).toBe(0)
      expect(result.recommendations).toContain('Import and implement NonFungibleToken interface for standard compliance')
    })
  })

  describe('Compliance Score Calculation', () => {
    it('should calculate accurate compliance scores', async () => {
      const partialNFTContract = `
        import NonFungibleToken from 0x1d7e57aa55817448

        access(all) contract ExampleNFT: NonFungibleToken {
          access(all) resource NFT: NonFungibleToken.INFT {
            access(all) let id: UInt64
            init(id: UInt64) {
              self.id = id
            }
          }

          init() {}
        }
      `

      const result = await validator.validateContract(partialNFTContract, {
        category: 'nft',
        complexity: 'simple',
        features: []
      })

      // Should have some compliance but not full due to missing features
      expect(result.complianceScore).toBeGreaterThan(0)
      expect(result.complianceScore).toBeLessThan(100)
      expect(result.missingFeatures.length).toBeGreaterThan(0)
    })
  })
})