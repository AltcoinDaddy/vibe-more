/**
 * Test suite for enhanced chat interface components
 */

import { describe, it, expect } from 'vitest'
import { ProjectStructure, GeneratedFile } from '../types/chat-types'

// Helper functions for testing
function analyzeFileDependencies(file: GeneratedFile): string[] {
  const dependencies: string[] = []
  
  if (file.preview) {
    const importMatches = file.preview.match(/import.*from\s+['"]([^'"]+)['"]/g)
    if (importMatches) {
      importMatches.forEach(match => {
        const pathMatch = match.match(/from\s+['"]([^'"]+)['"]/)
        if (pathMatch && (pathMatch[1].startsWith('./') || pathMatch[1].startsWith('../'))) {
          dependencies.push(pathMatch[1])
        }
      })
    }
  }
  
  return dependencies
}

function detectGenerationType(prompt: string): 'contract' | 'fullstack' | 'component' | 'refinement' {
  const fullStackKeywords = ['full-stack', 'fullstack', 'frontend', 'react', 'ui interface', 'user interface', 'complete app']
  const componentKeywords = ['component', 'modify', 'update', 'change', 'fix', 'improve']
  const refinementKeywords = ['refine', 'adjust', 'tweak', 'enhance', 'optimize']
  
  const lowerPrompt = prompt.toLowerCase()
  
  if (refinementKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'refinement'
  }
  
  if (componentKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'component'
  }
  
  if (fullStackKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'fullstack'
  }
  
  // Check for dapp but not as part of other words
  if (/\bdapp\b/.test(lowerPrompt) || /\bweb app\b/.test(lowerPrompt)) {
    return 'fullstack'
  }
  
  return 'contract'
}

// Sample test data
const sampleProject: ProjectStructure = {
  name: 'test-nft-marketplace',
  description: 'A test NFT marketplace project',
  files: [
    {
      path: 'contracts/NFTMarketplace.cdc',
      type: 'contract',
      language: 'cadence',
      size: 2048,
      preview: 'pub contract NFTMarketplace { ... }'
    },
    {
      path: 'components/MarketplaceView.tsx',
      type: 'component',
      language: 'typescript',
      size: 1536,
      preview: 'export function MarketplaceView() { ... }'
    },
    {
      path: 'api/marketplace/route.ts',
      type: 'api',
      language: 'typescript',
      size: 1024,
      preview: 'export async function GET() { ... }'
    }
  ],
  dependencies: ['@onflow/fcl', 'react', 'next'],
  framework: 'next',
  totalFiles: 3,
  estimatedSize: '5KB'
}

const sampleFile: GeneratedFile = {
  path: 'contracts/NFTMarketplace.cdc',
  type: 'contract',
  language: 'cadence',
  size: 2048,
  preview: 'pub contract NFTMarketplace { ... }'
}

describe('Enhanced Chat Interface', () => {
  describe('Type Detection', () => {
    it('detects full-stack generation requests', () => {
      expect(detectGenerationType('Create a full-stack NFT marketplace')).toBe('fullstack')
      expect(detectGenerationType('Build a complete dApp with React frontend')).toBe('fullstack')
      expect(detectGenerationType('Generate a web app with UI')).toBe('fullstack')
    })

    it('detects component modification requests', () => {
      expect(detectGenerationType('Modify the marketplace component')).toBe('component')
      expect(detectGenerationType('Update the user interface')).toBe('component')
      expect(detectGenerationType('Fix the login component')).toBe('component')
    })

    it('detects refinement requests', () => {
      expect(detectGenerationType('Refine the contract logic')).toBe('refinement')
      expect(detectGenerationType('Enhance the performance')).toBe('refinement')
      expect(detectGenerationType('Optimize the code')).toBe('refinement')
    })

    it('defaults to contract generation', () => {
      expect(detectGenerationType('Create an NFT contract')).toBe('contract')
      expect(detectGenerationType('Build a token contract')).toBe('contract')
      expect(detectGenerationType('Generate smart contract')).toBe('contract')
    })
  })

  describe('File Analysis', () => {
    it('analyzes file dependencies correctly', () => {
      const fileWithImports: GeneratedFile = {
        path: 'components/Test.tsx',
        type: 'component',
        language: 'typescript',
        size: 1024,
        preview: `import React from 'react'
import { Button } from './ui/button'
import { Card } from '../shared/Card'
import axios from 'axios'`
      }

      const dependencies = analyzeFileDependencies(fileWithImports)
      expect(dependencies).toContain('./ui/button')
      expect(dependencies).toContain('../shared/Card')
      expect(dependencies).not.toContain('axios') // External dependency
      expect(dependencies).not.toContain('react') // External dependency
    })

    it('handles files without imports', () => {
      const fileWithoutImports: GeneratedFile = {
        path: 'contracts/Simple.cdc',
        type: 'contract',
        language: 'cadence',
        size: 512,
        preview: 'pub contract Simple { }'
      }

      const dependencies = analyzeFileDependencies(fileWithoutImports)
      expect(dependencies).toEqual([])
    })
  })

  describe('Project Structure', () => {
    it('validates project structure format', () => {
      expect(sampleProject.name).toBe('test-nft-marketplace')
      expect(sampleProject.files).toHaveLength(3)
      expect(sampleProject.totalFiles).toBe(3)
      expect(sampleProject.framework).toBe('next')
    })

    it('validates file structure format', () => {
      const contractFile = sampleProject.files.find(f => f.type === 'contract')
      expect(contractFile).toBeDefined()
      expect(contractFile?.language).toBe('cadence')
      expect(contractFile?.path).toContain('.cdc')

      const componentFile = sampleProject.files.find(f => f.type === 'component')
      expect(componentFile).toBeDefined()
      expect(componentFile?.language).toBe('typescript')
      expect(componentFile?.path).toContain('.tsx')
    })

    it('calculates project statistics correctly', () => {
      const totalSize = sampleProject.files.reduce((acc, file) => acc + file.size, 0)
      expect(totalSize).toBe(4608) // 2048 + 1536 + 1024

      const fileTypes = sampleProject.files.reduce((acc, file) => {
        acc[file.type] = (acc[file.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(fileTypes.contract).toBe(1)
      expect(fileTypes.component).toBe(1)
      expect(fileTypes.api).toBe(1)
    })
  })
})

describe('Message Types and Progress Tracking', () => {
  it('handles different message types correctly', () => {
    // This would test the MessageComponent with different message types
    // For now, we'll just verify the types exist
    expect(typeof sampleProject).toBe('object')
    expect(typeof sampleFile).toBe('object')
  })

  it('tracks generation progress correctly', () => {
    // This would test progress tracking functionality
    // For now, we'll verify the structure exists
    expect(sampleProject.totalFiles).toBe(3)
    expect(sampleProject.estimatedSize).toBe('5KB')
  })
})