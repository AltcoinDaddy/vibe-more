import { ContractIntegration, GeneratedContract } from './vibesdk'

/**
 * Contract-to-Component Binding System
 * Generates TypeScript interfaces from contract definitions and handles automatic event listening
 */
export class ContractBindingSystem {
  /**
   * Generate TypeScript interfaces from Cadence contract
   */
  generateContractInterfaces(contract: GeneratedContract): ContractInterfaces {
    const contractAST = this.parseCadenceContract(contract.code)
    const interfaces = this.extractInterfaces(contractAST)
    const types = this.extractTypes(contractAST)
    const events = this.extractEvents(contractAST)
    
    return {
      contractName: contract.filename.replace('.cdc', ''),
      interfaces: this.generateTSInterfaces(interfaces),
      types: this.generateTSTypes(types),
      events: this.generateEventTypes(events),
      functions: this.generateFunctionTypes(contractAST.functions || [])
    }
  }

  /**
   * Create automatic event listening system
   */
  generateEventListeners(
    contractName: string,
    events: ContractEvent[]
  ): EventListenerSystem {
    const listenerCode = this.generateEventListenerCode(contractName, events)
    const hookCode = this.generateEventHookCode(contractName, events)
    const providerCode = this.generateEventProviderCode(contractName, events)
    
    return {
      listenerCode,
      hookCode,
      providerCode,
      dependencies: this.getEventListenerDependencies()
    }
  }

  /**
   * Generate state management for contract interactions
   */
  generateStateManagement(
    contractName: string,
    functions: ContractFunction[],
    events: ContractEvent[]
  ): StateManagementSystem {
    const stateTypes = this.generateStateTypes(contractName, functions, events)
    const reducerCode = this.generateReducerCode(contractName, functions, events)
    const contextCode = this.generateContextCode(contractName)
    const hookCode = this.generateStateHookCode(contractName)
    
    return {
      stateTypes,
      reducerCode,
      contextCode,
      hookCode,
      dependencies: this.getStateManagementDependencies()
    }
  }

  /**
   * Create error handling and loading state components
   */
  generateErrorHandling(contractName: string): ErrorHandlingSystem {
    const errorTypes = this.generateErrorTypes(contractName)
    const errorBoundary = this.generateErrorBoundary(contractName)
    const errorDisplay = this.generateErrorDisplay(contractName)
    const loadingStates = this.generateLoadingStates(contractName)
    
    return {
      errorTypes,
      errorBoundary,
      errorDisplay,
      loadingStates,
      dependencies: this.getErrorHandlingDependencies()
    }
  }

  /**
   * Parse Cadence contract to extract structure
   */
  private parseCadenceContract(contractCode: string): ContractAST {
    // Simplified parser - in production, this would use a proper Cadence parser
    const ast: ContractAST = {
      name: this.extractContractName(contractCode),
      functions: this.extractFunctions(contractCode),
      events: this.extractEventDefinitions(contractCode),
      resources: this.extractResources(contractCode),
      structs: this.extractStructs(contractCode),
      interfaces: this.extractInterfaceDefinitions(contractCode)
    }
    
    return ast
  }

  /**
   * Extract contract name from code
   */
  private extractContractName(code: string): string {
    const match = code.match(/(?:access\(all\)\s+)?contract\s+(\w+)/)
    return match ? match[1] : 'UnknownContract'
  }

  /**
   * Extract functions from contract code
   */
  private extractFunctions(code: string): ContractFunction[] {
    const functions: ContractFunction[] = []
    const functionRegex = /(?:access\([\w\s,]+\)\s+)?fun\s+(\w+)\s*\([^)]*\)(?:\s*:\s*([^{]+))?/g
    
    let match
    while ((match = functionRegex.exec(code)) !== null) {
      const [, name, returnType] = match
      functions.push({
        name,
        returnType: returnType?.trim() || 'Void',
        parameters: this.extractFunctionParameters(match[0]),
        access: this.extractAccessModifier(match[0]),
        isTransaction: this.isTransactionFunction(name, code),
        isScript: this.isScriptFunction(name, code)
      })
    }
    
    return functions
  } 
 /**
   * Extract events from contract code
   */
  private extractEventDefinitions(code: string): ContractEvent[] {
    const events: ContractEvent[] = []
    const eventRegex = /(?:access\(all\)\s+)?event\s+(\w+)\s*\(([^)]*)\)/g
    
    let match
    while ((match = eventRegex.exec(code)) !== null) {
      const [, name, params] = match
      events.push({
        name,
        parameters: this.parseEventParameters(params),
        description: this.extractEventDescription(name, code)
      })
    }
    
    return events
  }

  /**
   * Generate TypeScript interfaces
   */
  private generateTSInterfaces(interfaces: any[]): string {
    if (interfaces.length === 0) return ''
    
    const interfaceCode = interfaces.map(iface => {
      const methods = iface.methods?.map((method: any) => 
        `  ${method.name}(${method.parameters}): ${method.returnType}`
      ).join('\n') || ''
      
      return `interface ${iface.name} {
${methods}
}`
    }).join('\n\n')
    
    return interfaceCode
  }

  /**
   * Generate TypeScript types
   */
  private generateTSTypes(types: any[]): string {
    if (types.length === 0) return ''
    
    const typeCode = types.map(type => {
      if (type.kind === 'struct') {
        const fields = type.fields?.map((field: any) => 
          `  ${field.name}: ${this.mapCadenceTypeToTS(field.type)}`
        ).join('\n') || ''
        
        return `interface ${type.name} {
${fields}
}`
      }
      
      if (type.kind === 'enum') {
        const values = type.values?.map((value: string) => `  ${value}`).join(' |\n') || ''
        return `type ${type.name} =\n${values}`
      }
      
      return `type ${type.name} = ${this.mapCadenceTypeToTS(type.definition)}`
    }).join('\n\n')
    
    return typeCode
  }

  /**
   * Generate event types
   */
  private generateEventTypes(events: ContractEvent[]): string {
    if (events.length === 0) return ''
    
    const eventTypes = events.map(event => {
      const fields = event.parameters.map(param => 
        `  ${param.name}: ${this.mapCadenceTypeToTS(param.type)}`
      ).join('\n')
      
      return `interface ${event.name}Event {
${fields}
}`
    }).join('\n\n')
    
    const unionType = `type ContractEvent = ${events.map(e => `${e.name}Event`).join(' | ')}`
    
    return `${eventTypes}\n\n${unionType}`
  }

  /**
   * Generate function types
   */
  private generateFunctionTypes(functions: ContractFunction[]): string {
    if (functions.length === 0) return ''
    
    const functionTypes = functions.map(func => {
      const params = func.parameters.map(param => 
        `${param.name}: ${this.mapCadenceTypeToTS(param.type)}`
      ).join(', ')
      
      const returnType = this.mapCadenceTypeToTS(func.returnType)
      
      return `  ${func.name}: (${params}) => Promise<${returnType}>`
    }).join('\n')
    
    return `interface ContractFunctions {
${functionTypes}
}`
  }

  /**
   * Generate event listener code
   */
  private generateEventListenerCode(contractName: string, events: ContractEvent[]): string {
    const listenerMethods = events.map(event => 
      this.generateSingleEventListener(contractName, event)
    ).join('\n\n')
    
    return `/**
 * Event listener system for ${contractName} contract
 */
export class ${contractName}EventListener {
  private subscriptions: Map<string, () => void> = new Map()
  
  constructor(private contractAddress: string) {}

${listenerMethods}

  /**
   * Cleanup all event subscriptions
   */
  cleanup() {
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions.clear()
  }
}`
  }

  /**
   * Generate single event listener
   */
  private generateSingleEventListener(contractName: string, event: ContractEvent): string {
    return `  /**
   * Listen for ${event.name} events
   */
  on${event.name}(callback: (event: ${event.name}Event) => void): () => void {
    const eventType = \`A.\${this.contractAddress}.${contractName}.${event.name}\`
    
    // This would use the actual Flow event subscription API
    const unsubscribe = () => {
      console.log(\`Unsubscribing from \${eventType}\`)
    }
    
    // Mock event listener - replace with actual Flow SDK implementation
    console.log(\`Listening for \${eventType} events\`)
    
    this.subscriptions.set(eventType, unsubscribe)
    return unsubscribe
  }`
  }

  /**
   * Generate event hook code
   */
  private generateEventHookCode(contractName: string, events: ContractEvent[]): string {
    const eventHooks = events.map(event => 
      this.generateSingleEventHook(contractName, event)
    ).join('\n\n')
    
    return `import { useState, useEffect, useCallback } from 'react'
import { ${contractName}EventListener } from './${contractName.toLowerCase()}-event-listener'

/**
 * React hooks for ${contractName} contract events
 */

${eventHooks}

/**
 * Hook to listen for all ${contractName} events
 */
export function use${contractName}Events(contractAddress: string) {
  const [events, setEvents] = useState<ContractEvent[]>([])
  const [listener, setListener] = useState<${contractName}EventListener | null>(null)
  
  useEffect(() => {
    const eventListener = new ${contractName}EventListener(contractAddress)
    setListener(eventListener)
    
    return () => {
      eventListener.cleanup()
    }
  }, [contractAddress])
  
  const addEvent = useCallback((event: ContractEvent) => {
    setEvents(prev => [...prev, event])
  }, [])
  
  return {
    events,
    listener,
    clearEvents: () => setEvents([])
  }
}`
  }

  /**
   * Generate single event hook
   */
  private generateSingleEventHook(contractName: string, event: ContractEvent): string {
    return `/**
 * Hook to listen for ${event.name} events
 */
export function use${contractName}${event.name}(contractAddress: string) {
  const [events, setEvents] = useState<${event.name}Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const listener = new ${contractName}EventListener(contractAddress)
    setLoading(true)
    
    const unsubscribe = listener.on${event.name}((event) => {
      setEvents(prev => [...prev, event])
      setError(null)
    })
    
    setLoading(false)
    
    return () => {
      unsubscribe()
    }
  }, [contractAddress])
  
  return {
    events,
    loading,
    error,
    clearEvents: () => setEvents([])
  }
}`
  }

  /**
   * Generate event provider code
   */
  private generateEventProviderCode(contractName: string, events: ContractEvent[]): string {
    return `import React, { createContext, useContext, useEffect, useState } from 'react'
import { ${contractName}EventListener } from './${contractName.toLowerCase()}-event-listener'

interface ${contractName}EventContextType {
  events: ContractEvent[]
  listener: ${contractName}EventListener | null
  subscribe: (eventType: string, callback: (event: any) => void) => () => void
  clearEvents: () => void
}

const ${contractName}EventContext = createContext<${contractName}EventContextType | null>(null)

interface ${contractName}EventProviderProps {
  children: React.ReactNode
  contractAddress: string
}

export function ${contractName}EventProvider({ 
  children, 
  contractAddress 
}: ${contractName}EventProviderProps) {
  const [events, setEvents] = useState<ContractEvent[]>([])
  const [listener, setListener] = useState<${contractName}EventListener | null>(null)
  
  useEffect(() => {
    const eventListener = new ${contractName}EventListener(contractAddress)
    setListener(eventListener)
    
    return () => {
      eventListener.cleanup()
    }
  }, [contractAddress])
  
  const subscribe = (eventType: string, callback: (event: any) => void) => {
    if (!listener) return () => {}
    
    // Subscribe to specific event type
    const unsubscribe = () => {
      console.log(\`Unsubscribing from \${eventType}\`)
    }
    
    return unsubscribe
  }
  
  const clearEvents = () => setEvents([])
  
  return (
    <${contractName}EventContext.Provider value={{
      events,
      listener,
      subscribe,
      clearEvents
    }}>
      {children}
    </${contractName}EventContext.Provider>
  )
}

export function use${contractName}EventContext() {
  const context = useContext(${contractName}EventContext)
  if (!context) {
    throw new Error('use${contractName}EventContext must be used within ${contractName}EventProvider')
  }
  return context
}`
  } 
 /**
   * Generate state types
   */
  private generateStateTypes(
    contractName: string,
    functions: ContractFunction[],
    events: ContractEvent[]
  ): string {
    return `// State types for ${contractName} contract
interface ${contractName}State {
  // Contract data
  data: any
  
  // Loading states
  loading: {
    ${functions.map(f => `${f.name}: boolean`).join('\n    ')}
  }
  
  // Error states
  errors: {
    ${functions.map(f => `${f.name}: string | null`).join('\n    ')}
  }
  
  // Transaction states
  transactions: {
    ${functions.filter(f => f.isTransaction).map(f => `${f.name}: TransactionStatus`).join('\n    ')}
  }
  
  // Event history
  events: ContractEvent[]
}

type TransactionStatus = 'idle' | 'pending' | 'success' | 'error'

// Action types
type ${contractName}Action = 
  | { type: 'SET_LOADING'; payload: { function: string; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { function: string; error: string | null } }
  | { type: 'SET_TRANSACTION_STATUS'; payload: { function: string; status: TransactionStatus } }
  | { type: 'ADD_EVENT'; payload: ContractEvent }
  | { type: 'SET_DATA'; payload: any }
  | { type: 'RESET_STATE' }`
  }

  /**
   * Generate reducer code
   */
  private generateReducerCode(
    contractName: string,
    functions: ContractFunction[],
    events: ContractEvent[]
  ): string {
    const initialState = this.generateInitialState(contractName, functions)
    
    return `// Reducer for ${contractName} contract state
export const ${contractName.toLowerCase()}Reducer = (
  state: ${contractName}State,
  action: ${contractName}Action
): ${contractName}State => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.function]: action.payload.loading
        }
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.function]: action.payload.error
        }
      }
    
    case 'SET_TRANSACTION_STATUS':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          [action.payload.function]: action.payload.status
        }
      }
    
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload]
      }
    
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload
      }
    
    case 'RESET_STATE':
      return ${initialState}
    
    default:
      return state
  }
}

export const initial${contractName}State: ${contractName}State = ${initialState}`
  }

  /**
   * Generate initial state
   */
  private generateInitialState(contractName: string, functions: ContractFunction[]): string {
    const loadingStates = functions.map(f => `    ${f.name}: false`).join(',\n')
    const errorStates = functions.map(f => `    ${f.name}: null`).join(',\n')
    const transactionStates = functions
      .filter(f => f.isTransaction)
      .map(f => `    ${f.name}: 'idle' as TransactionStatus`).join(',\n')
    
    return `{
  data: null,
  loading: {
${loadingStates}
  },
  errors: {
${errorStates}
  },
  transactions: {
${transactionStates}
  },
  events: []
}`
  }

  /**
   * Generate context code
   */
  private generateContextCode(contractName: string): string {
    return `import React, { createContext, useContext, useReducer } from 'react'
import { ${contractName.toLowerCase()}Reducer, initial${contractName}State } from './${contractName.toLowerCase()}-reducer'

interface ${contractName}ContextType {
  state: ${contractName}State
  dispatch: React.Dispatch<${contractName}Action>
}

const ${contractName}Context = createContext<${contractName}ContextType | null>(null)

interface ${contractName}ProviderProps {
  children: React.ReactNode
}

export function ${contractName}Provider({ children }: ${contractName}ProviderProps) {
  const [state, dispatch] = useReducer(${contractName.toLowerCase()}Reducer, initial${contractName}State)
  
  return (
    <${contractName}Context.Provider value={{ state, dispatch }}>
      {children}
    </${contractName}Context.Provider>
  )
}

export function use${contractName}Context() {
  const context = useContext(${contractName}Context)
  if (!context) {
    throw new Error('use${contractName}Context must be used within ${contractName}Provider')
  }
  return context
}`
  }

  /**
   * Generate state hook code
   */
  private generateStateHookCode(contractName: string): string {
    return `import { useCallback } from 'react'
import { use${contractName}Context } from './${contractName.toLowerCase()}-context'

/**
 * Hook for managing ${contractName} contract state
 */
export function use${contractName}State() {
  const { state, dispatch } = use${contractName}Context()
  
  const setLoading = useCallback((functionName: string, loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { function: functionName, loading } })
  }, [dispatch])
  
  const setError = useCallback((functionName: string, error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { function: functionName, error } })
  }, [dispatch])
  
  const setTransactionStatus = useCallback((functionName: string, status: TransactionStatus) => {
    dispatch({ type: 'SET_TRANSACTION_STATUS', payload: { function: functionName, status } })
  }, [dispatch])
  
  const addEvent = useCallback((event: ContractEvent) => {
    dispatch({ type: 'ADD_EVENT', payload: event })
  }, [dispatch])
  
  const setData = useCallback((data: any) => {
    dispatch({ type: 'SET_DATA', payload: data })
  }, [dispatch])
  
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' })
  }, [dispatch])
  
  return {
    state,
    actions: {
      setLoading,
      setError,
      setTransactionStatus,
      addEvent,
      setData,
      resetState
    }
  }
}`
  }

  /**
   * Generate error types
   */
  private generateErrorTypes(contractName: string): string {
    return `// Error types for ${contractName} contract
export enum ${contractName}ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface ${contractName}Error {
  type: ${contractName}ErrorType
  message: string
  details?: any
  timestamp: Date
  functionName?: string
}

export class ${contractName}ErrorHandler {
  static createError(
    type: ${contractName}ErrorType,
    message: string,
    details?: any,
    functionName?: string
  ): ${contractName}Error {
    return {
      type,
      message,
      details,
      timestamp: new Date(),
      functionName
    }
  }
  
  static isRetryableError(error: ${contractName}Error): boolean {
    return error.type === ${contractName}ErrorType.NETWORK_ERROR
  }
  
  static getErrorMessage(error: ${contractName}Error): string {
    switch (error.type) {
      case ${contractName}ErrorType.NETWORK_ERROR:
        return 'Network connection failed. Please try again.'
      case ${contractName}ErrorType.TRANSACTION_FAILED:
        return 'Transaction failed. Please check your inputs and try again.'
      case ${contractName}ErrorType.INSUFFICIENT_BALANCE:
        return 'Insufficient balance to complete this transaction.'
      case ${contractName}ErrorType.UNAUTHORIZED:
        return 'You are not authorized to perform this action.'
      case ${contractName}ErrorType.CONTRACT_ERROR:
        return 'Smart contract error occurred.'
      case ${contractName}ErrorType.VALIDATION_ERROR:
        return 'Input validation failed.'
      default:
        return error.message || 'An unknown error occurred.'
    }
  }
}`
  }

  /**
   * Generate error boundary
   */
  private generateErrorBoundary(contractName: string): string {
    return `import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ${contractName}Error, ${contractName}ErrorHandler } from './${contractName.toLowerCase()}-errors'

interface ${contractName}ErrorBoundaryState {
  hasError: boolean
  error: ${contractName}Error | null
}

interface ${contractName}ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: ${contractName}Error) => ReactNode
  onError?: (error: ${contractName}Error) => void
}

export class ${contractName}ErrorBoundary extends Component<
  ${contractName}ErrorBoundaryProps,
  ${contractName}ErrorBoundaryState
> {
  constructor(props: ${contractName}ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ${contractName}ErrorBoundaryState {
    const contractError = ${contractName}ErrorHandler.createError(
      ${contractName}ErrorType.CONTRACT_ERROR,
      error.message,
      error
    )
    
    return {
      hasError: true,
      error: contractError
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const contractError = this.state.error
    if (contractError) {
      this.props.onError?.(contractError)
      console.error('${contractName} Error Boundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error)
      }
      
      return (
        <div className="error-boundary p-4 border border-red-300 rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {${contractName}ErrorHandler.getErrorMessage(this.state.error)}
          </p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}`
  }

  /**
   * Generate error display component
   */
  private generateErrorDisplay(contractName: string): string {
    return `import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ${contractName}Error, ${contractName}ErrorHandler } from './${contractName.toLowerCase()}-errors'

interface ${contractName}ErrorDisplayProps {
  error: ${contractName}Error
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ${contractName}ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className
}: ${contractName}ErrorDisplayProps) {
  const canRetry = ${contractName}ErrorHandler.isRetryableError(error)
  const errorMessage = ${contractName}ErrorHandler.getErrorMessage(error)
  
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex-1">
        <div className="mb-2">
          <strong>{error.functionName ? \`\${error.functionName}: \` : ''}</strong>
          {errorMessage}
        </div>
        
        {error.details && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm opacity-75">
              Technical details
            </summary>
            <pre className="mt-1 text-xs opacity-75 whitespace-pre-wrap">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2 mt-3">
          {canRetry && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-8"
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}`
  }

  /**
   * Generate loading states
   */
  private generateLoadingStates(contractName: string): string {
    return `import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ${contractName}LoadingProps {
  type?: 'spinner' | 'skeleton' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export function ${contractName}Loading({
  type = 'spinner',
  size = 'md',
  message,
  className
}: ${contractName}LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }
  
  if (type === 'skeleton') {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }
  
  if (type === 'pulse') {
    return (
      <div className={cn('animate-pulse bg-gray-200 rounded', className)}>
        <div className="h-20 w-full"></div>
      </div>
    )
  }
  
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}

// Specific loading states for different operations
export function ${contractName}TransactionLoading({ message }: { message?: string }) {
  return (
    <${contractName}Loading
      type="spinner"
      size="md"
      message={message || 'Processing transaction...'}
      className="py-8"
    />
  )
}

export function ${contractName}DataLoading({ message }: { message?: string }) {
  return (
    <${contractName}Loading
      type="skeleton"
      message={message || 'Loading data...'}
      className="py-4"
    />
  )
}`
  }

  // Utility methods
  private extractFunctionParameters(functionSignature: string): ContractParameter[] {
    // Simplified parameter extraction
    const paramMatch = functionSignature.match(/\(([^)]*)\)/)
    if (!paramMatch || !paramMatch[1].trim()) return []
    
    const params = paramMatch[1].split(',').map(param => {
      const parts = param.trim().split(':')
      return {
        name: parts[0]?.trim() || 'param',
        type: parts[1]?.trim() || 'AnyStruct'
      }
    })
    
    return params
  }

  private extractAccessModifier(functionSignature: string): string {
    const accessMatch = functionSignature.match(/access\(([\w\s,]+)\)/)
    return accessMatch ? accessMatch[1] : 'all'
  }

  private isTransactionFunction(name: string, code: string): boolean {
    // Functions that modify state are typically transactions
    const transactionKeywords = ['mint', 'transfer', 'burn', 'deposit', 'withdraw', 'create', 'destroy', 'update', 'set']
    return transactionKeywords.some(keyword => name.toLowerCase().includes(keyword))
  }

  private isScriptFunction(name: string, code: string): boolean {
    // Functions that only read state are typically scripts
    const scriptKeywords = ['get', 'read', 'view', 'check', 'balance', 'info', 'list']
    return scriptKeywords.some(keyword => name.toLowerCase().includes(keyword))
  }

  private parseEventParameters(params: string): ContractParameter[] {
    if (!params.trim()) return []
    
    return params.split(',').map(param => {
      const parts = param.trim().split(':')
      return {
        name: parts[0]?.trim() || 'param',
        type: parts[1]?.trim() || 'AnyStruct'
      }
    })
  }

  private extractEventDescription(eventName: string, code: string): string {
    // Look for comments above the event definition
    const eventRegex = new RegExp(`//.*\\n\\s*(?:access\\(all\\)\\s+)?event\\s+${eventName}`)
    const match = code.match(eventRegex)
    if (match) {
      const comment = match[0].match(/\/\/(.*)/)
      return comment ? comment[1].trim() : ''
    }
    return ''
  }

  private extractInterfaces(ast: ContractAST): any[] {
    return ast.interfaces || []
  }

  private extractTypes(ast: ContractAST): any[] {
    return [...(ast.structs || []), ...(ast.resources || [])]
  }

  private extractEvents(ast: ContractAST): ContractEvent[] {
    return ast.events || []
  }

  private extractResources(code: string): any[] {
    // Simplified resource extraction
    const resources: any[] = []
    const resourceRegex = /(?:access\([\w\s,]+\)\s+)?resource\s+(\w+)/g
    
    let match
    while ((match = resourceRegex.exec(code)) !== null) {
      resources.push({
        name: match[1],
        kind: 'resource'
      })
    }
    
    return resources
  }

  private extractStructs(code: string): any[] {
    // Simplified struct extraction
    const structs: any[] = []
    const structRegex = /(?:access\([\w\s,]+\)\s+)?struct\s+(\w+)/g
    
    let match
    while ((match = structRegex.exec(code)) !== null) {
      structs.push({
        name: match[1],
        kind: 'struct'
      })
    }
    
    return structs
  }

  private extractInterfaceDefinitions(code: string): any[] {
    // Simplified interface extraction
    const interfaces: any[] = []
    const interfaceRegex = /(?:access\([\w\s,]+\)\s+)?resource\s+interface\s+(\w+)/g
    
    let match
    while ((match = interfaceRegex.exec(code)) !== null) {
      interfaces.push({
        name: match[1],
        kind: 'interface'
      })
    }
    
    return interfaces
  }

  private mapCadenceTypeToTS(cadenceType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'string',
      'Int': 'number',
      'UInt64': 'number',
      'UFix64': 'number',
      'Fix64': 'number',
      'Bool': 'boolean',
      'Address': 'string',
      'Void': 'void',
      '[String]': 'string[]',
      '[UInt64]': 'number[]',
      '{String: String}': 'Record<string, string>',
      '{String: AnyStruct}': 'Record<string, any>',
      'AnyStruct': 'any',
      'AnyResource': 'any'
    }
    
    // Handle optional types
    if (cadenceType.endsWith('?')) {
      const baseType = cadenceType.slice(0, -1)
      return `${this.mapCadenceTypeToTS(baseType)} | null`
    }
    
    // Handle array types
    if (cadenceType.startsWith('[') && cadenceType.endsWith(']')) {
      const elementType = cadenceType.slice(1, -1)
      return `${this.mapCadenceTypeToTS(elementType)}[]`
    }
    
    return typeMap[cadenceType] || 'any'
  }

  private getEventListenerDependencies(): string[] {
    return ['@onflow/fcl', '@onflow/types']
  }

  private getStateManagementDependencies(): string[] {
    return ['react']
  }

  private getErrorHandlingDependencies(): string[] {
    return ['react', '@/components/ui/alert', '@/components/ui/button', 'lucide-react']
  }
}

// Supporting interfaces
export interface ContractInterfaces {
  contractName: string
  interfaces: string
  types: string
  events: string
  functions: string
}

export interface EventListenerSystem {
  listenerCode: string
  hookCode: string
  providerCode: string
  dependencies: string[]
}

export interface StateManagementSystem {
  stateTypes: string
  reducerCode: string
  contextCode: string
  hookCode: string
  dependencies: string[]
}

export interface ErrorHandlingSystem {
  errorTypes: string
  errorBoundary: string
  errorDisplay: string
  loadingStates: string
  dependencies: string[]
}

interface ContractAST {
  name: string
  functions: ContractFunction[]
  events: ContractEvent[]
  resources: any[]
  structs: any[]
  interfaces: any[]
}

interface ContractFunction {
  name: string
  returnType: string
  parameters: ContractParameter[]
  access: string
  isTransaction: boolean
  isScript: boolean
}

interface ContractEvent {
  name: string
  parameters: ContractParameter[]
  description: string
}

interface ContractParameter {
  name: string
  type: string
}