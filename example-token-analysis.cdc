// TokenContract.cdc
//
// Fungible Token Contract
//
// This contract implements a basic fungible token with minting, burning,
// and transfer capabilities. It adheres to the FungibleToken standard
// and provides a secure and reliable token implementation.

import FungibleToken from 0xFungibleToken

// TokenContract contract
//
// This contract defines the token's metadata, manages the total supply,
// and provides the functionality for minting, burning, and transferring tokens.
//
// It also defines the Vault resource, which is used to hold tokens
// and provides the functionality for depositing and withdrawing tokens.
contract TokenContract {

    // -----------------------------------------------------------------------
    // Contract-Level Fields
    // -----------------------------------------------------------------------

    // The total supply of the token
    access(contract) var totalSupply: UFix64

    // The name of the token
    access(contract) let tokenName: String

    // The symbol of the token
    access(contract) let tokenSymbol: String

    // Event that is emitted when tokens are transferred
    access(all) event TokensTransferred(from: Address?, to: Address?, amount: UFix64)

    // Event that is emitted when tokens are withdrawn from a vault
    access(all) event TokensWithdrawn(address: Address, amount: UFix64)

    // Event that is emitted when tokens are deposited into a vault
    access(all) event TokensDeposited(address: Address, amount: UFix64)

    // Event that is emitted when new tokens are minted
    access(all) event TokensMinted(address: Address, amount: UFix64)

    // Event that is emitted when tokens are burned
    access(all) event TokensBurned(address: Address, amount: UFix64)

    // Admin capability for minting and burning tokens
    access(contract) var adminCapability: Capability<&Admin>

    // -----------------------------------------------------------------------
    // Resource: Vault
    // -----------------------------------------------------------------------

    // Vault Resource
    //
    // Each account that wishes to hold tokens will have a Vault resource
    // stored in their account storage. The Vault resource holds the balance
    // of the account and provides the functionality for depositing and
    // withdrawing tokens.
    resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
        
        // The balance of the vault
        access(self) var balance: UFix64

        // initialize the balance of the Vault to zero
        init(initialBalance: UFix64) {
            self.balance = initialBalance
        }

        // withdraw tokens from the Vault
        pub fun withdraw(amount: UFix64): @FungibleToken.Vault {
            pre {
                amount > 0.0: "Withdrawal amount must be positive"
                amount <= self.balance: "Insufficient funds"
            }
            self.balance = self.balance - amount
            emit TokensWithdrawn(address: self.owner!.address, amount: amount)
            return <-create Vault(initialBalance: amount)
        }

        // deposit tokens into the Vault
        pub fun deposit(from: @FungibleToken.Vault) {
            let vault <- from as! @TokenContract.Vault
            self.balance = self.balance + vault.balance
            emit TokensDeposited(address: self.owner!.address, amount: vault.balance)
            destroy vault
        }

        // Returns the balance of the Vault
        pub fun checkBalance(): UFix64 {
            return self.balance
        }

        destroy() {
            // No need to do anything, since the fields are primitive types
        }
    }

    // -----------------------------------------------------------------------
    // Resource: Admin
    // -----------------------------------------------------------------------

    // Admin Resource
    //
    // This resource is used to mint and burn tokens. Only one Admin resource
    // should exist in the contract storage.
    resource Admin {

        // mint tokens and deposit them into the recipient's vault
        pub fun mintTokens(amount: UFix64, recipient: &{FungibleToken.Receiver}) {
            pre {
                amount > 0.0: "Mint amount must be positive"
            }
            TokenContract.totalSupply = TokenContract.totalSupply + amount
            emit TokensMinted(address: recipient.owner!.address, amount: amount)
            recipient.deposit(from: <-create Vault(initialBalance: amount))
        }

        // burn tokens and destroy them
        pub fun burnTokens(amount: UFix64, from: @FungibleToken.Vault) {
            pre {
                amount > 0.0: "Burn amount must be positive"
                amount <= from.balance: "Insufficient funds"
            }
            let vault <- from as! @TokenContract.Vault
            TokenContract.totalSupply = TokenContract.totalSupply - vault.balance
            emit TokensBurned(address: self.owner!.address, amount: vault.balance)
            destroy vault
        }
    }

    // -----------------------------------------------------------------------
    // Functions
    // -----------------------------------------------------------------------

    // create a new Vault and return it to the caller
    pub fun createVault(initialBalance: UFix64): @Vault {
        return <-create Vault(initialBalance: initialBalance)
    }

    // get the total supply of the token
    pub fun getTotalSupply(): UFix64 {
        return self.totalSupply
    }

    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------

    // Initialize the contract
    init() {
        // Initialize the total supply to zero
        self.totalSupply = 1000.0

        // Set the token name and symbol
        self.tokenName = "ExampleToken"
        self.tokenSymbol = "EXT"

        // Create the admin resource and save it to storage
        let admin <- create Admin()
        self.adminCapability = account.capabilities.storage.issue<&Admin>(id: /storage/TokenAdmin, storedType: Type<@Admin>())!
        self.account.storage.save(<-admin, to: /storage/TokenAdmin)

        // Save the provider capability
        self.account.capabilities.publish(
            self.account.capabilities.storage.issue<&{FungibleToken.Provider}>(id: /storage/MainVault, storedType: Type<@Vault>()
            )!,
            at: /public/TokenProvider
        )

        // Save the receiver capability
        self.account.capabilities.publish(
            self.account.capabilities.storage.issue<&{FungibleToken.Receiver}>(id: /storage/MainVault, storedType: Type<@Vault>()
            )!,
            at: /public/TokenReceiver
        )

        // Save the balance capability
        self.account.capabilities.publish(
            self.account.capabilities.storage.issue<&{FungibleToken.Balance}>(id: /storage/MainVault, storedType: Type<&Vault>()
            )!,
            at: /public/TokenBalance
        )

        // Create a vault for the contract account and save it to storage
        self.account.storage.save(<-create Vault(initialBalance: self.totalSupply), to: /storage/MainVault)
    }
}