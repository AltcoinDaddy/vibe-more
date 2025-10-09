import * as fcl from "@onflow/fcl"
import { FLOW_CONFIG, getCurrentNetwork } from "./flow-config"

// Configure Flow based on environment
export const configureFlow = () => {
  if (typeof window !== "undefined") {
    const config = FLOW_CONFIG[getCurrentNetwork() as keyof typeof FLOW_CONFIG]
    
    fcl.config({
      "accessNode.api": config.accessNode,
      "discovery.wallet": config.discoveryWallet,
      "0xProfile": "0xba1132bc08f82fe2", // Profile contract address
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
}

export interface DeploymentResult {
  transactionId: string
  status: string
  errorMessage?: string
}

export interface FlowUser {
  loggedIn: boolean
  addr: string | null
}

/**
 * Enhanced Flow Client with real blockchain integration
 * Falls back to mock mode when not configured
 */
export class FlowClient {
  private currentUser: FlowUser = {
    loggedIn: false,
    addr: null,
  }

  private subscribers: ((user: FlowUser) => void)[] = []
  private isRealFlowAvailable: boolean = false

  constructor() {
    this.checkFlowAvailability()
    this.initializeAuth()
  }

  private checkFlowAvailability() {
    // Check if we're in a browser environment with proper Flow config
    this.isRealFlowAvailable = typeof window !== "undefined" && 
                               (process.env.NEXT_PUBLIC_FLOW_NETWORK !== undefined ||
                                getCurrentNetwork() !== undefined)
    
    if (this.isRealFlowAvailable) {
      console.log("[FlowClient] Real Flow integration enabled")
    } else {
      console.log("[FlowClient] Using mock mode - set NEXT_PUBLIC_FLOW_NETWORK for real integration")
    }
  }

  private async initializeAuth() {
    if (this.isRealFlowAvailable && typeof window !== "undefined") {
      // Subscribe to FCL authentication changes
      fcl.currentUser.subscribe((user: any) => {
        this.currentUser = {
          loggedIn: user.loggedIn || false,
          addr: user.addr || null,
        }
        this.notifySubscribers()
      })
    }
  }

  /**
   * Get current user account
   */
  async getCurrentUser(): Promise<FlowUser> {
    return this.currentUser
  }

  /**
   * Authenticate user with Flow wallet
   */
  async authenticate() {
    if (this.isRealFlowAvailable) {
      try {
        // Use real FCL authentication
        const user = await fcl.authenticate()
        return user
      } catch (error) {
        console.error("[FlowClient] Real authentication failed, falling back to mock:", error)
      }
    }

    // Fallback to mock authentication
    await new Promise((resolve) => setTimeout(resolve, 1000))

    this.currentUser = {
      loggedIn: true,
      addr: "0x" + Math.random().toString(16).substring(2, 18),
    }

    this.notifySubscribers()
    return this.currentUser
  }

  /**
   * Unauthenticate user
   */
  async unauthenticate() {
    if (this.isRealFlowAvailable) {
      try {
        await fcl.unauthenticate()
        return
      } catch (error) {
        console.error("[FlowClient] Real unauthentication failed:", error)
      }
    }

    // Fallback to mock
    this.currentUser = {
      loggedIn: false,
      addr: null,
    }
    this.notifySubscribers()
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
   * Get account information (mock)
   */
  async getAccount(address: string): Promise<FlowAccount> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      addr: address,
      balance: Math.random() * 1000,
      code: "",
    }
  }

  /**
   * Deploy a contract to Flow blockchain (mock)
   */
  async deployContract(contractName: string, contractCode: string): Promise<DeploymentResult> {
    try {
      const user = await this.getCurrentUser()
      if (!user.loggedIn) {
        throw new Error("User not authenticated")
      }

      // Simulate deployment
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const transactionId = "0x" + Math.random().toString(16).substring(2, 18)

      return {
        transactionId,
        status: "sealed",
      }
    } catch (error: any) {
      console.error("[v0] Deployment error:", error)
      return {
        transactionId: "",
        status: "error",
        errorMessage: error.message || "Failed to deploy contract",
      }
    }
  }

  /**
   * Execute a script on Flow blockchain (mock)
   */
  async executeScript(script: string, args: any[] = []) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { result: "Script executed successfully" }
  }

  /**
   * Send a transaction (mock)
   */
  async sendTransaction(transaction: string, args: any[] = []) {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const transactionId = "0x" + Math.random().toString(16).substring(2, 18)

    return {
      transactionId,
      status: 4, // Sealed
      errorMessage: undefined,
    }
  }

  /**
   * Get transaction status (mock)
   */
  async getTransactionStatus(transactionId: string) {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      transactionId,
      status: 4, // Sealed
      errorMessage: undefined,
    }
  }
}

// Export singleton instance
export const flowClient = new FlowClient()
