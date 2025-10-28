import { NextResponse } from "next/server"
import { z } from "zod"

// Template categories and types
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'nft' | 'defi' | 'dao' | 'marketplace' | 'utility' | 'gaming'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  features: string[]
  technologies: string[]
  contractTypes: string[]
  frontendComponents: string[]
  apiEndpoints: string[]
  preview?: {
    images: string[]
    demoUrl?: string
  }
  requirements: {
    smartContracts: TemplateRequirement[]
    frontend: TemplateRequirement[]
    api: TemplateRequirement[]
  }
  configuration: {
    projectName: string
    description: string
    features: FeatureConfig[]
    uiRequirements: UIRequirements
    deploymentRequirements: DeploymentRequirements
  }
}

interface TemplateRequirement {
  name: string
  description: string
  type: string
  required: boolean
  defaultValue?: any
}

interface FeatureConfig {
  type: string
  specifications: Record<string, any>
  priority: 'high' | 'medium' | 'low'
}

interface UIRequirements {
  pages: Array<{
    name: string
    route: string
    purpose: string
    contractInteractions: string[]
  }>
  components: Array<{
    name: string
    type: string
    contractFunctions: string[]
  }>
  styling: {
    framework: string
    theme: string
  }
  responsive: boolean
  accessibility: boolean
}

interface DeploymentRequirements {
  target: string
  environment: string
}

// Query parameters validation
const TemplateQuerySchema = z.object({
  category: z.enum(['nft', 'defi', 'dao', 'marketplace', 'utility', 'gaming']).optional(),
  complexity: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().optional(),
  featured: z.boolean().optional(),
  limit: z.number().min(1).max(50).default(20).optional(),
  offset: z.number().min(0).default(0).optional()
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Convert string booleans to actual booleans
    if (queryParams.featured) {
      queryParams.featured = queryParams.featured === 'true'
    }
    if (queryParams.limit) {
      queryParams.limit = parseInt(queryParams.limit)
    }
    if (queryParams.offset) {
      queryParams.offset = parseInt(queryParams.offset)
    }

    const validationResult = TemplateQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid query parameters",
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { category, complexity, search, featured, limit = 20, offset = 0 } = validationResult.data

    // Get all templates
    let templates = getAllProjectTemplates()

    // Apply filters
    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    if (complexity) {
      templates = templates.filter(t => t.complexity === complexity)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.features.some(f => f.toLowerCase().includes(searchLower))
      )
    }

    if (featured) {
      templates = templates.filter(t => t.features.includes('featured'))
    }

    // Apply pagination
    const total = templates.length
    const paginatedTemplates = templates.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      templates: paginatedTemplates,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      categories: getTemplateCategories(),
      complexityLevels: ['beginner', 'intermediate', 'advanced']
    })

  } catch (error) {
    console.error("[API] Project templates error:", error)
    return NextResponse.json({
      error: "Failed to fetch project templates",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST endpoint for creating custom templates
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate template data (simplified validation)
    if (!body.name || !body.description || !body.category) {
      return NextResponse.json({
        error: "Missing required fields: name, description, category"
      }, { status: 400 })
    }

    // In a real implementation, this would save to a database
    const customTemplate: ProjectTemplate = {
      id: `custom-${Date.now()}`,
      name: body.name,
      description: body.description,
      category: body.category,
      complexity: body.complexity || 'intermediate',
      estimatedTime: body.estimatedTime || '10-15 minutes',
      features: body.features || [],
      technologies: body.technologies || ['Next.js', 'React', 'Cadence', 'Flow'],
      contractTypes: body.contractTypes || [],
      frontendComponents: body.frontendComponents || [],
      apiEndpoints: body.apiEndpoints || [],
      requirements: body.requirements || {
        smartContracts: [],
        frontend: [],
        api: []
      },
      configuration: body.configuration || {
        projectName: body.name,
        description: body.description,
        features: [],
        uiRequirements: {
          pages: [],
          components: [],
          styling: { framework: 'tailwind', theme: 'auto' },
          responsive: true,
          accessibility: true
        },
        deploymentRequirements: {
          target: 'vercel',
          environment: 'development'
        }
      }
    }

    return NextResponse.json({
      success: true,
      template: customTemplate,
      message: "Custom template created successfully"
    })

  } catch (error) {
    console.error("[API] Custom template creation error:", error)
    return NextResponse.json({
      error: "Failed to create custom template",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Helper function to get all project templates
function getAllProjectTemplates(): ProjectTemplate[] {
  return [
    {
      id: 'nft-marketplace',
      name: 'NFT Marketplace',
      description: 'Complete NFT marketplace with minting, trading, and collection management. Includes user profiles, search functionality, and auction features.',
      category: 'marketplace',
      complexity: 'advanced',
      estimatedTime: '20-25 minutes',
      features: ['featured', 'minting', 'trading', 'auctions', 'collections', 'user-profiles'],
      technologies: ['Next.js', 'React', 'Cadence', 'Flow', 'Tailwind CSS', 'TypeScript'],
      contractTypes: ['NFTContract', 'MarketplaceContract', 'AuctionContract'],
      frontendComponents: ['NFTCard', 'MarketplaceGrid', 'AuctionTimer', 'UserProfile', 'MintingForm'],
      apiEndpoints: ['/api/nfts', '/api/marketplace', '/api/auctions', '/api/users'],
      preview: {
        images: ['/templates/nft-marketplace-1.png', '/templates/nft-marketplace-2.png'],
        demoUrl: 'https://demo-nft-marketplace.vercel.app'
      },
      requirements: {
        smartContracts: [
          { name: 'NFT Collection Name', description: 'Name for your NFT collection', type: 'string', required: true },
          { name: 'Royalty Percentage', description: 'Creator royalty percentage (0-10)', type: 'number', required: true, defaultValue: 5 },
          { name: 'Max Supply', description: 'Maximum number of NFTs', type: 'number', required: false }
        ],
        frontend: [
          { name: 'Brand Colors', description: 'Primary and secondary brand colors', type: 'object', required: false },
          { name: 'Logo URL', description: 'URL to your project logo', type: 'string', required: false }
        ],
        api: [
          { name: 'IPFS Provider', description: 'IPFS service for metadata storage', type: 'string', required: true, defaultValue: 'pinata' }
        ]
      },
      configuration: {
        projectName: 'NFT Marketplace',
        description: 'A complete NFT marketplace built on Flow blockchain',
        features: [
          { type: 'nft', specifications: { standard: 'NonFungibleToken', metadata: true }, priority: 'high' },
          { type: 'marketplace', specifications: { auctions: true, offers: true }, priority: 'high' }
        ],
        uiRequirements: {
          pages: [
            { name: 'Home', route: '/', purpose: 'Landing page with featured NFTs', contractInteractions: ['getNFTs'] },
            { name: 'Marketplace', route: '/marketplace', purpose: 'Browse and purchase NFTs', contractInteractions: ['buyNFT', 'listNFT'] },
            { name: 'Create', route: '/create', purpose: 'Mint new NFTs', contractInteractions: ['mintNFT'] },
            { name: 'Profile', route: '/profile', purpose: 'User profile and owned NFTs', contractInteractions: ['getUserNFTs'] }
          ],
          components: [
            { name: 'NFTCard', type: 'display', contractFunctions: ['getNFTMetadata'] },
            { name: 'MintingForm', type: 'form', contractFunctions: ['mintNFT'] },
            { name: 'MarketplaceGrid', type: 'display', contractFunctions: ['getMarketplaceListings'] }
          ],
          styling: { framework: 'tailwind', theme: 'auto' },
          responsive: true,
          accessibility: true
        },
        deploymentRequirements: { target: 'vercel', environment: 'production' }
      }
    },
    {
      id: 'token-dapp',
      name: 'Token dApp',
      description: 'Fungible token application with transfer, staking, and governance features. Perfect for creating your own cryptocurrency.',
      category: 'defi',
      complexity: 'intermediate',
      estimatedTime: '15-20 minutes',
      features: ['token-creation', 'staking', 'governance', 'transfers'],
      technologies: ['Next.js', 'React', 'Cadence', 'Flow', 'Tailwind CSS'],
      contractTypes: ['FungibleTokenContract', 'StakingContract', 'GovernanceContract'],
      frontendComponents: ['TokenBalance', 'TransferForm', 'StakingInterface', 'GovernancePanel'],
      apiEndpoints: ['/api/tokens', '/api/staking', '/api/governance'],
      requirements: {
        smartContracts: [
          { name: 'Token Name', description: 'Name of your token', type: 'string', required: true },
          { name: 'Token Symbol', description: 'Token symbol (3-5 characters)', type: 'string', required: true },
          { name: 'Initial Supply', description: 'Initial token supply', type: 'number', required: true },
          { name: 'Staking Rewards', description: 'Annual staking reward percentage', type: 'number', required: false, defaultValue: 10 }
        ],
        frontend: [
          { name: 'Dashboard Layout', description: 'Dashboard layout preference', type: 'string', required: false, defaultValue: 'grid' }
        ],
        api: [
          { name: 'Price Feed', description: 'External price feed integration', type: 'boolean', required: false, defaultValue: false }
        ]
      },
      configuration: {
        projectName: 'Token dApp',
        description: 'A comprehensive token application with DeFi features',
        features: [
          { type: 'token', specifications: { standard: 'FungibleToken', mintable: true }, priority: 'high' },
          { type: 'defi', specifications: { staking: true, governance: true }, priority: 'medium' }
        ],
        uiRequirements: {
          pages: [
            { name: 'Dashboard', route: '/', purpose: 'Token overview and balance', contractInteractions: ['getBalance'] },
            { name: 'Transfer', route: '/transfer', purpose: 'Send tokens to other accounts', contractInteractions: ['transfer'] },
            { name: 'Staking', route: '/staking', purpose: 'Stake tokens for rewards', contractInteractions: ['stake', 'unstake'] },
            { name: 'Governance', route: '/governance', purpose: 'Vote on proposals', contractInteractions: ['vote', 'createProposal'] }
          ],
          components: [
            { name: 'TokenBalance', type: 'display', contractFunctions: ['getBalance'] },
            { name: 'TransferForm', type: 'form', contractFunctions: ['transfer'] },
            { name: 'StakingInterface', type: 'interaction', contractFunctions: ['stake', 'unstake'] }
          ],
          styling: { framework: 'tailwind', theme: 'auto' },
          responsive: true,
          accessibility: true
        },
        deploymentRequirements: { target: 'vercel', environment: 'production' }
      }
    },
    {
      id: 'dao-platform',
      name: 'DAO Platform',
      description: 'Decentralized governance platform with voting, proposal management, and treasury features.',
      category: 'dao',
      complexity: 'advanced',
      estimatedTime: '25-30 minutes',
      features: ['governance', 'voting', 'proposals', 'treasury', 'member-management'],
      technologies: ['Next.js', 'React', 'Cadence', 'Flow', 'Tailwind CSS', 'Chart.js'],
      contractTypes: ['DAOContract', 'GovernanceContract', 'TreasuryContract'],
      frontendComponents: ['ProposalCard', 'VotingInterface', 'TreasuryDashboard', 'MemberList'],
      apiEndpoints: ['/api/proposals', '/api/votes', '/api/treasury', '/api/members'],
      requirements: {
        smartContracts: [
          { name: 'DAO Name', description: 'Name of your DAO', type: 'string', required: true },
          { name: 'Voting Period', description: 'Voting period in days', type: 'number', required: true, defaultValue: 7 },
          { name: 'Quorum Threshold', description: 'Minimum participation percentage', type: 'number', required: true, defaultValue: 20 }
        ],
        frontend: [
          { name: 'Theme Colors', description: 'DAO brand colors', type: 'object', required: false },
          { name: 'Logo', description: 'DAO logo URL', type: 'string', required: false }
        ],
        api: [
          { name: 'Notification Service', description: 'Email notifications for proposals', type: 'boolean', required: false }
        ]
      },
      configuration: {
        projectName: 'DAO Platform',
        description: 'A comprehensive DAO governance platform',
        features: [
          { type: 'dao', specifications: { voting: true, proposals: true, treasury: true }, priority: 'high' },
          { type: 'token', specifications: { governance: true }, priority: 'medium' }
        ],
        uiRequirements: {
          pages: [
            { name: 'Dashboard', route: '/', purpose: 'DAO overview and statistics', contractInteractions: ['getDAOStats'] },
            { name: 'Proposals', route: '/proposals', purpose: 'View and create proposals', contractInteractions: ['getProposals', 'createProposal'] },
            { name: 'Vote', route: '/vote/[id]', purpose: 'Vote on specific proposal', contractInteractions: ['vote'] },
            { name: 'Treasury', route: '/treasury', purpose: 'Treasury management', contractInteractions: ['getTreasuryBalance'] }
          ],
          components: [
            { name: 'ProposalCard', type: 'display', contractFunctions: ['getProposal'] },
            { name: 'VotingInterface', type: 'interaction', contractFunctions: ['vote'] },
            { name: 'TreasuryDashboard', type: 'display', contractFunctions: ['getTreasuryBalance'] }
          ],
          styling: { framework: 'tailwind', theme: 'auto' },
          responsive: true,
          accessibility: true
        },
        deploymentRequirements: { target: 'vercel', environment: 'production' }
      }
    },
    {
      id: 'simple-nft',
      name: 'Simple NFT Collection',
      description: 'Basic NFT collection with minting and viewing capabilities. Perfect for beginners.',
      category: 'nft',
      complexity: 'beginner',
      estimatedTime: '10-15 minutes',
      features: ['minting', 'viewing', 'metadata'],
      technologies: ['Next.js', 'React', 'Cadence', 'Flow', 'Tailwind CSS'],
      contractTypes: ['NFTContract'],
      frontendComponents: ['NFTCard', 'MintingForm', 'CollectionGrid'],
      apiEndpoints: ['/api/nfts', '/api/mint'],
      requirements: {
        smartContracts: [
          { name: 'Collection Name', description: 'Name of your NFT collection', type: 'string', required: true },
          { name: 'Collection Description', description: 'Description of your collection', type: 'string', required: true },
          { name: 'Max Supply', description: 'Maximum number of NFTs (optional)', type: 'number', required: false }
        ],
        frontend: [
          { name: 'Collection Image', description: 'Collection banner image URL', type: 'string', required: false }
        ],
        api: [
          { name: 'Metadata Storage', description: 'Where to store NFT metadata', type: 'string', required: true, defaultValue: 'ipfs' }
        ]
      },
      configuration: {
        projectName: 'Simple NFT Collection',
        description: 'A basic NFT collection for beginners',
        features: [
          { type: 'nft', specifications: { standard: 'NonFungibleToken', metadata: true }, priority: 'high' }
        ],
        uiRequirements: {
          pages: [
            { name: 'Home', route: '/', purpose: 'Collection overview', contractInteractions: ['getCollectionInfo'] },
            { name: 'Mint', route: '/mint', purpose: 'Mint new NFTs', contractInteractions: ['mintNFT'] },
            { name: 'Gallery', route: '/gallery', purpose: 'View all NFTs', contractInteractions: ['getAllNFTs'] }
          ],
          components: [
            { name: 'NFTCard', type: 'display', contractFunctions: ['getNFTMetadata'] },
            { name: 'MintingForm', type: 'form', contractFunctions: ['mintNFT'] },
            { name: 'CollectionGrid', type: 'display', contractFunctions: ['getAllNFTs'] }
          ],
          styling: { framework: 'tailwind', theme: 'light' },
          responsive: true,
          accessibility: true
        },
        deploymentRequirements: { target: 'vercel', environment: 'development' }
      }
    },
    {
      id: 'defi-staking',
      name: 'DeFi Staking Platform',
      description: 'Staking platform with multiple pools, rewards calculation, and yield farming features.',
      category: 'defi',
      complexity: 'advanced',
      estimatedTime: '20-25 minutes',
      features: ['staking', 'yield-farming', 'multiple-pools', 'rewards', 'analytics'],
      technologies: ['Next.js', 'React', 'Cadence', 'Flow', 'Tailwind CSS', 'Chart.js'],
      contractTypes: ['StakingContract', 'RewardsContract', 'PoolContract'],
      frontendComponents: ['StakingPool', 'RewardsCalculator', 'AnalyticsDashboard', 'PoolSelector'],
      apiEndpoints: ['/api/pools', '/api/stake', '/api/rewards', '/api/analytics'],
      requirements: {
        smartContracts: [
          { name: 'Platform Name', description: 'Name of your staking platform', type: 'string', required: true },
          { name: 'Base APY', description: 'Base annual percentage yield', type: 'number', required: true, defaultValue: 12 },
          { name: 'Lock Period', description: 'Minimum staking period in days', type: 'number', required: true, defaultValue: 30 }
        ],
        frontend: [
          { name: 'Dashboard Layout', description: 'Dashboard layout style', type: 'string', required: false, defaultValue: 'modern' }
        ],
        api: [
          { name: 'Price Oracle', description: 'External price feed integration', type: 'boolean', required: false, defaultValue: true }
        ]
      },
      configuration: {
        projectName: 'DeFi Staking Platform',
        description: 'Advanced staking platform with yield farming',
        features: [
          { type: 'defi', specifications: { staking: true, yieldFarming: true, multiplePools: true }, priority: 'high' },
          { type: 'token', specifications: { rewards: true }, priority: 'medium' }
        ],
        uiRequirements: {
          pages: [
            { name: 'Dashboard', route: '/', purpose: 'Staking overview and analytics', contractInteractions: ['getStakingStats'] },
            { name: 'Pools', route: '/pools', purpose: 'Available staking pools', contractInteractions: ['getAllPools'] },
            { name: 'Stake', route: '/stake/[poolId]', purpose: 'Stake in specific pool', contractInteractions: ['stake'] },
            { name: 'Rewards', route: '/rewards', purpose: 'Claim rewards', contractInteractions: ['claimRewards'] }
          ],
          components: [
            { name: 'StakingPool', type: 'interaction', contractFunctions: ['stake', 'unstake'] },
            { name: 'RewardsCalculator', type: 'display', contractFunctions: ['calculateRewards'] },
            { name: 'AnalyticsDashboard', type: 'display', contractFunctions: ['getAnalytics'] }
          ],
          styling: { framework: 'tailwind', theme: 'dark' },
          responsive: true,
          accessibility: true
        },
        deploymentRequirements: { target: 'vercel', environment: 'production' }
      }
    }
  ]
}

function getTemplateCategories() {
  return [
    { id: 'nft', name: 'NFT & Collectibles', description: 'NFT collections, marketplaces, and digital art platforms' },
    { id: 'defi', name: 'DeFi', description: 'Decentralized finance applications and protocols' },
    { id: 'dao', name: 'DAO & Governance', description: 'Decentralized autonomous organizations and governance systems' },
    { id: 'marketplace', name: 'Marketplaces', description: 'Trading platforms and digital marketplaces' },
    { id: 'utility', name: 'Utility', description: 'Utility tokens and service applications' },
    { id: 'gaming', name: 'Gaming', description: 'Blockchain games and gaming infrastructure' }
  ]
}