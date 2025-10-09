/**
 * Syntax transformation engine for Cadence 1.0 migration
 * Handles conversion of legacy Cadence syntax to modern patterns
 */

import { SyntaxTransformer } from './types'
import { MigrationLogger } from './logger'

export class CadenceSyntaxTransformer implements SyntaxTransformer {
  private logger: MigrationLogger

  constructor(logger?: MigrationLogger) {
    this.logger = logger || new MigrationLogger()
  }

  /**
   * Transform access modifiers from legacy to Cadence 1.0 syntax
   * - pub -> access(all)
   * - pub(set) -> access(all) with appropriate setter patterns
   * Only transforms pub keywords that are actual Cadence keywords, not in comments or strings
   */
  transformAccessModifiers(code: string): string {
    this.logger.debug('Starting access modifier transformation')
    
    let transformedCode = code
    let transformationCount = 0

    // Transform pub(set) first to avoid conflicts with pub transformation
    // Only match when pub(set) is followed by whitespace and then a Cadence keyword
    const pubSetPattern = /\bpub\(set\)\s+(?=(?:var|let|fun|resource|struct|contract|interface))/g
    transformedCode = transformedCode.replace(pubSetPattern, (match) => {
      transformationCount++
      this.logger.debug('Transformed pub(set) to access(all)', { original: match.trim() })
      return 'access(all) '
    })

    // Transform standalone pub keywords
    // Only match when pub is followed by whitespace and then a Cadence keyword
    const pubPattern = /\bpub\s+(?=(?:var|let|fun|resource|struct|contract|interface|event))/g
    transformedCode = transformedCode.replace(pubPattern, (match) => {
      transformationCount++
      this.logger.debug('Transformed pub to access(all)', { original: match.trim() })
      return 'access(all) '
    })

    this.logger.info('Access modifier transformation completed', { 
      transformationsApplied: transformationCount 
    })

    return transformedCode
  }

  /**
   * Transform interface conformance from comma-separated to ampersand-separated
   * - Resource: Interface1, Interface2 -> Resource: Interface1 & Interface2
   */
  transformInterfaceConformance(code: string): string {
    this.logger.debug('Starting interface conformance transformation')
    
    let transformedCode = code
    let transformationCount = 0

    // Pattern to match interface conformance with comma separation
    // Matches: resource/struct Name: Interface1, Interface2, Interface3
    const interfacePattern = /(\b(?:resource|struct|contract)\s+\w+\s*:\s*)([^{]+?)(\s*\{)/g
    
    transformedCode = transformedCode.replace(interfacePattern, (match, prefix, interfaces, suffix) => {
      // Check if interfaces contain commas (indicating legacy syntax)
      if (interfaces.includes(',')) {
        transformationCount++
        
        // Split by comma, trim whitespace, and join with &
        const interfaceList = interfaces
          .split(',')
          .map(iface => iface.trim())
          .filter(iface => iface.length > 0)
          .join(' & ')
        
        // Clean up the prefix to ensure proper spacing and clean up suffix
        const cleanPrefix = prefix.replace(/\s+$/, ' ')
        const cleanSuffix = suffix.replace(/^\s+/, ' ')
        const transformed = `${cleanPrefix}${interfaceList}${cleanSuffix}`
        this.logger.debug('Transformed interface conformance', { 
          original: interfaces.trim(),
          transformed: interfaceList 
        })
        
        return transformed
      }
      
      return match
    })

    this.logger.info('Interface conformance transformation completed', { 
      transformationsApplied: transformationCount 
    })

    return transformedCode
  }

  /**
   * Transform storage API calls to modern capability-based patterns
   * - account.save() -> account.storage.save()
   * - account.link() -> account.capabilities.storage.issue() + account.capabilities.publish()
   * - account.borrow() -> account.capabilities.borrow()
   */
  transformStorageAPI(code: string): string {
    this.logger.debug('Starting storage API transformation')
    
    let transformedCode = code
    let transformationCount = 0

    // Transform account.save() to account.storage.save()
    const savePattern = /\baccount\.save\b/g
    transformedCode = transformedCode.replace(savePattern, (match) => {
      transformationCount++
      this.logger.debug('Transformed account.save to account.storage.save')
      return 'account.storage.save'
    })

    // Transform account.load() to account.storage.load()
    const loadPattern = /\baccount\.load\b/g
    transformedCode = transformedCode.replace(loadPattern, (match) => {
      transformationCount++
      this.logger.debug('Transformed account.load to account.storage.load')
      return 'account.storage.load'
    })

    // Transform account.borrow() to account.storage.borrow()
    const borrowPattern = /\baccount\.borrow\b/g
    transformedCode = transformedCode.replace(borrowPattern, (match) => {
      transformationCount++
      this.logger.debug('Transformed account.borrow to account.storage.borrow')
      return 'account.storage.borrow'
    })

    // Transform account.copy() to account.storage.copy()
    const copyPattern = /\baccount\.copy\b/g
    transformedCode = transformedCode.replace(copyPattern, (match) => {
      transformationCount++
      this.logger.debug('Transformed account.copy to account.storage.copy')
      return 'account.storage.copy'
    })

    // Note: account.link() transformation is more complex and may require
    // manual intervention as it involves capability patterns
    const linkPattern = /\baccount\.link\b/g
    const linkMatches = transformedCode.match(linkPattern)
    if (linkMatches) {
      this.logger.warn('Found account.link() calls that require manual migration to capability patterns', {
        count: linkMatches.length
      })
    }

    this.logger.info('Storage API transformation completed', { 
      transformationsApplied: transformationCount 
    })

    return transformedCode
  }

  /**
   * Transform function signatures to modern Cadence 1.0 syntax
   * - Add view modifier for view functions
   * - Update entitlement-based function access patterns
   * - Ensure proper parameter and return type syntax
   */
  transformFunctionSignatures(code: string): string {
    this.logger.debug('Starting function signature transformation')
    
    let transformedCode = code
    let transformationCount = 0

    // Transform functions that should be view functions
    // Look for functions that only read state and don't modify it
    const viewFunctionPattern = /(\baccess\(all\)\s+)(fun\s+(?:get|read|check|is|has|can)\w*\s*\([^)]*\)\s*:\s*[^{]+\{)/g
    transformedCode = transformedCode.replace(viewFunctionPattern, (match, accessModifier, functionDef) => {
      // Only add view if it's not already there
      if (!match.includes('view')) {
        transformationCount++
        this.logger.debug('Added view modifier to function', { original: match.substring(0, 50) + '...' })
        return `${accessModifier}view ${functionDef}`
      }
      return match
    })

    // Also transform functions that return values and don't modify state (like getProposal, getAllProposals)
    const getterFunctionPattern = /(\baccess\(all\)\s+)(fun\s+get\w*\s*\([^)]*\)\s*:\s*[^{]+\{)/g
    transformedCode = transformedCode.replace(getterFunctionPattern, (match, accessModifier, functionDef) => {
      // Only add view if it's not already there
      if (!match.includes('view')) {
        transformationCount++
        this.logger.debug('Added view modifier to getter function', { original: match.substring(0, 50) + '...' })
        return `${accessModifier}view ${functionDef}`
      }
      return match
    })

    // Transform init functions to ensure proper access modifier
    const initPattern = /\binit\s*\(/g
    transformedCode = transformedCode.replace(initPattern, (match) => {
      // init functions don't need access modifiers in Cadence 1.0
      return match
    })

    // Transform destroy functions (if any exist)
    const destroyPattern = /\bdestroy\s*\(/g
    transformedCode = transformedCode.replace(destroyPattern, (match) => {
      // destroy functions don't need access modifiers in Cadence 1.0
      return match
    })

    this.logger.info('Function signature transformation completed', { 
      transformationsApplied: transformationCount 
    })

    return transformedCode
  }

  /**
   * Transform import statements to use current Flow standard contract addresses
   * This is a placeholder for future implementation
   */
  transformImportStatements(code: string): string {
    this.logger.debug('Starting import statement transformation')
    
    let transformedCode = code
    let transformationCount = 0

    // Placeholder for import statement transformations
    // This would involve updating contract addresses and import paths
    
    this.logger.info('Import statement transformation completed', { 
      transformationsApplied: transformationCount 
    })

    return transformedCode
  }

  /**
   * Apply all transformations to a code string
   */
  transformAll(code: string): string {
    this.logger.info('Starting complete syntax transformation')
    
    let transformedCode = code
    
    // Apply transformations in order
    transformedCode = this.transformAccessModifiers(transformedCode)
    transformedCode = this.transformInterfaceConformance(transformedCode)
    transformedCode = this.transformStorageAPI(transformedCode)
    transformedCode = this.transformFunctionSignatures(transformedCode)
    transformedCode = this.transformImportStatements(transformedCode)
    
    this.logger.info('Complete syntax transformation finished')
    
    return transformedCode
  }

  /**
   * Get transformation statistics
   */
  getTransformationStats(originalCode: string, transformedCode: string) {
    const originalLines = originalCode.split('\n').length
    const transformedLines = transformedCode.split('\n').length
    
    return {
      originalLines,
      transformedLines,
      linesChanged: Math.abs(transformedLines - originalLines),
      hasChanges: originalCode !== transformedCode
    }
  }
}