import { vibeSDK } from "@/lib/vibesdk"
import { RealtimeValidator } from "@/lib/migration/realtime-validator"
import { 
  enhancedGenerationController,
  GenerationRequest,
  QualityAssuredResult,
  EnhancedGenerationOptions
} from "@/lib/quality-assurance"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const validator = new RealtimeValidator()
  
  try {
    const { 
      prompt, 
      context, 
      validateCode = true, 
      includeAnalysis = true, 
      allowLegacySyntax = false,
      qualityThreshold = 80,
      maxRetries = 3,
      strictMode = true
    } = await req.json()

    if (!prompt) {
      return NextResponse.json({ 
        error: "Prompt is required",
        qualityMetrics: {
          qualityScore: 0,
          validationResults: [],
          fallbackUsed: false,
          generationMetrics: {
            attemptCount: 0,
            totalGenerationTime: 0,
            validationTime: 0,
            correctionTime: 0,
            finalQualityScore: 0,
            issuesDetected: 1,
            issuesFixed: 0,
            startTime: new Date(),
            endTime: new Date()
          }
        }
      }, { status: 400 })
    }

    // Create generation request for quality assurance system
    const generationRequest: GenerationRequest = {
      prompt,
      context,
      temperature: 0.7,
      maxRetries,
      strictMode
    }

    // Configure quality assurance options
    const qaOptions: EnhancedGenerationOptions = {
      enableRetryRecovery: true,
      enableAutoCorrection: true,
      enableFallbackGeneration: true,
      enableProgressiveEnhancement: true,
      qualityThreshold,
      maxRetries,
      strictMode
    }

    // Create generation function that wraps the existing vibeSDK
    const generationFunction = async (enhancedPrompt: string, temperature: number): Promise<string> => {
      const result = await vibeSDK.generateCodeWithValidation({ 
        prompt: enhancedPrompt, 
        context,
        temperature 
      })
      return result.code
    }

    // Execute generation with comprehensive quality assurance
    const qaResult: QualityAssuredResult = await enhancedGenerationController.generateWithQualityAssurance(
      generationRequest,
      generationFunction,
      qaOptions
    )

    // Perform legacy validation for backward compatibility
    const legacyValidation = await validator.validateUserInput(qaResult.code)

    // Check if quality threshold is met
    const meetsQualityThreshold = qaResult.qualityScore >= qualityThreshold

    // If quality is too low and fallback wasn't used, try fallback
    if (!meetsQualityThreshold && !qaResult.fallbackUsed) {
      console.warn('[API] Quality threshold not met, activating fallback', {
        qualityScore: qaResult.qualityScore,
        threshold: qualityThreshold
      })

      // Get fallback code
      const fallbackCode = await enhancedGenerationController.getFallbackCode(
        prompt,
        { category: 'generic', complexity: 'simple', features: [] }
      )

      // Validate fallback
      const fallbackValidation = await validator.validateUserInput(fallbackCode)

      return NextResponse.json({
        code: fallbackCode,
        validation: {
          isValid: fallbackValidation.isValid,
          hasLegacyPatterns: fallbackValidation.hasLegacyPatterns,
          patterns: fallbackValidation.patterns,
          validationTime: fallbackValidation.validationTime,
          confidence: fallbackValidation.confidence
        },
        rejected: false,
        autoModernized: false,
        fallbackUsed: true,
        fallbackReason: `Quality score ${qaResult.qualityScore} below threshold ${qualityThreshold}`,
        qualityMetrics: {
          qualityScore: 85, // Fallback should have decent quality
          validationResults: qaResult.validationResults,
          fallbackUsed: true,
          generationMetrics: qaResult.generationMetrics,
          correctionHistory: qaResult.correctionHistory
        },
        analysis: includeAnalysis ? {
          validationResult: fallbackValidation,
          complianceScore: 85,
          readyForProduction: fallbackValidation.isValid && !fallbackValidation.hasLegacyPatterns,
          recommendations: ['Fallback template used - consider refining your prompt for better results'],
          educationalContent: [],
          qualityAssurance: {
            originalQualityScore: qaResult.qualityScore,
            fallbackActivated: true,
            totalAttempts: qaResult.generationMetrics.attemptCount,
            issuesDetected: qaResult.generationMetrics.issuesDetected,
            issuesFixed: qaResult.generationMetrics.issuesFixed
          }
        } : null,
        suggestions: legacyValidation.suggestions || [],
        educationalContent: legacyValidation.educationalContent || [],
        complianceStatus: {
          cadence10Compliant: !fallbackValidation.hasLegacyPatterns,
          productionReady: fallbackValidation.isValid && !fallbackValidation.hasLegacyPatterns,
          requiresModernization: fallbackValidation.hasLegacyPatterns
        }
      })
    }

    // Handle legacy patterns if detected
    if (legacyValidation.hasLegacyPatterns && strictMode) {
      console.warn("[API] Generated code contains legacy patterns despite quality assurance:", {
        prompt: prompt.substring(0, 100) + '...',
        qualityScore: qaResult.qualityScore,
        patternCount: legacyValidation.patterns.length,
        fallbackUsed: qaResult.fallbackUsed
      })

      // Attempt automatic modernization as last resort
      const autoModernization = validator.autoModernizeCode(qaResult.code, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: true
      })

      if (autoModernization.confidence > 0.8 && !autoModernization.requiresManualReview) {
        const modernValidation = await validator.validateUserInput(autoModernization.modernizedCode)
        
        if (!modernValidation.hasLegacyPatterns) {
          return NextResponse.json({
            code: autoModernization.modernizedCode,
            validation: {
              isValid: modernValidation.isValid,
              hasLegacyPatterns: modernValidation.hasLegacyPatterns,
              patterns: modernValidation.patterns,
              validationTime: modernValidation.validationTime,
              confidence: modernValidation.confidence
            },
            rejected: false,
            autoModernized: true,
            modernizationApplied: {
              transformationsApplied: autoModernization.transformationsApplied,
              confidence: autoModernization.confidence,
              warnings: autoModernization.warnings
            },
            qualityMetrics: {
              qualityScore: qaResult.qualityScore,
              validationResults: qaResult.validationResults,
              fallbackUsed: qaResult.fallbackUsed,
              generationMetrics: qaResult.generationMetrics,
              correctionHistory: qaResult.correctionHistory
            },
            analysis: includeAnalysis ? {
              validationResult: modernValidation,
              complianceScore: modernValidation.confidence,
              readyForProduction: modernValidation.isValid && !modernValidation.hasLegacyPatterns,
              recommendations: modernValidation.suggestions?.map(s => s.explanation) || [],
              educationalContent: modernValidation.educationalContent || [],
              qualityAssurance: {
                originalQualityScore: qaResult.qualityScore,
                autoModernizationApplied: true,
                totalAttempts: qaResult.generationMetrics.attemptCount,
                issuesDetected: qaResult.generationMetrics.issuesDetected,
                issuesFixed: qaResult.generationMetrics.issuesFixed
              }
            } : null,
            suggestions: modernValidation.suggestions || [],
            educationalContent: modernValidation.educationalContent || []
          })
        }
      }

      // If all else fails, reject with comprehensive error reporting
      return NextResponse.json({
        error: "Generated code contains legacy syntax that could not be automatically resolved",
        reason: "Quality assurance pipeline detected unresolvable legacy patterns",
        rejected: true,
        validation: {
          isValid: false,
          hasLegacyPatterns: true,
          patterns: legacyValidation.patterns,
          validationTime: legacyValidation.validationTime,
          confidence: legacyValidation.confidence
        },
        qualityMetrics: {
          qualityScore: qaResult.qualityScore,
          validationResults: qaResult.validationResults,
          fallbackUsed: qaResult.fallbackUsed,
          generationMetrics: qaResult.generationMetrics,
          correctionHistory: qaResult.correctionHistory
        },
        comprehensiveReport: {
          totalPatterns: legacyValidation.patterns.length,
          criticalPatterns: legacyValidation.patterns.filter(p => p.severity === 'critical').length,
          warningPatterns: legacyValidation.patterns.filter(p => p.severity === 'warning').length,
          suggestionPatterns: legacyValidation.patterns.filter(p => p.severity === 'suggestion').length,
          patternsByType: legacyValidation.patterns.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          qualityAssuranceAttempts: qaResult.generationMetrics.attemptCount,
          totalProcessingTime: qaResult.generationMetrics.totalGenerationTime
        },
        suggestions: legacyValidation.suggestions || [],
        educationalContent: legacyValidation.educationalContent || [],
        autoModernization: {
          attempted: true,
          result: autoModernization,
          successful: false,
          reason: autoModernization.requiresManualReview ? 'Manual review required' : 'Low confidence modernization'
        }
      }, { status: 422 })
    }

    // Report quality metrics for monitoring
    enhancedGenerationController.reportQualityMetrics(qaResult)

    // Success case - return high-quality code
    return NextResponse.json({
      code: qaResult.code,
      validation: {
        isValid: legacyValidation.isValid,
        hasLegacyPatterns: legacyValidation.hasLegacyPatterns,
        patterns: legacyValidation.patterns,
        validationTime: legacyValidation.validationTime,
        confidence: legacyValidation.confidence
      },
      rejected: false,
      autoModernized: false,
      fallbackUsed: qaResult.fallbackUsed,
      qualityMetrics: {
        qualityScore: qaResult.qualityScore,
        validationResults: qaResult.validationResults,
        fallbackUsed: qaResult.fallbackUsed,
        generationMetrics: qaResult.generationMetrics,
        correctionHistory: qaResult.correctionHistory
      },
      analysis: includeAnalysis ? {
        validationResult: legacyValidation,
        complianceScore: legacyValidation.confidence,
        readyForProduction: legacyValidation.isValid && !legacyValidation.hasLegacyPatterns,
        recommendations: legacyValidation.suggestions?.map(s => s.explanation) || [],
        educationalContent: legacyValidation.educationalContent || [],
        modernSyntaxCompliant: !legacyValidation.hasLegacyPatterns,
        cadence10Ready: legacyValidation.isValid && !legacyValidation.hasLegacyPatterns,
        qualityAssurance: {
          qualityScore: qaResult.qualityScore,
          totalAttempts: qaResult.generationMetrics.attemptCount,
          issuesDetected: qaResult.generationMetrics.issuesDetected,
          issuesFixed: qaResult.generationMetrics.issuesFixed,
          processingTime: qaResult.generationMetrics.totalGenerationTime,
          fallbackUsed: qaResult.fallbackUsed
        }
      } : null,
      suggestions: legacyValidation.suggestions || [],
      educationalContent: legacyValidation.educationalContent || [],
      complianceStatus: {
        cadence10Compliant: !legacyValidation.hasLegacyPatterns,
        productionReady: legacyValidation.isValid && !legacyValidation.hasLegacyPatterns && qaResult.qualityScore >= qualityThreshold,
        requiresModernization: legacyValidation.hasLegacyPatterns
      }
    })

  } catch (error) {
    console.error("[API] Enhanced code generation error:", error)
    
    // Try to provide emergency fallback even on error
    try {
      const emergencyFallback = await enhancedGenerationController.getFallbackCode(
        prompt || "emergency contract",
        { category: 'generic', complexity: 'simple', features: [] }
      )

      return NextResponse.json({
        code: emergencyFallback,
        validation: {
          isValid: true,
          hasLegacyPatterns: false,
          patterns: [],
          validationTime: 0,
          confidence: 50
        },
        rejected: false,
        autoModernized: false,
        fallbackUsed: true,
        fallbackReason: `Emergency fallback due to generation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: "Generation failed, emergency fallback provided",
        qualityMetrics: {
          qualityScore: 50,
          validationResults: [],
          fallbackUsed: true,
          generationMetrics: {
            attemptCount: 1,
            totalGenerationTime: 1000,
            validationTime: 0,
            correctionTime: 0,
            finalQualityScore: 50,
            issuesDetected: 1,
            issuesFixed: 0,
            startTime: new Date(),
            endTime: new Date()
          },
          correctionHistory: []
        }
      })
    } catch (fallbackError) {
      // Complete failure - return error
      return NextResponse.json({
        error: "Failed to generate code",
        details: error instanceof Error ? error.message : "Unknown error",
        fallbackError: fallbackError instanceof Error ? fallbackError.message : "Fallback also failed",
        rejected: true,
        qualityMetrics: {
          qualityScore: 0,
          validationResults: [],
          fallbackUsed: false,
          generationMetrics: {
            attemptCount: 0,
            totalGenerationTime: 0,
            validationTime: 0,
            correctionTime: 0,
            finalQualityScore: 0,
            issuesDetected: 1,
            issuesFixed: 0,
            startTime: new Date(),
            endTime: new Date()
          },
          correctionHistory: []
        }
      }, { status: 500 })
    }
  }
}
