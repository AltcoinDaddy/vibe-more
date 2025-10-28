import { ProjectStructure, Directory, GeneratedFile, ConfigurationFile } from './vibesdk'

export interface ProjectStructureOptions {
  projectName: string
  includeContracts: boolean
  includeFrontend: boolean
  includeAPI: boolean
  framework: 'next' | 'react'
  styling: 'tailwind' | 'css'
  typescript: boolean
  testing: boolean
  linting: boolean
}

export interface DirectoryTemplate {
  name: string
  path: string
  purpose: string
  required: boolean
  children?: DirectoryTemplate[]
}

export interface FileTemplate {
  name: string
  path: string
  content: string
  type: 'contract' | 'component' | 'api' | 'config' | 'documentation'
  required: boolean
}

/**
 * Project Structure Generator
 * Creates complete Next.js project structures following conventions
 */
export class ProjectStructureGenerator {
  private projectName: string
  private options: ProjectStructureOptions

  constructor(projectName: string, options: ProjectStructureOptions) {
    this.projectName = this.sanitizeProjectName(projectName)
    this.options = options
  }

  /**
   * Generate complete project structure
   */
  generateProjectStructure(): ProjectStructure {
    const directories = this.generateDirectories()
    const files = this.generateBaseFiles()
    const configurations = this.generateConfigurationFiles()

    return {
      directories,
      files,
      configurations
    }
  }

  /**
   * Generate directory structure based on Next.js conventions
   */
  private generateDirectories(): Directory[] {
    const baseDirectories: DirectoryTemplate[] = [
      {
        name: 'app',
        path: 'app',
        purpose: 'Next.js App Router pages and layouts',
        required: true,
        children: [
          {
            name: 'api',
            path: 'app/api',
            purpose: 'API routes for backend functionality',
            required: this.options.includeAPI
          },
          {
            name: 'globals.css',
            path: 'app/globals.css',
            purpose: 'Global styles',
            required: true
          }
        ]
      },
      {
        name: 'components',
        path: 'components',
        purpose: 'Reusable React components',
        required: this.options.includeFrontend,
        children: [
          {
            name: 'ui',
            path: 'components/ui',
            purpose: 'shadcn/ui component library',
            required: this.options.includeFrontend
          }
        ]
      },
      {
        name: 'lib',
        path: 'lib',
        purpose: 'Utility libraries and configurations',
        required: true,
        children: [
          {
            name: 'contracts',
            path: 'lib/contracts',
            purpose: 'Smart contract definitions and utilities',
            required: this.options.includeContracts
          },
          {
            name: 'hooks',
            path: 'lib/hooks',
            purpose: 'Custom React hooks for contract interactions',
            required: this.options.includeFrontend
          }
        ]
      },
      {
        name: 'hooks',
        path: 'hooks',
        purpose: 'Custom React hooks',
        required: this.options.includeFrontend
      },
      {
        name: 'public',
        path: 'public',
        purpose: 'Static assets',
        required: true
      },
      {
        name: 'styles',
        path: 'styles',
        purpose: 'Additional CSS files',
        required: this.options.styling === 'css'
      }
    ]

    // Add testing directories if enabled
    if (this.options.testing) {
      baseDirectories.push({
        name: '__tests__',
        path: '__tests__',
        purpose: 'Test files',
        required: true,
        children: [
          {
            name: 'components',
            path: '__tests__/components',
            purpose: 'Component tests',
            required: this.options.includeFrontend
          },
          {
            name: 'api',
            path: '__tests__/api',
            purpose: 'API route tests',
            required: this.options.includeAPI
          },
          {
            name: 'contracts',
            path: '__tests__/contracts',
            purpose: 'Contract tests',
            required: this.options.includeContracts
          }
        ]
      })
    }

    return this.convertTemplatesToDirectories(baseDirectories)
  }

  /**
   * Convert directory templates to actual directory structures
   */
  private convertTemplatesToDirectories(templates: DirectoryTemplate[]): Directory[] {
    return templates
      .filter(template => template.required)
      .map(template => this.createDirectoryFromTemplate(template))
  }

  /**
   * Create directory from template
   */
  private createDirectoryFromTemplate(template: DirectoryTemplate): Directory {
    const children: (Directory | GeneratedFile)[] = []

    if (template.children) {
      const childDirectories = template.children
        .filter(child => child.required)
        .map(child => this.createDirectoryFromTemplate(child))
      
      children.push(...childDirectories)
    }

    return {
      name: template.name,
      path: template.path,
      children
    }
  }

  /**
   * Generate base files for the project
   */
  private generateBaseFiles(): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // Root layout file
    if (this.options.includeFrontend) {
      files.push({
        name: 'layout.tsx',
        path: 'app/layout.tsx',
        content: this.generateRootLayout(),
        type: 'component'
      })

      files.push({
        name: 'page.tsx',
        path: 'app/page.tsx',
        content: this.generateHomePage(),
        type: 'component'
      })

      files.push({
        name: 'globals.css',
        path: 'app/globals.css',
        content: this.generateGlobalStyles(),
        type: 'config'
      })
    }

    // Utility files
    files.push({
      name: 'utils.ts',
      path: 'lib/utils.ts',
      content: this.generateUtilsFile(),
      type: 'config'
    })

    // Flow client configuration
    if (this.options.includeContracts) {
      files.push({
        name: 'flow-client.ts',
        path: 'lib/flow-client.ts',
        content: this.generateFlowClient(),
        type: 'config'
      })
    }

    // README file
    files.push({
      name: 'README.md',
      path: 'README.md',
      content: this.generateReadme(),
      type: 'documentation'
    })

    return files
  }

  /**
   * Generate configuration files
   */
  private generateConfigurationFiles(): ConfigurationFile[] {
    const configs: ConfigurationFile[] = []

    // Package.json
    configs.push({
      name: 'package.json',
      path: 'package.json',
      content: this.generatePackageJson(),
      configType: 'package'
    })

    // Next.js config
    configs.push({
      name: 'next.config.mjs',
      path: 'next.config.mjs',
      content: this.generateNextConfig(),
      configType: 'next'
    })

    // TypeScript config
    if (this.options.typescript) {
      configs.push({
        name: 'tsconfig.json',
        path: 'tsconfig.json',
        content: this.generateTsConfig(),
        configType: 'typescript'
      })
    }

    // Tailwind config
    if (this.options.styling === 'tailwind') {
      configs.push({
        name: 'tailwind.config.ts',
        path: 'tailwind.config.ts',
        content: this.generateTailwindConfig(),
        configType: 'tailwind'
      })

      configs.push({
        name: 'postcss.config.mjs',
        path: 'postcss.config.mjs',
        content: this.generatePostCSSConfig(),
        configType: 'tailwind'
      })
    }

    // ESLint config
    if (this.options.linting) {
      configs.push({
        name: '.eslintrc.js',
        path: '.eslintrc.js',
        content: this.generateESLintConfig(),
        configType: 'eslint'
      })
    }

    // Environment variables template
    configs.push({
      name: '.env.example',
      path: '.env.example',
      content: this.generateEnvExample(),
      configType: 'env'
    })

    // Git ignore
    configs.push({
      name: '.gitignore',
      path: '.gitignore',
      content: this.generateGitIgnore(),
      configType: 'git'
    })

    return configs
  }

  /**
   * Generate root layout component
   */
  private generateRootLayout(): string {
    return `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
${this.options.styling === 'tailwind' ? "import { cn } from '@/lib/utils'" : ''}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${this.projectName}',
  description: 'A full-stack dApp built with VibeMore',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={${this.options.styling === 'tailwind' ? 'cn(inter.className, "min-h-screen bg-background font-sans antialiased")' : 'inter.className'}}>
        {children}
      </body>
    </html>
  )
}
`
  }

  /**
   * Generate home page component
   */
  private generateHomePage(): string {
    return `export default function Home() {
  return (
    <main className="${this.options.styling === 'tailwind' ? 'flex min-h-screen flex-col items-center justify-between p-24' : 'main'}">
      <div className="${this.options.styling === 'tailwind' ? 'z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex' : 'container'}">
        <h1 className="${this.options.styling === 'tailwind' ? 'text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl' : 'title'}">
          Welcome to ${this.projectName}
        </h1>
        <p className="${this.options.styling === 'tailwind' ? 'mt-6 text-lg leading-8 text-gray-600' : 'description'}">
          A full-stack decentralized application built with VibeMore
        </p>
      </div>
    </main>
  )
}
`
  }

  /**
   * Generate global styles
   */
  private generateGlobalStyles(): string {
    if (this.options.styling === 'tailwind') {
      return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
    } else {
      return `* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

a {
  color: inherit;
  text-decoration: none;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
}
`
    }
  }

  /**
   * Generate utils file
   */
  private generateUtilsFile(): string {
    if (this.options.styling === 'tailwind') {
      return `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
    } else {
      return `export function formatAddress(address: string): string {
  if (address.length <= 10) return address
  return \`\${address.slice(0, 6)}...\${address.slice(-4)}\`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}
`
    }
  }

  /**
   * Generate Flow client configuration
   */
  private generateFlowClient(): string {
    return `// Flow blockchain client configuration
// This is a mock implementation for development
// In production, replace with @onflow/fcl

export interface FlowAccount {
  address: string
  balance: number
}

export interface FlowTransaction {
  id: string
  status: 'pending' | 'sealed' | 'failed'
  errorMessage?: string
}

export class FlowClient {
  private static instance: FlowClient
  private isConnected = false
  private currentAccount: FlowAccount | null = null

  static getInstance(): FlowClient {
    if (!FlowClient.instance) {
      FlowClient.instance = new FlowClient()
    }
    return FlowClient.instance
  }

  async connect(): Promise<FlowAccount> {
    // Mock wallet connection
    this.isConnected = true
    this.currentAccount = {
      address: '0x1234567890abcdef',
      balance: 100.0
    }
    return this.currentAccount
  }

  async disconnect(): Promise<void> {
    this.isConnected = false
    this.currentAccount = null
  }

  async executeTransaction(code: string, args: any[] = []): Promise<FlowTransaction> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected')
    }

    // Mock transaction execution
    return {
      id: \`tx_\${Date.now()}\`,
      status: 'sealed'
    }
  }

  async executeScript(code: string, args: any[] = []): Promise<any> {
    // Mock script execution
    return { result: 'success' }
  }

  getCurrentAccount(): FlowAccount | null {
    return this.currentAccount
  }

  isWalletConnected(): boolean {
    return this.isConnected
  }
}

export const flowClient = FlowClient.getInstance()
`
  }

  /**
   * Generate README file
   */
  private generateReadme(): string {
    return `# ${this.projectName}

A full-stack decentralized application built with VibeMore.

## Features

${this.options.includeContracts ? '- Smart contract integration with Flow blockchain' : ''}
${this.options.includeFrontend ? '- Modern React frontend with Next.js' : ''}
${this.options.includeAPI ? '- API routes for backend functionality' : ''}
${this.options.styling === 'tailwind' ? '- Tailwind CSS for styling' : ''}
${this.options.typescript ? '- TypeScript for type safety' : ''}
${this.options.testing ? '- Comprehensive testing setup' : ''}

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
pnpm install
\`\`\`

3. Copy environment variables:

\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Start the development server:

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

\`\`\`
${this.projectName}/
├── app/                    # Next.js App Router
${this.options.includeAPI ? '│   ├── api/                # API routes' : ''}
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
${this.options.includeFrontend ? '├── components/            # React components' : ''}
${this.options.includeFrontend ? '│   └── ui/                # shadcn/ui components' : ''}
├── lib/                    # Utilities and configurations
${this.options.includeContracts ? '│   ├── contracts/         # Smart contract utilities' : ''}
${this.options.includeFrontend ? '│   └── hooks/             # Custom React hooks' : ''}
${this.options.includeFrontend ? '├── hooks/                 # Additional React hooks' : ''}
├── public/                 # Static assets
${this.options.testing ? '├── __tests__/             # Test files' : ''}
└── README.md
\`\`\`

## Available Scripts

- \`pnpm dev\` - Start development server
- \`pnpm build\` - Build for production
- \`pnpm start\` - Start production server
- \`pnpm lint\` - Run ESLint
${this.options.testing ? '- `pnpm test` - Run tests' : ''}

## Deployment

This project is optimized for deployment on Vercel. Simply connect your repository to Vercel for automatic deployments.

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
`
  }

  /**
   * Sanitize project name for file system usage
   */
  private sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Generate package.json content
   */
  private generatePackageJson(): string {
    const dependencies: Record<string, string> = {
      'next': '^15.2.4',
      'react': '^19.0.0',
      'react-dom': '^19.0.0'
    }

    const devDependencies: Record<string, string> = {}

    if (this.options.typescript) {
      devDependencies['typescript'] = '^5.0.0'
      devDependencies['@types/node'] = '^20.0.0'
      devDependencies['@types/react'] = '^19.0.0'
      devDependencies['@types/react-dom'] = '^19.0.0'
    }

    if (this.options.styling === 'tailwind') {
      dependencies['tailwindcss'] = '^4.1.9'
      dependencies['clsx'] = '^2.0.0'
      dependencies['tailwind-merge'] = '^2.0.0'
      devDependencies['postcss'] = '^8.0.0'
    }

    if (this.options.linting) {
      devDependencies['eslint'] = '^8.0.0'
      devDependencies['eslint-config-next'] = '^15.2.4'
    }

    if (this.options.testing) {
      devDependencies['vitest'] = '^1.0.0'
      devDependencies['@testing-library/react'] = '^14.0.0'
      devDependencies['@testing-library/jest-dom'] = '^6.0.0'
    }

    if (this.options.includeFrontend) {
      dependencies['@radix-ui/react-slot'] = '^1.0.0'
      dependencies['lucide-react'] = '^0.400.0'
      dependencies['react-hook-form'] = '^7.60.0'
      dependencies['@hookform/resolvers'] = '^3.0.0'
      dependencies['zod'] = '^3.25.67'
    }

    const packageJson = {
      name: this.projectName,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        ...(this.options.linting && { lint: 'next lint' }),
        ...(this.options.testing && { test: 'vitest' })
      },
      dependencies,
      devDependencies
    }

    return JSON.stringify(packageJson, null, 2)
  }

  /**
   * Generate Next.js configuration
   */
  private generateNextConfig(): string {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  images: {
    unoptimized: true
  }
}

export default nextConfig
`
  }

  /**
   * Generate TypeScript configuration
   */
  private generateTsConfig(): string {
    return `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`
  }

  /**
   * Generate Tailwind configuration
   */
  private generateTailwindConfig(): string {
    return `import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
`
  }

  /**
   * Generate PostCSS configuration
   */
  private generatePostCSSConfig(): string {
    return `const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
`
  }

  /**
   * Generate ESLint configuration
   */
  private generateESLintConfig(): string {
    return `module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Customize rules as needed
  },
}
`
  }

  /**
   * Generate environment variables example
   */
  private generateEnvExample(): string {
    return `# Environment Variables Template
# Copy this file to .env.local and fill in your values

# AI Provider Configuration (choose one)
OPENAI_API_KEY=your_openai_api_key_here
# GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Flow Blockchain Configuration
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# Application Configuration
NEXT_PUBLIC_APP_NAME=${this.projectName}
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (if needed)
# DATABASE_URL=your_database_url_here

# Additional API Keys
# Add any additional API keys your dApp requires
`
  }

  /**
   * Generate .gitignore file
   */
  private generateGitIgnore(): string {
    return `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
Thumbs.db
`
  }
}