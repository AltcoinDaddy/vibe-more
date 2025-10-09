"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { WalletIcon, LogOutIcon, LoaderIcon } from "@/components/icons"
import { flowClient } from "@/lib/flow-client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

export function WalletButton() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Subscribe to authentication changes
    const unsubscribe = flowClient.subscribeToAuth((currentUser) => {
      setUser(currentUser)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await flowClient.authenticate()
      toast({
        title: "Wallet connected",
        description: "Successfully connected to Flow wallet",
      })
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await flowClient.unauthenticate()
      toast({
        title: "Wallet disconnected",
        description: "Successfully disconnected from Flow wallet",
      })
    } catch (error) {
      console.error("[v0] Wallet disconnection error:", error)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (user?.loggedIn) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="glow-primary">
            <WalletIcon className="mr-2 h-4 w-4" />
            {formatAddress(user.addr)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">Address</span>
            <span className="font-mono text-sm">{user.addr}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
            <LogOutIcon className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button size="sm" onClick={handleConnect} disabled={isLoading} className="glow-primary">
      {isLoading ? (
        <>
          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <WalletIcon className="mr-2 h-4 w-4" />
          Connect Wallet
        </>
      )}
    </Button>
  )
}
