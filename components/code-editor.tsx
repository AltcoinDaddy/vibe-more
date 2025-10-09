"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { MonacoEditor } from "@/components/monaco-editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DeploymentModal } from "@/components/deployment-modal"

interface CodeEditorProps {
  initialCode?: string
}

export function CodeEditor({ initialCode }: CodeEditorProps) {
  const [code, setCode] = useState(
    initialCode ||
      `// Your generated Cadence code will appear here
// Try asking the AI to create a smart contract!

access(all) contract HelloWorld {
    access(all) let greeting: String

    init() {
        self.greeting = "Hello, Flow!"
    }

    access(all) view fun hello(): String {
        return self.greeting
    }
}`,
  )
  const [explanation, setExplanation] = useState("")
  const [isExplaining, setIsExplaining] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [refinementRequest, setRefinementRequest] = useState("")
  const [showExplanation, setShowExplanation] = useState(false)
  const [showRefinement, setShowRefinement] = useState(false)
  const [showDeployment, setShowDeployment] = useState(false)
  const { toast } = useToast()

  const handleExplainCode = async () => {
    setIsExplaining(true)
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) throw new Error("Failed to explain code")

      const { explanation: exp } = await response.json()
      setExplanation(exp)
      setShowExplanation(true)
    } catch (error) {
      console.error("[v0] Explanation error:", error)
      toast({
        title: "Error",
        description: "Failed to explain code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExplaining(false)
    }
  }

  const handleRefineCode = async () => {
    if (!refinementRequest.trim()) return

    setIsRefining(true)
    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, refinementRequest }),
      })

      if (!response.ok) throw new Error("Failed to refine code")

      const { code: refinedCode } = await response.json()
      setCode(refinedCode)
      setShowRefinement(false)
      setRefinementRequest("")
      toast({
        title: "Code refined",
        description: "Your code has been updated based on your request.",
      })
    } catch (error) {
      console.error("[v0] Refinement error:", error)
      toast({
        title: "Error",
        description: "Failed to refine code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefining(false)
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Copied!",
        description: "Code copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contract.cdc"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "Downloaded!",
      description: "Code saved as contract.cdc",
    })
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">contract.cdc</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Cadence</span>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleExplainCode} disabled={isExplaining}>
                {isExplaining ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                ) : (
                  <span className="mr-2">💡</span>
                )}
                Explain Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Code Explanation</DialogTitle>
                <DialogDescription>AI-powered breakdown of your Cadence code</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                <div className="prose prose-sm dark:prose-invert">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{explanation}</p>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog open={showRefinement} onOpenChange={setShowRefinement}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <span className="mr-2">🔄</span>
                Refine Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refine Code</DialogTitle>
                <DialogDescription>Tell the AI how you want to improve the code</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={refinementRequest}
                  onChange={(e) => setRefinementRequest(e.target.value)}
                  placeholder="E.g., 'Add error handling' or 'Make it more gas efficient'"
                  className="min-h-[100px]"
                />
                <Button
                  onClick={handleRefineCode}
                  disabled={isRefining || !refinementRequest.trim()}
                  className="w-full"
                >
                  {isRefining ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  ) : (
                    <span className="mr-2">🔄</span>
                  )}
                  Refine Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" onClick={handleCopyCode}>
            <span className="mr-2">📋</span>
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadCode}>
            <span className="mr-2">⬇️</span>
            Export
          </Button>
          <Button
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={() => setShowDeployment(true)}
          >
            <span className="mr-2">▶️</span>
            Deploy
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="code" className="flex-1">
        <div className="border-b border-border bg-card px-4">
          <TabsList className="bg-transparent">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="code" className="h-full flex-1 p-0">
          <div className="h-full">
            <MonacoEditor
              value={code}
              onChange={setCode}
              language="cadence"
              height="calc(100vh - 200px)"
            />
          </div>
        </TabsContent>

        <TabsContent value="console" className="h-full p-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Console output will appear here after deployment...</p>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="h-full p-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 font-semibold">Cadence Documentation</h4>
            <p className="text-sm text-muted-foreground">Quick reference and documentation will appear here...</p>
          </div>
        </TabsContent>
      </Tabs>

      <DeploymentModal open={showDeployment} onOpenChange={setShowDeployment} code={code} />
    </div>
  )
}
