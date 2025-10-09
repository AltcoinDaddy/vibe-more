# Project Structure

## Root Directory Organization

```
├── app/                    # Next.js App Router pages and API routes
├── components/             # Reusable React components
├── lib/                   # Utility libraries and configurations
├── hooks/                 # Custom React hooks
├── public/                # Static assets
├── styles/                # Global CSS files
└── .kiro/                 # Kiro IDE configuration
```

## App Directory (Next.js App Router)
- `app/page.tsx` - Landing page with hero section and editor toggle
- `app/layout.tsx` - Root layout with navigation and theme setup
- `app/globals.css` - Global styles and Tailwind imports
- `app/api/` - API routes for AI integration
  - `generate/route.ts` - Code generation endpoint
  - `explain/route.ts` - Code explanation endpoint  
  - `refine/route.ts` - Code refinement endpoint
- `app/docs/` - Documentation pages
- `app/playground/` - Interactive playground
- `app/templates/` - Template gallery

## Components Architecture
- `components/ui/` - shadcn/ui component library (50+ components)
- `components/` - Application-specific components:
  - `chat-panel.tsx` - AI chat interface
  - `code-editor.tsx` - Cadence code editor
  - `navigation.tsx` - Main navigation bar
  - `wallet-button.tsx` - Flow wallet connection
  - `deployment-modal.tsx` - Contract deployment UI

## Library Organization
- `lib/utils.ts` - Utility functions (cn, clsx helpers)
- `lib/templates.ts` - Smart contract template definitions
- `lib/flow-client.ts` - Flow blockchain integration (mock)
- `lib/vibesdk.ts` - AI code generation SDK

## Naming Conventions
- **Files**: kebab-case for all files (`chat-panel.tsx`, `use-mobile.ts`)
- **Components**: PascalCase for React components
- **Functions**: camelCase for functions and variables
- **Constants**: UPPER_SNAKE_CASE for constants

## Import Patterns
- Use path aliases: `@/components`, `@/lib`, `@/hooks`
- Group imports: external libraries → internal modules → relative imports
- Prefer named exports over default exports for utilities

## Component Structure
- Keep components focused and single-responsibility
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Follow React 19 patterns (use client/server components appropriately)

## State Management
- Local state with useState/useReducer
- Form state with React Hook Form + Zod validation
- No global state management (Redux/Zustand) currently used