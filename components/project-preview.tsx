"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { ProjectStructure, GeneratedFile } from "@/components/types/chat-types"

interface ProjectPreviewProps {
  project: ProjectStructure | null
  onFileSelect?: (file: GeneratedFile) => void
  onFileEdit?: (file: GeneratedFile, newContent: string) => void
  onProjectExport?: (project: ProjectStructure) => void
  onProjectDeploy?: (project: ProjectStructure) => void
}

export function ProjectPreview({ 
  project, 
  onFileSelect, 
  onFileEdit, 
  onProjectExport, 
  onProjectDeploy 
}: ProjectPreviewProps) {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['contracts', 'components', 'api']))
  const [activeTab, setActiveTab] = useState("structure")

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!project || !searchQuery) return project?.files || []
    
    return project.files.filter(file => 
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [project?.files, searchQuery])

  // Group files by directory structure
  const fileTree = useMemo(() => {
    if (!project) return {}
    
    const tree: Record<string, GeneratedFile[]> = {}
    const filesToProcess = searchQuery ? filteredFiles : project.files
    
    filesToProcess.forEach(file => {
      const pathParts = file.path.split('/')
      const directory = pathParts.length > 1 ? pathParts[0] : 'root'
      
      if (!tree[directory]) tree[directory] = []
      tree[directory].push(file)
    })
    
    return tree
  }, [project, filteredFiles, searchQuery])

  const handleFileSelect = (file: GeneratedFile) => {
    setSelectedFile(file)
    onFileSelect?.(file)
  }

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName)
    } else {
      newExpanded.add(folderName)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileIcon = (file: GeneratedFile) => {
    switch (file.type) {
      case 'contract': return <Icons.code className="h-4 w-4 text-blue-500" />
      case 'component': return <Icons.layout className="h-4 w-4 text-green-500" />
      case 'api': return <Icons.server className="h-4 w-4 text-orange-500" />
      case 'config': return <Icons.settings className="h-4 w-4 text-gray-500" />
      case 'documentation': return <Icons.fileText className="h-4 w-4 text-purple-500" />
      default: return <Icons.file className="h-4 w-4" />
    }
  }

  const getFolderIcon = (folderName: string) => {
    switch (folderName) {
      case 'contracts': return <Icons.code className="h-4 w-4 text-blue-500" />
      case 'components': return <Icons.layout className="h-4 w-4 text-green-500" />
      case 'api': return <Icons.server className="h-4 w-4 text-orange-500" />
      case 'config': return <Icons.settings className="h-4 w-4 text-gray-500" />
      case 'docs': return <Icons.fileText className="h-4 w-4 text-purple-500" />
      default: return <Icons.folder className="h-4 w-4" />
    }
  }

  const getProjectStats = () => {
    if (!project) return null
    
    const stats = project.files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return stats
  }

  if (!project) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <Icons.folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
          <p className="text-muted-foreground">
            Generate a full-stack project in the chat to see it here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icons.folder className="h-5 w-5" />
                {project.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onProjectExport?.(project)}
              >
                <Icons.download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm"
                onClick={() => onProjectDeploy?.(project)}
              >
                <Icons.rocket className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{project.totalFiles} files</span>
            <span>{project.estimatedSize}</span>
            <span>{project.framework}</span>
            <Badge variant="secondary">{project.dependencies.length} dependencies</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="structure">File Structure</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0">
            <TabsContent value="structure" className="flex-1 flex flex-col mt-0">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* File Tree */}
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {Object.entries(fileTree).map(([folderName, files]) => (
                    <Collapsible
                      key={folderName}
                      open={expandedFolders.has(folderName)}
                      onOpenChange={() => toggleFolder(folderName)}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50 transition-colors">
                        <Icons.chevronRight className={`h-4 w-4 transition-transform ${expandedFolders.has(folderName) ? 'rotate-90' : ''}`} />
                        {getFolderIcon(folderName)}
                        <span className="font-medium">{folderName}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {files.length}
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-6 mt-1 space-y-1">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                              selectedFile?.path === file.path 
                                ? 'bg-primary/10 border border-primary/20' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleFileSelect(file)}
                          >
                            {getFileIcon(file)}
                            <span className="text-sm font-mono flex-1 truncate">
                              {file.path.split('/').pop()}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {file.language}
                              </Badge>
                              <span>{Math.round(file.size / 1024)}KB</span>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="overview" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {/* Project Statistics */}
                  <div>
                    <h3 className="font-semibold mb-3">Project Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(getProjectStats() || {}).map(([type, count]) => (
                        <Card key={type} className="p-3">
                          <div className="flex items-center gap-2">
                            {getFileIcon({ type, path: '', language: '', size: 0 })}
                            <div>
                              <p className="font-medium capitalize">{type}s</p>
                              <p className="text-2xl font-bold">{count}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Recent Files */}
                  <div>
                    <h3 className="font-semibold mb-3">All Files</h3>
                    <div className="space-y-2">
                      {project.files.slice(0, 10).map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded border bg-background/50 hover:bg-background cursor-pointer transition-colors"
                          onClick={() => handleFileSelect(file)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(file)}
                            <span className="text-sm font-mono truncate">{file.path}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {file.language}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(file.size / 1024)}KB
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dependencies" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Dependencies</h3>
                    {project.dependencies.length > 0 ? (
                      <div className="space-y-2">
                        {project.dependencies.map((dep, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded border">
                            <span className="font-mono text-sm">{dep}</span>
                            <Badge variant="outline">npm</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No external dependencies</p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Framework Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded border">
                        <span>Framework</span>
                        <Badge>{project.framework}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded border">
                        <span>Total Files</span>
                        <Badge variant="outline">{project.totalFiles}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded border">
                        <span>Estimated Size</span>
                        <Badge variant="outline">{project.estimatedSize}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}