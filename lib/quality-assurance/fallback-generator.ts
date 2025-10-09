/**
 * Intelligent Fallback Generation System
 * 
 * This module provides guaranteed-working contract templates when AI generation fails
 * or produces low-quality code. It analyzes user prompts to determine contract type
 * and provides appropriate fallback templates.
 */

import { ContractType, GenerationContext, QualityAssuredResult } from './types'
import { templates, Template } from '../templates'

// Simple logger interface for fallback generator
interface Logger {
  info: (message: string, data?: any) => void
  warn: (message: string, data?: any) => void
  error: (message: string, data?: any) => void
}

// Create a simple console logger
const logger: Logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data || '')
    }
  },
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data || '')
    }
  },
  error: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, data || '')
    }
  }
}

export interface FallbackGenerationResult {
  code: string
  templateUsed: string
  confidence: number
  contractType: ContractType
  reasoning: string
  success: boolean
}

export interface ContractTypeDetectionResult {
  contractType: ContractType
  confidence: number
  keywords: string[]
  reasoning: string
}

export interface FallbackTemplate {
  id: string
  name: string
  contractType: ContractType
  code: string
  description: string
  keywords: string[]
  complexity: 'simple' | 'intermediate' | 'advanced'
  guaranteedWorking: boolean
}

/**
 * Intelligent Fallback Generator for AI code generation failures
 */
export class FallbackGenerator {
  private fallbackTemplates: Map<string, FallbackTemplate> = new Map()
  private contractTypePatterns: Map<string, RegExp[]> = new Map()

  constructor() {
    this.initializeFallbackTemplates()
    this.initializeContractTypePatterns()
  }

  /**
   * Generate fallback contract based on user prompt and context
   */
  async generateFallbackContract(
    prompt: string, 
    context?: GenerationContext
  ): Promise<FallbackGenerationResult> {
    try {
      logger.info('Generating fallback contract', { prompt: prompt.substring(0, 100) })

      // Detect contract type from prompt
      const typeDetection = this.detectContractType(prompt)
      
      // Select best fallback template
      const template = this.selectBestTemplate(typeDetection.contractType, prompt)
      
      if (!template) {
        // Use emergency fallback for empty or invalid prompts
        if (!prompt || prompt.trim().length === 0) {
          return {
            code: this.getGenericFallback(),
            templateUsed: 'emergency-fallback',
            confidence: 0.1,
            contractType: { category: 'generic', complexity: 'simple', features: [] },
            reasoning: 'Emergency fallback due to empty prompt',
            success: false
          }
        }
        
        return {
          code: this.getGenericFallback(),
          templateUsed: 'generic-fallback',
          confidence: 0.3,
          contractType: { category: 'generic', complexity: 'simple', features: [] },
          reasoning: 'No specific template found, using generic fallback',
          success: false
        }
      }

      // Customize template based on prompt
      const customizedCode = this.customizeTemplate(template, prompt, context)

      return {
        code: customizedCode,
        templateUsed: template.id,
        confidence: typeDetection.confidence,
        contractType: template.contractType,
        reasoning: `Selected ${template.name} based on detected type: ${typeDetection.contractType.category}`,
        success: true
      }

    } catch (error) {
      logger.error('Fallback generation failed', { error: error.message, prompt })
      
      return {
        code: this.getGenericFallback(),
        templateUsed: 'emergency-fallback',
        confidence: 0.1,
        contractType: { category: 'generic', complexity: 'simple', features: [] },
        reasoning: `Emergency fallback due to error: ${error.message}`,
        success: false
      }
    }
  }

  /**
   * Detect contract type from user prompt using pattern matching
   */
  detectContractType(prompt: string): ContractTypeDetectionResult {
    const normalizedPrompt = prompt.toLowerCase()
    const detectedKeywords: string[] = []
    let bestMatch: { category: string; confidence: number; keywords: string[] } = {
      category: 'generic',
      confidence: 0,
      keywords: []
    }

    // Check each contract type pattern
    for (const [category, patterns] of this.contractTypePatterns.entries()) {
      let categoryScore = 0
      const matchedKeywords: string[] = []

      for (const pattern of patterns) {
        const matches = normalizedPrompt.match(pattern)
        if (matches) {
          categoryScore += matches.length
          matchedKeywords.push(...matches)
        }
      }

      if (categoryScore > bestMatch.confidence) {
        bestMatch = {
          category,
          confidence: categoryScore,
          keywords: matchedKeywords
        }
      }
    }

    // Determine complexity based on prompt length and keywords
    const complexity = this.determineComplexity(prompt, bestMatch.keywords)
    
    // Extract features from prompt
    const features = this.extractFeatures(prompt, bestMatch.category)

    const contractType: ContractType = {
      category: bestMatch.category as ContractType['category'],
      complexity,
      features
    }

    // Normalize confidence to 0-1 range (more generous scoring)
    const normalizedConfidence = Math.min(bestMatch.confidence / 3, 1.0)

    return {
      contractType,
      confidence: normalizedConfidence,
      keywords: bestMatch.keywords,
      reasoning: `Detected ${bestMatch.category} contract with ${bestMatch.confidence} keyword matches`
    }
  }

  /**
   * Select the best fallback template for the detected contract type
   */
  private selectBestTemplate(contractType: ContractType, prompt: string): FallbackTemplate | null {
    const candidates = Array.from(this.fallbackTemplates.values())
      .filter(template => template.contractType.category === contractType.category)
      .filter(template => template.guaranteedWorking)

    if (candidates.length === 0) {
      // Fallback to generic templates
      return Array.from(this.fallbackTemplates.values())
        .find(template => template.contractType.category === 'generic') || null
    }

    // Score templates based on feature match and complexity
    const scoredTemplates = candidates.map(template => {
      let score = 0
      
      // Complexity match bonus
      if (template.complexity === contractType.complexity) {
        score += 3
      } else if (
        (template.complexity === 'simple' && contractType.complexity === 'intermediate') ||
        (template.complexity === 'intermediate' && contractType.complexity === 'simple')
      ) {
        score += 1
      }

      // Feature match bonus
      const featureMatches = template.contractType.features.filter(
        feature => contractType.features.includes(feature)
      ).length
      score += featureMatches * 2

      // Keyword match bonus
      const promptLower = prompt.toLowerCase()
      const keywordMatches = template.keywords.filter(
        keyword => promptLower.includes(keyword.toLowerCase())
      ).length
      score += keywordMatches

      return { template, score }
    })

    // Return highest scoring template
    scoredTemplates.sort((a, b) => b.score - a.score)
    return scoredTemplates[0]?.template || null
  }

  /**
   * Customize template based on user prompt and context
   */
  private customizeTemplate(
    template: FallbackTemplate, 
    prompt: string, 
    context?: GenerationContext
  ): string {
    let customizedCode = template.code

    // Extract potential contract name from prompt
    const contractName = this.extractContractName(prompt) || 'MyContract'
    
    // Replace generic contract names with extracted name
    customizedCode = customizedCode.replace(
      /contract\s+\w+/g, 
      `contract ${contractName}`
    )

    // Add comment explaining this is a fallback template
    const fallbackComment = `// This contract was generated using a fallback template (${template.name})
// Template ID: ${template.id}
// Generated due to AI generation issues or quality concerns
// This is a guaranteed-working implementation that you can customize

`
    customizedCode = fallbackComment + customizedCode

    return customizedCode
  }

  /**
   * Initialize fallback templates from the main template library
   */
  private initializeFallbackTemplates(): void {
    // Convert main templates to fallback templates
    templates.forEach(template => {
      // Map template category to contract type category
      const categoryMapping: Record<string, ContractType['category']> = {
        'token': 'fungible-token',
        'nft': 'nft',
        'marketplace': 'marketplace',
        'dao': 'dao',
        'defi': 'defi',
        'utility': 'utility'
      }

      const contractType: ContractType = {
        category: categoryMapping[template.category] || 'generic',
        complexity: this.mapComplexityFromTags(template.tags),
        features: this.extractFeaturesFromTags(template.tags)
      }

      const fallbackTemplate: FallbackTemplate = {
        id: template.id,
        name: template.name,
        contractType,
        code: template.code,
        description: template.description,
        keywords: this.extractKeywordsFromTemplate(template),
        complexity: contractType.complexity,
        guaranteedWorking: template.cadenceVersion === '1.0' && template.migrationStatus === 'migrated'
      }

      this.fallbackTemplates.set(template.id, fallbackTemplate)
    })

    logger.info(`Initialized ${this.fallbackTemplates.size} fallback templates`)
  }

  /**
   * Initialize contract type detection patterns
   */
  private initializeContractTypePatterns(): void {
    this.contractTypePatterns.set('nft', [
      /\b(nft|non.?fungible|collectible|art|digital.?asset|collection)\b/gi,
      /\b(mint|metadata|unique|token)\b/gi,
      /\b(erc.?721|erc721)\b/gi
    ])

    this.contractTypePatterns.set('fungible-token', [
      /\b(fungible|coin|currency|token)\b/gi,
      /\b(transfer|balance|supply|mint|burn|vault)\b/gi,
      /\b(erc.?20|erc20)\b/gi
    ])

    this.contractTypePatterns.set('marketplace', [
      /\b(marketplace|market|trading|buy|sell|auction)\b/gi,
      /\b(listing|purchase|bid|offer|trade)\b/gi,
      /\b(commission|fee|royalty)\b/gi
    ])

    this.contractTypePatterns.set('dao', [
      /\b(dao|governance|voting|proposal)\b/gi,
      /\b(vote|ballot|decision|consensus)\b/gi,
      /\b(member|stakeholder|community)\b/gi
    ])

    this.contractTypePatterns.set('defi', [
      /\b(defi|staking|yield|farming|liquidity)\b/gi,
      /\b(pool|swap|exchange|lending|borrowing)\b/gi,
      /\b(reward|interest|apy|apr)\b/gi
    ])

    this.contractTypePatterns.set('utility', [
      /\b(utility|tool|helper|service)\b/gi,
      /\b(multi.?sig|multisig|wallet|escrow)\b/gi,
      /\b(oracle|bridge|proxy)\b/gi
    ])
  }

  /**
   * Determine contract complexity based on prompt analysis
   */
  private determineComplexity(prompt: string, keywords: string[]): 'simple' | 'intermediate' | 'advanced' {
    const complexityIndicators = {
      advanced: ['advanced', 'complex', 'sophisticated', 'enterprise', 'custom', 'multi'],
      intermediate: ['standard', 'complete', 'full', 'comprehensive'],
      simple: ['basic', 'simple', 'minimal', 'easy', 'starter']
    }

    const promptLower = prompt.toLowerCase()
    
    // Check for explicit complexity indicators first
    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => promptLower.includes(indicator))) {
        return level as 'simple' | 'intermediate' | 'advanced'
      }
    }

    // Infer complexity from prompt length and keyword count
    if (prompt.length > 300 || keywords.length > 8) {
      return 'advanced'
    } else if (prompt.length > 100 || keywords.length > 4) {
      return 'intermediate'
    } else {
      return 'simple'
    }
  }

  /**
   * Extract features from prompt based on contract category
   */
  private extractFeatures(prompt: string, category: string): string[] {
    const featurePatterns: Record<string, RegExp[]> = {
      nft: [
        /\b(royalt(y|ies)|royalty)\b/gi,
        /\b(metadata|attributes)\b/gi,
        /\b(batch.?mint|bulk.?mint)\b/gi,
        /\b(reveal|hidden)\b/gi
      ],
      'fungible-token': [
        /\b(burn|burning)\b/gi,
        /\b(pause|pausable)\b/gi,
        /\b(cap|capped|limit)\b/gi,
        /\b(admin|owner)\b/gi
      ],
      marketplace: [
        /\b(auction|bidding)\b/gi,
        /\b(royalt(y|ies)|royalty)\b/gi,
        /\b(escrow)\b/gi,
        /\b(bundle|batch)\b/gi
      ],
      dao: [
        /\b(timelock|delay)\b/gi,
        /\b(quorum)\b/gi,
        /\b(delegation|delegate)\b/gi,
        /\b(treasury)\b/gi
      ]
    }

    const patterns = featurePatterns[category] || []
    const features: string[] = []

    patterns.forEach(pattern => {
      const matches = prompt.match(pattern)
      if (matches) {
        features.push(...matches.map(match => match.toLowerCase().replace(/ies$/, 'y')))
      }
    })

    return [...new Set(features)] // Remove duplicates
  }

  /**
   * Extract contract name from prompt
   */
  private extractContractName(prompt: string): string | null {
    // Look for patterns like "create a MyToken contract" or "MyNFT collection"
    const patterns = [
      /create\s+(?:a\s+)?(\w+)\s+contract/i,
      /(\w+)\s+contract/i,
      /contract\s+(?:called\s+)?(\w+)/i,
      /(\w+)\s+(?:nft|token|collection)/i
    ]

    for (const pattern of patterns) {
      const match = prompt.match(pattern)
      if (match && match[1] && match[1].length > 2) {
        // Capitalize first letter
        return match[1].charAt(0).toUpperCase() + match[1].slice(1)
      }
    }

    return null
  }

  /**
   * Map complexity from template tags
   */
  private mapComplexityFromTags(tags: string[]): 'simple' | 'intermediate' | 'advanced' {
    const tagString = tags.join(' ').toLowerCase()
    
    if (tagString.includes('beginner') || tagString.includes('basic')) {
      return 'simple'
    } else if (tagString.includes('advanced') || tagString.includes('complex')) {
      return 'advanced'
    } else {
      return 'intermediate'
    }
  }

  /**
   * Extract features from template tags
   */
  private extractFeaturesFromTags(tags: string[]): string[] {
    return tags
      .filter(tag => !['NFT', 'DeFi', 'DAO', 'Marketplace', 'Token', 'Utility', 'Beginner', 'Cadence 1.0'].includes(tag))
      .map(tag => tag.toLowerCase())
  }

  /**
   * Extract keywords from template for matching
   */
  private extractKeywordsFromTemplate(template: Template): string[] {
    const keywords = [
      ...template.tags.map(tag => tag.toLowerCase()),
      template.name.toLowerCase(),
      template.category.toLowerCase()
    ]

    // Extract additional keywords from description
    const descriptionWords = template.description
      .toLowerCase()
      .match(/\b\w{4,}\b/g) || []
    
    keywords.push(...descriptionWords)

    return [...new Set(keywords)] // Remove duplicates
  }

  /**
   * Get generic fallback contract for emergency cases
   */
  private getGenericFallback(): string {
    return `// Emergency Fallback Contract
// This is a minimal working contract generated when all other fallback options failed

access(all) contract EmergencyFallback {
    access(all) var initialized: Bool

    access(all) event ContractInitialized()

    access(all) fun initialize() {
        pre {
            !self.initialized: "Contract already initialized"
        }
        
        self.initialized = true
        emit ContractInitialized()
    }

    access(all) view fun isInitialized(): Bool {
        return self.initialized
    }

    init() {
        self.initialized = false
        emit ContractInitialized()
    }
}`
  }

  /**
   * Validate that a fallback contract is syntactically correct
   */
  async validateFallbackQuality(code: string): Promise<boolean> {
    try {
      // Basic syntax validation checks
      const validationChecks = [
        // Check for balanced braces
        this.validateBalancedBraces(code),
        // Check for contract declaration
        /access\(all\)\s+contract\s+\w+/.test(code),
        // Check for init function (with or without parameters)
        /init\s*\([^)]*\)/.test(code),
        // Check for no undefined values
        !/\bundefined\b/.test(code),
        // Check for proper access modifiers
        /access\(/.test(code)
      ]

      const allChecksPass = validationChecks.every(check => check === true)
      
      if (allChecksPass) {
        logger.info('Fallback contract passed quality validation')
      } else {
        logger.warn('Fallback contract failed quality validation', { 
          checks: validationChecks.map((check, index) => ({ index, passed: check }))
        })
      }

      return allChecksPass

    } catch (error) {
      logger.error('Error validating fallback quality', { error: error.message })
      return false
    }
  }

  /**
   * Validate balanced braces in code
   */
  private validateBalancedBraces(code: string): boolean {
    let braceCount = 0
    let parenCount = 0
    let bracketCount = 0

    for (const char of code) {
      switch (char) {
        case '{': braceCount++; break
        case '}': braceCount--; break
        case '(': parenCount++; break
        case ')': parenCount--; break
        case '[': bracketCount++; break
        case ']': bracketCount--; break
      }

      // Early exit if any count goes negative
      if (braceCount < 0 || parenCount < 0 || bracketCount < 0) {
        return false
      }
    }

    return braceCount === 0 && parenCount === 0 && bracketCount === 0
  }

  /**
   * Get template-based fallback for specific requirements
   */
  getTemplateBasedFallback(requirements: { category: string; features?: string[] }): string {
    const template = Array.from(this.fallbackTemplates.values())
      .find(t => 
        t.contractType.category === requirements.category && 
        t.guaranteedWorking
      )

    if (template) {
      return template.code
    }

    return this.getGenericFallback()
  }

  /**
   * Create minimal working contract for basic requirements
   */
  createMinimalWorkingContract(basicRequirements: { name?: string; category?: string }): string {
    const contractName = basicRequirements.name || 'MinimalContract'
    const category = basicRequirements.category || 'utility'

    // Get appropriate minimal template based on category
    switch (category) {
      case 'nft':
        return this.getMinimalNFTContract(contractName)
      case 'fungible-token':
        return this.getMinimalTokenContract(contractName)
      case 'marketplace':
        return this.getMinimalMarketplaceContract(contractName)
      default:
        return this.getMinimalUtilityContract(contractName)
    }
  }

  /**
   * Get minimal NFT contract
   */
  private getMinimalNFTContract(name: string): string {
    return `// Minimal NFT Contract - ${name}
import "NonFungibleToken"

access(all) contract ${name}: NonFungibleToken {
    access(all) var totalSupply: UInt64

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)

    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64

        init(id: UInt64) {
            self.id = id
        }
    }

    access(all) resource Collection: NonFungibleToken.Provider & NonFungibleToken.Receiver & NonFungibleToken.Collection & NonFungibleToken.CollectionPublic {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("NFT not found")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @${name}.NFT
            emit Deposit(id: token.id, to: self.owner?.address)
            self.ownedNFTs[token.id] <-! token
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-create Collection()
        }
    }

    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <-create Collection()
    }

    init() {
        self.totalSupply = 0
        emit ContractInitialized()
    }
}`
  }

  /**
   * Get minimal token contract
   */
  private getMinimalTokenContract(name: string): string {
    return `// Minimal Token Contract - ${name}
access(all) contract ${name} {
    access(all) var totalSupply: UFix64

    access(all) event TokensInitialized(initialSupply: UFix64)

    access(all) resource Vault {
        access(all) var balance: UFix64

        init(balance: UFix64) {
            self.balance = balance
        }

        access(all) fun withdraw(amount: UFix64): @Vault {
            self.balance = self.balance - amount
            return <-create Vault(balance: amount)
        }

        access(all) fun deposit(from: @Vault) {
            self.balance = self.balance + from.balance
            destroy from
        }
    }

    access(all) fun createEmptyVault(): @Vault {
        return <-create Vault(balance: 0.0)
    }

    init() {
        self.totalSupply = 1000.0
        emit TokensInitialized(initialSupply: self.totalSupply)
    }
}`
  }

  /**
   * Get minimal marketplace contract
   */
  private getMinimalMarketplaceContract(name: string): string {
    return `// Minimal Marketplace Contract - ${name}
access(all) contract ${name} {
    access(all) event ItemListed(id: UInt64, price: UFix64)

    access(all) struct Listing {
        access(all) let id: UInt64
        access(all) let price: UFix64

        init(id: UInt64, price: UFix64) {
            self.id = id
            self.price = price
        }
    }

    access(self) var listings: {UInt64: Listing}

    access(all) fun listItem(id: UInt64, price: UFix64) {
        let listing = Listing(id: id, price: price)
        self.listings[id] = listing
        emit ItemListed(id: id, price: price)
    }

    access(all) view fun getListing(id: UInt64): Listing? {
        return self.listings[id]
    }

    init() {
        self.listings = {}
    }
}`
  }

  /**
   * Get minimal utility contract
   */
  private getMinimalUtilityContract(name: string): string {
    return `// Minimal Utility Contract - ${name}
access(all) contract ${name} {
    access(all) var value: String

    access(all) event ValueChanged(newValue: String)

    access(all) fun setValue(newValue: String) {
        self.value = newValue
        emit ValueChanged(newValue: newValue)
    }

    access(all) view fun getValue(): String {
        return self.value
    }

    init() {
        self.value = "initialized"
        emit ValueChanged(newValue: self.value)
    }
}`
  }
}

// Export singleton instance
export const fallbackGenerator = new FallbackGenerator()