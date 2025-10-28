import { GeneratedConfig } from './vibesdk'

/**
 * Configuration options for project generation
 */
export interface ConfigurationOptions {
  projectName: string
  dependencies: string[]
  framework: 'next' | 'react'
  styling: 'tailwind' | 'css'
  typescript: boolean
}

/**
 * Configuration file generator for full-stack projects
 */
export class ConfigurationGenerator {

  /**
   * Generate all configuration files for a project
   */
  async generateConfigurations(options: ConfigurationOptions): Promise<GeneratedConfig[]> {
    const configs: GeneratedConfig[] = []

    // Generate package.json
    configs.push(await this.generatePackageJson(options))

    // Generate Next.js config
    if (options.framework === 'next') {
      configs.push(await this.generateNextConfig(options))
    }

    // Generate TypeScript config
    if (options.typescript) {
      configs.push(await this.generateTsConfig(options))
    }

    // Generate Tailwind config
    if (options.styling === 'tailwind') {
      configs.push(await this.generateTailwindConfig(options))
      configs.push(await this.generatePostCssConfig(options))
    }

    // Generate environment variables template
    configs.push(await this.generateEnvTemplate(options))

    // Generate gitignore
    configs.push(await this.generateGitignore(options))

    // Generate README
    configs.push(await this.generateReadme(options))

    return configs
  }

  /**
   * Generate package.json
   */
  private async generatePackageJson(options: ConfigurationOptions): Promise<GeneratedConfig> {
    const baseDependencies = {
      "next": "^15.2.4",
      "react": "^19.0.0",
      "react-dom": "^19.0.0"
    }

    const devDependencies = {
      "@types/node": "^22.0.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "eslint": "^9.0.0",
      "eslint-config-next": "^15.2.4",
      "postcss": "^8.4.0"
    }

    if (options.typescript) {
      devDependencies["typescript"] = "^5.0.0"
    }

    if (options.styling === 'tailwind') {
      devDependencies["tailwindcss"] = "^4.1.9"
      devDependencies["@tailwindcss/forms"] = "^0.5.0"
      baseDependencies["@tailwindcss/typography"] = "^0.5.0"
    }

    // Add Flow dependencies
    baseDependencies["@onflow/fcl"] = "^1.12.0"
    baseDependencies["@onflow/types"] = "^1.4.0"

    // Add UI dependencies
    baseDependencies["@radix-ui/react-alert-dialog"] = "^1.1.0"
    baseDependencies["@radix-ui/react-button"] = "^1.1.0"
    baseDependencies["@radix-ui/react-card"] = "^1.1.0"
    baseDependencies["@radix-ui/react-dialog"] = "^1.1.0"
    baseDependencies["@radix-ui/react-form"] = "^0.1.0"
    baseDependencies["@radix-ui/react-input"] = "^1.1.0"
    baseDependencies["@radix-ui/react-label"] = "^2.1.0"
    baseDependencies["@radix-ui/react-select"] = "^2.1.0"
    baseDependencies["@radix-ui/react-separator"] = "^1.1.0"
    baseDependencies["@radix-ui/react-slot"] = "^1.1.0"
    baseDependencies["@radix-ui/react-toast"] = "^1.2.0"

    // Add form handling
    baseDependencies["react-hook-form"] = "^7.60.0"
    baseDependencies["@hookform/resolvers"] = "^3.10.0"
    baseDependencies["zod"] = "^3.25.67"

    // Add icons
    baseDependencies["lucide-react"] = "^0.460.0"

    // Add utility libraries
    baseDependencies["clsx"] = "^2.1.0"
    baseDependencies["tailwind-merge"] = "^2.5.0"
    baseDependencies["class-variance-authority"] = "^0.7.0"

    const packageJson = {
      name: options.projectName.toLowerCase().replace(/\s+/g, '-'),
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
        "type-check": options.typescript ? "tsc --noEmit" : undefined
      },
      dependencies: {
        ...baseDependencies,
        ...options.dependencies.reduce((acc, dep) => {
          acc[dep] = "latest"
          return acc
        }, {} as Record<string, string>)
      },
      devDependencies
    }

    return {
      filename: 'package.json',
      code: JSON.stringify(packageJson, null, 2),
      configType: 'package'
    }
  }

  /**
   * Generate Next.js configuration
   */
  private async generateNextConfig(options: ConfigurationOptions): Promise<GeneratedConfig> {
    const config = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  images: {
    domains: ['placeholder.com', 'via.placeholder.com'],
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_FLOW_NETWORK: process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet',
    NEXT_PUBLIC_FLOW_ACCESS_NODE: process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org'
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false
    }
    return config
  }
}

module.exports = nextConfig`

    return {
      filename: 'next.config.js',
      code: config,
      configType: 'next'
    }
  }

  /**
   * Generate TypeScript configuration
   */
  private async generateTsConfig(options: ConfigurationOptions): Promise<GeneratedConfig> {
    const config = {
      compilerOptions: {
        lib: ["dom", "dom.iterable", "es6"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [
          {
            name: "next"
          }
        ],
        baseUrl: ".",
        paths: {
          "@/*": ["./*"]
        }
      },
      include: [
        "next-env.d.ts",
        "**/*.ts",
        "**/*.tsx",
        ".next/types/**/*.ts"
      ],
      exclude: ["node_modules"]
    }

    return {
      filename: 'tsconfig.json',
      code: JSON.stringify(config, null, 2),
      configType: 'typescript'
    }
  }

  /**
   * Generate Tailwind CSS configuration
   */
  private async generateTailwindConfig(options: ConfigurationOptions): Promise<GeneratedConfig> {
    const config = `import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
} satisfies Config

export default config`

    return {
      filename: 'tailwind.config.ts',
      code: config,
      configType: 'tailwind'
    }
  }

  /**
   * Generate PostCSS configuration
   */
  private async generatePostCssConfig(options: ConfigurationOptions): Promise<GeneratedConfig> {
    const config = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`

    return {
      filename: 'postcss.config.js',
      code: config,
      configType: 'postcss'
    }
  }

  /**
   * Generate environment variables template
   */
  private async generateEnvTemplate(options: ConfigurationOptions): Promise<GeneratedConfig> {
    const envTemplate = `# Flow Network Configuration
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# Contract Addresses (update with your deployed contracts)
# NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
# NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=0x...

# AI Configuration (optional)
# OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database (if using)
# DATABASE_URL=your_database_url_here

# Authentication (if using)
# NEXTAUTH_SECRET=your_nextauth_secret_here
# NEXTAUTH_URL=http://localhost:3000`

    return {
      filename: '.env.example',
      code: envTemplate,
      configType: 'env'
    }
  }

  /**
   * Generate .gitignore
   */
  private async generateGitignore(options: ConfigurationOptions): Promise<GeneratedConfig> {
    const gitignore = `# Dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
Thumbs.db`

    return {
      filename: '.gitignore',
      code: gitignore,
      configType: 'git'
    }
  }

  /**
   * Generate README.md
   */
  private async generateReadme(options: ConfigurationOptions): Promise<GeneratedConfig> {
    const readme = `# ${options.projectName}

A full-stack decentralized application built with Next.js and Flow blockchain.

## Features

- 🚀 Next.js 15 with App Router
- ⚡ React 19 with latest features
- 🎨 Tailwind CSS for styling
- 🔗 Flow blockchain integration
- 📱 Responsive design
- 🎯 TypeScript for type safety
- 🧩 Component-based architecture

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Flow CLI (for contract deployment)

### Installation

1. Clone the repository:
\`\`\`bash
git clone <your-repo-url>
cd ${options.projectName.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

2. Install dependencies:
\`\`\`bash
pnpm install
\`\`\`

3. Copy environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Update environment variables in \`.env.local\` with your configuration.

### Development

Run the development server:

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

\`\`\`bash
pnpm build
pnpm start
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js App Router pages and API routes
├── components/             # Reusable React components
├── lib/                   # Utility libraries and configurations
├── hooks/                 # Custom React hooks
├── public/                # Static assets
└── contracts/             # Cadence smart contracts
\`\`\`

## Smart Contracts

The project includes the following smart contracts:

- **NFT Contract**: Handles NFT minting and management
- **Marketplace Contract**: Enables NFT trading
- **Token Contract**: Manages fungible tokens

### Deploying Contracts

1. Install Flow CLI
2. Update \`flow.json\` with your account information
3. Deploy contracts:

\`\`\`bash
flow project deploy --network testnet
\`\`\`

## API Routes

The application includes the following API endpoints:

- \`GET /api/nft\` - Fetch NFT data
- \`POST /api/nft/mint\` - Mint new NFTs
- \`GET /api/marketplace\` - Get marketplace listings
- \`POST /api/marketplace/list\` - List NFT for sale

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or join our Discord community.`

    return {
      filename: 'README.md',
      code: readme,
      configType: 'documentation'
    }
  }
}