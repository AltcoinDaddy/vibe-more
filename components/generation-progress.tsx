"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/icons"
import { GenerationProgress } from "./types/chat-types"

interface GenerationProgressProps {
  progress: GenerationProgress
  className?: string
}

export function GenerationProgressComponent({ progress, className }: GenerationProgressProps) {
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'parsing':
        return <Icons.search className="h-4 w-4" />
      case 'contracts':
        return <Icons.code className="h-4 w-4" />
      case 'frontend':
        return <Icons.component className="h-4 w-4" />
      case 'api':
        return <Icons.server className="h-4 w-4" />
      case 'config':
        return <Icons.settings className="h-4 w-4" />
      case 'integration':
        return <Icons.link className="h-4 w-4" />
      case 'complete':
        return <Icons.check className="h-4 w-4" />
      default:
        return <Icons.loader className="h-4 w-4" />
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'parsing': return 'text-blue-600'
      case 'contracts': return 'text-purple-600'
      case 'frontend': return 'text-green-600'
      case 'api': return 'text-orange-600'
      case 'config': return 'text-gray-600'
      case 'integration': return 'text-indigo-600'
      case 'complete': return 'text-emerald-600'
      default: return 'text-gray-500'
    }
  }

  const phases = [
    { key: 'parsing', label: 'Parsing Requirements' },
    { key: 'contracts', label: 'Smart Contracts' },
    { key: 'frontend', label: 'Frontend Components' },
    { key: 'api', label: 'API Routes' },
    { key: 'config', label: 'Configuration' },
    { key: 'integration', label: 'Integration' },
    { key: 'complete', label: 'Complete' }
  ]

  const currentPhaseIndex = phases.findIndex(p => p.key === progress.phase)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={`${getPhaseColor(progress.phase)} animate-pulse`}>
            {getPhaseIcon(progress.phase)}
          </div>
          Generating Full-Stack Project
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{progress.currentTask}</span>
            <span className="text-muted-foreground">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>

        {/* Phase Indicators */}
        <div className="grid grid-cols-2 gap-2">
          {phases.map((phase, index) => {
            const isActive = phase.key === progress.phase
            const isCompleted = index < currentPhaseIndex
            const isPending = index > currentPhaseIndex

            return (
              <div
                key={phase.key}
                className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : isCompleted 
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className={`${isActive ? 'animate-spin' : ''}`}>
                  {isCompleted ? (
                    <Icons.check className="h-3 w-3 text-green-600" />
                  ) : isActive ? (
                    <Icons.loader className="h-3 w-3" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border-2 border-current opacity-30" />
                  )}
                </div>
                <span className="truncate">{phase.label}</span>
              </div>
            )
          })}
        </div>

        {/* Completed Tasks */}
        {progress.completedTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300">
              Completed Tasks ({progress.completedTasks.length})
            </h4>
            <ScrollArea className="h-20">
              <div className="space-y-1">
                {progress.completedTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icons.check className="h-3 w-3 text-green-500" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Warnings */}
        {progress.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Warnings ({progress.warnings.length})
            </h4>
            <div className="space-y-1">
              {progress.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <Icons.alertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-700 dark:text-yellow-300">{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {progress.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-700 dark:text-red-300">
              Errors ({progress.errors.length})
            </h4>
            <div className="space-y-1">
              {progress.errors.map((error, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <Icons.alertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700 dark:text-red-300">{error}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}