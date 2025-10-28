"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Icons } from "@/components/icons"
import { ProjectStructure, GeneratedFile } from "./types/chat-types"

interface ProjectStructureViewProps {
  project: ProjectStructure
  onFileSelect?: (file: GeneratedFile) => void
  onRefineComponent?: (componentPath: string, componentType: string) => void
  className?: string
}

export function ProjectStructureView({ 
  project, 
  onFileSelect, 
  onRefineComponent,
  className 
}: ProjectStructureViewProps) {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set(['contracts', 'components', 'api']))

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileIcon = (file: GeneratedFile) => {
    switch (file.type) {
      case 'contract':
        return <Icons.code className="h-4 w-4 text-blue-500" />
      case 'component':
        return <Icons.component className="h-4 w-4 text-green-500" />
      case 'api':
        return <Icons.server className="h-4 w-4 text-purple-500" />
      case 'config':
        return <Icons.settings className="h-4 w-4 text-orange-500" />
      case 'documentation':
        return <Icons.fileText className="h-4 w-4 text-gray-500" />
      default:
        return <Icons.file className="h-4 w-4 text-gray-400" />
    }
  }

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'component': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'api': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'config': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'documentation': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  // Group files by directory structure
  const groupedFiles = React.useMemo(() => {
    const groups: Record<string, GeneratedFile[]> = {
      contracts: [],
      components: [],
      api: [],
      config: [],
      docs: []
    }

    project.files.forEach(file => {
      if (file.path.includes('/contracts/') || file.path.endsWith('.cdc')) {
        groups.contracts.push(file)
      } else if (file.path.includes('/components/') || file.path.includes('/pages/')) {
        groups.components.push(file)
      } else if (file.path.includes('/api/')) {
        groups.api.push(file)
      } else if (file.path.includes('config') || file.path.includes('.json') || file.path.includes('.js')) {
        groups.config.push(file)
      } else if (file.path.includes('README') || file.path.includes('.md')) {
        groups.docs.push(file)
      }
    })

    return groups
  }, [project.files])

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{project.framework}</Badge>
            <Badge variant="secondary">{project.totalFiles} files</Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Size: {project.estimatedSize}</span>
          <span>Dependencies: {project.dependencies.length}</span>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {Object.entries(groupedFiles).map(([folder, files]) => {
              if (files.length === 0) return null
              
              const isExpanded = expandedFolders.has(folder)
              
              return (
                <Collapsible key={folder} open={isExpanded} onOpenChange={() => toggleFolder(folder)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <Icons.chevronDown className="h-4 w-4" />
                        ) : (
                          <Icons.chevronRight className="h-4 w-4" />
                        )}
                        <Icons.folder className="h-4 w-4 text-blue-600" />
                        <span className="font-medium capitalize">{folder}</span>
                        <Badge variant="outline" className="ml-auto">
                          {files.length}
                        </Badge>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="ml-6 mt-1 space-y-1">
                    {files.map((file, index) => (
                      <div
                        key={`${folder}-${index}`}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group"
                      >
                        <div 
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => onFileSelect?.(file)}
                        >
                          {getFileIcon(file)}
                          <span className="text-sm font-mono truncate">
                            {file.path.split('/').pop()}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getFileTypeColor(file.type)}`}
                          >
                            {file.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => onRefineComponent?.(file.path, file.type)}
                            title="Refine this component"
                          >
                            <Icons.edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => onFileSelect?.(file)}
                            title="View file"
                          >
                            <Icons.eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}