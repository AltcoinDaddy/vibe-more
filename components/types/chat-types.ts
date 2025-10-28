/**
 * Types for enhanced chat interface supporting full-stack conversations
 */

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: 'text' | 'project_structure' | 'component_preview' | 'error' | 'progress'
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  projectName?: string
  generatedFiles?: GeneratedFile[]
  componentType?: 'contract' | 'frontend' | 'api' | 'config'
  progress?: GenerationProgress
  error?: ErrorDetails
}

export interface GeneratedFile {
  path: string
  type: 'contract' | 'component' | 'api' | 'config' | 'documentation'
  language: string
  size: number
  preview?: string
}

export interface GenerationProgress {
  phase: 'parsing' | 'contracts' | 'frontend' | 'api' | 'config' | 'integration' | 'complete'
  progress: number
  currentTask: string
  completedTasks: string[]
  errors: string[]
  warnings: string[]
}

export interface ErrorDetails {
  type: 'validation' | 'generation' | 'integration' | 'server'
  message: string
  details?: any
  suggestions?: string[]
}

export interface ProjectStructure {
  name: string
  description: string
  files: GeneratedFile[]
  dependencies: string[]
  framework: string
  totalFiles: number
  estimatedSize: string
}

export interface ComponentRefinementRequest {
  componentPath: string
  componentType: 'contract' | 'frontend' | 'api' | 'config'
  refinementType: 'modify' | 'add_feature' | 'fix_issue' | 'optimize'
  description: string
  affectedFiles?: string[]
}

export interface ChatPanelState {
  currentProject?: ProjectStructure
  isGenerating: boolean
  generationType: 'contract' | 'fullstack' | 'component' | 'refinement'
  showProjectStructure: boolean
  selectedComponent?: string
}