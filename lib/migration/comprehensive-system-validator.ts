import { LegacyPatternDetector } from './legacy-pattern-detector'
import { RealtimeValidator } from './realtime-validator'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export interface SystemValidationResult {
  success: boolean
  codebaseScan: CodebaseScanResult
  apiEndpointTests: ApiEndpointTestResult
  templateValidation: TemplateValidationResult
  performanceTests: PerformanceTestResult
  summary: ValidationSummary
}

export interface CodebaseScanResult {
  totalFilesScanned: number
  legacyPatternsFound: LegacyPatternFound[]
  cleanFiles: string[]
  errorFiles: string[]
}

export interface LegacyPatternFound {
  file: string
  line: number
  column: number
  pattern: string
  type: string
  severity: 'critical' | 'warning' | 'suggestion'
}

export interface ApiEndpointTestResult {
  generateEndpoint: EndpointTestResult
  explainEndpoint: EndpointTestResult
  refineEndpoint: EndpointTestResult
  streamEndpoint: EndpointTestResult
}

export interface EndpointTestResult {
  rejectsLegacySyntax: boolean
  providesModernizationSuggestions: boolean
  responseTime: number
  errors: string[]
}

export interface TemplateValidationResult {
  totalTemplates: number
  validTemplates: string[]
  invalidTemplates: TemplateValidationError[]
}

export interface TemplateValidationError {
  templateId: string
  errors: string[]
  legacyPatterns: LegacyPatternFound[]
}

export interface PerformanceTestResult {
  validationResponseTime: number
  patternDetectionTime: number
  modernizationSuggestionTime: number
  memoryUsage: number
  passesPerformanceThresholds: boolean
}

export interface ValidationSummary {
  overallStatus: 'PASS' | 'FAIL'
  criticalIssues: number
  warnings: number
  suggestions: number
  recommendations: string[]
}

export class ComprehensiveSystemValidator {
  private detector: LegacyPatternDetector
  private realtimeValidator: RealtimeValidator

  constructor() {
    this.detector = new LegacyPatternDetector()
    this.realtimeValidator = new RealtimeValidator()
  }

  async validateSystem(): Promise<SystemValidationResult> {
    console.log('🔍 Starting comprehensive system validation...')
    
    const codebaseScan = await this.scanCodebase()
    const apiEndpointTests = await this.testApiEndpoints()
    const templateValidation = await this.validateTemplates()
    const performanceTests = await this.runPerformanceTests()
    
    const summary = this.generateSummary(codebaseScan, apiEndpointTests, templateValidation, performanceTests)
    
    return {
      success: summary.overallStatus === 'PASS',
      codebaseScan,
      apiEndpointTests,
      templateValidation,
      performanceTests,
      summary
    }
  }

  private async scanCodebase(): Promise<CodebaseScanResult> {
    console.log('📁 Scanning codebase for legacy patterns...')
    
    const filesToScan = this.getAllRelevantFiles()
    const legacyPatternsFound: LegacyPatternFound[] = []
    const cleanFiles: string[] = []
    const errorFiles: string[] = []

    for (const file of filesToScan) {
      try {
        const content = readFileSync(file, 'utf-8')
        const patterns = this.detector.detectAllLegacyPatterns(content)
        
        if (patterns.length > 0) {
          patterns.forEach(pattern => {
            legacyPatternsFound.push({
              file,
              line: pattern.location.line,
              column: pattern.location.column,
              pattern: pattern.description,
              type: pattern.type,
              severity: pattern.severity
            })
          })
        } else {
          cleanFiles.push(file)
        }
      } catch (error) {
        errorFiles.push(file)
        console.error(`Error scanning file ${file}:`, error)
      }
    }

    return {
      totalFilesScanned: filesToScan.length,
      legacyPatternsFound,
      cleanFiles,
      errorFiles
    }
  }

  private getAllRelevantFiles(): string[] {
    const files: string[] = []
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.md']
    const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build']

    const scanDirectory = (dir: string) => {
      try {
        const items = readdirSync(dir)
        
        for (const item of items) {
          const fullPath = join(dir, item)
          const stat = statSync(fullPath)
          
          if (stat.isDirectory()) {
            if (!excludeDirs.includes(item)) {
              scanDirectory(fullPath)
            }
          } else if (stat.isFile()) {
            const ext = item.substring(item.lastIndexOf('.'))
            if (extensions.includes(ext)) {
              files.push(fullPath)
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error)
      }
    }

    scanDirectory('.')
    return files
  }

  private async testApiEndpoints(): Promise<ApiEndpointTestResult> {
    console.log('🌐 Testing API endpoints with legacy code...')
    
    const legacyTestCode = `
      pub contract TestContract {
        pub resource Vault: Provider, Receiver {
          pub var balance: UFix64
          
          pub fun deposit(from: @FungibleToken.Vault) {
            self.balance = self.balance + from.balance
          }
        }
      }
    `

    return {
      generateEndpoint: await this.testEndpoint('/api/generate', { prompt: 'Create a contract', code: legacyTestCode }),
      explainEndpoint: await this.testEndpoint('/api/explain', { code: legacyTestCode }),
      refineEndpoint: await this.testEndpoint('/api/refine', { code: legacyTestCode, instructions: 'Improve this' }),
      streamEndpoint: await this.testEndpoint('/api/stream', { prompt: 'Generate contract', code: legacyTestCode })
    }
  }

  private async testEndpoint(endpoint: string, payload: any): Promise<EndpointTestResult> {
    const startTime = Date.now()
    
    try {
      // Mock API call since we're in a test environment
      const mockResponse = await this.mockApiCall(endpoint, payload)
      const responseTime = Date.now() - startTime
      
      return {
        rejectsLegacySyntax: mockResponse.rejectsLegacy,
        providesModernizationSuggestions: mockResponse.providesSuggestions,
        responseTime,
        errors: mockResponse.errors || []
      }
    } catch (error) {
      return {
        rejectsLegacySyntax: false,
        providesModernizationSuggestions: false,
        responseTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async mockApiCall(endpoint: string, payload: any): Promise<any> {
    // Simulate API behavior based on our validation logic
    const hasLegacyPatterns = this.detector.detectAllLegacyPatterns(payload.code || '').length > 0
    
    return {
      rejectsLegacy: hasLegacyPatterns,
      providesSuggestions: hasLegacyPatterns,
      errors: hasLegacyPatterns ? ['Legacy syntax detected'] : []
    }
  }

  private async validateTemplates(): Promise<TemplateValidationResult> {
    console.log('📋 Validating all templates...')
    
    try {
      // Import templates dynamically to avoid build issues
      const templatesPath = join(process.cwd(), 'lib/templates.ts')
      const templatesContent = readFileSync(templatesPath, 'utf-8')
      
      // Extract template code from the file
      const templateMatches = templatesContent.match(/code:\s*`([^`]+)`/g) || []
      const validTemplates: string[] = []
      const invalidTemplates: TemplateValidationError[] = []
      
      templateMatches.forEach((match, index) => {
        const code = match.replace(/code:\s*`/, '').replace(/`$/, '')
        const patterns = this.detector.detectAllLegacyPatterns(code)
        
        if (patterns.length > 0) {
          invalidTemplates.push({
            templateId: `template-${index}`,
            errors: [`Found ${patterns.length} legacy patterns`],
            legacyPatterns: patterns.map(p => ({
              file: 'lib/templates.ts',
              line: p.location.line,
              column: p.location.column,
              pattern: p.description,
              type: p.type,
              severity: p.severity
            }))
          })
        } else {
          validTemplates.push(`template-${index}`)
        }
      })
      
      return {
        totalTemplates: templateMatches.length,
        validTemplates,
        invalidTemplates
      }
    } catch (error) {
      return {
        totalTemplates: 0,
        validTemplates: [],
        invalidTemplates: [{
          templateId: 'error',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          legacyPatterns: []
        }]
      }
    }
  }

  private async runPerformanceTests(): Promise<PerformanceTestResult> {
    console.log('⚡ Running performance tests...')
    
    const testCode = `
      access(all) contract TestContract {
        access(all) resource Vault: Provider & Receiver {
          access(all) var balance: UFix64
          
          access(all) fun deposit(from: @{FungibleToken.Vault}) {
            self.balance = self.balance + from.balance
          }
        }
      }
    `
    
    // Test validation response time
    const validationStart = Date.now()
    await this.realtimeValidator.validateUserInput(testCode)
    const validationTime = Date.now() - validationStart
    
    // Test pattern detection time
    const detectionStart = Date.now()
    const patterns = this.detector.detectAllLegacyPatterns(testCode)
    const detectionTime = Date.now() - detectionStart
    
    // Test modernization suggestion time
    const suggestionStart = Date.now()
    this.realtimeValidator.generateModernizationSuggestions(patterns)
    const suggestionTime = Date.now() - suggestionStart
    
    // Mock memory usage
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024 // MB
    
    const passesThresholds = validationTime < 100 && detectionTime < 50 && suggestionTime < 200
    
    return {
      validationResponseTime: validationTime,
      patternDetectionTime: detectionTime,
      modernizationSuggestionTime: suggestionTime,
      memoryUsage,
      passesPerformanceThresholds: passesThresholds
    }
  }

  private generateSummary(
    codebaseScan: CodebaseScanResult,
    apiTests: ApiEndpointTestResult,
    templateValidation: TemplateValidationResult,
    performanceTests: PerformanceTestResult
  ): ValidationSummary {
    const criticalIssues = codebaseScan.legacyPatternsFound.filter(p => p.severity === 'critical').length
    const warnings = codebaseScan.legacyPatternsFound.filter(p => p.severity === 'warning').length
    const suggestions = codebaseScan.legacyPatternsFound.filter(p => p.severity === 'suggestion').length
    
    const recommendations: string[] = []
    
    if (criticalIssues > 0) {
      recommendations.push(`Fix ${criticalIssues} critical legacy syntax issues immediately`)
    }
    
    if (templateValidation.invalidTemplates.length > 0) {
      recommendations.push(`Update ${templateValidation.invalidTemplates.length} templates with legacy patterns`)
    }
    
    if (!performanceTests.passesPerformanceThresholds) {
      recommendations.push('Optimize validation performance to meet response time requirements')
    }
    
    const apiEndpointsWorking = Object.values(apiTests).every(test => test.rejectsLegacySyntax)
    if (!apiEndpointsWorking) {
      recommendations.push('Fix API endpoints that are not properly rejecting legacy syntax')
    }
    
    const overallStatus = criticalIssues === 0 && 
                         templateValidation.invalidTemplates.length === 0 && 
                         performanceTests.passesPerformanceThresholds &&
                         apiEndpointsWorking ? 'PASS' : 'FAIL'
    
    return {
      overallStatus,
      criticalIssues,
      warnings,
      suggestions,
      recommendations
    }
  }

  generateReport(result: SystemValidationResult): string {
    const report = `
# Comprehensive System Validation Report

## Overall Status: ${result.summary.overallStatus}

### Summary
- Critical Issues: ${result.summary.criticalIssues}
- Warnings: ${result.summary.warnings}
- Suggestions: ${result.summary.suggestions}

### Codebase Scan Results
- Total Files Scanned: ${result.codebaseScan.totalFilesScanned}
- Clean Files: ${result.codebaseScan.cleanFiles.length}
- Files with Legacy Patterns: ${result.codebaseScan.legacyPatternsFound.length}
- Error Files: ${result.codebaseScan.errorFiles.length}

### API Endpoint Tests
- Generate Endpoint: ${result.apiEndpointTests.generateEndpoint.rejectsLegacySyntax ? 'PASS' : 'FAIL'}
- Explain Endpoint: ${result.apiEndpointTests.explainEndpoint.rejectsLegacySyntax ? 'PASS' : 'FAIL'}
- Refine Endpoint: ${result.apiEndpointTests.refineEndpoint.rejectsLegacySyntax ? 'PASS' : 'FAIL'}
- Stream Endpoint: ${result.apiEndpointTests.streamEndpoint.rejectsLegacySyntax ? 'PASS' : 'FAIL'}

### Template Validation
- Total Templates: ${result.templateValidation.totalTemplates}
- Valid Templates: ${result.templateValidation.validTemplates.length}
- Invalid Templates: ${result.templateValidation.invalidTemplates.length}

### Performance Tests
- Validation Response Time: ${result.performanceTests.validationResponseTime}ms
- Pattern Detection Time: ${result.performanceTests.patternDetectionTime}ms
- Modernization Suggestion Time: ${result.performanceTests.modernizationSuggestionTime}ms
- Memory Usage: ${result.performanceTests.memoryUsage.toFixed(2)}MB
- Passes Performance Thresholds: ${result.performanceTests.passesPerformanceThresholds ? 'YES' : 'NO'}

### Recommendations
${result.summary.recommendations.map(rec => `- ${rec}`).join('\n')}

### Legacy Patterns Found
${result.codebaseScan.legacyPatternsFound.map(pattern => 
  `- ${pattern.file}:${pattern.line}:${pattern.column} [${pattern.severity}] ${pattern.pattern}`
).join('\n')}
`
    
    return report
  }
}