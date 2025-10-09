"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/icons"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatPanelProps {
  onCodeGenerated?: (code: string) => void
}

export function ChatPanel({ onCodeGenerated }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hey! I'm your AI coding assistant for Flow blockchain. Tell me what you want to build and I'll generate Cadence code for you. Try something like 'Create an NFT marketplace' or 'Build a token contract'.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const userPrompt = input
    setInput("")
    setIsLoading(true)

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Generating your Cadence smart contract...",
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      // Try streaming first, fallback to regular generation
      const useStreaming = true // Can be made configurable

      if (useStreaming) {
        const response = await fetch("/api/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userPrompt }),
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
                  
                  // Handle different message types from our enhanced streaming API
                  if (parsed.type === 'code_chunk' || parsed.type === 'fallback_chunk') {
                    generatedCode += parsed.chunk || ''
                  } else if (parsed.type === 'fallback_used' && parsed.fallbackCode) {
                    // If fallback is used, replace all accumulated code with the clean fallback
                    generatedCode = parsed.fallbackCode
                  } else if (parsed.chunk && !parsed.type) {
                    // Legacy format support
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

          // Update the loading message with success
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === loadingMessage.id 
                ? { ...msg, content: "✨ Perfect! I've generated your Cadence smart contract. Check it out in the editor!" }
                : msg
            )
          )
        } else {
          throw new Error("Streaming failed")
        }
      } else {
        // Fallback to regular generation
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userPrompt }),
        })

        if (!response.ok) throw new Error("Failed to generate code")

        const { code } = await response.json()

        if (onCodeGenerated) {
          onCodeGenerated(code)
        }

        // Update loading message
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === loadingMessage.id 
              ? { ...msg, content: "✨ Done! Your Cadence smart contract is ready in the editor." }
              : msg
          )
        )
      }
    } catch (error) {
      console.error("[v0] Generation error:", error)
      
      // Update loading message with error
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: "Sorry, I encountered an error generating the code. Please try again or check your API configuration." }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
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
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Generating code...</p>
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
            placeholder="Describe what you want to build..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Icons.send />
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}
