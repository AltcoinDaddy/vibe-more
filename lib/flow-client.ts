import * as fcl from "@onflow/fcl"
import * as t from "@onflow/types"
import { FLOW_CONFIG, getCurrentNetwork } from "./flow-config"

// Configure Flow based on environment
export const configureFlow = () => {
  if (typeof window !== "undefined") {
    const config = FLOW_CONFIG[getCurrentNetwork() as keyof typeof FLOW_CONFIG]
    
    fcl.config({
      "accessNode.api": config.accessNode,
      "discovery.wallet": config.discoveryWallet,
      "0xProfile": "0xba1132bc08f82fe2", // Profile contract address
      "app.detail.title": "VibeMore",
      "app.detail.icon": "https://vibemore.app/icon.png",
    })
    
    console.log(`[FlowClient] Configured for ${config.network}`)
  }
}

// Initialize Flow configuration
configureFlow()

export interface FlowAccount {
  addr: string
  balance: number
  code: string
  keys: any[]
  contracts: Record<string, string>
}

export interface DeploymentResult {
  transactionId: string
  status: string
  errorMessage?: string
  events?: any[]
}

export interface FlowUser {
  loggedIn: boolean
  addr: string | null
  cid?: string
  expiresAt?: string
  f_type?: string
  f_vsn?: string
  services?: any[]
}

export interface TransactionStatus {
  blockId: string
  status: number
  statusString: string
  errorMessage?: string
  events: any[]
}

/**
 * Real Flow Client with full blockchain integration
 */
export class FlowClient {
  private currentUser: FlowUser = {
    loggedIn: false,
    addr: null,
  }

  private subscribers: ((user: FlowUser) => void)[] = []

  constructor() {
    this.initializeAuth()
  }

  private async initializeAuth() {
    if (typeof window !== "undefined") {
      // Subscribe to FCL authentication changes
      fcl.currentUser.subscribe((user: any) => {
        this.currentUser = {
          loggedIn: user.loggedIn || false,
          addr: user.addr || null,
          cid: user.cid,
          expiresAt: user.expiresAt,
          f_type: user.f_type,
          f_vsn: user.f_vsn,
          services: user.services,
        }
        this.notifySubscribers()
        console.log("[FlowClient] User state updated:", this.currentUser)
      })
    }
  }

  /**
   * Get current user account
   */
  async getCurrentUser(): Promise<FlowUser> {
    if (typeof window !== "undefined") {
      const user = await fcl.currentUser.snapshot()
      return {
        loggedIn: user.loggedIn || false,
        addr: user.addr || null,
        cid: user.cid,
        expiresAt: user.expiresAt,
        f_type: user.f_type,
        f_vsn: user.f_vsn,
        services: user.services,
      }
    }
    return this.currentUser
  }

  /**
   * Authenticate user with Flow wallet
   */
  async authenticate() {
    try {
      console.log("[FlowClient] Starting authentication...")
      const user = await fcl.authenticate()
      console.log("[FlowClient] Authentication successful:", user)
      return user
    } catch (error) {
      console.error("[FlowClient] Authentication failed:", error)
      throw error
    }
  }

  /**
   * Unauthenticate user
   */
  async unauthenticate() {
    try {
      console.log("[FlowClient] Unauthenticating user...")
      await fcl.unauthenticate()
      console.log("[FlowClient] Unauthentication successful")
    } catch (error) {
      console.error("[FlowClient] Unauthentication failed:", error)
      throw error
    }
  }

  /**
   * Subscribe to authentication changes
   */
  subscribeToAuth(callback: (user: FlowUser) => void) {
    this.subscribers.push(callback)
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback)
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.currentUser))
  }

  /**
   * Get account information from Flow blockchain
   */
  async getAccount(address: string): Promise<FlowAccount> {
    try {
      console.log(`[FlowClient] Fetching account info for ${address}`)
      const account = await fcl.account(address)
      
      return {
        addr: account.address,
        balance: account.balance / 100000000, // Convert from UFix64 to FLOW
        code: account.code || "",
        keys: account.keys || [],
        contracts: account.contracts || {},
      }
    } catch (error) {
      console.error("[FlowClient] Failed to fetch account:", error)
      throw error
    }
  }

  /**
   * Deploy a contract to Flow blockchain
   */
  async deployContract(contractName: string, contractCode: string): Promise<DeploymentResult> {
    try {
      const user = await this.getCurrentUser()
      if (!user.loggedIn || !user.addr) {
        throw new Error("User not authenticated")
      }

      console.log(`[FlowClient] Deploying contract ${contractName}...`)

      // Create deployment transaction
      const transactionId = await fcl.mutate({
        cadence: `
          transaction(name: String, code: String) {
            prepare(signer: AuthAccount) {
              signer.contracts.add(name: name, code: code.utf8)
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(contractName, t.String),
          arg(contractCode, t.String)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999,
      })

      console.log(`[FlowClient] Contract deployment transaction sent: ${transactionId}`)

      // Wait for transaction to be sealed
      const transaction = await fcl.tx(transactionId).onceSealed()
      
      return {
        transactionId,
        status: transaction.status === 4 ? "sealed" : "pending",
        errorMessage: transaction.errorMessage,
        events: transaction.events,
      }
    } catch (error: any) {
      console.error("[FlowClient] Deployment error:", error)
      return {
        transactionId: "",
        status: "error",
        errorMessage: error.message || "Failed to deploy contract",
      }
    }
  }

  /**
   * Execute a script on Flow blockchain
   */
  async executeScript(script: string, args: any[] = []) {
    try {
      console.log("[FlowClient] Executing script...")
      const result = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => args.map((a, i) => arg(a, t.String)), // Simple string args for now
      })
      
      console.log("[FlowClient] Script execution result:", result)
      return { result }
    } catch (error) {
      console.error("[FlowClient] Script execution failed:", error)
      throw error
    }
  }

  /**
   * Send a transaction to Flow blockchain
   */
  async sendTransaction(transaction: string, args: any[] = []) {
    try {
      const user = await this.getCurrentUser()
      if (!user.loggedIn) {
        throw new Error("User not authenticated")
      }

      console.log("[FlowClient] Sending transaction...")

      const transactionId = await fcl.mutate({
        cadence: transaction,
        args: (arg: any, t: any) => args.map((a, i) => arg(a, t.String)), // Simple string args for now
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999,
      })

      console.log(`[FlowClient] Transaction sent: ${transactionId}`)

      // Wait for sealing
      const tx = await fcl.tx(transactionId).onceSealed()

      return {
        transactionId,
        status: tx.status,
        errorMessage: tx.errorMessage,
        events: tx.events,
      }
    } catch (error: any) {
      console.error("[FlowClient] Transaction failed:", error)
      throw error
    }
  }

  /**
   * Get transaction status from Flow blockchain
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      console.log(`[FlowClient] Getting transaction status for ${transactionId}`)
      const transaction = await fcl.tx(transactionId).snapshot()

      const statusMap: Record<number, string> = {
        0: "Unknown",
        1: "Pending",
        2: "Finalized", 
        3: "Executed",
        4: "Sealed",
        5: "Expired"
      }

      return {
        blockId: transaction.blockId,
        status: transaction.status,
        statusString: statusMap[transaction.status] || "Unknown",
        errorMessage: transaction.errorMessage,
        events: transaction.events || [],
      }
    } catch (error) {
      console.error("[FlowClient] Failed to get transaction status:", error)
      throw error
    }
  }

  /**
   * Get Flow balance for an address
   */
  async getFlowBalance(address: string): Promise<number> {
    try {
      const script = `
        import FlowToken from 0x1654653399040a61

        access(all) fun main(address: Address): UFix64 {
          let account = getAccount(address)
          let vaultRef = account.capabilities.borrow<&FlowToken.Vault>(/public/flowTokenBalance)
            ?? panic("Could not borrow Balance reference to the Vault")
          
          return vaultRef.balance
        }
      `

      const balance = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [arg(address, t.Address)],
      })

      return parseFloat(balance) || 0
    } catch (error) {
      console.error("[FlowClient] Failed to get Flow balance:", error)
      return 0
    }
  }

  /**
   * Check if a contract exists at an address
   */
  async contractExists(address: string, contractName: string): Promise<boolean> {
    try {
      const script = `
        access(all) fun main(address: Address, contractName: String): Bool {
          let account = getAccount(address)
          return account.contracts[contractName] != nil
        }
      `

      const exists = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [
          arg(address, t.Address),
          arg(contractName, t.String)
        ],
      })

      return exists || false
    } catch (error) {
      console.error("[FlowClient] Failed to check contract existence:", error)
      return false
    }
  }

  /**
   * Get contract code from an address
   */
  async getContractCode(address: string, contractName: string): Promise<string | null> {
    try {
      const script = `
        access(all) fun main(address: Address, contractName: String): String? {
          let account = getAccount(address)
          if let contract = account.contracts[contractName] {
            return String.fromUTF8(contract.code) ?? ""
          }
          return nil
        }
      `

      const code = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [
          arg(address, t.Address),
          arg(contractName, t.String)
        ],
      })

      return code
    } catch (error) {
      console.error("[FlowClient] Failed to get contract code:", error)
      return null
    }
  }

  /**
   * Get current block information
   */
  async getCurrentBlock(): Promise<any> {
    try {
      const script = `
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

      const blockInfo = await fcl.query({
        cadence: script,
        args: () => [],
      })

      return blockInfo
    } catch (error) {
      console.error("[FlowClient] Failed to get current block:", error)
      return null
    }
  }

  /**
   * Transfer Flow tokens to another address
   */
  async transferFlow(amount: number, toAddress: string): Promise<TransactionStatus> {
    try {
      const user = await this.getCurrentUser()
      if (!user.loggedIn) {
        throw new Error("User not authenticated")
      }

      console.log(`[FlowClient] Transferring ${amount} FLOW to ${toAddress}`)

      const transaction = `
        import FlowToken from 0x1654653399040a61
        import FungibleToken from 0x9a0766d93b6608b7

        transaction(amount: UFix64, to: Address) {
          let vault: @{FungibleToken.Vault}
          
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

      const transactionId = await fcl.mutate({
        cadence: transaction,
        args: (arg: any, t: any) => [
          arg(amount.toFixed(8), t.UFix64),
          arg(toAddress, t.Address)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999,
      })

      console.log(`[FlowClient] Transfer transaction sent: ${transactionId}`)

      // Wait for sealing
      const tx = await fcl.tx(transactionId).onceSealed()

      return {
        blockId: tx.blockId,
        status: tx.status,
        statusString: tx.status === 4 ? "Sealed" : "Pending",
        errorMessage: tx.errorMessage,
        events: tx.events || [],
      }
    } catch (error: any) {
      console.error("[FlowClient] Transfer failed:", error)
      throw error
    }
  }

  /**
   * Get NFT IDs from a collection
   */
  async getNFTIds(address: string, publicPath: string): Promise<number[]> {
    try {
      const script = `
        import NonFungibleToken from 0x1d7e57aa55817448

        access(all) fun main(address: Address, publicPath: PublicPath): [UInt64] {
          let account = getAccount(address)
          
          if let collectionRef = account.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(publicPath) {
            return collectionRef.getIDs()
          }
          
          return []
        }
      `

      const ids = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [
          arg(address, t.Address),
          arg(publicPath, t.Path)
        ],
      })

      return ids || []
    } catch (error) {
      console.error("[FlowClient] Failed to get NFT IDs:", error)
      return []
    }
  }

  /**
   * Get detailed account information including storage usage
   */
  async getDetailedAccountInfo(address: string): Promise<any> {
    try {
      const script = `
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

      const accountInfo = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [arg(address, t.Address)],
      })

      return accountInfo
    } catch (error) {
      console.error("[FlowClient] Failed to get detailed account info:", error)
      return null
    }
  }
}

// Export singleton instance
export const flowClient = new FlowClient()
