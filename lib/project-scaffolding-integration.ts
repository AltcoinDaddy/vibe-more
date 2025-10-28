import { ProjectStructureGenerator } from './project-structure-generator'
import { ConfigurationGenerator } from './configuration-generator'
import { DeploymentScriptGenerator } from './deployment-script-generator'
import { 
  ProjectStructure, 
  GeneratedConfig, 
  FullStackProjectRequest,
  AdvancedOptions,
  DeploymentRequirements
} from './vibesdk'

export interface ProjectScaffoldingOptions {
  projectName: string
  description: string
  framework: 'next' | 'react'
  styling: 'tailwind' | 'css'
  includeContracts: boolean
  includeFrontend: boolean
  includeAPI: boolean
  deploymentTarget: 'vercel' | 'netlify' | 'self-hosted'
  advancedOptions: AdvancedOptions
  customDomain?: string
  environmentVariables?: Record<string, string>
}

export interface CompleteProjectStructure {
  projectStructure: ProjectStructure
  configurations: GeneratedConfig[]
  deploymentFiles: GeneratedConfig[]
  metadata: ProjectMetadata
}

export interface ProjectMetadata {
  name: string
  description: string
  framework: string
  styling: string
  features: string[]
  deploymentTarget: string
  createdAt: Date
  totalFiles: number
  estimatedSetupTime: string
}

/**
 * Project Scaffolding Integration
 * Orchestrates the complete project scaffolding process
 */
export class ProjectScaffoldingIntegration {
  private options: ProjectScaffoldingOptions

  constructor(options: ProjectScaffoldingOptions) {
    this.options = options
  }

  /**
   * Generate complete project scaffolding
   */
  generateCompleteProject(): CompleteProjectStructure {
    console.log(`[ProjectScaffolding] Generating complete project: ${this.options.projectName}`)

    // Generate project structure
    const structureGenerator = new ProjectStructureGenerator(this.options.projectName, {
      projectName: this.options.projectName,
      includeContracts: this.options.includeContracts,
      includeFrontend: this.options.includeFrontend,
      includeAPI: this.options.includeAPI,
      framework: this.options.framework,
      styling: this.options.styling,
      typescript: this.options.advancedOptions.typescript,
      testing: this.options.advancedOptions.testing,
      linting: this.options.advancedOptions.linting
    })

    const projectStructure = structureGenerator.generateProjectStructure()
    console.log(`[ProjectScaffolding] Generated ${projectStructure.directories.length} directories and ${projectStructure.files.length} base files`)

    // Generate configurations
    const configGenerator = new ConfigurationGenerator({
      projectName: this.options.projectName,
      framework: this.options.framework,
      styling: this.options.styling,
      typescript: this.options.advancedOptions.typescript,
      testing: this.options.advancedOptions.testing,
      linting: this.options.advancedOptions.linting,
      formatting: this.options.advancedOptions.formatting,
      includeContracts: this.options.includeContracts,
      includeFrontend: this.options.includeFrontend,
      includeAPI: this.options.includeAPI,
      deploymentTarget: this.options.deploymentTarget,
      environmentVariables: this.options.environmentVariables
    })

    const configurations = configGenerator.generateAllConfigurations()
    console.log(`[ProjectScaffolding] Generated ${configurations.length} configuration files`)

    // Generate deployment files
    const deploymentGenerator = new DeploymentScriptGenerator({
      projectName: this.options.projectName,
      deploymentTarget: this.options.deploymentTarget,
      customDomain: this.options.customDomain,
      environmentVariables: this.options.environmentVariables
    })

    const deploymentFiles = deploymentGenerator.generateDeploymentFiles()
    console.log(`[ProjectScaffolding] Generated ${deploymentFiles.length} deployment files`)

    // Generate metadata
    const metadata = this.generateProjectMetadata(projectStructure, configurations, deploymentFiles)

    return {
      projectStructure,
      configurations,
      deploymentFiles,
      metadata
    }
  }

  /**
   * Generate project from full-stack request
   */
  static fromFullStackRequest(request: FullStackProjectRequest): ProjectScaffoldingIntegration {
    const options: ProjectScaffoldingOptions = {
      projectName: request.projectName,
      description: request.description,
      framework: 'next', // Default to Next.js for full-stack
      styling: request.uiRequirements.styling.framework === 'tailwind' ? 'tailwind' : 'css',
      includeContracts: request.features.some(f => ['nft', 'token', 'marketplace', 'dao', 'defi'].includes(f.type)),
      includeFrontend: request.uiRequirements.pages.length > 0 || request.uiRequirements.components.length > 0,
      includeAPI: true, // Always include API for full-stack dApps
      deploymentTarget: request.deploymentRequirements.target,
      advancedOptions: request.advancedOptions,
      customDomain: request.deploymentRequirements.customDomain,
      environmentVariables: request.deploymentRequirements.environmentVariables
    }

    return new ProjectScaffoldingIntegration(options)
  }

  /**
   * Generate project metadata
   */
  private generateProjectMetadata(
    structure: ProjectStructure,
    configs: GeneratedConfig[],
    deploymentFiles: GeneratedConfig[]
  ): ProjectMetadata {
    const features: string[] = []

    if (this.options.includeContracts) features.push('Smart Contracts')
    if (this.options.includeFrontend) features.push('React Frontend')
    if (this.options.includeAPI) features.push('API Routes')
    if (this.options.styling === 'tailwind') features.push('Tailwind CSS')
    if (this.options.advancedOptions.typescript) features.push('TypeScript')
    if (this.options.advancedOptions.testing) features.push('Testing')
    if (this.options.advancedOptions.linting) features.push('ESLint')

    const totalFiles = structure.files.length + configs.length + deploymentFiles.length

    // Estimate setup time based on complexity
    let setupMinutes = 5 // Base setup time
    if (this.options.includeContracts) setupMinutes += 3
    if (this.options.includeFrontend) setupMinutes += 5
    if (this.options.includeAPI) setupMinutes += 3
    if (this.options.advancedOptions.testing) setupMinutes += 2
    if (this.options.deploymentTarget === 'self-hosted') setupMinutes += 10

    const estimatedSetupTime = setupMinutes < 10 ? `${setupMinutes} minutes` : `${Math.ceil(setupMinutes / 5) * 5} minutes`

    return {
      name: this.options.projectName,
      description: this.options.description,
      framework: this.options.framework,
      styling: this.options.styling,
      features,
      deploymentTarget: this.options.deploymentTarget,
      createdAt: new Date(),
      totalFiles,
      estimatedSetupTime
    }
  }

  /**
   * Generate project summary
   */
  generateProjectSummary(completeProject: CompleteProjectStructure): string {
    const { metadata, projectStructure, configurations, deploymentFiles } = completeProject

    const summary = `
# ${metadata.name} - Project Summary

**Generated on:** ${metadata.createdAt.toISOString()}
**Framework:** ${metadata.framework}
**Styling:** ${metadata.styling}
**Deployment Target:** ${metadata.deploymentTarget}
**Estimated Setup Time:** ${metadata.estimatedSetupTime}

## Features
${metadata.features.map(f => `- ${f}`).join('\n')}

## Project Structure
- **Directories:** ${projectStructure.directories.length}
- **Base Files:** ${projectStructure.files.length}
- **Configuration Files:** ${configurations.length}
- **Deployment Files:** ${deploymentFiles.length}
- **Total Files:** ${metadata.totalFiles}

## Quick Start
1. Extract the generated project files
2. Run \`./scripts/setup-env.sh\` to set up environment
3. Install dependencies: \`pnpm install\`
4. Start development: \`pnpm dev\`
5. Deploy: \`./scripts/deploy.sh\`

## Key Files
### Configuration
${configurations.slice(0, 5).map(c => `- ${c.filename}`).join('\n')}

### Scripts
${deploymentFiles.filter(f => f.filename.startsWith('scripts/')).map(f => `- ${f.filename}`).join('\n')}

### Documentation
${deploymentFiles.filter(f => f.filename.includes('.md')).map(f => `- ${f.filename}`).join('\n')}

## Next Steps
1. Review and customize configuration files
2. Set up environment variables in .env.local
3. Configure deployment platform settings
4. Start building your dApp features!

---
Generated by VibeMore Full-Stack dApp Builder
`

    return summary.trim()
  }

  /**
   * Validate project options
   */
  validateOptions(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate project name
    if (!this.options.projectName || this.options.projectName.trim().length === 0) {
      errors.push('Project name is required')
    }

    if (this.options.projectName.length > 50) {
      errors.push('Project name must be 50 characters or less')
    }

    if (!/^[a-zA-Z0-9-_\s]+$/.test(this.options.projectName)) {
      errors.push('Project name contains invalid characters')
    }

    // Validate feature combinations
    if (!this.options.includeContracts && !this.options.includeFrontend && !this.options.includeAPI) {
      errors.push('At least one feature (contracts, frontend, or API) must be included')
    }

    // Validate deployment target
    if (!['vercel', 'netlify', 'self-hosted'].includes(this.options.deploymentTarget)) {
      errors.push('Invalid deployment target')
    }

    // Validate custom domain format
    if (this.options.customDomain) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
      if (!domainRegex.test(this.options.customDomain)) {
        errors.push('Invalid custom domain format')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get recommended project structure for different project types
   */
  static getRecommendedOptions(projectType: 'nft' | 'marketplace' | 'defi' | 'dao' | 'token' | 'custom'): Partial<ProjectScaffoldingOptions> {
    const baseOptions = {
      framework: 'next' as const,
      styling: 'tailwind' as const,
      advancedOptions: {
        typescript: true,
        testing: true,
        linting: true,
        formatting: true,
        documentation: true
      },
      deploymentTarget: 'vercel' as const
    }

    switch (projectType) {
      case 'nft':
        return {
          ...baseOptions,
          includeContracts: true,
          includeFrontend: true,
          includeAPI: true,
          description: 'NFT collection with minting and marketplace features'
        }

      case 'marketplace':
        return {
          ...baseOptions,
          includeContracts: true,
          includeFrontend: true,
          includeAPI: true,
          description: 'NFT marketplace with buying, selling, and auction features'
        }

      case 'defi':
        return {
          ...baseOptions,
          includeContracts: true,
          includeFrontend: true,
          includeAPI: true,
          description: 'DeFi protocol with staking, rewards, and liquidity features'
        }

      case 'dao':
        return {
          ...baseOptions,
          includeContracts: true,
          includeFrontend: true,
          includeAPI: true,
          description: 'DAO governance system with voting and proposal features'
        }

      case 'token':
        return {
          ...baseOptions,
          includeContracts: true,
          includeFrontend: true,
          includeAPI: true,
          description: 'Fungible token with transfer and management features'
        }

      case 'custom':
      default:
        return {
          ...baseOptions,
          includeContracts: true,
          includeFrontend: true,
          includeAPI: true,
          description: 'Custom dApp with smart contract integration'
        }
    }
  }
}