/**
 * CLI utility to run comprehensive codebase scan for legacy patterns
 * Usage: npx tsx lib/migration/run-codebase-scan.ts
 */

import { CodebaseScanner } from './codebase-scanner';
import { ScanReporter } from './scan-reporter';

async function runCodebaseScan() {
  console.log('🔍 Starting comprehensive codebase scan for legacy Cadence patterns...\n');
  
  const scanner = new CodebaseScanner();
  const reporter = new ScanReporter();
  
  try {
    // Run the scan
    const scanResult = await scanner.scanCodebase('.');
    
    // Display summary to console
    console.log('📊 Scan Results:');
    console.log('================');
    console.log(scanResult.summary);
    console.log('');
    
    // Generate detailed reports
    console.log('📝 Generating detailed reports...');
    
    // Markdown report (default)
    const markdownPath = reporter.saveReport(scanResult, {
      outputPath: 'legacy-patterns-report.md',
      format: 'markdown',
      includeContext: true,
      groupByFile: false
    });
    console.log(`✅ Markdown report saved: ${markdownPath}`);
    
    // JSON report for programmatic access
    const jsonPath = reporter.saveReport(scanResult, {
      outputPath: 'legacy-patterns-report.json',
      format: 'json'
    });
    console.log(`✅ JSON report saved: ${jsonPath}`);
    
    // CSV report for spreadsheet analysis
    const csvPath = reporter.saveReport(scanResult, {
      outputPath: 'legacy-patterns-report.csv',
      format: 'csv'
    });
    console.log(`✅ CSV report saved: ${csvPath}`);
    
    // File-grouped report for easier fixing
    const fileGroupedPath = reporter.saveReport(scanResult, {
      outputPath: 'legacy-patterns-by-file.md',
      format: 'markdown',
      includeContext: true,
      groupByFile: true
    });
    console.log(`✅ File-grouped report saved: ${fileGroupedPath}`);
    
    console.log('\n🎯 Priority Summary:');
    console.log('===================');
    
    if (scanResult.patternsBySeverity.critical > 0) {
      console.log(`🚨 CRITICAL: ${scanResult.patternsBySeverity.critical} patterns require immediate attention`);
    }
    if (scanResult.patternsBySeverity.warning > 0) {
      console.log(`⚠️  WARNING: ${scanResult.patternsBySeverity.warning} patterns should be addressed soon`);
    }
    if (scanResult.patternsBySeverity.suggestion > 0) {
      console.log(`💡 SUGGESTION: ${scanResult.patternsBySeverity.suggestion} patterns could be improved`);
    }
    
    if (scanResult.totalPatternsFound === 0) {
      console.log('🎉 No legacy patterns found! Your codebase is fully migrated.');
    } else {
      console.log(`\n📋 Next steps:`);
      console.log('1. Review the detailed reports generated above');
      console.log('2. Fix critical patterns first');
      console.log('3. Address warnings when possible');
      console.log('4. Consider suggestions for future improvements');
      console.log('5. Implement prevention mechanisms to avoid regression');
    }
    
    // Exit with appropriate code
    process.exit(scanResult.patternsBySeverity.critical > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Error during codebase scan:', error);
    process.exit(1);
  }
}

// Run the scan if this file is executed directly
if (require.main === module) {
  runCodebaseScan();
}

export { runCodebaseScan };