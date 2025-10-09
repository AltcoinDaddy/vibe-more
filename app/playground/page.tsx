"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Code2, Zap } from "lucide-react"
import { flowClient } from "@/lib/flow-client"
import { useToast } from "@/hooks/use-toast"

export default function PlaygroundPage() {
  const [script, setScript] = useState(`// Example: Query account balance
import FungibleToken from 0x9a0766d93b6608b7

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    return account.balance
}`)
  const [transaction, setTransaction] = useState(`// Example: Transfer tokens
import FungibleToken from 0x9a0766d93b6608b7

transaction(amount: UFix64, to: Address) {
    prepare(signer: auth(Storage) &Account) {
        // Transfer logic here
    }
}`)
  const [result, setResult] = useState<string>("")
  const [isExecuting, setIsExecuting] = useState(false)
  const { toast } = useToast()

  const executeScript = async () => {
    setIsExecuting(true)
    setResult("")
    try {
      const res = await flowClient.executeScript(script)
      setResult(JSON.stringify(res, null, 2))
      toast({
        title: "Script executed",
        description: "Script ran successfully",
      })
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast({
        title: "Execution failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const sendTransaction = async () => {
    setIsExecuting(true)
    setResult("")
    try {
      const user = await flowClient.getCurrentUser()
      if (!user.loggedIn) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          variant: "destructive",
        })
        setIsExecuting(false)
        return
      }

      const res = await flowClient.sendTransaction(transaction)
      setResult(JSON.stringify(res, null, 2))
      toast({
        title: "Transaction sent",
        description: "Transaction submitted successfully",
      })
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
      toast({
        title: "Transaction failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>Flow Playground</span>
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">Test Your Cadence Code</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Execute scripts and send transactions directly to the Flow blockchain
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Code Input */}
          <Card>
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
              <CardDescription>Write and execute Cadence scripts or transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="script">
                <TabsList className="mb-4">
                  <TabsTrigger value="script">
                    <Code2 className="mr-2 h-4 w-4" />
                    Script
                  </TabsTrigger>
                  <TabsTrigger value="transaction">
                    <Play className="mr-2 h-4 w-4" />
                    Transaction
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="script" className="space-y-4">
                  <Textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Write your Cadence script here..."
                  />
                  <Button onClick={executeScript} disabled={isExecuting} className="w-full">
                    {isExecuting ? "Executing..." : "Execute Script"}
                  </Button>
                </TabsContent>

                <TabsContent value="transaction" className="space-y-4">
                  <Textarea
                    value={transaction}
                    onChange={(e) => setTransaction(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Write your Cadence transaction here..."
                  />
                  <Button onClick={sendTransaction} disabled={isExecuting} className="w-full">
                    {isExecuting ? "Sending..." : "Send Transaction"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Right: Results */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Execution output and transaction results</CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <pre className="rounded-lg bg-muted p-4 font-mono text-sm">
                  <code>{result}</code>
                </pre>
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">Results will appear here after execution</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Examples */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Examples</CardTitle>
            <CardDescription>Common Cadence patterns to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 bg-transparent"
                onClick={() =>
                  setScript(`access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    return account.balance
}`)
                }
              >
                <span className="font-semibold">Get Account Balance</span>
                <span className="text-xs text-muted-foreground">Query an account's FLOW balance</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 bg-transparent"
                onClick={() =>
                  setScript(`access(all) fun main(): UInt64 {
    return getCurrentBlock().height
}`)
                }
              >
                <span className="font-semibold">Get Block Height</span>
                <span className="text-xs text-muted-foreground">Get the current block number</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 bg-transparent"
                onClick={() =>
                  setScript(`access(all) fun main(address: Address): String {
    let account = getAccount(address)
    return account.code.toString()
}`)
                }
              >
                <span className="font-semibold">Get Account Code</span>
                <span className="text-xs text-muted-foreground">View deployed contracts</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
