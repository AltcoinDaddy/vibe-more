/**
 * Quality Assurance Infrastructure
 * 
 * This module provides the core infrastructure for ensuring AI-generated
 * Cadence contracts meet quality standards through validation, correction,
 * and comprehensive error handling.
 */

// Core types and interfaces
export * from './types'

// Configuration management
export * from './config'

// Error handling framework
export * from './errors'

// Logging system
export * from './logger'

// Pre-validation scanner
export * from './undefined-value-detector'

// Auto-correction engine
export * from './auto-correction-engine'

// Intelligent fallback generation
export * from './fallback-generator'

// Quality scoring and assessment
export * from './quality-score-calculator'

// Prompt enhancement system
export * from './prompt-enhancer'

// Retry and recovery system
export * from './retry-recovery-system'

// Enhanced generation controller
export * from './enhanced-generation-controller'

// Comprehensive error detection and classification
export * from './comprehensive-error-detector'

// Comprehensive validation system integration
export * from './comprehensive-validation-system'

// Contract-specific validation rules
export * from './contract-specific-validator'

// Functional completeness validation
export * from './functional-completeness-validator'

// Re-export commonly used types for convenience
export type {
  QualityAssuredResult,
  GenerationRequest,
  ValidationResult,
  QualityScore,
  GenerationMetrics,
  QualityConfig
} from './types'

export {
  QualityConfigManager,
  qualityConfig,
  DEFAULT_QUALITY_CONFIG
} from './config'

export {
  QAError,
  GenerationError,
  ValidationError,
  CorrectionError,
  ConfigurationError,
  PerformanceError,
  qaErrorHandler,
  ERROR_CODES
} from './errors'

export {
  QALogger,
  initializeLogger,
  getLogger
} from './logger'

export {
  QualityScoreCalculator,
  qualityScoreCalculator
} from './quality-score-calculator'

export {
  PromptEnhancer
} from './prompt-enhancer'

export {
  RetryRecoverySystem,
  retryRecoverySystem
} from './retry-recovery-system'

export {
  EnhancedGenerationController,
  enhancedGenerationController
} from './enhanced-generation-controller'

export {
  ComprehensiveErrorDetector,
  ErrorType,
  ErrorCategory,
  type DetectedError,
  type ErrorDetectionResult,
  type ErrorClassification,
  type ContractRequirements
} from './comprehensive-error-detector'

export {
  ComprehensiveValidationSystem,
  comprehensiveValidationSystem,
  type ComprehensiveValidationResult,
  type ValidationContext,
  type ValidationRule,
  type FunctionSignatureValidation,
  type ContractStructureValidation,
  type EventDefinitionValidation
} from './comprehensive-validation-system'

export {
  ContractSpecificValidator,
  contractSpecificValidator,
  type ContractSpecificValidationResult,
  type ContractSpecificIssue,
  type RequiredFeature,
  type NFTValidationRules,
  type FungibleTokenValidationRules,
  type DAOValidationRules,
  type MarketplaceValidationRules
} from './contract-specific-validator'

export {
  FunctionalCompletenessValidator,
  functionalCompletenessValidator,
  type FunctionalCompletenessResult,
  type FunctionCompletenessValidation,
  type ResourceLifecycleValidation,
  type EventEmissionValidation,
  type AccessControlValidation,
  type FunctionIssue,
  type ResourceValidation,
  type EventDefinition,
  type RequiredFunction
} from './functional-completeness-validator'

// Metrics collection system
export * from './metrics-collector'

// Monitoring and alerting system
export {
  QAMonitoringSystem,
  DEFAULT_MONITORING_CONFIG,
  type MonitoringConfig,
  type AlertThresholds,
  type Alert,
  type AlertType,
  type AlertSeverity,
  type HealthCheck,
  type MonitoringMetrics
} from './monitoring-system'

export {
  QAAlertingSystem,
  DEFAULT_ALERTING_CONFIG,
  type AlertingConfig,
  type AlertChannel,
  type EscalationRule,
  type SuppressionRule,
  type RetryPolicy,
  type AlertNotification,
  type AlertingMetrics
} from './alerting-system'

export {
  QAHealthCheckSystem,
  DEFAULT_HEALTH_CHECK_CONFIG,
  type HealthCheckConfig,
  type ComponentConfig,
  type ComponentType,
  type ComponentHealthResult,
  type SystemHealthStatus,
  type HealthSummary,
  type HealthCheckAlert
} from './health-check-system'

export {
  QAMonitoringController,
  DEFAULT_MONITORING_CONTROLLER_CONFIG,
  initializeMonitoringController,
  getMonitoringController,
  type MonitoringControllerConfig,
  type IntegrationConfig,
  type SystemStatus,
  type MonitoringDashboard
} from './monitoring-controller'