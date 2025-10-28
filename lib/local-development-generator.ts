import { GeneratedConfig } from './vibesdk'

export interface LocalDevelopmentOptions {
  projectName: string
  includeContracts: boolean
  includeFrontend: boolean
  includeAPI: boolean
  framework: 'next' | 'react'
  styling: 'tailwind' | 'css'
  typescript: boolean
  testing: boolean
  hotReload: boolean
  mockData: boolean
  debugMode: boolean
}

export interface MockDataConfig {
  contracts: MockContractData[]
  users: MockUserData[]
  transactions: MockTransactionData[]
  nfts?: MockNFTData[]
  tokens?: MockTokenData[]
}

export interface MockContractData {
  name: string
  address: string
  functions: MockFunction[]
  events: MockEvent[]
}

export interface MockFunction {
  name: string
  parameters: MockParameter[]
  returnType: string
  mockResponse: any
}

export interface MockParameter {
  name: string
  type: string
  defaultValue?: any
}

export interface MockEvent {
  name: string
  fields: Record<string, any>
}

export interface MockUserData {
  address: string
  name: string
  balance: number
  nfts?: string[]
  tokens?: Record<string, number>
}

export interface MockTransactionData {
  id: string
  from: string
  to: string
  amount?: number
  status: 'pending' | 'sealed' | 'failed'
  timestamp: number
}

export interface MockNFTData {
  id: string
  name: string
  description: string
  image: string
  metadata: Record<string, any>
  owner: string
}

export interface MockTokenData {
  symbol: string
  name: string
  totalSupply: number
  decimals: number
}

/**
 * Local Development Setup Generator
 * Creates development server configuration, hot reload setup, and mock data
 */
export class LocalDevelopmentGenerator {
  private options: LocalDevelopmentOptions

  constructor(options: LocalDevelopmentOptions) {
    this.options = options
  }

  /**
   * Generate all local development files
   */
  generateDevelopmentSetup(): GeneratedConfig[] {
    const configs: GeneratedConfig[] = []

    // Development server configuration
    configs.push(this.generateDevServerConfig())
    
    // Hot reload configuration
    if (this.options.hotReload) {
      configs.push(this.generateHotReloadConfig())
    }

    // Mock data generation
    if (this.options.mockData) {
      configs.push(...this.generateMockDataFiles())
    }

    // Development scripts
    configs.push(this.generateDevScript())
    configs.push(this.generateTestScript())
    configs.push(this.generateDebugScript())

    // Development utilities
    configs.push(this.generateDevUtilities())

    // Local environment configuration
    configs.push(this.generateLocalEnvConfig())

    return configs
  }
  /**
  
 * Generate development server configuration
   */
  private generateDevServerConfig(): GeneratedConfig {
    const config = `// Development server configuration for ${this.options.projectName}

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      // Custom development middleware
      if (pathname === '/api/dev/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'running',
          timestamp: new Date().toISOString(),
          environment: 'development',
          features: {
            contracts: ${this.options.includeContracts},
            frontend: ${this.options.includeFrontend},
            api: ${this.options.includeAPI},
            hotReload: ${this.options.hotReload},
            mockData: ${this.options.mockData}
          }
        }))
        return
      }

      // Handle all other requests with Next.js
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(\`🚀 Development server ready on http://\${hostname}:\${port}\`)
      console.log(\`📊 Status endpoint: http://\${hostname}:\${port}/api/dev/status\`)
      ${this.options.mockData ? "console.log('🎭 Mock data enabled')" : ''}
      ${this.options.hotReload ? "console.log('🔥 Hot reload enabled')" : ''}
    })
})
`

    return {
      filename: 'scripts/dev-server.js',
      code: config,
      configType: 'development'
    }
  }

  /**
   * Generate hot reload configuration
   */
  private generateHotReloadConfig(): GeneratedConfig {
    const config = `// Hot reload configuration for enhanced development experience

const { watchFile, unwatchFile } = require('fs')
const path = require('path')

class HotReloadManager {
  constructor() {
    this.watchers = new Map()
    this.callbacks = new Map()
  }

  /**
   * Watch files for changes and trigger callbacks
   */
  watchFiles(patterns, callback) {
    const watchId = Date.now().toString()
    
    patterns.forEach(pattern => {
      const fullPath = path.resolve(pattern)
      
      watchFile(fullPath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          console.log(\`🔄 File changed: \${pattern}\`)
          callback(pattern, curr, prev)
        }
      })
      
      this.watchers.set(watchId, fullPath)
    })
    
    this.callbacks.set(watchId, callback)
    return watchId
  }

  /**
   * Stop watching files
   */
  unwatch(watchId) {
    const filePath = this.watchers.get(watchId)
    if (filePath) {
      unwatchFile(filePath)
      this.watchers.delete(watchId)
      this.callbacks.delete(watchId)
    }
  }

  /**
   * Watch contract files for changes
   */
  watchContracts() {
    if (!${this.options.includeContracts}) return

    return this.watchFiles(['contracts/**/*.cdc'], (file) => {
      console.log(\`📄 Contract file updated: \${file}\`)
      // Trigger contract recompilation or validation
      this.validateContract(file)
    })
  }

  /**
   * Watch component files for changes
   */
  watchComponents() {
    if (!${this.options.includeFrontend}) return

    return this.watchFiles([
      'components/**/*.tsx',
      'components/**/*.jsx',
      'app/**/*.tsx',
      'app/**/*.jsx'
    ], (file) => {
      console.log(\`⚛️  Component file updated: \${file}\`)
      // Next.js handles component hot reload automatically
    })
  }

  /**
   * Watch API routes for changes
   */
  watchAPIRoutes() {
    if (!${this.options.includeAPI}) return

    return this.watchFiles(['app/api/**/*.ts', 'app/api/**/*.js'], (file) => {
      console.log(\`🔌 API route updated: \${file}\`)
      // API routes are automatically reloaded by Next.js
    })
  }

  /**
   * Validate contract file
   */
  async validateContract(filePath) {
    try {
      // Mock contract validation - replace with actual Flow CLI validation
      console.log(\`✅ Contract validation passed: \${filePath}\`)
    } catch (error) {
      console.error(\`❌ Contract validation failed: \${filePath}\`, error.message)
    }
  }

  /**
   * Start all watchers
   */
  startWatching() {
    console.log('🔥 Starting hot reload watchers...')
    
    this.watchContracts()
    this.watchComponents()
    this.watchAPIRoutes()
    
    console.log('✅ Hot reload watchers active')
  }

  /**
   * Stop all watchers
   */
  stopWatching() {
    this.watchers.forEach((filePath, watchId) => {
      this.unwatch(watchId)
    })
    console.log('🛑 Hot reload watchers stopped')
  }
}

module.exports = { HotReloadManager }

// Auto-start if run directly
if (require.main === module) {
  const manager = new HotReloadManager()
  manager.startWatching()
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    manager.stopWatching()
    process.exit(0)
  })
}
`

    return {
      filename: 'lib/dev/hot-reload.js',
      code: config,
      configType: 'development'
    }
  }  /**
   *
 Generate mock data files
   */
  private generateMockDataFiles(): GeneratedConfig[] {
    const configs: GeneratedConfig[] = []

    // Main mock data configuration
    configs.push(this.generateMockDataConfig())
    
    // Mock Flow client
    configs.push(this.generateMockFlowClient())
    
    // Mock contract data
    if (this.options.includeContracts) {
      configs.push(this.generateMockContractData())
    }

    // Mock API responses
    if (this.options.includeAPI) {
      configs.push(this.generateMockAPIResponses())
    }

    return configs
  }

  /**
   * Generate mock data configuration
   */
  private generateMockDataConfig(): GeneratedConfig {
    const mockData: MockDataConfig = {
      contracts: [
        {
          name: 'ExampleNFT',
          address: '0x1234567890abcdef',
          functions: [
            {
              name: 'mint',
              parameters: [
                { name: 'recipient', type: 'Address' },
                { name: 'metadata', type: '{String: String}' }
              ],
              returnType: 'Void',
              mockResponse: { success: true, transactionId: 'tx_mock_123' }
            },
            {
              name: 'getBalance',
              parameters: [
                { name: 'account', type: 'Address' }
              ],
              returnType: 'UInt64',
              mockResponse: 5
            }
          ],
          events: [
            {
              name: 'Minted',
              fields: { id: 'UInt64', to: 'Address' }
            }
          ]
        }
      ],
      users: [
        {
          address: '0x1234567890abcdef',
          name: 'Alice Developer',
          balance: 100.0,
          nfts: ['1', '2', '3'],
          tokens: { FLOW: 100.0, USDC: 500.0 }
        },
        {
          address: '0xfedcba0987654321',
          name: 'Bob Tester',
          balance: 50.0,
          nfts: ['4', '5'],
          tokens: { FLOW: 50.0, USDC: 250.0 }
        }
      ],
      transactions: [
        {
          id: 'tx_mock_123',
          from: '0x1234567890abcdef',
          to: '0xfedcba0987654321',
          amount: 10.0,
          status: 'sealed',
          timestamp: Date.now() - 3600000
        }
      ],
      nfts: [
        {
          id: '1',
          name: 'Cool NFT #1',
          description: 'A very cool NFT for testing',
          image: '/placeholder-nft-1.png',
          metadata: { rarity: 'common', power: 100 },
          owner: '0x1234567890abcdef'
        },
        {
          id: '2',
          name: 'Rare NFT #2',
          description: 'A rare NFT for testing',
          image: '/placeholder-nft-2.png',
          metadata: { rarity: 'rare', power: 250 },
          owner: '0x1234567890abcdef'
        }
      ],
      tokens: [
        {
          symbol: 'FLOW',
          name: 'Flow Token',
          totalSupply: 1000000000,
          decimals: 8
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          totalSupply: 1000000000,
          decimals: 6
        }
      ]
    }

    const config = `// Mock data configuration for development
// This file contains realistic test data for local development

export const mockData = ${JSON.stringify(mockData, null, 2)}

/**
 * Get mock user by address
 */
export function getMockUser(address: string) {
  return mockData.users.find(user => user.address === address)
}

/**
 * Get mock NFTs by owner
 */
export function getMockNFTsByOwner(owner: string) {
  return mockData.nfts?.filter(nft => nft.owner === owner) || []
}

/**
 * Get mock contract by name
 */
export function getMockContract(name: string) {
  return mockData.contracts.find(contract => contract.name === name)
}

/**
 * Generate mock transaction ID
 */
export function generateMockTransactionId(): string {
  return \`tx_mock_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
}

/**
 * Add delay to simulate network latency
 */
export function simulateNetworkDelay(min = 100, max = 500): Promise<void> {
  const delay = Math.random() * (max - min) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Simulate random failures for testing error handling
 */
export function simulateRandomFailure(failureRate = 0.1): boolean {
  return Math.random() < failureRate
}
`

    return {
      filename: 'lib/dev/mock-data.ts',
      code: config,
      configType: 'development'
    }
  }  /**

   * Generate mock Flow client
   */
  private generateMockFlowClient(): GeneratedConfig {
    const client = `// Mock Flow client for development
// Simulates Flow blockchain interactions with realistic responses

import { 
  mockData, 
  getMockUser, 
  getMockContract, 
  generateMockTransactionId,
  simulateNetworkDelay,
  simulateRandomFailure
} from './mock-data'

export interface MockFlowAccount {
  address: string
  balance: number
  keys: any[]
}

export interface MockFlowTransaction {
  id: string
  status: 'pending' | 'sealed' | 'failed'
  errorMessage?: string
  events: any[]
}

export class MockFlowClient {
  private static instance: MockFlowClient
  private isConnected = false
  private currentAccount: MockFlowAccount | null = null

  static getInstance(): MockFlowClient {
    if (!MockFlowClient.instance) {
      MockFlowClient.instance = new MockFlowClient()
    }
    return MockFlowClient.instance
  }

  /**
   * Mock wallet connection
   */
  async connect(): Promise<MockFlowAccount> {
    await simulateNetworkDelay(200, 800)
    
    if (simulateRandomFailure(0.05)) {
      throw new Error('Failed to connect to wallet')
    }

    this.isConnected = true
    const mockUser = mockData.users[0] // Use first mock user
    
    this.currentAccount = {
      address: mockUser.address,
      balance: mockUser.balance,
      keys: [{ index: 0, publicKey: 'mock_public_key' }]
    }

    console.log('🔗 Mock wallet connected:', this.currentAccount.address)
    return this.currentAccount
  }

  /**
   * Mock wallet disconnection
   */
  async disconnect(): Promise<void> {
    await simulateNetworkDelay(100, 300)
    
    this.isConnected = false
    this.currentAccount = null
    console.log('🔌 Mock wallet disconnected')
  }

  /**
   * Mock transaction execution
   */
  async executeTransaction(
    contractName: string,
    functionName: string,
    args: any[] = []
  ): Promise<MockFlowTransaction> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected')
    }

    await simulateNetworkDelay(500, 2000)

    if (simulateRandomFailure(0.1)) {
      const transaction: MockFlowTransaction = {
        id: generateMockTransactionId(),
        status: 'failed',
        errorMessage: 'Transaction execution failed',
        events: []
      }
      console.log('❌ Mock transaction failed:', transaction.id)
      return transaction
    }

    const contract = getMockContract(contractName)
    const func = contract?.functions.find(f => f.name === functionName)

    const transaction: MockFlowTransaction = {
      id: generateMockTransactionId(),
      status: 'sealed',
      events: [
        {
          type: \`\${contractName}.\${functionName}\`,
          data: func?.mockResponse || { success: true }
        }
      ]
    }

    console.log('✅ Mock transaction executed:', transaction.id)
    return transaction
  }

  /**
   * Mock script execution
   */
  async executeScript(
    contractName: string,
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    await simulateNetworkDelay(200, 600)

    if (simulateRandomFailure(0.05)) {
      throw new Error('Script execution failed')
    }

    const contract = getMockContract(contractName)
    const func = contract?.functions.find(f => f.name === functionName)

    const result = func?.mockResponse || { data: 'mock_result' }
    console.log('📜 Mock script executed:', { contractName, functionName, result })
    
    return result
  }

  /**
   * Get mock account information
   */
  async getAccount(address: string): Promise<MockFlowAccount | null> {
    await simulateNetworkDelay(100, 400)

    const mockUser = getMockUser(address)
    if (!mockUser) return null

    return {
      address: mockUser.address,
      balance: mockUser.balance,
      keys: [{ index: 0, publicKey: 'mock_public_key' }]
    }
  }

  /**
   * Get current connected account
   */
  getCurrentAccount(): MockFlowAccount | null {
    return this.currentAccount
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.isConnected
  }

  /**
   * Mock event subscription
   */
  subscribeToEvents(eventType: string, callback: (event: any) => void): () => void {
    console.log('👂 Subscribed to mock events:', eventType)
    
    // Simulate periodic events
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every second
        callback({
          type: eventType,
          data: { mockEvent: true, timestamp: Date.now() },
          blockHeight: Math.floor(Math.random() * 1000000)
        })
      }
    }, 1000)

    // Return unsubscribe function
    return () => {
      clearInterval(interval)
      console.log('🔇 Unsubscribed from mock events:', eventType)
    }
  }
}

// Export singleton instance
export const mockFlowClient = MockFlowClient.getInstance()

// Development utilities
export const devUtils = {
  /**
   * Reset mock client state
   */
  reset() {
    mockFlowClient.disconnect()
    console.log('🔄 Mock client state reset')
  },

  /**
   * Simulate network issues
   */
  simulateNetworkIssues(duration = 5000) {
    console.log('🌐 Simulating network issues for', duration, 'ms')
    // This would temporarily increase failure rates
    setTimeout(() => {
      console.log('🌐 Network issues simulation ended')
    }, duration)
  },

  /**
   * Get mock data summary
   */
  getMockDataSummary() {
    return {
      users: mockData.users.length,
      contracts: mockData.contracts.length,
      transactions: mockData.transactions.length,
      nfts: mockData.nfts?.length || 0,
      tokens: mockData.tokens?.length || 0
    }
  }
}
`

    return {
      filename: 'lib/dev/mock-flow-client.ts',
      code: client,
      configType: 'development'
    }
  }  /**

   * Generate mock contract data
   */
  private generateMockContractData(): GeneratedConfig {
    const contracts = `// Mock contract implementations for development testing

export const mockContracts = {
  ExampleNFT: \`
    // Mock Cadence contract for ExampleNFT
    pub contract ExampleNFT {
      pub var totalSupply: UInt64
      
      pub event Minted(id: UInt64, to: Address)
      pub event Transfer(id: UInt64, from: Address?, to: Address?)
      
      pub resource NFT {
        pub let id: UInt64
        pub let metadata: {String: String}
        
        init(id: UInt64, metadata: {String: String}) {
          self.id = id
          self.metadata = metadata
        }
      }
      
      pub fun mint(recipient: Address, metadata: {String: String}): @NFT {
        let nft <- create NFT(id: self.totalSupply, metadata: metadata)
        self.totalSupply = self.totalSupply + 1
        emit Minted(id: nft.id, to: recipient)
        return <- nft
      }
      
      init() {
        self.totalSupply = 0
      }
    }
  \`,
  
  ExampleToken: \`
    // Mock Cadence contract for ExampleToken
    pub contract ExampleToken {
      pub var totalSupply: UFix64
      
      pub event TokensInitialized(initialSupply: UFix64)
      pub event TokensWithdrawn(amount: UFix64, from: Address?)
      pub event TokensDeposited(amount: UFix64, to: Address?)
      
      pub resource Vault {
        pub var balance: UFix64
        
        init(balance: UFix64) {
          self.balance = balance
        }
        
        pub fun withdraw(amount: UFix64): @Vault {
          self.balance = self.balance - amount
          emit TokensWithdrawn(amount: amount, from: self.owner?.address)
          return <- create Vault(balance: amount)
        }
        
        pub fun deposit(from: @Vault) {
          let amount = from.balance
          self.balance = self.balance + amount
          emit TokensDeposited(amount: amount, to: self.owner?.address)
          destroy from
        }
      }
      
      pub fun createEmptyVault(): @Vault {
        return <- create Vault(balance: 0.0)
      }
      
      init() {
        self.totalSupply = 1000000.0
        emit TokensInitialized(initialSupply: self.totalSupply)
      }
    }
  \`
}

/**
 * Get mock contract code by name
 */
export function getMockContractCode(name: string): string {
  return mockContracts[name as keyof typeof mockContracts] || ''
}

/**
 * Validate mock contract syntax (simplified)
 */
export function validateMockContract(code: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Basic syntax checks
  if (!code.includes('pub contract')) {
    errors.push('Contract must start with "pub contract"')
  }
  
  if (!code.includes('init()')) {
    errors.push('Contract must have an init() function')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate mock contract deployment transaction
 */
export function generateMockDeployment(contractName: string) {
  return {
    transactionId: \`deploy_\${contractName}_\${Date.now()}\`,
    status: 'sealed' as const,
    contractAddress: \`0x\${Math.random().toString(16).substr(2, 16)}\`,
    gasUsed: Math.floor(Math.random() * 1000) + 100,
    timestamp: Date.now()
  }
}
`

    return {
      filename: 'lib/dev/mock-contracts.ts',
      code: contracts,
      configType: 'development'
    }
  }

  /**
   * Generate mock API responses
   */
  private generateMockAPIResponses(): GeneratedConfig {
    const responses = `// Mock API responses for development testing

export const mockAPIResponses = {
  '/api/contracts/deploy': {
    success: true,
    transactionId: 'tx_deploy_mock_123',
    contractAddress: '0x1234567890abcdef',
    gasUsed: 150,
    timestamp: Date.now()
  },
  
  '/api/contracts/mint': {
    success: true,
    transactionId: 'tx_mint_mock_456',
    nftId: '123',
    recipient: '0x1234567890abcdef',
    timestamp: Date.now()
  },
  
  '/api/wallet/balance': {
    address: '0x1234567890abcdef',
    balance: 100.0,
    tokens: {
      FLOW: 100.0,
      USDC: 500.0
    },
    timestamp: Date.now()
  },
  
  '/api/nfts/collection': {
    owner: '0x1234567890abcdef',
    nfts: [
      {
        id: '1',
        name: 'Cool NFT #1',
        description: 'A very cool NFT',
        image: '/placeholder-nft-1.png',
        metadata: { rarity: 'common' }
      },
      {
        id: '2',
        name: 'Rare NFT #2',
        description: 'A rare NFT',
        image: '/placeholder-nft-2.png',
        metadata: { rarity: 'rare' }
      }
    ],
    total: 2,
    timestamp: Date.now()
  }
}

/**
 * Mock API middleware for development
 */
export function createMockAPIMiddleware() {
  return (req: any, res: any, next: any) => {
    const path = req.path || req.url
    
    // Check if this is a mock API request
    if (process.env.NODE_ENV === 'development' && mockAPIResponses[path as keyof typeof mockAPIResponses]) {
      console.log('🎭 Serving mock response for:', path)
      
      // Simulate network delay
      setTimeout(() => {
        res.json(mockAPIResponses[path as keyof typeof mockAPIResponses])
      }, Math.random() * 500 + 100)
      
      return
    }
    
    next()
  }
}

/**
 * Generate dynamic mock response
 */
export function generateMockResponse(endpoint: string, params: any = {}) {
  const baseResponse = {
    success: true,
    timestamp: Date.now(),
    requestId: \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
  }
  
  switch (endpoint) {
    case 'transaction':
      return {
        ...baseResponse,
        transactionId: \`tx_mock_\${Date.now()}\`,
        status: Math.random() > 0.1 ? 'sealed' : 'failed',
        gasUsed: Math.floor(Math.random() * 1000) + 50
      }
      
    case 'balance':
      return {
        ...baseResponse,
        address: params.address || '0x1234567890abcdef',
        balance: Math.random() * 1000,
        tokens: {
          FLOW: Math.random() * 100,
          USDC: Math.random() * 1000
        }
      }
      
    case 'nft':
      return {
        ...baseResponse,
        id: params.id || Math.floor(Math.random() * 10000).toString(),
        name: \`Mock NFT #\${params.id || Math.floor(Math.random() * 100)}\`,
        description: 'A mock NFT for development testing',
        image: \`/placeholder-nft-\${Math.floor(Math.random() * 5) + 1}.png\`,
        metadata: {
          rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 5)],
          power: Math.floor(Math.random() * 1000) + 100
        }
      }
      
    default:
      return baseResponse
  }
}
`

    return {
      filename: 'lib/dev/mock-api-responses.ts',
      code: responses,
      configType: 'development'
    }
  }  /
**
   * Generate development script
   */
  private generateDevScript(): GeneratedConfig {
    const script = `#!/bin/bash

# Development script for ${this.options.projectName}
set -e

echo "🚀 Starting ${this.options.projectName} development environment..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "Please edit .env.local with your development values"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Start development services
echo "🔧 Starting development services..."

${this.options.hotReload ? `
# Start hot reload watcher in background
echo "🔥 Starting hot reload watcher..."
node lib/dev/hot-reload.js &
HOT_RELOAD_PID=$!
` : ''}

${this.options.mockData ? `
# Initialize mock data
echo "🎭 Initializing mock data..."
export MOCK_DATA_ENABLED=true
` : ''}

${this.options.debugMode ? `
# Enable debug mode
echo "🐛 Debug mode enabled"
export DEBUG=true
export NODE_OPTIONS="--inspect"
` : ''}

# Start Next.js development server
echo "⚡ Starting Next.js development server..."
${this.options.framework === 'next' ? 'pnpm dev' : 'pnpm start'}

# Cleanup on exit
cleanup() {
    echo "🧹 Cleaning up development processes..."
    ${this.options.hotReload ? 'kill $HOT_RELOAD_PID 2>/dev/null || true' : ''}
    exit 0
}

trap cleanup SIGINT SIGTERM
`

    return {
      filename: 'scripts/dev.sh',
      code: script,
      configType: 'development'
    }
  }

  /**
   * Generate test script
   */
  private generateTestScript(): GeneratedConfig {
    const script = `#!/bin/bash

# Test script for ${this.options.projectName}
set -e

echo "🧪 Running tests for ${this.options.projectName}..."

# Set test environment
export NODE_ENV=test
${this.options.mockData ? 'export MOCK_DATA_ENABLED=true' : ''}

# Run different test suites
run_tests() {
    echo "📋 Running unit tests..."
    ${this.options.testing ? 'pnpm test --run' : 'echo "Testing not configured"'}
    
    ${this.options.includeContracts ? `
    echo "📄 Running contract tests..."
    # Mock contract testing - replace with actual Flow testing
    echo "Contract tests would run here"
    ` : ''}
    
    ${this.options.includeFrontend ? `
    echo "⚛️  Running component tests..."
    # Component testing
    ${this.options.testing ? 'pnpm test components --run' : 'echo "Component testing not configured"'}
    ` : ''}
    
    ${this.options.includeAPI ? `
    echo "🔌 Running API tests..."
    # API endpoint testing
    ${this.options.testing ? 'pnpm test api --run' : 'echo "API testing not configured"'}
    ` : ''}
}

# Run linting
run_linting() {
    echo "🔍 Running linting..."
    pnpm lint || echo "Linting issues found"
}

# Run type checking
run_type_check() {
    ${this.options.typescript ? `
    echo "🔧 Running TypeScript type checking..."
    pnpm tsc --noEmit
    ` : 'echo "TypeScript not configured"'}
}

# Main test execution
main() {
    run_type_check
    run_linting
    run_tests
    echo "✅ All tests completed!"
}

main "$@"
`

    return {
      filename: 'scripts/test.sh',
      code: script,
      configType: 'development'
    }
  }

  /**
   * Generate debug script
   */
  private generateDebugScript(): GeneratedConfig {
    const script = `#!/bin/bash

# Debug script for ${this.options.projectName}
set -e

echo "🐛 Starting debug mode for ${this.options.projectName}..."

# Set debug environment
export NODE_ENV=development
export DEBUG=true
export NEXT_TELEMETRY_DISABLED=1
${this.options.mockData ? 'export MOCK_DATA_ENABLED=true' : ''}

# Debug options
DEBUG_PORT=\${DEBUG_PORT:-9229}
DEBUG_HOST=\${DEBUG_HOST:-localhost}

echo "🔍 Debug server will be available at: http://\${DEBUG_HOST}:\${DEBUG_PORT}"
echo "🌐 Application will be available at: http://localhost:3000"

${this.options.mockData ? `
echo "🎭 Mock data enabled - check /api/dev/status for details"
` : ''}

# Start with Node.js inspector
NODE_OPTIONS="--inspect=\${DEBUG_HOST}:\${DEBUG_PORT}" pnpm dev

echo "🐛 Debug session ended"
`

    return {
      filename: 'scripts/debug.sh',
      code: script,
      configType: 'development'
    }
  }  /**

   * Generate development utilities
   */
  private generateDevUtilities(): GeneratedConfig {
    const utilities = `// Development utilities for ${this.options.projectName}

import { mockFlowClient, devUtils } from './mock-flow-client'
${this.options.mockData ? "import { mockData, generateMockTransactionId } from './mock-data'" : ''}

/**
 * Development console utilities
 * Available in browser console during development
 */
export const devConsole = {
  /**
   * Get development status
   */
  status() {
    return {
      environment: process.env.NODE_ENV,
      features: {
        contracts: ${this.options.includeContracts},
        frontend: ${this.options.includeFrontend},
        api: ${this.options.includeAPI},
        hotReload: ${this.options.hotReload},
        mockData: ${this.options.mockData},
        typescript: ${this.options.typescript},
        testing: ${this.options.testing}
      },
      mockClient: mockFlowClient.isWalletConnected(),
      ${this.options.mockData ? 'mockDataSummary: devUtils.getMockDataSummary()' : 'mockData: false'}
    }
  },

  /**
   * Quick wallet connection for testing
   */
  async connectWallet() {
    try {
      const account = await mockFlowClient.connect()
      console.log('✅ Wallet connected:', account)
      return account
    } catch (error) {
      console.error('❌ Wallet connection failed:', error)
      throw error
    }
  },

  /**
   * Quick wallet disconnection
   */
  async disconnectWallet() {
    await mockFlowClient.disconnect()
    console.log('🔌 Wallet disconnected')
  },

  ${this.options.mockData ? `
  /**
   * Generate test transaction
   */
  async testTransaction(contractName = 'ExampleNFT', functionName = 'mint') {
    try {
      const result = await mockFlowClient.executeTransaction(contractName, functionName, [])
      console.log('✅ Test transaction:', result)
      return result
    } catch (error) {
      console.error('❌ Test transaction failed:', error)
      throw error
    }
  },

  /**
   * Get mock data
   */
  getMockData() {
    return mockData
  },

  /**
   * Reset mock client
   */
  reset() {
    devUtils.reset()
    console.log('🔄 Development environment reset')
  },
  ` : ''}

  /**
   * Test API endpoints
   */
  async testAPI(endpoint: string, method = 'GET', body?: any) {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        ...(body && { body: JSON.stringify(body) })
      })
      
      const data = await response.json()
      console.log(\`✅ API test (\${method} \${endpoint}):\`, data)
      return data
    } catch (error) {
      console.error(\`❌ API test failed (\${method} \${endpoint}):\`, error)
      throw error
    }
  },

  /**
   * Performance testing
   */
  async performanceTest(iterations = 10) {
    console.log(\`🏃 Running performance test (\${iterations} iterations)...\`)
    
    const results = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      
      // Test wallet connection
      await this.connectWallet()
      ${this.options.mockData ? 'await this.testTransaction()' : ''}
      await this.disconnectWallet()
      
      const end = performance.now()
      results.push(end - start)
    }
    
    const avg = results.reduce((a, b) => a + b, 0) / results.length
    const min = Math.min(...results)
    const max = Math.max(...results)
    
    console.log('📊 Performance results:', {
      iterations,
      average: \`\${avg.toFixed(2)}ms\`,
      min: \`\${min.toFixed(2)}ms\`,
      max: \`\${max.toFixed(2)}ms\`
    })
    
    return { avg, min, max, results }
  }
}

// Make utilities available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).devConsole = devConsole
  console.log('🛠️  Development utilities available as window.devConsole')
  console.log('💡 Try: devConsole.status(), devConsole.connectWallet(), etc.')
}

export default devConsole
`

    return {
      filename: 'lib/dev/dev-utilities.ts',
      code: utilities,
      configType: 'development'
    }
  }

  /**
   * Generate local environment configuration
   */
  private generateLocalEnvConfig(): GeneratedConfig {
    const config = `# Local Development Environment Configuration
# This file contains development-specific environment variables

# Development Mode
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# Development Features
${this.options.hotReload ? 'HOT_RELOAD_ENABLED=true' : '# HOT_RELOAD_ENABLED=false'}
${this.options.mockData ? 'MOCK_DATA_ENABLED=true' : '# MOCK_DATA_ENABLED=false'}
${this.options.debugMode ? 'DEBUG=true' : '# DEBUG=false'}

# Development Server Configuration
PORT=3000
HOSTNAME=localhost

# Mock Flow Configuration (for development)
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_MOCK_MODE=true

# Development API Keys (use test/development keys only)
# OPENAI_API_KEY=your_development_openai_key
# GOOGLE_GENERATIVE_AI_API_KEY=your_development_gemini_key

# Application Configuration
NEXT_PUBLIC_APP_NAME=${this.options.projectName}
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Development Database (if needed)
# DATABASE_URL=postgresql://localhost:5432/${this.options.projectName.toLowerCase()}_dev

# Development Logging
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true

# Performance Monitoring (development)
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=1.0

# Security (development - use weak settings for convenience)
NEXTAUTH_SECRET=development_secret_key_not_for_production
NEXTAUTH_URL=http://localhost:3000

# Development Tools
ENABLE_DEV_TOOLS=true
ENABLE_MOCK_RESPONSES=true
SIMULATE_NETWORK_DELAY=true

# Testing Configuration
TEST_TIMEOUT=30000
ENABLE_TEST_COVERAGE=true

# Hot Reload Configuration
${this.options.hotReload ? `
WATCH_CONTRACTS=true
WATCH_COMPONENTS=true
WATCH_API_ROUTES=true
RELOAD_DELAY=1000
` : ''}

# Mock Data Configuration
${this.options.mockData ? `
MOCK_USER_COUNT=5
MOCK_NFT_COUNT=20
MOCK_TRANSACTION_COUNT=50
MOCK_FAILURE_RATE=0.1
MOCK_NETWORK_DELAY_MIN=100
MOCK_NETWORK_DELAY_MAX=500
` : ''}
`

    return {
      filename: '.env.development',
      code: config,
      configType: 'development'
    }
  }
}