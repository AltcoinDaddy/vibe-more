import { describe, it, expect, beforeEach } from 'vitest'
import { VibeSDK } from '../vibesdk'

describe('VibeSDK Full-Stack Generation', () => {
  let vibeSDK: VibeSDK

  beforeEach(() => {
    vibeSDK = new VibeSDK()
  })

  describe('parseFullStackPrompt', () => {
    it('should identify NFT collection project type', () => {
      const prompt = "Create an NFT collection for digital art with minting and trading capabilities"
      const result = vibeSDK.parseFullStackPrompt(prompt)

      expect(result.projectType).toBe('nft-collection')
      expect(result.backendRequirements.contractTypes).toContain('NFT')
      expect(result.backendRequirements.contractTypes).toContain('Collection')
      expect(result.frontendRequirements.pages).toContain('Collection')
      expect(result.frontendRequirements.components).toContain('NFTCard')
      expect(result.confidence).toBeGreaterThan(70)
    })

    it('should identify marketplace project type', () => {
      const prompt = "Build a marketplace where users can buy and sell NFTs with listing and purchasing features"
      const result = vibeSDK.parseFullStackPrompt(prompt)

      expect(result.projectType).toBe('marketplace')
      expect(result.backendRequirements.contractTypes).toContain('Marketplace')
      expect(result.frontendRequirements.pages).toContain('Marketplace')
      expect(result.frontendRequirements.components).toContain('PurchaseButton')
      expect(result.integrationRequirements.apiEndpoints).toContain('/api/purchase')
    })

    it('should identify token project type', () => {
      const prompt = "Create a fungible token with transfer and minting capabilities"
      const result = vibeSDK.parseFullStackPrompt(prompt)

      expect(result.projectType).toBe('token')
      expect(result.backendRequirements.contractTypes).toContain('FungibleToken')
      expect(result.frontendRequirements.components).toContain('TransferForm')
      expect(result.integrationRequirements.contractBindings).toContain('transfer')
    })

    it('should identify DAO project type', () => {
      const prompt = "Build a DAO with governance and voting mechanisms"
      const result = vibeSDK.parseFullStackPrompt(prompt)

      expect(result.projectType).toBe('dao')
      expect(result.confidence).toBeGreaterThan(50)
    })

    it('should extract backend requirements correctly', () => {
      const prompt = "Create an NFT collection with minting and metadata features"
      const result = vibeSDK.parseFullStackPrompt(prompt)

      expect(result.backendRequirements.functions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'mintNFT',
            purpose: 'Create new NFT',
            parameters: ['recipient', 'metadata']
          })
        ])
      )

      expect(result.backendRequirements.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Minted',
            purpose: 'NFT created',
            fields: ['id', 'recipient']
          })
        ])
      )
    })

    it('should extract frontend requirements correctly', () => {
      const prompt = "Create an NFT marketplace with responsive design"
      const result = vibeSDK.parseFullStackPrompt(prompt)

      expect(result.frontendRequirements.styling.responsive).toBe(true)
      expect(result.frontendRequirements.styling.accessibility).toBe(true)
      expect(result.frontendRequirements.styling.framework).toBe('tailwind')
      expect(result.frontendRequirements.interactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'form',
            contractFunction: 'listForSale'
          })
        ])
      )
    })

    it('should calculate confidence score correctly', () => {
      const detailedPrompt = "Create a comprehensive NFT marketplace with minting, listing, purchasing, and profile management features"
      const vaguePrompt = "Make something with blockchain"

      const detailedResult = vibeSDK.parseFullStackPrompt(detailedPrompt)
      const vagueResult = vibeSDK.parseFullStackPrompt(vaguePrompt)

      expect(detailedResult.confidence).toBeGreaterThan(vagueResult.confidence)
      expect(detailedResult.confidence).toBeGreaterThan(80)
      expect(vagueResult.confidence).toBeLessThan(50)
    })
  })

  describe('analyzeProjectStructure', () => {
    it('should create proper Next.js project structure', () => {
      const prompt = "Create an NFT collection"
      const parsedPrompt = vibeSDK.parseFullStackPrompt(prompt)
      const structure = vibeSDK.analyzeProjectStructure(parsedPrompt, 'test-nft-project')

      expect(structure.directories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'app', path: 'app' }),
          expect.objectContaining({ name: 'components', path: 'components' }),
          expect.objectContaining({ name: 'lib', path: 'lib' }),
          expect.objectContaining({ name: 'contracts', path: 'contracts' })
        ])
      )
    })

    it('should generate appropriate files for NFT project', () => {
      const prompt = "Create an NFT collection with minting"
      const parsedPrompt = vibeSDK.parseFullStackPrompt(prompt)
      const structure = vibeSDK.analyzeProjectStructure(parsedPrompt, 'test-nft-project')

      const contractFiles = structure.files.filter(f => f.type === 'contract')
      const componentFiles = structure.files.filter(f => f.type === 'component')
      const apiFiles = structure.files.filter(f => f.type === 'api')

      expect(contractFiles.length).toBeGreaterThan(0)
      expect(componentFiles.length).toBeGreaterThan(0)
      expect(apiFiles.length).toBeGreaterThan(0)

      expect(contractFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'NFT.cdc',
            path: 'contracts/NFT.cdc'
          })
        ])
      )
    })

    it('should generate configuration files', () => {
      const prompt = "Create a simple dApp"
      const parsedPrompt = vibeSDK.parseFullStackPrompt(prompt)
      const structure = vibeSDK.analyzeProjectStructure(parsedPrompt, 'test-project')

      expect(structure.configurations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'package.json', configType: 'package' }),
          expect.objectContaining({ name: 'next.config.mjs', configType: 'next' }),
          expect.objectContaining({ name: 'tailwind.config.ts', configType: 'tailwind' }),
          expect.objectContaining({ name: 'tsconfig.json', configType: 'typescript' }),
          expect.objectContaining({ name: '.env.example', configType: 'env' })
        ])
      )
    })
  })

  describe('generateFullStackProject', () => {
    it('should generate a complete full-stack project', async () => {
      const options = {
        prompt: "Create an NFT collection for digital art",
        projectName: "art-nft-collection",
        includeFrontend: true,
        includeAPI: true,
        uiFramework: 'next' as const,
        stylingFramework: 'tailwind' as const,
        deploymentTarget: 'vercel' as const,
        temperature: 0.7
      }

      const result = await vibeSDK.generateFullStackProject(options)

      expect(result.smartContracts.length).toBeGreaterThan(0)
      expect(result.frontendComponents.length).toBeGreaterThan(0)
      expect(result.apiRoutes.length).toBeGreaterThan(0)
      expect(result.configurations.length).toBeGreaterThan(0)
      expect(result.projectStructure).toBeDefined()
      expect(result.integrationCode).toBeDefined()
    })

    it('should generate only backend when frontend is disabled', async () => {
      const options = {
        prompt: "Create a simple token contract",
        projectName: "simple-token",
        includeFrontend: false,
        includeAPI: false,
        uiFramework: 'next' as const,
        stylingFramework: 'tailwind' as const,
        deploymentTarget: 'vercel' as const,
        temperature: 0.7
      }

      const result = await vibeSDK.generateFullStackProject(options)

      expect(result.smartContracts.length).toBeGreaterThan(0)
      expect(result.frontendComponents.length).toBe(0)
      expect(result.apiRoutes.length).toBe(0)
      expect(result.configurations.length).toBeGreaterThan(0) // Still need config files
    })

    it('should generate proper package.json', async () => {
      const options = {
        prompt: "Create a basic dApp",
        projectName: "test-dapp",
        includeFrontend: true,
        includeAPI: true,
        uiFramework: 'next' as const,
        stylingFramework: 'tailwind' as const,
        deploymentTarget: 'vercel' as const,
        temperature: 0.7
      }

      const result = await vibeSDK.generateFullStackProject(options)
      const packageJson = result.configurations.find(c => c.filename === 'package.json')

      expect(packageJson).toBeDefined()
      expect(packageJson?.code).toContain('"name": "test-dapp"')
      expect(packageJson?.code).toContain('"next"')
      expect(packageJson?.code).toContain('"react"')
      expect(packageJson?.code).toContain('"tailwindcss"')
    })
  })

  describe('helper methods', () => {
    it('should extract contract dependencies correctly', () => {
      const code = `import "NonFungibleToken"
import "MetadataViews"
import "ViewResolver"`

      const dependencies = (vibeSDK as any).extractContractDependencies(code)
      expect(dependencies).toEqual(['NonFungibleToken', 'MetadataViews', 'ViewResolver'])
    })

    it('should determine component type correctly', () => {
      expect((vibeSDK as any).determineComponentType('HomePage')).toBe('page')
      expect((vibeSDK as any).determineComponentType('MainLayout')).toBe('layout')
      expect((vibeSDK as any).determineComponentType('NFTCard')).toBe('component')
    })

    it('should extract HTTP methods from API route code', () => {
      const code = `
export async function GET() {
  return Response.json({ message: 'Hello' })
}

export async function POST() {
  return Response.json({ message: 'Created' })
}
`
      const methods = (vibeSDK as any).extractHTTPMethods(code)
      expect(methods).toEqual(['GET', 'POST'])
    })
  })
})