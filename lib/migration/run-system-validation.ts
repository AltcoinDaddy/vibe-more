#!/usr/bin/env node

import { ComprehensiveSystemValidator } from './comprehensive-system-validator'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function runSystemValidation() {
  console.log('🚀 Starting comprehensive system validation...')
  
  const validator = new ComprehensiveSystemValidator()
  
  try {
    const result = await validator.validateSystem()
    
    // Generate and save report
    const report = validator.generateReport(result)
    const reportPath = join(process.cwd(), 'system-validation-report.md')
    writeFileSync(reportPath, report)
    
    console.log('\n📊 Validation Results:')
    console.log(`Overall Status: ${result.summary.overallStatus}`)
    console.log(`Critical Issues: ${result.summary.criticalIssues}`)
    console.log(`Warnings: ${result.summary.warnings}`)
    console.log(`Suggestions: ${result.summary.suggestions}`)
    
    if (result.summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      result.summary.recommendations.forEach(rec => console.log(`  - ${rec}`))
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`)
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1)
    
  } catch (error) {
    console.error('❌ System validation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runSystemValidation()
}

export { runSystemValidation }