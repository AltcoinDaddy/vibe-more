import { vibeSDK } from "@/lib/vibesdk"
import { RealtimeValidator } from "@/lib/migration/realtime-validator"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const validator = new RealtimeValidator()
  
  try {
    const { code, refinementRequest, validateCode = true, ensureModernSyntax = true, allowLegacySyntax = false } = await req.json()

    if (!code || !refinementRequest) {
      return NextResponse.json({ error: "Code and refinement request are required" }, { status: 400 })
    }

    // VALIDATION BYPASS PREVENTION: Force modern syntax (no bypass allowed)
    const forceModernSyntax = true // Always enforce modern syntax

    // Perform comprehensive validation on original code
    let originalValidation = await validator.validateUserInput(code)
    let inputCode = code

    // STRICT VALIDATION: Reject legacy input code immediately
    if (originalValidation.hasLegacyPatterns && forceModernSyntax) {
      // Log legacy code submission for monitoring
      console.warn("[API] User submitted legacy code for refinement:", {
        codeLength: code.length,
        refinementRequest: refinementRequest.substring(0, 100) + '...',
        patternCount: originalValidation.patterns.length,
        criticalCount: originalValidation.patterns.filter(p => p.severity === 'critical').length,
        patterns: originalValidation.patterns.map(p => ({ type: p.type, severity: p.severity }))
      })

      // Attempt automatic modernization of input code first
      const inputModernization = validator.autoModernizeCode(code, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: false
      })

      // If input modernization is successful, use modernized code for refinement
      if (inputModernization.confidence > 0.7 && !inputModernization.requiresManualReview) {
        const modernInputValidation = await validator.validateUserInput(inputModernization.modernizedCode)
        
        if (!modernInputValidation.hasLegacyPatterns) {
          // Use modernized code as input for refinement
          inputCode = inputModernization.modernizedCode
          originalValidation = modernInputValidation
        } else {
          // Input modernization failed, reject
          return NextResponse.json({ 
            error: "Input code contains legacy syntax that cannot be automatically modernized",
            reason: "Legacy patterns in input code require manual intervention before refinement",
            rejected: true,
            validation: originalValidation,
            comprehensiveReport: {
              totalPatterns: originalValidation.patterns.length,
              criticalPatterns: originalValidation.patterns.filter(p => p.severity === 'critical').length,
              warningPatterns: originalValidation.patterns.filter(p => p.severity === 'warning').length,
              patternsByType: originalValidation.patterns.reduce((acc, p) => {
                acc[p.type] = (acc[p.type] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            },
            suggestions: originalValidation.suggestions,
            educationalContent: originalValidation.educationalContent,
            autoModernization: {
              attempted: true,
              result: inputModernization,
              successful: false,
              reason: 'Input code modernization failed'
            }
          }, { status: 422 })
        }
      } else {
        // Input modernization failed, reject
        return NextResponse.json({ 
          error: "Input code contains legacy syntax and cannot be refined",
          reason: "Legacy patterns in input code must be modernized before refinement",
          rejected: true,
          validation: originalValidation,
          comprehensiveReport: {
            totalPatterns: originalValidation.patterns.length,
            criticalPatterns: originalValidation.patterns.filter(p => p.severity === 'critical').length,
            warningPatterns: originalValidation.patterns.filter(p => p.severity === 'warning').length,
            detailedPatterns: originalValidation.patterns.map(p => ({
              type: p.type,
              severity: p.severity,
              description: p.description,
              location: p.location,
              suggestedFix: p.suggestedFix
            }))
          },
          suggestions: originalValidation.suggestions,
          educationalContent: originalValidation.educationalContent,
          modernizationGuidance: {
            message: "Please modernize your code to Cadence 1.0 syntax before requesting refinement",
            requiredFixes: originalValidation.suggestions.map(s => ({
              pattern: s.pattern.description,
              fix: s.modernReplacement,
              explanation: s.explanation,
              autoFixable: s.autoFixable
            }))
          }
        }, { status: 422 })
      }
    }

    // Enhance refinement request to ensure modern syntax
    let enhancedRefinementRequest = `${refinementRequest}

CRITICAL REQUIREMENT: The refined code MUST use ONLY Cadence 1.0 syntax:
- Replace ALL "pub" keywords with "access(all)" or appropriate access modifiers
- Use modern storage API (account.storage.save, account.capabilities.borrow)
- Use modern interface conformance syntax with "&" separator instead of commas
- Follow current Cadence 1.0 best practices and conventions
- NO legacy syntax patterns are allowed
- Ensure all generated code is production-ready and Cadence 1.0 compliant`

    // Add specific modernization instructions if any patterns were detected
    if (originalValidation.hasLegacyPatterns) {
      const patternTypes = [...new Set(originalValidation.patterns.map(p => p.type))]
      enhancedRefinementRequest += `

ADDITIONAL CONTEXT: Input code was automatically modernized from legacy syntax.
Original patterns fixed: ${patternTypes.join(', ')}
Ensure refinement maintains modern syntax compliance.`
    }

    const refinedCode = await vibeSDK.refineCode({ 
      code: inputCode, 
      refinementRequest: enhancedRefinementRequest 
    })

    // Perform comprehensive validation on refined code
    const refinedValidation = await validator.validateUserInput(refinedCode)

    // STRICT VALIDATION: Reject ANY legacy syntax in refined code
    if (refinedValidation.hasLegacyPatterns) {
      // Log refinement failure for monitoring
      console.error("[API] Refined code contains legacy patterns:", {
        originalPatterns: originalValidation.patterns.length,
        refinedPatterns: refinedValidation.patterns.length,
        refinementRequest: refinementRequest.substring(0, 100) + '...',
        patterns: refinedValidation.patterns.map(p => ({ type: p.type, severity: p.severity }))
      })

      // Attempt automatic modernization of refined code
      const refinedModernization = validator.autoModernizeCode(refinedCode, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: true
      })

      // If refined code modernization is successful, use it
      if (refinedModernization.confidence > 0.8 && !refinedModernization.requiresManualReview) {
        const finalValidation = await validator.validateUserInput(refinedModernization.modernizedCode)
        
        if (!finalValidation.hasLegacyPatterns) {
          // Calculate improvement metrics
          const improvementMetrics = {
            originalIssues: originalValidation.patterns.length,
            refinedIssues: 0, // Final code has no issues
            syntaxImproved: true,
            criticalIssuesFixed: originalValidation.patterns.filter(p => p.severity === 'critical').length,
            validationTimeImprovement: originalValidation.validationTime - finalValidation.validationTime,
            confidenceImprovement: finalValidation.confidence - originalValidation.confidence,
            autoModernizationApplied: true
          }

          return NextResponse.json({ 
            code: refinedModernization.modernizedCode,
            validation: {
              isValid: finalValidation.isValid,
              hasLegacyPatterns: finalValidation.hasLegacyPatterns,
              patterns: finalValidation.patterns,
              validationTime: finalValidation.validationTime,
              confidence: finalValidation.confidence
            },
            rejected: false,
            autoModernized: true,
            modernizationApplied: {
              inputModernization: originalValidation.hasLegacyPatterns,
              refinedModernization: true,
              transformationsApplied: refinedModernization.transformationsApplied,
              confidence: refinedModernization.confidence
            },
            originalValidation,
            improvementMetrics,
            suggestions: finalValidation.suggestions,
            educationalContent: finalValidation.educationalContent,
            complianceStatus: {
              cadence10Compliant: true,
              productionReady: finalValidation.isValid,
              modernizationSuccessful: true
            }
          })
        }
      }

      // Refined code modernization failed, reject
      return NextResponse.json({ 
        error: "Refined code contains legacy syntax and cannot be automatically modernized",
        reason: "Critical legacy patterns detected in refined code that require manual intervention",
        rejected: true,
        validation: refinedValidation,
        originalCode: code,
        refinedCode,
        originalValidation,
        comprehensiveReport: {
          totalPatterns: refinedValidation.patterns.length,
          criticalPatterns: refinedValidation.patterns.filter(p => p.severity === 'critical').length,
          warningPatterns: refinedValidation.patterns.filter(p => p.severity === 'warning').length,
          patternsByType: refinedValidation.patterns.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          refinementFailed: true,
          refinementRequest: refinementRequest
        },
        suggestions: refinedValidation.suggestions,
        educationalContent: refinedValidation.educationalContent,
        autoModernization: {
          attempted: true,
          result: refinedModernization,
          successful: false,
          reason: 'Refined code modernization failed'
        }
      }, { status: 422 })
    }

    // Calculate improvement metrics
    const improvementMetrics = {
      originalIssues: originalValidation.patterns.length,
      refinedIssues: refinedValidation.patterns.length,
      syntaxImproved: originalValidation.hasLegacyPatterns && !refinedValidation.hasLegacyPatterns,
      criticalIssuesFixed: originalValidation.patterns.filter(p => p.severity === 'critical').length - 
                          refinedValidation.patterns.filter(p => p.severity === 'critical').length,
      validationTimeImprovement: originalValidation.validationTime - refinedValidation.validationTime,
      confidenceImprovement: refinedValidation.confidence - originalValidation.confidence,
      autoModernizationApplied: false
    }

    return NextResponse.json({ 
      code: refinedCode,
      validation: {
        isValid: refinedValidation.isValid,
        hasLegacyPatterns: refinedValidation.hasLegacyPatterns,
        patterns: refinedValidation.patterns,
        validationTime: refinedValidation.validationTime,
        confidence: refinedValidation.confidence
      },
      rejected: false,
      autoModernized: false,
      originalValidation: {
        isValid: originalValidation.isValid,
        hasLegacyPatterns: originalValidation.hasLegacyPatterns,
        patterns: originalValidation.patterns,
        validationTime: originalValidation.validationTime,
        confidence: originalValidation.confidence
      },
      improvementMetrics,
      suggestions: refinedValidation.suggestions,
      educationalContent: refinedValidation.educationalContent,
      complianceStatus: {
        cadence10Compliant: !refinedValidation.hasLegacyPatterns,
        productionReady: refinedValidation.isValid && !refinedValidation.hasLegacyPatterns,
        requiresModernization: refinedValidation.hasLegacyPatterns
      }
    })
  } catch (error) {
    console.error("[v0] Code refinement error:", error)
    return NextResponse.json({ 
      error: "Failed to refine code",
      details: error instanceof Error ? error.message : "Unknown error",
      rejected: true
    }, { status: 500 })
  }
}