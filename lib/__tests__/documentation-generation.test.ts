import { describe, it, expect, beforeEach } from 'vitest'
import { DocumentationGenerator, DocumentationOptions } from '../documentation-generator'
import { CodeDocumentationGenerator, CodeDocumentationOptions } from '../code-documentation-generator'
import { GeneratedContract, GeneratedComponent, GeneratedAPIRoute, GeneratedConfig, FullStackProjectRequest } from '../vibesdk'

describe('Documentation Generation', () => {
  let documentationGenerator: DocumentationGenerator
  let codeDocumentationGenerator: CodeDocumentationGenerator

  beforeEach(() => {
    documentationGenerator = new DocumentationGenerator()
    codeDocumentationGenerator = new CodeDocumentationGenerator()
  })

  describe('DocumentationGenerator', () => {
    it('should generate comprehensive README documentation', async () => {
      const mockRequest: FullStackProjectRequest = {
        projectName: 'TestDApp',
        description: 'A test decentralized application for NFT marketplace',
        features: [
          { type: 'nft', specifications: {}, priority: 'high' }
        ],
        uiRequirements: {
          pages: [{ name: 'Home', route: '/', purpose: 'Landing page', contractInteractions: [], layout: 'default' }],
          components: [{ name: 'NFTCard', specifications: {} }],
          styling: { framework: 'tailwind', theme: 'light' },
          responsive: true,
          accessibility: true
        },
        deploymentRequirements: { target: 'vercel', environment: 'production' },
        advancedOptions: {}
      }

      const mockContracts: GeneratedContract[] = [
        {
          filename: 'NFTContract.cdc',
          code: 'pub contract NFTContract { /* contract code */ }',
          validation: { isValid: true, errors: [], warnings: [] },
          dependencies: []
        }
      ]

      const mockComponents: GeneratedComponent[] = [
        {
          filename: 'NFTCard.tsx',
          code: 'export function NFTCard() { return <div>NFT Card</div> }',
          componentType: 'component',
          dependencies: [],
          contractIntegrations: []
        }
      ]

      const mockAPIRoutes: GeneratedAPIRoute[] = [
        {
          filename: 'app/api/nft/route.ts',
          code: 'export async function GET() { return Response.json({}) }',
          endpoint: '/api/nft',
          methods: ['GET'],
          contractCalls: []
        }
      ]

      const mockConfigs: GeneratedConfig[] = []

      const options: DocumentationOptions = {
        projectName: 'TestDApp',
        description: 'Test project',
        includeSetupInstructions: true,
        includeAPIDocumentation: true,
        includeComponentExamples: true,
        includeDeploymentGuide: true,
        includeTroubleshooting: true
      }

      const result = await documentationGenerator.generateProjectDocumentation(
        mockRequest,
        mockContracts,
        mockComponents,
        mockAPIRoutes,
        mockConfigs,
        options
      )

      expect(result.readme).toContain('# TestDApp')
      expect(result.readme).toContain('A test decentralized application for NFT marketplace')
      expect(result.readme).toContain('## Table of Contents')
      expect(result.readme).toContain('## Overview')
      expect(result.readme).toContain('## Features')
      expect(result.readme).toContain('## Prerequisites')
      expect(result.readme).toContain('## Installation')
      expect(result.readme).toContain('## Configuration')
      expect(result.readme).toContain('## Usage')
      expect(result.readme).toContain('## API Reference')
      expect(result.readme).toContain('## Components')
      expect(result.readme).toContain('## Smart Contracts')
      expect(result.readme).toContain('## Deployment')
      expect(result.readme).toContain('## Development')
      expect(result.readme).toContain('## Testing')
      expect(result.readme).toContain('## Contributing')
      expect(result.readme).toContain('## License')
    })

    it('should generate API documentation when API routes exist', async () => {
      const mockAPIRoutes: GeneratedAPIRoute[] = [
        {
          filename: 'app/api/nft/mint/route.ts',
          code: 'export async function POST() { return Response.json({}) }',
          endpoint: '/api/nft/mint',
          methods: ['POST'],
          contractCalls: [{ contractName: 'NFTContract', functionName: 'mint', parameters: [], returnType: 'String' }]
        }
      ]

      const options: DocumentationOptions = {
        projectName: 'TestDApp',
        description: 'Test project',
        includeSetupInstructions: false,
        includeAPIDocumentation: true,
        includeComponentExamples: false,
        includeDeploymentGuide: false,
        includeTroubleshooting: false
      }

      const mockRequest: FullStackProjectRequest = {
        projectName: 'TestDApp',
        description: 'Test project',
        features: [],
        uiRequirements: {
          pages: [],
          components: [],
          styling: { framework: 'tailwind', theme: 'light' },
          responsive: true,
          accessibility: true
        },
        deploymentRequirements: { target: 'vercel', environment: 'production' },
        advancedOptions: {}
      }

      const result = await documentationGenerator.generateProjectDocumentation(
        mockRequest,
        [],
        [],
        mockAPIRoutes,
        [],
        options
      )

      expect(result.apiDocs).toContain('# API Documentation')
      expect(result.apiDocs).toContain('## Base URL')
      expect(result.apiDocs).toContain('http://localhost:3000/api')
      expect(result.apiDocs).toContain('### nft/mint')
      expect(result.apiDocs).toContain('**Methods**: POST')
      expect(result.apiDocs).toContain('NFTContract')
    })

    it('should generate component documentation when components exist', async () => {
      const mockComponents: GeneratedComponent[] = [
        {
          filename: 'NFTCard.tsx',
          code: 'export function NFTCard(props: NFTCardProps) { return <div>NFT Card</div> }',
          componentType: 'component',
          dependencies: ['react'],
          contractIntegrations: [
            {
              contractName: 'NFTContract',
              functions: ['mint', 'transfer'],
              events: ['Minted', 'Transferred'],
              integrationCode: ''
            }
          ]
        }
      ]

      const options: DocumentationOptions = {
        projectName: 'TestDApp',
        description: 'Test project',
        includeSetupInstructions: false,
        includeAPIDocumentation: false,
        includeComponentExamples: true,
        includeDeploymentGuide: false,
        includeTroubleshooting: false
      }

      const mockRequest: FullStackProjectRequest = {
        projectName: 'TestDApp',
        description: 'Test project',
        features: [],
        uiRequirements: {
          pages: [],
          components: [],
          styling: { framework: 'tailwind', theme: 'light' },
          responsive: true,
          accessibility: true
        },
        deploymentRequirements: { target: 'vercel', environment: 'production' },
        advancedOptions: {}
      }

      const result = await documentationGenerator.generateProjectDocumentation(
        mockRequest,
        [],
        mockComponents,
        [],
        [],
        options
      )

      expect(result.componentDocs).toContain('# Component Documentation')
      expect(result.componentDocs).toContain('## NFTCard')
      expect(result.componentDocs).toContain('**Type**: component')
      expect(result.componentDocs).toContain('**File**: `NFTCard.tsx`')
      expect(result.componentDocs).toContain('**Dependencies**: react')
      expect(result.componentDocs).toContain('NFTContract')
      expect(result.componentDocs).toContain('mint, transfer')
    })
  })

  describe('CodeDocumentationGenerator', () => {
    it('should add JSDoc comments to React components', async () => {
      const mockComponents: GeneratedComponent[] = [
        {
          filename: 'NFTCard.tsx',
          code: `import React from 'react'

interface NFTCardProps {
  tokenId: string
  name: string
  image: string
}

export function NFTCard({ tokenId, name, image }: NFTCardProps) {
  return (
    <div className="nft-card">
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p>Token ID: {tokenId}</p>
    </div>
  )
}`,
          componentType: 'component',
          dependencies: [],
          contractIntegrations: []
        }
      ]

      const options: CodeDocumentationOptions = {
        includeJSDoc: true,
        includeTypeDocumentation: true,
        includeCadenceDocumentation: false,
        includeInlineComments: true,
        includeExamples: true,
        documentationStyle: 'detailed'
      }

      const result = await codeDocumentationGenerator.generateCodeDocumentation(
        [],
        mockComponents,
        [],
        options
      )

      const documentedComponent = result.documentedComponents[0]
      expect(documentedComponent.code).toContain('/**')
      expect(documentedComponent.code).toContain('* NFTCard Component')
      expect(documentedComponent.code).toContain('* @author Generated by VibeMore')
      expect(documentedComponent.code).toContain('* Props interface for NFTCard component')
      expect(documentedComponent.code).toContain('* NFTCard functional component')
      expect(documentedComponent.code).toContain('* @returns JSX element')
    })

    it('should add documentation to Cadence smart contracts', async () => {
      const mockContracts: GeneratedContract[] = [
        {
          filename: 'NFTContract.cdc',
          code: `pub contract NFTContract {
    pub resource NFT {
        pub let id: UInt64
        pub let name: String
        
        init(id: UInt64, name: String) {
            self.id = id
            self.name = name
        }
    }
    
    pub fun mintNFT(recipient: Address, name: String): @NFT {
        let nft <- create NFT(id: 1, name: name)
        return <- nft
    }
}`,
          validation: { isValid: true, errors: [], warnings: [] },
          dependencies: []
        }
      ]

      const options: CodeDocumentationOptions = {
        includeJSDoc: false,
        includeTypeDocumentation: false,
        includeCadenceDocumentation: true,
        includeInlineComments: true,
        includeExamples: true,
        documentationStyle: 'detailed'
      }

      const result = await codeDocumentationGenerator.generateCodeDocumentation(
        mockContracts,
        [],
        [],
        options
      )

      const documentedContract = result.documentedContracts[0]
      expect(documentedContract.code).toContain('/// NFTContract Smart Contract')
      expect(documentedContract.code).toContain('/// @author Generated by VibeMore')
      expect(documentedContract.code).toContain('/// Main contract implementing NFTContract functionality')
      expect(documentedContract.code).toContain('/// NFT resource')
      expect(documentedContract.code).toContain('/// mintNFT')
      expect(documentedContract.code).toContain('/// @param recipient')
      expect(documentedContract.code).toContain('/// @param name')
    })

    it('should add JSDoc comments to API routes', async () => {
      const mockAPIRoutes: GeneratedAPIRoute[] = [
        {
          filename: 'app/api/nft/mint/route.ts',
          code: `import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Mint NFT logic here
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ success: false, error: 'Minting failed' })
  }
}

function validateMintRequest(data: any) {
  // Validation logic
  return true
}`,
          endpoint: '/api/nft/mint',
          methods: ['POST'],
          contractCalls: []
        }
      ]

      const options: CodeDocumentationOptions = {
        includeJSDoc: true,
        includeTypeDocumentation: false,
        includeCadenceDocumentation: false,
        includeInlineComments: true,
        includeExamples: true,
        documentationStyle: 'detailed'
      }

      const result = await codeDocumentationGenerator.generateCodeDocumentation(
        [],
        [],
        mockAPIRoutes,
        options
      )

      const documentedRoute = result.documentedAPIRoutes[0]
      expect(documentedRoute.code).toContain('/**')
      expect(documentedRoute.code).toContain('* nft/mint API Route')
      expect(documentedRoute.code).toContain('* @author Generated by VibeMore')
      expect(documentedRoute.code).toContain('* Handle POST requests')
      expect(documentedRoute.code).toContain('* @param request - Next.js request object')
      expect(documentedRoute.code).toContain('* @returns Promise<Response>')
      expect(documentedRoute.code).toContain('* validateMintRequest helper function')
    })

    it('should generate TypeScript type documentation', async () => {
      const mockComponents: GeneratedComponent[] = [
        {
          filename: 'NFTCard.tsx',
          code: `interface NFTCardProps {
  tokenId: string
  name: string
  image?: string
  onClick?: () => void
}

export function NFTCard(props: NFTCardProps) {
  return <div>NFT Card</div>
}`,
          componentType: 'component',
          dependencies: [],
          contractIntegrations: []
        }
      ]

      const options: CodeDocumentationOptions = {
        includeJSDoc: false,
        includeTypeDocumentation: true,
        includeCadenceDocumentation: false,
        includeInlineComments: false,
        includeExamples: true,
        documentationStyle: 'detailed'
      }

      const result = await codeDocumentationGenerator.generateCodeDocumentation(
        [],
        mockComponents,
        [],
        options
      )

      expect(result.typeDocumentation).toHaveLength(1)
      const typeDoc = result.typeDocumentation[0]
      expect(typeDoc.name).toBe('NFTCardProps')
      expect(typeDoc.description).toContain('Props interface for the NFTCard component')
      expect(typeDoc.properties).toBeDefined()
      expect(typeDoc.properties?.length).toBeGreaterThan(0)
      expect(typeDoc.examples).toBeDefined()
      expect(typeDoc.examples?.length).toBeGreaterThan(0)
    })
  })

  describe('Integration', () => {
    it('should handle empty inputs gracefully', async () => {
      const options: CodeDocumentationOptions = {
        includeJSDoc: true,
        includeTypeDocumentation: true,
        includeCadenceDocumentation: true,
        includeInlineComments: true,
        includeExamples: true,
        documentationStyle: 'detailed'
      }

      const result = await codeDocumentationGenerator.generateCodeDocumentation(
        [],
        [],
        [],
        options
      )

      expect(result.documentedContracts).toEqual([])
      expect(result.documentedComponents).toEqual([])
      expect(result.documentedAPIRoutes).toEqual([])
      expect(result.typeDocumentation).toEqual([])
    })

    it('should respect documentation style options', async () => {
      const mockComponents: GeneratedComponent[] = [
        {
          filename: 'SimpleComponent.tsx',
          code: 'export function SimpleComponent() { return <div>Simple</div> }',
          componentType: 'component',
          dependencies: [],
          contractIntegrations: []
        }
      ]

      const minimalOptions: CodeDocumentationOptions = {
        includeJSDoc: true,
        includeTypeDocumentation: false,
        includeCadenceDocumentation: false,
        includeInlineComments: false,
        includeExamples: false,
        documentationStyle: 'minimal'
      }

      const result = await codeDocumentationGenerator.generateCodeDocumentation(
        [],
        mockComponents,
        [],
        minimalOptions
      )

      const documentedComponent = result.documentedComponents[0]
      expect(documentedComponent.code).toContain('/**')
      expect(documentedComponent.code).toContain('* SimpleComponent Component')
      // Should not contain examples in minimal style
      expect(documentedComponent.code).not.toContain('@example')
    })
  })
})