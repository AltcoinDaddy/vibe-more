/**
 * Cadence Syntax Migration System
 * 
 * This module provides the core infrastructure for migrating legacy Cadence contracts
 * to modern Cadence 1.0 syntax. It includes configuration management, error handling,
 * logging, and the main migration controller.
 */

// Core types and interfaces
export * from './types'

// Configuration management
export { MigrationConfigManager, DEFAULT_MIGRATION_CONFIG } from './config'

// Logging system
export { MigrationLogger, LogLevel } from './logger'
export type { LogEntry } from './logger'

// Error handling
export { MigrationErrorHandler } from './error-handler'

// Main migration controller
export { CadenceMigrationController } from './controller'

// Syntax transformation engine
export { CadenceSyntaxTransformer } from './syntax-transformer'

// Template migration system
export { CadenceTemplateMigrator } from './template-migrator'
export { TemplateScanner } from './template-scanner'
export type { TemplateScanResult, TemplateProcessingResult } from './template-scanner'

// Convenience factory function
import { MigrationConfigManager } from './config'
import { CadenceMigrationController } from './controller'

export function createMigrationController(customConfig?: any) {
  const configManager = new MigrationConfigManager(customConfig)
  return new CadenceMigrationController(configManager)
}

// Convenience factory for template migration
export function createTemplateScanner() {
  return new TemplateScanner()
}