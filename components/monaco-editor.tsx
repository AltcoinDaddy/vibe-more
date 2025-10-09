"use client"

import { useEffect, useRef } from "react"
import Editor from "@monaco-editor/react"

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: string
  height?: string
  readOnly?: boolean
}

export function MonacoEditor({
  value,
  onChange,
  language = "javascript",
  theme = "vs-dark",
  height = "400px",
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null)

  useEffect(() => {
    // Configure Cadence language support
    if (typeof window !== "undefined") {
      import("monaco-editor").then((monaco) => {
        // Register Cadence language
        monaco.languages.register({ id: "cadence" })

        // Define Cadence syntax highlighting
        monaco.languages.setMonarchTokensProvider("cadence", {
          tokenizer: {
            root: [
              [/\b(pub|priv|access|contract|resource|struct|interface|fun|init|destroy|let|var|if|else|while|for|return|emit|import|from|as|self|pre|post)\b/, "keyword"],
              [/\b(String|Int|UInt|UFix64|Fix64|Bool|Address|Path|Capability|Account|Block)\b/, "type"],
              [/\b(true|false|nil)\b/, "constant"],
              [/\/\/.*$/, "comment"],
              [/\/\*[\s\S]*?\*\//, "comment"],
              [/"([^"\\]|\\.)*"/, "string"],
              [/\d+(\.\d+)?/, "number"],
              [/[{}()\[\]]/, "bracket"],
              [/[<>]=?|[!=]=|&&|\|\||[+\-*/%]/, "operator"],
            ],
          },
        })

        // Define Cadence language configuration
        monaco.languages.setLanguageConfiguration("cadence", {
          comments: {
            lineComment: "//",
            blockComment: ["/*", "*/"],
          },
          brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
          ],
          autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
          ],
        })
      })
    }
  }, [])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      automaticLayout: true,
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  return (
    <Editor
      height={height}
      language={language}
      theme={theme}
      value={value}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        selectOnLineNumbers: true,
        roundedSelection: false,
        cursorStyle: "line",
        automaticLayout: true,
      }}
    />
  )
}