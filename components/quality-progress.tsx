"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

export interface QualityProgressStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress?: number
  duration?: number
  details?: string
  issues?: number
  fixes?: number
}

export interface QualityProgressProps {
  steps: QualityProgressStep[]
  currentStep?: string
  overallProgress?: number
  isActive?: boolean
  onCancel?: () => void
  className?: string
}

export function QualityProgress({
  steps,
  currentStep,
  overallProgress,
  isActive = false,
  onCancel,
  className
}: QualityProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    if (overallProgress !== undefined) {
      const timer = setTimeout(() => {
        setAnimatedProgress(overallProgress)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [overallProgress])

  const getStepIcon = (step: QualityProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <Icons.checkCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <Icons.xCircle className="h-4 w-4 text-red-500" />
      case 'in-progress':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      default:
        return <Icons.circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStepStatus = (step: QualityProgressStep) => {
    switch (step.status) {
      case 'completed':
        return { variant: 'default' as const, text: 'Completed' }
      case 'failed':
        return { variant: 'destructive' as const, text: 'Failed' }
      case 'in-progress':
        return { variant: 'secondary' as const, text: 'In Progress' }
      default:
        return { variant: 'outline' as const, text: 'Pending' }
    }
  }

  const completedSteps = steps.filter(step => step.status === 'completed').length
  const totalSteps = steps.length
  const calculatedProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isActive ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Icons.zap className="h-4 w-4" />
              )}
              Quality Assurance Progress
            </CardTitle>
            <CardDescription>
              {isActive 
                ? "Analyzing and improving your code quality..."
                : "Quality assurance pipeline completed"
              }
            </CardDescription>
          </div>
          {onCancel && isActive && (
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancel quality assurance"
            >
              <Icons.x className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress ?? calculatedProgress)}%</span>
          </div>
          <Progress 
            value={animatedProgress || calculatedProgress} 
            className="h-2 transition-all duration-500 ease-out"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedSteps} of {totalSteps} steps completed</span>
            {isActive && (
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Processing...
              </span>
            )}
          </div>
        </div>

        {/* Step Details */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <QualityProgressStepItem
              key={step.id}
              step={step}
              isActive={currentStep === step.id}
              stepNumber={index + 1}
            />
          ))}
        </div>

        {/* Summary Stats */}
        {!isActive && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {steps.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {steps.filter(s => s.status === 'failed').length}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {steps.reduce((sum, step) => sum + (step.duration || 0), 0)}ms
              </div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface QualityProgressStepItemProps {
  step: QualityProgressStep
  isActive: boolean
  stepNumber: number
}

function QualityProgressStepItem({ step, isActive, stepNumber }: QualityProgressStepItemProps) {
  const statusInfo = getStepStatus(step)

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
      isActive && "bg-primary/5 border-primary/20",
      step.status === 'completed' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
      step.status === 'failed' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {getStepIcon(step)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{step.name}</span>
            <Badge variant={statusInfo.variant} className="text-xs">
              {statusInfo.text}
            </Badge>
          </div>
          {step.duration && (
            <span className="text-xs text-muted-foreground">
              {step.duration}ms
            </span>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mb-2">
          {step.description}
        </p>

        {step.progress !== undefined && step.status === 'in-progress' && (
          <div className="mb-2">
            <Progress value={step.progress} className="h-1" />
          </div>
        )}

        {step.details && (
          <p className="text-xs text-muted-foreground italic">
            {step.details}
          </p>
        )}

        {(step.issues !== undefined || step.fixes !== undefined) && (
          <div className="flex items-center gap-4 mt-2 text-xs">
            {step.issues !== undefined && (
              <span className="flex items-center gap-1 text-red-600">
                <Icons.alertTriangle className="h-3 w-3" />
                {step.issues} issues
              </span>
            )}
            {step.fixes !== undefined && (
              <span className="flex items-center gap-1 text-green-600">
                <Icons.wrench className="h-3 w-3" />
                {step.fixes} fixes
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to get step status info
function getStepStatus(step: QualityProgressStep) {
  switch (step.status) {
    case 'completed':
      return { variant: 'default' as const, text: 'Completed' }
    case 'failed':
      return { variant: 'destructive' as const, text: 'Failed' }
    case 'in-progress':
      return { variant: 'secondary' as const, text: 'In Progress' }
    default:
      return { variant: 'outline' as const, text: 'Pending' }
  }
}

// Helper function to get step icon
function getStepIcon(step: QualityProgressStep) {
  switch (step.status) {
    case 'completed':
      return <Icons.checkCircle className="h-4 w-4 text-green-500" />
    case 'failed':
      return <Icons.xCircle className="h-4 w-4 text-red-500" />
    case 'in-progress':
      return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    default:
      return <Icons.circle className="h-4 w-4 text-muted-foreground" />
  }
}

// Predefined quality assurance steps
export const DEFAULT_QA_STEPS: QualityProgressStep[] = [
  {
    id: 'generation',
    name: 'Code Generation',
    description: 'Generating initial code with AI',
    status: 'pending'
  },
  {
    id: 'pre-validation',
    name: 'Pre-validation Scan',
    description: 'Scanning for undefined values and basic syntax errors',
    status: 'pending'
  },
  {
    id: 'auto-correction',
    name: 'Auto-correction',
    description: 'Applying automatic fixes to detected issues',
    status: 'pending'
  },
  {
    id: 'syntax-validation',
    name: 'Syntax Validation',
    description: 'Comprehensive syntax and structure validation',
    status: 'pending'
  },
  {
    id: 'logic-validation',
    name: 'Logic Validation',
    description: 'Validating contract logic and completeness',
    status: 'pending'
  },
  {
    id: 'quality-scoring',
    name: 'Quality Scoring',
    description: 'Calculating final quality score and metrics',
    status: 'pending'
  }
]