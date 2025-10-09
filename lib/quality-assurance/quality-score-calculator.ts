/**
 * Quality Score Calculator for AI-generated Cadence contracts
 * 
 * This module implements comprehensive quality scoring algorithms that evaluate
 * generated code across multiple dimensions: syntax, logic, completeness, 
 * best practices, and production readiness.
 */

import { 
  QualityScore, 
  ValidationResult, 
  ValidationIssue, 
  ContractType,
  QualityRequirements 
} from './types'
import { QAError } from './errors'

export interface QualityScoreWeights {
  syntax: number
  logic: number
  completeness: number
  bestPractices: number
  productionReadiness: number
}

export interface QualityThresholds {
  minimum: number
  good: number
  excellent: number
  productionReady: number
}

export interface ScoringContext {
  contractType: ContractType
  requirements: QualityRequirements
  weights?: Partial<QualityScoreWeights>
  thresholds?: Partial<QualityThresholds>
}

/**
 * Calculates comprehensive quality scores for generated Cadence contracts
 */
export class QualityScoreCalculator {
  private readonly defaultWeights: QualityScoreWeights = {
    syntax: 0.25,
    logic: 0.25,
    completeness: 0.25,
    bestPractices: 0.15,
    productionReadiness: 0.10
  }

  private readonly defaultThresholds: QualityThresholds = {
    minimum: 60,
    good: 75,
    excellent: 90,
    productionReady: 85
  }

  /**
   * Calculate comprehensive quality score from validation results
   */
  calculateQualityScore(
    validationResults: ValidationResult[],
    context?: ScoringContext
  ): QualityScore {
    try {
      const weights = { ...this.defaultWeights, ...context?.weights }
      
      // Calculate individual scores using specific methods
      const syntaxScore = this.calculateSyntaxScore(validationResults)
      const logicScore = this.calculateLogicScore(validationResults, context)
      const completenessScore = this.calculateCompletenessScore(validationResults, context)
      const bestPracticesScore = this.calculateBestPracticesScore(validationResults)
      
      // Calculate production readiness based on all factors
      const productionReadiness = this.calculateProductionReadiness({
        syntax: syntaxScore,
        logic: logicScore,
        completeness: completenessScore,
        bestPractices: bestPracticesScore,
        productionReadiness: 0 // Will be calculated
      }, validationResults, context)

      // Calculate weighted overall score
      const overall = Math.round(
        syntaxScore * weights.syntax +
        logicScore * weights.logic +
        completenessScore * weights.completeness +
        bestPracticesScore * weights.bestPractices +
        productionReadiness * weights.productionReadiness
      )

      const qualityScore: QualityScore = {
        overall: Math.max(0, Math.min(100, overall)),
        syntax: syntaxScore,
        logic: logicScore,
        completeness: completenessScore,
        bestPractices: bestPracticesScore,
        productionReadiness
      }

      // Log quality score calculation in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('Quality score calculated', { 
          qualityScore, 
          weights, 
          validationResultsCount: validationResults.length 
        })
      }

      return qualityScore
    } catch (error) {
      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to calculate quality score', { error, validationResults })
      }
      throw new QAError(
        'Quality score calculation failed',
        'SCORE_CALCULATION_ERROR',
        'high',
        true,
        { validationResults, context }
      )
    }
  }

  /**
   * Calculate syntax quality score based on syntax validation results
   */
  calculateSyntaxScore(validationResults: ValidationResult[]): number {
    const syntaxResults = validationResults.filter(r => r.type === 'syntax')
    if (syntaxResults.length === 0) return 50 // No syntax validation performed

    const syntaxResult = syntaxResults[0]
    if (syntaxResult.passed && syntaxResult.issues.length === 0) {
      return 100
    }

    // Deduct points based on issue severity
    let score = 100
    for (const issue of syntaxResult.issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25
          break
        case 'warning':
          score -= 10
          break
        case 'info':
          score -= 2
          break
      }
    }

    return Math.max(0, score)
  }

  /**
   * Calculate logic quality score based on functional completeness
   */
  calculateLogicScore(validationResults: ValidationResult[], context?: ScoringContext): number {
    const logicResults = validationResults.filter(r => r.type === 'logic')
    if (logicResults.length === 0) return 50 // No logic validation performed

    const logicResult = logicResults[0]
    let baseScore = logicResult.score || 50

    // Penalize critical logic issues more heavily
    const criticalLogicIssues = logicResult.issues.filter(i => i.severity === 'critical').length
    baseScore -= criticalLogicIssues * 20

    // Apply contract-type-specific logic scoring
    if (context?.contractType) {
      baseScore = this.applyContractTypeLogicScoring(baseScore, context.contractType, logicResult.issues)
    }

    return Math.max(0, Math.min(100, baseScore))
  }

  /**
   * Calculate completeness score based on required elements
   */
  calculateCompletenessScore(validationResults: ValidationResult[], context?: ScoringContext): number {
    const completenessResults = validationResults.filter(r => r.type === 'completeness')
    if (completenessResults.length === 0) return 50

    const completenessResult = completenessResults[0]
    let score = completenessResult.score || 50

    // Check for missing required elements
    const missingElements = completenessResult.issues.filter(i => 
      i.type.includes('missing') && i.severity === 'critical'
    ).length

    score -= missingElements * 15

    // Apply contract-specific completeness requirements
    if (context?.requirements?.requiredFeatures && context.requirements.requiredFeatures.length > 0) {
      const implementedFeatures = this.countImplementedFeatures(
        completenessResult.issues, 
        context.requirements.requiredFeatures
      )
      const featureCompleteness = implementedFeatures / context.requirements.requiredFeatures.length
      score = score * featureCompleteness
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate best practices score
   */
  calculateBestPracticesScore(validationResults: ValidationResult[]): number {
    const bestPracticesResults = validationResults.filter(r => r.type === 'best-practices')
    if (bestPracticesResults.length === 0) return 50 // Default score when no validation performed

    const bestPracticesResult = bestPracticesResults[0]
    let score = bestPracticesResult.score || 70

    // Deduct points for best practice violations
    for (const issue of bestPracticesResult.issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 15
          break
        case 'warning':
          score -= 8
          break
        case 'info':
          score -= 3
          break
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate production readiness score
   */
  calculateProductionReadiness(
    scores: QualityScore, 
    validationResults: ValidationResult[],
    context?: ScoringContext
  ): number {
    // Production readiness is based on minimum thresholds across all categories
    const thresholds = { ...this.defaultThresholds, ...context?.thresholds }
    
    // Must meet minimum thresholds in all areas
    const meetsMinimumSyntax = scores.syntax >= thresholds.minimum
    const meetsMinimumLogic = scores.logic >= thresholds.minimum
    const meetsMinimumCompleteness = scores.completeness >= thresholds.minimum
    
    if (!meetsMinimumSyntax || !meetsMinimumLogic || !meetsMinimumCompleteness) {
      return 0 // Not production ready if any category fails minimum
    }

    // Calculate production readiness based on overall quality
    const averageScore = (scores.syntax + scores.logic + scores.completeness + scores.bestPractices) / 4
    
    // Check for production-blocking issues
    const blockingIssues = validationResults
      .flatMap(r => r.issues)
      .filter(i => i.severity === 'critical' && !i.autoFixable).length

    if (blockingIssues > 0) {
      return Math.max(0, averageScore - (blockingIssues * 30))
    }

    // Scale based on average score
    if (averageScore >= thresholds.excellent) return 100
    if (averageScore >= thresholds.good) return 85
    if (averageScore >= thresholds.minimum) return 70
    
    return Math.max(0, averageScore - 10)
  }

  /**
   * Check if code meets quality threshold
   */
  meetsQualityThreshold(qualityScore: QualityScore, threshold: number): boolean {
    return qualityScore.overall >= threshold
  }

  /**
   * Check if code is production ready
   */
  isProductionReady(qualityScore: QualityScore, context?: ScoringContext): boolean {
    const thresholds = { ...this.defaultThresholds, ...context?.thresholds }
    return qualityScore.productionReadiness >= thresholds.productionReady
  }

  /**
   * Get quality assessment with recommendations
   */
  getQualityAssessment(qualityScore: QualityScore, validationResults: ValidationResult[]): {
    level: 'poor' | 'fair' | 'good' | 'excellent'
    recommendations: string[]
    productionReady: boolean
  } {
    const level = this.getQualityLevel(qualityScore.overall)
    const recommendations = this.generateRecommendations(qualityScore, validationResults)
    const productionReady = this.isProductionReady(qualityScore)

    return { level, recommendations, productionReady }
  }

  // Private helper methods

  private extractScore(validationResults: ValidationResult[], type: string): number {
    const result = validationResults.find(r => r.type === type)
    return result?.score ?? 50 // Default score if validation not performed
  }

  private applyContractTypeLogicScoring(
    baseScore: number, 
    contractType: ContractType, 
    issues: ValidationIssue[]
  ): number {
    // Apply contract-type-specific logic requirements
    switch (contractType.category) {
      case 'nft':
        return this.scoreNFTLogic(baseScore, issues)
      case 'fungible-token':
        return this.scoreFungibleTokenLogic(baseScore, issues)
      case 'dao':
        return this.scoreDAOLogic(baseScore, issues)
      case 'marketplace':
        return this.scoreMarketplaceLogic(baseScore, issues)
      default:
        return baseScore
    }
  }

  private scoreNFTLogic(baseScore: number, issues: ValidationIssue[]): number {
    // Check for NFT-specific requirements
    const hasMetadataIssue = issues.some(i => i.type.includes('metadata'))
    const hasTransferIssue = issues.some(i => i.type.includes('transfer'))
    
    if (hasMetadataIssue) baseScore -= 15
    if (hasTransferIssue) baseScore -= 20
    
    return baseScore
  }

  private scoreFungibleTokenLogic(baseScore: number, issues: ValidationIssue[]): number {
    // Check for fungible token requirements
    const hasSupplyIssue = issues.some(i => i.type.includes('supply'))
    const hasTransferIssue = issues.some(i => i.type.includes('transfer'))
    const hasBalanceIssue = issues.some(i => i.type.includes('balance'))
    
    if (hasSupplyIssue) baseScore -= 20
    if (hasTransferIssue) baseScore -= 20
    if (hasBalanceIssue) baseScore -= 15
    
    return baseScore
  }

  private scoreDAOLogic(baseScore: number, issues: ValidationIssue[]): number {
    // Check for DAO-specific requirements
    const hasVotingIssue = issues.some(i => i.type.includes('voting'))
    const hasGovernanceIssue = issues.some(i => i.type.includes('governance'))
    
    if (hasVotingIssue) baseScore -= 25
    if (hasGovernanceIssue) baseScore -= 20
    
    return baseScore
  }

  private scoreMarketplaceLogic(baseScore: number, issues: ValidationIssue[]): number {
    // Check for marketplace requirements
    const hasListingIssue = issues.some(i => i.type.includes('listing'))
    const hasPurchaseIssue = issues.some(i => i.type.includes('purchase'))
    
    if (hasListingIssue) baseScore -= 20
    if (hasPurchaseIssue) baseScore -= 20
    
    return baseScore
  }

  private countImplementedFeatures(issues: ValidationIssue[], requiredFeatures: string[]): number {
    const missingFeatures = issues
      .filter(i => i.type.includes('missing'))
      .map(i => i.type.replace('missing-', ''))
    
    return requiredFeatures.filter(feature => 
      !missingFeatures.some(missing => missing.includes(feature))
    ).length
  }

  private getQualityLevel(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    return 'poor'
  }

  private generateRecommendations(
    qualityScore: QualityScore, 
    validationResults: ValidationResult[]
  ): string[] {
    const recommendations: string[] = []

    if (qualityScore.syntax < 80) {
      recommendations.push('Fix syntax errors and improve code structure')
    }

    if (qualityScore.logic < 70) {
      recommendations.push('Enhance contract logic and add missing functionality')
    }

    if (qualityScore.completeness < 75) {
      recommendations.push('Complete missing contract elements and required functions')
    }

    if (qualityScore.bestPractices < 70) {
      recommendations.push('Follow Cadence best practices and security patterns')
    }

    if (qualityScore.productionReadiness < 85) {
      recommendations.push('Address production-blocking issues before deployment')
    }

    // Add specific recommendations based on validation issues
    const criticalIssues = validationResults
      .flatMap(r => r.issues)
      .filter(i => i.severity === 'critical')

    if (criticalIssues.length > 0) {
      recommendations.push(`Resolve ${criticalIssues.length} critical issues before proceeding`)
    }

    return recommendations
  }
}

/**
 * Default quality score calculator instance
 */
export const qualityScoreCalculator = new QualityScoreCalculator()