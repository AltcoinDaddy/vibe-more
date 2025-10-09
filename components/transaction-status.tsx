"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, XCircle, ExternalLink, Loader2 } from "lucide-react"
import { flowClient } from "@/lib/flow-client"

interface TransactionStatusProps {
  transactionId: string
  network: string
}

export function TransactionStatus({ transactionId, network }: TransactionStatusProps) {
  const [status, setStatus] = useState<"pending" | "sealed" | "error">("pending")
  const [errorMessage, setErrorMessage] = useState<string>()

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const tx = await flowClient.getTransactionStatus(transactionId)
        if (tx.status === 4) {
          setStatus("sealed")
        } else if (tx.errorMessage) {
          setStatus("error")
          setErrorMessage(tx.errorMessage)
        }
      } catch (error: any) {
        setStatus("error")
        setErrorMessage(error.message)
      }
    }

    const interval = setInterval(checkStatus, 2000)
    checkStatus()

    return () => clearInterval(interval)
  }, [transactionId])

  const getExplorerUrl = () => {
    const baseUrl = network === "mainnet" ? "https://flowscan.org" : "https://testnet.flowscan.org"
    return `${baseUrl}/transaction/${transactionId}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transaction Status</CardTitle>
          {status === "pending" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {status === "sealed" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {status === "error" && <XCircle className="h-5 w-5 text-destructive" />}
        </div>
        <CardDescription className="font-mono text-xs">{transactionId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge
            variant={status === "sealed" ? "default" : status === "error" ? "destructive" : "secondary"}
            className="capitalize"
          >
            {status === "pending" && <Clock className="mr-1 h-3 w-3" />}
            {status}
          </Badge>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
          <a href={getExplorerUrl()} target="_blank" rel="noopener noreferrer">
            View on Explorer
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
