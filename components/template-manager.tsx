"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Icons } from "@/components/icons"

interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'nft' | 'defi' | 'dao' | 'marketplace' | 'utility' | 'custom'
  framework: string
  features: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  tags: string[]
  author: string
  version: string
  downloads: number
  rating: number
  preview?: string
  code?: {
    contracts: string[]
    components: string[]
    api: string[]
  }
}

interface TemplateManagerProps {
  onTemplateSelect?: (template: ProjectTemplate) => void
  onTemplateCreate?: (template: Partial<ProjectTemplate>) => void
  onTemplateImport?: (templateData: any) => void
  selectedTemplate?: ProjectTemplate | null
}

const FEATURED_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'nft-collection-basic',
    name: 'Basic NFT Collection',
    description: 'Simple NFT collection with minting and basic marketplace functionality',
    category: 'nft',
    framework: 'Next.js',
    features: ['Smart Contract', 'Minting Interface', 'Gallery View', 'Wallet Integration'],
    complexity: 'beginner',
    estimatedTime: '1-2 hours',
    tags: ['nft', 'minting', 'gallery', 'beginner-friendly'],
    author: 'VibeMore Team',
    version: '1.0.0',
    downloads: 1250,
    rating: 4.8,
    code: {
      contracts: ['NFTCollection.cdc', 'NFTMinter.cdc'],
      components: ['MintingInterface.tsx', 'NFTGallery.tsx', 'NFTCard.tsx'],
      api: ['mint.ts', 'metadata.ts']
    }
  },
  {
    id: 'defi-staking-advanced',
    name: 'Advanced DeFi Staking',
    description: 'Comprehensive staking platform with rewards, governance, and analytics dashboard',
    category: 'defi',
    framework: 'Next.js',
    features: ['Staking Contract', 'Rewards System', 'Governance', 'Analytics Dashboard', 'Multi-token Support'],
    complexity: 'advanced',
    estimatedTime: '4-6 hours',
    tags: ['defi', 'staking', 'rewards', 'governance', 'analytics'],
    author: 'DeFi Builders',
    version: '2.1.0',
    downloads: 890,
    rating: 4.9,
    code: {
      contracts: ['StakingPool.cdc', 'RewardsDistributor.cdc', 'Governance.cdc'],
      components: ['StakingDashboard.tsx', 'RewardsPanel.tsx', 'GovernanceInterface.tsx'],
      api: ['staking.ts', 'rewards.ts', 'governance.ts']
    }
  },
  {
    id: 'dao-governance-complete',
    name: 'Complete DAO Governance',
    description: 'Full-featured DAO with proposals, voting, treasury management, and member system',
    category: 'dao',
    framework: 'Next.js',
    features: ['Governance Contract', 'Proposal System', 'Voting Mechanism', 'Treasury Management', 'Member Roles'],
    complexity: 'advanced',
    estimatedTime: '5-8 hours',
    tags: ['dao', 'governance', 'voting', 'treasury', 'proposals'],
    author: 'DAO Collective',
    version: '1.5.0',
    downloads: 650,
    rating: 4.7,
    code: {
      contracts: ['DAOGovernance.cdc', 'ProposalManager.cdc', 'Treasury.cdc'],
      components: ['ProposalList.tsx', 'VotingInterface.tsx', 'TreasuryDashboard.tsx'],
      api: ['proposals.ts', 'voting.ts', 'treasury.ts']
    }
  },
  {
    id: 'marketplace-pro',
    name: 'Professional Marketplace',
    description: 'Enterprise-grade NFT marketplace with advanced features and analytics',
    category: 'marketplace',
    framework: 'Next.js',
    features: ['Marketplace Contract', 'Bidding System', 'Auction House', 'User Profiles', 'Analytics', 'Admin Panel'],
    complexity: 'advanced',
    estimatedTime: '6-10 hours',
    tags: ['marketplace', 'bidding', 'auctions', 'analytics', 'enterprise'],
    author: 'Marketplace Pro',
    version: '3.0.0',
    downloads: 420,
    rating: 4.6,
    code: {
      contracts: ['Marketplace.cdc', 'AuctionHouse.cdc', 'UserProfiles.cdc'],
      components: ['MarketplaceGrid.tsx', 'AuctionInterface.tsx', 'UserProfile.tsx'],
      api: ['marketplace.ts', 'auctions.ts', 'users.ts']
    }
  },
  {
    id: 'token-launchpad-simple',
    name: 'Simple Token Launchpad',
    description: 'Easy-to-use token creation and launch platform with presale features',
    category: 'defi',
    framework: 'Next.js',
    features: ['Token Contract', 'Presale System', 'Launch Dashboard', 'Investor Interface'],
    complexity: 'intermediate',
    estimatedTime: '2-4 hours',
    tags: ['token', 'launchpad', 'presale', 'fundraising'],
    author: 'Launch Labs',
    version: '1.2.0',
    downloads: 780,
    rating: 4.5,
    code: {
      contracts: ['TokenLaunchpad.cdc', 'PresaleManager.cdc'],
      components: ['LaunchDashboard.tsx', 'PresaleInterface.tsx', 'TokenInfo.tsx'],
      api: ['launch.ts', 'presale.ts']
    }
  },
  {
    id: 'multisig-wallet-secure',
    name: 'Secure MultiSig Wallet',
    description: 'High-security multi-signature wallet with advanced transaction management',
    category: 'utility',
    framework: 'Next.js',
    features: ['MultiSig Contract', 'Transaction Queue', 'Approval System', 'Security Features', 'Audit Trail'],
    complexity: 'advanced',
    estimatedTime: '4-6 hours',
    tags: ['multisig', 'wallet', 'security', 'transactions'],
    author: 'Security First',
    version: '2.0.0',
    downloads: 340,
    rating: 4.9,
    code: {
      contracts: ['MultiSigWallet.cdc', 'TransactionManager.cdc'],
      components: ['WalletDashboard.tsx', 'TransactionQueue.tsx', 'ApprovalInterface.tsx'],
      api: ['wallet.ts', 'transactions.ts']
    }
  }
]

export function TemplateManager({
  onTemplateSelect,
  onTemplateCreate,
  onTemplateImport,
  selectedTemplate
}: TemplateManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("downloads")
  const [activeTab, setActiveTab] = useState("browse")

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = FEATURED_TEMPLATES.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
      const matchesComplexity = selectedComplexity === "all" || template.complexity === selectedComplexity
      
      return matchesSearch && matchesCategory && matchesComplexity
    })

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads
        case 'rating':
          return b.rating - a.rating
        case 'name':
          return a.name.localeCompare(b.name)
        case 'complexity':
          const complexityOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 }
          return complexityOrder[a.complexity] - complexityOrder[b.complexity]
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, selectedCategory, selectedComplexity, sortBy])

  const categories = ['all', 'nft', 'defi', 'dao', 'marketplace', 'utility', 'custom']
  const complexities = ['all', 'beginner', 'intermediate', 'advanced']

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nft': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'defi': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'dao': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'marketplace': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'utility': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'text-green-600'
      case 'intermediate': return 'text-yellow-600'
      case 'advanced': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const handleTemplateSelect = (template: ProjectTemplate) => {
    onTemplateSelect?.(template)
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Icons.layout className="h-5 w-5" />
            Template Manager
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Browse, select, and customize project templates for your dApp
          </p>
        </CardHeader>
      </Card>

      <Card className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browse">Browse Templates</TabsTrigger>
              <TabsTrigger value="create">Create Template</TabsTrigger>
              <TabsTrigger value="import">Import Template</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0">
            <TabsContent value="browse" className="flex-1 flex flex-col mt-0">
              {/* Filters and Search */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      {complexities.map(complexity => (
                        <SelectItem key={complexity} value={complexity}>
                          {complexity === 'all' ? 'All Levels' : complexity.charAt(0).toUpperCase() + complexity.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="downloads">Downloads</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="complexity">Complexity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template Grid */}
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
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
                            <CardTitle className="text-base truncate">{template.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              by {template.author} • v{template.version}
                            </p>
                          </div>
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
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
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Icons.star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{template.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icons.download className="h-3 w-3" />
                              <span>{template.downloads.toLocaleString()}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {template.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="flex-1">
                                  <Icons.eye className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>{template.name}</DialogTitle>
                                </DialogHeader>
                                <TemplatePreview template={template} />
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTemplateSelect(template)
                              }}
                            >
                              <Icons.plus className="h-3 w-3 mr-1" />
                              Use
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="create" className="flex-1 mt-0">
              <div className="text-center py-8">
                <Icons.plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Create Custom Template</h3>
                <p className="text-muted-foreground mb-4">
                  Build your own project template from scratch or based on existing projects
                </p>
                <Button onClick={() => onTemplateCreate?.({})}>
                  <Icons.plus className="h-4 w-4 mr-2" />
                  Start Creating
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="import" className="flex-1 mt-0">
              <div className="text-center py-8">
                <Icons.upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Import Template</h3>
                <p className="text-muted-foreground mb-4">
                  Import a template from a file or URL
                </p>
                <div className="space-y-4 max-w-md mx-auto">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          try {
                            const templateData = JSON.parse(event.target?.result as string)
                            onTemplateImport?.(templateData)
                          } catch (error) {
                            alert('Invalid template file format')
                          }
                        }
                        reader.readAsText(file)
                      }
                    }}
                  />
                  <Button variant="outline" className="w-full">
                    <Icons.link className="h-4 w-4 mr-2" />
                    Import from URL
                  </Button>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}

// Template Preview Component
interface TemplatePreviewProps {
  template: ProjectTemplate
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Template Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <Badge className={getCategoryColor(template.category)}>
                {template.category.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Complexity:</span>
              <span className={getComplexityColor(template.complexity)}>
                {template.complexity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework:</span>
              <span>{template.framework}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Time:</span>
              <span>{template.estimatedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Author:</span>
              <span>{template.author}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span>{template.version}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Features</h3>
          <div className="space-y-1">
            {template.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Icons.check className="h-3 w-3 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {template.code && (
        <div>
          <h3 className="font-semibold mb-3">Included Files</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Smart Contracts</h4>
              <div className="space-y-1">
                {template.code.contracts.map((contract, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded font-mono">
                    {contract}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Components</h4>
              <div className="space-y-1">
                {template.code.components.map((component, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded font-mono">
                    {component}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">API Routes</h4>
              <div className="space-y-1">
                {template.code.api.map((api, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded font-mono">
                    {api}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {template.tags.map((tag, index) => (
            <Badge key={index} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper functions (reused from previous component)
function getCategoryColor(category: string) {
  switch (category) {
    case 'nft': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'defi': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'dao': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'marketplace': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'utility': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getComplexityColor(complexity: string) {
  switch (complexity) {
    case 'beginner': return 'text-green-600'
    case 'intermediate': return 'text-yellow-600'
    case 'advanced': return 'text-red-600'
    default: return 'text-gray-600'
  }
}