'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Zap, 
  ArrowRight, 
  Copy, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Lightbulb
} from 'lucide-react'
import { LegacyPatternDetector, LegacyPattern } from '@/lib/migration/legacy-pattern-detector'
import { RealtimeValidator, ValidationResult, ModernizationResult } from '@/lib/migration/realtime-validator'

interface CodeModernizerProps {
  className?: string
}

interface TransformationStep {
  id: string
  title: string
  description: string
  before: string
  after: string
  pattern: LegacyPattern
  applied: boolean
}

export function CodeModernizer({ className }: CodeModernizerProps) {
  const [inputCode, setInputCode] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [modernizationResult, setModernizationResult] = useState<ModernizationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isModernizing, setIsModernizing] = useState(false)
  const [selectedPatterns, setSelectedPatterns] = useState<Set<string>>(new Set())
  const [expandedEducation, setExpandedEducation] = useState<Set<string>>(new Set())

  // Initialize validators
  const validator = useMemo(() => new RealtimeValidator(), [])
  const patternDetector = useMemo(() => new LegacyPatternDetector(), [])

  // Validate code in real-time
  const validateCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setValidationResult(null)
      setModernizationResult(null)
      return
    }

    setIsValidating(true)
    try {
      const result = await validator.validateUserInput(code)
      setValidationResult(result)
      
      // Auto-select all critical patterns
      const criticalPatterns = result.patterns
        .filter(p => p.severity === 'critical')
        .map(p => `${p.type}-${p.location.line}-${p.location.column}`)
      setSelectedPatterns(new Set(criticalPatterns))
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setIsValidating(false)
    }
  }, [validator])

  // Modernize code with selected patterns
  const modernizeCode = useCallback(async () => {
    if (!validationResult || selectedPatterns.size === 0) return

    setIsModernizing(true)
    try {
      const result = validator.autoModernizeCode(inputCode, {
        autoFixCritical: true,
        autoFixWarnings: true,
        preserveComments: true,
        addExplanationComments: false
      })
      setModernizationResult(result)
    } catch (error) {
      console.error('Modernization error:', error)
    } finally {
      setIsModernizing(false)
    }
  }, [validator, inputCode, validationResult, selectedPatterns])

  // Handle pattern selection
  const togglePatternSelection = useCallback((patternId: string) => {
    setSelectedPatterns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(patternId)) {
        newSet.delete(patternId)
      } else {
        newSet.add(patternId)
      }
      return newSet
    })
  }, [])

  // Handle education expansion
  const toggleEducationExpansion = useCallback((type: string) => {
    setExpandedEducation(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }, [])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [])

  // Get severity icon and color
  const getSeverityDisplay = (severity: LegacyPattern['severity']) => {
    switch (severity) {
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
      case 'warning':
        return { icon: Info, color: 'text-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' }
      case 'suggestion':
        return { icon: Lightbulb, color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' }
    }
  }

  // Create transformation steps
  const transformationSteps = useMemo((): TransformationStep[] => {
    if (!validationResult) return []

    return validationResult.patterns.map((pattern, index) => {
      const patternId = `${pattern.type}-${pattern.location.line}-${pattern.location.column}`
      return {
        id: patternId,
        title: pattern.description,
        description: pattern.suggestedFix,
        before: pattern.originalText,
        after: pattern.modernReplacement,
        pattern,
        applied: selectedPatterns.has(patternId)
      }
    })
  }, [validationResult, selectedPatterns])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Cadence Code Modernizer</h2>
        <p className="text-muted-foreground">
          Paste your legacy Cadence code below to get modern Cadence 1.0 syntax with explanations
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Legacy Code Input
          </CardTitle>
          <CardDescription>
            Paste your Cadence code here. We'll analyze it for legacy patterns and provide modernization suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="// Paste your legacy Cadence code here...
access(all) contract MyContract {
    access(all) var value: String
    
    access(all) fun getValue(): String {
        return self.value
    }
}"
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value)
              validateCode(e.target.value)
            }}
            className="min-h-[200px] font-mono text-sm"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isValidating && (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              )}
              {validationResult && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Analysis complete ({validationResult.validationTime.toFixed(1)}ms)
                </>
              )}
            </div>
            
            {validationResult && validationResult.patterns.length > 0 && (
              <Button 
                onClick={modernizeCode}
                disabled={isModernizing || selectedPatterns.size === 0}
                className="gap-2"
              >
                {isModernizing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Modernize Selected ({selectedPatterns.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {validationResult && (
        <Tabs defaultValue="patterns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patterns" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Patterns ({validationResult.patterns.length})
            </TabsTrigger>
            <TabsTrigger value="modernized" disabled={!modernizationResult}>
              <ArrowRight className="h-4 w-4" />
              Modernized
            </TabsTrigger>
            <TabsTrigger value="comparison" disabled={!modernizationResult}>
              <Copy className="h-4 w-4" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="education">
              <BookOpen className="h-4 w-4" />
              Learn More
            </TabsTrigger>
          </TabsList>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4">
            {validationResult.patterns.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <h3 className="text-lg font-semibold">Code looks modern!</h3>
                    <p className="text-muted-foreground">
                      No legacy patterns detected. Your code is already using Cadence 1.0 syntax.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {transformationSteps.map((step) => {
                  const { icon: Icon, color, bgColor, borderColor } = getSeverityDisplay(step.pattern.severity)
                  const patternId = step.id
                  const isSelected = selectedPatterns.has(patternId)

                  return (
                    <Card key={step.id} className={`${borderColor} ${isSelected ? bgColor : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePatternSelection(patternId)}
                              className="rounded"
                            />
                            <Icon className={`h-4 w-4 ${color}`} />
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{step.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Line {step.pattern.location.line}, Column {step.pattern.location.column}
                                </p>
                              </div>
                              <Badge variant={step.pattern.severity === 'critical' ? 'destructive' : 
                                           step.pattern.severity === 'warning' ? 'secondary' : 'outline'}>
                                {step.pattern.severity}
                              </Badge>
                            </div>
                            
                            <p className="text-sm">{step.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-red-600">Before:</h5>
                                <code className="block p-2 bg-red-50 border border-red-200 rounded text-sm font-mono">
                                  {step.before}
                                </code>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-green-600">After:</h5>
                                <code className="block p-2 bg-green-50 border border-green-200 rounded text-sm font-mono">
                                  {step.after}
                                </code>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Modernized Tab */}
          <TabsContent value="modernized" className="space-y-4">
            {modernizationResult && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Modernized Code</CardTitle>
                      <CardDescription>
                        {modernizationResult.transformationsApplied.length} transformations applied
                        {modernizationResult.requiresManualReview && ' • Manual review required'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(modernizationResult.modernizedCode)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <pre className="text-sm font-mono p-4 bg-muted rounded-lg overflow-x-auto">
                      {modernizationResult.modernizedCode}
                    </pre>
                  </ScrollArea>
                  
                  {modernizationResult.warnings.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold text-yellow-600">Warnings:</h4>
                      {modernizationResult.warnings.map((warning, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{warning}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            {modernizationResult && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Original Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <pre className="text-sm font-mono p-4 bg-red-50 border border-red-200 rounded-lg overflow-x-auto">
                        {modernizationResult.originalCode}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Modernized Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <pre className="text-sm font-mono p-4 bg-green-50 border border-green-200 rounded-lg overflow-x-auto">
                        {modernizationResult.modernizedCode}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            {validationResult.educationalContent.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <BookOpen className="h-12 w-12 text-blue-500 mx-auto" />
                    <h3 className="text-lg font-semibold">No educational content needed</h3>
                    <p className="text-muted-foreground">
                      Your code doesn't contain patterns that need explanation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {validationResult.educationalContent.map((content) => (
                  <Card key={content.pattern}>
                    <Collapsible
                      open={expandedEducation.has(content.pattern)}
                      onOpenChange={() => toggleEducationExpansion(content.pattern)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{content.title}</CardTitle>
                              <CardDescription>{content.description}</CardDescription>
                            </div>
                            {expandedEducation.has(content.pattern) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Why Modernize?</h4>
                            <p className="text-sm text-muted-foreground">{content.whyModernize}</p>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="font-semibold mb-2">Benefits:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {content.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {content.learnMoreUrl && (
                            <>
                              <Separator />
                              <div>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={content.learnMoreUrl} target="_blank" rel="noopener noreferrer">
                                    Learn More
                                  </a>
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}