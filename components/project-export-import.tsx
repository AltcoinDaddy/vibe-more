"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/icons"
import { ProjectStructure, GeneratedFile } from "@/components/types/chat-types"

interface ExportOptions {
  includeContracts: boolean
  includeComponents: boolean
  includeAPI: boolean
  includeConfigurations: boolean
  includeDocumentation: boolean
  format: 'zip' | 'json' | 'github'
  compression: 'none' | 'gzip' | 'brotli'
  includeMetadata: boolean
}

interface ImportOptions {
  source: 'file' | 'url' | 'github'
  overwriteExisting: boolean
  validateStructure: boolean
  preserveIds: boolean
}

interface ProjectExportImportProps {
  project?: ProjectStructure
  onProjectExport?: (project: ProjectStructure, options: ExportOptions) => void
  onProjectImport?: (projectData: any, options: ImportOptions) => void
  onExportComplete?: (exportData: any) => void
  onImportComplete?: (project: ProjectStructure) => void
}

export function ProjectExportImport({
  project,
  onProjectExport,
  onProjectImport,
  onExportComplete,
  onImportComplete
}: ProjectExportImportProps) {
  const [activeTab, setActiveTab] = useState("export")
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeContracts: true,
    includeComponents: true,
    includeAPI: true,
    includeConfigurations: true,
    includeDocumentation: true,
    format: 'zip',
    compression: 'gzip',
    includeMetadata: true
  })
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    source: 'file',
    overwriteExisting: false,
    validateStructure: true,
    preserveIds: true
  })
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [githubRepo, setGithubRepo] = useState("")

  const handleExport = async () => {
    if (!project) return

    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate export process
      const steps = [
        { message: 'Preparing project data...', progress: 20 },
        { message: 'Processing contracts...', progress: 40 },
        { message: 'Processing components...', progress: 60 },
        { message: 'Compressing files...', progress: 80 },
        { message: 'Finalizing export...', progress: 100 }
      ]

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setExportProgress(step.progress)
      }

      // Create export data
      const exportData = createExportData(project, exportOptions)
      
      // Download the file
      downloadExportFile(exportData, exportOptions.format)
      
      onProjectExport?.(project, exportOptions)
      onExportComplete?.(exportData)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const handleImport = async (source: 'file' | 'url' | 'github', data?: any) => {
    setIsImporting(true)
    setImportProgress(0)

    try {
      let projectData

      if (source === 'file' && data) {
        projectData = data
      } else if (source === 'url' && importUrl) {
        // Simulate URL import
        projectData = await fetchProjectFromUrl(importUrl)
      } else if (source === 'github' && githubRepo) {
        // Simulate GitHub import
        projectData = await fetchProjectFromGithub(githubRepo)
      }

      if (!projectData) {
        throw new Error('No project data available')
      }

      // Simulate import process
      const steps = [
        { message: 'Validating project structure...', progress: 20 },
        { message: 'Processing contracts...', progress: 40 },
        { message: 'Processing components...', progress: 60 },
        { message: 'Setting up configurations...', progress: 80 },
        { message: 'Finalizing import...', progress: 100 }
      ]

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setImportProgress(step.progress)
      }

      const importedProject = processImportedProject(projectData, importOptions)
      
      onProjectImport?.(projectData, importOptions)
      onImportComplete?.(importedProject)
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed: ' + (error as Error).message)
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target?.result as string)
          handleImport('file', projectData)
        } catch (error) {
          alert('Invalid project file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const getExportSize = () => {
    if (!project) return '0 KB'
    
    let totalSize = 0
    if (exportOptions.includeContracts) totalSize += project.files.filter(f => f.type === 'contract').reduce((sum, f) => sum + f.size, 0)
    if (exportOptions.includeComponents) totalSize += project.files.filter(f => f.type === 'component').reduce((sum, f) => sum + f.size, 0)
    if (exportOptions.includeAPI) totalSize += project.files.filter(f => f.type === 'api').reduce((sum, f) => sum + f.size, 0)
    if (exportOptions.includeConfigurations) totalSize += project.files.filter(f => f.type === 'config').reduce((sum, f) => sum + f.size, 0)
    if (exportOptions.includeDocumentation) totalSize += project.files.filter(f => f.type === 'documentation').reduce((sum, f) => sum + f.size, 0)
    
    return `${Math.round(totalSize / 1024)} KB`
  }

  const getIncludedFilesCount = () => {
    if (!project) return 0
    
    let count = 0
    if (exportOptions.includeContracts) count += project.files.filter(f => f.type === 'contract').length
    if (exportOptions.includeComponents) count += project.files.filter(f => f.type === 'component').length
    if (exportOptions.includeAPI) count += project.files.filter(f => f.type === 'api').length
    if (exportOptions.includeConfigurations) count += project.files.filter(f => f.type === 'config').length
    if (exportOptions.includeDocumentation) count += project.files.filter(f => f.type === 'documentation').length
    
    return count
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Icons.package className="h-5 w-5" />
            Project Export & Import
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Export your projects for sharing or backup, and import projects from various sources
          </p>
        </CardHeader>
      </Card>

      <Card className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">Export Project</TabsTrigger>
              <TabsTrigger value="import">Import Project</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0">
            <TabsContent value="export" className="flex-1 flex flex-col mt-0">
              {project ? (
                <div className="space-y-6">
                  {/* Project Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Project Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-mono">{project.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Framework:</span>
                          <span>{project.framework}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Files:</span>
                          <span>{project.totalFiles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size:</span>
                          <span>{project.estimatedSize}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Options */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Export Options</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {/* File Type Selection */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Include File Types</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'includeContracts', label: 'Smart Contracts', count: project.files.filter(f => f.type === 'contract').length },
                            { key: 'includeComponents', label: 'React Components', count: project.files.filter(f => f.type === 'component').length },
                            { key: 'includeAPI', label: 'API Routes', count: project.files.filter(f => f.type === 'api').length },
                            { key: 'includeConfigurations', label: 'Configuration Files', count: project.files.filter(f => f.type === 'config').length },
                            { key: 'includeDocumentation', label: 'Documentation', count: project.files.filter(f => f.type === 'documentation').length }
                          ].map(({ key, label, count }) => (
                            <div key={key} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <Label className="font-medium">{label}</Label>
                                <p className="text-xs text-muted-foreground">{count} files</p>
                              </div>
                              <Switch
                                checked={exportOptions[key as keyof ExportOptions] as boolean}
                                onCheckedChange={(checked) => 
                                  setExportOptions(prev => ({ ...prev, [key]: checked }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Format and Compression */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="export-format">Export Format</Label>
                          <Select
                            value={exportOptions.format}
                            onValueChange={(value) => 
                              setExportOptions(prev => ({ ...prev, format: value as ExportOptions['format'] }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="zip">ZIP Archive</SelectItem>
                              <SelectItem value="json">JSON File</SelectItem>
                              <SelectItem value="github">GitHub Repository</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="compression">Compression</Label>
                          <Select
                            value={exportOptions.compression}
                            onValueChange={(value) => 
                              setExportOptions(prev => ({ ...prev, compression: value as ExportOptions['compression'] }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="gzip">GZIP</SelectItem>
                              <SelectItem value="brotli">Brotli</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Additional Options */}
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <Label className="font-medium">Include Metadata</Label>
                          <p className="text-xs text-muted-foreground">Project settings and configuration</p>
                        </div>
                        <Switch
                          checked={exportOptions.includeMetadata}
                          onCheckedChange={(checked) => 
                            setExportOptions(prev => ({ ...prev, includeMetadata: checked }))
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Export Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{getIncludedFilesCount()}</p>
                          <p className="text-sm text-muted-foreground">Files</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{getExportSize()}</p>
                          <p className="text-sm text-muted-foreground">Size</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{exportOptions.format.toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">Format</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Progress */}
                  {isExporting && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Exporting project...</span>
                            <span>{exportProgress}%</span>
                          </div>
                          <Progress value={exportProgress} />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Export Button */}
                  <Button 
                    onClick={handleExport} 
                    disabled={isExporting || getIncludedFilesCount() === 0}
                    className="w-full"
                    size="lg"
                  >
                    {isExporting ? (
                      <>
                        <Icons.loader className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Icons.download className="h-4 w-4 mr-2" />
                        Export Project
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Icons.package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Project Selected</h3>
                    <p className="text-muted-foreground">
                      Select a project to export its files and configuration
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="import" className="flex-1 flex flex-col mt-0">
              <div className="space-y-6">
                {/* Import Source Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Import Source</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Tabs value={importOptions.source} onValueChange={(value) => 
                      setImportOptions(prev => ({ ...prev, source: value as ImportOptions['source'] }))
                    }>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="file">File Upload</TabsTrigger>
                        <TabsTrigger value="url">URL Import</TabsTrigger>
                        <TabsTrigger value="github">GitHub Repo</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-4">
                        <TabsContent value="file" className="mt-0">
                          <div className="space-y-4">
                            <Alert>
                              <Icons.info className="h-4 w-4" />
                              <AlertDescription>
                                Upload a project file (JSON or ZIP) exported from VibeMore or compatible tools.
                              </AlertDescription>
                            </Alert>
                            <div>
                              <Label htmlFor="import-file">Select Project File</Label>
                              <Input
                                id="import-file"
                                type="file"
                                accept=".json,.zip"
                                onChange={handleFileImport}
                                disabled={isImporting}
                                className="mt-2"
                              />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="url" className="mt-0">
                          <div className="space-y-4">
                            <Alert>
                              <Icons.info className="h-4 w-4" />
                              <AlertDescription>
                                Import a project from a direct URL to a project file or API endpoint.
                              </AlertDescription>
                            </Alert>
                            <div>
                              <Label htmlFor="import-url">Project URL</Label>
                              <Input
                                id="import-url"
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                placeholder="https://example.com/project.json"
                                disabled={isImporting}
                                className="mt-2"
                              />
                            </div>
                            <Button 
                              onClick={() => handleImport('url')}
                              disabled={!importUrl || isImporting}
                              className="w-full"
                            >
                              <Icons.link className="h-4 w-4 mr-2" />
                              Import from URL
                            </Button>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="github" className="mt-0">
                          <div className="space-y-4">
                            <Alert>
                              <Icons.info className="h-4 w-4" />
                              <AlertDescription>
                                Import a project directly from a GitHub repository.
                              </AlertDescription>
                            </Alert>
                            <div>
                              <Label htmlFor="github-repo">GitHub Repository</Label>
                              <Input
                                id="github-repo"
                                value={githubRepo}
                                onChange={(e) => setGithubRepo(e.target.value)}
                                placeholder="username/repository-name"
                                disabled={isImporting}
                                className="mt-2"
                              />
                            </div>
                            <Button 
                              onClick={() => handleImport('github')}
                              disabled={!githubRepo || isImporting}
                              className="w-full"
                            >
                              <Icons.github className="h-4 w-4 mr-2" />
                              Import from GitHub
                            </Button>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Import Options */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Import Options</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {[
                        { key: 'overwriteExisting', label: 'Overwrite Existing Files', description: 'Replace files with the same name' },
                        { key: 'validateStructure', label: 'Validate Project Structure', description: 'Check project integrity before import' },
                        { key: 'preserveIds', label: 'Preserve File IDs', description: 'Keep original file identifiers' }
                      ].map(({ key, label, description }) => (
                        <div key={key} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <Label className="font-medium">{label}</Label>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                          <Switch
                            checked={importOptions[key as keyof ImportOptions] as boolean}
                            onCheckedChange={(checked) => 
                              setImportOptions(prev => ({ ...prev, [key]: checked }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Import Progress */}
                {isImporting && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Importing project...</span>
                          <span>{importProgress}%</span>
                        </div>
                        <Progress value={importProgress} />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}

// Helper functions
function createExportData(project: ProjectStructure, options: ExportOptions) {
  const exportData: any = {
    metadata: {
      name: project.name,
      description: project.description,
      framework: project.framework,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    },
    files: []
  }

  // Filter files based on options
  project.files.forEach(file => {
    let include = false
    
    if (options.includeContracts && file.type === 'contract') include = true
    if (options.includeComponents && file.type === 'component') include = true
    if (options.includeAPI && file.type === 'api') include = true
    if (options.includeConfigurations && file.type === 'config') include = true
    if (options.includeDocumentation && file.type === 'documentation') include = true
    
    if (include) {
      exportData.files.push(file)
    }
  })

  if (options.includeMetadata) {
    exportData.dependencies = project.dependencies
    exportData.configuration = {
      totalFiles: project.totalFiles,
      estimatedSize: project.estimatedSize
    }
  }

  return exportData
}

function downloadExportFile(data: any, format: string) {
  const filename = `${data.metadata.name}-export.${format === 'zip' ? 'zip' : 'json'}`
  const content = JSON.stringify(data, null, 2)
  
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function fetchProjectFromUrl(url: string): Promise<any> {
  // Simulate URL fetch
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    metadata: { name: 'imported-project', description: 'Imported from URL' },
    files: []
  }
}

async function fetchProjectFromGithub(repo: string): Promise<any> {
  // Simulate GitHub fetch
  await new Promise(resolve => setTimeout(resolve, 1500))
  return {
    metadata: { name: repo.split('/')[1], description: 'Imported from GitHub' },
    files: []
  }
}

function processImportedProject(data: any, options: ImportOptions): ProjectStructure {
  return {
    name: data.metadata.name,
    description: data.metadata.description || 'Imported project',
    framework: data.metadata.framework || 'Next.js',
    files: data.files || [],
    dependencies: data.dependencies || [],
    totalFiles: data.files?.length || 0,
    estimatedSize: data.configuration?.estimatedSize || '0 KB'
  }
}