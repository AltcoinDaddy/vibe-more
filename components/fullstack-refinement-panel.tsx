"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Icons } from "@/components/icons"
import { ComponentRefinementDialog } from "@/components/component-refinement-dialog"
import { ComponentRefinementRequest } from "@/components/types/chat-types"

/**
 * Full-stack project structure for refinement
 */
interface FullStackProject {
  name: string
  description: string
  files: ProjectFile[]
  dependencies: string[]
  lastModified: Date
  version: string
}

/**
 * Individual file in the project
 */
interface ProjectFile {
  path: string
  type: 'contract' | 'component' | 'api' | 'config' | 'type'
  size: number
  lastModified: Date
  canRefine: boolean
  hasIssues: boolean
  dependencies: string[]
}

/**
 * Refinement operation status
 */
interface RefinementOperation {
  id: string
  componentPath: string
  componentType: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress: number
  description: string
  startTime: Date
  endTime?: Date
  result?: RefinementResult
}

/**
 * Result of a refinement operation
 */
interface RefinementResult {
  success: boolean
  updatedCode: string
  affectedFiles: string[]
  integrationUpdates: number
  consistencyIssues: number
  warnings: string[]
  suggestions: string[]
}

/**
 * Props for the FullStackRefinementPanel
 */
interface FullStackRefinementPanelProps {
  project: FullStackProject | null
  onProjectLoad: (projectFiles: Map<string, string>) => void
  onFileSelect: (filePath: string, fileType: string) => void
  onRefinementComplete: (result: RefinementResult) => void
}

/**
 * Full-stack refinement panel for managing iterative improvements
 * Supports component-specific refinement and project-wide consistency
 */
export function FullStackRefinementPanel({
  project,
  onProjectLoad,
  onFileSelect,
  onRefinementComplete
}: FullStackRefinementPanelProps) {
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [showRefinementDialog, setShowRefinementDialog] = useState(false)
  const [activeOperations, setActiveOperations] = useState<RefinementOperation[]>([])
  const [showProjectStructure, setShowProjectStructure] = useState(true)
  const [showOperations, setShowOperations] = useState(false)
  const [consistencyStatus, setConsistencyStatus] = useState<{
    isConsistent: boolean
    issues: number
    warnings: number
    lastCheck: Date
  } | null>(null)

  /**
   * Handle file selection for refinement
   */
  const handleFileSelect = useCallback((file: ProjectFile) => {
    setSelectedFile(file)
    onFileSelect(file.path, file.type)
    
    if (file.canRefine) {
      setShowRefinementDialog(true)
    }
  }, [onFileSelect])

  /**
   * Handle refinement request submission
   */
  const handleRefinementSubmit = useCallback(async (request: ComponentRefinementRequest) => {
    if (!project || !selectedFile) return

    const operationId = `refinement-${Date.now()}`
    const operation: RefinementOperation = {
      id: operationId,
      componentPath: request.componentPath,
      componentType: request.componentType,
      status: 'pending',
      progress: 0,
      description: request.description,
      startTime: new Date()
    }

    setActiveOperations(prev => [...prev, operation])
    setShowOperations(true)

    try {
      // Update operation status
      setActiveOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, status: 'in-progress', progress: 10 }
            : op
        )
      )

      // Prepare project files for context
      const projectFiles: Record<string, string> = {}
      // This would be populated with actual file contents
      project.files.forEach(file => {
        projectFiles[file.path] = `// Content of ${file.path}`
      })

      // Prepare related files
      const relatedFiles = project.files
        .filter(f => selectedFile.dependencies.includes(f.path) || f.dependencies.includes(selectedFile.path))
        .map(f => ({
          path: f.path,
          type: f.type,
          content: projectFiles[f.path] || '',
          relationship: selectedFile.dependencies.includes(f.path) ? 'imports' as const : 'exports' as const
        }))

      // Update progress
      setActiveOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, progress: 30 }
            : op
        )
      )

      // Call refinement API
      const response = await fetch('/api/refine-component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          componentPath: request.componentPath,
          componentType: request.componentType,
          refinementType: request.refinementType,
          description: request.description,
          currentCode: projectFiles[request.componentPath] || '',
          relatedFiles,
          projectFiles,
          preserveIntegrations: true
        })
      })

      const result = await response.json()

      // Update progress
      setActiveOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, progress: 80 }
            : op
        )
      )

      if (result.success) {
        const refinementResult: RefinementResult = {
          success: true,
          updatedCode: result.refinement.updatedCode,
          affectedFiles: result.refinement.affectedFiles.map((f: any) => f.path),
          integrationUpdates: result.refinement.integrationUpdates.length,
          consistencyIssues: result.consistency?.issues.length || 0,
          warnings: result.refinement.warnings,
          suggestions: result.refinement.suggestions
        }

        // Update operation as completed
        setActiveOperations(prev => 
          prev.map(op => 
            op.id === operationId 
              ? { 
                  ...op, 
                  status: 'completed', 
                  progress: 100, 
                  endTime: new Date(),
                  result: refinementResult
                }
              : op
          )
        )

        // Update consistency status
        if (result.consistency) {
          setConsistencyStatus({
            isConsistent: result.consistency.isConsistent,
            issues: result.consistency.issues.length,
            warnings: result.consistency.warnings.length,
            lastCheck: new Date()
          })
        }

        onRefinementComplete(refinementResult)
      } else {
        // Update operation as failed
        setActiveOperations(prev => 
          prev.map(op => 
            op.id === operationId 
              ? { 
                  ...op, 
                  status: 'failed', 
                  progress: 0, 
                  endTime: new Date()
                }
              : op
          )
        )
      }

    } catch (error) {
      console.error('Refinement failed:', error)
      
      // Update operation as failed
      setActiveOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { 
                ...op, 
                status: 'failed', 
                progress: 0, 
                endTime: new Date()
              }
            : op
        )
      )
    }
  }, [project, selectedFile, onRefinementComplete])

  /**
   * Get file type icon
   */
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <Icons.code className="h-4 w-4 text-blue-500" />
      case 'component':
        return <Icons.component className="h-4 w-4 text-green-500" />
      case 'api':
        return <Icons.server className="h-4 w-4 text-purple-500" />
      case 'config':
        return <Icons.settings className="h-4 w-4 text-orange-500" />
      case 'type':
        return <Icons.file className="h-4 w-4 text-gray-400" />
      default:
        return <Icons.file className="h-4 w-4 text-gray-400" />
    }
  }

  /**
   * Get file type color
   */
  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'component': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'api': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'config': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'type': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  /**
   * Get operation status icon
   */
  const getOperationStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Icons.clock className="h-4 w-4 text-yellow-500" />
      case 'in-progress':
        return <Icons.loader className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <Icons.check className="h-4 w-4 text-green-500" />
      case 'failed':
        return <Icons.x className="h-4 w-4 text-red-500" />
      default:
        return <Icons.clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (!project) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.folder className="h-5 w-5" />
            Full-Stack Refinement
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Icons.folderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No project loaded</p>
            <p className="text-sm">Generate a full-stack project to start refining components</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Project Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icons.folder className="h-5 w-5" />
              {project.name}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              v{project.version}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icons.file className="h-3 w-3" />
              {project.files.length} files
            </span>
            <span className="flex items-center gap-1">
              <Icons.package className="h-3 w-3" />
              {project.dependencies.length} dependencies
            </span>
            <span className="flex items-center gap-1">
              <Icons.clock className="h-3 w-3" />
              {project.lastModified.toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Consistency Status */}
      {consistencyStatus && (
        <Alert className={consistencyStatus.isConsistent ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"}>
          <div className="flex items-center gap-2">
            {consistencyStatus.isConsistent ? (
              <Icons.check className="h-4 w-4 text-green-600" />
            ) : (
              <Icons.alertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription>
              {consistencyStatus.isConsistent ? (
                "Project is consistent"
              ) : (
                `${consistencyStatus.issues} issues, ${consistencyStatus.warnings} warnings found`
              )}
              <span className="text-xs text-muted-foreground ml-2">
                Last checked: {consistencyStatus.lastCheck.toLocaleTimeString()}
              </span>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Project Structure */}
      <Collapsible open={showProjectStructure} onOpenChange={setShowProjectStructure}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icons.folderTree className="h-5 w-5" />
                  Project Structure
                </span>
                <Icons.chevronDown className={`h-4 w-4 transition-transform ${showProjectStructure ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {project.files.map((file) => (
                    <div
                      key={file.path}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedFile?.path === file.path 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      {getFileTypeIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.path.split('/').pop()}</p>
                        <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={getFileTypeColor(file.type)} variant="secondary">
                          {file.type}
                        </Badge>
                        {file.hasIssues && (
                          <Icons.alertCircle className="h-3 w-3 text-yellow-500" />
                        )}
                        {file.canRefine && (
                          <Icons.edit className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Active Operations */}
      {activeOperations.length > 0 && (
        <Collapsible open={showOperations} onOpenChange={setShowOperations}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icons.activity className="h-5 w-5" />
                    Refinement Operations
                    <Badge variant="secondary">{activeOperations.length}</Badge>
                  </span>
                  <Icons.chevronDown className={`h-4 w-4 transition-transform ${showOperations ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CollapsibleTrigger>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {activeOperations.map((operation) => (
                      <div key={operation.id} className="p-3 border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getOperationStatusIcon(operation.status)}
                            <span className="text-sm font-medium">
                              {operation.componentPath.split('/').pop()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {operation.componentType}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {operation.status === 'completed' && operation.endTime
                              ? `${Math.round((operation.endTime.getTime() - operation.startTime.getTime()) / 1000)}s`
                              : `${Math.round((Date.now() - operation.startTime.getTime()) / 1000)}s`
                            }
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{operation.description}</p>
                        {operation.status === 'in-progress' && (
                          <Progress value={operation.progress} className="h-1" />
                        )}
                        {operation.result && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span>{operation.result.affectedFiles.length} files affected</span>
                            {operation.result.consistencyIssues > 0 && (
                              <span className="ml-2 text-yellow-600">
                                {operation.result.consistencyIssues} consistency issues
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Refinement Dialog */}
      <ComponentRefinementDialog
        open={showRefinementDialog}
        onOpenChange={setShowRefinementDialog}
        componentPath={selectedFile?.path || ''}
        componentType={selectedFile?.type || 'component'}
        onSubmit={handleRefinementSubmit}
      />
    </div>
  )
}