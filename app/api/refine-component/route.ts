import { NextResponse } from "next/server"
import { ComponentRefinementSystem, ComponentRefinementOptions } from "@/lib/component-refinement-system"
import { ProjectConsistencyManager } from "@/lib/project-consistency-manager"

export async function POST(req: Request) {
  try {
    const {
      componentPath,
      componentType,
      refinementType,
      description,
      currentCode,
      relatedFiles = [],
      projectFiles = {},
      preserveIntegrations = true
    } = await req.json()

    // Validate required fields
    if (!componentPath || !componentType || !refinementType || !description || !currentCode) {
      return NextResponse.json({
        error: "Missing required fields",
        required: ["componentPath", "componentType", "refinementType", "description", "currentCode"]
      }, { status: 400 })
    }

    // Initialize refinement system
    const refinementSystem = new ComponentRefinementSystem()
    const consistencyManager = new ProjectConsistencyManager()

    // Analyze project structure if project files are provided
    let projectStructure = null
    if (Object.keys(projectFiles).length > 0) {
      const projectFilesMap = new Map(Object.entries(projectFiles))
      projectStructure = await consistencyManager.analyzeProjectStructure(projectFilesMap)
    }

    // Prepare refinement options
    const refinementOptions: ComponentRefinementOptions = {
      componentPath,
      componentType,
      refinementType,
      description,
      currentCode,
      relatedFiles,
      preserveIntegrations
    }

    // Perform component refinement
    const refinementResult = await refinementSystem.refineComponent(refinementOptions)

    // If project structure is available, check and maintain consistency
    let consistencyResult = null
    if (projectStructure) {
      consistencyResult = await consistencyManager.updateProjectAfterRefinement(
        refinementResult,
        componentPath
      )
    }

    // Create version snapshot if refinement was successful
    let versionInfo = null
    if (refinementResult.success && projectStructure) {
      const changes = [
        {
          file: componentPath,
          type: 'modified' as const,
          description: `Applied ${refinementType} refinement: ${description}`,
          impact: refinementResult.affectedFiles.map(f => f.path)
        },
        ...refinementResult.affectedFiles.map(file => ({
          file: file.path,
          type: file.action as any,
          description: file.reason,
          impact: [file.path]
        }))
      ]

      const version = await consistencyManager.createVersionSnapshot(
        `Component refinement: ${description}`,
        changes
      )

      versionInfo = {
        version,
        changes: changes.length,
        description: `Applied ${refinementType} refinement to ${componentPath}`
      }
    }

    // Prepare response
    const response = {
      success: refinementResult.success,
      refinement: {
        updatedCode: refinementResult.updatedCode,
        affectedFiles: refinementResult.affectedFiles,
        integrationUpdates: refinementResult.integrationUpdates,
        validation: refinementResult.validation,
        warnings: refinementResult.warnings,
        suggestions: refinementResult.suggestions
      },
      consistency: consistencyResult ? {
        isConsistent: consistencyResult.isConsistent,
        issues: consistencyResult.issues,
        warnings: consistencyResult.warnings,
        suggestions: consistencyResult.suggestions,
        repairsApplied: consistencyResult.repairActions.length
      } : null,
      version: versionInfo,
      metadata: {
        componentPath,
        componentType,
        refinementType,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() // This would be calculated properly
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("[API] Component refinement error:", error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to refine component",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint to retrieve refinement history
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const componentPath = searchParams.get('componentPath')
    const action = searchParams.get('action')

    if (!componentPath) {
      return NextResponse.json({
        error: "componentPath parameter is required"
      }, { status: 400 })
    }

    const consistencyManager = new ProjectConsistencyManager()

    if (action === 'history') {
      // Get version history for the component
      const history = consistencyManager.getVersionHistory(componentPath)
      
      return NextResponse.json({
        componentPath,
        history: history.map(version => ({
          version: version.version,
          timestamp: version.timestamp,
          description: version.description,
          changes: version.changes.length,
          author: version.author
        }))
      })
    }

    if (action === 'status') {
      // Get current status of the component
      return NextResponse.json({
        componentPath,
        status: 'available',
        lastModified: new Date().toISOString(),
        canRefine: true
      })
    }

    return NextResponse.json({
      error: "Invalid action. Supported actions: history, status"
    }, { status: 400 })

  } catch (error) {
    console.error("[API] Component refinement GET error:", error)
    
    return NextResponse.json({
      error: "Failed to retrieve component information",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}