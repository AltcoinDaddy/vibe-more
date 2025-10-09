/**
 * Contract-Specific Validation Rules
 * 
 * Implements validation rules specific to different contract types:
 * - NFT contracts (metadata, interfaces)
 * - Fungible token contracts (supply management, transfers)
 * - DAO contracts (voting, governance patterns)
 * - Marketplace contracts (listing, purchasing logic)
 */

import { ValidationResult, ValidationIssue, CodeLocation, ContractType } from './types'
import { QALogger, getLogger } from './logger'

export interface ContractSpecificValidationResult {
  contractType: string
  isValid: boolean
  validationResults: ValidationResult[]
  specificIssues: ContractSpecificIssue[]
  complianceScore: number
  requiredFeatures: RequiredFeature[]
  missingFeatures: string[]
  recommendations: string[]
}

export interface ContractSpecificIssue extends ValidationIssue {
  contractType: string
  featureCategory: string
  complianceLevel: 'required' | 'recommended' | 'optional'
}

export interface RequiredFeature {
  name: string
  description: string
  present: boolean
  validationPattern: RegExp
  category: 'interface' | 'function' | 'event' | 'resource' | 'structure'
  complianceLevel: 'required' | 'recommended' | 'optional'
}

export interface NFTValidationRules {
  hasNonFungibleTokenInterface: boolean
  hasMetadataViews: boolean
  hasCollectionResource: boolean
  hasNFTResource: boolean
  hasMintingFunction: boolean
  hasMetadataFields: boolean
  hasViewResolver: boolean
  hasCollectionPublicInterface: boolean
}

export interface FungibleTokenValidationRules {
  hasFungibleTokenInterface: boolean
  hasVaultResource: boolean
  hasMinterResource: boolean
  hasSupplyManagement: boolean
  hasTransferFunctions: boolean
  hasBalanceTracking: boolean
  hasVaultPublicInterface: boolean
  hasAdminResource: boolean
}

export interface DAOValidationRules {
  hasProposalResource: boolean
  hasVotingMechanism: boolean
  hasGovernanceToken: boolean
  hasProposalCreation: boolean
  hasVotingPeriod: boolean
  hasExecutionLogic: boolean
  hasQuorumRequirement: boolean
  hasMembershipManagement: boolean
}

export interface MarketplaceValidationRules {
  hasListingResource: boolean
  hasPurchaseFunction: boolean
  hasPaymentHandling: boolean
  hasCommissionLogic: boolean
  hasListingManagement: boolean
  hasEscrowMechanism: boolean
  hasEventEmission: boolean
  hasAccessControl: boolean
}

export class ContractSpecificValidator {
  private logger: QALogger

  constructor() {
    try {
      this.logger = getLogger()
    } catch {
      // Fallback logger for testing
      this.logger = {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {}
      } as QALogger
    }
  }

  /**
   * Validate contract against type-specific rules
   */
  async validateContract(code: string, contractType: ContractType): Promise<ContractSpecificValidationResult> {
    this.logger.info('Starting contract-specific validation', { 
      contractType: contractType.category,
      complexity: contractType.complexity 
    })

    try {
      let validationResult: ContractSpecificValidationResult

      switch (contractType.category) {
        case 'nft':
          validationResult = await this.validateNFTContract(code, contractType)
          break
        case 'fungible-token':
          validationResult = await this.validateFungibleTokenContract(code, contractType)
          break
        case 'dao':
          validationResult = await this.validateDAOContract(code, contractType)
          break
        case 'marketplace':
          validationResult = await this.validateMarketplaceContract(code, contractType)
          break
        default:
          validationResult = await this.validateGenericContract(code, contractType)
      }

      this.logger.info('Contract-specific validation completed', {
        contractType: contractType.category,
        isValid: validationResult.isValid,
        complianceScore: validationResult.complianceScore,
        totalIssues: validationResult.specificIssues.length
      })

      return validationResult

    } catch (error) {
      this.logger.error('Contract-specific validation failed', { 
        error: error.message,
        contractType: contractType.category 
      })
      
      return this.createFailureResult(contractType.category, error)
    }
  }

  /**
   * Validate NFT contract for metadata, interfaces, and standard compliance
   */
  private async validateNFTContract(code: string, contractType: ContractType): Promise<ContractSpecificValidationResult> {
    const issues: ContractSpecificIssue[] = []
    const requiredFeatures: RequiredFeature[] = [
      {
        name: 'NonFungibleToken Interface',
        description: 'Contract must implement NonFungibleToken interface',
        present: false,
        validationPattern: /import\s+NonFungibleToken\s+from|NonFungibleToken\./,
        category: 'interface',
        complianceLevel: 'required'
      },
      {
        name: 'MetadataViews Support',
        description: 'Contract should implement MetadataViews for metadata standards',
        present: false,
        validationPattern: /import\s+MetadataViews\s+from|MetadataViews\./,
        category: 'interface',
        complianceLevel: 'recommended'
      },
      {
        name: 'Collection Resource',
        description: 'Contract must have a Collection resource',
        present: false,
        validationPattern: /resource\s+Collection\s*[:{]/,
        category: 'resource',
        complianceLevel: 'required'
      },
      {
        name: 'NFT Resource',
        description: 'Contract must have an NFT resource',
        present: false,
        validationPattern: /resource\s+NFT\s*[:{]/,
        category: 'resource',
        complianceLevel: 'required'
      },
      {
        name: 'Minting Function',
        description: 'Contract should have a minting function',
        present: false,
        validationPattern: /fun\s+mint\w*\s*\(/,
        category: 'function',
        complianceLevel: 'required'
      },
      {
        name: 'Metadata Fields',
        description: 'NFT resource should have metadata fields',
        present: false,
        validationPattern: /metadata\s*:|name\s*:|description\s*:|image\s*:/,
        category: 'structure',
        complianceLevel: 'recommended'
      },
      {
        name: 'View Resolver',
        description: 'Contract should implement view resolver for metadata',
        present: false,
        validationPattern: /resolveView\s*\(|getViews\s*\(/,
        category: 'function',
        complianceLevel: 'recommended'
      },
      {
        name: 'Collection Public Interface',
        description: 'Collection should have public interface for deposits',
        present: false,
        validationPattern: /CollectionPublic|deposit\s*\(/,
        category: 'interface',
        complianceLevel: 'required'
      }
    ]

    // Check each required feature
    for (const feature of requiredFeatures) {
      feature.present = feature.validationPattern.test(code)
      
      if (!feature.present && feature.complianceLevel === 'required') {
        issues.push({
          severity: 'critical',
          type: `missing-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          location: { line: 1, column: 1 },
          message: `NFT contract is missing required feature: ${feature.name}`,
          suggestedFix: feature.description,
          autoFixable: false,
          contractType: 'nft',
          featureCategory: feature.category,
          complianceLevel: feature.complianceLevel
        })
      } else if (!feature.present && feature.complianceLevel === 'recommended') {
        issues.push({
          severity: 'warning',
          type: `missing-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          location: { line: 1, column: 1 },
          message: `NFT contract is missing recommended feature: ${feature.name}`,
          suggestedFix: feature.description,
          autoFixable: false,
          contractType: 'nft',
          featureCategory: feature.category,
          complianceLevel: feature.complianceLevel
        })
      }
    }

    // Additional NFT-specific validations
    await this.validateNFTSpecificPatterns(code, issues)

    const validationResults = this.createValidationResults(issues, 'nft')
    const complianceScore = this.calculateComplianceScore(requiredFeatures, issues)
    const missingFeatures = requiredFeatures.filter(f => !f.present).map(f => f.name)
    const recommendations = this.generateNFTRecommendations(requiredFeatures, issues)

    return {
      contractType: 'nft',
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      validationResults,
      specificIssues: issues,
      complianceScore,
      requiredFeatures,
      missingFeatures,
      recommendations
    }
  }

  /**
   * Validate fungible token contract for supply management and transfers
   */
  private async validateFungibleTokenContract(code: string, contractType: ContractType): Promise<ContractSpecificValidationResult> {
    const issues: ContractSpecificIssue[] = []
    const requiredFeatures: RequiredFeature[] = [
      {
        name: 'FungibleToken Interface',
        description: 'Contract must implement FungibleToken interface',
        present: false,
        validationPattern: /import\s+FungibleToken\s+from|FungibleToken\./,
        category: 'interface',
        complianceLevel: 'required'
      },
      {
        name: 'Vault Resource',
        description: 'Contract must have a Vault resource',
        present: false,
        validationPattern: /resource\s+Vault\s*[:{]/,
        category: 'resource',
        complianceLevel: 'required'
      },
      {
        name: 'Minter Resource',
        description: 'Contract should have a Minter resource for token creation',
        present: false,
        validationPattern: /resource\s+Minter\s*[:{]|resource\s+Administrator\s*[:{]/,
        category: 'resource',
        complianceLevel: 'required'
      },
      {
        name: 'Supply Management',
        description: 'Contract should track total supply',
        present: false,
        validationPattern: /totalSupply\s*:|supply\s*:/,
        category: 'structure',
        complianceLevel: 'required'
      },
      {
        name: 'Transfer Functions',
        description: 'Vault must have withdraw and deposit functions',
        present: false,
        validationPattern: /fun\s+withdraw\s*\(|fun\s+deposit\s*\(/,
        category: 'function',
        complianceLevel: 'required'
      },
      {
        name: 'Balance Tracking',
        description: 'Vault should track balance',
        present: false,
        validationPattern: /balance\s*:|getBalance\s*\(/,
        category: 'function',
        complianceLevel: 'required'
      },
      {
        name: 'Vault Public Interface',
        description: 'Vault should have public interface for balance queries',
        present: false,
        validationPattern: /VaultPublic|Balance\s*\{/,
        category: 'interface',
        complianceLevel: 'required'
      },
      {
        name: 'Admin Resource',
        description: 'Contract should have admin resource for minting control',
        present: false,
        validationPattern: /resource\s+Administrator\s*[:{]|resource\s+Admin\s*[:{]/,
        category: 'resource',
        complianceLevel: 'recommended'
      }
    ]

    // Check each required feature
    for (const feature of requiredFeatures) {
      feature.present = feature.validationPattern.test(code)
      
      if (!feature.present && feature.complianceLevel === 'required') {
        issues.push({
          severity: 'critical',
          type: `missing-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          location: { line: 1, column: 1 },
          message: `Fungible token contract is missing required feature: ${feature.name}`,
          suggestedFix: feature.description,
          autoFixable: false,
          contractType: 'fungible-token',
          featureCategory: feature.category,
          complianceLevel: feature.complianceLevel
        })
      } else if (!feature.present && feature.complianceLevel === 'recommended') {
        issues.push({
          severity: 'warning',
          type: `missing-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          location: { line: 1, column: 1 },
          message: `Fungible token contract is missing recommended feature: ${feature.name}`,
          suggestedFix: feature.description,
          autoFixable: false,
          contractType: 'fungible-token',
          featureCategory: feature.category,
          complianceLevel: feature.complianceLevel
        })
      }
    }

    // Additional fungible token-specific validations
    await this.validateFungibleTokenSpecificPatterns(code, issues)

    const validationResults = this.createValidationResults(issues, 'fungible-token')
    const complianceScore = this.calculateComplianceScore(requiredFeatures, issues)
    const missingFeatures = requiredFeatures.filter(f => !f.present).map(f => f.name)
    const recommendations = this.generateFungibleTokenRecommendations(requiredFeatures, issues)

    return {
      contractType: 'fungible-token',
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      validationResults,
      specificIssues: issues,
      complianceScore,
      requiredFeatures,
      missingFeatures,
      recommendations
    }
  }

  /**
   * Validate DAO contract for voting and governance patterns
   */
  private async validateDAOContract(code: string, contractType: ContractType): Promise<ContractSpecificValidationResult> {
    const issues: ContractSpecificIssue[] = []
    const requiredFeatures: RequiredFeature[] = [
      {
        name: 'Proposal Resource',
        description: 'Contract must have a Proposal resource',
        present: false,
        validationPattern: /resource\s+Proposal\s*[:{]/,
        category: 'resource',
        complianceLevel: 'required'
      },
      {
        name: 'Voting Mechanism',
        description: 'Contract must have voting functions',
        present: false,
        validationPattern: /fun\s+vote\s*\(|fun\s+castVote\s*\(/,
        category: 'function',
        complianceLevel: 'required'
      },
      {
        name: 'Governance Token',
        description: 'Contract should reference governance token for voting power',
        present: false,
        validationPattern: /governanceToken|votingPower|tokenBalance/,
        category: 'structure',
        complianceLevel: 'recommended'
      },
      {
        name: 'Proposal Creation',
        description: 'Contract must have proposal creation function',
        present: false,
        validationPattern: /fun\s+createProposal\s*\(|fun\s+propose\s*\(/,
        category: 'function',
        complianceLevel: 'required'
      },
      {
        name: 'Voting Period',
        description: 'Proposals should have time-based voting periods',
        present: false,
        validationPattern: /votingPeriod|endTime|deadline|duration/,
        category: 'structure',
        complianceLevel: 'required'
      },
      {
        name: 'Execution Logic',
        description: 'Contract should have proposal execution mechanism',
        present: false,
        validationPattern: /fun\s+execute\s*\(|fun\s+executeProposal\s*\(/,
        category: 'function',
        complianceLevel: 'required'
      },
      {
        name: 'Quorum Requirement',
        description: 'Contract should enforce quorum requirements',
        present: false,
        validationPattern: /quorum|minimumVotes|threshold/,
        category: 'structure',
        complianceLevel: 'recommended'
      },
      {
        name: 'Membership Management',
        description: 'Contract should manage DAO membership',
        present: false,
        validationPattern: /member|Member|membership|isMember/,
        category: 'function',
        complianceLevel: 'recommended'
      }
    ]

    // Check each required feature
    for (const feature of requiredFeatures) {
      feature.present = feature.validationPattern.test(code)
      
      if (!feature.present && feature.complianceLevel === 'required') {
        issues.push({
          severity: 'critical',
          type: `missing-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          location: { line: 1, column: 1 },
          message: `DAO contract is missing required feature: ${feature.name}`,
          suggestedFix: feature.description,
          autoFixable: false,
          contractType: 'dao',
          featureCategory: feature.category,
          complianceLevel: feature.complianceLevel
        })
      } else if (!feature.present && feature.complianceLevel === 'recommended') {
        issues.push({
          severity: 'warning',
          type: `missing-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          location: { line: 1, column: 1 },
          message: `DAO contract is missing recommended feature: ${feature.name}`,
          suggestedFix: feature.description,
          autoFixable: false,
          contractType: 'dao',
          featureCategory: feature.category,
          complianceLevel: feature.complianceLevel
        })
      }
    }

    // Additional DAO-specific validations
    await this.validateDAOSpecificPatterns(code, issues)

    const validationResults = this.createValidationResults(issues, 'dao')
    const complianceScore = this.calculateComplianceScore(requiredFeatures, issues)
    const missingFeatures = requiredFeatures.filter(f => !f.present).map(f => f.name)
    const recommendations = this.generateDAORecommendations(requiredFeatures, issues)

    return {
      contractType: 'dao',
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      validationResults,
      specificIssues: issues,
      complianceScore,
      requiredFeatures,
      missingFeatures,
      recommendations
    }
  }

  /**
   * Validate marketplace contract for listing and purchasing logic
   */
  private async validateMarketplaceContract(code: string, contractType: ContractType): Promise<ContractSpecificValidationResult> {
    const issues: ContractSpecificIssue[] = []
    const requiredFeatures: RequiredFeature[] = [
      {
        name: 'Listing Resource',
        description: 'Contract must have a Listing resource',
        present: false,
        validationPattern: /resource\s+Listing\s*[:{]|resource\s+SaleListing\s*[:{]/,
        category: 'resource',
        complianceLevel: 'required'
      },
      {
        name: 'Purchase Function',
        description: 'Contract must have purchase/buy function',
        present: false,
        validationPattern: /fun\s+purchase\s*\(|fun\s+buy\s*\(/,
        category: 'function',
        complianceLevel: 'required'
      },
      {
        name: 'Payment Handling',
        description: 'Contract must handle payment processing',
        present: false,
        validationPattern: /payment|Payment|price|cost|amount/,
        category: 'structure',
        complianceLevel: 'required'
      },
      {
        name: 'Commission Logic',
        description: 'Contract should handle marketplace commissions',
        present: false,
        validationPattern: /commission|fee|royalty|cut/,
        category: 'structure',
        complianceLevel: 'recommended'
      },
      {
        name: 'Listing Management',
        description: 'Contract must have listing creation and removal',
        present: false,
        validationPattern: /fun\s+createListing\s*\(|fun\s+removeListing\s*\(/,
        category: 'function',
        complianceLevel: 'required'
      },
      {
        name: 'Escrow Mechanism',
        description: 'Contract should handle escrow for secure transactions',
        present: false,
        validationPattern: /escrow|Escrow|custody|hold/,
        category: 'structure',
        complianceLevel: 'recommended'
      },
      {
        name: 'Event Emission',
        description: 'Contract should emit events for marketplace activities',
        present: false,
        validationPattern: /event\s+\w*List|event\s+\w*Purchase|event\s+\w*Sale/,
        category: 'event',
        complianceLevel: 'recommended'
      },
      {
        name: 'Access Control',
        description: 'Contract should have proper access control for admin functions',
        present: false,
        validationPattern: /access\(contract\)|access\(account\)|onlyOwner|admin/,
        category: 'structure',
        complianceLevel: 'required'
      }
    ]

    // Check each required feature
    for (const feature of requiredFeatures) {
      feature.present = feature.validationPattern.test(code)
      
      if (!feature.present && feature.complianceLevel === 'required') {
        issues.push({
          severity: 'critical',
          type: `missing-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          location: { line: 1, column: 1 },
          message: `Marketplace contract is missing required feature: ${feature.name}`,
          suggestedFix: feature.description,
          autoFixable: false,
          contractType: 'marketplace',
          featureCategory: feature.category,
          complianceLevel: feature.complianceLevel
        })
      } else if (!feature.present && feature.complianceLevel === 'recommended') {
        issues.push({
          severity: 'warning',
          type: `missing-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          location: { line: 1, column: 1 },
          message: `Marketplace contract is missing recommended feature: ${feature.name}`,
          suggestedFix: feature.description,
          autoFixable: false,
          contractType: 'marketplace',
          featureCategory: feature.category,
          complianceLevel: feature.complianceLevel
        })
      }
    }

    // Additional marketplace-specific validations
    await this.validateMarketplaceSpecificPatterns(code, issues)

    const validationResults = this.createValidationResults(issues, 'marketplace')
    const complianceScore = this.calculateComplianceScore(requiredFeatures, issues)
    const missingFeatures = requiredFeatures.filter(f => !f.present).map(f => f.name)
    const recommendations = this.generateMarketplaceRecommendations(requiredFeatures, issues)

    return {
      contractType: 'marketplace',
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      validationResults,
      specificIssues: issues,
      complianceScore,
      requiredFeatures,
      missingFeatures,
      recommendations
    }
  }

  /**
   * Validate generic contract with basic requirements
   */
  private async validateGenericContract(code: string, contractType: ContractType): Promise<ContractSpecificValidationResult> {
    const issues: ContractSpecificIssue[] = []
    const requiredFeatures: RequiredFeature[] = [
      {
        name: 'Contract Declaration',
        description: 'Contract must have proper contract declaration',
        present: false,
        validationPattern: /access\(all\)\s+contract\s+\w+/,
        category: 'structure',
        complianceLevel: 'required'
      },
      {
        name: 'Init Function',
        description: 'Contract must have init function',
        present: false,
        validationPattern: /init\s*\(\s*\)\s*\{/,
        category: 'function',
        complianceLevel: 'required'
      }
    ]

    // Check each required feature
    for (const feature of requiredFeatures) {
      feature.present = feature.validationPattern.test(code)
      
      if (!feature.present) {
        issues.push({
          severity: 'critical',
          type: `missing-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          location: { line: 1, column: 1 },
          message: `Contract is missing required feature: ${feature.name}`,
          suggestedFix: feature.description,
          autoFixable: false,
          contractType: 'generic',
          featureCategory: feature.category,
          complianceLevel: feature.complianceLevel
        })
      }
    }

    const validationResults = this.createValidationResults(issues, 'generic')
    const complianceScore = this.calculateComplianceScore(requiredFeatures, issues)
    const missingFeatures = requiredFeatures.filter(f => !f.present).map(f => f.name)
    const recommendations = this.generateGenericRecommendations(requiredFeatures, issues)

    return {
      contractType: 'generic',
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      validationResults,
      specificIssues: issues,
      complianceScore,
      requiredFeatures,
      missingFeatures,
      recommendations
    }
  }

  // Contract-specific pattern validation methods

  private async validateNFTSpecificPatterns(code: string, issues: ContractSpecificIssue[]): Promise<void> {
    // Check for proper NFT ID handling
    if (!code.includes('id:') && !code.includes('uuid')) {
      issues.push({
        severity: 'warning',
        type: 'missing-nft-id',
        location: { line: 1, column: 1 },
        message: 'NFT resource should have unique identifier (id or uuid)',
        suggestedFix: 'Add id: UInt64 field to NFT resource',
        autoFixable: false,
        contractType: 'nft',
        featureCategory: 'structure',
        complianceLevel: 'recommended'
      })
    }

    // Check for proper destroy function
    if (!code.includes('destroy()')) {
      issues.push({
        severity: 'warning',
        type: 'missing-destroy-function',
        location: { line: 1, column: 1 },
        message: 'NFT resource should implement destroy() function',
        suggestedFix: 'Add destroy() function to NFT resource',
        autoFixable: false,
        contractType: 'nft',
        featureCategory: 'function',
        complianceLevel: 'recommended'
      })
    }

    // Check for collection size tracking
    if (!code.includes('ownedNFTs') && !code.includes('length')) {
      issues.push({
        severity: 'info',
        type: 'missing-collection-size',
        location: { line: 1, column: 1 },
        message: 'Collection should track owned NFTs for size queries',
        suggestedFix: 'Add ownedNFTs dictionary or length tracking',
        autoFixable: false,
        contractType: 'nft',
        featureCategory: 'structure',
        complianceLevel: 'optional'
      })
    }
  }

  private async validateFungibleTokenSpecificPatterns(code: string, issues: ContractSpecificIssue[]): Promise<void> {
    // Check for proper balance validation
    if (!code.includes('balance >') && !code.includes('balance >=')) {
      issues.push({
        severity: 'warning',
        type: 'missing-balance-validation',
        location: { line: 1, column: 1 },
        message: 'Withdraw function should validate sufficient balance',
        suggestedFix: 'Add balance validation: pre { self.balance >= amount }',
        autoFixable: false,
        contractType: 'fungible-token',
        featureCategory: 'function',
        complianceLevel: 'recommended'
      })
    }

    // Check for zero amount validation
    if (!code.includes('amount > 0') && !code.includes('amount >= 0')) {
      issues.push({
        severity: 'warning',
        type: 'missing-amount-validation',
        location: { line: 1, column: 1 },
        message: 'Functions should validate positive amounts',
        suggestedFix: 'Add amount validation: pre { amount > 0.0 }',
        autoFixable: false,
        contractType: 'fungible-token',
        featureCategory: 'function',
        complianceLevel: 'recommended'
      })
    }

    // Check for supply tracking
    if (code.includes('mint') && !code.includes('totalSupply')) {
      issues.push({
        severity: 'critical',
        type: 'missing-supply-tracking',
        location: { line: 1, column: 1 },
        message: 'Minting function should update total supply',
        suggestedFix: 'Update totalSupply when minting tokens',
        autoFixable: false,
        contractType: 'fungible-token',
        featureCategory: 'function',
        complianceLevel: 'required'
      })
    }
  }

  private async validateDAOSpecificPatterns(code: string, issues: ContractSpecificIssue[]): Promise<void> {
    // Check for proposal state management
    if (!code.includes('ProposalState') && !code.includes('status')) {
      issues.push({
        severity: 'warning',
        type: 'missing-proposal-state',
        location: { line: 1, column: 1 },
        message: 'Proposals should have state management (pending, active, executed, etc.)',
        suggestedFix: 'Add proposal state enum and tracking',
        autoFixable: false,
        contractType: 'dao',
        featureCategory: 'structure',
        complianceLevel: 'recommended'
      })
    }

    // Check for vote counting
    if (code.includes('vote') && !code.includes('yesVotes') && !code.includes('noVotes')) {
      issues.push({
        severity: 'critical',
        type: 'missing-vote-counting',
        location: { line: 1, column: 1 },
        message: 'Voting mechanism should count yes/no votes',
        suggestedFix: 'Add vote counting fields to Proposal resource',
        autoFixable: false,
        contractType: 'dao',
        featureCategory: 'structure',
        complianceLevel: 'required'
      })
    }

    // Check for double voting prevention
    if (code.includes('vote') && !code.includes('hasVoted') && !code.includes('voters')) {
      issues.push({
        severity: 'critical',
        type: 'missing-double-vote-prevention',
        location: { line: 1, column: 1 },
        message: 'Voting should prevent double voting by same address',
        suggestedFix: 'Add voter tracking to prevent double voting',
        autoFixable: false,
        contractType: 'dao',
        featureCategory: 'function',
        complianceLevel: 'required'
      })
    }
  }

  private async validateMarketplaceSpecificPatterns(code: string, issues: ContractSpecificIssue[]): Promise<void> {
    // Check for price validation
    if (code.includes('price') && !code.includes('price >') && !code.includes('price >=')) {
      issues.push({
        severity: 'warning',
        type: 'missing-price-validation',
        location: { line: 1, column: 1 },
        message: 'Listing should validate positive prices',
        suggestedFix: 'Add price validation: pre { price > 0.0 }',
        autoFixable: false,
        contractType: 'marketplace',
        featureCategory: 'function',
        complianceLevel: 'recommended'
      })
    }

    // Check for ownership verification
    if (code.includes('createListing') && !code.includes('owner') && !code.includes('seller')) {
      issues.push({
        severity: 'critical',
        type: 'missing-ownership-verification',
        location: { line: 1, column: 1 },
        message: 'Listing creation should verify item ownership',
        suggestedFix: 'Add ownership verification before creating listing',
        autoFixable: false,
        contractType: 'marketplace',
        featureCategory: 'function',
        complianceLevel: 'required'
      })
    }

    // Check for payment distribution
    if (code.includes('purchase') && !code.includes('seller') && !code.includes('recipient')) {
      issues.push({
        severity: 'critical',
        type: 'missing-payment-distribution',
        location: { line: 1, column: 1 },
        message: 'Purchase function should distribute payment to seller',
        suggestedFix: 'Add payment distribution logic to seller',
        autoFixable: false,
        contractType: 'marketplace',
        featureCategory: 'function',
        complianceLevel: 'required'
      })
    }
  }

  // Helper methods

  private createValidationResults(issues: ContractSpecificIssue[], contractType: string): ValidationResult[] {
    const criticalIssues = issues.filter(i => i.severity === 'critical')
    const warningIssues = issues.filter(i => i.severity === 'warning')
    const infoIssues = issues.filter(i => i.severity === 'info')

    return [{
      type: 'completeness',
      passed: criticalIssues.length === 0,
      issues: issues.map(issue => ({
        severity: issue.severity,
        type: issue.type,
        location: issue.location,
        message: issue.message,
        suggestedFix: issue.suggestedFix,
        autoFixable: issue.autoFixable
      })),
      score: Math.max(0, 100 - (criticalIssues.length * 25) - (warningIssues.length * 10) - (infoIssues.length * 5)),
      message: `${contractType} contract compliance validation`
    }]
  }

  private calculateComplianceScore(requiredFeatures: RequiredFeature[], issues: ContractSpecificIssue[]): number {
    const requiredFeatureCount = requiredFeatures.filter(f => f.complianceLevel === 'required').length
    const presentRequiredFeatures = requiredFeatures.filter(f => f.complianceLevel === 'required' && f.present).length
    
    const recommendedFeatureCount = requiredFeatures.filter(f => f.complianceLevel === 'recommended').length
    const presentRecommendedFeatures = requiredFeatures.filter(f => f.complianceLevel === 'recommended' && f.present).length

    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const warningIssues = issues.filter(i => i.severity === 'warning').length

    // Base score from required features (70% weight)
    const requiredScore = requiredFeatureCount > 0 ? (presentRequiredFeatures / requiredFeatureCount) * 70 : 70

    // Bonus from recommended features (20% weight)
    const recommendedScore = recommendedFeatureCount > 0 ? (presentRecommendedFeatures / recommendedFeatureCount) * 20 : 20

    // Penalty for issues (10% weight)
    const issuePenalty = Math.min(10, (criticalIssues * 5) + (warningIssues * 2))

    return Math.max(0, Math.round(requiredScore + recommendedScore + (10 - issuePenalty)))
  }

  private generateNFTRecommendations(requiredFeatures: RequiredFeature[], issues: ContractSpecificIssue[]): string[] {
    const recommendations: string[] = []

    if (!requiredFeatures.find(f => f.name === 'NonFungibleToken Interface')?.present) {
      recommendations.push('Import and implement NonFungibleToken interface for standard compliance')
    }

    if (!requiredFeatures.find(f => f.name === 'MetadataViews Support')?.present) {
      recommendations.push('Add MetadataViews support for better marketplace compatibility')
    }

    if (!requiredFeatures.find(f => f.name === 'Collection Resource')?.present) {
      recommendations.push('Implement Collection resource for NFT storage and management')
    }

    if (issues.some(i => i.type === 'missing-nft-id')) {
      recommendations.push('Add unique identifier (id or uuid) to NFT resource')
    }

    if (issues.some(i => i.type === 'missing-destroy-function')) {
      recommendations.push('Implement destroy() function for proper resource cleanup')
    }

    return recommendations
  }

  private generateFungibleTokenRecommendations(requiredFeatures: RequiredFeature[], issues: ContractSpecificIssue[]): string[] {
    const recommendations: string[] = []

    if (!requiredFeatures.find(f => f.name === 'FungibleToken Interface')?.present) {
      recommendations.push('Import and implement FungibleToken interface for standard compliance')
    }

    if (!requiredFeatures.find(f => f.name === 'Supply Management')?.present) {
      recommendations.push('Add total supply tracking for token economics')
    }

    if (issues.some(i => i.type === 'missing-balance-validation')) {
      recommendations.push('Add balance validation to prevent overdrafts')
    }

    if (issues.some(i => i.type === 'missing-amount-validation')) {
      recommendations.push('Validate positive amounts in transfer functions')
    }

    return recommendations
  }

  private generateDAORecommendations(requiredFeatures: RequiredFeature[], issues: ContractSpecificIssue[]): string[] {
    const recommendations: string[] = []

    if (!requiredFeatures.find(f => f.name === 'Voting Mechanism')?.present) {
      recommendations.push('Implement voting functions for governance participation')
    }

    if (!requiredFeatures.find(f => f.name === 'Quorum Requirement')?.present) {
      recommendations.push('Add quorum requirements for proposal validity')
    }

    if (issues.some(i => i.type === 'missing-double-vote-prevention')) {
      recommendations.push('Implement double voting prevention mechanism')
    }

    if (issues.some(i => i.type === 'missing-vote-counting')) {
      recommendations.push('Add proper vote counting and tallying')
    }

    return recommendations
  }

  private generateMarketplaceRecommendations(requiredFeatures: RequiredFeature[], issues: ContractSpecificIssue[]): string[] {
    const recommendations: string[] = []

    if (!requiredFeatures.find(f => f.name === 'Purchase Function')?.present) {
      recommendations.push('Implement purchase/buy function for marketplace transactions')
    }

    if (!requiredFeatures.find(f => f.name === 'Commission Logic')?.present) {
      recommendations.push('Add commission/fee handling for marketplace sustainability')
    }

    if (issues.some(i => i.type === 'missing-ownership-verification')) {
      recommendations.push('Verify item ownership before allowing listing creation')
    }

    if (issues.some(i => i.type === 'missing-payment-distribution')) {
      recommendations.push('Implement proper payment distribution to sellers')
    }

    return recommendations
  }

  private generateGenericRecommendations(requiredFeatures: RequiredFeature[], issues: ContractSpecificIssue[]): string[] {
    const recommendations: string[] = []

    if (!requiredFeatures.find(f => f.name === 'Contract Declaration')?.present) {
      recommendations.push('Add proper contract declaration with access modifier')
    }

    if (!requiredFeatures.find(f => f.name === 'Init Function')?.present) {
      recommendations.push('Add init() function for contract initialization')
    }

    return recommendations
  }

  private createFailureResult(contractType: string, error: any): ContractSpecificValidationResult {
    return {
      contractType,
      isValid: false,
      validationResults: [{
        type: 'completeness',
        passed: false,
        issues: [{
          severity: 'critical',
          type: 'validation-failure',
          location: { line: 1, column: 1 },
          message: `Contract-specific validation failed: ${error.message}`,
          suggestedFix: 'Manual review required',
          autoFixable: false
        }],
        score: 0,
        message: 'Validation system failure'
      }],
      specificIssues: [],
      complianceScore: 0,
      requiredFeatures: [],
      missingFeatures: [],
      recommendations: ['Validation system failed - manual review required']
    }
  }
}

// Export singleton instance
export const contractSpecificValidator = new ContractSpecificValidator()