/**
 * Comprehensive Legacy Pattern Detector for Cadence Syntax Migration
 * Detects all variations of legacy Cadence syntax patterns with precise location tracking
 */

export interface CodeLocation {
  line: number;
  column: number;
  startIndex: number;
  endIndex: number;
}

export interface LegacyPattern {
  type: 'access-modifier' | 'storage-api' | 'interface-conformance' | 'function-signature' | 'import-statement' | 'event-declaration';
  location: CodeLocation;
  severity: 'critical' | 'warning' | 'suggestion';
  description: string;
  suggestedFix: string;
  originalText: string;
  modernReplacement: string;
  category: string;
}

export interface PatternCategory {
  name: string;
  patterns: LegacyPattern[];
  priority: number;
  description: string;
}

export interface PrioritizedFix {
  pattern: LegacyPattern;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'complex';
  order: number;
}

export interface FixPlan {
  patterns: LegacyPattern[];
  prioritizedFixes: PrioritizedFix[];
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PatternDetectionRule {
  name: string;
  pattern: RegExp;
  type: LegacyPattern['type'];
  severity: LegacyPattern['severity'];
  description: string;
  suggestedFix: string;
  modernReplacement: (match: string) => string;
  category: string;
}

export class LegacyPatternDetector {
  private detectionRules: PatternDetectionRule[] = [];

  constructor() {
    this.initializeDetectionRules();
  }

  /**
   * Initialize all detection rules for legacy patterns
   */
  private initializeDetectionRules(): void {
    // Access Modifier Patterns
    this.detectionRules.push(
      {
        name: 'pub-function',
        pattern: /\bpub\s+fun\s+/g,
        type: 'access-modifier',
        severity: 'critical',
        description: 'Legacy "pub fun" declaration found',
        suggestedFix: 'Replace "pub fun" with "access(all) fun"',
        modernReplacement: (match: string) => match.replace(/\bpub\s+fun/, 'access(all) fun'),
        category: 'Function Declarations'
      },
      {
        name: 'pub-variable',
        pattern: /\bpub\s+(var|let)\s+/g,
        type: 'access-modifier',
        severity: 'critical',
        description: 'Legacy "pub var/let" declaration found',
        suggestedFix: 'Replace "pub var/let" with "access(all) var/let"',
        modernReplacement: (match: string) => match.replace(/\bpub\s+/, 'access(all) '),
        category: 'Variable Declarations'
      },
      {
        name: 'pub-set',
        pattern: /\bpub\(set\)\s+/g,
        type: 'access-modifier',
        severity: 'critical',
        description: 'Legacy "pub(set)" modifier found',
        suggestedFix: 'Replace "pub(set)" with appropriate access control pattern',
        modernReplacement: (match: string) => match.replace(/\bpub\(set\)\s+/, 'access(all) '),
        category: 'Access Control'
      },
      {
        name: 'pub-struct-resource',
        pattern: /\bpub\s+(struct|resource|contract)\s+/g,
        type: 'access-modifier',
        severity: 'critical',
        description: 'Legacy "pub struct/resource/contract" declaration found',
        suggestedFix: 'Replace "pub" with "access(all)"',
        modernReplacement: (match: string) => match.replace(/\bpub\s+/, 'access(all) '),
        category: 'Type Declarations'
      }
    );

    // Storage API Patterns
    this.detectionRules.push(
      {
        name: 'account-save',
        pattern: /\baccount\.save\s*\(/g,
        type: 'storage-api',
        severity: 'critical',
        description: 'Legacy account.save() API found',
        suggestedFix: 'Replace with account.storage.save()',
        modernReplacement: (match: string) => match.replace(/account\.save\s*\(/, 'account.storage.save('),
        category: 'Storage API'
      },
      {
        name: 'account-load',
        pattern: /\baccount\.load\s*\(/g,
        type: 'storage-api',
        severity: 'critical',
        description: 'Legacy account.load() API found',
        suggestedFix: 'Replace with account.storage.load()',
        modernReplacement: (match: string) => match.replace(/account\.load\s*\(/, 'account.storage.load('),
        category: 'Storage API'
      },
      {
        name: 'account-borrow',
        pattern: /\baccount\.borrow\s*\(/g,
        type: 'storage-api',
        severity: 'critical',
        description: 'Legacy account.borrow() API found',
        suggestedFix: 'Replace with account.capabilities.borrow()',
        modernReplacement: (match: string) => match.replace(/account\.borrow\s*\(/, 'account.capabilities.borrow('),
        category: 'Storage API'
      },
      {
        name: 'account-link',
        pattern: /\baccount\.link\s*\(/g,
        type: 'storage-api',
        severity: 'critical',
        description: 'Legacy account.link() API found',
        suggestedFix: 'Replace with modern capability-based pattern',
        modernReplacement: (match: string) => 'account.capabilities.storage.issue() // Manual review required',
        category: 'Storage API'
      }
    );

    // Interface Conformance Patterns - detect comma-separated interfaces
    this.detectionRules.push(
      {
        name: 'comma-separated-interfaces',
        pattern: /:\s*[A-Z]\w*(?:\s*,\s*[A-Z]\w*)+/g,
        type: 'interface-conformance',
        severity: 'warning',
        description: 'Comma-separated interface conformance found',
        suggestedFix: 'Replace commas with ampersands (&)',
        modernReplacement: (match: string) => match.replace(/,/g, ' &'),
        category: 'Interface Conformance'
      }
    );

    // Function Signature Patterns - only detect truly problematic patterns
    // Removed overly aggressive view function detection as it was flagging valid modern code

    // Import Statement Patterns - only flag truly problematic patterns
    // Removed overly broad import detection as it was flagging valid imports
  }

  /**
   * Detect all legacy patterns in the provided code
   */
  detectAllLegacyPatterns(code: string): LegacyPattern[] {
    const patterns: LegacyPattern[] = [];
    const lines = code.split('\n');

    for (const rule of this.detectionRules) {
      let match;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      
      while ((match = regex.exec(code)) !== null) {
        const location = this.calculateLocation(code, match.index, match[0].length, lines);
        
        patterns.push({
          type: rule.type,
          location,
          severity: rule.severity,
          description: rule.description,
          suggestedFix: rule.suggestedFix,
          originalText: match[0],
          modernReplacement: rule.modernReplacement(match[0]),
          category: rule.category
        });
      }
    }

    return patterns.sort((a, b) => a.location.line - b.location.line);
  }

  /**
   * Calculate precise location information for a match
   */
  private calculateLocation(code: string, startIndex: number, length: number, lines: string[]): CodeLocation {
    let line = 1;
    let column = 1;
    let currentIndex = 0;

    for (let i = 0; i < startIndex; i++) {
      if (code[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
      currentIndex++;
    }

    return {
      line,
      column,
      startIndex,
      endIndex: startIndex + length
    };
  }

  /**
   * Categorize patterns by type and priority
   */
  categorizePatterns(patterns: LegacyPattern[]): PatternCategory[] {
    const categories = new Map<string, LegacyPattern[]>();

    patterns.forEach(pattern => {
      if (!categories.has(pattern.category)) {
        categories.set(pattern.category, []);
      }
      categories.get(pattern.category)!.push(pattern);
    });

    return Array.from(categories.entries()).map(([name, patterns]) => ({
      name,
      patterns,
      priority: this.calculateCategoryPriority(patterns),
      description: this.getCategoryDescription(name)
    })).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate priority for a category based on severity and count
   */
  private calculateCategoryPriority(patterns: LegacyPattern[]): number {
    const severityWeights = { critical: 10, warning: 5, suggestion: 1 };
    return patterns.reduce((total, pattern) => total + severityWeights[pattern.severity], 0);
  }

  /**
   * Get description for a category
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      'Access Control': 'Legacy access modifier patterns that need modernization',
      'Storage API': 'Outdated storage and capability API usage',
      'Interface Conformance': 'Legacy interface inheritance syntax',
      'Function Declarations': 'Function signature patterns requiring updates',
      'Variable Declarations': 'Variable declaration syntax modernization',
      'Function Optimization': 'Opportunities for modern function modifiers',
      'Import Statements': 'Import statements that may need verification'
    };
    return descriptions[category] || 'Legacy patterns requiring attention';
  }

  /**
   * Prioritize fixes by impact and effort
   */
  prioritizeFixesByImpact(patterns: LegacyPattern[]): PrioritizedFix[] {
    return patterns.map((pattern, index) => ({
      pattern,
      impact: this.calculateImpact(pattern),
      effort: this.calculateEffort(pattern),
      order: index + 1
    })).sort((a, b) => {
      // Sort by impact (high first), then by effort (easy first)
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const effortOrder = { easy: 3, moderate: 2, complex: 1 };
      
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;
      
      return effortOrder[b.effort] - effortOrder[a.effort];
    });
  }

  /**
   * Calculate impact level for a pattern
   */
  private calculateImpact(pattern: LegacyPattern): 'high' | 'medium' | 'low' {
    if (pattern.severity === 'critical') return 'high';
    if (pattern.severity === 'warning') return 'medium';
    return 'low';
  }

  /**
   * Calculate effort level for a pattern
   */
  private calculateEffort(pattern: LegacyPattern): 'easy' | 'moderate' | 'complex' {
    const complexPatterns = ['account-link', 'comma-separated-interfaces'];
    const moderatePatterns = ['pub-set', 'old-view-function'];
    
    const ruleName = this.detectionRules.find(rule => 
      rule.type === pattern.type && rule.description === pattern.description
    )?.name;

    if (complexPatterns.includes(ruleName || '')) return 'complex';
    if (moderatePatterns.includes(ruleName || '')) return 'moderate';
    return 'easy';
  }

  /**
   * Generate a comprehensive fix plan
   */
  generateFixPlan(code: string): FixPlan {
    const patterns = this.detectAllLegacyPatterns(code);
    const prioritizedFixes = this.prioritizeFixesByImpact(patterns);
    
    const estimatedTime = this.calculateEstimatedTime(prioritizedFixes);
    const riskLevel = this.calculateRiskLevel(patterns);

    return {
      patterns,
      prioritizedFixes,
      estimatedTime,
      riskLevel
    };
  }

  /**
   * Calculate estimated time for fixes in minutes
   */
  private calculateEstimatedTime(fixes: PrioritizedFix[]): number {
    const timeEstimates = { easy: 2, moderate: 5, complex: 15 };
    return fixes.reduce((total, fix) => total + timeEstimates[fix.effort], 0);
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(patterns: LegacyPattern[]): 'low' | 'medium' | 'high' {
    const criticalCount = patterns.filter(p => p.severity === 'critical').length;
    const complexPatterns = patterns.filter(p => 
      p.type === 'storage-api' || p.type === 'interface-conformance'
    ).length;

    if (criticalCount > 10 || complexPatterns > 5) return 'high';
    if (criticalCount > 5 || complexPatterns > 2) return 'medium';
    return 'low';
  }
}