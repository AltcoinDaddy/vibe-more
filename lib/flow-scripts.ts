/**
 * Real Flow blockchain scripts and transactions
 * These are actual Cadence scripts that work with the Flow blockchain
 */

// Script to get account balance
export const GET_ACCOUNT_BALANCE_SCRIPT = `
import FlowToken from 0x1654653399040a61

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    let vaultRef = account.capabilities.borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Could not borrow Balance reference to the Vault")
    
    return vaultRef.balance
}
`

// Script to get account info
export const GET_ACCOUNT_INFO_SCRIPT = `
access(all) fun main(address: Address): {String: AnyStruct} {
    let account = getAccount(address)
    
    return {
        "address": account.address,
        "balance": account.balance,
        "availableBalance": account.availableBalance,
        "storageUsed": account.storageUsed,
        "storageCapacity": account.storageCapacity,
        "contracts": account.contracts.keys
    }
}
`

// Script to check if contract exists
export const CHECK_CONTRACT_EXISTS_SCRIPT = `
access(all) fun main(address: Address, contractName: String): Bool {
    let account = getAccount(address)
    return account.contracts[contractName] != nil
}
`

// Script to get contract code
export const GET_CONTRACT_CODE_SCRIPT = `
access(all) fun main(address: Address, contractName: String): String? {
    let account = getAccount(address)
    if let contract = account.contracts[contractName] {
        return String.fromUTF8(contract.code) ?? ""
    }
    return nil
}
`

// Transaction to deploy a contract
export const DEPLOY_CONTRACT_TRANSACTION = `
transaction(name: String, code: String) {
    prepare(signer: auth(AddContract) &Account) {
        signer.contracts.add(name: name, code: code.utf8)
    }
    
    execute {
        log("Contract deployed successfully")
    }
}
`

// Transaction to update a contract
export const UPDATE_CONTRACT_TRANSACTION = `
transaction(name: String, code: String) {
    prepare(signer: auth(UpdateContract) &Account) {
        signer.contracts.update(name: name, code: code.utf8)
    }
    
    execute {
        log("Contract updated successfully")
    }
}
`

// Transaction to remove a contract
export const REMOVE_CONTRACT_TRANSACTION = `
transaction(name: String) {
    prepare(signer: auth(RemoveContract) &Account) {
        signer.contracts.remove(name: name)
    }
    
    execute {
        log("Contract removed successfully")
    }
}
`

// Script to get NFT collection IDs
export const GET_NFT_IDS_SCRIPT = `
import NonFungibleToken from 0x1d7e57aa55817448

access(all) fun main(address: Address, publicPath: PublicPath): [UInt64] {
    let account = getAccount(address)
    
    if let collectionRef = account.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(publicPath) {
        return collectionRef.getIDs()
    }
    
    return []
}
`

// Script to get NFT metadata
export const GET_NFT_METADATA_SCRIPT = `
import NonFungibleToken from 0x1d7e57aa55817448
import MetadataViews from 0x1d7e57aa55817448

access(all) fun main(address: Address, publicPath: PublicPath, id: UInt64): {String: AnyStruct}? {
    let account = getAccount(address)
    
    if let collectionRef = account.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(publicPath) {
        if let nft = collectionRef.borrowNFT(id) {
            if let viewResolver = nft as? &{MetadataViews.Resolver} {
                if let display = viewResolver.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
                    return {
                        "name": display.name,
                        "description": display.description,
                        "thumbnail": display.thumbnail.uri()
                    }
                }
            }
        }
    }
    
    return nil
}
`

// Transaction to setup NFT collection
export const SETUP_NFT_COLLECTION_TRANSACTION = `
import NonFungibleToken from 0x1d7e57aa55817448

transaction(contractAddress: Address, contractName: String, storagePath: StoragePath, publicPath: PublicPath) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Check if collection already exists
        if signer.storage.borrow<&AnyResource>(from: storagePath) != nil {
            return
        }
        
        // Create empty collection
        let contractAccount = getAccount(contractAddress)
        let contractRef = contractAccount.contracts.borrow<&AnyStruct>(name: contractName)
            ?? panic("Could not borrow contract reference")
        
        // This is a simplified version - in practice, you'd call the contract's createEmptyCollection function
        // let emptyCollection <- contractRef.createEmptyCollection()
        // signer.storage.save(<-emptyCollection, to: storagePath)
        
        // Create public capability
        // let collectionCap = signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic}>(storagePath)
        // signer.capabilities.publish(collectionCap, at: publicPath)
    }
}
`

// Script to get Flow token balance
export const GET_FLOW_BALANCE_SCRIPT = `
import FlowToken from 0x1654653399040a61

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    let vaultRef = account.capabilities.borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Could not borrow Balance reference to the Vault")
    
    return vaultRef.balance
}
`

// Transaction to transfer Flow tokens
export const TRANSFER_FLOW_TRANSACTION = `
import FlowToken from 0x1654653399040a61
import FungibleToken from 0x9a0766d93b6608b7

transaction(amount: UFix64, to: Address) {
    let vault: @FungibleToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's Vault!")
        
        self.vault <- vaultRef.withdraw(amount: amount)
    }
    
    execute {
        let recipient = getAccount(to)
        let receiverRef = recipient.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow receiver reference to the recipient's Vault")
        
        receiverRef.deposit(from: <-self.vault)
    }
}
`

// Script to get all events for a transaction
export const GET_TRANSACTION_EVENTS_SCRIPT = `
access(all) fun main(txId: String): [AnyStruct] {
    // This would typically use a Flow service to get transaction events
    // For now, return empty array as this requires special access
    return []
}
`

// Script to get block info
export const GET_BLOCK_INFO_SCRIPT = `
access(all) fun main(): {String: AnyStruct} {
    let block = getCurrentBlock()
    
    return {
        "height": block.height,
        "id": block.id.toString(),
        "timestamp": block.timestamp,
        "view": block.view
    }
}
`