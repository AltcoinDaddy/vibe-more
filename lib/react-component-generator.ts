import { ComponentSpecification, GeneratedComponent, ContractIntegration } from './vibesdk'

/**
 * React component generator for full-stack dApp development
 * Creates React components with Flow blockchain integration
 */
export class ReactComponentGenerator {
  
  /**
   * Generate a React component with contract integration
   */
  async generateComponent(
    spec: ComponentSpecification,
    contractIntegrations: ContractIntegration[]
  ): Promise<GeneratedComponent> {
    const componentCode = this.buildComponentCode(spec, contractIntegrations)
    const dependencies = this.extractDependencies(spec, contractIntegrations)

    return {
      filename: `${this.kebabCase(spec.name)}.tsx`,
      code: componentCode,
      componentType: this.inferComponentType(spec),
      dependencies,
      contractIntegrations
    }
  }

  /**
   * Build the complete React component code
   */
  private buildComponentCode(
    spec: ComponentSpecification,
    contractIntegrations: ContractIntegration[]
  ): string {
    const imports = this.generateImports(spec, contractIntegrations)
    const interfaces = this.generateInterfaces(spec)
    const hooks = this.generateHooks(contractIntegrations)
    const component = this.generateComponentBody(spec, contractIntegrations)

    return `${imports}

${interfaces}

${component}`
  }

  /**
   * Generate import statements
   */
  private generateImports(spec: ComponentSpecification, contractIntegrations: ContractIntegration[]): string {
    const imports = [
      `'use client'`,
      ``,
      `import React, { useState, useEffect } from 'react'`,
      `import { Button } from '@/components/ui/button'`,
      `import { Input } from '@/components/ui/input'`,
      `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'`,
      `import { Alert, AlertDescription } from '@/components/ui/alert'`,
      `import { Loader2 } from 'lucide-react'`
    ]

    // Add form imports if it's a form component
    if (spec.type === 'form') {
      imports.push(
        `import { useForm } from 'react-hook-form'`,
        `import { zodResolver } from '@hookform/resolvers/zod'`,
        `import { z } from 'zod'`,
        `import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'`
      )
    }

    // Add contract-specific hooks
    contractIntegrations.forEach(integration => {
      imports.push(`import { use${integration.contractName} } from '@/hooks/use-${this.kebabCase(integration.contractName)}'`)
    })

    return imports.join('\n')
  }

  /**
   * Generate TypeScript interfaces
   */
  private generateInterfaces(spec: ComponentSpecification): string {
    const propsInterface = `interface ${spec.name}Props {
  ${spec.props.map(prop => 
    `${prop.name}${prop.required ? '' : '?'}: ${prop.type}${prop.description ? ` // ${prop.description}` : ''}`
  ).join('\n  ')}
}`

    if (spec.type === 'form') {
      const formSchema = `const formSchema = z.object({
  ${spec.contractFunctions.map(func => 
    `${func}: z.string().min(1, '${func} is required')`
  ).join(',\n  ')}
})

type FormData = z.infer<typeof formSchema>`

      return `${propsInterface}

${formSchema}`
    }

    return propsInterface
  }

  /**
   * Generate React hooks usage
   */
  private generateHooks(contractIntegrations: ContractIntegration[]): string {
    return contractIntegrations.map(integration => 
      `const { ${integration.functions.join(', ')}, isLoading: ${integration.contractName.toLowerCase()}Loading, error: ${integration.contractName.toLowerCase()}Error } = use${integration.contractName}()`
    ).join('\n  ')
  }

  /**
   * Generate the main component body
   */
  private generateComponentBody(spec: ComponentSpecification, contractIntegrations: ContractIntegration[]): string {
    const componentName = spec.name
    const hooks = this.generateHooks(contractIntegrations)
    
    if (spec.type === 'form') {
      return this.generateFormComponent(componentName, spec, contractIntegrations, hooks)
    } else if (spec.type === 'display') {
      return this.generateDisplayComponent(componentName, spec, contractIntegrations, hooks)
    } else if (spec.type === 'interaction') {
      return this.generateInteractionComponent(componentName, spec, contractIntegrations, hooks)
    } else {
      return this.generateGenericComponent(componentName, spec, contractIntegrations, hooks)
    }
  }

  /**
   * Generate form component
   */
  private generateFormComponent(
    componentName: string,
    spec: ComponentSpecification,
    contractIntegrations: ContractIntegration[],
    hooks: string
  ): string {
    return `export function ${componentName}({ ${spec.props.map(p => p.name).join(', ')} }: ${componentName}Props) {
  ${hooks}
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ${spec.contractFunctions.map(func => `${func}: ''`).join(',\n      ')}
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSuccess(false)
    
    try {
      ${contractIntegrations.map(integration => 
        integration.functions.map(func => 
          `await ${func}(data.${func})`
        ).join('\n      ')
      ).join('\n      ')}
      
      setSuccess(true)
      form.reset()
    } catch (error) {
      console.error('Transaction failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>${componentName.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
        <CardDescription>
          Interact with the smart contract
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            ${spec.contractFunctions.map(func => `
            <FormField
              control={form.control}
              name="${func}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>${func.charAt(0).toUpperCase() + func.slice(1)}</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ${func}" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />`).join('')}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || ${contractIntegrations.map(i => `${i.contractName.toLowerCase()}Loading`).join(' || ')}}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Transaction
            </Button>
          </form>
        </Form>

        {success && (
          <Alert className="mt-4">
            <AlertDescription>
              Transaction completed successfully!
            </AlertDescription>
          </Alert>
        )}

        ${contractIntegrations.map(integration => `
        {${integration.contractName.toLowerCase()}Error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              {${integration.contractName.toLowerCase()}Error}
            </AlertDescription>
          </Alert>
        )}`).join('')}
      </CardContent>
    </Card>
  )
}`
  }

  /**
   * Generate display component
   */
  private generateDisplayComponent(
    componentName: string,
    spec: ComponentSpecification,
    contractIntegrations: ContractIntegration[],
    hooks: string
  ): string {
    return `export function ${componentName}({ ${spec.props.map(p => p.name).join(', ')} }: ${componentName}Props) {
  ${hooks}
  
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from contract
        ${contractIntegrations.map(integration => 
          integration.functions.map(func => 
            `const ${func}Result = await ${func}()`
          ).join('\n        ')
        ).join('\n        ')}
        
        setData([${contractIntegrations.map(i => i.functions.map(f => `${f}Result`).join(', ')).join(', ')}])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [${contractIntegrations.map(i => i.functions.join(', ')).join(', ')}])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>${componentName.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
        <CardDescription>
          Data from smart contract
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-muted-foreground">No data available</p>
          ) : (
            data.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <pre className="text-sm">{JSON.stringify(item, null, 2)}</pre>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}`
  }

  /**
   * Generate interaction component
   */
  private generateInteractionComponent(
    componentName: string,
    spec: ComponentSpecification,
    contractIntegrations: ContractIntegration[],
    hooks: string
  ): string {
    return `export function ${componentName}({ ${spec.props.map(p => p.name).join(', ')} }: ${componentName}Props) {
  ${hooks}
  
  const [selectedFunction, setSelectedFunction] = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')
  const [result, setResult] = useState<any>(null)

  const handleExecute = async () => {
    if (!selectedFunction || !inputValue) return

    try {
      let result
      switch (selectedFunction) {
        ${contractIntegrations.map(integration => 
          integration.functions.map(func => `
        case '${func}':
          result = await ${func}(inputValue)
          break`).join('')
        ).join('')}
        default:
          throw new Error('Unknown function')
      }
      
      setResult(result)
    } catch (error) {
      console.error('Execution failed:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const availableFunctions = [${contractIntegrations.map(i => i.functions.map(f => `'${f}'`).join(', ')).join(', ')}]

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>${componentName.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
        <CardDescription>
          Execute smart contract functions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Function</label>
          <select 
            value={selectedFunction}
            onChange={(e) => setSelectedFunction(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md"
          >
            <option value="">Select a function</option>
            {availableFunctions.map(func => (
              <option key={func} value={func}>{func}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Input</label>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter function parameter"
            className="mt-1"
          />
        </div>

        <Button 
          onClick={handleExecute}
          disabled={!selectedFunction || !inputValue || ${contractIntegrations.map(i => `${i.contractName.toLowerCase()}Loading`).join(' || ')}}
          className="w-full"
        >
          {${contractIntegrations.map(i => `${i.contractName.toLowerCase()}Loading`).join(' || ') || 'false'} && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Execute
        </Button>

        {result && (
          <div className="mt-4 p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-sm bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        ${contractIntegrations.map(integration => `
        {${integration.contractName.toLowerCase()}Error && (
          <Alert variant="destructive">
            <AlertDescription>
              {${integration.contractName.toLowerCase()}Error}
            </AlertDescription>
          </Alert>
        )}`).join('')}
      </CardContent>
    </Card>
  )
}`
  }

  /**
   * Generate generic component
   */
  private generateGenericComponent(
    componentName: string,
    spec: ComponentSpecification,
    contractIntegrations: ContractIntegration[],
    hooks: string
  ): string {
    return `export function ${componentName}({ ${spec.props.map(p => p.name).join(', ')} }: ${componentName}Props) {
  ${hooks}

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">${componentName.replace(/([A-Z])/g, ' $1').trim()}</h2>
      
      <div className="space-y-4">
        ${contractIntegrations.map(integration => `
        <Card>
          <CardHeader>
            <CardTitle>${integration.contractName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              ${integration.functions.map(func => `
              <Button 
                onClick={() => ${func}()}
                disabled={${integration.contractName.toLowerCase()}Loading}
                variant="outline"
              >
                {${integration.contractName.toLowerCase()}Loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ${func.charAt(0).toUpperCase() + func.slice(1)}
              </Button>`).join('')}
            </div>
            
            {${integration.contractName.toLowerCase()}Error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  {${integration.contractName.toLowerCase()}Error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>`).join('')}
      </div>
    </div>
  )
}`
  }

  /**
   * Extract dependencies from component specification
   */
  private extractDependencies(spec: ComponentSpecification, contractIntegrations: ContractIntegration[]): string[] {
    const dependencies = [
      'react',
      '@/components/ui/button',
      '@/components/ui/input',
      '@/components/ui/card',
      '@/components/ui/alert',
      'lucide-react'
    ]

    if (spec.type === 'form') {
      dependencies.push(
        'react-hook-form',
        '@hookform/resolvers/zod',
        'zod',
        '@/components/ui/form'
      )
    }

    // Add contract hook dependencies
    contractIntegrations.forEach(integration => {
      dependencies.push(`@/hooks/use-${this.kebabCase(integration.contractName)}`)
    })

    return dependencies
  }

  /**
   * Infer component type from specification
   */
  private inferComponentType(spec: ComponentSpecification): 'page' | 'component' | 'layout' {
    if (spec.name.toLowerCase().includes('page') || spec.name.toLowerCase().includes('screen')) {
      return 'page'
    }
    if (spec.name.toLowerCase().includes('layout') || spec.name.toLowerCase().includes('wrapper')) {
      return 'layout'
    }
    return 'component'
  }

  /**
   * Convert string to kebab-case
   */
  private kebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }
}