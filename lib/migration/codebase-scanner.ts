/**
 * Comprehensive codebase scanner for legacy Cadence patterns
 * Scans all TypeScript and template files for remaining legacy syntax
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

export interface LegacyPattern {
  type: 'pub-keyword' | 'storage-api' | 'interface-conformance' | 'function-signature' | 'import-statement' | 'other';
  pattern: string;
  location: {
    file: string;
    line: number;
    column: number;
    context: string;
  };
  severity: 'critical' | 'warning' | 'suggestion';
  description: string;
  suggestedFix: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ScanResult {
  totalFilesScanned: number;
  filesWithLegacyPatterns: number;
  totalPatternsFound: number;
  patternsByType: Record<string, number>;
  patternsBySeverity: Record<string, number>;
  patterns: LegacyPattern[];
  summary: string;
}

export class CodebaseScanner {
  private readonly legacyPatterns = [
    // Critical patterns - must be fixed
    {
      regex: /\bpub\s+/g,
      type: 'pub-keyword' as const,
      severity: 'critical' as const,
      description: 'Legacy pub keyword found',
      suggestedFix: 'Replace with access(all) or appropriate access modifier',
      impact: 'high' as const
    },
    {
      regex: /\bpub\(set\)\s+/g,
      type: 'pub-keyword' as const,
      severity: 'critical' as const,
      description: 'Legacy pub(set) keyword found',
      suggestedFix: 'Replace with access(all) and implement setter restrictions',
      impact: 'high' as const
    },
    
    // Storage API patterns
    {
      regex: /account\.save\(/g,
      type: 'storage-api' as const,
      severity: 'critical' as const,
      description: 'Legacy account.save() found',
      suggestedFix: 'Replace with account.storage.save()',
      impact: 'high' as const
    },
    {
      regex: /account\.link\(/g,
      type: 'storage-api' as const,
      severity: 'critical' as const,
      description: 'Legacy account.link() found',
      suggestedFix: 'Replace with account.capabilities.storage.issue() + account.capabilities.publish()',
      impact: 'high' as const
    },
    {
      regex: /account\.borrow\(/g,
      type: 'storage-api' as const,
      severity: 'critical' as const,
      description: 'Legacy account.borrow() found',
      suggestedFix: 'Replace with account.capabilities.borrow()',
      impact: 'high' as const
    },
    {
      regex: /account\.load\(/g,
      type: 'storage-api' as const,
      severity: 'warning' as const,
      description: 'Legacy account.load() found',
      suggestedFix: 'Replace with account.storage.load()',
      impact: 'medium' as const
    },
    
    // Interface conformance patterns
    {
      regex: /:\s*[A-Z][a-zA-Z0-9]*\s*,\s*[A-Z][a-zA-Z0-9]*/g,
      type: 'interface-conformance' as const,
      severity: 'warning' as const,
      description: 'Legacy interface conformance syntax found',
      suggestedFix: 'Replace comma-separated interfaces with ampersand (&) syntax',
      impact: 'medium' as const
    },
    
    // Function signature patterns
    {
      regex: /fun\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*:\s*[A-Z]/g,
      type: 'function-signature' as const,
      severity: 'suggestion' as const,
      description: 'Potential legacy function signature',
      suggestedFix: 'Verify function uses modern Cadence 1.0 syntax',
      impact: 'low' as const
    },
    
    // Import statement patterns (less critical but should be checked)
    {
      regex: /import\s+[A-Z][a-zA-Z0-9]*\s+from\s+0x[a-fA-F0-9]{16}/g,
      type: 'import-statement' as const,
      severity: 'suggestion' as const,
      description: 'Import statement with hardcoded address',
      suggestedFix: 'Verify import uses current Flow standard contract addresses',
      impact: 'low' as const
    }
  ];

  private readonly fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.md'];
  private readonly excludePatterns = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build'
  ];
  
  // Patterns that indicate intentional legacy code (tests, docs, examples)
  private readonly intentionalLegacyPatterns = [
    /expect.*\.not\.toContain.*pub/,
    /expect.*\.toContain.*pub/,
    /const\s+legacyCode\s*=/,
    /Legacy.*found/,
    /Replace.*with/,
    /\|\s*`pub\s*`\s*\|/,  // Markdown table entries
    /```.*pub.*```/s,       // Code blocks in markdown
    /\/\*\*.*Legacy.*\*\//,  // JSDoc comments about legacy
    /\/\/.*legacy/i,        // Comments mentioning legacy
  ];

  /**
   * Scan the entire codebase for legacy patterns
   */
  async scanCodebase(rootPath: string = '.'): Promise<ScanResult> {
    const patterns: LegacyPattern[] = [];
    const scannedFiles = new Set<string>();
    
    await this.scanDirectory(rootPath, patterns, scannedFiles);
    
    return this.generateScanResult(patterns, scannedFiles.size);
  }

  /**
   * Recursively scan directory for files
   */
  private async scanDirectory(
    dirPath: string, 
    patterns: LegacyPattern[], 
    scannedFiles: Set<string>
  ): Promise<void> {
    try {
      const entries = readdirSync(dirPath);
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip excluded directories
          if (this.excludePatterns.some(pattern => entry.includes(pattern))) {
            continue;
          }
          await this.scanDirectory(fullPath, patterns, scannedFiles);
        } else if (stat.isFile()) {
          // Check if file should be scanned
          if (this.shouldScanFile(fullPath)) {
            await this.scanFile(fullPath, patterns);
            scannedFiles.add(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${dirPath}:`, error);
    }
  }

  /**
   * Check if file should be scanned based on extension
   */
  private shouldScanFile(filePath: string): boolean {
    const ext = extname(filePath);
    return this.fileExtensions.includes(ext);
  }

  /**
   * Scan individual file for legacy patterns
   */
  private async scanFile(filePath: string, patterns: LegacyPattern[]): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Check if this is a test file or documentation
      const isTestFile = filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('.spec.');
      const isDocFile = filePath.endsWith('.md') || filePath.includes('/docs/');
      const isSpecFile = filePath.includes('.kiro/specs');
      
      for (const patternDef of this.legacyPatterns) {
        let match;
        patternDef.regex.lastIndex = 0; // Reset regex state
        
        while ((match = patternDef.regex.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          const columnNumber = this.getColumnNumber(content, match.index);
          const context = this.getContext(lines, lineNumber - 1);
          
          // Check if this is intentional legacy code (in tests, docs, etc.)
          const isIntentional = this.isIntentionalLegacyPattern(context, isTestFile, isDocFile, isSpecFile);
          
          // Adjust severity based on context
          let adjustedSeverity = patternDef.severity;
          let adjustedImpact = patternDef.impact;
          let adjustedDescription = patternDef.description;
          
          if (isIntentional) {
            adjustedSeverity = 'suggestion';
            adjustedImpact = 'low';
            adjustedDescription = `${patternDef.description} (in ${isTestFile ? 'test' : isDocFile ? 'documentation' : isSpecFile ? 'spec' : 'example'} context)`;
          }
          
          patterns.push({
            type: patternDef.type,
            pattern: match[0],
            location: {
              file: relative('.', filePath),
              line: lineNumber,
              column: columnNumber,
              context: context
            },
            severity: adjustedSeverity,
            description: adjustedDescription,
            suggestedFix: isIntentional ? 
              'Consider if this example is still needed or should be updated' : 
              patternDef.suggestedFix,
            impact: adjustedImpact
          });
        }
      }
    } catch (error) {
      console.warn(`Error scanning file ${filePath}:`, error);
    }
  }
  
  /**
   * Check if a legacy pattern is intentional (in tests, docs, examples)
   */
  private isIntentionalLegacyPattern(context: string, isTestFile: boolean, isDocFile: boolean, isSpecFile: boolean): boolean {
    // If it's in a test, doc, or spec file, it's likely intentional
    if (isTestFile || isDocFile || isSpecFile) {
      return true;
    }
    
    // Check for specific patterns that indicate intentional legacy code
    return this.intentionalLegacyPatterns.some(pattern => pattern.test(context));
  }

  /**
   * Get line number from character index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Get column number from character index
   */
  private getColumnNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n');
    return lines[lines.length - 1].length + 1;
  }

  /**
   * Get context around the matched pattern
   */
  private getContext(lines: string[], lineIndex: number): string {
    const start = Math.max(0, lineIndex - 1);
    const end = Math.min(lines.length, lineIndex + 2);
    return lines.slice(start, end).join('\n');
  }

  /**
   * Generate comprehensive scan result
   */
  private generateScanResult(patterns: LegacyPattern[], totalFiles: number): ScanResult {
    const filesWithPatterns = new Set(patterns.map(p => p.location.file)).size;
    
    const patternsByType = patterns.reduce((acc, pattern) => {
      acc[pattern.type] = (acc[pattern.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const patternsBySeverity = patterns.reduce((acc, pattern) => {
      acc[pattern.severity] = (acc[pattern.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort patterns by severity and impact
    const sortedPatterns = patterns.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, suggestion: 1 };
      const impactOrder = { high: 3, medium: 2, low: 1 };
      
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
    
    const summary = this.generateSummary(totalFiles, filesWithPatterns, patterns.length, patternsBySeverity);
    
    return {
      totalFilesScanned: totalFiles,
      filesWithLegacyPatterns: filesWithPatterns,
      totalPatternsFound: patterns.length,
      patternsByType,
      patternsBySeverity,
      patterns: sortedPatterns,
      summary
    };
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    totalFiles: number, 
    filesWithPatterns: number, 
    totalPatterns: number,
    patternsBySeverity: Record<string, number>
  ): string {
    const critical = patternsBySeverity.critical || 0;
    const warning = patternsBySeverity.warning || 0;
    const suggestion = patternsBySeverity.suggestion || 0;
    
    let summary = `Scanned ${totalFiles} files and found ${totalPatterns} legacy patterns in ${filesWithPatterns} files.\n\n`;
    
    if (critical > 0) {
      summary += `🚨 CRITICAL: ${critical} patterns that must be fixed immediately\n`;
    }
    if (warning > 0) {
      summary += `⚠️  WARNING: ${warning} patterns that should be addressed\n`;
    }
    if (suggestion > 0) {
      summary += `💡 SUGGESTION: ${suggestion} patterns that could be improved\n`;
    }
    
    if (totalPatterns === 0) {
      summary += `✅ No legacy patterns found! Codebase appears to be fully migrated.`;
    } else {
      summary += `\nPriority: Fix critical patterns first, then warnings, then suggestions.`;
    }
    
    return summary;
  }
}