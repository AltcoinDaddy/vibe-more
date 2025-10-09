/**
 * Example usage of the MetricsCollector system
 * 
 * This example demonstrates how to use the MetricsCollector to track
 * AI generation quality metrics and generate reports.
 */

import { MetricsCollector } from './metrics-collector'
import { 
  GenerationRequest, 
  QualityAssuredResult,
  ValidationResult,
  GenerationMetrics
} from './types'

// Initialize the metrics collector
const metricsCollector = new MetricsCollector({
  enableRealTimeTracking: true,
  maxHistorySize: 10000,
  aggregationInterval: 15, // 15 minutes
  enableTrendAnalysis: true,
  enablePerformanceTracking: true
})

/**
 * Example: Recording a successful generation session
 */
export function recordSuccessfulGeneration() {
  const request: GenerationRequest = {
    prompt: 'Create an NFT contract with minting and metadata functionality',
    context: 'User wants a complete NFT collection contract',
    temperature: 0.7,
    maxRetries: 3,
    strictMode: true
  }

  const result: QualityAssuredResult = {
    code: `
access(all) contract ExampleNFT {
    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) let metadata: {String: String}
        
        init(id: UInt64, metadata: {String: String}) {
            self.id = id
            self.metadata = metadata
        }
    }
    
    access(all) fun mintNFT(metadata: {String: String}): @NFT {
        return <- create NFT(id: 1, metadata: metadata)
    }
}`,
    qualityScore: 92,
    validationResults: [{
      type: 'syntax',
      passed: true,
      issues: [],
      score: 95,
      message: 'All syntax validation passed'
    }, {
      type: 'completeness',
      passed: true,
      issues: [],
      score: 90,
      message: 'Contract is functionally complete'
    }],
    correctionHistory: [],
    fallbackUsed: false,
    generationMetrics: {
      attemptCount: 1,
      totalGenerationTime: 2500,
      validationTime: 300,
      correctionTime: 0,
      finalQualityScore: 92,
      issuesDetected: 0,
      issuesFixed: 0,
      startTime: new Date(),
      endTime: new Date()
    }
  }

  const sessionId = metricsCollector.recordGenerationSession(request, result)
  console.log(`Recorded successful generation session: ${sessionId}`)
  
  return sessionId
}

/**
 * Example: Recording a generation that required corrections
 */
export function recordCorrectedGeneration() {
  const request: GenerationRequest = {
    prompt: 'Create a fungible token contract with transfer functionality',
    context: 'User needs a basic token contract',
    maxRetries: 2
  }

  const result: QualityAssuredResult = {
    code: `
access(all) contract ExampleToken {
    access(all) var totalSupply: UFix64
    
    init() {
        self.totalSupply = 1000.0
    }
    
    access(all) fun transfer(amount: UFix64, to: Address) {
        // Transfer logic here
    }
}`,
    qualityScore: 78,
    validationResults: [{
      type: 'syntax',
      passed: true,
      issues: [{
        severity: 'warning',
        type: 'incomplete-logic',
        location: { line: 8, column: 5 },
        message: 'Transfer function lacks implementation details',
        suggestedFix: 'Add balance checking and actual transfer logic',
        autoFixable: false
      }],
      score: 78
    }],
    correctionHistory: [{
      attemptNumber: 1,
      timestamp: new Date(),
      corrections: [{
        type: 'logic-enhancement',
        location: { line: 8, column: 5 },
        originalValue: '// Transfer logic here',
        correctedValue: 'require(amount > 0.0, message: "Amount must be positive")',
        reasoning: 'Added basic validation for transfer amount',
        confidence: 0.8
      }],
      success: true,
      qualityImprovement: 15
    }],
    fallbackUsed: false,
    generationMetrics: {
      attemptCount: 2,
      totalGenerationTime: 4200,
      validationTime: 450,
      correctionTime: 800,
      finalQualityScore: 78,
      issuesDetected: 1,
      issuesFixed: 1,
      startTime: new Date(),
      endTime: new Date()
    }
  }

  const sessionId = metricsCollector.recordGenerationSession(request, result)
  console.log(`Recorded corrected generation session: ${sessionId}`)
  
  return sessionId
}

/**
 * Example: Recording a generation that used fallback
 */
export function recordFallbackGeneration() {
  const request: GenerationRequest = {
    prompt: 'Create a complex DAO governance contract with voting mechanisms',
    context: 'Advanced governance features required',
    maxRetries: 3
  }

  const result: QualityAssuredResult = {
    code: `
access(all) contract SimpleDAO {
    access(all) var proposalCount: UInt64
    
    init() {
        self.proposalCount = 0
    }
    
    access(all) fun createProposal(description: String) {
        self.proposalCount = self.proposalCount + 1
    }
}`,
    qualityScore: 65,
    validationResults: [{
      type: 'completeness',
      passed: false,
      issues: [{
        severity: 'critical',
        type: 'missing-functionality',
        location: { line: 1, column: 1 },
        message: 'DAO contract lacks voting mechanisms',
        suggestedFix: 'Add voting functions and proposal management',
        autoFixable: false
      }],
      score: 65
    }],
    correctionHistory: [{
      attemptNumber: 1,
      timestamp: new Date(),
      corrections: [],
      success: false,
      qualityImprovement: 0
    }, {
      attemptNumber: 2,
      timestamp: new Date(),
      corrections: [],
      success: false,
      qualityImprovement: 0
    }],
    fallbackUsed: true,
    generationMetrics: {
      attemptCount: 3,
      totalGenerationTime: 8500,
      validationTime: 600,
      correctionTime: 1200,
      finalQualityScore: 65,
      issuesDetected: 3,
      issuesFixed: 0,
      startTime: new Date(),
      endTime: new Date()
    }
  }

  const sessionId = metricsCollector.recordGenerationSession(request, result)
  console.log(`Recorded fallback generation session: ${sessionId}`)
  
  return sessionId
}

/**
 * Example: Generate and display quality report
 */
export function generateQualityReport() {
  console.log('\n=== Quality Assurance Report ===')
  
  const report = metricsCollector.generateQualityReport()
  
  console.log(`\nSummary:`)
  console.log(`- Total Generations: ${report.summary.totalGenerations}`)
  console.log(`- Average Quality Score: ${report.summary.averageQualityScore.toFixed(2)}`)
  console.log(`- First Attempt Success: ${report.summary.generationSuccess.firstAttempt.toFixed(1)}%`)
  console.log(`- Success After Correction: ${report.summary.generationSuccess.afterCorrection.toFixed(1)}%`)
  console.log(`- Fallback Usage: ${report.summary.generationSuccess.fallbackUsed.toFixed(1)}%`)
  
  console.log(`\nCommon Issues:`)
  report.commonIssues.slice(0, 5).forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.type} (${issue.frequency} occurrences, ${issue.severity})`)
  })
  
  console.log(`\nRecommendations:`)
  report.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`)
  })
  
  return report
}

/**
 * Example: Get real-time dashboard data
 */
export function getDashboardData() {
  console.log('\n=== Real-time Dashboard ===')
  
  const dashboard = metricsCollector.getDashboardData()
  
  console.log(`\nReal-time Metrics:`)
  console.log(`- Generations Today: ${dashboard.realTimeMetrics.generationsToday}`)
  console.log(`- Current Quality Score: ${dashboard.realTimeMetrics.currentQualityScore.toFixed(2)}`)
  console.log(`- Success Rate: ${dashboard.realTimeMetrics.successRate.toFixed(1)}%`)
  console.log(`- Active Issues: ${dashboard.realTimeMetrics.activeIssues}`)
  
  console.log(`\nPerformance Metrics:`)
  console.log(`- Average Generation Time: ${dashboard.performance.averageGenerationTime.toFixed(0)}ms`)
  console.log(`- P95 Generation Time: ${dashboard.performance.p95GenerationTime.toFixed(0)}ms`)
  console.log(`- Throughput: ${dashboard.performance.throughput.toFixed(2)} generations/min`)
  console.log(`- Error Rate: ${dashboard.performance.errorRate.toFixed(1)}%`)
  
  console.log(`\nTop Issues:`)
  dashboard.topIssues.slice(0, 3).forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.type}: ${issue.count} occurrences (${issue.trend})`)
  })
  
  return dashboard
}

/**
 * Example: Export metrics data
 */
export function exportMetrics() {
  console.log('\n=== Exporting Metrics ===')
  
  // Export as JSON
  const jsonData = metricsCollector.exportMetricsData('json')
  console.log(`JSON export size: ${jsonData.length} characters`)
  
  // Export as CSV
  const csvData = metricsCollector.exportMetricsData('csv')
  console.log(`CSV export size: ${csvData.length} characters`)
  console.log(`CSV preview:\n${csvData.split('\n').slice(0, 3).join('\n')}`)
  
  return { json: jsonData, csv: csvData }
}

/**
 * Run a complete example demonstration
 */
export function runExample() {
  console.log('🚀 Starting MetricsCollector Example\n')
  
  // Record different types of generations
  recordSuccessfulGeneration()
  recordCorrectedGeneration()
  recordFallbackGeneration()
  
  // Generate reports
  generateQualityReport()
  getDashboardData()
  exportMetrics()
  
  console.log('\n✅ Example completed successfully!')
}

// Export the metrics collector instance for external use
export { metricsCollector }

// Run example if this file is executed directly
if (require.main === module) {
  runExample()
}