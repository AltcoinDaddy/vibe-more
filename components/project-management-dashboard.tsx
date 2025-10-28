"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/icons"
import { ProjectStructureView } from "@/components/project-structure-view"
import { FileBrowser } from "@/components/file-browser"
import { ProjectPreview } from "@/components/project-preview"
import { ProjectStructure, GeneratedFile } from "@/components/types/chat-types"

interface ProjectStatus {
  id: string
  name: string
  status: 'generating' | 'ready' | 'deploying' | 'deployed' | 'error'
  progress: number
  lastModified: Date
  deploymentUrl?: string
  errorMessage?: string
}

interface DeploymentStatus {
  projectId: string
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed'
  progress: number
  url?: string
  logs: string[]
  startTime: Date
  endTime?: Date
}

interface ProjectManagementDashboardProps {
  projects: ProjectStructure[]
  onProjectSelect?: (project: ProjectStructure) => void
  onFileEdit?: (file: GeneratedFile, newContent: string) => void
  onProjectDeploy?: (project: ProjectStructure) => void
  onProjectDelete?: (projectId: string) => void
  onProjectExport?: (project: ProjectStructure) => void
}

export function ProjectManagementDashboard({
  projects,
  onProjectSelect,
  onFileEdit,
  onProjectDeploy,
  onProjectDelete,
  onProjectExport
}: ProjectManagementDashboardProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectStructure | null>(null)
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null)
  const [projectStatuses, setProjectStatuses] = useState<Record<string, ProjectStatus>>({})
  const [deploymentStatuses, setDeploymentStatuses] = useState<Record<string, DeploymentStatus>>({})
  const [activeTab, setActiveTab] = useState("overview")

  // Initialize project statuses
  useEffect(() => {
    const statuses: Record<string, ProjectStatus> = {}
    projects.forEach(project => {
      if (!projectStatuses[project.name]) {
        statuses[project.name] = {
          id: project.name,
          name: project.name,
          status: 'ready',
          progress: 100,
          lastModified: new Date()
        }
      }
    })
    setProjectStatuses(prev => ({ ...prev, ...statuses }))
  }, [projects])

  const handleProjectSelect = (project: ProjectStructure) => {
    setSelectedProject(project)
    setSelectedFile(null)
    onProjectSelect?.(project)
  }

  const handleFileSelect = (file: GeneratedFile) => {
    setSelectedFile(file)
  }

  const handleProjectDeploy = async (project: ProjectStructure) => {
    // Update project status to deploying
    setProjectStatuses(prev => ({
      ...prev,
      [project.name]: {
        ...prev[project.name],
        status: 'deploying',
        progress: 0
      }
    }))

    // Initialize deployment status
    const deploymentId = `${project.name}-${Date.now()}`
    setDeploymentStatuses(prev => ({
      ...prev,
      [deploymentId]: {
        projectId: project.name,
        status: 'pending',
        progress: 0,
        logs: ['Starting deployment...'],
        startTime: new Date()
      }
    }))

    // Simulate deployment process
    simulateDeployment(project, deploymentId)
    
    onProjectDeploy?.(project)
  }

  const simulateDeployment = async (project: ProjectStructure, deploymentId: string) => {
    const steps = [
      { message: 'Building project...', progress: 20 },
      { message: 'Installing dependencies...', progress: 40 },
      { message: 'Compiling contracts...', progress: 60 },
      { message: 'Deploying to network...', progress: 80 },
      { message: 'Deployment complete!', progress: 100 }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setDeploymentStatuses(prev => ({
        ...prev,
        [deploymentId]: {
          ...prev[deploymentId],
          status: step.progress === 100 ? 'success' : 'building',
          progress: step.progress,
          logs: [...prev[deploymentId].logs, step.message],
          endTime: step.progress === 100 ? new Date() : undefined,
          url: step.progress === 100 ? `https://${project.name}.vercel.app` : undefined
        }
      }))

      setProjectStatuses(prev => ({
        ...prev,
        [project.name]: {
          ...prev[project.name],
          status: step.progress === 100 ? 'deployed' : 'deploying',
          progress: step.progress,
          deploymentUrl: step.progress === 100 ? `https://${project.name}.vercel.app` : undefined
        }
      }))
    }
  }

  const getStatusColor = (status: ProjectStatus['status']) => {
    switch (status) {
      case 'generating': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'deploying': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'deployed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: ProjectStatus['status']) => {
    switch (status) {
      case 'generating': return <Icons.loader className="h-4 w-4 animate-spin" />
      case 'ready': return <Icons.check className="h-4 w-4" />
      case 'deploying': return <Icons.upload className="h-4 w-4" />
      case 'deployed': return <Icons.globe className="h-4 w-4" />
      case 'error': return <Icons.alertCircle className="h-4 w-4" />
      default: return <Icons.folder className="h-4 w-4" />
    }
  }

  const activeDeployments = Object.values(deploymentStatuses).filter(
    deployment => deployment.status !== 'success' && deployment.status !== 'failed'
  )

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Dashboard Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icons.layout className="h-5 w-5" />
                Project Management Dashboard
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your full-stack dApp projects
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{projects.length} Projects</Badge>
              {activeDeployments.length > 0 && (
                <Badge variant="secondary">
                  {activeDeployments.length} Deploying
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Active Deployments Alert */}
      {activeDeployments.length > 0 && (
        <Alert>
          <Icons.upload className="h-4 w-4" />
          <AlertDescription>
            {activeDeployments.length} project{activeDeployments.length > 1 ? 's' : ''} currently deploying
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Content */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Project List Sidebar */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Projects</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {projects.map((project) => {
                    const status = projectStatuses[project.name]
                    return (
                      <div
                        key={project.name}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedProject?.name === project.name
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleProjectSelect(project)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate">{project.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {project.description}
                            </p>
                          </div>
                          {status && (
                            <Badge className={`ml-2 text-xs ${getStatusColor(status.status)}`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(status.status)}
                                {status.status}
                              </div>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{project.totalFiles} files</span>
                          <span>{project.framework}</span>
                        </div>
                        
                        {status && status.status === 'deploying' && (
                          <div className="mt-2">
                            <Progress value={status.progress} className="h-1" />
                          </div>
                        )}
                        
                        {status?.deploymentUrl && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(status.deploymentUrl, '_blank')
                              }}
                            >
                              <Icons.externalLink className="h-3 w-3 mr-1" />
                              View Live
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="col-span-8">
          {selectedProject ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{selectedProject.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedProject.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onProjectExport?.(selectedProject)}
                      >
                        <Icons.download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleProjectDeploy(selectedProject)}
                        disabled={projectStatuses[selectedProject.name]?.status === 'deploying'}
                      >
                        <Icons.rocket className="h-4 w-4 mr-2" />
                        Deploy
                      </Button>
                    </div>
                  </div>
                  <TabsList className="grid w-full grid-cols-4 mt-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="deployment">Deployment</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                </CardHeader>
              </Card>

              <div className="flex-1 mt-4">
                <TabsContent value="overview" className="h-full mt-0">
                  <ProjectPreview
                    project={selectedProject}
                    onFileSelect={handleFileSelect}
                    onFileEdit={onFileEdit}
                    onProjectExport={onProjectExport}
                    onProjectDeploy={handleProjectDeploy}
                  />
                </TabsContent>

                <TabsContent value="files" className="h-full mt-0">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <ProjectStructureView
                      project={selectedProject}
                      onFileSelect={handleFileSelect}
                      className="h-full"
                    />
                    <FileBrowser
                      file={selectedFile}
                      onFileEdit={onFileEdit}
                      onFileClose={() => setSelectedFile(null)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="deployment" className="h-full mt-0">
                  <DeploymentStatusView
                    project={selectedProject}
                    deploymentStatuses={deploymentStatuses}
                    onDeploy={() => handleProjectDeploy(selectedProject)}
                  />
                </TabsContent>

                <TabsContent value="settings" className="h-full mt-0">
                  <ProjectSettingsView
                    project={selectedProject}
                    onDelete={() => onProjectDelete?.(selectedProject.name)}
                    onExport={() => onProjectExport?.(selectedProject)}
                  />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <Icons.folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
                <p className="text-muted-foreground">
                  Choose a project from the sidebar to view its details and manage files
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Deployment Status View Component
interface DeploymentStatusViewProps {
  project: ProjectStructure
  deploymentStatuses: Record<string, DeploymentStatus>
  onDeploy: () => void
}

function DeploymentStatusView({ project, deploymentStatuses, onDeploy }: DeploymentStatusViewProps) {
  const projectDeployments = Object.values(deploymentStatuses).filter(
    deployment => deployment.projectId === project.name
  ).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

  const latestDeployment = projectDeployments[0]

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Deployment Status</CardTitle>
          <Button onClick={onDeploy} disabled={latestDeployment?.status === 'building'}>
            <Icons.rocket className="h-4 w-4 mr-2" />
            Deploy Now
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {latestDeployment && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Latest Deployment</CardTitle>
                    <Badge variant={latestDeployment.status === 'success' ? 'default' : 'secondary'}>
                      {latestDeployment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <Progress value={latestDeployment.progress} />
                    
                    {latestDeployment.url && (
                      <div className="flex items-center gap-2">
                        <Icons.globe className="h-4 w-4" />
                        <a
                          href={latestDeployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {latestDeployment.url}
                        </a>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Started: {latestDeployment.startTime.toLocaleString()}
                      {latestDeployment.endTime && (
                        <span className="ml-2">
                          Completed: {latestDeployment.endTime.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {latestDeployment && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Deployment Logs</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-muted/50 rounded p-3 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
                    {latestDeployment.logs.map((log, index) => (
                      <div key={index} className="text-muted-foreground">
                        {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {projectDeployments.length === 0 && (
              <div className="text-center py-8">
                <Icons.rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Deployments Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Deploy your project to see deployment history and status
                </p>
                <Button onClick={onDeploy}>
                  <Icons.rocket className="h-4 w-4 mr-2" />
                  Deploy Project
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Project Settings View Component
interface ProjectSettingsViewProps {
  project: ProjectStructure
  onDelete: () => void
  onExport: () => void
}

function ProjectSettingsView({ project, onDelete, onExport }: ProjectSettingsViewProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Project Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Project Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-mono">{project.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Framework:</span>
                <span className="text-sm">{project.framework}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Files:</span>
                <span className="text-sm">{project.totalFiles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Size:</span>
                <span className="text-sm">{project.estimatedSize}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={onExport}>
                <Icons.download className="h-4 w-4 mr-2" />
                Export Project
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={onDelete}>
                <Icons.trash className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}