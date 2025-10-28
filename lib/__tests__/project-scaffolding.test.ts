import { describe, it, expect } from 'vitest'
import { ProjectStructureGenerator } from '../project-structure-generator'
import { ConfigurationGenerator } from '../configuration-generator'
import { DeploymentScriptGenerator } from '../deployment-script-generator'

describe('Project Scaffolding System', () => {
  describe('ProjectStructureGenerator', () => {
    it('should generate basic project structure', () => {
      const generator = new ProjectStructureGenerator('test-dapp', {
        projectName: 'test-dapp',
        includeContracts: true,
        includeFrontend: true,
        includeAPI: true,
        framework: 'next',
        styling: 'tailwind',
        typescript: true,
        testing: true,
        linting: true
      })

      const structure = generator.generateProjectStructure()

      expect(structure.directories).toBeDefined()
      expect(structure.files).toBeDefined()
      expect(structure.configurations).toBeDefined()

      // Check for essential directories
      const dirNames = structure.directories.map(d => d.name)
      expect(dirNames).toContain('app')
      expect(dirNames).toContain('components')
      expect(dirNames).toContain('lib')
    })

    it('should generate files based on options', () => {
      const generator = new ProjectStructureGenerator('test-dapp', {
        projectName: 'test-dapp',
        includeContracts: true,
        includeFrontend: true,
        includeAPI: true,
        framework: 'next',
        styling: 'tailwind',
        typescript: true,
        testing: true,
        linting: true
      })

      const structure = generator.generateProjectStructure()

      // Check for essential files
      const fileNames = structure.files.map(f => f.name)
      expect(fileNames).toContain('layout.tsx')
      expect(fileNames).toContain('page.tsx')
      expect(fileNames).toContain('utils.ts')
      expect(fileNames).toContain('README.md')
    })
  })

  describe('ConfigurationGenerator', () => {
    it('should generate all configuration files', () => {
      const generator = new ConfigurationGenerator({
        projectName: 'test-dapp',
        framework: 'next',
        styling: 'tailwind',
        typescript: true,
        testing: true,
        linting: true,
        formatting: true,
        includeContracts: true,
        includeFrontend: true,
        includeAPI: true,
        deploymentTarget: 'vercel'
      })

      const configs = generator.generateAllConfigurations()

      expect(configs.length).toBeGreaterThan(0)

      // Check for essential configurations
      const configNames = configs.map(c => c.filename)
      expect(configNames).toContain('package.json')
      expect(configNames).toContain('next.config.mjs')
      expect(configNames).toContain('tsconfig.json')
      expect(configNames).toContain('tailwind.config.ts')
    })

    it('should generate valid package.json', () => {
      const generator = new ConfigurationGenerator({
        projectName: 'test-dapp',
        framework: 'next',
        styling: 'tailwind',
        typescript: true,
        testing: true,
        linting: true,
        formatting: false,
        includeContracts: true,
        includeFrontend: true,
        includeAPI: true,
        deploymentTarget: 'vercel'
      })

      const configs = generator.generateAllConfigurations()
      const packageJson = configs.find(c => c.filename === 'package.json')

      expect(packageJson).toBeDefined()
      expect(() => JSON.parse(packageJson!.code)).not.toThrow()

      const parsed = JSON.parse(packageJson!.code)
      expect(parsed.name).toBe('test-dapp')
      expect(parsed.dependencies).toBeDefined()
      expect(parsed.devDependencies).toBeDefined()
      expect(parsed.scripts).toBeDefined()
    })
  })

  describe('DeploymentScriptGenerator', () => {
    it('should generate deployment files for different targets', () => {
      const targets: Array<'vercel' | 'netlify' | 'self-hosted'> = ['vercel', 'netlify', 'self-hosted']

      targets.forEach(target => {
        const generator = new DeploymentScriptGenerator({
          projectName: 'test-dapp',
          deploymentTarget: target,
          buildCommand: 'pnpm build',
          outputDirectory: target === 'netlify' ? 'out' : '.next'
        })

        const files = generator.generateDeploymentFiles()

        expect(files.length).toBeGreaterThan(0)

        // Check for common files
        const fileNames = files.map(f => f.filename)
        expect(fileNames).toContain('scripts/deploy.sh')
        expect(fileNames).toContain('scripts/build.sh')
      })
    })

    it('should generate platform-specific guides', () => {
      const generator = new DeploymentScriptGenerator({
        projectName: 'test-dapp',
        deploymentTarget: 'vercel',
        customDomain: 'example.com'
      })

      const files = generator.generateDeploymentFiles()
      const guide = files.find(f => f.filename.includes('VERCEL_DEPLOYMENT'))

      expect(guide).toBeDefined()
      expect(guide!.code).toContain('Vercel')
      expect(guide!.code).toContain('test-dapp')
    })
  })

  describe('Integration', () => {
    it('should work together to create complete project structure', () => {
      const projectName = 'integration-test-dapp'
      
      // Generate project structure
      const structureGenerator = new ProjectStructureGenerator(projectName, {
        projectName,
        includeContracts: true,
        includeFrontend: true,
        includeAPI: true,
        framework: 'next',
        styling: 'tailwind',
        typescript: true,
        testing: true,
        linting: true
      })

      const structure = structureGenerator.generateProjectStructure()

      // Generate configurations
      const configGenerator = new ConfigurationGenerator({
        projectName,
        framework: 'next',
        styling: 'tailwind',
        typescript: true,
        testing: true,
        linting: true,
        formatting: true,
        includeContracts: true,
        includeFrontend: true,
        includeAPI: true,
        deploymentTarget: 'vercel'
      })

      const configs = configGenerator.generateAllConfigurations()

      // Generate deployment scripts
      const deploymentGenerator = new DeploymentScriptGenerator({
        projectName,
        deploymentTarget: 'vercel'
      })

      const deploymentFiles = deploymentGenerator.generateDeploymentFiles()

      // Verify we have a complete project
      expect(structure.directories.length).toBeGreaterThan(0)
      expect(structure.files.length).toBeGreaterThan(0)
      expect(configs.length).toBeGreaterThan(0)
      expect(deploymentFiles.length).toBeGreaterThan(0)

      // Verify no duplicate files
      const allFiles = [
        ...structure.files.map(f => f.path),
        ...configs.map(c => c.filename),
        ...deploymentFiles.map(d => d.filename)
      ]

      const uniqueFiles = new Set(allFiles)
      expect(uniqueFiles.size).toBe(allFiles.length)
    })
  })
})