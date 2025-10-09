/**
 * Core types and interfaces for the Quality Assurance system
 */

// Base quality assurance types
export interface QualityAssuredResult {
  code: string
  qualityScore: number
  validationResults: ValidationResult[]
  correctionHistory: CorrectionAttempt[]
  fallbackUsed: boolean
  generationMetrics: GenerationMetrics
}

export interface GenerationRequest {
  prompt: string
  context?: string
  temperature?: number
  maxRetries?: number
  strictMode?: boolean
}

export interface ValidationResult {
  type: 'syntax' | 'logic' | 'completeness' | 'best-practices'
  passed: boolean
  issues: ValidationIssue[]
  score: number
  message?: string
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info'
  type: string
  location: CodeLocation
  message: string
  suggestedFix?: string
  autoFixable: boolean
}

export interface CodeLocation {
  line: number
  column: number
  length?: number
  context?: string
}

export interface CorrectionAttempt {
  attemptNumber: number
  timestamp: Date
  corrections: Correction[]
  success: boolean
  qualityImprovement: number
}

export interface Correction {
  type: 'undefined-fix' | 'syntax-fix' | 'logic-enhancement' | 'structure-fix'
  location: CodeLocation
  originalValue: string
  correctedValue: string
  reasoning: string
  confidence: number
}

export interface GenerationMetrics {
  attemptCount: number
  totalGenerationTime: number
  validationTime: number
  correctionTime: number
  finalQualityScore: number
  issuesDetected: number
  issuesFixed: number
  startTime: Date
  endTime?: Date
}

export interface QualityScore {
  overall: number // 0-100
  syntax: number
  logic: number
  completeness: number
  bestPractices: number
  productionReadiness: number
}

// Contract and generation context types
export interface ContractType {
  category: 'nft' | 'fungible-token' | 'utility' | 'dao' | 'marketplace' | 'generic'
  complexity: 'simple' | 'intermediate' | 'advanced'
  features: string[]
}

export interface GenerationContext {
  userPrompt: string
  contractType: ContractType
  previousAttempts: GenerationAttempt[]
  qualityRequirements: QualityRequirements
  userExperience: 'beginner' | 'intermediate' | 'expert'
}

export interface GenerationAttempt {
  attemptNumber: number
  timestamp: Date
  prompt: string
  result: string
  qualityScore: number
  issues: ValidationIssue[]
}

export interface QualityRequirements {
  minimumQualityScore: number
  requiredFeatures: string[]
  prohibitedPatterns: string[]
  performanceRequirements: PerformanceRequirements
}

export interface PerformanceRequirements {
  maxGenerationTime: number
  maxValidationTime: number
  maxRetryAttempts: number
}

// Error and failure types
export interface QualityAssuranceError extends Error {
  code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
  recoverable: boolean
  timestamp: Date
}

export interface FailurePattern {
  type: string
  frequency: number
  commonCauses: string[]
  suggestedSolutions: string[]
}

// Metrics and reporting types
export interface QualityMetrics {
  generationSuccess: {
    firstAttempt: number
    afterCorrection: number
    fallbackUsed: number
  }
  commonIssues: {
    undefinedValues: number
    syntaxErrors: number
    incompleteLogic: number
    validationFailures: number
  }
  averageQualityScore: number
  userSatisfaction: number
  totalGenerations: number
  timeRange: {
    start: Date
    end: Date
  }
}

export interface QualityTrends {
  qualityScoreOverTime: Array<{ timestamp: Date; score: number }>
  issueFrequencyTrends: Array<{ type: string; frequency: number; trend: 'increasing' | 'decreasing' | 'stable' }>
  correctionSuccessRate: number
  fallbackUsageRate: number
}

export interface IssuePattern {
  type: string
  description: string
  frequency: number
  severity: 'critical' | 'warning' | 'info'
  commonSolutions: string[]
  preventionStrategies: string[]
}

export interface QualityReport {
  summary: QualityMetrics
  trends: QualityTrends
  commonIssues: IssuePattern[]
  recommendations: string[]
  generatedAt: Date
}