# Technology Stack

## Framework & Runtime
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript 5** - Type-safe development
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style)
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **next-themes** - Dark/light theme support

## State Management & Forms
- **React Hook Form 7.60.0** - Form handling
- **Zod 3.25.67** - Schema validation
- **@hookform/resolvers** - Form validation integration

## AI Integration
- **Vercel AI SDK** - AI model integration
- Custom VibeSDK for code generation

## Flow Blockchain
- **Flow Client Library** - Custom Flow blockchain integration
- **Cadence** - Smart contract language for Flow
- Mock implementation for demo (production would use @onflow/fcl)

## Development Tools
- **ESLint** - Code linting (build errors ignored for demo)
- **PostCSS** - CSS processing
- **pnpm** - Package manager

## Common Commands

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Package Management
pnpm install      # Install dependencies
pnpm add <pkg>    # Add new dependency
```

## Build Configuration
- TypeScript strict mode enabled
- ESLint and TypeScript errors ignored during builds (demo configuration)
- Image optimization disabled for static export compatibility
- Path aliases configured (@/* maps to root)