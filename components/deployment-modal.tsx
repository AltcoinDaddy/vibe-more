"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { flowClient } from "@/lib/flow-client"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/icons"

interface DeploymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
}

export function DeploymentModal({ open, onOpenChange, code }: DeploymentModalProps) {
  const [contractName, setContractName] = useState("MyContract")
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  const handleConnect = async () => {
    try {
      const connectedUser = await flowClient.authenticate()
      setUser(connectedUser)
      toast({
        title: "Wallet connected",
        description: `Connected to ${connectedUser.addr}`,
      })
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      })
    }
  }

  const handleDeploy = async (network: "testnet" | "mainnet") => {
    if (!user?.loggedIn) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    setIsDeploying(true)
    try {
      const result = await flowClient.deployContract(contractName, code)
      setDeploymentResult({ ...result, network })
      
      if (result.status === "sealed") {
        toast({
          title: "Deployment successful",
          description: `Contract deployed to ${network}`,
        })
      } else {
        toast({
          title: "Deployment failed",
          description: result.errorMessage || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Deployment error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deploy Contract</DialogTitle>
          <DialogDescription>
            Deploy your Cadence smart contract to the Flow blockchain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wallet Connection</CardTitle>
              <CardDescription>Connect your Flow wallet to deploy contracts</CardDescription>
            </CardHeader>
            <CardContent>
              {user?.loggedIn ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icons.check className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Connected</p>
                      <p className="text-sm text-muted-foreground">{user.addr}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Connected
                  </Badge>
                </div>
              ) : (
                <Button onClick={handleConnect} className="w-full">
                  <Icons.zap className="mr-2 h-4 w-4" />
                  Connect Flow Wallet
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Contract Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractName">Contract Name</Label>
              <Input
                id="contractName"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="Enter contract name"
              />
            </div>
          </div>

          {/* Deployment Options */}
          <Tabs defaultValue="testnet">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="testnet">Testnet</TabsTrigger>
              <TabsTrigger value="mainnet">Mainnet</TabsTrigger>
            </TabsList>

            <TabsContent value="testnet" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Flow Testnet</CardTitle>
                  <CardDescription>
                    Deploy to testnet for development and testing. Free to use.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleDeploy("testnet")}
                    disabled={isDeploying || !user?.loggedIn}
                    className="w-full"
                  >
                    {isDeploying ? (
                      <>
                        <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Icons.rocket className="mr-2 h-4 w-4" />
                        Deploy to Testnet
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mainnet" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Flow Mainnet</CardTitle>
                  <CardDescription>
                    Deploy to mainnet for production use. Requires FLOW tokens for gas fees.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Icons.alertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Production Deployment</span>
                    </div>
                    <p className="text-sm text-yellow-600/80 mt-1">
                      Make sure your contract is thoroughly tested before mainnet deployment.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDeploy("mainnet")}
                    disabled={isDeploying || !user?.loggedIn}
                    className="w-full"
                  >
                    {isDeploying ? (
                      <>
                        <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Icons.rocket className="mr-2 h-4 w-4" />
                        Deploy to Mainnet
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Deployment Result */}
          {deploymentResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deployment Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={deploymentResult.status === "sealed" ? "default" : "destructive"}>
                      {deploymentResult.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Network:</span>
                    <span className="text-sm">{deploymentResult.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transaction ID:</span>
                    <span className="text-sm font-mono">{deploymentResult.transactionId}</span>
                  </div>
                  {deploymentResult.errorMessage && (
                    <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-600">{deploymentResult.errorMessage}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}