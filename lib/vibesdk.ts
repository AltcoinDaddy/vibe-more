import { generateText, streamText } from "ai"
import { codeValidator, CodeValidationOptions } from "./migration/code-validator"
import { ValidationResult } from "./migration/types"
import { PromptEnhancer, PromptEnhancementOptions } from "./quality-assurance/prompt-enhancer"
import { GenerationContext, FailurePattern, QualityRequirements } from "./quality-assurance/types"

// Import AI providers
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"

export interface GenerateCodeOptions {
  prompt: string
  context?: string
  temperature?: number
}

export interface ExplainCodeOptions {
  code: string
  question?: string
}

export interface RefineCodeOptions {
  code: string
  refinementRequest: string
}

export interface GenerateCodeResult {
  code: string
  validation: ValidationResult
  rejected: boolean
  rejectionReason?: string
}

// Import documentation types
export type { GeneratedDocumentation } from './documentation-generator'

// Additional interfaces for full-stack generation

export interface FullStackValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number
}

export interface ContractFunction {
  name: string
  purpose: string
  parameters: string[]
  returnType: string
  access: string
}

export interface ContractEvent {
  name: string
  purpose: string
  fields: string[]
}

export interface StylingInfo {
  framework: 'tailwind' | 'css'
  theme: 'light' | 'dark' | 'auto'
  responsive: boolean
  accessibility: boolean
}

export interface APIValidationSchema {
  body?: Record<string, any>
  query?: Record<string, any>
  params?: Record<string, any>
}

export interface ContractBinding {
  contractName: string
  functionName: string
  parameters: Parameter[]
}

export interface APIIntegration {
  endpoint: string
  method: string
  contractFunction: string
}

export interface TypeDefinition {
  name: string
  type: string
  description: string
}

export interface UtilityFunction {
  name: string
  purpose: string
  code: string
}

// Full-stack generation interfaces
export interface FullStackGenerationOptions extends GenerateCodeOptions {
  includeFrontend: boolean
  includeAPI: boolean
  uiFramework: 'react' | 'next'
  stylingFramework: 'tailwind' | 'css'
  deploymentTarget: 'vercel' | 'netlify' | 'self-hosted'
  projectName: string
}

export interface FullStackGenerationResult {
  smartContracts: GeneratedContract[]
  frontendComponents: GeneratedComponent[]
  apiRoutes: GeneratedAPIRoute[]
  configurations: GeneratedConfig[]
  projectStructure: ProjectStructure
  integrationCode: IntegrationCode
  documentation?: GeneratedDocumentation
}

export interface GeneratedContract {
  filename: string
  code: string
  validation: ValidationResult
  dependencies: string[]
}

export interface GeneratedComponent {
  filename: string
  code: string
  componentType: 'page' | 'component' | 'layout'
  dependencies: string[]
  contractIntegrations: ContractIntegration[]
}

export interface GeneratedAPIRoute {
  filename: string
  code: string
  endpoint: string
  methods: string[]
  contractCalls: string[]
}

export interface GeneratedConfig {
  filename: string
  code: string
  configType: 'package' | 'next' | 'tailwind' | 'typescript' | 'env' | 'postcss' | 'git' | 'documentation'
}

export interface ContractIntegration {
  contractName: string
  functions: string[]
  events: string[]
  integrationCode: string
}

export interface ProjectStructure {
  directories: Directory[]
  files: GeneratedFile[]
  configurations: ConfigurationFile[]
}

export interface Directory {
  name: string
  path: string
  children: (Directory | GeneratedFile)[]
}

export interface GeneratedFile {
  name: string
  path: string
  content: string
  type: 'contract' | 'component' | 'api' | 'config' | 'documentation'
}

export interface ConfigurationFile {
  name: string
  path: string
  content: string
  configType: string
}

export interface IntegrationCode {
  hooks: string[]
  utilities: string[]
  types: string[]
}

// Component specification interfaces
export interface ComponentSpecification {
  name: string
  type: 'form' | 'display' | 'interaction' | 'navigation'
  props: ComponentProp[]
  styling: StylingRequirements
  contractFunctions: string[]
}

export interface ComponentProp {
  name: string
  type: string
  required: boolean
  description?: string
}

export interface StylingRequirements {
  framework: 'tailwind' | 'css'
  theme: 'light' | 'dark' | 'auto'
  responsive: boolean
  accessibility: boolean
}

// API route specification interfaces
export interface APIRouteSpecification {
  path: string
  methods: HTTPMethod[]
  contractCalls: ContractCall[]
  validation: ValidationSchema
  authentication: boolean
}

export interface ContractCall {
  contractName: string
  functionName: string
  parameters: Parameter[]
  returnType: string
}

export interface Parameter {
  name: string
  type: string
  required: boolean
}

export interface ValidationSchema {
  body?: Record<string, any>
  query?: Record<string, any>
  params?: Record<string, any>
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// Project generation request interfaces
export interface FullStackProjectRequest {
  description: string
  projectName: string
  features: FeatureRequirement[]
  uiRequirements: UIRequirements
  deploymentRequirements: DeploymentRequirements
  advancedOptions: AdvancedOptions
}

export interface FeatureRequirement {
  type: 'nft' | 'token' | 'marketplace' | 'dao' | 'defi' | 'custom'
  specifications: Record<string, any>
  priority: 'high' | 'medium' | 'low'
}

export interface UIRequirements {
  pages: PageRequirement[]
  components: ComponentRequirement[]
  styling: StylingPreferences
  responsive: boolean
  accessibility: boolean
}

export interface PageRequirement {
  name: string
  route: string
  purpose: string
  contractInteractions: string[]
  layout: string
}

export interface ComponentRequirement {
  name: string
  type: string
  functionality: string[]
  contractBindings: string[]
}

export interface StylingPreferences {
  primaryColor?: string
  theme: 'light' | 'dark' | 'auto'
  framework: 'tailwind' | 'css'
  customStyles?: Record<string, string>
}

export interface DeploymentRequirements {
  target: 'vercel' | 'netlify' | 'self-hosted'
  environment: 'development' | 'staging' | 'production'
  customDomain?: string
  environmentVariables?: Record<string, string>
}

export interface AdvancedOptions {
  typescript: boolean
  testing: boolean
  linting: boolean
  formatting: boolean
  documentation: boolean
}

// Prompt parsing result interfaces
export interface ParsedPromptResult {
  projectType: ProjectType
  backendRequirements: BackendRequirements
  frontendRequirements: FrontendRequirements
  integrationRequirements: IntegrationRequirements
  confidence: number
}

export interface BackendRequirements {
  contractTypes: string[]
  functions: FunctionRequirement[]
  events: EventRequirement[]
  resources: ResourceRequirement[]
}

export interface FrontendRequirements {
  pages: string[]
  components: string[]
  interactions: InteractionRequirement[]
  styling: StylingRequirements
}

export interface IntegrationRequirements {
  apiEndpoints: string[]
  contractBindings: string[]
  dataFlow: DataFlowRequirement[]
}

export interface FunctionRequirement {
  name: string
  purpose: string
  parameters: string[]
  returnType: string
  access: string
}

export interface EventRequirement {
  name: string
  purpose: string
  fields: string[]
}

export interface ResourceRequirement {
  name: string
  purpose: string
  interfaces: string[]
  functions: string[]
}

export interface InteractionRequirement {
  type: 'form' | 'button' | 'display' | 'navigation'
  contractFunction: string
  userInput: string[]
  feedback: string[]
}

export interface DataFlowRequirement {
  source: string
  destination: string
  transformation: string
  validation: string[]
}

export type ProjectType = 'nft-collection' | 'marketplace' | 'defi-protocol' | 'dao' | 'token' | 'custom'

// Prompt parsing result interfaces
export interface ParsedPromptResult {
  projectType: ProjectType
  backendRequirements: BackendRequirements
  frontendRequirements: FrontendRequirements
  integrationRequirements: IntegrationRequirements
  confidence: number
}

export interface BackendRequirements {
  contractTypes: string[]
  functions: FunctionRequirement[]
  events: EventRequirement[]
  resources: ResourceRequirement[]
}

export interface FrontendRequirements {
  pages: string[]
  components: string[]
  interactions: InteractionRequirement[]
  styling: StylingRequirements
}

export interface IntegrationRequirements {
  apiEndpoints: string[]
  contractBindings: string[]
  dataFlow: DataFlowRequirement[]
}

export interface FunctionRequirement {
  name: string
  purpose: string
  parameters: string[]
  returnType: string
  access: string
}

export interface EventRequirement {
  name: string
  purpose: string
  fields: string[]
}

export interface ResourceRequirement {
  name: string
  purpose: string
  interfaces: string[]
  functions: string[]
}

export interface InteractionRequirement {
  type: 'form' | 'button' | 'display' | 'navigation'
  contractFunction: string
  userInput: string[]
  feedback: string[]
}

export interface DataFlowRequirement {
  source: string
  destination: string
  transformation: string
  validation: string[]
}

/**
 * VibeSDK - AI-powered Cadence code generation for Flow blockchain
 * Extended with full-stack dApp generation capabilities
 */
export class VibeSDK {
  private model: any
  private isAIAvailable: boolean = false

  constructor() {
    this.initializeModel()
  }

  private initializeModel() {
    // Priority order: OpenAI > Gemini > Anthropic > Vercel AI Gateway > Mock
    if (process.env.OPENAI_API_KEY) {
      this.model = openai("gpt-4o")
      this.isAIAvailable = true
      console.log("[VibeSDK] Using OpenAI GPT-4o")
    } else if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      this.model = google("gemini-2.0-flash-exp")
      this.isAIAvailable = true
      console.log("[VibeSDK] Using Google Gemini 2.0 Flash")
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.model = anthropic("claude-3-5-sonnet-20241022")
      this.isAIAvailable = true
      console.log("[VibeSDK] Using Anthropic Claude")
    } else if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
      this.model = "openai/gpt-4o"
      this.isAIAvailable = true
      console.log("[VibeSDK] Using Vercel AI Gateway")
    } else {
      console.log("[VibeSDK] No AI provider configured, using mock responses")
      this.isAIAvailable = false
    }
  }

  /**
   * Generate Cadence smart contract code from natural language with enhanced quality assurance
   */
  async generateCode({ prompt, context, temperature = 0.7 }: GenerateCodeOptions): Promise<string> {
    if (!this.isAIAvailable) {
      console.log("[VibeSDK] Using mock response - no AI provider configured")
      return this.getMockResponse(prompt)
    }

    try {
      // Create generation context for prompt enhancement
      const generationContext: GenerationContext = {
        userPrompt: prompt,
        contractType: this.inferContractType(prompt),
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 90, // Increased from 85 for higher quality
          requiredFeatures: [],
          prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount', 'account.save', 'account.link'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        },
        userExperience: this.inferUserExperience(prompt, context)
      }

      // Initial generation attempt with enhanced prompts
      const enhancementOptions: PromptEnhancementOptions = {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: generationContext.qualityRequirements,
        strictMode: false,
        temperature
      }

      const enhancedPrompt = PromptEnhancer.enhancePromptForQuality(
        prompt,
        generationContext,
        enhancementOptions
      )

      console.log(`[VibeSDK] Generating with enhancement level: ${enhancedPrompt.enhancementLevel}`)

      const { text } = await generateText({
        model: this.model,
        temperature: enhancedPrompt.temperature,
        system: enhancedPrompt.systemPrompt,
        prompt: enhancedPrompt.userPrompt,
        maxRetries: 3,
        abortSignal: AbortSignal.timeout(30000), // 30 second timeout
      })

      // Validate generated code before returning
      const validation = this.validateGeneratedCode(text)
      const rejection = this.shouldRejectGeneratedCode(text)

      if (!validation.isValid || rejection.shouldReject) {
        console.warn("[VibeSDK] Generated code failed validation, attempting regeneration with enhanced prompts...")
        console.warn("[VibeSDK] Validation errors:", validation.errors?.slice(0, 3))
        console.warn("[VibeSDK] Rejection reason:", rejection.reason)

        // Analyze failures for prompt enhancement
        const failurePatterns = this.analyzeValidationFailures(validation, rejection)

        // Try up to 3 times with progressively enhanced prompts
        for (let attempt = 2; attempt <= 4; attempt++) {
          const retryOptions: PromptEnhancementOptions = {
            attemptNumber: attempt,
            previousFailures: failurePatterns,
            qualityRequirements: generationContext.qualityRequirements,
            strictMode: attempt >= 3,
            temperature
          }

          const retryEnhancedPrompt = PromptEnhancer.enhancePromptForQuality(
            prompt,
            generationContext,
            retryOptions
          )

          console.log(`[VibeSDK] Retry attempt ${attempt} with enhancement level: ${retryEnhancedPrompt.enhancementLevel}`)

          const { text: retryText } = await generateText({
            model: this.model,
            temperature: retryEnhancedPrompt.temperature,
            system: retryEnhancedPrompt.systemPrompt,
            prompt: retryEnhancedPrompt.userPrompt,
            maxRetries: 2,
            abortSignal: AbortSignal.timeout(25000), // 25 second timeout for retries
          })

          const retryValidation = this.validateGeneratedCode(retryText)
          const retryRejection = this.shouldRejectGeneratedCode(retryText)

          if (retryValidation.isValid && !retryRejection.shouldReject) {
            console.log(`[VibeSDK] Enhanced prompt regeneration successful on attempt ${attempt}`)
            return retryText
          }

          console.warn(`[VibeSDK] Enhanced prompt attempt ${attempt} failed validation:`, retryValidation.errors?.slice(0, 3))

          // Update failure patterns for next attempt
          failurePatterns.push(...this.analyzeValidationFailures(retryValidation, retryRejection))
        }

        console.error("[VibeSDK] All enhanced prompt attempts failed, using guaranteed modern mock")
        return this.getMockResponse(prompt)
      }

      console.log("[VibeSDK] Code generation successful with enhanced prompts")
      return text
    } catch (error) {
      console.error("[VibeSDK] AI generation failed:", error)
      return this.getMockResponse(prompt)
    }
  }

  /**
   * Mock response generator for when AI is not available - Perfect Cadence 1.0
   */
  private getMockResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase()

    // Check for more specific patterns first (marketplace, dao, etc.)
    if (lowerPrompt.includes('marketplace')) {
      return `// Perfect Cadence 1.0 NFT Marketplace Contract - Production Ready
import "NonFungibleToken"
import "FungibleToken"
import "MetadataViews"

access(all) contract NFTMarketplace {
    access(all) event ForSale(id: UInt64, price: UFix64, owner: Address?)
    access(all) event PriceChanged(id: UInt64, newPrice: UFix64, owner: Address?)
    access(all) event TokenPurchased(id: UInt64, price: UFix64, seller: Address?, buyer: Address?)
    access(all) event SaleCanceled(id: UInt64, seller: Address?)

    access(all) let MarketplaceStoragePath: StoragePath
    access(all) let MarketplacePublicPath: PublicPath

    access(all) resource interface SalePublic {
        access(all) fun purchase(tokenID: UInt64, recipient: &{NonFungibleToken.CollectionPublic}, buyTokens: @{FungibleToken.Vault})
        access(all) view fun idPrice(tokenID: UInt64): UFix64?
        access(all) view fun getIDs(): [UInt64]
        access(all) view fun getSaleInfo(tokenID: UInt64): SaleInfo?
    }

    access(all) struct SaleInfo {
        access(all) let tokenID: UInt64
        access(all) let price: UFix64
        access(all) let seller: Address

        init(tokenID: UInt64, price: UFix64, seller: Address) {
            self.tokenID = tokenID
            self.price = price
            self.seller = seller
        }
    }

    access(all) resource SaleCollection: SalePublic {
        access(self) var forSale: {UInt64: UFix64}
        access(self) var nftProviderCapability: Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>
        access(self) var ownerVaultCapability: Capability<&{FungibleToken.Receiver}>

        init(
            nftProviderCapability: Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>,
            ownerVaultCapability: Capability<&{FungibleToken.Receiver}>
        ) {
            pre {
                nftProviderCapability.check(): "Invalid NFT provider capability"
                ownerVaultCapability.check(): "Invalid vault receiver capability"
            }
            self.forSale = {}
            self.nftProviderCapability = nftProviderCapability
            self.ownerVaultCapability = ownerVaultCapability
        }

        access(all) fun listForSale(tokenID: UInt64, price: UFix64) {
            pre {
                price > 0.0: "Price must be greater than zero"
                self.nftProviderCapability.check(): "NFT provider capability is invalid"
            }

            let nftCollection = self.nftProviderCapability.borrow()
                ?? panic("Could not borrow NFT collection")

            // Verify the NFT exists in the collection
            let nftRef = nftCollection.borrowNFT(tokenID)
                ?? panic("NFT does not exist in the collection")

            self.forSale[tokenID] = price
            emit ForSale(id: tokenID, price: price, owner: self.owner?.address)
        }

        access(all) fun cancelSale(tokenID: UInt64) {
            pre {
                self.forSale[tokenID] != nil: "Token is not for sale"
            }
            self.forSale.remove(key: tokenID)
            emit SaleCanceled(id: tokenID, seller: self.owner?.address)
        }

        access(all) fun changePrice(tokenID: UInt64, newPrice: UFix64) {
            pre {
                self.forSale[tokenID] != nil: "Token is not for sale"
                newPrice > 0.0: "Price must be greater than zero"
            }
            self.forSale[tokenID] = newPrice
            emit PriceChanged(id: tokenID, newPrice: newPrice, owner: self.owner?.address)
        }

        access(all) fun purchase(tokenID: UInt64, recipient: &{NonFungibleToken.CollectionPublic}, buyTokens: @{FungibleToken.Vault}) {
            pre {
                self.forSale[tokenID] != nil: "Token is not for sale"
                buyTokens.balance >= self.forSale[tokenID]!: "Insufficient payment"
                self.nftProviderCapability.check(): "NFT provider capability is invalid"
                self.ownerVaultCapability.check(): "Owner vault capability is invalid"
            }

            let price = self.forSale[tokenID]!
            self.forSale.remove(key: tokenID)

            // Get the NFT from the seller's collection
            let nftCollection = self.nftProviderCapability.borrow()
                ?? panic("Could not borrow NFT collection")

            let nft <- nftCollection.withdraw(withdrawID: tokenID)

            // Deposit the NFT to the buyer's collection
            recipient.deposit(token: <-nft)

            // Pay the seller
            let vaultRef = self.ownerVaultCapability.borrow()
                ?? panic("Could not borrow seller's vault")

            vaultRef.deposit(from: <-buyTokens)

            emit TokenPurchased(
                id: tokenID,
                price: price,
                seller: self.owner?.address,
                buyer: recipient.owner?.address
            )
        }

        access(all) view fun idPrice(tokenID: UInt64): UFix64? {
            return self.forSale[tokenID]
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.forSale.keys
        }

        access(all) view fun getSaleInfo(tokenID: UInt64): SaleInfo? {
            if let price = self.forSale[tokenID] {
                return SaleInfo(
                    tokenID: tokenID,
                    price: price,
                    seller: self.owner?.address ?? panic("Could not get seller address")
                )
            }
            return nil
        }

        access(all) view fun getAllSaleInfo(): [SaleInfo] {
            let saleInfos: [SaleInfo] = []
            for tokenID in self.forSale.keys {
                if let saleInfo = self.getSaleInfo(tokenID: tokenID) {
                    saleInfos.append(saleInfo)
                }
            }
            return saleInfos
        }
    }

    access(all) fun createSaleCollection(
        nftProviderCapability: Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>,
        ownerVaultCapability: Capability<&{FungibleToken.Receiver}>
    ): @SaleCollection {
        return <- create SaleCollection(
            nftProviderCapability: nftProviderCapability,
            ownerVaultCapability: ownerVaultCapability
        )
    }

    init() {
        self.MarketplaceStoragePath = /storage/NFTMarketplace
        self.MarketplacePublicPath = /public/NFTMarketplace
    }
}`
    }

    if (lowerPrompt.includes('nft') || lowerPrompt.includes('token')) {
      return `// Perfect Cadence 1.0 NFT Contract - Production Ready
import "NonFungibleToken"
import "ViewResolver"
import "MetadataViews"

access(all) contract GeneratedNFT: NonFungibleToken {
    
    // Total supply of NFTs in existence
    access(all) var totalSupply: UInt64
    
    // Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64, recipient: Address)
    
    // Storage and Public Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let CollectionPrivatePath: PrivatePath
    access(all) let MinterStoragePath: StoragePath
    
    // Custom Collection Public Interface
    access(all) resource interface GeneratedNFTCollectionPublic {
        access(all) fun deposit(token: @{NonFungibleToken.NFT})
        access(all) view fun getIDs(): [UInt64]
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}?
        access(all) fun borrowGeneratedNFT(id: UInt64): &GeneratedNFT.NFT?
        access(all) view fun borrowViewResolver(id: UInt64): &{ViewResolver.Resolver}?
    }
    
    // NFT Resource - Fully Compliant with MetadataViews
    access(all) resource NFT: NonFungibleToken.NFT & ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let thumbnail: String
        access(self) let metadata: {String: AnyStruct}
        access(self) let royalties: [MetadataViews.Royalty]
        
        init(
            id: UInt64,
            name: String,
            description: String,
            thumbnail: String,
            metadata: {String: AnyStruct},
            royalties: [MetadataViews.Royalty]
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.thumbnail = thumbnail
            self.metadata = metadata
            self.royalties = royalties
        }
        
        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.Traits>()
            ]
        }
        
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.name,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(self.id)
                case Type<MetadataViews.Traits>():
                    return MetadataViews.dictToTraits(dict: self.metadata, excludedNames: nil)
                case Type<MetadataViews.Royalties>():
                    return MetadataViews.Royalties(self.royalties)
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL("https://vibemore.io/nft/".concat(self.id.toString()))
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: GeneratedNFT.CollectionStoragePath,
                        publicPath: GeneratedNFT.CollectionPublicPath,
                        publicCollection: Type<&GeneratedNFT.Collection>(),
                        publicLinkedType: Type<&GeneratedNFT.Collection>(),
                        createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                            return <-GeneratedNFT.createEmptyCollection(nftType: Type<@GeneratedNFT.NFT>())
                        })
                    )
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return MetadataViews.NFTCollectionDisplay(
                        name: "Generated NFT Collection",
                        description: "A collection of unique AI-generated NFTs created with VibeMore",
                        externalURL: MetadataViews.ExternalURL("https://vibemore.io/collection"),
                        squareImage: MetadataViews.Media(
                            file: MetadataViews.HTTPFile("https://vibemore.io/images/collection-square.png"),
                            mediaType: "image/png"
                        ),
                        bannerImage: MetadataViews.Media(
                            file: MetadataViews.HTTPFile("https://vibemore.io/images/collection-banner.png"),
                            mediaType: "image/png"
                        ),
                        socials: {
                            "twitter": MetadataViews.ExternalURL("https://twitter.com/vibemore")
                        }
                    )
            }
            return nil
        }
    }
    
    // Collection Resource - Fully Compliant
    access(all) resource Collection: NonFungibleToken.Provider & NonFungibleToken.Receiver & NonFungibleToken.Collection & NonFungibleToken.CollectionPublic & GeneratedNFTCollectionPublic & ViewResolver.ResolverCollection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}
        
        init () {
            self.ownedNFTs <- {}
        }
        
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("NFT not found in collection")
            
            emit Withdraw(id: token.id, from: self.owner?.address)
            
            return <-token
        }
        
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @GeneratedNFT.NFT
            
            let id: UInt64 = token.id
            
            // Add the new token to the dictionary
            let oldToken <- self.ownedNFTs[id] <- token
            
            emit Deposit(id: id, to: self.owner?.address)
            
            destroy oldToken
        }
        
        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)
        }
        
        access(all) fun borrowGeneratedNFT(id: UInt64): &GeneratedNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)!
                return ref as! &GeneratedNFT.NFT
            }
            return nil
        }
        
        access(all) view fun borrowViewResolver(id: UInt64): &{ViewResolver.Resolver}? {
            let nft = (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)
            if nft != nil {
                return nft as! &GeneratedNFT.NFT
            }
            return nil
        }
        
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- create Collection()
        }
    }
    
    // Public function to create empty collection
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }
    
    // NFT Minter Resource with Input Validation
    access(all) resource NFTMinter {
        
        access(all) fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            name: String,
            description: String,
            thumbnail: String,
            metadata: {String: AnyStruct},
            royalties: [MetadataViews.Royalty]
        ) {
            // Input validation
            pre {
                name.length > 0: "Name cannot be empty"
                description.length > 0: "Description cannot be empty"
                thumbnail.length > 0: "Thumbnail URL cannot be empty"
                royalties.length <= 10: "Too many royalties (max 10)"
            }
            
            // Create new NFT with current totalSupply as ID
            let newNFT <- create NFT(
                id: GeneratedNFT.totalSupply,
                name: name,
                description: description,
                thumbnail: thumbnail,
                metadata: metadata,
                royalties: royalties
            )
            
            let recipientAddress = recipient.owner?.address ?? panic("Could not get recipient address")
            
            // Deposit NFT to recipient
            recipient.deposit(token: <-newNFT)
            
            // Increment total supply AFTER minting
            GeneratedNFT.totalSupply = GeneratedNFT.totalSupply + 1
            
            // Emit event with correct ID (totalSupply - 1 since we incremented)
            emit Minted(
                id: GeneratedNFT.totalSupply - 1,
                recipient: recipientAddress
            )
        }
        
        access(all) fun batchMintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            names: [String],
            descriptions: [String],
            thumbnails: [String],
            metadatas: [{String: AnyStruct}],
            royalties: [MetadataViews.Royalty]
        ) {
            pre {
                names.length == descriptions.length: "Names and descriptions length mismatch"
                names.length == thumbnails.length: "Names and thumbnails length mismatch"
                names.length == metadatas.length: "Names and metadatas length mismatch"
                names.length <= 50: "Cannot mint more than 50 NFTs at once"
            }
            
            var i = 0
            while i < names.length {
                self.mintNFT(
                    recipient: recipient,
                    name: names[i],
                    description: descriptions[i],
                    thumbnail: thumbnails[i],
                    metadata: metadatas[i],
                    royalties: royalties
                )
                i = i + 1
            }
        }
    }
    
    // Contract initialization
    init() {
        // Initialize the total supply
        self.totalSupply = 0
        
        // Set the named paths
        self.CollectionStoragePath = /storage/GeneratedNFTCollection
        self.CollectionPublicPath = /public/GeneratedNFTCollection
        self.CollectionPrivatePath = /private/GeneratedNFTCollection
        self.MinterStoragePath = /storage/GeneratedNFTMinter
        
        // Create a Collection resource and save it to storage
        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)
        
        // Create public capability for the collection
        let collectionCap = self.account.capabilities.storage.issue<&GeneratedNFT.Collection>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)
        
        // Create a Minter resource and save it to storage
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)
        
        emit ContractInitialized()
    }
}`
    }

    // Default contract for other prompts - Perfect Cadence 1.0
    return `// Perfect Cadence 1.0 Contract - Production Ready
access(all) contract GeneratedContract {
    // Generated based on: ${prompt}
    
    // Contract state
    access(all) var value: String
    access(all) var counter: UInt64
    
    // Events with comprehensive data
    access(all) event ValueChanged(newValue: String, oldValue: String, changedBy: Address?)
    access(all) event CounterIncremented(newValue: UInt64, incrementedBy: Address?)
    access(all) event ContractInitialized()
    
    // Storage paths
    access(all) let AdminStoragePath: StoragePath
    access(all) let AdminPublicPath: PublicPath
    
    // Admin interface for public access
    access(all) resource interface AdminPublic {
        access(all) view fun getAdminInfo(): {String: AnyStruct}
    }
    
    // Admin resource for privileged operations
    access(all) resource Admin: AdminPublic {
        
        access(all) fun setValue(newValue: String) {
            pre {
                newValue.length > 0: "Value cannot be empty"
                newValue.length <= 1000: "Value too long (max 1000 characters)"
            }
            
            let oldValue = GeneratedContract.value
            GeneratedContract.value = newValue
            
            emit ValueChanged(
                newValue: newValue, 
                oldValue: oldValue, 
                changedBy: self.owner?.address
            )
        }
        
        access(all) fun incrementCounter() {
            GeneratedContract.counter = GeneratedContract.counter + 1
            
            emit CounterIncremented(
                newValue: GeneratedContract.counter,
                incrementedBy: self.owner?.address
            )
        }
        
        access(all) fun resetCounter() {
            GeneratedContract.counter = 0
        }
        
        access(all) view fun getAdminInfo(): {String: AnyStruct} {
            return {
                "adminAddress": self.owner?.address,
                "canSetValue": true,
                "canIncrementCounter": true
            }
        }
    }
    
    // Public read-only functions
    access(all) view fun getValue(): String {
        return self.value
    }
    
    access(all) view fun getCounter(): UInt64 {
        return self.counter
    }
    
    access(all) view fun getContractInfo(): {String: AnyStruct} {
        return {
            "name": "GeneratedContract",
            "value": self.value,
            "counter": self.counter,
            "description": "A comprehensive contract generated by VibeMore AI",
            "version": "1.0.0",
            "cadenceVersion": "1.0"
        }
    }
    
    // Public utility functions
    access(all) view fun getValueLength(): Int {
        return self.value.length
    }
    
    access(all) view fun isCounterEven(): Bool {
        return self.counter % 2 == 0
    }
    
    // Contract initialization with comprehensive setup
    init() {
        self.value = "Hello, Flow Cadence 1.0!"
        self.counter = 0
        self.AdminStoragePath = /storage/GeneratedContractAdmin
        self.AdminPublicPath = /public/GeneratedContractAdmin
        
        // Create and save admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
        
        // Create public capability for admin info
        let adminCap = self.account.capabilities.storage.issue<&Admin>(self.AdminStoragePath)
        self.account.capabilities.publish(adminCap, at: self.AdminPublicPath)
        
        emit ContractInitialized()
    }
}`
  }

  /**
   * Stream Cadence code generation for real-time updates with enhanced quality prompts
   */
  async *streamCode({ prompt, context, temperature = 0.7 }: GenerateCodeOptions) {
    if (!this.isAIAvailable) {
      // Simulate streaming for mock response
      const mockResponse = this.getMockResponse(prompt)
      const words = mockResponse.split(' ')

      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' '
        yield chunk
        // Small delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      return
    }

    try {
      // Create generation context for prompt enhancement
      const generationContext: GenerationContext = {
        userPrompt: prompt,
        contractType: this.inferContractType(prompt),
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 90, // Increased for higher quality
          requiredFeatures: [],
          prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount', 'account.save', 'account.link'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 3
          }
        },
        userExperience: this.inferUserExperience(prompt, context)
      }

      // Use enhanced prompts for streaming with quality focus
      const enhancementOptions: PromptEnhancementOptions = {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: generationContext.qualityRequirements,
        strictMode: false, // Start with moderate strictness for streaming
        temperature
      }

      const enhancedPrompt = PromptEnhancer.enhancePromptForQuality(
        prompt,
        generationContext,
        enhancementOptions
      )

      console.log(`[VibeSDK] Streaming with enhancement level: ${enhancedPrompt.enhancementLevel}`)

      const result = streamText({
        model: this.model,
        temperature: enhancedPrompt.temperature,
        system: enhancedPrompt.systemPrompt,
        prompt: enhancedPrompt.userPrompt,
      })

      for await (const chunk of result.textStream) {
        yield chunk
      }
    } catch (error) {
      console.error("[VibeSDK] Streaming failed, falling back to mock:", error)
      // Fallback to mock streaming
      const mockResponse = this.getMockResponse(prompt)
      yield mockResponse
    }
  }

  /**
   * Explain existing Cadence code with enhanced quality-focused explanations
   */
  async explainCode({ code, question }: ExplainCodeOptions): Promise<string> {
    try {
      // Create generation context for explanation enhancement
      const generationContext: GenerationContext = {
        userPrompt: question || 'Explain this code',
        contractType: this.inferContractType(code),
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 85,
          requiredFeatures: [],
          prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 1
          }
        },
        userExperience: this.inferUserExperience(question || code)
      }

      // Use enhanced prompts for explanations
      const enhancementOptions: PromptEnhancementOptions = {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: generationContext.qualityRequirements,
        strictMode: false, // More relaxed for explanations
        temperature: 0.3
      }

      const enhancedPrompt = PromptEnhancer.enhancePromptForQuality(
        question || 'Explain this code',
        generationContext,
        enhancementOptions
      )

      // Build explanation-specific system prompt
      const explanationSystemPrompt = `You are an expert Flow blockchain developer and educator specializing in Cadence 1.0.
Provide comprehensive, accurate explanations of Cadence code with focus on quality and best practices.

${enhancedPrompt.systemPrompt}

🎯 EXPLANATION QUALITY REQUIREMENTS:
- Use precise Cadence 1.0 terminology (access(all), not pub)
- Explain modern patterns and best practices
- Highlight security considerations and resource management
- Point out any legacy patterns that should be avoided
- Provide context about Flow blockchain concepts
- Use clear, appropriate language for ${generationContext.userExperience} developers

📚 EDUCATIONAL FOCUS:
- Break down complex concepts into digestible parts
- Explain the "why" behind code patterns, not just the "what"
- Highlight best practices and common pitfalls
- Connect code patterns to broader Flow ecosystem concepts
- Provide actionable insights for improvement

🔍 CODE ANALYSIS DEPTH:
- Analyze resource lifecycle management
- Explain access control patterns and security implications
- Identify optimization opportunities and quality issues
- Point out compliance with Flow standards (NonFungibleToken, FungibleToken, etc.)
- Explain event emissions and their purposes
- Highlight any undefined values or quality concerns

⚠️ QUALITY FOCUS IN EXPLANATIONS:
- Always point out any "undefined" values or incomplete code
- Explain why modern Cadence 1.0 syntax is preferred
- Highlight security implications of code patterns
- Suggest improvements for production readiness`

      const explanationPrompt = question
        ? `Provide a comprehensive explanation of this Cadence code, specifically addressing: ${question}

\`\`\`cadence
${code}
\`\`\`

Focus on technical accuracy, quality assessment, best practices, and educational value appropriate for a ${generationContext.userExperience} developer.`
        : `Provide a comprehensive explanation of this Cadence code:

\`\`\`cadence
${code}
\`\`\`

Include analysis of patterns, quality assessment, best practices, potential improvements, and educational insights appropriate for a ${generationContext.userExperience} developer.`

      console.log(`[VibeSDK] Explaining code with enhanced prompts for ${generationContext.userExperience} user`)

      const { text } = await generateText({
        model: this.model,
        system: explanationSystemPrompt,
        prompt: explanationPrompt,
        temperature: enhancedPrompt.temperature,
      })

      return text
    } catch (error) {
      console.error("[VibeSDK] Code explanation failed:", error)

      // Enhanced fallback explanation when AI is not available
      const userLevel = this.inferUserExperience(code)
      const levelSpecificContent = userLevel === 'beginner'
        ? `
🌟 **For Beginners**:
- Resources are like special containers that can only exist in one place
- Access modifiers control who can call functions (access(all) means everyone)
- The init() function runs when the contract is first deployed
- Events are like notifications that tell everyone when something happens`
        : userLevel === 'expert'
          ? `
🚀 **Advanced Analysis**:
- Resource lifecycle management ensures no duplication or loss
- Capability-based security model provides fine-grained access control
- Storage API separation provides better security boundaries
- Event emissions enable off-chain indexing and monitoring`
          : `
💡 **Key Concepts**:
- Resources ensure digital asset security through linear types
- Access control patterns protect sensitive functionality
- Modern storage API provides better security and flexibility
- Events enable transparency and off-chain integration`

      return `This Cadence smart contract contains the following key components:

• **Contract Declaration**: Defines the main contract structure using Cadence 1.0 syntax
• **Resources**: Special objects that can only exist in one place at a time, ensuring digital asset security
• **Access Control**: Uses modern access(all), access(self), access(contract) modifiers instead of legacy pub
• **Functions**: Methods that can be called to interact with the contract, with proper pre/post conditions
• **Events**: Notifications emitted when important actions occur, providing transparency
• **Storage**: How data is stored on the blockchain using account.storage.save() and capabilities

${levelSpecificContent}

🔍 **Code Quality Analysis**:
The code follows Flow's resource-oriented programming model, which ensures digital assets are secure and can't be duplicated or lost. Modern Cadence 1.0 patterns should use access modifiers and the new storage API.

⚠️ **Potential Quality Issues to Check**:
- Ensure no "undefined" values are present anywhere in the code
- Verify all access modifiers use Cadence 1.0 syntax (access(all) not pub)
- Check that storage operations use modern API (account.storage, not account.save)
- Validate proper resource lifecycle management
- Confirm all functions have complete implementations
- Verify proper error handling with pre/post conditions

${question ? `\n🎯 **Regarding your specific question about "${question}"**: This would require a more detailed analysis of the code structure and context. Consider running the code through validation tools to identify specific patterns and improvements.` : ''}

💡 **Quality Improvement Suggestions**:
- Add comprehensive comments explaining complex logic
- Implement proper input validation with pre conditions
- Use descriptive variable and function names
- Follow established Flow ecosystem patterns and interfaces
- Test thoroughly before deployment to ensure production readiness`
    }
  }

  /**
   * Refine existing Cadence code based on user feedback with enhanced quality assurance
   */
  async refineCode({ code, refinementRequest }: RefineCodeOptions): Promise<string> {
    try {
      // Create generation context for refinement
      const generationContext: GenerationContext = {
        userPrompt: refinementRequest,
        contractType: this.inferContractType(refinementRequest),
        previousAttempts: [],
        qualityRequirements: {
          minimumQualityScore: 95, // Higher standard for refinements
          requiredFeatures: [],
          prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount', 'account.save', 'account.link'],
          performanceRequirements: {
            maxGenerationTime: 30000,
            maxValidationTime: 5000,
            maxRetryAttempts: 2 // Fewer retries for refinements
          }
        },
        userExperience: this.inferUserExperience(refinementRequest)
      }

      // Use enhanced prompts for refinement
      const enhancementOptions: PromptEnhancementOptions = {
        attemptNumber: 1,
        previousFailures: [],
        qualityRequirements: generationContext.qualityRequirements,
        strictMode: true, // Always use strict mode for refinements
        temperature: 0.2
      }

      const enhancedPrompt = PromptEnhancer.enhancePromptForQuality(
        refinementRequest,
        generationContext,
        enhancementOptions
      )

      // Build refinement-specific system prompt
      const refinementSystemPrompt = `${enhancedPrompt.systemPrompt}

🔧 REFINEMENT-SPECIFIC REQUIREMENTS:
- Analyze the existing code structure and patterns carefully
- Understand the user's refinement request thoroughly
- Implement changes while preserving ALL existing functionality
- NEVER break existing working code during refinement
- Add improvements beyond the specific request when beneficial
- Maintain or improve code quality during refinement

⚠️ REFINEMENT VALIDATION:
- All existing functionality must remain intact
- New functionality must be fully implemented
- All variables must have concrete values (no undefined)
- All syntax must be perfect and complete
- Code must be immediately deployable after refinement`

      const refinementPrompt = `Refine this Cadence code based on the user's request:

**Original Code:**
\`\`\`cadence
${code}
\`\`\`

**Refinement Request:**
${refinementRequest}

**Critical Requirements:**
- ZERO undefined values anywhere in the refined code
- Maintain ALL existing functionality while adding requested changes
- Use only modern Cadence 1.0 syntax and patterns
- Ensure complete, production-ready implementation
- Add proper error handling and validation where needed

Return only the refined Cadence code without explanations.`

      console.log("[VibeSDK] Refining code with enhanced quality prompts")

      const { text } = await generateText({
        model: this.model,
        system: refinementSystemPrompt,
        prompt: refinementPrompt,
        temperature: enhancedPrompt.temperature,
      })

      // Validate the refined code before returning
      const validation = this.validateGeneratedCode(text)
      const rejection = this.shouldRejectGeneratedCode(text)

      if (!validation.isValid || rejection.shouldReject) {
        console.warn("[VibeSDK] Refined code failed validation, attempting re-refinement with maximum strictness...")
        console.warn("[VibeSDK] Validation errors:", validation.errors?.slice(0, 3))
        console.warn("[VibeSDK] Rejection reason:", rejection.reason)

        // Analyze failures and retry with maximum enhancement
        const failurePatterns = this.analyzeValidationFailures(validation, rejection)

        const maxStrictOptions: PromptEnhancementOptions = {
          attemptNumber: 2,
          previousFailures: failurePatterns,
          qualityRequirements: generationContext.qualityRequirements,
          strictMode: true,
          temperature: 0.1
        }

        const maxEnhancedPrompt = PromptEnhancer.enhancePromptForQuality(
          refinementRequest,
          generationContext,
          maxStrictOptions
        )

        const strictRefinementPrompt = `${refinementPrompt}

🚨 CRITICAL FAILURE PREVENTION:
Previous refinement failed due to: ${failurePatterns.map(f => f.type).join(', ')}
This attempt MUST avoid these issues completely.

🔥 MAXIMUM STRICTNESS MODE:
- EXTREME VALIDATION: Every line must be syntactically perfect
- ZERO TOLERANCE: Any undefined value will cause rejection
- COMPLETE IMPLEMENTATION: No partial or incomplete code allowed
- PRODUCTION READY: Code must be immediately deployable`

        console.log("[VibeSDK] Attempting maximum strictness refinement")

        const { text: retryText } = await generateText({
          model: this.model,
          system: maxEnhancedPrompt.systemPrompt,
          prompt: strictRefinementPrompt,
          temperature: maxEnhancedPrompt.temperature,
        })

        const retryValidation = this.validateGeneratedCode(retryText)
        const retryRejection = this.shouldRejectGeneratedCode(retryText)

        if (retryValidation.isValid && !retryRejection.shouldReject) {
          console.log("[VibeSDK] Code refinement successful with maximum strictness")
          return retryText
        }

        console.error("[VibeSDK] Code refinement failed after maximum strictness retry, returning original code")
        return code // Return original code if refinement fails
      }

      console.log("[VibeSDK] Code refinement successful with enhanced prompts")
      return text
    } catch (error) {
      console.error("[VibeSDK] Code refinement failed:", error)
      return code // Return original code on error
    }
  }

  /**
   * Validate generated code for Cadence 1.0 compliance
   */
  validateGeneratedCode(code: string, options: CodeValidationOptions = {}): ValidationResult {
    return codeValidator.validateCode(code, options)
  }

  /**
   * Check if code should be automatically rejected due to legacy syntax
   */
  shouldRejectGeneratedCode(code: string): { shouldReject: boolean; reason: string } {
    return codeValidator.shouldRejectCode(code)
  }

  /**
   * Generate comprehensive code with validation result
   */
  async generateCodeWithValidation({ prompt, context, temperature = 0.7 }: GenerateCodeOptions): Promise<GenerateCodeResult> {
    try {
      const code = await this.generateCode({ prompt, context, temperature })
      const validation = this.validateGeneratedCode(code)
      const rejection = this.shouldRejectGeneratedCode(code)

      return {
        code,
        validation,
        rejected: rejection.shouldReject,
        rejectionReason: rejection.reason
      }
    } catch (error) {
      console.error("[VibeSDK] Code generation with validation failed:", error)
      const mockCode = this.getMockResponse(prompt)
      const validation = this.validateGeneratedCode(mockCode)

      return {
        code: mockCode,
        validation,
        rejected: false
      }
    }
  }

  /**
   * Get suggestions for fixing legacy code patterns
   */
  getCodeFixSuggestions(code: string): string[] {
    return codeValidator.generateFixSuggestions(code)
  }

  /**
   * Analyze code for legacy patterns
   */
  analyzeLegacyPatterns(code: string): {
    hasLegacyPatterns: boolean
    criticalIssues: number
    warnings: number
    patterns: string[]
  } {
    return codeValidator.analyzeLegacyPatterns(code)
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(code: string, options: CodeValidationOptions = {}) {
    return codeValidator.generateValidationReport(code, options)
  }

  /**
   * Infer contract type from user prompt for context-aware generation
   */
  private inferContractType(prompt: string): import("./quality-assurance/types").ContractType {
    const lowerPrompt = prompt.toLowerCase()

    if (lowerPrompt.includes('nft') || lowerPrompt.includes('non-fungible') || lowerPrompt.includes('collectible')) {
      return {
        category: 'nft',
        complexity: lowerPrompt.includes('marketplace') || lowerPrompt.includes('royalty') ? 'advanced' : 'intermediate',
        features: this.extractFeatures(lowerPrompt, ['metadata', 'royalty', 'collection', 'minting'])
      }
    }

    if (lowerPrompt.includes('token') || lowerPrompt.includes('fungible') || lowerPrompt.includes('currency')) {
      return {
        category: 'fungible-token',
        complexity: lowerPrompt.includes('staking') || lowerPrompt.includes('reward') ? 'advanced' : 'intermediate',
        features: this.extractFeatures(lowerPrompt, ['minting', 'burning', 'transfer', 'vault'])
      }
    }

    if (lowerPrompt.includes('dao') || lowerPrompt.includes('governance') || lowerPrompt.includes('voting')) {
      return {
        category: 'dao',
        complexity: 'advanced',
        features: this.extractFeatures(lowerPrompt, ['voting', 'proposal', 'member', 'treasury'])
      }
    }

    if (lowerPrompt.includes('marketplace') || lowerPrompt.includes('trading') || lowerPrompt.includes('exchange')) {
      return {
        category: 'marketplace',
        complexity: 'advanced',
        features: this.extractFeatures(lowerPrompt, ['listing', 'bidding', 'escrow', 'commission'])
      }
    }

    return {
      category: 'generic',
      complexity: 'simple',
      features: []
    }
  }

  /**
   * Extract features from prompt text
   */
  private extractFeatures(prompt: string, possibleFeatures: string[]): string[] {
    return possibleFeatures.filter(feature => prompt.includes(feature))
  }

  /**
   * Infer user experience level from prompt and context
   */
  private inferUserExperience(prompt: string, context?: string): 'beginner' | 'intermediate' | 'expert' {
    const combinedText = `${prompt} ${context || ''}`.toLowerCase()

    // Expert indicators
    const expertKeywords = [
      'optimization', 'gas efficiency', 'advanced patterns', 'custom interfaces',
      'complex logic', 'sophisticated', 'enterprise', 'production scale',
      'performance', 'security audit', 'formal verification'
    ]

    // Beginner indicators
    const beginnerKeywords = [
      'simple', 'basic', 'tutorial', 'learning', 'first time', 'beginner',
      'how to', 'getting started', 'introduction', 'easy', 'step by step'
    ]

    const expertScore = expertKeywords.filter(keyword => combinedText.includes(keyword)).length
    const beginnerScore = beginnerKeywords.filter(keyword => combinedText.includes(keyword)).length

    if (expertScore > beginnerScore && expertScore >= 2) {
      return 'expert'
    } else if (beginnerScore > expertScore && beginnerScore >= 2) {
      return 'beginner'
    }

    return 'intermediate' // Default to intermediate
  }

  /**
   * Analyze validation failures to create failure patterns for prompt enhancement
   */
  private analyzeValidationFailures(
    validation: ValidationResult,
    rejection: { shouldReject: boolean; reason: string }
  ): FailurePattern[] {
    const patterns: FailurePattern[] = []

    if (rejection.shouldReject) {
      if (rejection.reason.includes('undefined')) {
        patterns.push({
          type: 'undefined-values',
          frequency: 1,
          commonCauses: [
            'Incomplete variable initialization',
            'Missing default values',
            'Placeholder undefined literals',
            'Uninitialized optional types'
          ],
          suggestedSolutions: [
            'Use concrete default values (String: "", UInt64: 0, Bool: false)',
            'Complete all variable declarations with meaningful values',
            'Replace undefined with appropriate type defaults',
            'Initialize all contract state in init() function'
          ]
        })
      }

      if (rejection.reason.includes('pub') || rejection.reason.includes('legacy')) {
        patterns.push({
          type: 'legacy-syntax',
          frequency: 1,
          commonCauses: [
            'Using deprecated Cadence syntax',
            'Old access modifier patterns',
            'Legacy storage API usage',
            'Outdated account access patterns'
          ],
          suggestedSolutions: [
            'Use access(all) instead of pub',
            'Use modern storage API (account.storage.save)',
            'Use capabilities instead of account.link',
            'Update to Cadence 1.0 patterns'
          ]
        })
      }

      if (rejection.reason.includes('incomplete') || rejection.reason.includes('empty')) {
        patterns.push({
          type: 'incomplete-logic',
          frequency: 1,
          commonCauses: [
            'Empty function bodies',
            'Missing return statements',
            'Incomplete implementations',
            'Placeholder comments instead of code'
          ],
          suggestedSolutions: [
            'Implement all function bodies completely',
            'Add proper return values for all functions',
            'Complete all required interface methods',
            'Replace TODO comments with actual implementations'
          ]
        })
      }
    }

    if (!validation.isValid) {
      validation.errors?.forEach(error => {
        if (error.includes('bracket') || error.includes('parenthes') || error.includes('brace')) {
          patterns.push({
            type: 'syntax-errors',
            frequency: 1,
            commonCauses: [
              'Unmatched brackets or parentheses',
              'Missing closing braces',
              'Incorrect nesting of brackets',
              'Malformed function signatures'
            ],
            suggestedSolutions: [
              'Carefully match all opening and closing brackets',
              'Use proper indentation to track bracket nesting',
              'Validate function signature syntax',
              'Check all string literals are properly quoted'
            ]
          })
        }

        if (error.includes('incomplete') || error.includes('missing') || error.includes('expected')) {
          patterns.push({
            type: 'incomplete-logic',
            frequency: 1,
            commonCauses: [
              'Incomplete function implementations',
              'Missing required methods',
              'Unfinished statements',
              'Missing imports or dependencies'
            ],
            suggestedSolutions: [
              'Complete all function bodies with proper logic',
              'Implement all required interface methods',
              'Finish all incomplete statements',
              'Add all necessary imports'
            ]
          })
        }

        if (error.includes('type') || error.includes('interface')) {
          patterns.push({
            type: 'type-errors',
            frequency: 1,
            commonCauses: [
              'Incorrect type annotations',
              'Missing interface implementations',
              'Type mismatches in assignments',
              'Invalid resource type usage'
            ],
            suggestedSolutions: [
              'Use correct type annotations',
              'Implement all required interface methods',
              'Ensure type compatibility in assignments',
              'Follow proper resource type patterns'
            ]
          })
        }
      })
    }

    return patterns
  }

  /**
   * Generate a conversational response about Flow/Cadence with enhanced quality focus
   */
  async chat(message: string, conversationHistory?: Array<{ role: string; content: string }>): Promise<string> {
    // Create generation context for chat enhancement
    const generationContext: GenerationContext = {
      userPrompt: message,
      contractType: this.inferContractType(message),
      previousAttempts: [],
      qualityRequirements: {
        minimumQualityScore: 85,
        requiredFeatures: [],
        prohibitedPatterns: ['undefined', 'pub ', 'AuthAccount', 'account.save', 'account.link'],
        performanceRequirements: {
          maxGenerationTime: 30000,
          maxValidationTime: 5000,
          maxRetryAttempts: 1 // Fewer retries for chat
        }
      },
      userExperience: this.inferUserExperience(message)
    }

    // Use enhanced prompts for chat with conversational focus
    const enhancementOptions: PromptEnhancementOptions = {
      attemptNumber: 1,
      previousFailures: [],
      qualityRequirements: generationContext.qualityRequirements,
      strictMode: false, // More relaxed for conversation
      temperature: 0.7
    }

    const enhancedPrompt = PromptEnhancer.enhancePromptForQuality(
      message,
      generationContext,
      enhancementOptions
    )

    // Build chat-specific system prompt
    const chatSystemPrompt = `You are VibeMore's AI assistant, an expert in Flow blockchain development and Cadence 1.0 smart contracts.
Help developers build high-quality Cadence smart contracts using natural language.

${enhancedPrompt.systemPrompt}

💬 CONVERSATION QUALITY STANDARDS:
- Always promote Cadence 1.0 best practices and modern syntax
- Emphasize quality, security, and production-readiness
- Discourage legacy patterns (pub, AuthAccount, old storage API)
- Encourage proper resource management and access control
- Provide actionable, specific guidance

🎯 COMMUNICATION STYLE:
- Be friendly, encouraging, and enthusiastic about Flow development
- Use phrases like "Let's vibe this into existence!" and "That's going to be amazing!"
- Keep responses concise but comprehensive
- Provide specific examples and code snippets when helpful
- Always focus on quality and best practices

🚨 QUALITY EMPHASIS IN CONVERSATION:
- Always mention avoiding "undefined" values in code examples
- Promote complete, production-ready implementations
- Encourage testing and validation
- Highlight security considerations
- Suggest modern Cadence patterns and interfaces

🔧 TECHNICAL GUIDANCE:
- Provide accurate Cadence 1.0 syntax and patterns
- Explain resource-oriented programming concepts
- Guide users toward Flow ecosystem standards
- Suggest appropriate interfaces (NonFungibleToken, FungibleToken, etc.)
- Help troubleshoot common issues with quality-focused solutions

USER EXPERIENCE LEVEL: ${generationContext.userExperience}
${generationContext.userExperience === 'beginner' ? '- Use simple explanations and provide step-by-step guidance' : ''}
${generationContext.userExperience === 'expert' ? '- Provide advanced insights and optimization suggestions' : ''}`

    const messages = conversationHistory || []
    messages.push({ role: "user", content: message })

    try {
      console.log(`[VibeSDK] Chat with enhanced prompts for ${generationContext.userExperience} user`)

      const { text } = await generateText({
        model: this.model,
        system: chatSystemPrompt,
        messages: messages as any,
        temperature: enhancedPrompt.temperature,
      })

      return text
    } catch (error) {
      console.error("[VibeSDK] Chat failed:", error)
      // Enhanced fallback response based on user experience
      const experienceSpecificTips = generationContext.userExperience === 'beginner'
        ? `
🌟 **Getting Started Tips**:
- Start with simple contracts to learn the basics
- Focus on understanding resources and access control
- Use the Flow Playground to test your code
- Read the official Cadence documentation`
        : generationContext.userExperience === 'expert'
          ? `
🚀 **Advanced Considerations**:
- Optimize for gas efficiency and performance
- Implement sophisticated access control patterns
- Consider formal verification for critical contracts
- Use advanced Cadence features like entitlements`
          : `
💡 **Development Tips**:
- Follow established patterns and best practices
- Test thoroughly before deployment
- Use proper error handling and validation
- Stay updated with Flow ecosystem changes`

      return `Hey there! 👋 I'm here to help you build amazing Cadence smart contracts on Flow! 

While I'm having a temporary connection issue, I can still share some key quality-focused tips:

🚀 **Quality First**: Always ensure your contracts are production-ready with:
- No "undefined" values anywhere in your code
- Modern Cadence 1.0 syntax (access(all) instead of pub)
- Complete function implementations with proper error handling
- Proper resource management and lifecycle control

${experienceSpecificTips}

🔧 **Modern Patterns**:
- Use the modern storage API (account.storage.save, account.capabilities)
- Implement proper access control with entitlements
- Follow Flow standards for NFTs (NonFungibleToken) and tokens (FungibleToken)
- Add comprehensive pre/post conditions for validation

Let's vibe this into existence once my connection is restored! In the meantime, feel free to ask about specific Cadence patterns, Flow development concepts, or quality assurance practices.`
    }
  }

  // ===== FULL-STACK GENERATION CAPABILITIES =====

  /**
   * Parse natural language prompt to identify frontend and backend requirements
   */
  parseFullStackPrompt(prompt: string): ParsedPromptResult {
    const lowerPrompt = prompt.toLowerCase()

    // Determine project type
    const projectType = this.identifyProjectType(lowerPrompt)

    // Extract backend requirements
    const backendRequirements = this.extractBackendRequirements(lowerPrompt, projectType)

    // Extract frontend requirements
    const frontendRequirements = this.extractFrontendRequirements(lowerPrompt, projectType)

    // Extract integration requirements
    const integrationRequirements = this.extractIntegrationRequirements(lowerPrompt, projectType)

    // Calculate confidence based on specificity of requirements
    const confidence = this.calculateParsingConfidence(
      backendRequirements,
      frontendRequirements,
      integrationRequirements
    )

    return {
      projectType,
      backendRequirements,
      frontendRequirements,
      integrationRequirements,
      confidence
    }
  }

  /**
   * Identify the type of project from the prompt
   */
  private identifyProjectType(prompt: string): ProjectType {
    if (prompt.includes('marketplace') || prompt.includes('buy') && prompt.includes('sell')) {
      return 'marketplace'
    }
    if (prompt.includes('nft') || prompt.includes('collectible') || prompt.includes('art')) {
      return 'nft-collection'
    }
    if (prompt.includes('dao') || prompt.includes('governance') || prompt.includes('voting')) {
      return 'dao'
    }
    if (prompt.includes('defi') || prompt.includes('staking') || prompt.includes('yield') || prompt.includes('liquidity')) {
      return 'defi-protocol'
    }
    if (prompt.includes('token') && !prompt.includes('nft')) {
      return 'token'
    }
    return 'custom'
  }

  /**
   * Extract backend (smart contract) requirements from prompt
   */
  private extractBackendRequirements(prompt: string, projectType: ProjectType): BackendRequirements {
    const contractTypes: string[] = []
    const functions: FunctionRequirement[] = []
    const events: EventRequirement[] = []
    const resources: ResourceRequirement[] = []

    // Determine contract types based on project type and prompt content
    switch (projectType) {
      case 'nft-collection':
        contractTypes.push('NFT', 'Collection', 'Minter')
        functions.push(
          { name: 'mintNFT', purpose: 'Create new NFT', parameters: ['recipient', 'metadata'], returnType: 'Void', access: 'all' },
          { name: 'borrowNFT', purpose: 'Get NFT reference', parameters: ['id'], returnType: '&NFT', access: 'all' }
        )
        events.push(
          { name: 'Minted', purpose: 'NFT created', fields: ['id', 'recipient'] },
          { name: 'Deposit', purpose: 'NFT deposited', fields: ['id', 'to'] }
        )
        resources.push(
          { name: 'NFT', purpose: 'Individual NFT token', interfaces: ['NonFungibleToken.NFT'], functions: ['getViews', 'resolveView'] },
          { name: 'Collection', purpose: 'NFT collection', interfaces: ['NonFungibleToken.Collection'], functions: ['deposit', 'withdraw', 'getIDs'] }
        )
        break

      case 'marketplace':
        contractTypes.push('Marketplace', 'SaleCollection')
        functions.push(
          { name: 'listForSale', purpose: 'List NFT for sale', parameters: ['tokenID', 'price'], returnType: 'Void', access: 'all' },
          { name: 'purchase', purpose: 'Buy NFT', parameters: ['tokenID', 'recipient', 'payment'], returnType: 'Void', access: 'all' }
        )
        events.push(
          { name: 'ForSale', purpose: 'NFT listed', fields: ['id', 'price', 'owner'] },
          { name: 'TokenPurchased', purpose: 'NFT sold', fields: ['id', 'price', 'seller', 'buyer'] }
        )
        break

      case 'token':
        contractTypes.push('FungibleToken', 'Vault', 'Minter')
        functions.push(
          { name: 'mintTokens', purpose: 'Create new tokens', parameters: ['amount', 'recipient'], returnType: 'Void', access: 'all' },
          { name: 'transfer', purpose: 'Transfer tokens', parameters: ['amount', 'recipient'], returnType: 'Void', access: 'all' }
        )
        break

      default:
        // Extract custom requirements from prompt
        if (prompt.includes('mint')) {
          functions.push({ name: 'mint', purpose: 'Create new items', parameters: ['recipient'], returnType: 'Void', access: 'all' })
        }
        if (prompt.includes('transfer')) {
          functions.push({ name: 'transfer', purpose: 'Transfer items', parameters: ['recipient'], returnType: 'Void', access: 'all' })
        }
    }

    return { contractTypes, functions, events, resources }
  }

  /**
   * Extract frontend requirements from prompt
   */
  private extractFrontendRequirements(prompt: string, projectType: ProjectType): FrontendRequirements {
    const pages: string[] = []
    const components: string[] = []
    const interactions: InteractionRequirement[] = []

    // Default styling requirements
    const styling: StylingRequirements = {
      framework: 'tailwind',
      theme: 'auto',
      responsive: true,
      accessibility: true
    }

    // Determine pages based on project type
    switch (projectType) {
      case 'nft-collection':
        pages.push('Home', 'Collection', 'Mint', 'Profile')
        components.push('NFTCard', 'MintForm', 'CollectionGrid', 'WalletConnect')
        interactions.push(
          { type: 'form', contractFunction: 'mintNFT', userInput: ['metadata', 'recipient'], feedback: ['success', 'error', 'loading'] },
          { type: 'display', contractFunction: 'getIDs', userInput: [], feedback: ['loading', 'empty'] }
        )
        break

      case 'marketplace':
        pages.push('Home', 'Marketplace', 'Listing', 'Profile')
        components.push('NFTCard', 'ListingForm', 'PurchaseButton', 'PriceDisplay')
        interactions.push(
          { type: 'form', contractFunction: 'listForSale', userInput: ['tokenID', 'price'], feedback: ['success', 'error'] },
          { type: 'button', contractFunction: 'purchase', userInput: ['tokenID', 'payment'], feedback: ['success', 'error', 'loading'] }
        )
        break

      case 'token':
        pages.push('Home', 'Transfer', 'Balance')
        components.push('BalanceDisplay', 'TransferForm', 'TransactionHistory')
        interactions.push(
          { type: 'form', contractFunction: 'transfer', userInput: ['amount', 'recipient'], feedback: ['success', 'error'] }
        )
        break

      default:
        pages.push('Home', 'Dashboard')
        components.push('WalletConnect', 'ContractInteraction')
    }

    // Extract custom UI requirements from prompt
    if (prompt.includes('dashboard')) pages.push('Dashboard')
    if (prompt.includes('admin')) pages.push('Admin')
    if (prompt.includes('profile')) pages.push('Profile')

    return { pages, components, interactions, styling }
  }

  /**
   * Extract integration requirements between frontend and backend
   */
  private extractIntegrationRequirements(prompt: string, projectType: ProjectType): IntegrationRequirements {
    const apiEndpoints: string[] = []
    const contractBindings: string[] = []
    const dataFlow: DataFlowRequirement[] = []

    // Generate API endpoints based on project type
    switch (projectType) {
      case 'nft-collection':
        apiEndpoints.push('/api/mint', '/api/collection', '/api/metadata')
        contractBindings.push('mintNFT', 'getIDs', 'borrowNFT')
        dataFlow.push(
          { source: 'MintForm', destination: 'mintNFT', transformation: 'form-to-transaction', validation: ['required-fields', 'wallet-connected'] },
          { source: 'contract-events', destination: 'CollectionGrid', transformation: 'event-to-ui-update', validation: ['event-valid'] }
        )
        break

      case 'marketplace':
        apiEndpoints.push('/api/list', '/api/purchase', '/api/listings')
        contractBindings.push('listForSale', 'purchase', 'getIDs')
        dataFlow.push(
          { source: 'ListingForm', destination: 'listForSale', transformation: 'form-to-transaction', validation: ['price-valid', 'nft-owned'] },
          { source: 'PurchaseButton', destination: 'purchase', transformation: 'click-to-transaction', validation: ['sufficient-balance'] }
        )
        break

      default:
        apiEndpoints.push('/api/interact')
        contractBindings.push('defaultFunction')
    }

    return { apiEndpoints, contractBindings, dataFlow }
  }

  /**
   * Calculate confidence score for parsing results
   */
  private calculateParsingConfidence(
    backend: BackendRequirements,
    frontend: FrontendRequirements,
    integration: IntegrationRequirements
  ): number {
    let score = 0

    // Backend completeness (40% of score)
    if (backend.contractTypes.length > 0) score += 10
    if (backend.functions.length > 0) score += 15
    if (backend.events.length > 0) score += 10
    if (backend.resources.length > 0) score += 5

    // Frontend completeness (35% of score)
    if (frontend.pages.length > 0) score += 15
    if (frontend.components.length > 0) score += 10
    if (frontend.interactions.length > 0) score += 10

    // Integration completeness (25% of score)
    if (integration.apiEndpoints.length > 0) score += 10
    if (integration.contractBindings.length > 0) score += 10
    if (integration.dataFlow.length > 0) score += 5

    return Math.min(score, 100)
  }

  /**
   * Analyze project structure and identify components needed
   */
  analyzeProjectStructure(parsedPrompt: ParsedPromptResult, projectName: string): ProjectStructure {
    const directories: Directory[] = []
    const files: GeneratedFile[] = []
    const configurations: ConfigurationFile[] = []

    // Create standard Next.js directory structure
    directories.push(
      { name: 'app', path: 'app', children: [] },
      { name: 'components', path: 'components', children: [] },
      { name: 'lib', path: 'lib', children: [] },
      { name: 'contracts', path: 'contracts', children: [] },
      { name: 'public', path: 'public', children: [] }
    )

    // Add API routes directory
    const apiDir: Directory = { name: 'api', path: 'app/api', children: [] }
    directories.find(d => d.name === 'app')?.children.push(apiDir)

    // Generate files based on requirements

    // Smart contract files
    parsedPrompt.backendRequirements.contractTypes.forEach(contractType => {
      files.push({
        name: `${contractType}.cdc`,
        path: `contracts/${contractType}.cdc`,
        content: '', // Will be generated later
        type: 'contract'
      })
    })

    // Frontend page files
    parsedPrompt.frontendRequirements.pages.forEach(page => {
      files.push({
        name: `page.tsx`,
        path: `app/${page.toLowerCase()}/page.tsx`,
        content: '', // Will be generated later
        type: 'component'
      })
    })

    // Component files
    parsedPrompt.frontendRequirements.components.forEach(component => {
      files.push({
        name: `${component.toLowerCase()}.tsx`,
        path: `components/${component.toLowerCase()}.tsx`,
        content: '', // Will be generated later
        type: 'component'
      })
    })

    // API route files
    parsedPrompt.integrationRequirements.apiEndpoints.forEach(endpoint => {
      const routeName = endpoint.replace('/api/', '')
      files.push({
        name: 'route.ts',
        path: `app/api/${routeName}/route.ts`,
        content: '', // Will be generated later
        type: 'api'
      })
    })

    // Configuration files
    configurations.push(
      {
        name: 'package.json',
        path: 'package.json',
        content: '', // Will be generated later
        configType: 'package'
      },
      {
        name: 'next.config.mjs',
        path: 'next.config.mjs',
        content: '', // Will be generated later
        configType: 'next'
      },
      {
        name: 'tailwind.config.ts',
        path: 'tailwind.config.ts',
        content: '', // Will be generated later
        configType: 'tailwind'
      },
      {
        name: 'tsconfig.json',
        path: 'tsconfig.json',
        content: '', // Will be generated later
        configType: 'typescript'
      },
      {
        name: '.env.example',
        path: '.env.example',
        content: '', // Will be generated later
        configType: 'env'
      }
    )

    return { directories, files, configurations }
  }

  /**
   * Generate full-stack dApp project
   */
  async generateFullStackProject(options: FullStackGenerationOptions): Promise<FullStackGenerationResult> {
    console.log(`[VibeSDK] Starting full-stack generation for project: ${options.projectName}`)

    // Parse the prompt to understand requirements
    const parsedPrompt = this.parseFullStackPrompt(options.prompt)
    console.log(`[VibeSDK] Parsed prompt with ${parsedPrompt.confidence}% confidence as ${parsedPrompt.projectType} project`)

    // Analyze project structure
    const projectStructure = this.analyzeProjectStructure(parsedPrompt, options.projectName)

    // Initialize result containers
    const smartContracts: GeneratedContract[] = []
    const frontendComponents: GeneratedComponent[] = []
    const apiRoutes: GeneratedAPIRoute[] = []
    const configurations: GeneratedConfig[] = []
    const integrationCode: IntegrationCode = { hooks: [], utilities: [], types: [] }

    try {
      // Generate smart contracts if backend is needed
      if (parsedPrompt.backendRequirements.contractTypes.length > 0) {
        console.log(`[VibeSDK] Generating ${parsedPrompt.backendRequirements.contractTypes.length} smart contracts`)

        for (const contractType of parsedPrompt.backendRequirements.contractTypes) {
          const contractPrompt = this.buildContractPrompt(contractType, parsedPrompt, options)
          const contractCode = await this.generateCode({
            prompt: contractPrompt,
            context: options.context,
            temperature: options.temperature
          })

          const validation = this.validateGeneratedCode(contractCode)

          smartContracts.push({
            filename: `${contractType}.cdc`,
            code: contractCode,
            validation,
            dependencies: this.extractContractDependencies(contractCode)
          })
        }
      }

      // Generate frontend components if frontend is needed
      if (options.includeFrontend && parsedPrompt.frontendRequirements.components.length > 0) {
        console.log(`[VibeSDK] Generating ${parsedPrompt.frontendRequirements.components.length} frontend components`)

        for (const componentName of parsedPrompt.frontendRequirements.components) {
          const componentCode = this.generateReactComponent(componentName, parsedPrompt, smartContracts)

          frontendComponents.push({
            filename: `${componentName.toLowerCase()}.tsx`,
            code: componentCode,
            componentType: this.determineComponentType(componentName),
            dependencies: this.extractComponentDependencies(componentCode),
            contractIntegrations: this.identifyContractIntegrations(componentCode, smartContracts)
          })
        }

        // Generate pages
        for (const pageName of parsedPrompt.frontendRequirements.pages) {
          const pageCode = this.generateReactPage(pageName, parsedPrompt, frontendComponents)

          frontendComponents.push({
            filename: `page.tsx`,
            code: pageCode,
            componentType: 'page',
            dependencies: this.extractComponentDependencies(pageCode),
            contractIntegrations: []
          })
        }
      }

      // Generate API routes if API is needed
      if (options.includeAPI && parsedPrompt.integrationRequirements.apiEndpoints.length > 0) {
        console.log(`[VibeSDK] Generating ${parsedPrompt.integrationRequirements.apiEndpoints.length} API routes`)

        for (const endpoint of parsedPrompt.integrationRequirements.apiEndpoints) {
          const routeCode = this.generateAPIRoute(endpoint, parsedPrompt, smartContracts)

          apiRoutes.push({
            filename: 'route.ts',
            code: routeCode,
            endpoint: endpoint,
            methods: this.extractHTTPMethods(routeCode),
            contractCalls: this.extractContractCalls(routeCode)
          })
        }
      }

      // Generate configuration files
      console.log(`[VibeSDK] Generating configuration files`)

      configurations.push(
        {
          filename: 'package.json',
          code: this.generatePackageJson(options, parsedPrompt),
          configType: 'package'
        },
        {
          filename: 'next.config.mjs',
          code: this.generateNextConfig(options),
          configType: 'next'
        },
        {
          filename: 'tailwind.config.ts',
          code: this.generateTailwindConfig(options),
          configType: 'tailwind'
        },
        {
          filename: 'tsconfig.json',
          code: this.generateTSConfig(options),
          configType: 'typescript'
        },
        {
          filename: '.env.example',
          code: this.generateEnvExample(options),
          configType: 'env'
        }
      )

      // Generate integration code (hooks, utilities, types)
      integrationCode.hooks = this.generateReactHooks(smartContracts, parsedPrompt)
      integrationCode.utilities = this.generateUtilities(smartContracts, parsedPrompt)
      integrationCode.types = this.generateTypeDefinitions(smartContracts, parsedPrompt)

      console.log(`[VibeSDK] Full-stack generation completed successfully`)

      return {
        smartContracts,
        frontendComponents,
        apiRoutes,
        configurations,
        projectStructure,
        integrationCode
      }

    } catch (error) {
      console.error(`[VibeSDK] Full-stack generation failed:`, error)
      throw new Error(`Full-stack generation failed: ${error}`)
    }
  }

  // Helper methods for full-stack generation (stubs for now - will be implemented in subsequent tasks)

  private buildContractPrompt(contractType: string, parsedPrompt: ParsedPromptResult, options: FullStackGenerationOptions): string {
    return `Generate a ${contractType} smart contract for a ${parsedPrompt.projectType} project. ${options.prompt}`
  }

  private extractContractDependencies(code: string): string[] {
    const imports = code.match(/import\s+"([^"]+)"/g) || []
    return imports.map(imp => imp.replace(/import\s+"([^"]+)"/, '$1'))
  }

  private generateReactComponent(componentName: string, parsedPrompt: ParsedPromptResult, contracts: GeneratedContract[]): string {
    return `// ${componentName} component - generated by VibeSDK\n// TODO: Implement in subsequent tasks`
  }

  private generateReactPage(pageName: string, parsedPrompt: ParsedPromptResult, components: GeneratedComponent[]): string {
    return `// ${pageName} page - generated by VibeSDK\n// TODO: Implement in subsequent tasks`
  }

  private generateAPIRoute(endpoint: string, parsedPrompt: ParsedPromptResult, contracts: GeneratedContract[]): string {
    return `// API route for ${endpoint} - generated by VibeSDK\n// TODO: Implement in subsequent tasks`
  }

  private determineComponentType(componentName: string): 'page' | 'component' | 'layout' {
    if (componentName.toLowerCase().includes('layout')) return 'layout'
    if (componentName.toLowerCase().includes('page')) return 'page'
    return 'component'
  }

  private extractComponentDependencies(code: string): string[] {
    const imports = code.match(/import.*from\s+['"]([^'"]+)['"]/g) || []
    return imports.map(imp => imp.replace(/import.*from\s+['"]([^'"]+)['"]/, '$1'))
  }

  private identifyContractIntegrations(code: string, contracts: GeneratedContract[]): ContractIntegration[] {
    // Stub implementation - will be enhanced in subsequent tasks
    return []
  }

  private extractHTTPMethods(code: string): string[] {
    const methods = []
    if (code.includes('export async function GET')) methods.push('GET')
    if (code.includes('export async function POST')) methods.push('POST')
    if (code.includes('export async function PUT')) methods.push('PUT')
    if (code.includes('export async function DELETE')) methods.push('DELETE')
    return methods
  }

  private extractContractCalls(code: string): string[] {
    // Stub implementation - will be enhanced in subsequent tasks
    return []
  }

  private generatePackageJson(options: FullStackGenerationOptions, parsedPrompt: ParsedPromptResult): string {
    return JSON.stringify({
      name: options.projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint"
      },
      dependencies: {
        "next": "15.2.4",
        "react": "19",
        "react-dom": "19",
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
        "typescript": "^5",
        "tailwindcss": "^4.1.9",
        "postcss": "^8",
        "autoprefixer": "^10"
      }
    }, null, 2)
  }

  private generateNextConfig(options: FullStackGenerationOptions): string {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`
  }

  private generateTailwindConfig(options: FullStackGenerationOptions): string {
    return `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config`
  }

  private generateTSConfig(options: FullStackGenerationOptions): string {
    return JSON.stringify({
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "es6"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [
          {
            name: "next"
          }
        ],
        baseUrl: ".",
        paths: {
          "@/*": ["./*"]
        }
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"]
    }, null, 2)
  }

  private generateEnvExample(options: FullStackGenerationOptions): string {
    return `# Flow Network Configuration
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# AI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_NAME=${options.projectName}
NEXT_PUBLIC_APP_URL=http://localhost:3000`
  }

  private generateReactHooks(contracts: GeneratedContract[], parsedPrompt: ParsedPromptResult): string[] {
    // Stub implementation - will be enhanced in subsequent tasks
    return [`// React hooks for contract integration - TODO: Implement in subsequent tasks`]
  }

  private generateUtilities(contracts: GeneratedContract[], parsedPrompt: ParsedPromptResult): string[] {
    // Stub implementation - will be enhanced in subsequent tasks
    return [`// Utility functions for contract integration - TODO: Implement in subsequent tasks`]
  }

  private generateTypeDefinitions(contracts: GeneratedContract[], parsedPrompt: ParsedPromptResult): string[] {
    // Stub implementation - will be enhanced in subsequent tasks
    return [`// TypeScript type definitions - TODO: Implement in subsequent tasks`]
  }
}

// Export singleton instance
export const vibeSDK = new VibeSDK()
