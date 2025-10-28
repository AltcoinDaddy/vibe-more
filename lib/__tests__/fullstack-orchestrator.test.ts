import { FullStackOrchestrator } from '../fullstack-orchestrator'
import { FullStackProjectRequest } from '../vibesdk'

describe('FullStackOrchestrator', () => {
  let orchestrator: FullStackOrchestrator

  beforeEach(() => {
    orchestrator = new FullStackOrchestrator()
  })

  test('should initialize without errors', () => {
    expect(orchestrator).toBeDefined()
    expect(orchestrator.getProgress().phase).toBe('parsing')
    expect(orchestrator.getProgress().progress).toBe(0)
  })

  test('should generate full-stack project', async () => {
    const request: FullStackProjectRequest = {
      description: 'A simple NFT marketplace',
      projectName: 'test-marketplace',
      features: [
        {
          type: 'nft',
          specifications: { name: 'TestNFT', symbol: 'TNFT' },
          priority: 'high'
        },
        {
          type: 'marketplace',
          specifications: { commission: 2.5 },
          priority: 'high'
        }
      ],
      uiRequirements: {
        pages: [
          { name: 'Home', route: '/', purpose: 'Landing page', contractInteractions: [], layout: 'default' },
          { name: 'Marketplace', route: '/marketplace', purpose: 'NFT listings', contractInteractions: ['marketplace'], layout: 'default' }
        ],
        components: [
          { name: 'NFTCard', type: 'display', functionality: ['show NFT'], contractBindings: ['nft'] },
          { name: 'MintForm', type: 'form', functionality: ['mint NFT'], contractBindings: ['nft'] }
        ],
        styling: {
          theme: 'light',
          framework: 'tailwind'
        },
        responsive: true,
        accessibility: true
      },
      deploymentRequirements: {
        target: 'vercel',
        environment: 'development'
      },
      advancedOptions: {
        typescript: true,
        testing: true,
        linting: true,
        formatting: true,
        documentation: true
      }
    }

    const result = await orchestrator.generateFullStackProject(request)

    expect(result).toBeDefined()
    expect(result.smartContracts).toBeDefined()
    expect(result.frontendComponents).toBeDefined()
    expect(result.apiRoutes).toBeDefined()
    expect(result.configurations).toBeDefined()
    expect(result.projectStructure).toBeDefined()
    expect(result.integrationCode).toBeDefined()

    // Check that contracts were generated
    expect(result.smartContracts.length).toBeGreaterThan(0)
    
    // Check that components were generated
    expect(result.frontendComponents.length).toBeGreaterThan(0)
    
    // Check that configurations were generated
    expect(result.configurations.length).toBeGreaterThan(0)

    // Check final progress
    const finalProgress = orchestrator.getProgress()
    expect(finalProgress.phase).toBe('complete')
    expect(finalProgress.progress).toBe(100)
  }, 30000) // 30 second timeout for full generation

  test('should handle empty requests gracefully', async () => {
    const emptyRequest: FullStackProjectRequest = {
      description: '',
      projectName: '',
      features: [],
      uiRequirements: {
        pages: [],
        components: [],
        styling: { theme: 'light', framework: 'tailwind' },
        responsive: false,
        accessibility: false
      },
      deploymentRequirements: {
        target: 'vercel',
        environment: 'development'
      },
      advancedOptions: {
        typescript: true,
        testing: false,
        linting: false,
        formatting: false,
        documentation: false
      }
    }

    const result = await orchestrator.generateFullStackProject(emptyRequest)
    
    // Should still generate basic project structure even with empty request
    expect(result).toBeDefined()
    expect(result.configurations.length).toBeGreaterThan(0) // Should at least have package.json, etc.
    
    const progress = orchestrator.getProgress()
    expect(progress.phase).toBe('complete')
  })

  test('should track progress correctly', async () => {
    const progressUpdates: string[] = []
    
    const orchestratorWithCallback = new FullStackOrchestrator((progress) => {
      progressUpdates.push(`${progress.phase}: ${progress.progress}%`)
    })

    const request: FullStackProjectRequest = {
      description: 'Simple test project',
      projectName: 'test-project',
      features: [{ type: 'nft', specifications: {}, priority: 'high' }],
      uiRequirements: {
        pages: [{ name: 'Home', route: '/', purpose: 'Test', contractInteractions: [], layout: 'default' }],
        components: [{ name: 'TestComponent', type: 'display', functionality: [], contractBindings: [] }],
        styling: { theme: 'light', framework: 'tailwind' },
        responsive: true,
        accessibility: true
      },
      deploymentRequirements: { target: 'vercel', environment: 'development' },
      advancedOptions: { typescript: true, testing: false, linting: false, formatting: false, documentation: false }
    }

    await orchestratorWithCallback.generateFullStackProject(request)

    expect(progressUpdates.length).toBeGreaterThan(0)
    expect(progressUpdates[progressUpdates.length - 1]).toContain('complete: 100%')
  }, 30000)
})