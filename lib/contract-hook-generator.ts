import { ContractIntegration } from './vibesdk'

/**
 * Contract Hook Generator
 * Automatically generates React hooks for Flow smart contract interactions
 */
export class ContractHookGenerator {
  /**
   * Generate React hooks for contract functions
   */
  generateContractHooks(integrations: ContractIntegration[]): string {
    if (integrations.length === 0) return ''

    const imports = this.generateHookImports()
    const hooks = integrations.map(integration => this.generateSingleContractHook(integration))
    
    return `${imports}\n\n${hooks.join('\n\n')}`
  }

  /**
   * Generate imports for contract hooks
   */
  private generateHookImports(): string {
    return `import { useState, useEffect, useCallback } from 'react'
import { executeTransaction, executeScript } from '@/lib/flow-client'
import { useFlowUser } from '@/hooks/use-flow-user'`
  }

  /**
   * Generate a single contract hook
   */
  private generateSingleContractHook(integration: ContractIntegration): string {
    const hookName = `use${integration.contractName}`
    const contractName = integration.contractName
    
    const functionMethods = integration.functions.map(func => 
      this.generateFunctionMethod(contractName, func)
    ).join(',\n\n')

    const eventListeners = integration.events.map(event =>
      this.generateEventListener(contractName, event)
    ).join('\n\n')

    return `/**
 * Hook for ${contractName} contract interactions
 * Provides functions for all contract methods and event listening
 */
export function ${hookName}() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const { user, isAuthenticated } = useFlowUser()

  // Clear error when user changes
  useEffect(() => {
    setError(null)
    setTransactionStatus('idle')
  }, [user])

  // Contract function methods
  const contractMethods = {
${functionMethods}
  }

  // Event listeners
${eventListeners}

  // Utility methods
  const clearError = useCallback(() => {
    setError(null)
    setTransactionStatus('idle')
  }, [])

  const isReady = isAuthenticated && user

  return {
    // State
    loading,
    error,
    transactionStatus,
    transactionId,
    isReady,
    user,
    
    // Contract methods
    ...contractMethods,
    
    // Utilities
    clearError
  }
}`
  }

  /**
   * Generate a contract function method
   */
  private generateFunctionMethod(contractName: string, functionName: string): string {
    const methodName = this.toCamelCase(functionName)
    
    return `    ${methodName}: async (...args: any[]) => {
      if (!isAuthenticated || !user) {
        throw new Error('User must be authenticated to call ${functionName}')
      }

      try {
        setLoading(true)
        setError(null)
        setTransactionStatus('pending')
        
        const transactionCode = \`
          import ${contractName} from 0x\${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}
          
          transaction {
            prepare(signer: &Account) {
              // Transaction preparation
            }
            
            execute {
              ${contractName}.${functionName}(\${args.map((_, i) => \`arg\${i}\`).join(', ')})
            }
          }
        \`
        
        const result = await executeTransaction(transactionCode, args)
        setTransactionId(result.transactionId)
        setTransactionStatus('success')
        
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
        setError(errorMessage)
        setTransactionStatus('error')
        throw err
      } finally {
        setLoading(false)
      }
    }`
  }

  /**
   * Generate event listener
   */
  private generateEventListener(contractName: string, eventName: string): string {
    const listenerName = `listen${this.toPascalCase(eventName)}`
    
    return `  // Event listener for ${eventName}
  const ${listenerName} = useCallback((callback: (event: any) => void) => {
    // Event listening implementation would go here
    // This is a placeholder for Flow event subscription
    console.log('Listening for ${contractName}.${eventName} events')
    
    // Return cleanup function
    return () => {
      console.log('Cleaning up ${eventName} event listener')
    }
  }, [user])`
  }

  /**
   * Generate a script-based query method
   */
  generateScriptMethod(contractName: string, functionName: string): string {
    const methodName = `query${this.toPascalCase(functionName)}`
    
    return `    ${methodName}: async (...args: any[]) => {
      try {
        setLoading(true)
        setError(null)
        
        const scriptCode = \`
          import ${contractName} from 0x\${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}
          
          access(all) fun main(): AnyStruct {
            return ${contractName}.${functionName}(\${args.map((_, i) => \`arg\${i}\`).join(', ')})
          }
        \`
        
        const result = await executeScript(scriptCode, args)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Script execution failed'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    }`
  }

  /**
   * Generate typed hook for specific contract
   */
  generateTypedHook(integration: ContractIntegration, contractABI: any): string {
    const hookName = `use${integration.contractName}Typed`
    const contractName = integration.contractName
    
    // Generate TypeScript interfaces from contract ABI
    const interfaces = this.generateContractInterfaces(contractABI)
    
    const typedMethods = integration.functions.map(func => {
      const methodInfo = contractABI.functions?.find((f: any) => f.name === func)
      return this.generateTypedMethod(contractName, func, methodInfo)
    }).join(',\n\n')

    return `${interfaces}

/**
 * Typed hook for ${contractName} contract with full type safety
 */
export function ${hookName}() {
  const baseHook = ${`use${contractName}`}()
  
  return {
    ...baseHook,
    
    // Typed methods
${typedMethods}
  }
}`
  }

  /**
   * Generate TypeScript interfaces from contract ABI
   */
  private generateContractInterfaces(contractABI: any): string {
    if (!contractABI || !contractABI.functions) return ''
    
    const functionInterfaces = contractABI.functions.map((func: any) => {
      const params = func.parameters?.map((param: any) => 
        `${param.name}: ${this.mapCadenceTypeToTS(param.type)}`
      ).join(', ') || ''
      
      const returnType = this.mapCadenceTypeToTS(func.returnType || 'Void')
      
      return `  ${func.name}(${params}): Promise<${returnType}>`
    }).join('\n')

    return `interface ${contractABI.name}Contract {
${functionInterfaces}
}`
  }

  /**
   * Generate typed method with proper parameter and return types
   */
  private generateTypedMethod(contractName: string, functionName: string, methodInfo: any): string {
    const methodName = this.toCamelCase(functionName)
    const params = methodInfo?.parameters?.map((param: any) => 
      `${param.name}: ${this.mapCadenceTypeToTS(param.type)}`
    ).join(', ') || '...args: any[]'
    
    const returnType = this.mapCadenceTypeToTS(methodInfo?.returnType || 'any')
    
    return `    ${methodName}: async (${params}): Promise<${returnType}> => {
      return baseHook.${methodName}(${methodInfo?.parameters?.map((p: any) => p.name).join(', ') || '...args'}) as Promise<${returnType}>
    }`
  }

  /**
   * Map Cadence types to TypeScript types
   */
  private mapCadenceTypeToTS(cadenceType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'string',
      'Int': 'number',
      'UInt64': 'number',
      'UFix64': 'number',
      'Bool': 'boolean',
      'Address': 'string',
      'Void': 'void',
      '[String]': 'string[]',
      '[UInt64]': 'number[]',
      '{String: String}': 'Record<string, string>',
      'AnyStruct': 'any',
      'AnyResource': 'any'
    }
    
    return typeMap[cadenceType] || 'any'
  }

  /**
   * Generate form integration hook
   */
  generateFormHook(integration: ContractIntegration, formFields: string[]): string {
    const hookName = `use${integration.contractName}Form`
    const contractName = integration.contractName
    
    const formSchema = this.generateFormSchema(formFields)
    const submitHandler = this.generateFormSubmitHandler(integration)
    
    return `import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

${formSchema}

/**
 * Form hook for ${contractName} contract interactions
 */
export function ${hookName}() {
  const contract = use${contractName}()
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  })

${submitHandler}

  return {
    form,
    onSubmit,
    isLoading: contract.loading,
    error: contract.error,
    transactionStatus: contract.transactionStatus,
    clearError: contract.clearError
  }
}`
  }

  /**
   * Generate form schema for contract interaction
   */
  private generateFormSchema(fields: string[]): string {
    const schemaFields = fields.map(field => {
      // Infer type from field name
      let zodType = 'z.string()'
      if (field.toLowerCase().includes('amount') || field.toLowerCase().includes('price')) {
        zodType = 'z.number().positive()'
      }
      if (field.toLowerCase().includes('id')) {
        zodType = 'z.number().int().positive()'
      }
      
      return `  ${field}: ${zodType}`
    }).join(',\n')

    return `const formSchema = z.object({
${schemaFields}
})

type FormData = z.infer<typeof formSchema>`
  }

  /**
   * Generate form submit handler
   */
  private generateFormSubmitHandler(integration: ContractIntegration): string {
    const primaryFunction = integration.functions[0] // Use first function as primary
    const methodName = this.toCamelCase(primaryFunction)
    
    return `  const onSubmit = async (data: FormData) => {
    try {
      await contract.${methodName}(data)
      form.reset()
    } catch (error) {
      // Error is handled by the contract hook
      console.error('Form submission failed:', error)
    }
  }`
  }

  /**
   * Utility: Convert to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
  }

  /**
   * Utility: Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + this.toCamelCase(str).slice(1)
  }
}