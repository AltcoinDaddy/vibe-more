import { NextResponse } from "next/server"
import { ReactComponentGenerator } from "@/lib/react-component-generator"
import { z } from "zod"

// Request validation schema
const ComponentRequestSchema = z.object({
  name: z.string().min(1, "Component name is required"),
  type: z.enum(['form', 'display', 'interaction', 'navigation']).default('display'),
  description: z.string().optional(),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().default(false),
    description: z.string().optional()
  })).default([]),
  styling: z.object({
    framework: z.enum(['tailwind', 'css']).default('tailwind'),
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    responsive: z.boolean().default(true),
    accessibility: z.boolean().default(true),
    customClasses: z.string().optional()
  }).default({}),
  contractFunctions: z.array(z.string()).default([]),
  contractIntegrations: z.array(z.object({
    contractName: z.string(),
    functions: z.array(z.string()),
    events: z.array(z.string()),
    integrationCode: z.string().optional()
  })).default([]),
  features: z.object({
    formValidation: z.boolean().default(false),
    errorHandling: z.boolean().default(true),
    loadingStates: z.boolean().default(true),
    typescript: z.boolean().default(true),
    testGeneration: z.boolean().default(false)
  }).default({})
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate request
    const validationResult = ComponentRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid request format",
        details: validationResult.error.errors,
        type: 'validation_error'
      }, { status: 400 })
    }

    const request = validationResult.data

    // Create component generator
    const generator = new ReactComponentGenerator()

    // Generate component specification
    const componentSpec = {
      name: request.name,
      type: request.type,
      props: request.props,
      styling: request.styling,
      contractFunctions: request.contractFunctions
    }

    // Generate the component
    const generatedComponent = await generator.generateComponent(
      componentSpec,
      request.contractIntegrations
    )

    // Generate additional files if requested
    const additionalFiles = []

    // Generate test file if requested
    if (request.features.testGeneration) {
      const testCode = generateComponentTest(request.name, componentSpec)
      additionalFiles.push({
        filename: `${request.name}.test.tsx`,
        code: testCode,
        type: 'test'
      })
    }

    // Generate story file for Storybook if it's a display component
    if (request.type === 'display') {
      const storyCode = generateComponentStory(request.name, componentSpec)
      additionalFiles.push({
        filename: `${request.name}.stories.tsx`,
        code: storyCode,
        type: 'story'
      })
    }

    return NextResponse.json({
      success: true,
      component: generatedComponent,
      additionalFiles,
      metadata: {
        generatedAt: new Date().toISOString(),
        componentName: request.name,
        componentType: request.type,
        hasContractIntegration: request.contractIntegrations.length > 0,
        features: request.features,
        dependencies: generatedComponent.dependencies
      },
      usage: {
        import: `import { ${request.name} } from '@/components/${generatedComponent.filename.replace('.tsx', '')}'`,
        example: generateUsageExample(request.name, request.props)
      }
    })

  } catch (error) {
    console.error("[API] Component generation error:", error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      type: 'generation_error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint for component templates and examples
export async function GET(req: Request) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const type = url.searchParams.get('type')

  try {
    switch (action) {
      case 'templates':
        return NextResponse.json({
          templates: getComponentTemplates(type as any)
        })

      case 'examples':
        return NextResponse.json({
          examples: getComponentExamples(type as any)
        })

      default:
        return NextResponse.json({
          error: "Invalid action parameter",
          availableActions: ['templates', 'examples']
        }, { status: 400 })
    }
  } catch (error) {
    console.error("[API] GET request error:", error)
    return NextResponse.json({
      error: "Failed to process request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Helper functions
function generateComponentTest(componentName: string, spec: any): string {
  return `import { render, screen } from '@testing-library/react'
import { ${componentName} } from './${componentName}'

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />)
    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument()
  })

  ${spec.props.map((prop: any) => `
  it('handles ${prop.name} prop correctly', () => {
    const test${prop.name} = ${prop.type === 'string' ? '"test value"' : 'true'}
    render(<${componentName} ${prop.name}={test${prop.name}} />)
    // Add specific assertions based on prop behavior
  })`).join('')}

  ${spec.contractFunctions.length > 0 ? `
  it('handles contract interactions', async () => {
    // Mock contract functions
    const mockContract = {
      ${spec.contractFunctions.map((fn: string) => `${fn}: jest.fn()`).join(',\n      ')}
    }
    
    render(<${componentName} />)
    // Add contract interaction tests
  })` : ''}
})`
}

function generateComponentStory(componentName: string, spec: any): string {
  return `import type { Meta, StoryObj } from '@storybook/react'
import { ${componentName} } from './${componentName}'

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ${spec.props.map((prop: any) => `
    ${prop.name}: {
      description: '${prop.description || `${prop.name} prop`}',
      control: { type: '${getControlType(prop.type)}' }
    }`).join(',')}
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    ${spec.props.map((prop: any) => `${prop.name}: ${getDefaultValue(prop.type)}`).join(',\n    ')}
  },
}

export const Interactive: Story = {
  args: {
    ...Default.args,
    // Add interactive props
  },
}`
}

function generateUsageExample(componentName: string, props: any[]): string {
  const propsString = props.length > 0 
    ? props.map(prop => `${prop.name}={${getDefaultValue(prop.type)}}`).join(' ')
    : ''
  
  return `<${componentName}${propsString ? ' ' + propsString : ''} />`
}

function getControlType(type: string): string {
  switch (type) {
    case 'string': return 'text'
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    case 'array': return 'object'
    default: return 'text'
  }
}

function getDefaultValue(type: string): string {
  switch (type) {
    case 'string': return '"Example text"'
    case 'number': return '42'
    case 'boolean': return 'true'
    case 'array': return '[]'
    default: return '""'
  }
}

function getComponentTemplates(type?: string) {
  const allTemplates = {
    form: [
      {
        name: 'ContactForm',
        description: 'Basic contact form with validation',
        props: ['onSubmit', 'loading'],
        features: ['validation', 'error-handling']
      },
      {
        name: 'NFTMintForm',
        description: 'Form for minting NFTs with metadata',
        props: ['onMint', 'contractAddress'],
        features: ['contract-integration', 'file-upload']
      }
    ],
    display: [
      {
        name: 'NFTCard',
        description: 'Card component for displaying NFT information',
        props: ['nft', 'onClick'],
        features: ['responsive', 'hover-effects']
      },
      {
        name: 'TokenBalance',
        description: 'Display token balance with formatting',
        props: ['balance', 'symbol'],
        features: ['number-formatting', 'loading-state']
      }
    ],
    interaction: [
      {
        name: 'WalletConnector',
        description: 'Button for connecting Flow wallet',
        props: ['onConnect', 'onDisconnect'],
        features: ['wallet-integration', 'status-display']
      },
      {
        name: 'TransactionButton',
        description: 'Button that triggers blockchain transactions',
        props: ['transaction', 'onSuccess'],
        features: ['loading-states', 'error-handling']
      }
    ],
    navigation: [
      {
        name: 'Breadcrumb',
        description: 'Navigation breadcrumb component',
        props: ['items', 'separator'],
        features: ['responsive', 'accessibility']
      },
      {
        name: 'TabNavigation',
        description: 'Tab-based navigation component',
        props: ['tabs', 'activeTab'],
        features: ['keyboard-navigation', 'animations']
      }
    ]
  }

  return type ? allTemplates[type as keyof typeof allTemplates] || [] : allTemplates
}

function getComponentExamples(type?: string) {
  const examples = {
    form: {
      basic: `<ContactForm onSubmit={handleSubmit} loading={isSubmitting} />`,
      advanced: `<NFTMintForm 
  onMint={handleMint} 
  contractAddress="0x123..." 
  metadata={{ name: "My NFT", description: "..." }} 
/>`
    },
    display: {
      basic: `<NFTCard nft={nftData} onClick={handleClick} />`,
      advanced: `<TokenBalance 
  balance={userBalance} 
  symbol="FLOW" 
  showUSD={true} 
  loading={isLoading} 
/>`
    },
    interaction: {
      basic: `<WalletConnector onConnect={handleConnect} />`,
      advanced: `<TransactionButton 
  transaction={mintTransaction} 
  onSuccess={handleSuccess} 
  onError={handleError} 
/>`
    },
    navigation: {
      basic: `<Breadcrumb items={breadcrumbItems} />`,
      advanced: `<TabNavigation 
  tabs={navigationTabs} 
  activeTab={currentTab} 
  onChange={handleTabChange} 
/>`
    }
  }

  return type ? examples[type as keyof typeof examples] || {} : examples
}