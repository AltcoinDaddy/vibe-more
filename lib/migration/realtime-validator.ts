/**
 * Real-time Validation Engine for Cadence Syntax Migration
 * Provides sub-100ms validation with modernization suggestions and educational content
 */

import { LegacyPatternDetector, LegacyPattern, CodeLocation } from './legacy-pattern-detector';

export interface ValidationResult {
  isValid: boolean;
  hasLegacyPatterns: boolean;
  patterns: LegacyPattern[];
  suggestions: ModernizationSuggestion[];
  educationalContent: EducationalContent[];
  validationTime: number;
  confidence: number;
}

export interface ModernizationSuggestion {
  pattern: LegacyPattern;
  modernReplacement: string;
  explanation: string;
  example: CodeExample;
  confidence: number;
  autoFixable: boolean;
}

export interface CodeExample {
  before: string;
  after: string;
  description: string;
}

export interface EducationalContent {
  pattern: string;
  title: string;
  description: string;
  whyModernize: string;
  benefits: string[];
  learnMoreUrl?: string;
}

export interface ModernizationResult {
  originalCode: string;
  modernizedCode: string;
  transformationsApplied: string[];
  confidence: number;
  requiresManualReview: boolean;
  warnings: string[];
}

export interface AutoModernizationOptions {
  autoFixCritical: boolean;
  autoFixWarnings: boolean;
  preserveComments: boolean;
  addExplanationComments: boolean;
}

export class RealtimeValidator {
  private patternDetector: LegacyPatternDetector;
  private educationalDatabase: Map<string, EducationalContent>;
  private exampleDatabase: Map<string, CodeExample>;

  constructor() {
    this.patternDetector = new LegacyPatternDetector();
    this.educationalDatabase = new Map();
    this.exampleDatabase = new Map();
    this.initializeEducationalContent();
    this.initializeCodeExamples();
  }

  /**
   * Validate user input with sub-100ms response time
   */
  async validateUserInput(code: string): Promise<ValidationResult> {
    const startTime = performance.now();

    try {
      // Fast pattern detection
      const patterns = this.patternDetector.detectAllLegacyPatterns(code);
      
      // Generate modernization suggestions
      const suggestions = this.generateModernizationSuggestions(patterns);
      
      // Get educational content for detected patterns
      const educationalContent = this.getEducationalContent(patterns);
      
      // Calculate confidence based on pattern clarity
      const confidence = this.calculateValidationConfidence(patterns);
      
      const endTime = performance.now();
      const validationTime = endTime - startTime;

      return {
        isValid: patterns.filter(p => p.severity === 'critical').length === 0,
        hasLegacyPatterns: patterns.length > 0,
        patterns,
        suggestions,
        educationalContent,
        validationTime,
        confidence
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        isValid: false,
        hasLegacyPatterns: false,
        patterns: [],
        suggestions: [],
        educationalContent: [],
        validationTime: endTime - startTime,
        confidence: 0
      };
    }
  }

  /**
   * Generate modernization suggestions with examples
   */
  generateModernizationSuggestions(patterns: LegacyPattern[]): ModernizationSuggestion[] {
    return patterns.map(pattern => {
      const example = this.exampleDatabase.get(pattern.type) || this.createDefaultExample(pattern);
      
      return {
        pattern,
        modernReplacement: pattern.modernReplacement,
        explanation: this.getModernizationExplanation(pattern),
        example,
        confidence: this.calculateSuggestionConfidence(pattern),
        autoFixable: this.isAutoFixable(pattern)
      };
    });
  }

  /**
   * Automatically modernize code where possible
   */
  autoModernizeCode(code: string, options: AutoModernizationOptions = {
    autoFixCritical: true,
    autoFixWarnings: false,
    preserveComments: true,
    addExplanationComments: false
  }): ModernizationResult {
    const patterns = this.patternDetector.detectAllLegacyPatterns(code);
    let modernizedCode = code;
    const transformationsApplied: string[] = [];
    const warnings: string[] = [];
    let requiresManualReview = false;

    // Sort patterns by location (reverse order to maintain indices)
    const sortedPatterns = patterns.sort((a, b) => b.location.startIndex - a.location.startIndex);

    for (const pattern of sortedPatterns) {
      const shouldAutoFix = (
        (pattern.severity === 'critical' && options.autoFixCritical) ||
        (pattern.severity === 'warning' && options.autoFixWarnings)
      );

      if (shouldAutoFix && this.isAutoFixable(pattern)) {
        // Apply the transformation
        const before = modernizedCode.substring(pattern.location.startIndex, pattern.location.endIndex);
        const after = pattern.modernReplacement;
        
        modernizedCode = 
          modernizedCode.substring(0, pattern.location.startIndex) +
          after +
          modernizedCode.substring(pattern.location.endIndex);

        transformationsApplied.push(`${pattern.description}: ${before} → ${after}`);

        // Add explanation comment if requested
        if (options.addExplanationComments) {
          const comment = `// Modernized: ${pattern.suggestedFix}`;
          modernizedCode = 
            modernizedCode.substring(0, pattern.location.startIndex) +
            comment + '\n' +
            modernizedCode.substring(pattern.location.startIndex);
        }
      } else {
        warnings.push(`Manual review required: ${pattern.description} at line ${pattern.location.line}`);
        requiresManualReview = true;
      }
    }

    return {
      originalCode: code,
      modernizedCode,
      transformationsApplied,
      confidence: this.calculateModernizationConfidence(transformationsApplied, warnings),
      requiresManualReview,
      warnings
    };
  }

  /**
   * Provide educational content for legacy patterns
   */
  provideLegacyPatternEducation(pattern: string): EducationalContent | null {
    return this.educationalDatabase.get(pattern) || null;
  }

  /**
   * Get educational content for detected patterns
   */
  private getEducationalContent(patterns: LegacyPattern[]): EducationalContent[] {
    const uniqueTypes = new Set(patterns.map(p => p.type));
    return Array.from(uniqueTypes)
      .map(type => this.educationalDatabase.get(type))
      .filter((content): content is EducationalContent => content !== undefined);
  }

  /**
   * Calculate validation confidence based on pattern clarity
   */
  private calculateValidationConfidence(patterns: LegacyPattern[]): number {
    if (patterns.length === 0) return 1.0;

    const confidenceScores = patterns.map(pattern => {
      // Higher confidence for well-defined patterns
      switch (pattern.type) {
        case 'access-modifier': return 0.95;
        case 'storage-api': return 0.90;
        case 'interface-conformance': return 0.85;
        case 'function-signature': return 0.70;
        default: return 0.60;
      }
    });

    return confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  }

  /**
   * Calculate suggestion confidence
   */
  private calculateSuggestionConfidence(pattern: LegacyPattern): number {
    const baseConfidence = pattern.severity === 'critical' ? 0.9 : 
                          pattern.severity === 'warning' ? 0.7 : 0.5;
    
    // Adjust based on pattern complexity
    const complexityAdjustment = this.isAutoFixable(pattern) ? 0.1 : -0.2;
    
    return Math.max(0.1, Math.min(1.0, baseConfidence + complexityAdjustment));
  }

  /**
   * Calculate modernization confidence
   */
  private calculateModernizationConfidence(transformations: string[], warnings: string[]): number {
    const totalChanges = transformations.length + warnings.length;
    if (totalChanges === 0) return 1.0;
    
    const successRate = transformations.length / totalChanges;
    return Math.max(0.1, successRate);
  }

  /**
   * Check if a pattern can be automatically fixed
   */
  private isAutoFixable(pattern: LegacyPattern): boolean {
    const autoFixablePatterns = [
      'pub-function',
      'pub-variable', 
      'pub-struct-resource',
      'account-save',
      'account-load',
      'account-borrow'
    ];

    // Complex patterns that require manual review
    const manualReviewPatterns = [
      'account-link',
      'comma-separated-interfaces'
    ];

    // Determine pattern name from type and description
    const patternName = this.getPatternName(pattern);
    
    // If it's explicitly a manual review pattern, it's not auto-fixable
    if (manualReviewPatterns.includes(patternName)) {
      return false;
    }
    
    return autoFixablePatterns.includes(patternName);
  }

  /**
   * Get pattern name for classification
   */
  private getPatternName(pattern: LegacyPattern): string {
    if (pattern.description.includes('pub fun')) return 'pub-function';
    if (pattern.description.includes('pub var') || pattern.description.includes('pub let')) return 'pub-variable';
    if (pattern.description.includes('pub struct') || pattern.description.includes('pub resource') || pattern.description.includes('pub contract')) return 'pub-struct-resource';
    if (pattern.description.includes('account.save')) return 'account-save';
    if (pattern.description.includes('account.load')) return 'account-load';
    if (pattern.description.includes('account.borrow')) return 'account-borrow';
    if (pattern.description.includes('account.link')) return 'account-link';
    if (pattern.description.includes('comma-separated') || pattern.description.includes('Comma-separated')) return 'comma-separated-interfaces';
    return 'unknown';
  }

  /**
   * Get modernization explanation for a pattern
   */
  private getModernizationExplanation(pattern: LegacyPattern): string {
    const explanations: Record<string, string> = {
      'access-modifier': 'Cadence 1.0 uses explicit access control with access(all), access(self), etc. instead of the legacy "pub" keyword.',
      'storage-api': 'The storage API has been modernized to use account.storage and account.capabilities for better security and clarity.',
      'interface-conformance': 'Interface conformance now uses ampersand (&) syntax instead of commas for better type composition.',
      'function-signature': 'Modern function signatures support view modifiers and entitlement-based access control.',
      'import-statement': 'Import statements should use current contract addresses for the target network.'
    };

    return explanations[pattern.type] || 'This pattern should be updated to use modern Cadence 1.0 syntax.';
  }

  /**
   * Create a default example for a pattern
   */
  private createDefaultExample(pattern: LegacyPattern): CodeExample {
    return {
      before: pattern.originalText,
      after: pattern.modernReplacement,
      description: pattern.suggestedFix
    };
  }

  /**
   * Initialize educational content database
   */
  private initializeEducationalContent(): void {
    this.educationalDatabase.set('access-modifier', {
      pattern: 'access-modifier',
      title: 'Access Control Modernization',
      description: 'Cadence 1.0 introduces explicit access control modifiers to replace the legacy "pub" keyword.',
      whyModernize: 'The new access control system provides better security, clearer intent, and more granular permissions.',
      benefits: [
        'Explicit access control reduces security vulnerabilities',
        'Better code readability and maintainability',
        'Support for entitlement-based permissions',
        'Compatibility with modern Flow tooling'
      ],
      learnMoreUrl: 'https://cadence-lang.org/docs/language/access-control'
    });

    this.educationalDatabase.set('storage-api', {
      pattern: 'storage-api',
      title: 'Storage API Modernization',
      description: 'The storage API has been redesigned to use capabilities for better security and composability.',
      whyModernize: 'Modern storage APIs provide better security guarantees and clearer separation of concerns.',
      benefits: [
        'Capability-based security model',
        'Clearer API surface with account.storage and account.capabilities',
        'Better composability with other contracts',
        'Reduced risk of storage collisions'
      ],
      learnMoreUrl: 'https://cadence-lang.org/docs/language/capabilities'
    });

    this.educationalDatabase.set('interface-conformance', {
      pattern: 'interface-conformance',
      title: 'Interface Conformance Syntax',
      description: 'Interface conformance now uses ampersand (&) syntax for better type composition.',
      whyModernize: 'The new syntax better represents the intersection of types and improves type safety.',
      benefits: [
        'Clearer type composition semantics',
        'Better support for complex type hierarchies',
        'Improved type checking and inference',
        'Consistency with other modern languages'
      ]
    });

    this.educationalDatabase.set('function-signature', {
      pattern: 'function-signature',
      title: 'Function Signature Modernization',
      description: 'Modern function signatures support view modifiers and entitlement-based access.',
      whyModernize: 'New function features improve performance and security through better optimization and access control.',
      benefits: [
        'View functions enable better optimization',
        'Entitlement-based access provides fine-grained security',
        'Clearer function intent and behavior',
        'Better tooling support and analysis'
      ]
    });
  }

  /**
   * Initialize code examples database
   */
  private initializeCodeExamples(): void {
    this.exampleDatabase.set('access-modifier', {
      before: 'pub fun getValue(): String {\n  return self.value\n}',
      after: 'access(all) fun getValue(): String {\n  return self.value\n}',
      description: 'Replace "pub" with explicit access control'
    });

    this.exampleDatabase.set('storage-api', {
      before: 'account.save(<-vault, to: /storage/vault)',
      after: 'account.storage.save(<-vault, to: /storage/vault)',
      description: 'Use the modern storage API'
    });

    this.exampleDatabase.set('interface-conformance', {
      before: 'resource Vault: Provider, Receiver, Balance',
      after: 'resource Vault: Provider & Receiver & Balance',
      description: 'Use ampersand syntax for interface conformance'
    });

    this.exampleDatabase.set('function-signature', {
      before: 'access(all) fun getBalance(): UFix64 {\n  return self.balance\n}',
      after: 'access(all) view fun getBalance(): UFix64 {\n  return self.balance\n}',
      description: 'Add view modifier for read-only functions'
    });
  }
}