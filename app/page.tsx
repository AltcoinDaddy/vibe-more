"use client"

import { useState, useEffect, useRef } from "react"
import { ChatPanel } from "@/components/chat-panel"
import { CodeEditor } from "@/components/code-editor"
import { ProjectPreview } from "@/components/project-preview"
import { ComponentRelationshipView } from "@/components/component-relationship-view"
import { FileBrowser } from "@/components/file-browser"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icons } from "@/components/icons"
import { useRouter } from "next/navigation"
import type { Template } from "@/lib/templates"
import { ProjectStructure, GeneratedFile } from "@/components/types/chat-types"

export default function Home() {
  const router = useRouter()
  const [generatedCode, setGeneratedCode] = useState<string>()
  const [currentProject, setCurrentProject] = useState<ProjectStructure | null>(null)
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [activeView, setActiveView] = useState<'editor' | 'project' | 'relationships'>('editor')
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedTemplate = localStorage.getItem("selectedTemplate")
    if (storedTemplate) {
      const template: Template = JSON.parse(storedTemplate)
      setGeneratedCode(template.code)
      setShowEditor(true)
      localStorage.removeItem("selectedTemplate")
    }
  }, [])

  const handleStartBuilding = () => {
    console.log("[v0] Start building button clicked")
    setShowEditor(true)
    console.log("[v0] Editor visibility set to true")

    // Scroll after a longer delay to ensure the editor is rendered
    setTimeout(() => {
      console.log("[v0] Attempting to scroll to editor")
      if (editorRef.current) {
        editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
        console.log("[v0] Scroll initiated")
      } else {
        console.log("[v0] Editor ref not found")
      }
    }, 300)
  }

  const handleProjectGenerated = (project: ProjectStructure) => {
    setCurrentProject(project)
    setActiveView('project')
  }

  const handleFileSelect = (file: GeneratedFile) => {
    setSelectedFile(file)
    // If it's a contract file, also set it as the generated code for the editor
    if (file.type === 'contract') {
      // In a real implementation, you'd fetch the actual file content
      setGeneratedCode(file.preview || `// ${file.path}\n// Contract content would be loaded here`)
    }
  }

  const handleComponentSelect = (componentPath: string, componentType: string) => {
    const file = currentProject?.files.find(f => f.path === componentPath)
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleProjectExport = (project: ProjectStructure) => {
    // In a real implementation, this would trigger a download
    console.log('Exporting project:', project.name)
    alert(`Exporting ${project.name} - this would download a ZIP file in a real implementation`)
  }

  const handleProjectDeploy = (project: ProjectStructure) => {
    // In a real implementation, this would trigger deployment
    console.log('Deploying project:', project.name)
    alert(`Deploying ${project.name} - this would start the deployment process in a real implementation`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid-lines relative min-h-[90vh] corner-cross">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-2 lg:py-32">
          {/* Left side - Bold typography */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground"></span>
              </span>
              Powered by AI
            </div>

            <h1 className="mb-6 text-6xl font-bold leading-tight tracking-tight lg:text-7xl text-balance">
              Build complete Flow dApps with natural language
            </h1>

            <p className="mb-8 text-lg text-muted-foreground leading-relaxed text-pretty max-w-xl">
              VibeMore transforms your ideas into production-ready full-stack dApps. Generate smart contracts, React frontends, and API routes all from a single conversation.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8"
                onClick={handleStartBuilding}
              >
                Start building
                <span className="ml-2">→</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 bg-transparent"
                onClick={() => router.push("/templates")}
              >
                View templates
              </Button>
            </div>
          </div>

          {/* Right side - Feature list */}
          <div className="flex flex-col justify-center gap-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
                <Icons.zap />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Instant generation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Generate complete Cadence smart contracts in seconds using natural language prompts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
                <Icons.code />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Production-ready code</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get clean, optimized, and well-documented code that follows Flow best practices.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
                <Icons.rocket />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">One-click deploy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Deploy directly to Flow testnet or mainnet with integrated wallet support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corner cross bottom right */}
        <div className="absolute bottom-0 right-0 h-5 w-5">
          <div className="absolute bottom-0 right-0 h-1 w-5 bg-border"></div>
          <div className="absolute bottom-0 right-0 h-5 w-1 bg-border"></div>
        </div>
      </div>

      {!showEditor && (
        <div className="border-t border-border bg-secondary/30 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-8 text-center text-sm text-muted-foreground">Trusted by developers building on Flow</p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
              <div className="text-xl font-semibold">Flow</div>
              <div className="text-xl font-semibold">Dapper Labs</div>
              <div className="text-xl font-semibold">NBA Top Shot</div>
              <div className="text-xl font-semibold">Genies</div>
            </div>
          </div>
        </div>
      )}

      {showEditor && (
        <div ref={editorRef} className="flex flex-1 border-t border-border">
          <div className="w-96 border-r border-border bg-card">
            <ChatPanel 
              onCodeGenerated={setGeneratedCode}
              onProjectGenerated={handleProjectGenerated}
              onComponentSelected={handleComponentSelect}
            />
          </div>
          <div className="flex-1 bg-background">
            {currentProject ? (
              <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="h-full flex flex-col">
                <div className="border-b border-border px-4 py-2">
                  <TabsList className="grid w-full grid-cols-4 max-w-md">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="project">Project</TabsTrigger>
                    <TabsTrigger value="relationships">Relations</TabsTrigger>
                    <TabsTrigger value="browser">Browser</TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex-1">
                  <TabsContent value="editor" className="h-full mt-0">
                    <CodeEditor initialCode={generatedCode} key={generatedCode} />
                  </TabsContent>
                  <TabsContent value="project" className="h-full mt-0 p-4">
                    <ProjectPreview 
                      project={currentProject}
                      onFileSelect={handleFileSelect}
                      onProjectExport={handleProjectExport}
                      onProjectDeploy={handleProjectDeploy}
                    />
                  </TabsContent>
                  <TabsContent value="relationships" className="h-full mt-0 p-4">
                    <ComponentRelationshipView 
                      project={currentProject}
                      onComponentSelect={handleComponentSelect}
                    />
                  </TabsContent>
                  <TabsContent value="browser" className="h-full mt-0 p-4">
                    <FileBrowser 
                      file={selectedFile}
                      onFileClose={() => setSelectedFile(null)}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              <CodeEditor initialCode={generatedCode} key={generatedCode} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
