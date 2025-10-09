"use client"

import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

// Types for quality feedback
export interface QualityIssue {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type: string
  location: {
    line: number
    column: number
    length?: number
    context?: string
  }
  message: string
  description: string
  suggestedFix: string
  autoFixable: boolean
  confidence: number
  educationalContent?: {
    title: string
    explanation: string
    example?: string
    learnMoreUrl?: string
  }
}

export interface QualityMetrics {
  qualityScore: number
  validationResults: Array<{
    type: 'syntax' | 'logic' | 'completeness' | 'best-practices'
    passed: boolean
    issues: QualityIssue[]
    score: number
    message?: string
  }>
  fallbackUsed: boolean
  generationMetrics: {
    attemptCount: number
    totalGenerationTime: number
    validationTime: number
    correctionTime: number
    finalQualityScore: number
    issuesDetected: number
    issuesFixed: number
    startTime: Date
    endTime?: Date
  }
  correctionHistory: Array<{
    attemptNumber: number
    timestamp: Date
    corrections: Array<{
      type: string
      location: { line: number; column: number }
      originalValue: string
      correctedValue: string
      reasoning: string
      confidence: number
    }>
    success: boolean
    qualityImprovement: number
  }>
}

export interface QualityFeedbackProps {
  qualityMetrics?: QualityMetrics
  isGenerating?: boolean
  onRetryGeneration?: () => void
  onApplyFix?: (issueId: string) => void
  onLearnMore?: (topic: string) => void
  className?: string
}

export function QualityFeedback({
  qualityMetrics,
  isGenerating = false,
  onRetryGeneration,
  onApplyFix,
  onLearnMore,
  className
}: QualityFeedbackProps) {
  if (!qualityMetrics && !isGenerating) {
    return null
  }

  const allIssues = qualityMetrics?.validationResults.flatMap(result => result.issues) || []
  const criticalIssues = allIssues.filter(issue => issue.severity === 'critical')
  const warningIssues = allIssues.filter(issue => issue.severity === 'warning')
  const infoIssues = allIssues.filter(issue => issue.severity === 'info')

  const getQualityColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getQualityBadgeVariant = (score: number) => {
    if (score >= 90) return "default"
    if (score >= 70) return "secondary"
    return "destructive"
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Icons.alertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <Icons.alertCircle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Icons.info className="h-4 w-4 text-blue-500" />
      default:
        return <Icons.info className="h-4 w-4" />
    }
  }

  if (isGenerating) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Quality Assurance in Progress
          </CardTitle>
          <CardDescription>
            Analyzing and improving code quality...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generation Progress</span>
                <span>Processing...</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• Generating code with AI</p>
              <p>• Scanning for undefined values and syntax errors</p>
              <p>• Applying automatic corrections</p>
              <p>• Validating final quality</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Quality Assessment
              <Badge 
                variant={getQualityBadgeVariant(qualityMetrics?.qualityScore || 0)}
                className="ml-2"
              >
                {qualityMetrics?.qualityScore || 0}/100
              </Badge>
            </CardTitle>
            <CardDescription>
              Code quality analysis and improvement suggestions
            </CardDescription>
          </div>
          {qualityMetrics?.fallbackUsed && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Fallback Used
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues" className="relative">
              Issues
              {allIssues.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {allIssues.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Quality</span>
                  <span className={getQualityColor(qualityMetrics?.qualityScore || 0)}>
                    {qualityMetrics?.qualityScore || 0}%
                  </span>
                </div>
                <Progress 
                  value={qualityMetrics?.qualityScore || 0} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Generation Summary</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Attempts: {qualityMetrics?.generationMetrics.attemptCount || 0}</div>
                  <div>Issues Fixed: {qualityMetrics?.generationMetrics.issuesFixed || 0}</div>
                  <div>Time: {Math.round((qualityMetrics?.generationMetrics.totalGenerationTime || 0) / 1000)}s</div>
                </div>
              </div>
            </div>

            {qualityMetrics?.fallbackUsed && (
              <Alert>
                <Icons.info className="h-4 w-4" />
                <AlertTitle>Fallback Template Used</AlertTitle>
                <AlertDescription>
                  The AI generation required a fallback template to ensure code quality. 
                  Consider refining your prompt for better results.
                </AlertDescription>
              </Alert>
            )}

            {criticalIssues.length > 0 && (
              <Alert variant="destructive">
                <Icons.alertTriangle className="h-4 w-4" />
                <AlertTitle>Critical Issues Detected</AlertTitle>
                <AlertDescription>
                  {criticalIssues.length} critical issue{criticalIssues.length !== 1 ? 's' : ''} found. 
                  These must be resolved before deployment.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {allIssues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icons.checkCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">No Issues Found</p>
                <p className="text-sm">Your code meets all quality standards!</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {allIssues.map((issue, index) => (
                    <IssueCard
                      key={issue.id || index}
                      issue={issue}
                      onApplyFix={onApplyFix}
                      onLearnMore={onLearnMore}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <QualitySuggestions 
              qualityMetrics={qualityMetrics}
              onRetryGeneration={onRetryGeneration}
            />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <QualityMetricsView qualityMetrics={qualityMetrics} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface IssueCardProps {
  issue: QualityIssue
  onApplyFix?: (issueId: string) => void
  onLearnMore?: (topic: string) => void
}

function IssueCard({ issue, onApplyFix, onLearnMore }: IssueCardProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Icons.alertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <Icons.alertCircle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Icons.info className="h-4 w-4 text-blue-500" />
      default:
        return <Icons.info className="h-4 w-4" />
    }
  }

  return (
    <Card className="border-l-4 border-l-red-500 data-[severity=warning]:border-l-yellow-500 data-[severity=info]:border-l-blue-500" data-severity={issue.severity}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            {getSeverityIcon(issue.severity)}
            <div>
              <CardTitle className="text-sm font-medium">{issue.message}</CardTitle>
              <CardDescription className="text-xs">
                Line {issue.location.line}, Column {issue.location.column}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {issue.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{issue.description}</p>
          
          {issue.suggestedFix && (
            <div className="bg-muted/50 rounded-md p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">Suggested Fix:</div>
              <code className="text-xs">{issue.suggestedFix}</code>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {issue.autoFixable && onApplyFix && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onApplyFix(issue.id)}
                  className="h-7 text-xs"
                >
                  <Icons.wrench className="h-3 w-3 mr-1" />
                  Auto Fix
                </Button>
              )}
              {issue.educationalContent && onLearnMore && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onLearnMore(issue.type)}
                  className="h-7 text-xs"
                >
                  <Icons.bookOpen className="h-3 w-3 mr-1" />
                  Learn More
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Confidence: {Math.round(issue.confidence)}%
            </div>
          </div>

          {issue.educationalContent && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                  <Icons.chevronDown className="h-3 w-3 mr-1" />
                  {issue.educationalContent.title}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-md p-3 text-xs">
                  <p className="mb-2">{issue.educationalContent.explanation}</p>
                  {issue.educationalContent.example && (
                    <div className="bg-white dark:bg-gray-900 rounded border p-2 font-mono text-xs">
                      {issue.educationalContent.example}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface QualitySuggestionsProps {
  qualityMetrics?: QualityMetrics
  onRetryGeneration?: () => void
}

function QualitySuggestions({ qualityMetrics, onRetryGeneration }: QualitySuggestionsProps) {
  const suggestions = generateQualitySuggestions(qualityMetrics)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Improvement Suggestions</h4>
        {onRetryGeneration && (
          <Button size="sm" variant="outline" onClick={onRetryGeneration}>
            <Icons.refresh className="h-3 w-3 mr-1" />
            Retry Generation
          </Button>
        )}
      </div>
      
      {suggestions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Icons.thumbsUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p>Great job! No suggestions at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <Icons.lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{suggestion.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                    {suggestion.action && (
                      <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs">
                        {suggestion.action}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface QualityMetricsViewProps {
  qualityMetrics?: QualityMetrics
}

function QualityMetricsView({ qualityMetrics }: QualityMetricsViewProps) {
  if (!qualityMetrics) {
    return <div className="text-center text-muted-foreground">No metrics available</div>
  }

  const { generationMetrics, correctionHistory } = qualityMetrics

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Generation Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Attempts:</span>
              <span className="font-mono">{generationMetrics.attemptCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Total Time:</span>
              <span className="font-mono">{Math.round(generationMetrics.totalGenerationTime / 1000)}s</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Validation Time:</span>
              <span className="font-mono">{Math.round(generationMetrics.validationTime)}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Issue Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Issues Detected:</span>
              <span className="font-mono">{generationMetrics.issuesDetected}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Issues Fixed:</span>
              <span className="font-mono text-green-600">{generationMetrics.issuesFixed}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Success Rate:</span>
              <span className="font-mono">
                {generationMetrics.issuesDetected > 0 
                  ? Math.round((generationMetrics.issuesFixed / generationMetrics.issuesDetected) * 100)
                  : 100}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {correctionHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Correction History</h4>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {correctionHistory.map((attempt, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Attempt {attempt.attemptNumber}</span>
                      <Badge variant={attempt.success ? "default" : "destructive"} className="text-xs">
                        {attempt.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>{attempt.corrections.length} corrections applied</p>
                      <p>Quality improvement: +{attempt.qualityImprovement} points</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// Helper function to generate quality suggestions
function generateQualitySuggestions(qualityMetrics?: QualityMetrics) {
  if (!qualityMetrics) return []

  const suggestions: Array<{
    title: string
    description: string
    action?: string
  }> = []

  const { qualityScore, generationMetrics, fallbackUsed } = qualityMetrics

  if (qualityScore < 70) {
    suggestions.push({
      title: "Improve Code Quality",
      description: "Your code quality score is below the recommended threshold. Consider refining your prompt or adding more specific requirements.",
      action: "Refine Prompt"
    })
  }

  if (fallbackUsed) {
    suggestions.push({
      title: "Fallback Template Used",
      description: "A fallback template was used to ensure basic functionality. Try providing more detailed requirements for better customization.",
      action: "Provide More Details"
    })
  }

  if (generationMetrics.attemptCount > 2) {
    suggestions.push({
      title: "Multiple Attempts Required",
      description: "The AI needed several attempts to generate quality code. Consider breaking down complex requirements into smaller parts.",
      action: "Simplify Request"
    })
  }

  if (generationMetrics.issuesDetected > generationMetrics.issuesFixed) {
    suggestions.push({
      title: "Unresolved Issues",
      description: "Some issues couldn't be automatically fixed. Review the issues tab for manual corrections needed.",
      action: "Review Issues"
    })
  }

  return suggestions
}