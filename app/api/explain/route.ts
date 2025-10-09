import { vibeSDK } from "@/lib/vibesdk"
import { RealtimeValidator } from "@/lib/migration/realtime-validator"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const validator = new RealtimeValidator()
  
  try {
    const { code, question, includeSyntaxAnalysis = true, rejectLegacyCode = true, allowLegacySyntax = false } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    // Perform comprehensive real-time validation
    const validationResult = await validator.validateUserInput(code)

    // STRICT VALIDATION: Always reject legacy code (no bypass allowed)
    const forceModernSyntax = true // Always enforce modern syntax
    
    if (validationResult.hasLegacyPatterns && forceModernSyntax) {
      // Log legacy code submission for monitoring
      console.warn("[API] User submitted legacy code for explanation:", {
        codeLength: code.length,
        patternCount: validationResult.patterns.length,
        criticalCount: validationResult.patterns.filter(p => p.severity === 'critical').length,
        warningCount: validationResult.patterns.filter(p => p.severity === 'warning').length,
        patterns: validationResult.patterns.map(p => ({ type: p.type, severity: p.severity, description: p.description }))
      })

      // Attempt automatic modernization
      const autoModernization = validator.autoModernizeCode(code, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: true
      })

      // If auto-modernization is successful, explain the modernized code instead
      if (autoModernization.confidence > 0.7 && !autoModernization.requiresManualReview) {
        const modernValidation = await validator.validateUserInput(autoModernization.modernizedCode)
        
        if (!modernValidation.hasLegacyPatterns) {
          // Enhance explanation request with modernization context
          const enhancedQuestion = `${question || 'Explain this code'}

CONTEXT: This code has been automatically modernized from legacy Cadence syntax to Cadence 1.0. 
The following transformations were applied: ${autoModernization.transformationsApplied.join(', ')}.
Please explain the modernized code and highlight the improvements made.`

          const explanation = await vibeSDK.explainCode({ 
            code: autoModernization.modernizedCode, 
            question: enhancedQuestion 
          })

          return NextResponse.json({ 
            explanation,
            codeModernized: true,
            originalCode: code,
            modernizedCode: autoModernization.modernizedCode,
            modernizationApplied: {
              transformationsApplied: autoModernization.transformationsApplied,
              confidence: autoModernization.confidence,
              warnings: autoModernization.warnings
            },
            syntaxAnalysis: includeSyntaxAnalysis ? {
              originalValidation: validationResult,
              modernizedValidation: modernValidation,
              isCadence10Compliant: true,
              hasLegacyPatterns: false,
              improvementMetrics: {
                patternsFixed: validationResult.patterns.length,
                criticalIssuesResolved: validationResult.patterns.filter(p => p.severity === 'critical').length,
                warningsResolved: validationResult.patterns.filter(p => p.severity === 'warning').length
              },
              validationTime: modernValidation.validationTime,
              confidence: modernValidation.confidence
            } : null,
            educationalContent: validationResult.educationalContent,
            complianceStatus: {
              cadence10Compliant: true,
              productionReady: modernValidation.isValid,
              modernizationSuccessful: true
            }
          })
        }
      }

      // If auto-modernization failed, reject with comprehensive error and guidance
      return NextResponse.json({ 
        error: "Code contains legacy syntax and cannot be explained without modernization",
        reason: "Legacy Cadence syntax detected - modern syntax required",
        rejected: true,
        validation: validationResult,
        comprehensiveReport: {
          totalPatterns: validationResult.patterns.length,
          criticalPatterns: validationResult.patterns.filter(p => p.severity === 'critical').length,
          warningPatterns: validationResult.patterns.filter(p => p.severity === 'warning').length,
          suggestionPatterns: validationResult.patterns.filter(p => p.severity === 'suggestion').length,
          patternsByType: validationResult.patterns.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          detailedPatterns: validationResult.patterns.map(p => ({
            type: p.type,
            severity: p.severity,
            description: p.description,
            location: p.location,
            suggestedFix: p.suggestedFix,
            modernReplacement: p.modernReplacement
          }))
        },
        suggestions: validationResult.suggestions,
        educationalContent: validationResult.educationalContent,
        autoModernization: {
          attempted: true,
          result: autoModernization,
          successful: false,
          reason: autoModernization.requiresManualReview ? 'Manual review required' : 'Low confidence modernization'
        },
        modernizationGuidance: {
          message: "Please modernize your code to Cadence 1.0 syntax before requesting an explanation",
          quickFixes: validationResult.suggestions.filter(s => s.autoFixable).map(s => ({
            pattern: s.pattern.description,
            fix: s.modernReplacement,
            explanation: s.explanation
          })),
          manualReviewRequired: validationResult.suggestions.filter(s => !s.autoFixable).map(s => ({
            pattern: s.pattern.description,
            guidance: s.explanation,
            example: s.example
          }))
        }
      }, { status: 422 })
    }

    // Enhance explanation request with modern syntax context
    let enhancedQuestion = question || 'Explain this code'
    enhancedQuestion += '\n\nCONTEXT: This code uses modern Cadence 1.0 syntax. Please provide a comprehensive explanation highlighting the modern features and best practices used.'

    // Generate explanation with modern syntax context
    const explanation = await vibeSDK.explainCode({ code, question: enhancedQuestion })

    // Include comprehensive syntax analysis
    let syntaxAnalysis = null
    if (includeSyntaxAnalysis) {
      syntaxAnalysis = {
        validationResult,
        isCadence10Compliant: validationResult.isValid && !validationResult.hasLegacyPatterns,
        hasLegacyPatterns: validationResult.hasLegacyPatterns,
        criticalIssues: validationResult.patterns.filter(p => p.severity === 'critical'),
        warnings: validationResult.patterns.filter(p => p.severity === 'warning'),
        suggestions: validationResult.patterns.filter(p => p.severity === 'suggestion'),
        modernizationSuggestions: validationResult.suggestions,
        educationalContent: validationResult.educationalContent,
        validationTime: validationResult.validationTime,
        confidence: validationResult.confidence,
        modernSyntaxFeatures: identifyModernFeatures(code),
        bestPracticesUsed: identifyBestPractices(code)
      }
    }

    return NextResponse.json({ 
      explanation,
      codeModernized: false,
      syntaxAnalysis,
      complianceStatus: {
        cadence10Compliant: !validationResult.hasLegacyPatterns,
        productionReady: validationResult.isValid && !validationResult.hasLegacyPatterns,
        requiresModernization: validationResult.hasLegacyPatterns
      },
      // Include educational content for continuous learning
      educationalContent: validationResult.educationalContent
    })
  } catch (error) {
    console.error("[v0] Code explanation error:", error)
    return NextResponse.json({ 
      error: "Failed to explain code",
      details: error instanceof Error ? error.message : "Unknown error",
      rejected: true
    }, { status: 500 })
  }
}

// Helper functions for identifying modern features and best practices
function identifyModernFeatures(code: string): string[] {
  const features: string[] = []
  
  if (code.includes('access(all)')) features.push('Explicit access control')
  if (code.includes('access(self)')) features.push('Self access control')
  if (code.includes('access(contract)')) features.push('Contract access control')
  if (code.includes('account.storage.')) features.push('Modern storage API')
  if (code.includes('account.capabilities.')) features.push('Capabilities API')
  if (code.includes('view fun')) features.push('View functions')
  if (code.includes(' & ')) features.push('Modern interface conformance')
  
  return features
}

function identifyBestPractices(code: string): string[] {
  const practices: string[] = []
  
  if (code.includes('pre {') || code.includes('post {')) practices.push('Conditions usage')
  if (code.includes('emit ')) practices.push('Event emission')
  if (code.includes('destroy')) practices.push('Proper resource cleanup')
  if (code.includes('@')) practices.push('Resource annotations')
  
  return practices
}
