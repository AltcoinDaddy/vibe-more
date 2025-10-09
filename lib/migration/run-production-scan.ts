/**
 * CLI utility to run production code scan for legacy patterns
 * Focuses only on actual production code, excluding tests and documentation
 * Usage: npx tsx lib/migration/run-production-scan.ts
 */

import { ProductionCodeScanner } from './production-code-scanner';
import { ScanReporter } from './scan-reporter';

async function runProductionScan() {
  console.log('🔍 Starting production code scan for legacy Cadence patterns...\n');
  
  const scanner = new ProductionCodeScanner();
  const reporter = new ScanReporter();
  
  try {
    // Run the production code scan
    const scanResult = await scanner.scanProductionCode('.');
    
    // Display summary to console
    console.log('📊 Production Code Scan Results:');
    console.log('=================================');
    console.log(scanResult.summary);
    console.log('');
    
    if (scanResult.totalPatternsFound > 0) {
      // Generate detailed reports only if issues found
      console.log('📝 Generating detailed reports...');
      
      // Markdown report (default)
      const markdownPath = reporter.saveReport(scanResult, {
        outputPath: 'production-legacy-patterns.md',
        format: 'markdown',
        includeContext: true,
        groupByFile: true
      });
      console.log(`✅ Production code report saved: ${markdownPath}`);
      
      // JSON report for programmatic access
      const jsonPath = reporter.saveReport(scanResult, {
        outputPath: 'production-legacy-patterns.json',
        format: 'json'
      });
      console.log(`✅ JSON report saved: ${jsonPath}`);
      
      console.log('\n🎯 Production Code Priority Summary:');
      console.log('====================================');
      
      if (scanResult.patternsBySeverity.critical > 0) {
        console.log(`🚨 CRITICAL: ${scanResult.patternsBySeverity.critical} patterns in production code require immediate attention`);
      }
      if (scanResult.patternsBySeverity.warning > 0) {
        console.log(`⚠️  WARNING: ${scanResult.patternsBySeverity.warning} patterns in production code should be addressed soon`);
      }
      if (scanResult.patternsBySeverity.suggestion > 0) {
        console.log(`💡 SUGGESTION: ${scanResult.patternsBySeverity.suggestion} patterns in production code could be improved`);
      }
      
      console.log(`\n📋 Next steps for production code:`);
      console.log('1. Review the detailed reports generated above');
      console.log('2. Fix critical patterns in production code immediately');
      console.log('3. Address warnings in production code when possible');
      console.log('4. Consider suggestions for future improvements');
      console.log('5. Implement prevention mechanisms to avoid regression');
      
      // Exit with error code if critical issues found
      process.exit(scanResult.patternsBySeverity.critical > 0 ? 1 : 0);
    } else {
      console.log('🎉 No legacy patterns found in production code! Your production codebase is fully migrated.');
      console.log('\n📋 Recommended next steps:');
      console.log('1. Implement prevention mechanisms to ensure no legacy patterns are reintroduced');
      console.log('2. Add pre-commit hooks to catch legacy patterns');
      console.log('3. Create linting rules for continuous validation');
      console.log('4. Add automated tests that fail if legacy syntax is detected');
      console.log('5. Consider cleaning up test files and documentation if desired');
      
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error during production code scan:', error);
    process.exit(1);
  }
}

// Run the scan if this file is executed directly
if (require.main === module) {
  runProductionScan();
}

export { runProductionScan };