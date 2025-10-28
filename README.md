# VibeMore

**AI-Powered Smart Contract Development Platform for Flow Blockchain**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-38B2AC)](https://tailwindcss.com/)
[![Flow](https://img.shields.io/badge/Flow-Blockchain-00EF8B)](https://flow.com/)

> Transform your ideas into production-ready Flow dApps using natural language. Generate smart contracts, React frontends, and API routes all from a single conversation.

## 🚀 Features

### 🤖 AI-Powered Code Generation
- **Natural Language to Code**: Transform plain English descriptions into complete Cadence smart contracts
- **Conversational Interface**: Iterative development through an intelligent chat assistant
- **Multi-Model Support**: OpenAI GPT, Google Gemini, and Anthropic Claude integration
- **Context-Aware Generation**: Maintains conversation history for coherent, progressive development

### 📝 Smart Contract Templates
- **6 Production-Ready Templates**: NFT collections, fungible tokens, marketplaces, DAOs, staking, and multi-sig wallets
- **Cadence 1.0 Compatible**: All templates migrated to modern Cadence syntax
- **Template Gallery**: Browse, preview, and customize pre-built contracts
- **Migration Support**: Automatic legacy syntax detection and modernization

### 🛠️ Development Environment
- **Integrated Code Editor**: Monaco-based editor with Cadence syntax highlighting
- **Real-Time Validation**: Instant feedback on code quality and syntax errors
- **Project Structure View**: Visual representation of generated full-stack applications
- **Component Relationships**: Interactive diagrams showing contract dependencies

### 🌊 Flow Blockchain Integration
- **One-Click Deployment**: Direct deployment to Flow testnet and mainnet
- **Wallet Integration**: Seamless connection with Flow wallets
- **Transaction Management**: Built-in transaction signing and monitoring
- **Network Switching**: Easy toggle between testnet and mainnet environments

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Themes**: Automatic theme switching with system preference detection
- **Component Library**: 50+ shadcn/ui components for consistent design
- **Accessibility**: WCAG compliant interface with keyboard navigation support

## 🏗️ Architecture

### Frontend Stack
- **Next.js 15.2.4** with App Router for optimal performance
- **React 19** with latest concurrent features
- **TypeScript 5** for type-safe development
- **Tailwind CSS 4.1.9** for utility-first styling
- **shadcn/ui** component library with Radix UI primitives

### AI Integration
- **Vercel AI SDK** for unified AI model access
- **Custom VibeSDK** for specialized code generation
- **Multi-Provider Support**: OpenAI, Google, Anthropic
- **Intelligent Retry Logic** with enhanced prompt engineering

### Blockchain Layer
- **Flow Client Library** for blockchain interactions
- **Cadence Language Support** with modern syntax patterns
- **Mock Implementation** for development (production uses @onflow/fcl)
- **Smart Contract Validation** with comprehensive error detection

## 📦 Template Library

| Template | Category | Description | Downloads |
|----------|----------|-------------|-----------|
| **Basic NFT Collection** | NFT | Simple NFT collection with minting and transfer | 1,250+ |
| **NFT Marketplace** | Marketplace | Complete marketplace for buying/selling NFTs | 2,100+ |
| **Fungible Token** | Token | Standard fungible token with vault management | 980+ |
| **Staking & Rewards** | DeFi | Token staking with reward distribution | 1,420+ |
| **DAO Voting System** | DAO | Decentralized governance with proposal voting | 750+ |
| **Multi-Signature Wallet** | Utility | Secure wallet requiring multiple approvals | 620+ |

All templates are **Cadence 1.0 compatible** and include comprehensive migration notes.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Flow CLI (optional, for advanced features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/vibemore.git
cd vibemore

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application runs immediately with mock AI responses. Visit `http://localhost:3000` to start building.

### Enable AI Integration

Choose your preferred AI provider:

**Option 1: Google Gemini (Recommended - Free Tier)**
```bash
# Get API key from https://aistudio.google.com/app/apikey
echo "GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key" >> .env.local
```

**Option 2: OpenAI**
```bash
# Get API key from https://platform.openai.com/api-keys
echo "OPENAI_API_KEY=sk-your-openai-key" >> .env.local
```

**Option 3: Anthropic Claude**
```bash
# Get API key from https://console.anthropic.com/
echo "ANTHROPIC_API_KEY=sk-ant-your-key" >> .env.local
```

### Enable Flow Blockchain

```bash
# Add to .env.local for testnet
echo "NEXT_PUBLIC_FLOW_NETWORK=testnet" >> .env.local
echo "NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org" >> .env.local

# For mainnet (production)
echo "NEXT_PUBLIC_FLOW_NETWORK=mainnet" >> .env.local
echo "NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-mainnet.onflow.org" >> .env.local
```

## 🎯 Usage Examples

### Generate an NFT Collection
1. Click "Start building" on the homepage
2. Describe your NFT collection: *"Create an NFT collection for digital art pieces with royalties"*
3. Review and customize the generated Cadence contract
4. Deploy directly to Flow testnet with one click

### Build a Complete dApp
1. Request a full-stack application: *"Build a marketplace dApp with React frontend"*
2. Explore the generated project structure
3. Review smart contracts, React components, and API routes
4. Export the complete project as a ZIP file

### Customize Existing Templates
1. Browse the template gallery
2. Select a template (e.g., "DAO Voting System")
3. Modify through conversational prompts: *"Add proposal expiration dates"*
4. Deploy the customized contract

## 🛠️ Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm scan:legacy  # Scan for legacy Cadence patterns
pnpm test:legacy  # Test legacy syntax prevention
```

### Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # AI integration endpoints
│   ├── docs/              # Documentation pages
│   ├── playground/        # Interactive playground
│   └── templates/         # Template gallery
├── components/            # React components
│   ├── ui/               # shadcn/ui component library
│   ├── chat-panel.tsx    # AI chat interface
│   ├── code-editor.tsx   # Cadence code editor
│   └── navigation.tsx    # Main navigation
├── lib/                  # Utility libraries
│   ├── templates.ts      # Smart contract templates
│   ├── vibesdk.ts       # AI code generation SDK
│   └── flow-client.ts   # Flow blockchain integration
└── hooks/               # Custom React hooks
```

## 🔧 Configuration

### Environment Variables

```bash
# AI Integration (choose one or more)
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Flow Blockchain
NEXT_PUBLIC_FLOW_NETWORK=testnet|mainnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# Production (Vercel AI Gateway)
AI_GATEWAY_API_KEY=your-vercel-gateway-key
```

### Deployment

**Vercel (Recommended)**
```bash
pnpm build
vercel deploy
```

**Docker**
```bash
docker build -t vibemore .
docker run -p 3000:3000 vibemore
```

## 🧪 Quality Assurance

### Code Quality Features
- **Legacy Syntax Detection**: Automatic identification of outdated Cadence patterns
- **Migration Tools**: Automated conversion from legacy to modern syntax
- **Validation Pipeline**: Multi-stage code validation with error recovery
- **Production Readiness**: Comprehensive testing and quality checks

### Testing
```bash
# Run legacy syntax tests
pnpm test:legacy

# Validate template compatibility
pnpm validate:syntax

# Full codebase scan
pnpm scan:full
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run quality checks: `pnpm lint && pnpm test:legacy`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Flow Blockchain** for the innovative blockchain platform
- **Vercel** for AI SDK and deployment infrastructure
- **shadcn/ui** for the beautiful component library
- **Monaco Editor** for the code editing experience


---

<div align="center">
  <strong>Built with ❤️ for the Flow ecosystem</strong>
  <br>
  <sub>Empowering developers to build the future of Web3</sub>
</div>