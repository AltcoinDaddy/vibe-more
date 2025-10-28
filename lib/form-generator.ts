import { ComponentSpecification, ContractIntegration } from './vibesdk'

/**
 * Form Generator for Contract Interactions
 * Creates form components that integrate with smart contract functions
 */
export class FormGenerator {
  /**
   * Generate a form component for contract interaction
   */
  generateContractForm(
    contractIntegration: ContractIntegration,
    functionName: string,
    formConfig?: FormConfig
  ): string {
    const config = { ...this.getDefaultConfig(), ...formConfig }
    const formName = `${contractIntegration.contractName}${this.toPascalCase(functionName)}Form`
    
    const imports = this.generateFormImports()
    const interfaces = this.generateFormInterfaces(contractIntegration, functionName, config)
    const component = this.generateFormComponent(formName, contractIntegration, functionName, config)
    
    return `${imports}\n\n${interfaces}\n\n${component}`
  }

  /**
   * Generate multiple forms for all contract functions
   */
  generateAllContractForms(integration: ContractIntegration): Record<string, string> {
    const forms: Record<string, string> = {}
    
    integration.functions.forEach(functionName => {
      const formCode = this.generateContractForm(integration, functionName)
      forms[`${functionName}-form`] = formCode
    })
    
    return forms
  }

  /**
   * Generate a generic form component
   */
  generateGenericForm(spec: ComponentSpecification): string {
    const imports = this.generateFormImports()
    const interfaces = this.generateGenericFormInterfaces(spec)
    const component = this.generateGenericFormComponent(spec)
    
    return `${imports}\n\n${interfaces}\n\n${component}`
  }

  /**
   * Generate form imports
   */
  private generateFormImports(): string {
    return `'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'`
  }

  /**
   * Generate form interfaces for contract interaction
   */
  private generateFormInterfaces(
    integration: ContractIntegration,
    functionName: string,
    config: FormConfig
  ): string {
    const formFields = this.inferFormFields(functionName, config)
    const schema = this.generateZodSchema(formFields)
    
    return `${schema}

type FormData = z.infer<typeof formSchema>

interface ${integration.contractName}${this.toPascalCase(functionName)}FormProps {
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}`
  }

  /**
   * Generate generic form interfaces
   */
  private generateGenericFormInterfaces(spec: ComponentSpecification): string {
    const schema = this.generateZodSchemaFromSpec(spec)
    
    return `${schema}

type FormData = z.infer<typeof formSchema>

interface ${spec.name}Props {
  onSubmit?: (data: FormData) => void | Promise<void>
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  defaultValues?: Partial<FormData>
}`
  }

  /**
   * Generate form component for contract interaction
   */
  private generateFormComponent(
    formName: string,
    integration: ContractIntegration,
    functionName: string,
    config: FormConfig
  ): string {
    const hookName = `use${integration.contractName}`
    const methodName = this.toCamelCase(functionName)
    const formFields = this.inferFormFields(functionName, config)
    const fieldComponents = this.generateFieldComponents(formFields)
    
    return `export default function ${formName}({
  onSuccess,
  onError,
  className,
  disabled = false
}: ${integration.contractName}${this.toPascalCase(functionName)}FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const contract = ${hookName}()
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  })

  const onSubmit = async (data: FormData) => {
    if (disabled || !contract.isReady) return
    
    try {
      setIsSubmitting(true)
      setSuccess(false)
      
      const result = await contract.${methodName}(${this.generateMethodArgs(formFields)})
      
      setSuccess(true)
      form.reset()
      onSuccess?.(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
      onError?.(errorMessage)
      console.error('Form submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Clear success state when form changes
  React.useEffect(() => {
    const subscription = form.watch(() => setSuccess(false))
    return () => subscription.unsubscribe()
  }, [form])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>${this.toTitleCase(functionName)}</CardTitle>
        <CardDescription>
          ${this.generateFormDescription(functionName)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            ${fieldComponents}
            
            {contract.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {contract.error}
                </AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Transaction completed successfully!
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={disabled || isSubmitting || !contract.isReady}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Processing...' : \`\${functionName.charAt(0).toUpperCase() + functionName.slice(1)}\`}
              </Button>
              
              {contract.error && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={contract.clearError}
                >
                  Clear Error
                </Button>
              )}
            </div>
            
            {!contract.isReady && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet to continue.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}`
  }

  /**
   * Generate generic form component
   */
  private generateGenericFormComponent(spec: ComponentSpecification): string {
    const fieldComponents = this.generateFieldComponentsFromSpec(spec)
    
    return `export default function ${spec.name}({
  onSubmit,
  onSuccess,
  onError,
  className,
  disabled = false,
  defaultValues
}: ${spec.name}Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {}
  })

  const handleSubmit = async (data: FormData) => {
    if (disabled) return
    
    try {
      setIsSubmitting(true)
      setSuccess(false)
      
      if (onSubmit) {
        await onSubmit(data)
      }
      
      setSuccess(true)
      onSuccess?.(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed'
      onError?.(errorMessage)
      console.error('Form submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>${spec.name}</CardTitle>
        <CardDescription>
          Fill out the form below to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            ${fieldComponents}
            
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Form submitted successfully!
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              disabled={disabled || isSubmitting}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}`
  }

  /**
   * Generate Zod schema from inferred fields
   */
  private generateZodSchema(fields: FormField[]): string {
    const schemaFields = fields.map(field => {
      let zodType = this.getZodType(field)
      
      if (!field.required) {
        zodType += '.optional()'
      }
      
      if (field.validation) {
        zodType += field.validation
      }
      
      return `  ${field.name}: ${zodType}`
    }).join(',\n')

    return `const formSchema = z.object({
${schemaFields}
})`
  }

  /**
   * Generate Zod schema from component specification
   */
  private generateZodSchemaFromSpec(spec: ComponentSpecification): string {
    const schemaFields = spec.props
      .filter(prop => prop.name !== 'onSubmit' && prop.name !== 'className')
      .map(prop => {
        let zodType = this.mapTypeToZod(prop.type)
        
        if (!prop.required) {
          zodType += '.optional()'
        }
        
        return `  ${prop.name}: ${zodType}`
      }).join(',\n')

    return `const formSchema = z.object({
${schemaFields}
})`
  }

  /**
   * Generate field components
   */
  private generateFieldComponents(fields: FormField[]): string {
    return fields.map(field => this.generateSingleFieldComponent(field)).join('\n\n')
  }

  /**
   * Generate field components from spec
   */
  private generateFieldComponentsFromSpec(spec: ComponentSpecification): string {
    const fields = spec.props
      .filter(prop => prop.name !== 'onSubmit' && prop.name !== 'className')
      .map(prop => ({
        name: prop.name,
        type: this.mapPropTypeToFieldType(prop.type),
        label: this.toTitleCase(prop.name),
        required: prop.required,
        description: prop.description
      }))
    
    return fields.map(field => this.generateSingleFieldComponent(field)).join('\n\n')
  }

  /**
   * Generate a single field component
   */
  private generateSingleFieldComponent(field: FormField): string {
    const fieldComponent = this.getFieldComponent(field)
    
    return `            <FormField
              control={form.control}
              name="${field.name}"
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>${field.label}${field.required ? ' *' : ''}</FormLabel>
                  <FormControl>
                    ${fieldComponent}
                  </FormControl>
                  ${field.description ? `<FormDescription>${field.description}</FormDescription>` : ''}
                  <FormMessage />
                </FormItem>
              )}
            />`
  }

  /**
   * Get appropriate field component based on type
   */
  private getFieldComponent(field: FormField): string {
    switch (field.type) {
      case 'text':
      case 'string':
        return `<Input placeholder="Enter ${field.label.toLowerCase()}" {...formField} />`
      
      case 'number':
        return `<Input type="number" placeholder="Enter ${field.label.toLowerCase()}" {...formField} />`
      
      case 'email':
        return `<Input type="email" placeholder="Enter email address" {...formField} />`
      
      case 'password':
        return `<Input type="password" placeholder="Enter password" {...formField} />`
      
      case 'textarea':
        return `<Textarea placeholder="Enter ${field.label.toLowerCase()}" {...formField} />`
      
      case 'select':
        return `<Select onValueChange={formField.onChange} defaultValue={formField.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ${field.label.toLowerCase()}" />
                      </SelectTrigger>
                      <SelectContent>
                        ${field.options?.map(option => 
                          `<SelectItem value="${option.value}">${option.label}</SelectItem>`
                        ).join('\n                        ') || ''}
                      </SelectContent>
                    </Select>`
      
      case 'checkbox':
        return `<div className="flex items-center space-x-2">
                      <Checkbox 
                        id={formField.name}
                        checked={formField.value}
                        onCheckedChange={formField.onChange}
                      />
                      <Label htmlFor={formField.name}>${field.label}</Label>
                    </div>`
      
      default:
        return `<Input placeholder="Enter ${field.label.toLowerCase()}" {...formField} />`
    }
  }

  /**
   * Get Zod type for field
   */
  private getZodType(field: FormField): string {
    switch (field.type) {
      case 'string':
      case 'text':
      case 'email':
      case 'password':
      case 'textarea':
        return 'z.string().min(1, "This field is required")'
      
      case 'number':
        return 'z.number().min(0, "Must be a positive number")'
      
      case 'boolean':
      case 'checkbox':
        return 'z.boolean()'
      
      case 'select':
        return 'z.string().min(1, "Please select an option")'
      
      case 'array':
        return 'z.array(z.string())'
      
      default:
        return 'z.string()'
    }
  }

  /**
   * Map prop type to Zod type
   */
  private mapTypeToZod(propType: string): string {
    if (propType.includes('string')) return 'z.string().min(1, "This field is required")'
    if (propType.includes('number')) return 'z.number().min(0, "Must be a positive number")'
    if (propType.includes('boolean')) return 'z.boolean()'
    if (propType.includes('[]')) return 'z.array(z.string())'
    return 'z.string()'
  }

  /**
   * Map prop type to field type
   */
  private mapPropTypeToFieldType(propType: string): string {
    if (propType.includes('string')) return 'text'
    if (propType.includes('number')) return 'number'
    if (propType.includes('boolean')) return 'checkbox'
    if (propType.includes('[]')) return 'select'
    return 'text'
  }

  /**
   * Infer form fields from function name and config
   */
  private inferFormFields(functionName: string, config: FormConfig): FormField[] {
    const lowerName = functionName.toLowerCase()
    
    // Common patterns for different function types
    if (lowerName.includes('mint')) {
      return [
        { name: 'recipient', type: 'text', label: 'Recipient Address', required: true },
        { name: 'amount', type: 'number', label: 'Amount', required: true },
        { name: 'metadata', type: 'textarea', label: 'Metadata', required: false }
      ]
    }
    
    if (lowerName.includes('transfer')) {
      return [
        { name: 'to', type: 'text', label: 'To Address', required: true },
        { name: 'amount', type: 'number', label: 'Amount', required: true }
      ]
    }
    
    if (lowerName.includes('approve')) {
      return [
        { name: 'spender', type: 'text', label: 'Spender Address', required: true },
        { name: 'amount', type: 'number', label: 'Amount', required: true }
      ]
    }
    
    if (lowerName.includes('stake')) {
      return [
        { name: 'amount', type: 'number', label: 'Stake Amount', required: true },
        { name: 'duration', type: 'number', label: 'Duration (days)', required: false }
      ]
    }
    
    if (lowerName.includes('vote')) {
      return [
        { name: 'proposalId', type: 'number', label: 'Proposal ID', required: true },
        { name: 'support', type: 'select', label: 'Vote', required: true, options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'abstain', label: 'Abstain' }
        ]}
      ]
    }
    
    // Default fields
    return [
      { name: 'value', type: 'text', label: 'Value', required: true }
    ]
  }

  /**
   * Generate method arguments from form fields
   */
  private generateMethodArgs(fields: FormField[]): string {
    return fields.map(field => `data.${field.name}`).join(', ')
  }

  /**
   * Generate form description
   */
  private generateFormDescription(functionName: string): string {
    const descriptions: Record<string, string> = {
      mint: 'Mint new tokens to the specified recipient',
      transfer: 'Transfer tokens to another address',
      approve: 'Approve another address to spend tokens',
      stake: 'Stake tokens to earn rewards',
      unstake: 'Unstake tokens and claim rewards',
      vote: 'Cast your vote on a proposal',
      propose: 'Create a new proposal',
      claim: 'Claim your rewards',
      deposit: 'Deposit tokens into the contract',
      withdraw: 'Withdraw tokens from the contract'
    }
    
    const lowerName = functionName.toLowerCase()
    for (const [key, description] of Object.entries(descriptions)) {
      if (lowerName.includes(key)) {
        return description
      }
    }
    
    return `Execute the ${functionName} function on the smart contract`
  }

  /**
   * Get default form configuration
   */
  private getDefaultConfig(): FormConfig {
    return {
      includeValidation: true,
      includeErrorHandling: true,
      includeSuccessState: true,
      includeLoadingState: true
    }
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

  /**
   * Utility: Convert to Title Case
   */
  private toTitleCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, str => str.toUpperCase())
  }
}

// Supporting interfaces
interface FormConfig {
  includeValidation?: boolean
  includeErrorHandling?: boolean
  includeSuccessState?: boolean
  includeLoadingState?: boolean
}

interface FormField {
  name: string
  type: string
  label: string
  required: boolean
  description?: string
  validation?: string
  options?: { value: string; label: string }[]
}