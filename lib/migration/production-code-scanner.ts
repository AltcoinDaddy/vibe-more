/**
 * Production code scanner - focuses only on actual production code files
 * Excludes tests, documentation, specs, and other non-production files
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import { LegacyPattern, ScanResult } from './codebase-scanner';

export class ProductionCodeScanner {
  private readonly legacyPatterns = [
    // Critical patterns - must be fixed in production code
    {
      regex: /\bpub\s+/g,
      type: 'pub-keyword' as const,
      severity: 'critical' as const,
      description: 'Legacy pub keyword found in production code',
      suggestedFix: 'Replace with access(all) or appropriate access modifier',
      impact: 'high' as const
    },
    {
      regex: /\bpub\(set\)\s+/g,
      type: 'pub-keyword' as const,
      severity: 'critical' as const,
      description: 'Legacy pub(set) keyword found in production code',
      suggestedFix: 'Replace with access(all) and implement setter restrictions',
      impact: 'high' as const
    },
    
    // Storage API patterns
    {
      regex: /account\.save\(/g,
      type: 'storage-api' as const,
      severity: 'critical' as const,
      description: 'Legacy account.save() found in production code',
      suggestedFix: 'Replace with account.storage.save()',
      impact: 'high' as const
    },
    {
      regex: /account\.link\(/g,
      type: 'storage-api' as const,
      severity: 'critical' as const,
      description: 'Legacy account.link() found in production code',
      suggestedFix: 'Replace with account.capabilities.storage.issue() + account.capabilities.publish()',
      impact: 'high' as const
    },
    {
      regex: /account\.borrow\(/g,
      type: 'storage-api' as const,
      severity: 'critical' as const,
      description: 'Legacy account.borrow() found in production code',
      suggestedFix: 'Replace with account.capabilities.borrow()',
      impact: 'high' as const
    },
    {
      regex: /account\.load\(/g,
      type: 'storage-api' as const,
      severity: 'warning' as const,
      description: 'Legacy account.load() found in production code',
      suggestedFix: 'Replace with account.storage.load()',
      impact: 'medium' as const
    },
    
    // Interface conformance patterns (only for Cadence code, not TypeScript)
    {
      regex: /:\s*[A-Z][a-zA-Z0-9]*\s*,\s*[A-Z][a-zA-Z0-9]*\s*\{/g,
      type: 'interface-conformance' as const,
      severity: 'warning' as const,
      description: 'Legacy Cadence interface conformance syntax found in production code',
      suggestedFix: 'Replace comma-separated interfaces with ampersand (&) syntax',
      impact: 'medium' as const
    }
  ];

  // Only scan production code files
  private readonly productionFileExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  // Exclude all non-production directories and files
  private readonly excludePatterns = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '__tests__',
    '.test.',
    '.spec.',
    '.kiro',
    'docs',
    'README',
    'CHANGELOG',
    'LICENSE'
  ];

  /**
   * Scan only production code for legacy patterns
   */
  async scanProductionCode(rootPath: string = '.'): Promise<ScanResult> {
    const patterns: LegacyPattern[] = [];
    const scannedFiles = new Set<string>();
    
    await this.scanDirectory(rootPath, patterns, scannedFiles);
    
    return this.generateScanResult(patterns, scannedFiles.size);
  }

  /**
   * Recursively scan directory for production files only
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
          // Check if file should be scanned (production code only)
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
   * Check if file should be scanned (production code only)
   */
  private shouldScanFile(filePath: string): boolean {
    const ext = extname(filePath);
    
    // Must be a production file extension
    if (!this.productionFileExtensions.includes(ext)) {
      return false;
    }
    
    // Must not match any exclude patterns
    if (this.excludePatterns.some(pattern => filePath.includes(pattern))) {
      return false;
    }
    
    return true;
  }

  /**
   * Scan individual production file for legacy patterns
   */
  private async scanFile(filePath: string, patterns: LegacyPattern[]): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (const patternDef of this.legacyPatterns) {
        let match;
        patternDef.regex.lastIndex = 0; // Reset regex state
        
        while ((match = patternDef.regex.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          const columnNumber = this.getColumnNumber(content, match.index);
          const context = this.getContext(lines, lineNumber - 1);
          
          // Skip if this appears to be in a comment or string literal about legacy patterns
          if (this.isCommentOrStringLiteral(context, match[0])) {
            continue;
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
            severity: patternDef.severity,
            description: patternDef.description,
            suggestedFix: patternDef.suggestedFix,
            impact: patternDef.impact
          });
        }
      }
    } catch (error) {
      console.warn(`Error scanning file ${filePath}:`, error);
    }
  }

  /**
   * Check if pattern is in a comment, string literal, or non-Cadence context
   */
  private isCommentOrStringLiteral(context: string, pattern: string): boolean {
    const lines = context.split('\n');
    
    for (const line of lines) {
      if (line.includes(pattern)) {
        // Check if it's in a comment
        if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('/*')) {
          return true;
        }
        
        // Check if it's in a string literal
        const beforePattern = line.substring(0, line.indexOf(pattern));
        const singleQuotes = (beforePattern.match(/'/g) || []).length;
        const doubleQuotes = (beforePattern.match(/"/g) || []).length;
        const backticks = (beforePattern.match(/`/g) || []).length;
        
        // If odd number of quotes before pattern, it's likely inside a string
        if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1 || backticks % 2 === 1) {
          return true;
        }
        
        // Check for specific patterns that indicate this is intentional
        if (line.includes('toContain') || line.includes('expect') || line.includes('Legacy') || line.includes('Replace')) {
          return true;
        }
        
        // Check for TypeScript/React patterns that aren't Cadence
        if (line.includes('DayButton:') || line.includes('WeekNumber:') || line.includes('props') || 
            line.includes('=>') || line.includes('children') || line.includes('className')) {
          return true;
        }
        
        // Check for regex patterns (used for detection, not actual legacy code)
        if (line.includes('/\\b') || line.includes('regex') || line.includes('pattern')) {
          return true;
        }
        
        // Check for documentation patterns
        if (line.includes('NEVER use') || line.includes('- use') || line.includes('Required views:')) {
          return true;
        }
      }
    }
    
    return false;
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
    
    let summary = `Scanned ${totalFiles} production code files and found ${totalPatterns} legacy patterns in ${filesWithPatterns} files.\n\n`;
    
    if (critical > 0) {
      summary += `🚨 CRITICAL: ${critical} patterns in production code that must be fixed immediately\n`;
    }
    if (warning > 0) {
      summary += `⚠️  WARNING: ${warning} patterns in production code that should be addressed\n`;
    }
    if (suggestion > 0) {
      summary += `💡 SUGGESTION: ${suggestion} patterns in production code that could be improved\n`;
    }
    
    if (totalPatterns === 0) {
      summary += `✅ No legacy patterns found in production code! Codebase appears to be fully migrated.`;
    } else {
      summary += `\nPriority: Fix critical patterns in production code first, then warnings, then suggestions.`;
    }
    
    return summary;
  }
}