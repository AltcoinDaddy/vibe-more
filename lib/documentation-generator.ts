import { GeneratedContract, GeneratedComponent, GeneratedAPIRoute, GeneratedConfig, FullStackProjectRequest } from './vibesdk'

/**
 * Documentation generation options
 */
export interface DocumentationOptions {
  projectName: string
  description: string
  author?: string
  version?: string
  includeSetupInstructions: boolean
  includeAPIDocumentation: boolean
  includeComponentExamples: boolean
  includeDeploymentGuide: boolean
  includeTroubleshooting: boolean
}

/**
 * Generated documentation structure
 */
export interface GeneratedDocumentation {
  readme: string
  apiDocs: string
  componentDocs: string
  deploymentGuide: string
  troubleshooting: string
  changelog: string
}

/**
 * Project metadata for documentation
 */
export interface ProjectMetadata {
  name: string
  description: string
  version: string
  author: string
  license: string
  repository?: string
  homepage?: string
  keywords: string[]
  dependencies: string[]
  devDependencies: string[]
}

/**
 * Comprehensive project documentation generator
 * Creates README, API docs, component guides, and deployment instructions
 */
export class DocumentationGenerator {
  
  /**
   * Generate complete documentation for a full-stack project
   */
  async generateProjectDocumentation(
    request: FullStackProjectRequest,
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[],
    configs: GeneratedConfig[],
    options: DocumentationOptions
  ): Promise<GeneratedDocumentation> {
    
    const metadata = this.extractProjectMetadata(request, contracts, components, apiRoutes, configs)
    
    const readme = await this.generateREADME(metadata, contracts, components, apiRoutes, options)
    const apiDocs = await this.generateAPIDocumentation(apiRoutes, contracts, options)
    const componentDocs = await this.generateComponentDocumentation(components, contracts, options)
    const deploymentGuide = await this.generateDeploymentGuide(metadata, contracts, configs, options)
    const troubleshooting = await this.generateTroubleshootingGuide(metadata, contracts, components, options)
    const changelog = await this.generateChangelog(metadata, options)

    return {
      readme,
      apiDocs,
      componentDocs,
      deploymentGuide,
      troubleshooting,
      changelog
    }
  }  /**

   * Generate comprehensive README.md file
   */
  private async generateREADME(
    metadata: ProjectMetadata,
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[],
    options: DocumentationOptions
  ): Promise<string> {
    
    const sections: string[] = []

    // Header section
    sections.push(this.generateREADMEHeader(metadata))

    // Table of contents
    sections.push(this.generateTableOfContents(options))

    // Overview section
    sections.push(this.generateOverviewSection(metadata, contracts, components, apiRoutes))

    // Features section
    sections.push(this.generateFeaturesSection(contracts, components, apiRoutes))

    // Prerequisites section
    sections.push(this.generatePrerequisitesSection(metadata))

    // Installation section
    if (options.includeSetupInstructions) {
      sections.push(this.generateInstallationSection(metadata))
    }

    // Configuration section
    sections.push(this.generateConfigurationSection(contracts, metadata))

    // Usage section
    sections.push(this.generateUsageSection(contracts, components, apiRoutes))

    // API Reference section
    if (options.includeAPIDocumentation && apiRoutes.length > 0) {
      sections.push(this.generateAPIReferenceSection(apiRoutes))
    }

    // Component Documentation section
    if (options.includeComponentExamples && components.length > 0) {
      sections.push(this.generateComponentReferenceSection(components))
    }

    // Smart Contracts section
    if (contracts.length > 0) {
      sections.push(this.generateSmartContractsSection(contracts))
    }

    // Deployment section
    if (options.includeDeploymentGuide) {
      sections.push(this.generateDeploymentSection(metadata))
    }

    // Development section
    sections.push(this.generateDevelopmentSection(metadata))

    // Testing section
    sections.push(this.generateTestingSection(metadata))

    // Contributing section
    sections.push(this.generateContributingSection(metadata))

    // License section
    sections.push(this.generateLicenseSection(metadata))

    return sections.join('\n\n')
  } 
 /**
   * Generate README header with badges and description
   */
  private generateREADMEHeader(metadata: ProjectMetadata): string {
    return `# ${metadata.name}

${metadata.description}

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Flow](https://img.shields.io/badge/Flow-Blockchain-green?logo=flow)](https://flow.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

> A full-stack decentralized application built with Next.js, React, and Flow blockchain technology.`
  }

  /**
   * Generate table of contents
   */
  private generateTableOfContents(options: DocumentationOptions): string {
    const sections = [
      '- [Overview](#overview)',
      '- [Features](#features)',
      '- [Prerequisites](#prerequisites)'
    ]

    if (options.includeSetupInstructions) {
      sections.push('- [Installation](#installation)')
    }

    sections.push(
      '- [Configuration](#configuration)',
      '- [Usage](#usage)'
    )

    if (options.includeAPIDocumentation) {
      sections.push('- [API Reference](#api-reference)')
    }

    if (options.includeComponentExamples) {
      sections.push('- [Components](#components)')
    }

    sections.push(
      '- [Smart Contracts](#smart-contracts)'
    )

    if (options.includeDeploymentGuide) {
      sections.push('- [Deployment](#deployment)')
    }

    sections.push(
      '- [Development](#development)',
      '- [Testing](#testing)',
      '- [Contributing](#contributing)',
      '- [License](#license)'
    )

    return `## Table of Contents

${sections.join('\n')}`
  }  /*
*
   * Generate overview section
   */
  private generateOverviewSection(
    metadata: ProjectMetadata,
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): string {
    return `## Overview

${metadata.description}

This project includes:

- **${contracts.length} Smart Contract${contracts.length !== 1 ? 's' : ''}**: Cadence contracts deployed on Flow blockchain
- **${components.length} React Component${components.length !== 1 ? 's' : ''}**: Modern UI components with TypeScript
- **${apiRoutes.length} API Route${apiRoutes.length !== 1 ? 's' : ''}**: Next.js API endpoints for blockchain interaction
- **Full-Stack Integration**: Seamless connection between frontend and blockchain

### Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Next.js API   │    │ Flow Blockchain │
│                 │    │                 │    │                 │
│  - Components   │◄──►│  - API Routes   │◄──►│ - Smart Contracts│
│  - Hooks        │    │  - Validation   │    │ - Transactions  │
│  - UI/UX        │    │  - Auth         │    │ - Events        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\``
  }

  /**
   * Generate features section
   */
  private generateFeaturesSection(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): string {
    const features: string[] = []

    // Smart contract features
    if (contracts.length > 0) {
      features.push('### 🔗 Blockchain Features')
      contracts.forEach(contract => {
        const contractName = contract.filename.replace('.cdc', '')
        features.push(`- **${contractName}**: Advanced Cadence smart contract with secure transaction handling`)
      })
    }

    // Frontend features
    if (components.length > 0) {
      features.push('### 🎨 Frontend Features')
      features.push('- **Modern React Components**: Built with React 19 and TypeScript')
      features.push('- **Responsive Design**: Mobile-first approach with Tailwind CSS')
      features.push('- **Wallet Integration**: Seamless Flow wallet connection')
      features.push('- **Real-time Updates**: Live blockchain data synchronization')
    }

    // API features
    if (apiRoutes.length > 0) {
      features.push('### 🚀 API Features')
      features.push('- **RESTful Endpoints**: Clean API design with proper error handling')
      features.push('- **Input Validation**: Zod schema validation for all requests')
      features.push('- **Authentication**: Secure user authentication and authorization')
      features.push('- **Rate Limiting**: Built-in protection against abuse')
    }

    // General features
    features.push('### ⚡ Technical Features')
    features.push('- **TypeScript**: Full type safety across the entire stack')
    features.push('- **Server-Side Rendering**: Optimized performance with Next.js')
    features.push('- **Error Handling**: Comprehensive error boundaries and recovery')
    features.push('- **Testing**: Unit and integration tests included')

    return `## Features

${features.join('\n')}`
  }  /**

   * Generate prerequisites section
   */
  private generatePrerequisitesSection(metadata: ProjectMetadata): string {
    return `## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (recommended) or npm
- **Flow CLI** (for smart contract deployment)
- **Git** (for version control)

### Flow Blockchain Setup

1. **Install Flow CLI**:
   \`\`\`bash
   # macOS
   brew install flow-cli
   
   # Linux/Windows
   curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh | sh
   \`\`\`

2. **Create Flow Account** (for testnet deployment):
   - Visit [Flow Testnet Faucet](https://testnet-faucet.onflow.org/)
   - Create an account and fund it with test FLOW tokens

3. **Configure Flow Wallet**:
   - Install [Flow Wallet](https://wallet.flow.com/) browser extension
   - Switch to testnet for development`
  }

  /**
   * Generate installation section
   */
  private generateInstallationSection(metadata: ProjectMetadata): string {
    return `## Installation

### 1. Clone the Repository

\`\`\`bash
git clone ${metadata.repository || `https://github.com/username/${metadata.name.toLowerCase()}`}
cd ${metadata.name.toLowerCase()}
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
\`\`\`

### 3. Environment Setup

Create a \`.env.local\` file in the root directory:

\`\`\`env
# Flow Network Configuration
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# Smart Contract Addresses (update after deployment)
${this.generateContractEnvVars(metadata)}

# API Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Database (if applicable)
DATABASE_URL=your-database-url-here
\`\`\`

### 4. Smart Contract Deployment

Deploy your smart contracts to Flow testnet:

\`\`\`bash
# Deploy all contracts
flow project deploy --network testnet

# Or deploy individual contracts
flow accounts add-contract ExampleContract ./contracts/ExampleContract.cdc --network testnet
\`\`\`

### 5. Start Development Server

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.`
  }  /**
   
* Generate configuration section
   */
  private generateConfigurationSection(contracts: GeneratedContract[], metadata: ProjectMetadata): string {
    return `## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| \`NEXT_PUBLIC_FLOW_NETWORK\` | Flow network (testnet/mainnet) | Yes | testnet |
| \`NEXT_PUBLIC_FLOW_ACCESS_NODE\` | Flow access node URL | Yes | - |
${contracts.map(contract => {
  const contractName = contract.filename.replace('.cdc', '')
  return `| \`NEXT_PUBLIC_${contractName.toUpperCase()}_ADDRESS\` | ${contractName} contract address | Yes | - |`
}).join('\n')}
| \`NEXTAUTH_SECRET\` | Authentication secret | Yes | - |
| \`DATABASE_URL\` | Database connection string | No | - |

### Flow Configuration

The application uses Flow blockchain for smart contract interactions. Configure your Flow settings in \`flow.json\`:

\`\`\`json
{
  "networks": {
    "testnet": "access.devnet.nodes.onflow.org:9000",
    "mainnet": "access.mainnet.nodes.onflow.org:9000"
  },
  "accounts": {
    "testnet-account": {
      "address": "0x...",
      "key": "..."
    }
  },
  "contracts": {
${contracts.map(contract => {
  const contractName = contract.filename.replace('.cdc', '')
  return `    "${contractName}": "./contracts/${contract.filename}"`
}).join(',\n')}
  }
}
\`\`\`

### Next.js Configuration

Key configuration options in \`next.config.mjs\`:

- **TypeScript**: Strict mode enabled
- **ESLint**: Custom rules for Flow development
- **Tailwind CSS**: Configured with custom theme
- **Image Optimization**: Optimized for static export`
  }  /*
*
   * Generate usage section
   */
  private generateUsageSection(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): string {
    const sections: string[] = []

    sections.push('## Usage')

    // Basic usage
    sections.push(`### Basic Usage

1. **Connect Wallet**: Click the "Connect Wallet" button to connect your Flow wallet
2. **Interact with Contracts**: Use the provided UI to interact with smart contracts
3. **View Transactions**: Monitor your transactions in the transaction history
4. **Manage Assets**: View and manage your blockchain assets`)

    // Smart contract usage
    if (contracts.length > 0) {
      sections.push('### Smart Contract Interactions')
      contracts.forEach(contract => {
        const contractName = contract.filename.replace('.cdc', '')
        sections.push(`
#### ${contractName}

\`\`\`typescript
import { use${contractName} } from '@/hooks/use${contractName}'

function ${contractName}Component() {
  const { mint, transfer, getBalance, isLoading, error } = use${contractName}()

  const handleMint = async () => {
    try {
      await mint('0x...', { name: 'Example NFT', description: '...' })
    } catch (error) {
      console.error('Minting failed:', error)
    }
  }

  return (
    <div>
      <button onClick={handleMint} disabled={isLoading}>
        {isLoading ? 'Minting...' : 'Mint NFT'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
\`\`\``)
      })
    }

    // Component usage
    if (components.length > 0) {
      sections.push('### Component Usage')
      components.slice(0, 3).forEach(component => {
        const componentName = component.filename.replace('.tsx', '').replace('.jsx', '')
        sections.push(`
#### ${componentName}

\`\`\`tsx
import { ${componentName} } from '@/components/${component.filename}'

function App() {
  return (
    <div>
      <${componentName} 
        // Add your props here
      />
    </div>
  )
}
\`\`\``)
      })
    }

    return sections.join('\n')
  }  
/**
   * Generate API reference section
   */
  private generateAPIReferenceSection(apiRoutes: GeneratedAPIRoute[]): string {
    const sections: string[] = []

    sections.push('## API Reference')
    sections.push('### Base URL')
    sections.push('```\nhttp://localhost:3000/api\n```')

    apiRoutes.forEach(route => {
      const routeName = route.filename.replace('/route.ts', '').replace('app/api/', '')
      sections.push(`
### ${routeName}

**Endpoint**: \`${route.endpoint}\`  
**Methods**: ${route.methods.join(', ')}

#### Request

\`\`\`typescript
// Example request
const response = await fetch('/api/${routeName}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    // Request body parameters
  })
})

const data = await response.json()
\`\`\`

#### Response

\`\`\`json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
\`\`\``)
    })

    return sections.join('\n')
  }

  /**
   * Generate component reference section
   */
  private generateComponentReferenceSection(components: GeneratedComponent[]): string {
    const sections: string[] = []

    sections.push('## Components')
    sections.push('### Component Library')

    components.forEach(component => {
      const componentName = component.filename.replace('.tsx', '').replace('.jsx', '')
      sections.push(`
#### ${componentName}

**Type**: ${component.componentType}  
**File**: \`${component.filename}\`

**Props**:
\`\`\`typescript
interface ${componentName}Props {
  // Component props will be documented here
  className?: string
  children?: React.ReactNode
}
\`\`\`

**Usage**:
\`\`\`tsx
import { ${componentName} } from '@/components/${component.filename}'

<${componentName} className="custom-class">
  Content here
</${componentName}>
\`\`\``)
    })

    return sections.join('\n')
  }  /**
 
  * Generate smart contracts section
   */
  private generateSmartContractsSection(contracts: GeneratedContract[]): string {
    const sections: string[] = []

    sections.push('## Smart Contracts')
    sections.push('### Contract Overview')

    contracts.forEach(contract => {
      const contractName = contract.filename.replace('.cdc', '')
      sections.push(`
#### ${contractName}

**File**: \`contracts/${contract.filename}\`  
**Language**: Cadence  
**Network**: Flow Blockchain

**Key Features**:
- Secure transaction handling
- Event emission for frontend integration
- Access control and permissions
- Gas-optimized operations

**Deployment**:
\`\`\`bash
flow accounts add-contract ${contractName} ./contracts/${contract.filename} --network testnet
\`\`\``)
    })

    return sections.join('\n')
  }

  /**
   * Generate deployment section
   */
  private generateDeploymentSection(metadata: ProjectMetadata): string {
    return `## Deployment

### Vercel Deployment (Recommended)

1. **Prepare for deployment**:
   \`\`\`bash
   pnpm build
   \`\`\`

2. **Deploy to Vercel**:
   \`\`\`bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   \`\`\`

3. **Configure environment variables** in Vercel dashboard:
   - Add all environment variables from \`.env.local\`
   - Update contract addresses for mainnet deployment

### Manual Deployment

1. **Build the application**:
   \`\`\`bash
   pnpm build
   pnpm export
   \`\`\`

2. **Deploy static files** to your hosting provider

3. **Configure environment variables** on your hosting platform

### Smart Contract Deployment

For production deployment:

1. **Switch to mainnet**:
   \`\`\`bash
   flow project deploy --network mainnet
   \`\`\`

2. **Update environment variables** with mainnet contract addresses

3. **Verify contracts** on Flow blockchain explorer`
  }  
/**
   * Generate development section
   */
  private generateDevelopmentSection(metadata: ProjectMetadata): string {
    return `## Development

### Project Structure

\`\`\`
${metadata.name}/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # Page components
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # UI components
│   └── ...               # Feature components
├── contracts/            # Cadence smart contracts
├── lib/                  # Utility libraries
├── hooks/                # Custom React hooks
├── public/               # Static assets
└── types/                # TypeScript type definitions
\`\`\`

### Development Commands

\`\`\`bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Run tests
pnpm test

# Type checking
pnpm type-check
\`\`\`

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with Next.js and React rules
- **Prettier**: Code formatting (if configured)
- **Husky**: Pre-commit hooks for code quality

### Adding New Features

1. **Smart Contracts**: Add new \`.cdc\` files to \`contracts/\`
2. **Components**: Create new components in \`components/\`
3. **API Routes**: Add new routes in \`app/api/\`
4. **Hooks**: Create custom hooks in \`hooks/\`
5. **Types**: Define types in \`types/\` or component files`
  }

  /**
   * Generate testing section
   */
  private generateTestingSection(metadata: ProjectMetadata): string {
    return `## Testing

### Running Tests

\`\`\`bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test ComponentName.test.tsx
\`\`\`

### Test Structure

\`\`\`
tests/
├── components/           # Component tests
├── hooks/               # Hook tests
├── api/                 # API route tests
├── contracts/           # Smart contract tests
└── utils/               # Utility function tests
\`\`\`

### Smart Contract Testing

\`\`\`bash
# Test Cadence contracts
flow test

# Test specific contract
flow test --file tests/ExampleContract_test.cdc
\`\`\`

### Writing Tests

Example component test:

\`\`\`typescript
import { render, screen } from '@testing-library/react'
import { ExampleComponent } from '@/components/ExampleComponent'

describe('ExampleComponent', () => {
  it('renders correctly', () => {
    render(<ExampleComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
\`\`\``
  } 
 /**
   * Generate contributing section
   */
  private generateContributingSection(metadata: ProjectMetadata): string {
    return `## Contributing

We welcome contributions to ${metadata.name}! Please follow these guidelines:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**: \`git checkout -b feature/amazing-feature\`
3. **Make your changes**
4. **Run tests**: \`pnpm test\`
5. **Commit your changes**: \`git commit -m 'Add amazing feature'\`
6. **Push to the branch**: \`git push origin feature/amazing-feature\`
7. **Open a Pull Request**

### Development Guidelines

- **Code Style**: Follow the existing code style and ESLint rules
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update documentation for API changes
- **Commits**: Use clear, descriptive commit messages
- **Pull Requests**: Provide detailed descriptions of changes

### Reporting Issues

When reporting issues, please include:

- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Clear reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable

### Feature Requests

For feature requests, please:

- **Check existing issues** to avoid duplicates
- **Provide clear use cases** for the feature
- **Consider implementation complexity**
- **Be open to discussion** about the approach`
  }

  /**
   * Generate license section
   */
  private generateLicenseSection(metadata: ProjectMetadata): string {
    return `## License

This project is licensed under the ${metadata.license} License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project uses several open-source libraries:

- **Next.js**: MIT License
- **React**: MIT License
- **Tailwind CSS**: MIT License
- **Flow**: Apache 2.0 License

---

**Built with ❤️ using [VibeMore](https://vibemore.com) - AI-powered dApp development platform**`
  }  /*
*
   * Generate API documentation
   */
  private async generateAPIDocumentation(
    apiRoutes: GeneratedAPIRoute[],
    contracts: GeneratedContract[],
    options: DocumentationOptions
  ): Promise<string> {
    if (!options.includeAPIDocumentation || apiRoutes.length === 0) {
      return ''
    }

    const sections: string[] = []

    sections.push('# API Documentation')
    sections.push(`
This document provides comprehensive documentation for the ${options.projectName} API endpoints.

## Base URL

\`\`\`
http://localhost:3000/api
\`\`\`

## Authentication

Most endpoints require authentication. Include the authorization header:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## Error Handling

All endpoints return errors in the following format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
\`\`\`

## Endpoints`)

    apiRoutes.forEach(route => {
      const routeName = route.filename.replace('/route.ts', '').replace('app/api/', '')
      sections.push(`
### ${routeName}

**Endpoint**: \`${route.endpoint}\`  
**Methods**: ${route.methods.join(', ')}  
**Authentication**: ${route.contractCalls.length > 0 ? 'Required' : 'Optional'}

#### Description

This endpoint handles ${routeName.replace('-', ' ')} operations and interacts with the following smart contracts:
${route.contractCalls.map(call => `- ${call.contractName}`).join('\n')}

#### Request Parameters

\`\`\`typescript
interface RequestBody {
  // Request parameters will be documented here based on the route
}
\`\`\`

#### Response

\`\`\`json
{
  "success": true,
  "data": {
    // Response data structure
  },
  "message": "Operation completed successfully"
}
\`\`\`

#### Example

\`\`\`bash
curl -X POST \\
  http://localhost:3000/api/${routeName} \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer <token>' \\
  -d '{
    // Request body
  }'
\`\`\``)
    })

    return sections.join('\n')
  }  /**

   * Generate component documentation
   */
  private async generateComponentDocumentation(
    components: GeneratedComponent[],
    contracts: GeneratedContract[],
    options: DocumentationOptions
  ): Promise<string> {
    if (!options.includeComponentExamples || components.length === 0) {
      return ''
    }

    const sections: string[] = []

    sections.push('# Component Documentation')
    sections.push(`
This document provides detailed documentation for all React components in the ${options.projectName} application.

## Component Architecture

Components are organized by type and functionality:

- **Pages**: Top-level page components
- **Components**: Reusable UI components
- **Layouts**: Layout wrapper components

## Usage Guidelines

- All components are built with TypeScript for type safety
- Components use Tailwind CSS for styling
- Smart contract integration is handled through custom hooks
- Error boundaries are implemented for robust error handling`)

    components.forEach(component => {
      const componentName = component.filename.replace('.tsx', '').replace('.jsx', '')
      sections.push(`
## ${componentName}

**Type**: ${component.componentType}  
**File**: \`${component.filename}\`  
**Dependencies**: ${component.dependencies.join(', ') || 'None'}

### Description

${this.generateComponentDescription(component, contracts)}

### Props Interface

\`\`\`typescript
interface ${componentName}Props {
  className?: string
  children?: React.ReactNode
  // Additional props based on component functionality
}
\`\`\`

### Usage Example

\`\`\`tsx
import { ${componentName} } from '@/components/${component.filename}'

function ExampleUsage() {
  return (
    <${componentName} 
      className="custom-styling"
      // Add additional props
    >
      {/* Component content */}
    </${componentName}>
  )
}
\`\`\`

### Smart Contract Integration

${component.contractIntegrations.length > 0 ? 
  component.contractIntegrations.map(integration => `
- **${integration.contractName}**: Integrates with functions: ${integration.functions.join(', ')}
- **Events**: Listens to: ${integration.events.join(', ')}`).join('\n') :
  'This component does not directly integrate with smart contracts.'}

### Styling

This component uses Tailwind CSS classes and follows the design system:

- **Base styles**: Applied automatically
- **Responsive**: Mobile-first responsive design
- **Theme support**: Supports light/dark themes
- **Accessibility**: WCAG 2.1 compliant`)
    })

    return sections.join('\n')
  }  /**

   * Generate deployment guide
   */
  private async generateDeploymentGuide(
    metadata: ProjectMetadata,
    contracts: GeneratedContract[],
    configs: GeneratedConfig[],
    options: DocumentationOptions
  ): Promise<string> {
    if (!options.includeDeploymentGuide) {
      return ''
    }

    return `# Deployment Guide

This guide covers deploying ${metadata.name} to production environments.

## Pre-deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Smart contracts deployed to mainnet
- [ ] Database migrations completed (if applicable)
- [ ] SSL certificates configured
- [ ] Domain name configured

## Smart Contract Deployment

### 1. Prepare Contracts

\`\`\`bash
# Verify contracts compile
flow cadence compile contracts/

# Run contract tests
flow test
\`\`\`

### 2. Deploy to Mainnet

\`\`\`bash
# Deploy all contracts
flow project deploy --network mainnet

# Verify deployment
flow accounts get <account-address> --network mainnet
\`\`\`

### 3. Update Contract Addresses

Update your environment variables with mainnet contract addresses:

${contracts.map(contract => {
  const contractName = contract.filename.replace('.cdc', '')
  return `\`\`\`env
NEXT_PUBLIC_${contractName.toUpperCase()}_ADDRESS=0x...
\`\`\``
}).join('\n')}

## Frontend Deployment

### Vercel (Recommended)

1. **Connect Repository**:
   - Link your GitHub repository to Vercel
   - Configure build settings

2. **Environment Variables**:
   - Add all production environment variables
   - Ensure contract addresses are updated

3. **Deploy**:
   \`\`\`bash
   vercel --prod
   \`\`\`

### Self-Hosted

1. **Build Application**:
   \`\`\`bash
   pnpm build
   pnpm export
   \`\`\`

2. **Server Configuration**:
   - Configure reverse proxy (nginx/Apache)
   - Set up SSL certificates
   - Configure environment variables

## Security Considerations

1. **Environment Variables**:
   - Never commit secrets to version control
   - Use secure secret management
   - Rotate keys regularly

2. **Smart Contract Security**:
   - Audit contracts before mainnet deployment
   - Implement proper access controls
   - Monitor for unusual activity`
  }  /**
   * 
Generate troubleshooting guide
   */
  private async generateTroubleshootingGuide(
    metadata: ProjectMetadata,
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    options: DocumentationOptions
  ): Promise<string> {
    if (!options.includeTroubleshooting) {
      return ''
    }

    return `# Troubleshooting Guide

This guide helps resolve common issues when developing and deploying ${metadata.name}.

## Common Issues

### Development Issues

#### Build Errors

**Issue**: TypeScript compilation errors
\`\`\`
Error: Type 'string' is not assignable to type 'number'
\`\`\`

**Solution**:
1. Check type definitions in components
2. Verify prop types match expected values
3. Run \`pnpm type-check\` to identify all type issues

#### Dependency Issues

**Issue**: Module not found errors
\`\`\`
Error: Cannot resolve module '@/components/...'
\`\`\`

**Solution**:
1. Verify path aliases in \`tsconfig.json\`
2. Check file exists at specified path
3. Restart development server

### Smart Contract Issues

#### Deployment Failures

**Issue**: Contract deployment fails
\`\`\`
Error: insufficient funds for gas
\`\`\`

**Solution**:
1. Ensure account has sufficient FLOW tokens
2. Check gas limit settings
3. Verify contract syntax is correct

#### Transaction Failures

**Issue**: Transactions fail with authorization errors
**Solution**:
1. Verify wallet is connected
2. Check account has required permissions
3. Ensure contract addresses are correct

### Frontend Issues

#### Wallet Connection Issues

**Issue**: Wallet fails to connect
**Solution**:
1. Verify Flow wallet extension is installed
2. Check network configuration (testnet/mainnet)
3. Clear browser cache and cookies
4. Try different browser

## Getting Help

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Flow Documentation](https://docs.onflow.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community Support

- [Flow Discord](https://discord.gg/flow)
- [Next.js Discussions](https://github.com/vercel/next.js/discussions)
- [React Community](https://reactjs.org/community/support.html)`
  }

  /**
   * Generate changelog
   */
  private async generateChangelog(metadata: ProjectMetadata, options: DocumentationOptions): Promise<string> {
    return `# Changelog

All notable changes to ${metadata.name} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Smart contract implementation
- React frontend components
- API route integration
- Full-stack documentation

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [${metadata.version}] - ${new Date().toISOString().split('T')[0]}

### Added
- **Smart Contracts**: Cadence contracts for blockchain functionality
- **Frontend Components**: React components with TypeScript
- **API Routes**: Next.js API endpoints for blockchain integration
- **Documentation**: Comprehensive project documentation
- **Testing**: Unit and integration test setup
- **Deployment**: Production deployment configuration

### Technical Details
- Next.js 15.2.4 with App Router
- React 19 with TypeScript
- Tailwind CSS for styling
- Flow blockchain integration
- Zod schema validation
- React Hook Form for form handling

---

## Release Notes Template

When creating new releases, use this template:

\`\`\`markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features and functionality

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features removed in this version

### Fixed
- Bug fixes

### Security
- Security improvements and fixes
\`\`\`

## Version History

- **v${metadata.version}**: Initial release with full-stack dApp functionality
- **Future versions**: Will be documented here as they are released`
  } 
 /**
   * Extract project metadata from generation results
   */
  private extractProjectMetadata(
    request: FullStackProjectRequest,
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[],
    configs: GeneratedConfig[]
  ): ProjectMetadata {
    return {
      name: request.projectName,
      description: request.description,
      version: '1.0.0',
      author: 'Generated by VibeMore',
      license: 'MIT',
      keywords: [
        'flow',
        'blockchain',
        'dapp',
        'nextjs',
        'react',
        'typescript',
        'cadence',
        ...request.features.map(f => f.type)
      ],
      dependencies: this.extractDependencies(contracts, components, apiRoutes),
      devDependencies: [
        '@types/node',
        '@types/react',
        '@types/react-dom',
        'eslint',
        'typescript',
        'vitest'
      ]
    }
  }

  /**
   * Extract dependencies from generated components
   */
  private extractDependencies(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): string[] {
    const dependencies = new Set<string>()

    // Base dependencies
    dependencies.add('next')
    dependencies.add('react')
    dependencies.add('react-dom')
    dependencies.add('typescript')

    // UI dependencies
    dependencies.add('tailwindcss')
    dependencies.add('lucide-react')

    // Flow dependencies
    dependencies.add('@onflow/fcl')
    dependencies.add('@onflow/types')

    // Form handling
    dependencies.add('react-hook-form')
    dependencies.add('zod')

    return Array.from(dependencies)
  }

  /**
   * Generate contract environment variables
   */
  private generateContractEnvVars(metadata: ProjectMetadata): string {
    // This would be populated based on actual contracts
    return `# Contract addresses will be populated after deployment
NEXT_PUBLIC_EXAMPLE_CONTRACT_ADDRESS=0x...`
  }

  /**
   * Generate component description
   */
  private generateComponentDescription(component: GeneratedComponent, contracts: GeneratedContract[]): string {
    const componentName = component.filename.replace('.tsx', '').replace('.jsx', '')
    
    if (component.contractIntegrations.length > 0) {
      return `The ${componentName} component provides user interface for interacting with smart contracts. It integrates with ${component.contractIntegrations.map(i => i.contractName).join(', ')} and handles blockchain transactions with proper error handling and loading states.`
    }
    
    return `The ${componentName} component is a ${component.componentType} component that provides user interface functionality. It follows React best practices and includes proper TypeScript typing.`
  }
}