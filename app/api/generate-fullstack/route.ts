import { NextResponse } from "next/server"
import { FullStackOrchestrator, GenerationProgress } from "@/lib/fullstack-orchestrator"
import { FullStackProjectRequest } from "@/lib/vibesdk"
import { z } from "zod"

// Request validation schema
const FullStackRequestSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  features: z.array(z.object({
    type: z.enum(['nft', 'token', 'marketplace', 'dao', 'defi', 'custom']),
    specifications: z.record(z.any()),
    priority: z.enum(['high', 'medium', 'low']).default('medium')
  })).min(1, "At least one feature is required"),
  uiRequirements: z.object({
    pages: z.array(z.object({
      name: z.string(),
      route: z.string(),
      purpose: z.string(),
      contractInteractions: z.array(z.string()).default([]),
      layout: z.string().default('default')
    })).default([]),
    components: z.array(z.object({
      name: z.string(),
      type: z.enum(['form', 'display', 'interaction', 'navigation']).default('display'),
      contractFunctions: z.array(z.string()).default([])
    })).default([]),
    styling: z.object({
      framework: z.enum(['tailwind', 'css']).default('tailwind'),
      theme: z.enum(['light', 'dark', 'auto']).default('auto'),
      customColors: z.record(z.string()).optional()
    }).default({}),
    responsive: z.boolean().default(true),
    accessibility: z.boolean().default(true)
  }).default({}),
  deploymentRequirements: z.object({
    target: z.enum(['vercel', 'netlify', 'self-hosted']).default('vercel'),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    customDomain: z.string().optional()
  }).default({}),
  advancedOptions: z.object({
    includeTests: z.boolean().default(true),
    includeDocumentation: z.boolean().default(true),
    typescript: z.boolean().default(true),
    strictMode: z.boolean().default(true),
    qualityThreshold: z.number().min(0).max(100).default(80)
  }).default({})
})

// Progress tracking for streaming responses
class ProgressTracker {
  private encoder = new TextEncoder()
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null

  setController(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.controller = controller
  }

  sendProgress(progress: GenerationProgress) {
    if (this.controller) {
      const data = JSON.stringify({
        type: 'progress',
        data: progress
      }) + '\n'
      
      this.controller.enqueue(this.encoder.encode(data))
    }
  }

  sendResult(result: any) {
    if (this.controller) {
      const data = JSON.stringify({
        type: 'result',
        data: result
      }) + '\n'
      
      this.controller.enqueue(this.encoder.encode(data))
    }
  }

  sendError(error: any) {
    if (this.controller) {
      const data = JSON.stringify({
        type: 'error',
        data: error
      }) + '\n'
      
      this.controller.enqueue(this.encoder.encode(data))
    }
  }

  close() {
    if (this.controller) {
      this.controller.close()
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate request
    const validationResult = FullStackRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid request format",
        details: validationResult.error.errors,
        type: 'validation_error'
      }, { status: 400 })
    }

    const request: FullStackProjectRequest = validationResult.data

    // Check if streaming is requested
    const acceptHeader = req.headers.get('accept')
    const isStreamingRequest = acceptHeader?.includes('text/stream') || 
                              acceptHeader?.includes('application/x-ndjson')

    if (isStreamingRequest) {
      // Return streaming response
      return new Response(
        new ReadableStream({
          start(controller) {
            const progressTracker = new ProgressTracker()
            progressTracker.setController(controller)

            // Create orchestrator with progress callback
            const orchestrator = new FullStackOrchestrator((progress) => {
              progressTracker.sendProgress(progress)
            })

            // Start generation
            orchestrator.generateFullStackProject(request)
              .then(result => {
                progressTracker.sendResult({
                  success: true,
                  project: result,
                  metadata: {
                    generatedAt: new Date().toISOString(),
                    projectName: request.projectName,
                    totalFiles: (result.smartContracts?.length || 0) + 
                               (result.frontendComponents?.length || 0) + 
                               (result.apiRoutes?.length || 0) + 
                               (result.configurations?.length || 0)
                  }
                })
                progressTracker.close()
              })
              .catch(error => {
                progressTracker.sendError({
                  success: false,
                  error: error.message,
                  type: 'generation_error',
                  timestamp: new Date().toISOString()
                })
                progressTracker.close()
              })
          }
        }),
        {
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        }
      )
    } else {
      // Return regular JSON response
      const orchestrator = new FullStackOrchestrator()
      const result = await orchestrator.generateFullStackProject(request)

      return NextResponse.json({
        success: true,
        project: result,
        metadata: {
          generatedAt: new Date().toISOString(),
          projectName: request.projectName,
          totalFiles: (result.smartContracts?.length || 0) + 
                     (result.frontendComponents?.length || 0) + 
                     (result.apiRoutes?.length || 0) + 
                     (result.configurations?.length || 0),
          features: request.features.map(f => f.type),
          framework: 'next',
          styling: request.uiRequirements.styling?.framework || 'tailwind'
        }
      })
    }

  } catch (error) {
    console.error("[API] Full-stack generation error:", error)

    // Provide detailed error information
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      type: 'server_error',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : null
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// GET endpoint for retrieving generation status or templates
export async function GET(req: Request) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    switch (action) {
      case 'templates':
        // Return available project templates
        return NextResponse.json({
          templates: [
            {
              id: 'nft-marketplace',
              name: 'NFT Marketplace',
              description: 'Complete NFT marketplace with minting, trading, and collection management',
              features: ['nft', 'marketplace'],
              complexity: 'high',
              estimatedTime: '15-20 minutes'
            },
            {
              id: 'token-dapp',
              name: 'Token dApp',
              description: 'Fungible token with transfer, staking, and governance features',
              features: ['token', 'defi'],
              complexity: 'medium',
              estimatedTime: '10-15 minutes'
            },
            {
              id: 'dao-platform',
              name: 'DAO Platform',
              description: 'Decentralized governance platform with voting and proposal management',
              features: ['dao', 'token'],
              complexity: 'high',
              estimatedTime: '20-25 minutes'
            },
            {
              id: 'simple-nft',
              name: 'Simple NFT Collection',
              description: 'Basic NFT collection with minting and viewing capabilities',
              features: ['nft'],
              complexity: 'low',
              estimatedTime: '5-10 minutes'
            }
          ]
        })

      case 'status':
        // Return system status
        return NextResponse.json({
          status: 'operational',
          version: '1.0.0',
          capabilities: {
            smartContracts: true,
            frontendGeneration: true,
            apiRoutes: true,
            projectScaffolding: true,
            streaming: true
          },
          limits: {
            maxProjectSize: 50, // files
            maxGenerationTime: 300000, // 5 minutes in ms
            maxConcurrentGenerations: 5
          }
        })

      default:
        return NextResponse.json({
          error: "Invalid action parameter",
          availableActions: ['templates', 'status']
        }, { status: 400 })
    }
  } catch (error) {
    console.error("[API] GET request error:", error)
    return NextResponse.json({
      error: "Failed to process request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}