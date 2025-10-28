"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/icons"
import { GeneratedFile } from "@/components/types/chat-types"

interface FileBrowserProps {
  file: GeneratedFile | null
  onFileEdit?: (file: GeneratedFile, newContent: string) => void
  onFileClose?: () => void
  readOnly?: boolean
}

export function FileBrowser({ file, onFileEdit, onFileClose, readOnly = false }: FileBrowserProps) {
  const [content, setContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState("")
  const [activeTab, setActiveTab] = useState("preview")

  // Load file content when file changes
  useEffect(() => {
    if (file) {
      // In a real implementation, this would fetch the actual file content
      // For now, we'll use the preview or generate sample content
      const sampleContent = generateSampleContent(file)
      setContent(sampleContent)
      setEditedContent(sampleContent)
    }
  }, [file])

  const handleSave = () => {
    if (file && onFileEdit) {
      onFileEdit(file, editedContent)
      setContent(editedContent)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
        return <Icons.code className="h-4 w-4 text-yellow-500" />
      case 'cadence':
        return <Icons.code className="h-4 w-4 text-blue-500" />
      case 'json':
        return <Icons.settings className="h-4 w-4 text-green-500" />
      case 'markdown':
        return <Icons.fileText className="h-4 w-4 text-purple-500" />
      default:
        return <Icons.file className="h-4 w-4" />
    }
  }

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'text-blue-500'
      case 'component': return 'text-green-500'
      case 'api': return 'text-orange-500'
      case 'config': return 'text-gray-500'
      case 'documentation': return 'text-purple-500'
      default: return 'text-muted-foreground'
    }
  }

  if (!file) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <Icons.file className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No File Selected</h3>
          <p className="text-muted-foreground">
            Select a file from the project structure to view its contents
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* File Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getLanguageIcon(file.language)}
              <div>
                <CardTitle className="text-base">{file.path}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getFileTypeColor(file.type)}>
                    {file.type}
                  </Badge>
                  <Badge variant="outline">{file.language}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(file.size / 1024)}KB
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!readOnly && (
                <>
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSave}>
                        <Icons.check className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Icons.code className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </>
              )}
              <Button size="sm" variant="outline" onClick={onFileClose}>
                <Icons.x className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* File Content */}
      <Card className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0">
            <TabsContent value="preview" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {isEditing ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-96 p-4 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Edit file content..."
                    />
                  ) : (
                    <SyntaxHighlightedCode content={content} language={file.language} />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <pre className="text-sm font-mono whitespace-pre-wrap p-4 bg-muted/50 rounded-lg">
                  {content}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="info" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <FileAnalysis file={file} content={content} />
                </div>
              </ScrollArea>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}

// Syntax Highlighted Code Component
interface SyntaxHighlightedCodeProps {
  content: string
  language: string
}

function SyntaxHighlightedCode({ content, language }: SyntaxHighlightedCodeProps) {
  const lines = content.split('\n')

  const getTokenColor = (token: string, language: string) => {
    // Simple syntax highlighting - in a real implementation, 
    // you'd use a proper syntax highlighter like Prism.js or Monaco Editor
    
    const keywords = {
      typescript: ['import', 'export', 'function', 'const', 'let', 'var', 'if', 'else', 'return', 'interface', 'type'],
      javascript: ['import', 'export', 'function', 'const', 'let', 'var', 'if', 'else', 'return'],
      cadence: ['pub', 'fun', 'resource', 'struct', 'contract', 'import', 'from', 'let', 'var', 'if', 'else', 'return'],
      json: []
    }

    const langKeywords = keywords[language.toLowerCase() as keyof typeof keywords] || []
    
    if (langKeywords.includes(token)) {
      return 'text-blue-600 font-semibold'
    }
    
    if (token.startsWith('"') && token.endsWith('"')) {
      return 'text-green-600'
    }
    
    if (token.startsWith("'") && token.endsWith("'")) {
      return 'text-green-600'
    }
    
    if (/^\d+$/.test(token)) {
      return 'text-orange-600'
    }
    
    if (token.startsWith('//') || token.startsWith('/*')) {
      return 'text-gray-500 italic'
    }
    
    return 'text-foreground'
  }

  const tokenizeSimple = (line: string, language: string) => {
    // Very basic tokenization - split by spaces and common delimiters
    const tokens = line.split(/(\s+|[{}()[\];,.])/g).filter(t => t.length > 0)
    
    return tokens.map((token, index) => (
      <span key={index} className={getTokenColor(token, language)}>
        {token}
      </span>
    ))
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-auto">
      <div className="space-y-1">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            <span className="text-muted-foreground mr-4 select-none w-8 text-right">
              {index + 1}
            </span>
            <div className="flex-1">
              {line.trim() ? tokenizeSimple(line, language) : <span>&nbsp;</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// File Analysis Component
interface FileAnalysisProps {
  file: GeneratedFile
  content: string
}

function FileAnalysis({ file, content }: FileAnalysisProps) {
  const analysis = analyzeFileContent(content, file.language)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-3">File Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{analysis.lines}</p>
              <p className="text-sm text-muted-foreground">Lines</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{analysis.characters}</p>
              <p className="text-sm text-muted-foreground">Characters</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{analysis.words}</p>
              <p className="text-sm text-muted-foreground">Words</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(file.size / 1024)}</p>
              <p className="text-sm text-muted-foreground">KB</p>
            </div>
          </Card>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Code Analysis</h3>
        <div className="space-y-2">
          {analysis.functions.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Functions ({analysis.functions.length})</h4>
              <div className="space-y-1">
                {analysis.functions.slice(0, 5).map((func, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded font-mono">
                    {func}
                  </div>
                ))}
                {analysis.functions.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    ... and {analysis.functions.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {analysis.imports.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Imports ({analysis.imports.length})</h4>
              <div className="space-y-1">
                {analysis.imports.slice(0, 5).map((imp, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded font-mono">
                    {imp}
                  </div>
                ))}
                {analysis.imports.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    ... and {analysis.imports.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {analysis.exports.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Exports ({analysis.exports.length})</h4>
              <div className="space-y-1">
                {analysis.exports.map((exp, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded font-mono">
                    {exp}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions
function generateSampleContent(file: GeneratedFile): string {
  // Generate sample content based on file type and language
  switch (file.type) {
    case 'contract':
      return generateSampleContract(file.path)
    case 'component':
      return generateSampleComponent(file.path)
    case 'api':
      return generateSampleAPI(file.path)
    case 'config':
      return generateSampleConfig(file.path)
    default:
      return file.preview || `// ${file.path}\n// Generated file content would appear here`
  }
}

function generateSampleContract(path: string): string {
  const contractName = path.split('/').pop()?.replace('.cdc', '') || 'Contract'
  return `// ${path}
access(all) contract ${contractName} {
    
    // Contract state
    access(all) var totalSupply: UInt64
    
    // Events
    access(all) event ContractInitialized()
    
    // Initialize the contract
    init() {
        self.totalSupply = 0
        emit ContractInitialized()
    }
    
    // Public functions
    access(all) fun getTotalSupply(): UInt64 {
        return self.totalSupply
    }
    
    // Admin functions
    access(account) fun updateTotalSupply(newSupply: UInt64) {
        self.totalSupply = newSupply
    }
}`
}

function generateSampleComponent(path: string): string {
  const componentName = path.split('/').pop()?.replace('.tsx', '') || 'Component'
  return `// ${path}
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ${componentName}Props {
  // Define component props here
}

export function ${componentName}({ }: ${componentName}Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>${componentName}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Component content goes here</p>
        <Button>Action</Button>
      </CardContent>
    </Card>
  )
}

export default ${componentName}`
}

function generateSampleAPI(path: string): string {
  return `// ${path}
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Handle GET request
    return NextResponse.json({ 
      success: true, 
      data: {} 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle POST request
    return NextResponse.json({ 
      success: true, 
      data: body 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}`
}

function generateSampleConfig(path: string): string {
  if (path.endsWith('.json')) {
    return `{
  "name": "generated-project",
  "version": "1.0.0",
  "description": "Generated full-stack dApp",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`
  }
  
  return `// ${path}
// Configuration file content
export default {
  // Configuration options
}`
}

function analyzeFileContent(content: string, language: string) {
  const lines = content.split('\n')
  const words = content.split(/\s+/).filter(w => w.length > 0)
  const characters = content.length

  // Extract functions (simple regex-based extraction)
  const functionRegex = /(?:function|fun|access\(all\) fun)\s+(\w+)/g
  const functions: string[] = []
  let match
  while ((match = functionRegex.exec(content)) !== null) {
    functions.push(match[1])
  }

  // Extract imports
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g
  const imports: string[] = []
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[0])
  }

  // Extract exports
  const exportRegex = /export\s+(?:default\s+)?(?:function|const|class|interface)\s+(\w+)/g
  const exports: string[] = []
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1])
  }

  return {
    lines: lines.length,
    words: words.length,
    characters,
    functions,
    imports,
    exports
  }
}