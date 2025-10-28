import { flowClient } from "./flow-client"

/**
 * Flow API Integration Utilities
 * Provides utilities for integrating Flow blockchain operations into API routes
 */

export interface FlowScriptOptions {
  script: string
  args: any[]
  timeout?: number
}

export interface FlowTransactionOptions {
  transaction: string
  args: any[]
  authorizers: string[]
  payer?: string
  timeout?: number
}

export interface FlowScriptResult {
  success: boolean
  data: any
  error?: string
  executionTime: number
}

export interface FlowTransactionResult {
  success: boolean
  transactionId: string
  status: string
  events: any[]
  error?: string
  executionTime: number
}

export interface ContractDeploymentOptions {
  contractName: string
  contractCode: string
  authorizer: string
  arguments?: any[]
}

export interface AccountInfo {
  address: string
  balance: number
  keys: any[]
  contracts: Record<string, any>
}

/**
 * Execute a Flow script (read operation)
 */
export async function executeFlowScript(options: FlowScriptOptions): Promise<FlowScriptResult> {
  const startTime = Date.now()
  
  try {
    console.log('[Flow API] Executing script:', options.script.substring(0, 100) + '...')
    
    const result = await flowClient.executeScript({
      script: options.script,
      args: options.args || []
    })
    
    const executionTime = Date.now() - startTime
    
    console.log(`[Flow API] Script executed successfully in ${executionTime}ms`)
    
    return {
      success: true,
      data: result,
      executionTime
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown script execution error'
    
    console.error('[Flow API] Script execution failed:', errorMessage)
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      executionTime
    }
  }
}

/**
 * Execute a Flow transaction (write operation)
 */
export async function executeFlowTransaction(options: FlowTransactionOptions): Promise<FlowTransactionResult> {
  const startTime = Date.now()
  
  try {
    console.log('[Flow API] Executing transaction for authorizers:', options.authorizers)
    
    const result = await flowClient.executeTransaction({
      transaction: options.transaction,
      args: options.args || [],
      authorizers: options.authorizers,
      payer: options.payer || options.authorizers[0]
    })
    
    const executionTime = Date.now() - startTime
    
    console.log(`[Flow API] Transaction executed successfully in ${executionTime}ms:`, result.transactionId)
    
    return {
      success: true,
      transactionId: result.transactionId,
      status: result.status,
      events: result.events || [],
      executionTime
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown transaction execution error'
    
    console.error('[Flow API] Transaction execution failed:', errorMessage)
    
    return {
      success: false,
      transactionId: '',
      status: 'FAILED',
      events: [],
      error: errorMessage,
      executionTime
    }
  }
}

/**
 * Deploy a contract to Flow blockchain
 */
export async function deployContract(options: ContractDeploymentOptions): Promise<FlowTransactionResult> {
  const deploymentTransaction = `
    transaction(name: String, code: String) {
      prepare(signer: &Account) {
        signer.contracts.add(name: name, code: code.utf8)
      }
    }
  `
  
  return executeFlowTransaction({
    transaction: deploymentTransaction,
    args: [options.contractName, options.contractCode],
    authorizers: [options.authorizer]
  })
}

/**
 * Get account information
 */
export async function getAccountInfo(address: string): Promise<AccountInfo | null> {
  const script = `
    access(all) fun main(address: Address): {String: AnyStruct} {
      let account = getAccount(address)
      
      return {
        "address": address.toString(),
        "balance": account.balance,
        "availableBalance": account.availableBalance,
        "storageUsed": account.storageUsed,
        "storageCapacity": account.storageCapacity
      }
    }
  `
  
  try {
    const result = await executeFlowScript({
      script,
      args: [address]
    })
    
    if (result.success) {
      return {
        address: result.data.address,
        balance: result.data.balance,
        keys: [], // Would need additional script to get keys
        contracts: {} // Would need additional script to get contracts
      }
    }
    
    return null
  } catch (error) {
    console.error('[Flow API] Failed to get account info:', error)
    return null
  }
}

/**
 * Check if a contract exists at an address
 */
export async function contractExists(address: string, contractName: string): Promise<boolean> {
  const script = `
    access(all) fun main(address: Address, contractName: String): Bool {
      let account = getAccount(address)
      return account.contracts.get(name: contractName) != nil
    }
  `
  
  try {
    const result = await executeFlowScript({
      script,
      args: [address, contractName]
    })
    
    return result.success && result.data === true
  } catch (error) {
    console.error('[Flow API] Failed to check contract existence:', error)
    return false
  }
}

/**
 * Get contract code
 */
export async function getContractCode(address: string, contractName: string): Promise<string | null> {
  const script = `
    access(all) fun main(address: Address, contractName: String): String? {
      let account = getAccount(address)
      let contract = account.contracts.get(name: contractName)
      return contract?.code
    }
  `
  
  try {
    const result = await executeFlowScript({
      script,
      args: [address, contractName]
    })
    
    return result.success ? result.data : null
  } catch (error) {
    console.error('[Flow API] Failed to get contract code:', error)
    return null
  }
}

/**
 * Validate Flow address format
 */
export function isValidFlowAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{16}$/.test(address)
}

/**
 * Format Flow address (ensure 0x prefix and proper length)
 */
export function formatFlowAddress(address: string): string {
  // Remove 0x prefix if present
  let cleanAddress = address.replace(/^0x/, '')
  
  // Pad with zeros if needed
  cleanAddress = cleanAddress.padStart(16, '0')
  
  // Add 0x prefix
  return `0x${cleanAddress}`
}

/**
 * Convert Cadence value to JavaScript value
 */
export function convertCadenceValue(value: any, type: string): any {
  switch (type.toLowerCase()) {
    case 'string':
      return String(value)
    case 'int':
    case 'uint64':
    case 'ufix64':
      return Number(value)
    case 'bool':
      return Boolean(value)
    case 'address':
      return formatFlowAddress(String(value))
    case 'array':
      return Array.isArray(value) ? value : []
    case 'dictionary':
      return typeof value === 'object' ? value : {}
    default:
      return value
  }
}

/**
 * Convert JavaScript value to Cadence argument
 */
export function convertToCadenceArg(value: any, type: string): any {
  switch (type.toLowerCase()) {
    case 'string':
      return { type: 'String', value: String(value) }
    case 'int':
      return { type: 'Int', value: String(Math.floor(Number(value))) }
    case 'uint64':
      return { type: 'UInt64', value: String(Math.floor(Number(value))) }
    case 'ufix64':
      return { type: 'UFix64', value: String(Number(value)) }
    case 'bool':
      return { type: 'Bool', value: Boolean(value) }
    case 'address':
      return { type: 'Address', value: formatFlowAddress(String(value)) }
    default:
      return { type: 'String', value: String(value) }
  }
}

/**
 * Create a standardized API response
 */
export function createAPIResponse(data: any, success: boolean = true, error?: string) {
  return {
    success,
    data: success ? data : null,
    error: error || null,
    timestamp: new Date().toISOString(),
    blockchain: 'flow'
  }
}

/**
 * Handle Flow API errors consistently
 */
export function handleFlowError(error: unknown, operation: string) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  
  console.error(`[Flow API] ${operation} failed:`, errorMessage)
  
  // Categorize errors
  if (errorMessage.includes('account not found')) {
    return {
      code: 'ACCOUNT_NOT_FOUND',
      message: 'The specified account does not exist',
      category: 'client_error'
    }
  }
  
  if (errorMessage.includes('contract not found')) {
    return {
      code: 'CONTRACT_NOT_FOUND',
      message: 'The specified contract does not exist',
      category: 'client_error'
    }
  }
  
  if (errorMessage.includes('insufficient balance')) {
    return {
      code: 'INSUFFICIENT_BALANCE',
      message: 'Account has insufficient balance for this operation',
      category: 'client_error'
    }
  }
  
  if (errorMessage.includes('timeout')) {
    return {
      code: 'TIMEOUT',
      message: 'Operation timed out',
      category: 'server_error'
    }
  }
  
  if (errorMessage.includes('network')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection error',
      category: 'server_error'
    }
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage,
    category: 'server_error'
  }
}

/**
 * Retry mechanism for Flow operations
 */
export async function retryFlowOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      console.warn(`[Flow API] Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Exponential backoff
      delay *= 2
    }
  }
  
  throw lastError!
}

/**
 * Batch multiple Flow operations
 */
export async function batchFlowOperations<T>(
  operations: Array<() => Promise<T>>,
  concurrency: number = 3
): Promise<Array<T | Error>> {
  const results: Array<T | Error> = []
  
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency)
    
    const batchResults = await Promise.allSettled(
      batch.map(op => op())
    )
    
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    ))
  }
  
  return results
}

/**
 * Monitor Flow transaction status
 */
export async function monitorTransaction(
  transactionId: string,
  timeout: number = 30000
): Promise<{ status: string, events: any[] }> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      const result = await flowClient.getTransactionStatus(transactionId)
      
      if (result.status === 'SEALED' || result.status === 'EXPIRED') {
        return {
          status: result.status,
          events: result.events || []
        }
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.warn('[Flow API] Error checking transaction status:', error)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  throw new Error(`Transaction ${transactionId} monitoring timed out`)
}