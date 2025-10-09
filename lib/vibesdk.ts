import { generateText, streamText } from "ai"
import { codeValidator, CodeValidationOptions } from "./migration/code-validator"
import { ValidationResult } from "./migration/types"
import { PromptEnhancer, PromptEnhancementOptions } from "./quality-assurance/prompt-enhancer"
import { GenerationContext, FailurePattern, QualityRequirements } from "./quality-assurance/types"

// Try-catch imports to handle potential module resolution issues
let openai: any, anthropic: any, google: any

try {
  const openaiModule = require("@ai-sdk/openai")
  openai = openaiModule.openai
} catch (e) {
  console.warn("[VibeSDK] OpenAI provider not available")
}

try {
  const anthropicModule = require("@ai-sdk/anthropic")
  anthropic = anthropicModule.anthropic
} catch (e) {
  console.warn("[VibeSDK] Anthropic provider not available")
}

try {
  const googleModule = require("@ai-sdk/google")
  google = googleModule.google
} catch (e) {
  console.warn("[VibeSDK] Google provider not available")
}

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

/**
 * VibeSDK - AI-powered Cadence code generation for Flow blockchain
 */
export class VibeSDK {
  private model: any
  private isAIAvailable: boolean = false

  constructor() {
    this.initializeModel()
  }

  private initializeModel() {
    // Priority order: OpenAI > Gemini > Anthropic > Vercel AI Gateway > Mock
    if (process.env.OPENAI_API_KEY && openai) {
      this.model = openai("gpt-4o")
      this.isAIAvailable = true
      console.log("[VibeSDK] Using OpenAI GPT-4o")
    } else if (process.env.GOOGLE_GENERATIVE_AI_API_KEY && google) {
      this.model = google("gemini-2.0-flash-exp")
      this.isAIAvailable = true
      console.log("[VibeSDK] Using Google Gemini 2.0 Flash")
    } else if (process.env.ANTHROPIC_API_KEY && anthropic) {
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
}

// Export singleton instance
export const vibeSDK = new VibeSDK()
