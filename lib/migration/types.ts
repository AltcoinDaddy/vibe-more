/**
 * Core types and interfaces for the Cadence syntax migration system
 */

export interface MigrationConfig {
  targetCadenceVersion: string
  preserveComments: boolean
  validateAfterMigration: boolean
  backupOriginals: boolean
  transformationRules: TransformationRule[]
}

export interface TransformationRule {
  pattern: RegExp
  replacement: string
  description: string
  category: 'access-modifier' | 'interface' | 'storage' | 'function' | 'import'
}

export interface MigrationResult {
  success: boolean
  migratedFiles: string[]
  errors: MigrationError[]
  warnings: MigrationWarning[]
  statistics: MigrationStatistics
}

export interface MigrationStatistics {
  totalFilesProcessed: number
  successfulMigrations: number
  failedMigrations: number
  transformationsApplied: number
  linesOfCodeMigrated: number
}

export interface MigrationError {
  file: string
  line?: number
  column?: number
  message: string
  category: 'syntax' | 'validation' | 'transformation' | 'system'
  severity: 'error' | 'warning'
}

export interface MigrationWarning {
  file: string
  line?: number
  message: string
  suggestion?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  compilationSuccess: boolean
}

export interface SyntaxValidationResult {
  isValid: boolean
  errors: SyntaxError[]
  warnings: SyntaxWarning[]
  structureIssues: StructureIssue[]
  functionIssues: FunctionIssue[]
  eventIssues: EventIssue[]
}

export interface SyntaxError {
  type: 'bracket-mismatch' | 'incomplete-statement' | 'invalid-syntax' | 'missing-keyword'
  location: CodeLocation
  message: string
  suggestion?: string
}

export interface SyntaxWarning {
  type: 'style' | 'best-practice' | 'potential-issue'
  location: CodeLocation
  message: string
  suggestion?: string
}

export interface StructureIssue {
  type: 'missing-init' | 'invalid-access-modifier' | 'incomplete-contract' | 'invalid-resource-structure'
  location: CodeLocation
  message: string
  severity: 'error' | 'warning'
  suggestion?: string
}

export interface FunctionIssue {
  type: 'incomplete-signature' | 'missing-return-type' | 'invalid-parameters' | 'missing-body'
  location: CodeLocation
  functionName: string
  message: string
  suggestion?: string
}

export interface EventIssue {
  type: 'invalid-definition' | 'missing-parameters' | 'invalid-parameter-types' | 'incomplete-event'
  location: CodeLocation
  eventName: string
  message: string
  suggestion?: string
}

export interface CodeLocation {
  line: number
  column: number
  length?: number
}

export interface TemplateMigrationResult {
  originalTemplate: any
  migratedTemplate: any
  transformationsApplied: string[]
  validationResult: ValidationResult
}

export interface MigrationController {
  executeMigration(): Promise<MigrationResult>
  validateMigration(): Promise<ValidationResult>
  generateReport(): MigrationReport
}

export interface MigrationReport {
  timestamp: Date
  duration: number
  result: MigrationResult
  summary: string
  recommendations: string[]
}

export interface SyntaxTransformer {
  transformAccessModifiers(code: string): string
  transformInterfaceConformance(code: string): string
  transformStorageAPI(code: string): string
  transformFunctionSignatures(code: string): string
  transformImportStatements(code: string): string
}

export interface TemplateMigrator {
  migrateTemplate(template: any): any
  validateTemplate(template: any): ValidationResult
  updateTemplateMetadata(template: any): any
}

export interface AIGeneratorUpdater {
  updateSystemPrompts(): void
  updateMockResponses(): void
  validateGeneratedCode(code: string): ValidationResult
}

export interface ValidationReport {
  timestamp: Date
  codeMetrics: {
    totalLines: number
    nonEmptyLines: number
    hasContent: boolean
  }
  validation: ValidationResult
  analysis: {
    hasLegacyPatterns: boolean
    criticalIssues: number
    warnings: number
    patterns: string[]
  }
  rejection: {
    shouldReject: boolean
    reason: string
  }
  suggestions: string[]
  compliance: {
    isCadence10Compliant: boolean
    complianceScore: number
    readyForProduction: boolean
  }
  recommendations: string[]
}