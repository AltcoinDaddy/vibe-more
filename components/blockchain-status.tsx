"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { flowClient } from "@/lib/flow-client"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"

interface BlockchainData {
  currentBlock: any
  networkStatus: "connected" | "disconnected" | "loading"
  userBalance: number
  userAddress: string | null
  lastUpdated: Date
}

export function BlockchainStatus() {
  const [data, setData] = useState<BlockchainData>({
    currentBlock: null,
    networkStatus: "loading",
    userBalance: 0,
    userAddress: null,
    lastUpdated: new Date()
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchBlockchainData = async () => {
    try {
      setIsRefreshing(true)
      
      // Get current user
      const user = await flowClient.getCurrentUser()
      
      // Get current block info
      const blockInfo = await flowClient.getCurrentBlock()
      
      // Get user balance if connected
      let balance = 0
      if (user.loggedIn && user.addr) {
        try {
          balance = await flowClient.getFlowBalance(user.addr)
        } catch (error) {
          console.warn("Could not fetch user balance:", error)
        }
      }

      setData({
        currentBlock: blockInfo,
        networkStatus: blockInfo ? "connected" : "disconnected",
        userBalance: balance,
        userAddress: user.addr,
        lastUpdated: new Date()
      })

    } catch (error) {
      console.error("Failed to fetch blockchain data:", error)
      setData(prev => ({
        ...prev,
        networkStatus: "disconnected",
        lastUpdated: new Date()
      }))
      toast({
        title: "Network Error",
        description: "Failed to fetch blockchain data",
        vari