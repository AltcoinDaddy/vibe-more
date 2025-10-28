"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Icons } from "@/components/icons"
import { 
  Message, 
  MessageMetadata, 
  GenerationProgress, 
  ProjectStructure, 
  GeneratedFile,
  ChatPanelState,
  ComponentRefinementRequest
} from "@/components/types/chat-types"

interface ChatPanelProps {
  onCodeGenerated?: (code: string) => void
  onProjectGenerated?: (project: ProjectStructure) => void
  onComponentSelected?: (componentPath: string, componentType: string) => void
}

export function ChatPanel({ onCodeGenerated, onProjectGenerated, onComponentSelected }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hey! I'm your AI coding assistant for Flow blockchain. I can help you build complete dApps with smart contracts, frontend interfaces, and API routes. Try something like 'Create an NFT marketplace with React frontend' or 'Build a full-stack token dApp'.",
      timestamp: new Date(),
      type: 'text'
    },
  ])
  const [input, setInput] = useState("")
  const [chatState, setChatState] = useState<ChatPanelState>({
    isGenerating: false,
    generationType: 'contract',
    showProjectStructure: false
  })
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Detect if the user is asking for full-stack generation
  const detectGenerationType = (prompt: string): 'contract' | 'fullstack' | 'component' | 'refinement' => {
    const fullStackKeywords = ['full-stack', 'fullstack', 'frontend', 'react', 'ui', 'interface', 'dapp', 'web app', 'complete app']
    const componentKeywords = ['component', 'modify', 'update', 'change', 'fix', 'improve']
    const refinementKeywords = ['refine', 'adjust', 'tweak', 'enhance', 'optimize']
    
    const lowerPrompt = prompt.toLowerCase()
    
    if (refinementKeywords.some(keyword => lowerPrompt.includes(keyword)) && chatState.currentProject) {
      return 'refinement'
    }
    
    if (componentKeywords.some(keyword => lowerPrompt.includes(keyword)) && chatState.currentProject) {
      return 'component'
    }
    
    if (fullStackKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      return 'fullstack'
    }
    
    return 'contract'
  }

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage.id
  }, [])

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || chatState.isGenerating) return

    const userPrompt = input
    const generationType = detectGenerationType(userPrompt)
    
    // Add user message
    addMessage({
      role: "user",
      content: userPrompt,
      type: 'text'
    })

    setInput("")
    setChatState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      generationType 
    }))

    // Add loading message based on generation type
    const loadingContent = generationType === 'fullstack' 
      ? "Generating your full-stack dApp with smart contracts and frontend..."
      : generationType === 'component'
      ? "Updating your project components..."
      : generationType === 'refinement'
      ? "Refining your project based on your feedback..."
      : "Generating your Cadence smart contract..."

    const loadingMessageId = addMessage({
      role: "assistant",
      content: loadingContent,
      type: 'progress',
      metadata: {
        progress: {
          phase: 'parsing',
          progress: 0,
          currentTask: 'Analyzing your request...',
          completedTasks: [],
          errors: [],
          warnings: []
        }
      }
    })

    try {
      if (generationType === 'fullstack') {
        await handleFullStackGeneration(userPrompt, loadingMessageId)
      } else if (generationType === 'component' || generationType === 'refinement') {
        await handleComponentRefinement(userPrompt, loadingMessageId, generationType)
      } else {
        await handleContractGeneration(userPrompt, loadingMessageId)
      }
    } catch (error) {
      console.error("[ChatPanel] Generation error:", error)
      
      updateMessage(loadingMessageId, {
        content: "Sorry, I encountered an error. Please try again or check your request.",
        type: 'error',
        metadata: {
          error: {
            type: 'generation',
            message: error instanceof Error ? error.message : 'Unknown error',
            suggestions: [
              'Try simplifying your request',
              'Check your internet connection',
              'Ensure the API is properly configured'
            ]
          }
        }
      })
    } finally {
      setChatState(prev => ({ ...prev, isGenerating: false }))
    }
  }

  const handleFullStackGeneration = async (prompt: string, loadingMessageId: string) => {
    // Parse the prompt to extract project requirements
    const projectRequest = parseFullStackRequest(prompt)
    
    const response = await fetch("/api/generate-fullstack", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/x-ndjson"
      },
      body: JSON.stringify(projectRequest),
    })

    if (!response.ok) {
      throw new Error(`Full-stack generation failed: ${response.statusText}`)
    }

    if (response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              
              if (data.type === 'progress') {
                updateMessage(loadingMessageId, {
                  content: `Generating your full-stack dApp... (${data.data.progress}%)`,
                  type: 'progress',
                  metadata: { progress: data.data }
                })
              } else if (data.type === 'result') {
                const project = data.data.project
                const projectStructure: ProjectStructure = {
                  name: projectRequest.projectName,
                  description: projectRequest.description,
                  files: [
                    ...(project.smartContracts || []).map((c: any) => ({
                      path: c.filename,
                      type: 'contract' as const,
                      language: 'cadence',
                      size: c.code?.length || 0,
                      preview: c.code?.substring(0, 200) + '...'
                    })),
                    ...(project.frontendComponents || []).map((c: any) => ({
                      path: c.filename,
                      type: 'component' as const,
                      language: 'typescript',
                      size: c.code?.length || 0,
                      preview: c.code?.substring(0, 200) + '...'
                    })),
                    ...(project.apiRoutes || []).map((r: any) => ({
                      path: r.filename,
                      type: 'api' as const,
                      language: 'typescript',
                      size: r.code?.length || 0,
                      preview: r.code?.substring(0, 200) + '...'
                    })),
                    ...(project.configurations || []).map((c: any) => ({
                      path: c.filename,
                      type: 'config' as const,
                      language: 'json',
                      size: c.content?.length || 0,
                      preview: c.content?.substring(0, 200) + '...'
                    }))
                  ],
                  dependencies: project.dependencies || [],
                  framework: 'next',
                  totalFiles: (project.smartContracts?.length || 0) + 
                             (project.frontendComponents?.length || 0) + 
                             (project.apiRoutes?.length || 0) + 
                             (project.configurations?.length || 0),
                  estimatedSize: `${Math.round((project.smartContracts?.reduce((acc: number, c: any) => acc + (c.code?.length || 0), 0) || 0) / 1024)}KB`
                }

                setChatState(prev => ({ 
                  ...prev, 
                  currentProject: projectStructure,
                  showProjectStructure: true 
                }))

                updateMessage(loadingMessageId, {
                  content: "✨ Perfect! I've generated your complete full-stack dApp. Check out the project structure below!",
                  type: 'project_structure',
                  metadata: { projectName: projectStructure.name, generatedFiles: projectStructure.files }
                })

                // Add project structure message
                addMessage({
                  role: "assistant",
                  content: "",
                  type: 'project_structure',
                  metadata: { projectName: projectStructure.name, generatedFiles: projectStructure.files }
                })

                if (onProjectGenerated) {
                  onProjectGenerated(projectStructure)
                }
              } else if (data.type === 'error') {
                throw new Error(data.data.error)
              }
            } catch (parseError) {
              console.warn("Failed to parse streaming data:", parseError)
            }
          }
        }
      }
    }
  }

  const handleComponentRefinement = async (prompt: string, loadingMessageId: string, type: 'component' | 'refinement') => {
    if (!chatState.currentProject) {
      updateMessage(loadingMessageId, {
        content: "I need a project to refine. Please generate a full-stack project first!",
        type: 'error'
      })
      return
    }

    // For now, simulate component refinement
    // In a real implementation, this would call a refinement API
    setTimeout(() => {
      updateMessage(loadingMessageId, {
        content: `✨ I've ${type === 'component' ? 'updated the component' : 'refined the project'} based on your feedback. The changes have been applied to your project structure.`,
        type: 'text'
      })
    }, 2000)
  }

  const handleContractGeneration = async (prompt: string, loadingMessageId: string) => {
    // Use existing contract generation logic
    const response = await fetch("/api/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })

    if (response.ok && response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let generatedCode = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") break
            
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'code_chunk' || parsed.type === 'fallback_chunk') {
                generatedCode += parsed.chunk || ''
              } else if (parsed.type === 'fallback_used' && parsed.fallbackCode) {
                generatedCode = parsed.fallbackCode
              } else if (parsed.chunk && !parsed.type) {
                generatedCode += parsed.chunk
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      if (generatedCode && onCodeGenerated) {
        onCodeGenerated(generatedCode)
      }

      updateMessage(loadingMessageId, {
        content: "✨ Perfect! I've generated your Cadence smart contract. Check it out in the editor!",
        type: 'text'
      })
    } else {
      throw new Error("Contract generation failed")
    }
  }

  const parseFullStackRequest = (prompt: string) => {
    // Simple parsing logic - in a real implementation, this would be more sophisticated
    const projectName = extractProjectName(prompt) || `project-${Date.now()}`
    const lowerPrompt = prompt.toLowerCase()
    
    // Infer feature type from prompt
    let featureType: 'nft' | 'token' | 'marketplace' | 'dao' | 'defi' | 'custom' = 'custom'
    if (lowerPrompt.includes('nft') || lowerPrompt.includes('non-fungible')) {
      featureType = 'nft'
    } else if (lowerPrompt.includes('marketplace')) {
      featureType = 'marketplace'
    } else if (lowerPrompt.includes('token') && !lowerPrompt.includes('nft')) {
      featureType = 'token'
    } else if (lowerPrompt.includes('dao') || lowerPrompt.includes('governance')) {
      featureType = 'dao'
    } else if (lowerPrompt.includes('defi') || lowerPrompt.includes('staking') || lowerPrompt.includes('liquidity')) {
      featureType = 'defi'
    }
    
    return {
      projectName,
      description: prompt,
      features: [{
        type: featureType,
        specifications: { description: prompt },
        priority: 'high' as const
      }],
      uiRequirements: {
        pages: [{
          name: 'Home',
          route: '/',
          purpose: 'Main application interface',
          contractInteractions: [],
          layout: 'default'
        }],
        components: [],
        styling: {
          framework: 'tailwind' as const,
          theme: 'auto' as const
        },
        responsive: true,
        accessibility: true
      },
      deploymentRequirements: {
        target: 'vercel' as const,
        environment: 'development' as const
      },
      advancedOptions: {
        includeTests: true,
        includeDocumentation: true,
        typescript: true,
        strictMode: true,
        qualityThreshold: 80
      }
    }
  }

  const extractProjectName = (prompt: string): string | null => {
    const patterns = [
      /create (?:a |an )?(.+?)(?:\s+with|\s+that|\s*$)/i,
      /build (?:a |an )?(.+?)(?:\s+with|\s+that|\s*$)/i,
      /make (?:a |an )?(.+?)(?:\s+with|\s+that|\s*$)/i
    ]
    
    for (const pattern of patterns) {
      const match = prompt.match(pattern)
      if (match && match[1]) {
        return match[1].trim().toLowerCase().replace(/\s+/g, '-')
      }
    }
    
    return null
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <div className="text-primary">
              <Icons.sparkles />
            </div>
          </div>
          <div>
            <h2 className="font-semibold">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Powered by VibeSDK</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageComponent 
              key={message.id} 
              message={message} 
              onComponentSelect={onComponentSelected}
              onToggleProjectStructure={() => setChatState(prev => ({ 
                ...prev, 
                showProjectStructure: !prev.showProjectStructure 
              }))}
            />
          ))}
          {chatState.isGenerating && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">
                  {chatState.generationType === 'fullstack' ? 'Generating full-stack project...' :
                   chatState.generationType === 'component' ? 'Updating components...' :
                   chatState.generationType === 'refinement' ? 'Refining project...' :
                   'Generating code...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              chatState.currentProject 
                ? "Ask me to modify components, add features, or refine the project..."
                : "Describe what you want to build (try 'full-stack NFT marketplace')..."
            }
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" size="icon" disabled={chatState.isGenerating || !input.trim()}>
            <Icons.send />
          </Button>
        </form>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
          {chatState.currentProject && (
            <Badge variant="secondary" className="text-xs">
              Project: {chatState.currentProject.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// Message Component for rendering different message types
interface MessageComponentProps {
  message: Message
  onComponentSelect?: (componentPath: string, componentType: string) => void
  onToggleProjectStructure?: () => void
}

function MessageComponent({ message, onComponentSelect, onToggleProjectStructure }: MessageComponentProps) {
  const isUser = message.role === "user"
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isUser ? "" : "space-y-3"}`}>
        {/* Regular message content */}
        {message.content && (
          <div
            className={`rounded-lg px-4 py-2 ${
              isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
            {message.timestamp && (
              <p className="mt-1 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {message.type === 'progress' && message.metadata?.progress && (
          <ProgressIndicator progress={message.metadata.progress} />
        )}

        {/* Project structure visualization */}
        {message.type === 'project_structure' && message.metadata?.generatedFiles && (
          <ProjectStructureView 
            files={message.metadata.generatedFiles}
            projectName={message.metadata.projectName || 'Generated Project'}
            onComponentSelect={onComponentSelect}
          />
        )}

        {/* Error display */}
        {message.type === 'error' && message.metadata?.error && (
          <ErrorDisplay error={message.metadata.error} />
        )}
      </div>
    </div>
  )
}

// Progress Indicator Component
interface ProgressIndicatorProps {
  progress: GenerationProgress
}

function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'parsing': return <Icons.search className="h-4 w-4" />
      case 'contracts': return <Icons.code className="h-4 w-4" />
      case 'frontend': return <Icons.layout className="h-4 w-4" />
      case 'api': return <Icons.server className="h-4 w-4" />
      case 'config': return <Icons.settings className="h-4 w-4" />
      case 'integration': return <Icons.link className="h-4 w-4" />
      case 'complete': return <Icons.check className="h-4 w-4" />
      default: return <Icons.loader className="h-4 w-4 animate-spin" />
    }
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getPhaseIcon(progress.phase)}
          {progress.currentTask}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={progress.progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Phase: {progress.phase}</span>
          <span>{progress.progress}%</span>
        </div>
        {progress.completedTasks.length > 0 && (
          <div className="text-xs">
            <p className="text-muted-foreground mb-1">Completed:</p>
            <ul className="space-y-1">
              {progress.completedTasks.slice(-3).map((task, index) => (
                <li key={index} className="flex items-center gap-1">
                  <Icons.check className="h-3 w-3 text-green-500" />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {progress.errors.length > 0 && (
          <div className="text-xs">
            <p className="text-destructive mb-1">Errors:</p>
            <ul className="space-y-1">
              {progress.errors.map((error, index) => (
                <li key={index} className="flex items-center gap-1 text-destructive">
                  <Icons.alertCircle className="h-3 w-3" />
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Project Structure View Component
interface ProjectStructureViewProps {
  files: GeneratedFile[]
  projectName: string
  onComponentSelect?: (componentPath: string, componentType: string) => void
}

function ProjectStructureView({ files, projectName, onComponentSelect }: ProjectStructureViewProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const filesByType = files.reduce((acc, file) => {
    if (!acc[file.type]) acc[file.type] = []
    acc[file.type].push(file)
    return acc
  }, {} as Record<string, GeneratedFile[]>)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract': return <Icons.code className="h-4 w-4 text-blue-500" />
      case 'component': return <Icons.layout className="h-4 w-4 text-green-500" />
      case 'api': return <Icons.server className="h-4 w-4 text-orange-500" />
      case 'config': return <Icons.settings className="h-4 w-4 text-gray-500" />
      case 'documentation': return <Icons.fileText className="h-4 w-4 text-purple-500" />
      default: return <Icons.file className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'contract': return 'Smart Contracts'
      case 'component': return 'React Components'
      case 'api': return 'API Routes'
      case 'config': return 'Configuration'
      case 'documentation': return 'Documentation'
      default: return type
    }
  }

  return (
    <Card className="bg-muted/50">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/70 transition-colors">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icons.folder className="h-4 w-4" />
                {projectName}
                <Badge variant="outline" className="text-xs">
                  {files.length} files
                </Badge>
              </div>
              <Icons.chevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {Object.entries(filesByType).map(([type, typeFiles]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {getTypeIcon(type)}
                    {getTypeLabel(type)}
                    <Badge variant="secondary" className="text-xs">
                      {typeFiles.length}
                    </Badge>
                  </div>
                  <div className="ml-6 space-y-1">
                    {typeFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 rounded border bg-background/50 hover:bg-background cursor-pointer transition-colors"
                        onClick={() => onComponentSelect?.(file.path, file.type)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icons.file className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs font-mono truncate">{file.path}</span>
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
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Click on files to view/edit</span>
              <span>Total: {Math.round(files.reduce((acc, f) => acc + f.size, 0) / 1024)}KB</span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// Error Display Component
interface ErrorDisplayProps {
  error: {
    type: string
    message: string
    suggestions?: string[]
  }
}

function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-destructive">
          <Icons.alertCircle className="h-4 w-4" />
          Error: {error.type}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{error.message}</p>
        {error.suggestions && error.suggestions.length > 0 && (
          <div className="text-xs">
            <p className="font-medium mb-1">Suggestions:</p>
            <ul className="space-y-1">
              {error.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-1">
                  <Icons.lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
