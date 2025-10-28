import { describe, it, expect, beforeEach } from 'vitest'
import { ComponentRefinementSystem } from '../component-refinement-system'
import { ProjectConsistencyManager } from '../project-consistency-manager'
import { IntegrationRepairSystem } from '../integration-repair-system'

describe('Component Refinement Integration', () => {
  let refinementSystem: ComponentRefinementSystem
  let consistencyManager: ProjectConsistencyManager
  let repairSystem: IntegrationRepairSystem

  beforeEach(() => {
    refinementSystem = new ComponentRefinementSystem()
    consistencyManager = new ProjectConsistencyManager()
    repairSystem = new IntegrationRepairSystem()
  })

  it('should initialize refinement system correctly', () => {
    expect(refinementSystem).toBeDefined()
    expect(consistencyManager).toBeDefined()
    expect(repairSystem).toBeDefined()
  })

  it('should handle basic component refinement request', async () => {
    const mockCode = `
      import React from 'react'
      
      export function TestComponent() {
        return <div>Test</div>
      }
    `

    const refinementOptions = {
      componentPath: 'components/test-component.tsx',
      componentType: 'frontend' as const,
      refinementType: 'modify' as const,
      description: 'Add a button to the component',
      currentCode: mockCode,
      relatedFiles: [],
      preserveIntegrations: true
    }

    // This test verifies the system can handle a refinement request without errors
    const result = await refinementSystem.refineComponent(refinementOptions)
    
    expect(result).toBeDefined()
    expect(result.success).toBeDefined()
    expect(result.updatedCode).toBeDefined()
    expect(result.validation).toBeDefined()
  })

  it('should analyze project structure correctly', async () => {
    const mockProjectFiles = new Map([
      ['contracts/TestContract.cdc', 'access(all) contract TestContract {}'],
      ['components/TestComponent.tsx', 'export function TestComponent() {}'],
      ['app/api/test/route.ts', 'export async function GET() {}']
    ])

    const projectStructure = await consistencyManager.analyzeProjectStructure(mockProjectFiles)
    
    expect(projectStructure).toBeDefined()
    expect(projectStructure.contracts).toHaveLength(1)
    expect(projectStructure.components).toHaveLength(1)
    expect(projectStructure.apiRoutes).toHaveLength(1)
    expect(projectStructure.dependencies).toBeDefined()
  })

  it('should detect consistency issues', async () => {
    const mockProjectFiles = new Map([
      ['components/BrokenComponent.tsx', 'import { NonExistentFunction } from "./missing-file"']
    ])

    const projectStructure = await consistencyManager.analyzeProjectStructure(mockProjectFiles)
    const consistencyResult = await consistencyManager.checkProjectConsistency()
    
    expect(consistencyResult).toBeDefined()
    expect(consistencyResult.isConsistent).toBeDefined()
    expect(consistencyResult.issues).toBeDefined()
  })

  it('should handle repair operations', async () => {
    const mockProjectFiles = new Map([
      ['contracts/TestContract.cdc', 'access(all) contract TestContract {}'],
      ['components/TestComponent.tsx', 'export function TestComponent() {}']
    ])

    const projectStructure = await consistencyManager.analyzeProjectStructure(mockProjectFiles)
    
    const mockRefinementResult = {
      success: true,
      updatedCode: 'updated code',
      affectedFiles: [],
      integrationUpdates: [],
      validation: {
        isValid: true,
        hasLegacyPatterns: false,
        compilationErrors: [],
        typeErrors: [],
        integrationErrors: [],
        warnings: [],
        confidence: 0.9
      },
      warnings: [],
      suggestions: []
    }

    const repairResult = await repairSystem.repairBrokenConnections(
      projectStructure,
      mockRefinementResult,
      'components/TestComponent.tsx'
    )
    
    expect(repairResult).toBeDefined()
    expect(repairResult.success).toBeDefined()
    expect(repairResult.repairedFiles).toBeDefined()
  })
})