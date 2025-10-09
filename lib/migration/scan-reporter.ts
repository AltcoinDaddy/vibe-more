/**
 * Report generator for codebase scan results
 * Creates detailed reports of legacy patterns found in the codebase
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { ScanResult, LegacyPattern } from './codebase-scanner';

export interface ReportOptions {
  outputPath?: string;
  format?: 'markdown' | 'json' | 'csv';
  includeContext?: boolean;
  groupByFile?: boolean;
}

export class ScanReporter {
  /**
   * Generate comprehensive scan report
   */
  generateReport(scanResult: ScanResult, options: ReportOptions = {}): string {
    const {
      format = 'markdown',
      includeContext = true,
      groupByFile = false
    } = options;

    switch (format) {
      case 'json':
        return this.generateJsonReport(scanResult);
      case 'csv':
        return this.generateCsvReport(scanResult);
      case 'markdown':
      default:
        return this.generateMarkdownReport(scanResult, includeContext, groupByFile);
    }
  }

  /**
   * Save report to file
   */
  saveReport(
    scanResult: ScanResult, 
    options: ReportOptions = {}
  ): string {
    const { outputPath = 'legacy-patterns-report.md', format = 'markdown' } = options;
    
    const report = this.generateReport(scanResult, options);
    writeFileSync(outputPath, report, 'utf-8');
    
    return outputPath;
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(
    scanResult: ScanResult, 
    includeContext: boolean,
    groupByFile: boolean
  ): string {
    const { 
      totalFilesScanned, 
      filesWithLegacyPatterns, 
      totalPatternsFound,
      patternsByType,
      patternsBySeverity,
      patterns,
      summary 
    } = scanResult;

    let report = `# Legacy Cadence Patterns Scan Report

Generated: ${new Date().toISOString()}

## Executive Summary

${summary}

## Scan Statistics

- **Total Files Scanned**: ${totalFilesScanned}
- **Files with Legacy Patterns**: ${filesWithLegacyPatterns}
- **Total Patterns Found**: ${totalPatternsFound}

### Patterns by Type

| Pattern Type | Count |
|--------------|-------|
`;

    Object.entries(patternsByType).forEach(([type, count]) => {
      report += `| ${type} | ${count} |\n`;
    });

    report += `
### Patterns by Severity

| Severity | Count | Priority |
|----------|-------|----------|
`;

    Object.entries(patternsBySeverity).forEach(([severity, count]) => {
      const priority = severity === 'critical' ? '🚨 HIGH' : 
                     severity === 'warning' ? '⚠️ MEDIUM' : '💡 LOW';
      report += `| ${severity} | ${count} | ${priority} |\n`;
    });

    if (totalPatternsFound > 0) {
      if (groupByFile) {
        report += this.generateFileGroupedPatterns(patterns, includeContext);
      } else {
        report += this.generateSeverityGroupedPatterns(patterns, includeContext);
      }
    }

    report += this.generateRecommendations(scanResult);

    return report;
  }

  /**
   * Generate patterns grouped by file
   */
  private generateFileGroupedPatterns(patterns: LegacyPattern[], includeContext: boolean): string {
    let report = `\n## Detailed Findings (Grouped by File)\n\n`;

    const patternsByFile = patterns.reduce((acc, pattern) => {
      const file = pattern.location.file;
      if (!acc[file]) acc[file] = [];
      acc[file].push(pattern);
      return acc;
    }, {} as Record<string, LegacyPattern[]>);

    Object.entries(patternsByFile).forEach(([file, filePatterns]) => {
      report += `### ${file}\n\n`;
      report += `Found ${filePatterns.length} pattern(s) in this file:\n\n`;

      filePatterns.forEach((pattern, index) => {
        const severityIcon = pattern.severity === 'critical' ? '🚨' : 
                           pattern.severity === 'warning' ? '⚠️' : '💡';
        
        report += `#### ${index + 1}. ${severityIcon} ${pattern.description}\n\n`;
        report += `- **Pattern**: \`${pattern.pattern}\`\n`;
        report += `- **Location**: Line ${pattern.location.line}, Column ${pattern.location.column}\n`;
        report += `- **Severity**: ${pattern.severity}\n`;
        report += `- **Impact**: ${pattern.impact}\n`;
        report += `- **Suggested Fix**: ${pattern.suggestedFix}\n\n`;

        if (includeContext) {
          report += `**Context:**\n\`\`\`cadence\n${pattern.location.context}\n\`\`\`\n\n`;
        }
      });
    });

    return report;
  }

  /**
   * Generate patterns grouped by severity
   */
  private generateSeverityGroupedPatterns(patterns: LegacyPattern[], includeContext: boolean): string {
    let report = `\n## Detailed Findings (Grouped by Severity)\n\n`;

    const patternsBySeverity = patterns.reduce((acc, pattern) => {
      if (!acc[pattern.severity]) acc[pattern.severity] = [];
      acc[pattern.severity].push(pattern);
      return acc;
    }, {} as Record<string, LegacyPattern[]>);

    // Process in order of severity
    const severityOrder = ['critical', 'warning', 'suggestion'];
    
    severityOrder.forEach(severity => {
      const severityPatterns = patternsBySeverity[severity];
      if (!severityPatterns || severityPatterns.length === 0) return;

      const severityIcon = severity === 'critical' ? '🚨' : 
                          severity === 'warning' ? '⚠️' : '💡';
      
      report += `### ${severityIcon} ${severity.toUpperCase()} (${severityPatterns.length} patterns)\n\n`;

      severityPatterns.forEach((pattern, index) => {
        report += `#### ${index + 1}. ${pattern.description}\n\n`;
        report += `- **File**: ${pattern.location.file}\n`;
        report += `- **Location**: Line ${pattern.location.line}, Column ${pattern.location.column}\n`;
        report += `- **Pattern**: \`${pattern.pattern}\`\n`;
        report += `- **Type**: ${pattern.type}\n`;
        report += `- **Impact**: ${pattern.impact}\n`;
        report += `- **Suggested Fix**: ${pattern.suggestedFix}\n\n`;

        if (includeContext) {
          report += `**Context:**\n\`\`\`cadence\n${pattern.location.context}\n\`\`\`\n\n`;
        }
      });
    });

    return report;
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendations(scanResult: ScanResult): string {
    const { patterns, patternsBySeverity } = scanResult;
    
    let report = `\n## Recommendations\n\n`;

    const critical = patternsBySeverity.critical || 0;
    const warning = patternsBySeverity.warning || 0;
    const suggestion = patternsBySeverity.suggestion || 0;

    if (critical > 0) {
      report += `### 🚨 Immediate Action Required\n\n`;
      report += `${critical} critical patterns must be fixed before deployment:\n\n`;
      
      const criticalPatterns = patterns.filter(p => p.severity === 'critical');
      const criticalByType = criticalPatterns.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(criticalByType).forEach(([type, count]) => {
        report += `- **${type}**: ${count} instances\n`;
      });
      report += `\n`;
    }

    if (warning > 0) {
      report += `### ⚠️ High Priority\n\n`;
      report += `${warning} warning patterns should be addressed soon:\n\n`;
      
      const warningPatterns = patterns.filter(p => p.severity === 'warning');
      const warningByType = warningPatterns.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(warningByType).forEach(([type, count]) => {
        report += `- **${type}**: ${count} instances\n`;
      });
      report += `\n`;
    }

    if (suggestion > 0) {
      report += `### 💡 Improvement Opportunities\n\n`;
      report += `${suggestion} suggestion patterns could be improved when convenient:\n\n`;
      
      const suggestionPatterns = patterns.filter(p => p.severity === 'suggestion');
      const suggestionByType = suggestionPatterns.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(suggestionByType).forEach(([type, count]) => {
        report += `- **${type}**: ${count} instances\n`;
      });
      report += `\n`;
    }

    report += `### Next Steps\n\n`;
    
    if (patterns.length === 0) {
      report += `✅ **Congratulations!** Your codebase appears to be fully migrated to Cadence 1.0.\n\n`;
      report += `Consider implementing prevention mechanisms to ensure no legacy patterns are reintroduced:\n`;
      report += `- Add pre-commit hooks\n`;
      report += `- Create linting rules\n`;
      report += `- Add automated tests\n`;
      report += `- Implement CI/CD validation\n`;
    } else {
      report += `1. **Fix Critical Issues First**: Address all critical patterns immediately\n`;
      report += `2. **Plan Warning Fixes**: Schedule time to fix warning patterns\n`;
      report += `3. **Consider Suggestions**: Evaluate suggestion patterns for future improvements\n`;
      report += `4. **Implement Prevention**: Add mechanisms to prevent legacy patterns from being reintroduced\n`;
      report += `5. **Re-scan Regularly**: Run this scanner periodically to catch any new legacy patterns\n`;
    }

    return report;
  }

  /**
   * Generate JSON report
   */
  private generateJsonReport(scanResult: ScanResult): string {
    return JSON.stringify({
      ...scanResult,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * Generate CSV report
   */
  private generateCsvReport(scanResult: ScanResult): string {
    const headers = [
      'File',
      'Line',
      'Column', 
      'Pattern',
      'Type',
      'Severity',
      'Impact',
      'Description',
      'Suggested Fix'
    ];

    let csv = headers.join(',') + '\n';

    scanResult.patterns.forEach(pattern => {
      const row = [
        `"${pattern.location.file}"`,
        pattern.location.line.toString(),
        pattern.location.column.toString(),
        `"${pattern.pattern.replace(/"/g, '""')}"`,
        pattern.type,
        pattern.severity,
        pattern.impact,
        `"${pattern.description.replace(/"/g, '""')}"`,
        `"${pattern.suggestedFix.replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }
}