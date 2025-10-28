"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Icons } from "@/components/icons"
import { ProjectStructure } from "@/components/types/chat-types"

interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'nft' | 'defi' | 'dao' | 'marketplace' | 'utility' | 'custom'
  framework: string
  features: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  preview?: string
}

interface ProjectConfiguration {
  name: string
  description: string
  template: string
  framework: 'next' | 'react' | 'vue'
  styling: 'tailwind' | 'css' | 'styled-components'
  blockchain: 'flow-testnet' | 'flow-mainnet'
  features: {
    authentication: boolean
    database: boolean
    api: boolean
    deployment: boolean
    testing: boolean
    documentation: boolean
  }
  advanced: {
    typescript: boolean
    eslint: boolean
    prettier: boolean
    husky: boolean
    commitlint: boolean
    storybook: boolean
  }
  deployment: {
    platform: 'vercel' | 'netlify' | 'aws' | 'self-hosted'
    domain?: string
    environment: 'development' | 'staging' | 'production'
  }
}

interface ProjectCustomizationPanelProps {
  onProjectCreate?: (config: ProjectConfiguration) => void
  onProjectImport?: (projectData: any) => void
  onProjectExport?: (project: ProjectStructure) => void
  onTemplateSelect?: (template: ProjectTemplate) => void
  existingProject?: ProjectStructure
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'nft-collection',
    name: 'NFT Collection',
    description: 'Complete NFT collection with minting, marketplace, and gallery',
    category: 'nft',
    framework: 'Next.js',
    features: ['Smart Contract', 'Minting Interface', 'Gallery', 'Marketplace'],
    complexity: 'intermediate',
    estimatedTime: '2-3 hours'
  },
  {
    id: 'defi-staking',
    name: 'DeFi Staking Platform',
    description: 'Staking platform with rewards, governance, and analytics',
    category: 'defi',
    framework: 'Next.js',
    features: ['Staking Contract', 'Rewards System', 'Dashboard', 'Analytics'],
    complexity: 'advanced',
    estimatedTime: '4-6 hours'
  },
  {
    id: 'dao-governance',
    name: 'DAO Governance',
    description: 'Decentralized governance with proposals and voting',
    category: 'dao',
    framework: 'Next.js',
    features: ['Governance Contract', 'Proposal System', 'Voting Interface', 'Treasury'],
    complexity: 'advanced',
    estimatedTime: '3-5 hours'
  },
  {
    id: 'marketplace',
    name: 'NFT Marketplace',
    description: 'Full-featured NFT marketplace with bidding and auctions',
    category: 'marketplace',
    framework: 'Next.js',
    features: ['Marketplace Contract', 'Bidding System', 'User Profiles', 'Search & Filter'],
    complexity: 'advanced',
    estimatedTime: '5-8 hours'
  },
  {
    id: 'token-launchpad',
    name: 'Token Launchpad',
    description: 'Token creation and launch platform with presale features',
    category: 'defi',
    framework: 'Next.js',
    features: ['Token Contract', 'Presale System', 'Vesting', 'Analytics'],
    complexity: 'intermediate',
    estimatedTime: '3-4 hours'
  },
  {
    id: 'multisig-wallet',
    name: 'Multi-Signature Wallet',
    description: 'Secure multi-signature wallet with transaction management',
    category: 'utility',
    framework: 'Next.js',
    features: ['MultiSig Contract', 'Transaction Queue', 'Approval System', 'Security'],
    complexity: 'advanced',
    estimatedTime: '4-6 hours'
  }
]

export function ProjectCustomizationPanel({
  onProjectCreate,
  onProjectImport,
  onProjectExport,
  onTemplateSelect,
  existingProject
}: ProjectCustomizationPanelProps) {
  const [activeTab, setActiveTab] = useState("templates")
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [configuration, setConfiguration] = useState<ProjectConfiguration>({
    name: '',
    description: '',
    template: '',
    framework: 'next',
    styling: 'tailwind',
    blockchain: 'flow-testnet',
    features: {
      authentication: true,
      database: false,
      api: true,
      deployment: true,
      testing: false,
      documentation: true
    },
    advanced: {
      typescript: true,
      eslint: true,
      prettier: true,
      husky: false,
      commitlint: false,
      storybook: false
    },
    deployment: {
      platform: 'vercel',
      environment: 'development'
    }
  })
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'features']))

  // Load existing project configuration if provided
  useEffect(() => {
    if (existingProject) {
      setConfiguration(prev => ({
        ...prev,
        name: existingProject.name,
        description: existingProject.description,
        framework: 'next' // Default since we know it's Next.js
      }))
    }
  }, [existingProject])

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setConfiguration(prev => ({
      ...prev,
      template: template.id,
      name: template.name.toLowerCase().replace(/\s+/g, '-'),
      description: template.description
    }))
    onTemplateSelect?.(template)
  }

  const handleConfigurationChange = (key: keyof ProjectConfiguration, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleFeatureToggle = (feature: keyof ProjectConfiguration['features']) => {
    setConfiguration(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }))
  }

  const handleAdvancedToggle = (option: keyof ProjectConfiguration['advanced']) => {
    setConfiguration(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [option]: !prev.advanced[option]
      }
    }))
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleCreateProject = () => {
    if (!configuration.name.trim()) {
      alert('Please enter a project name')
      return
    }
    onProjectCreate?.(configuration)
  }

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target?.result as string)
          onProjectImport?.(projectData)
        } catch (error) {
          alert('Invalid project file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const getCategoryColor = (category: ProjectTemplate['category']) => {
    switch (category) {
      case 'nft': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'defi': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'dao': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'marketplace': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'utility': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getComplexityColor = (complexity: ProjectTemplate['complexity']) => {
    switch (complexity) {
      case 'beginner': return 'text-green-600'
      case 'intermediate': return 'text-yellow-600'
      case 'advanced': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Icons.settings className="h-5 w-5" />
            Project Customization
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create, customize, and manage your full-stack dApp projects
          </p>
        </CardHeader>
      </Card>

      <Card className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0">
            <TabsContent value="templates" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PROJECT_TEMPLATES.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                              </p>
                            </div>
                            <Badge className={getCategoryColor(template.category)}>
                              {template.category.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Framework:</span>
                              <span>{template.framework}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Complexity:</span>
                              <span className={`font-medium ${getComplexityColor(template.complexity)}`}>
                                {template.complexity}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Est. Time:</span>
                              <span>{template.estimatedTime}</span>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Features:</p>
                              <div className="flex flex-wrap gap-1">
                                {template.features.map((feature, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="configuration" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  {/* Basic Configuration */}
                  <Collapsible
                    open={expandedSections.has('basic')}
                    onOpenChange={() => toggleSection('basic')}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50">
                      <Icons.chevronRight className={`h-4 w-4 transition-transform ${expandedSections.has('basic') ? 'rotate-90' : ''}`} />
                      <h3 className="font-semibold">Basic Configuration</h3>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="project-name">Project Name</Label>
                          <Input
                            id="project-name"
                            value={configuration.name}
                            onChange={(e) => handleConfigurationChange('name', e.target.value)}
                            placeholder="my-dapp-project"
                          />
                        </div>
                        <div>
                          <Label htmlFor="template">Template</Label>
                          <Select
                            value={configuration.template}
                            onValueChange={(value) => {
                              const template = PROJECT_TEMPLATES.find(t => t.id === value)
                              if (template) handleTemplateSelect(template)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROJECT_TEMPLATES.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={configuration.description}
                          onChange={(e) => handleConfigurationChange('description', e.target.value)}
                          placeholder="Describe your dApp project..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="framework">Framework</Label>
                          <Select
                            value={configuration.framework}
                            onValueChange={(value) => handleConfigurationChange('framework', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="next">Next.js</SelectItem>
                              <SelectItem value="react">React</SelectItem>
                              <SelectItem value="vue">Vue.js</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="styling">Styling</Label>
                          <Select
                            value={configuration.styling}
                            onValueChange={(value) => handleConfigurationChange('styling', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                              <SelectItem value="css">CSS Modules</SelectItem>
                              <SelectItem value="styled-components">Styled Components</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="blockchain">Blockchain</Label>
                          <Select
                            value={configuration.blockchain}
                            onValueChange={(value) => handleConfigurationChange('blockchain', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flow-testnet">Flow Testnet</SelectItem>
                              <SelectItem value="flow-mainnet">Flow Mainnet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />

                  {/* Features Configuration */}
                  <Collapsible
                    open={expandedSections.has('features')}
                    onOpenChange={() => toggleSection('features')}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50">
                      <Icons.chevronRight className={`h-4 w-4 transition-transform ${expandedSections.has('features') ? 'rotate-90' : ''}`} />
                      <h3 className="font-semibold">Features</h3>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(configuration.features).map(([feature, enabled]) => (
                          <div key={feature} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <Label className="font-medium capitalize">
                                {feature.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {getFeatureDescription(feature)}
                              </p>
                            </div>
                            <Switch
                              checked={enabled}
                              onCheckedChange={() => handleFeatureToggle(feature as keyof ProjectConfiguration['features'])}
                            />
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />

                  {/* Deployment Configuration */}
                  <Collapsible
                    open={expandedSections.has('deployment')}
                    onOpenChange={() => toggleSection('deployment')}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50">
                      <Icons.chevronRight className={`h-4 w-4 transition-transform ${expandedSections.has('deployment') ? 'rotate-90' : ''}`} />
                      <h3 className="font-semibold">Deployment</h3>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="platform">Platform</Label>
                          <Select
                            value={configuration.deployment.platform}
                            onValueChange={(value) => handleConfigurationChange('deployment', {
                              ...configuration.deployment,
                              platform: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vercel">Vercel</SelectItem>
                              <SelectItem value="netlify">Netlify</SelectItem>
                              <SelectItem value="aws">AWS</SelectItem>
                              <SelectItem value="self-hosted">Self-hosted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="environment">Environment</Label>
                          <Select
                            value={configuration.deployment.environment}
                            onValueChange={(value) => handleConfigurationChange('deployment', {
                              ...configuration.deployment,
                              environment: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="development">Development</SelectItem>
                              <SelectItem value="staging">Staging</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="domain">Custom Domain (Optional)</Label>
                        <Input
                          id="domain"
                          value={configuration.deployment.domain || ''}
                          onChange={(e) => handleConfigurationChange('deployment', {
                            ...configuration.deployment,
                            domain: e.target.value
                          })}
                          placeholder="mydapp.com"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Create Project Button */}
                  <div className="pt-4">
                    <Button onClick={handleCreateProject} className="w-full" size="lg">
                      <Icons.plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="import-export" className="flex-1 mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Import Project</h3>
                  <div className="space-y-4">
                    <Alert>
                      <Icons.info className="h-4 w-4" />
                      <AlertDescription>
                        Import a previously exported project configuration or a project from another source.
                      </AlertDescription>
                    </Alert>
                    <div>
                      <Label htmlFor="import-file">Select Project File</Label>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={handleImportProject}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Export Project</h3>
                  <div className="space-y-4">
                    <Alert>
                      <Icons.info className="h-4 w-4" />
                      <AlertDescription>
                        Export your project configuration to share with others or backup your settings.
                      </AlertDescription>
                    </Alert>
                    {existingProject ? (
                      <Button
                        onClick={() => onProjectExport?.(existingProject)}
                        className="w-full"
                        variant="outline"
                      >
                        <Icons.download className="h-4 w-4 mr-2" />
                        Export Current Project
                      </Button>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No project selected for export
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Development Tools</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(configuration.advanced).map(([option, enabled]) => (
                        <div key={option} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <Label className="font-medium capitalize">
                              {option.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {getAdvancedOptionDescription(option)}
                            </p>
                          </div>
                          <Switch
                            checked={enabled}
                            onCheckedChange={() => handleAdvancedToggle(option as keyof ProjectConfiguration['advanced'])}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4">Configuration Preview</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <pre className="text-xs bg-muted/50 p-4 rounded overflow-auto">
                          {JSON.stringify(configuration, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}

// Helper functions
function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    authentication: 'User login and wallet connection',
    database: 'Data persistence and storage',
    api: 'Backend API routes and endpoints',
    deployment: 'Automated deployment configuration',
    testing: 'Unit and integration tests',
    documentation: 'Auto-generated documentation'
  }
  return descriptions[feature] || 'Feature configuration'
}

function getAdvancedOptionDescription(option: string): string {
  const descriptions: Record<string, string> = {
    typescript: 'Type-safe development with TypeScript',
    eslint: 'Code linting and quality checks',
    prettier: 'Code formatting and style consistency',
    husky: 'Git hooks for pre-commit checks',
    commitlint: 'Conventional commit message linting',
    storybook: 'Component documentation and testing'
  }
  return descriptions[option] || 'Advanced development option'
}