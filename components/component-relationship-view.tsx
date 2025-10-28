"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icons } from "@/components/icons"
import { ProjectStructure, GeneratedFile } from "@/components/types/chat-types"

interface ComponentRelationshipViewProps {
  project: ProjectStructure | null
  onComponentSelect?: (componentPath: string) => void
}

interface ComponentNode {
  id: string
  name: string
  type: 'contract' | 'component' | 'api' | 'config'
  file: GeneratedFile
  dependencies: string[]
  dependents: string[]
  interactions: ComponentInteraction[]
}

interface ComponentInteraction {
  type: 'imports' | 'calls' | 'extends' | 'implements' | 'uses'
  target: string
  description: string
}

export function ComponentRelationshipView({ project, onComponentSelect }: ComponentRelationshipViewProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentNode | null>(null)
  const [viewMode, setViewMode] = useState<'graph' | 'list' | 'matrix'>('graph')

  // Analyze component relationships
  const componentNodes = useMemo(() => {
    if (!project) return []

    const nodes: ComponentNode[] = project.files.map(file => {
      const dependencies = analyzeFileDependencies(file)
      const interactions = analyzeFileInteractions(file, project.files)
      
      return {
        id: file.path,
        name: file.path.split('/').pop() || file.path,
        type: file.type,
        file,
        dependencies,
        dependents: [], // Will be calculated below
        interactions
      }
    })

    // Calculate dependents (reverse dependencies)
    nodes.forEach(node => {
      node.dependencies.forEach(depPath => {
        const dependent = nodes.find(n => n.id === depPath)
        if (dependent) {
          dependent.dependents.push(node.id)
        }
      })
    })

    return nodes
  }, [project])

  // Group components by type for better visualization
  const componentsByType = useMemo(() => {
    return componentNodes.reduce((acc, node) => {
      if (!acc[node.type]) acc[node.type] = []
      acc[node.type].push(node)
      return acc
    }, {} as Record<string, ComponentNode[]>)
  }, [componentNodes])

  const handleComponentSelect = (node: ComponentNode) => {
    setSelectedComponent(node)
    onComponentSelect?.(node.id)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-500'
      case 'component': return 'bg-green-500'
      case 'api': return 'bg-orange-500'
      case 'config': return 'bg-gray-500'
      default: return 'bg-purple-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract': return <Icons.code className="h-4 w-4" />
      case 'component': return <Icons.layout className="h-4 w-4" />
      case 'api': return <Icons.server className="h-4 w-4" />
      case 'config': return <Icons.settings className="h-4 w-4" />
      default: return <Icons.file className="h-4 w-4" />
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'imports': return <Icons.download className="h-3 w-3" />
      case 'calls': return <Icons.zap className="h-3 w-3" />
      case 'extends': return <Icons.chevronRight className="h-3 w-3" />
      case 'implements': return <Icons.check className="h-3 w-3" />
      case 'uses': return <Icons.link className="h-3 w-3" />
      default: return <Icons.link className="h-3 w-3" />
    }
  }

  if (!project) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <Icons.link className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Relationships to Show</h3>
          <p className="text-muted-foreground">
            Generate a full-stack project to see component relationships
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icons.link className="h-5 w-5" />
              Component Relationships
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'graph' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('graph')}
              >
                Graph
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('matrix')}
              >
                Matrix
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 flex gap-4">
        {/* Main View */}
        <Card className="flex-1">
          <CardContent className="p-4 h-full">
            {viewMode === 'graph' && (
              <GraphView 
                componentsByType={componentsByType}
                selectedComponent={selectedComponent}
                onComponentSelect={handleComponentSelect}
                getTypeColor={getTypeColor}
                getTypeIcon={getTypeIcon}
              />
            )}
            {viewMode === 'list' && (
              <ListView 
                componentNodes={componentNodes}
                selectedComponent={selectedComponent}
                onComponentSelect={handleComponentSelect}
                getTypeIcon={getTypeIcon}
              />
            )}
            {viewMode === 'matrix' && (
              <MatrixView 
                componentNodes={componentNodes}
                onComponentSelect={handleComponentSelect}
              />
            )}
          </CardContent>
        </Card>

        {/* Details Panel */}
        {selectedComponent && (
          <Card className="w-80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getTypeIcon(selectedComponent.type)}
                {selectedComponent.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">File Info</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="outline">{selectedComponent.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Language:</span>
                    <Badge variant="outline">{selectedComponent.file.language}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{Math.round(selectedComponent.file.size / 1024)}KB</span>
                  </div>
                </div>
              </div>

              {selectedComponent.dependencies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Dependencies ({selectedComponent.dependencies.length})</h4>
                  <ScrollArea className="h-24">
                    <div className="space-y-1">
                      {selectedComponent.dependencies.map((dep, index) => (
                        <div key={index} className="text-xs p-1 rounded bg-muted font-mono">
                          {dep}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {selectedComponent.dependents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Used By ({selectedComponent.dependents.length})</h4>
                  <ScrollArea className="h-24">
                    <div className="space-y-1">
                      {selectedComponent.dependents.map((dep, index) => (
                        <div key={index} className="text-xs p-1 rounded bg-muted font-mono">
                          {dep}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {selectedComponent.interactions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Interactions</h4>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {selectedComponent.interactions.map((interaction, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          {getInteractionIcon(interaction.type)}
                          <div>
                            <div className="font-medium">{interaction.type}</div>
                            <div className="text-muted-foreground">{interaction.target}</div>
                            <div className="text-muted-foreground">{interaction.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Graph View Component
interface GraphViewProps {
  componentsByType: Record<string, ComponentNode[]>
  selectedComponent: ComponentNode | null
  onComponentSelect: (node: ComponentNode) => void
  getTypeColor: (type: string) => string
  getTypeIcon: (type: string) => React.ReactNode
}

function GraphView({ componentsByType, selectedComponent, onComponentSelect, getTypeColor, getTypeIcon }: GraphViewProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-6">
        {Object.entries(componentsByType).map(([type, nodes]) => (
          <div key={type} className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 capitalize">
              {getTypeIcon(type)}
              {type}s ({nodes.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedComponent?.id === node.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onComponentSelect(node)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getTypeColor(node.type)}`} />
                    <span className="font-medium text-sm truncate">{node.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Deps: {node.dependencies.length}</div>
                    <div>Used by: {node.dependents.length}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// List View Component
interface ListViewProps {
  componentNodes: ComponentNode[]
  selectedComponent: ComponentNode | null
  onComponentSelect: (node: ComponentNode) => void
  getTypeIcon: (type: string) => React.ReactNode
}

function ListView({ componentNodes, selectedComponent, onComponentSelect, getTypeIcon }: ListViewProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-2">
        {componentNodes.map(node => (
          <div
            key={node.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedComponent?.id === node.id 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:bg-muted/50'
            }`}
            onClick={() => onComponentSelect(node)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTypeIcon(node.type)}
                <div>
                  <div className="font-medium">{node.name}</div>
                  <div className="text-sm text-muted-foreground">{node.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Deps: {node.dependencies.length}</span>
                <span>Used: {node.dependents.length}</span>
                <Badge variant="outline">{node.type}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// Matrix View Component
interface MatrixViewProps {
  componentNodes: ComponentNode[]
  onComponentSelect: (node: ComponentNode) => void
}

function MatrixView({ componentNodes, onComponentSelect }: MatrixViewProps) {
  const matrix = useMemo(() => {
    const size = componentNodes.length
    const grid = Array(size).fill(null).map(() => Array(size).fill(0))
    
    componentNodes.forEach((node, i) => {
      node.dependencies.forEach(dep => {
        const depIndex = componentNodes.findIndex(n => n.id === dep)
        if (depIndex !== -1) {
          grid[i][depIndex] = 1
        }
      })
    })
    
    return grid
  }, [componentNodes])

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Dependency matrix: rows depend on columns
        </div>
        <div className="overflow-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-32"></th>
                {componentNodes.map((node, index) => (
                  <th key={index} className="w-8 h-8 text-xs p-1 border">
                    <div className="transform -rotate-45 origin-center">
                      {index + 1}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {componentNodes.map((node, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="text-xs p-2 border font-medium truncate max-w-32">
                    <button
                      onClick={() => onComponentSelect(node)}
                      className="text-left hover:text-primary"
                    >
                      {rowIndex + 1}. {node.name}
                    </button>
                  </td>
                  {matrix[rowIndex].map((cell, colIndex) => (
                    <td key={colIndex} className="w-8 h-8 border text-center">
                      {cell === 1 && (
                        <div className="w-4 h-4 bg-primary rounded-full mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollArea>
  )
}

// Helper functions for analyzing file dependencies and interactions
function analyzeFileDependencies(file: GeneratedFile): string[] {
  // This is a simplified analysis - in a real implementation, 
  // this would parse the file content to extract actual imports/dependencies
  const dependencies: string[] = []
  
  if (file.preview) {
    // Look for common import patterns
    const importMatches = file.preview.match(/import.*from\s+['"]([^'"]+)['"]/g)
    if (importMatches) {
      importMatches.forEach(match => {
        const pathMatch = match.match(/from\s+['"]([^'"]+)['"]/)
        if (pathMatch && pathMatch[1].startsWith('./') || pathMatch[1].startsWith('../')) {
          dependencies.push(pathMatch[1])
        }
      })
    }
  }
  
  return dependencies
}

function analyzeFileInteractions(file: GeneratedFile, allFiles: GeneratedFile[]): ComponentInteraction[] {
  // This is a simplified analysis - in a real implementation,
  // this would perform deeper code analysis
  const interactions: ComponentInteraction[] = []
  
  if (file.preview) {
    // Look for function calls, API calls, etc.
    if (file.type === 'component' && file.preview.includes('fetch(')) {
      interactions.push({
        type: 'calls',
        target: 'API endpoints',
        description: 'Makes HTTP requests to backend APIs'
      })
    }
    
    if (file.type === 'api' && file.preview.includes('contract')) {
      interactions.push({
        type: 'uses',
        target: 'Smart contracts',
        description: 'Interacts with blockchain contracts'
      })
    }
  }
  
  return interactions
}