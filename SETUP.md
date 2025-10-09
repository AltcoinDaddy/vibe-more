# VibeMore Setup Guide

## 🚀 Quick Start (Works Immediately)

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Run Development Server**
   ```bash
   pnpm dev
   ```
   
   **That's it!** The app works with mock AI responses out of the box.

## 🔧 Enable Real AI Integration

### Option 1: OpenAI (Recommended for Development)
1. Get API key from https://platform.openai.com/api-keys
2. Create `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-your-openai-key-here
   ```
3. Restart server: `pnpm dev`

### Option 2: Google Gemini (Recommended - Free Tier Available)
1. Get API key from https://aistudio.google.com/app/apikey
2. Create `.env.local`:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here
   ```
3. Restart server: `pnpm dev`

### Option 3: Anthropic Claude
1. Get API key from https://console.anthropic.com/
2. Create `.env.local`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
   ```
3. Restart server: `pnpm dev`

### Option 3: Vercel AI Gateway (Production)
1. Set up Vercel AI Gateway
2. Create `.env.local`:
   ```bash
   AI_GATEWAY_API_KEY=your-vercel-gateway-key
   ```
3. Restart server: `pnpm dev`

## 🌊 Enable Real Flow Blockchain

1. **Add Flow Configuration**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_FLOW_NETWORK=testnet
   NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
   ```

2. **For Mainnet (Production)**
   ```bash
   NEXT_PUBLIC_FLOW_NETWORK=mainnet
   NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-mainnet.onflow.org
   ```

## Current Status

### ✅ Working Features
- Landing page with hero section
- Template gallery (6 pre-built contracts)
- Documentation pages
- Playground interface
- Code editor with syntax highlighting
- Mock AI responses (when real AI unavailable)
- Mock Flow wallet integration

### ⚠️ Requires Configuration
- **AI Code Generation**: Needs API keys
- **Real Flow Integration**: Needs @onflow/fcl setup
- **Contract Deployment**: Needs Flow wallet connection

## Production Setup

### 1. AI Integration
```bash
# For production, use Vercel AI Gateway
AI_GATEWAY_API_KEY=your_production_key
```

### 2. Flow Blockchain
```bash
# Install Flow dependencies
pnpm add @onflow/fcl @onflow/types

# Configure network
FLOW_NETWORK=mainnet  # or testnet
```

### 3. Deploy to Vercel
```bash
# Build and deploy
pnpm build
vercel deploy
```

## Development Workflow

1. **Start Development**
   ```bash
   pnpm dev
   ```

2. **Test Build**
   ```bash
   pnpm build
   ```

3. **Run Linting**
   ```bash
   pnpm lint
   ```

## Troubleshooting

### AI Not Working
- Check if API keys are set in `.env.local`
- Verify API key permissions
- Check network connectivity

### Build Errors
- Run `pnpm install` to ensure dependencies
- Check TypeScript errors with `pnpm build`
- Verify all imports are correct

### Font Loading Issues
- Internet connection required for Google Fonts
- Fallback fonts configured for offline use

## Next Steps

1. **Set up real AI integration** - Add your API keys
2. **Configure Flow blockchain** - Add @onflow/fcl
3. **Test contract deployment** - Connect real wallet
4. **Add advanced features** - Testing, debugging tools