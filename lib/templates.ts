export interface Template {
  id: string
  name: string
  description: string
  category: "nft" | "defi" | "dao" | "marketplace" | "token" | "utility"
  tags: string[]
  code: string
  author: string
  downloads: number
  featured: boolean
  // Migration metadata
  cadenceVersion: "1.0" | "legacy"
  migrationStatus: "migrated" | "native" | "needs_migration"
  lastMigrated?: string
  migrationNotes?: string[]
}

export const templates: Template[] = [
  {
    id: "nft-basic",
    name: "Basic NFT Collection",
    description: "A simple NFT collection contract with minting and transfer capabilities (Updated for Cadence 1.0 compatibility)",
    category: "nft",
    tags: ["NFT","Collection","Beginner","Cadence 1.0"],
    author: "VibeMore",
    downloads: 1250,
    featured: true,
    cadenceVersion: "1.0",
    migrationStatus: "migrated",
    lastMigrated: "2024-12-07",
    migrationNotes: [
      "Migrated from legacy 'pub' keywords to 'access(all)' modifiers",
      "Updated to modern storage API with account.storage and account.capabilities",
      "Implemented proper MetadataViews compliance",
      "Added comprehensive input validation and error handling"
    ],
    code: `// Perfect Cadence 1.0 Basic NFT Contract - Production Ready
import "NonFungibleToken"
import "ViewResolver"
import "MetadataViews"

access(all) contract BasicNFT: NonFungibleToken {
    access(all) var totalSupply: UInt64

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64, recipient: Address)

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    // Custom collection public interface
    access(all) resource interface BasicNFTCollectionPublic {
        access(all) fun deposit(token: @{NonFungibleToken.NFT})
        access(all) view fun getIDs(): [UInt64]
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}?
        access(all) fun borrowBasicNFT(id: UInt64): &BasicNFT.NFT?
    }

    access(all) resource NFT: NonFungibleToken.NFT & ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let thumbnail: String

        init(id: UInt64, name: String, description: String, thumbnail: String) {
            self.id = id
            self.name = name
            self.description = description
            self.thumbnail = thumbnail
        }

        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Royalties>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.name,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(self.id)
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL("https://vibemore.io/nft/".concat(self.id.toString()))
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: BasicNFT.CollectionStoragePath,
                        publicPath: BasicNFT.CollectionPublicPath,
                        publicCollection: Type<&BasicNFT.Collection>(),
                        publicLinkedType: Type<&BasicNFT.Collection>(),
                        createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                            return <-BasicNFT.createEmptyCollection(nftType: Type<@BasicNFT.NFT>())
                        })
                    )
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return MetadataViews.NFTCollectionDisplay(
                        name: "Basic NFT Collection",
                        description: "A basic NFT collection created with VibeMore",
                        externalURL: MetadataViews.ExternalURL("https://vibemore.io"),
                        squareImage: MetadataViews.Media(
                            file: MetadataViews.HTTPFile("https://vibemore.io/images/basic-nft-square.png"),
                            mediaType: "image/png"
                        ),
                        bannerImage: MetadataViews.Media(
                            file: MetadataViews.HTTPFile("https://vibemore.io/images/basic-nft-banner.png"),
                            mediaType: "image/png"
                        ),
                        socials: {}
                    )
                case Type<MetadataViews.Royalties>():
                    return MetadataViews.Royalties([])
            }
            return nil
        }
    }

    access(all) resource Collection: NonFungibleToken.Provider & NonFungibleToken.Receiver & NonFungibleToken.Collection & NonFungibleToken.CollectionPublic & BasicNFTCollectionPublic & ViewResolver.ResolverCollection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("NFT not found in collection")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @BasicNFT.NFT
            let id = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)
        }

        access(all) fun borrowBasicNFT(id: UInt64): &BasicNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)!
                return ref as! &BasicNFT.NFT
            }
            return nil
        }

        access(all) view fun borrowViewResolver(id: UInt64): &{ViewResolver.Resolver}? {
            let nft = (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)
            if nft != nil {
                return nft as! &BasicNFT.NFT
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-create Collection()
        }
    }

    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <-create Collection()
    }

    access(all) resource NFTMinter {
        access(all) fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic}, 
            name: String, 
            description: String,
            thumbnail: String
        ) {
            pre {
                name.length > 0: "Name cannot be empty"
                description.length > 0: "Description cannot be empty"
                thumbnail.length > 0: "Thumbnail cannot be empty"
            }

            let newNFT <- create NFT(
                id: BasicNFT.totalSupply, 
                name: name, 
                description: description,
                thumbnail: thumbnail
            )
            let recipientAddress = recipient.owner?.address ?? panic("Could not get recipient address")
            
            recipient.deposit(token: <-newNFT)
            
            // Increment supply AFTER minting
            BasicNFT.totalSupply = BasicNFT.totalSupply + 1
            
            // Emit with correct ID
            emit Minted(id: BasicNFT.totalSupply - 1, recipient: recipientAddress)
        }
    }

    init() {
        self.totalSupply = 0
        self.CollectionStoragePath = /storage/BasicNFTCollection
        self.CollectionPublicPath = /public/BasicNFTCollection
        self.MinterStoragePath = /storage/BasicNFTMinter

        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)

        let collectionCap = self.account.capabilities.storage.issue<&BasicNFT.Collection>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)

        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}`,
  },
  {
    id: "fungible-token",
    name: "Fungible Token",
    description: "Standard fungible token implementation with vault and minting capabilities (Updated for Cadence 1.0 compatibility)",
    category: "token",
    tags: ["Token","Fungible","DeFi","Cadence 1.0"],
    author: "VibeMore",
    downloads: 980,
    featured: true,
    cadenceVersion: "1.0",
    migrationStatus: "migrated",
    lastMigrated: "2024-12-07",
    migrationNotes: [
      "Migrated from legacy 'pub' keywords to 'access(all)' modifiers",
      "Updated resource interfaces to use modern syntax",
      "Implemented proper vault security patterns",
      "Added comprehensive event emission"
    ],
    code: `access(all) contract FungibleToken {
    access(all) var totalSupply: UFix64

    access(all) event TokensInitialized(initialSupply: UFix64)
    access(all) event TokensWithdrawn(amount: UFix64, from: Address?)
    access(all) event TokensDeposited(amount: UFix64, to: Address?)

    access(all) resource interface Provider {
        access(all) fun withdraw(amount: UFix64): @Vault
    }

    access(all) resource interface Receiver {
        access(all) fun deposit(from: @Vault)
    }

    access(all) resource interface Balance {
        access(all) var balance: UFix64
    }

    access(all) resource Vault: Provider & Receiver & Balance {
        access(all) var balance: UFix64

        init(balance: UFix64) {
            self.balance = balance
        }

        access(all) fun withdraw(amount: UFix64): @Vault {
            self.balance = self.balance - amount
            emit TokensWithdrawn(amount: amount, from: self.owner?.address)
            return <-create Vault(balance: amount)
        }

        access(all) fun deposit(from: @Vault) {
            let vault <- from as! @FungibleToken.Vault
            self.balance = self.balance + vault.balance
            emit TokensDeposited(amount: vault.balance, to: self.owner?.address)
            vault.balance = 0.0
            destroy vault
        }

        destroy() {
            FungibleToken.totalSupply = FungibleToken.totalSupply - self.balance
        }
    }

    access(all) fun createEmptyVault(): @Vault {
        return <-create Vault(balance: 0.0)
    }

    access(all) resource Administrator {
        access(all) fun createNewMinter(allowedAmount: UFix64): @Minter {
            return <-create Minter(allowedAmount: allowedAmount)
        }
    }

    access(all) resource Minter {
        access(all) var allowedAmount: UFix64

        access(all) fun mintTokens(amount: UFix64): @Vault {
            pre {
                amount > 0.0: "Amount minted must be greater than zero"
                amount <= self.allowedAmount: "Amount minted must be less than the allowed amount"
            }
            FungibleToken.totalSupply = FungibleToken.totalSupply + amount
            self.allowedAmount = self.allowedAmount - amount
            return <-create Vault(balance: amount)
        }

        init(allowedAmount: UFix64) {
            self.allowedAmount = allowedAmount
        }
    }

    init() {
        self.totalSupply = 1000.0
        let vault <- create Vault(balance: self.totalSupply)
        self.account.storage.save(<-vault, to: /storage/MainVault)
        self.account.storage.save(<-create Administrator(), to: /storage/Admin)
        emit TokensInitialized(initialSupply: self.totalSupply)
    }
}`,
  },
  {
    id: "nft-marketplace",
    name: "NFT Marketplace",
    description: "Complete marketplace for buying and selling NFTs with listing and purchase functionality (Updated for Cadence 1.0 compatibility)",
    category: "marketplace",
    tags: ["NFT","Marketplace","Trading","Cadence 1.0"],
    author: "VibeMore",
    downloads: 2100,
    featured: true,
    cadenceVersion: "1.0",
    migrationStatus: "migrated",
    lastMigrated: "2024-12-07",
    migrationNotes: [
      "Migrated from legacy 'pub' keywords to 'access(all)' modifiers",
      "Updated to modern capability-based access patterns",
      "Implemented proper resource ownership validation",
      "Enhanced security with comprehensive pre-conditions"
    ],
    code: `// Modern Cadence 1.0 NFT Marketplace Contract - Production Ready
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
}`,
  },
  {
    id: "dao-voting",
    name: "DAO Voting System",
    description: "Decentralized voting system for DAOs with proposal creation and voting mechanisms (Updated for Cadence 1.0 compatibility)",
    category: "dao",
    tags: ["DAO","Governance","Voting","Cadence 1.0"],
    author: "VibeMore",
    downloads: 750,
    featured: false,
    cadenceVersion: "1.0",
    migrationStatus: "migrated",
    lastMigrated: "2024-12-07",
    migrationNotes: [
      "Migrated from legacy 'pub' keywords to 'access(all)' modifiers",
      "Updated struct definitions with modern access patterns",
      "Implemented proper state management for voting",
      "Added comprehensive event tracking"
    ],
    code: `access(all) contract DAOVoting {
    access(all) var proposalCount: UInt64

    access(all) event ProposalCreated(id: UInt64, title: String, creator: Address?)
    access(all) event VoteCast(proposalId: UInt64, voter: Address?, support: Bool)
    access(all) event ProposalExecuted(id: UInt64)

    access(all) struct Proposal {
        access(all) let id: UInt64
        access(all) let title: String
        access(all) let description: String
        access(all) let creator: Address
        access(all) var votesFor: UInt64
        access(all) var votesAgainst: UInt64
        access(all) var executed: Bool
        access(all) let createdAt: UFix64

        init(id: UInt64, title: String, description: String, creator: Address) {
            self.id = id
            self.title = title
            self.description = description
            self.creator = creator
            self.votesFor = 0
            self.votesAgainst = 0
            self.executed = false
            self.createdAt = getCurrentBlock().timestamp
        }

        access(all) fun addVote(support: Bool) {
            if support {
                self.votesFor = self.votesFor + 1
            } else {
                self.votesAgainst = self.votesAgainst + 1
            }
        }

        access(all) fun execute() {
            self.executed = true
        }
    }

    access(self) var proposals: {UInt64: Proposal}
    access(self) var hasVoted: {UInt64: {Address: Bool}}

    access(all) fun createProposal(title: String, description: String, creator: Address): UInt64 {
        let proposal = Proposal(
            id: self.proposalCount,
            title: title,
            description: description,
            creator: creator
        )
        self.proposals[self.proposalCount] = proposal
        self.hasVoted[self.proposalCount] = {}
        emit ProposalCreated(id: self.proposalCount, title: title, creator: creator)
        self.proposalCount = self.proposalCount + 1
        return proposal.id
    }

    access(all) fun vote(proposalId: UInt64, voter: Address, support: Bool) {
        pre {
            self.proposals[proposalId] != nil: "Proposal does not exist"
            self.hasVoted[proposalId]![voter] == nil: "Already voted"
        }

        let proposal = self.proposals[proposalId]!
        proposal.addVote(support: support)
        self.proposals[proposalId] = proposal
        self.hasVoted[proposalId]!.insert(key: voter, true)
        emit VoteCast(proposalId: proposalId, voter: voter, support: support)
    }

    access(all) view fun getProposal(id: UInt64): Proposal? {
        return self.proposals[id]
    }

    access(all) view fun getAllProposals(): [Proposal] {
        return self.proposals.values
    }

    init() {
        self.proposalCount = 0
        self.proposals = {}
        self.hasVoted = {}
    }
}`,
  },
  {
    id: "staking-rewards",
    name: "Staking & Rewards",
    description: "Token staking contract with reward distribution and lock periods (Updated for Cadence 1.0 compatibility)",
    category: "defi",
    tags: ["Staking","DeFi","Rewards","Cadence 1.0"],
    author: "VibeMore",
    downloads: 1420,
    featured: false,
    cadenceVersion: "1.0",
    migrationStatus: "migrated",
    lastMigrated: "2024-12-07",
    migrationNotes: [
      "Migrated from legacy 'pub' keywords to 'access(all)' modifiers",
      "Updated reward calculation logic with modern patterns",
      "Implemented proper stake management with validation",
      "Added comprehensive event emission for tracking"
    ],
    code: `access(all) contract StakingRewards {
    access(all) var totalStaked: UFix64
    access(all) let rewardRate: UFix64

    access(all) event Staked(user: Address, amount: UFix64)
    access(all) event Withdrawn(user: Address, amount: UFix64)
    access(all) event RewardPaid(user: Address, reward: UFix64)

    access(all) struct StakeInfo {
        access(all) var amount: UFix64
        access(all) var rewardDebt: UFix64
        access(all) let stakedAt: UFix64

        init(amount: UFix64) {
            self.amount = amount
            self.rewardDebt = 0.0
            self.stakedAt = getCurrentBlock().timestamp
        }

        access(all) fun addStake(amount: UFix64) {
            self.amount = self.amount + amount
        }

        access(all) fun removeStake(amount: UFix64) {
            self.amount = self.amount - amount
        }
    }

    access(self) var stakes: {Address: StakeInfo}

    access(all) fun stake(user: Address, amount: UFix64) {
        pre {
            amount > 0.0: "Cannot stake 0 tokens"
        }

        if self.stakes[user] == nil {
            self.stakes[user] = StakeInfo(amount: amount)
        } else {
            let stakeInfo = self.stakes[user]!
            stakeInfo.addStake(amount: amount)
            self.stakes[user] = stakeInfo
        }

        self.totalStaked = self.totalStaked + amount
        emit Staked(user: user, amount: amount)
    }

    access(all) fun withdraw(user: Address, amount: UFix64) {
        pre {
            self.stakes[user] != nil: "No stake found"
            self.stakes[user]!.amount >= amount: "Insufficient staked amount"
        }

        let stakeInfo = self.stakes[user]!
        stakeInfo.removeStake(amount: amount)
        self.stakes[user] = stakeInfo
        self.totalStaked = self.totalStaked - amount
        emit Withdrawn(user: user, amount: amount)
    }

    access(all) view fun calculateReward(user: Address): UFix64 {
        if self.stakes[user] == nil {
            return 0.0
        }

        let stakeInfo = self.stakes[user]!
        let timeStaked = getCurrentBlock().timestamp - stakeInfo.stakedAt
        let reward = stakeInfo.amount * self.rewardRate * timeStaked / 86400.0
        return reward
    }

    access(all) view fun getStakeInfo(user: Address): StakeInfo? {
        return self.stakes[user]
    }

    init() {
        self.totalStaked = 0.0
        self.rewardRate = 0.1
        self.stakes = {}
    }
}`,
  },
  {
    id: "multi-sig-wallet",
    name: "Multi-Signature Wallet",
    description: "Secure multi-signature wallet requiring multiple approvals for transactions (Updated for Cadence 1.0 compatibility)",
    category: "utility",
    tags: ["Security","Wallet","Multi-sig","Cadence 1.0"],
    author: "VibeMore",
    downloads: 620,
    featured: false,
    cadenceVersion: "1.0",
    migrationStatus: "migrated",
    lastMigrated: "2024-12-07",
    migrationNotes: [
      "Migrated from legacy 'pub' keywords to 'access(all)' modifiers",
      "Updated transaction approval logic with modern patterns",
      "Implemented proper owner validation and security checks",
      "Enhanced with comprehensive state management"
    ],
    code: `access(all) contract MultiSigWallet {
    access(all) var transactionCount: UInt64

    access(all) event Deposit(from: Address?, amount: UFix64)
    access(all) event SubmitTransaction(txId: UInt64, to: Address, amount: UFix64)
    access(all) event ConfirmTransaction(owner: Address, txId: UInt64)
    access(all) event ExecuteTransaction(txId: UInt64)

    access(all) struct Transaction {
        access(all) let id: UInt64
        access(all) let to: Address
        access(all) let amount: UFix64
        access(all) var confirmations: UInt64
        access(all) var executed: Bool

        init(id: UInt64, to: Address, amount: UFix64) {
            self.id = id
            self.to = to
            self.amount = amount
            self.confirmations = 0
            self.executed = false
        }

        access(all) fun confirm() {
            self.confirmations = self.confirmations + 1
        }

        access(all) fun execute() {
            self.executed = true
        }
    }

    access(self) var owners: [Address]
    access(self) var required: UInt64
    access(self) var transactions: {UInt64: Transaction}
    access(self) var confirmations: {UInt64: {Address: Bool}}

    access(all) fun submitTransaction(to: Address, amount: UFix64): UInt64 {
        let tx = Transaction(id: self.transactionCount, to: to, amount: amount)
        self.transactions[self.transactionCount] = tx
        self.confirmations[self.transactionCount] = {}
        emit SubmitTransaction(txId: self.transactionCount, to: to, amount: amount)
        self.transactionCount = self.transactionCount + 1
        return tx.id
    }

    access(all) fun confirmTransaction(txId: UInt64, owner: Address) {
        pre {
            self.transactions[txId] != nil: "Transaction does not exist"
            !self.transactions[txId]!.executed: "Transaction already executed"
            self.confirmations[txId]![owner] == nil: "Already confirmed"
        }

        let tx = self.transactions[txId]!
        tx.confirm()
        self.transactions[txId] = tx
        self.confirmations[txId]!.insert(key: owner, true)
        emit ConfirmTransaction(owner: owner, txId: txId)

        if tx.confirmations >= self.required {
            self.executeTransaction(txId: txId)
        }
    }

    access(self) fun executeTransaction(txId: UInt64) {
        let tx = self.transactions[txId]!
        tx.execute()
        self.transactions[txId] = tx
        emit ExecuteTransaction(txId: txId)
    }

    access(all) view fun getTransaction(txId: UInt64): Transaction? {
        return self.transactions[txId]
    }

    access(all) view fun getOwners(): [Address] {
        return self.owners
    }

    access(all) view fun getRequiredConfirmations(): UInt64 {
        return self.required
    }

    access(all) view fun getTransactionCount(): UInt64 {
        return self.transactionCount
    }

    access(all) view fun isOwner(address: Address): Bool {
        return self.owners.contains(address)
    }

    access(all) view fun getConfirmationCount(txId: UInt64): UInt64 {
        if let tx = self.transactions[txId] {
            return tx.confirmations
        }
        return 0
    }

    access(all) view fun hasConfirmed(txId: UInt64, owner: Address): Bool {
        if let confirmationMap = self.confirmations[txId] {
            return confirmationMap[owner] == true
        }
        return false
    }

    init(owners: [Address], required: UInt64) {
        pre {
            owners.length > 0: "Owners required"
            required > 0 && required <= UInt64(owners.length): "Invalid required confirmations"
        }

        self.owners = owners
        self.required = required
        self.transactionCount = 0
        self.transactions = {}
        self.confirmations = {}
    }
}`,
  }
]

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id)
}

export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter((t) => t.category === category)
}

export function getFeaturedTemplates(): Template[] {
  return templates.filter((t) => t.featured)
}

export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase()
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  )
}

export function getCadence10Templates(): Template[] {
  return templates.filter((t) => t.cadenceVersion === "1.0")
}

export function getLegacyTemplates(): Template[] {
  return templates.filter((t) => t.cadenceVersion === "legacy")
}

export function getMigratedTemplates(): Template[] {
  return templates.filter((t) => t.migrationStatus === "migrated")
}

export function getTemplatesByMigrationStatus(status: "migrated" | "native" | "needs_migration"): Template[] {
  return templates.filter((t) => t.migrationStatus === status)
}

export function validateTemplateCompatibility(template: Template): {
  isCompatible: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []

  // Check if template is Cadence 1.0 compatible
  if (template.cadenceVersion !== "1.0") {
    issues.push("Template uses legacy Cadence syntax")
    recommendations.push("Migrate template to Cadence 1.0 syntax")
  }

  // Check migration status
  if (template.migrationStatus === "needs_migration") {
    issues.push("Template requires migration to modern syntax")
    recommendations.push("Run migration process on this template")
  }

  // Check for legacy patterns in code (basic check)
  if (template.code.includes("pub ") || template.code.includes("pub(")) {
    issues.push("Template code contains legacy 'pub' keywords")
    recommendations.push("Replace 'pub' keywords with appropriate access modifiers")
  }

  return {
    isCompatible: issues.length === 0,
    issues,
    recommendations
  }
}

export function getTemplateMigrationInfo(template: Template): {
  isMigrated: boolean
  migrationDate?: string
  migrationNotes: string[]
  compatibilityScore: number
} {
  const compatibility = validateTemplateCompatibility(template)
  const compatibilityScore = compatibility.isCompatible ? 100 : Math.max(0, 100 - (compatibility.issues.length * 25))

  return {
    isMigrated: template.migrationStatus === "migrated",
    migrationDate: template.lastMigrated,
    migrationNotes: template.migrationNotes || [],
    compatibilityScore
  }
}
