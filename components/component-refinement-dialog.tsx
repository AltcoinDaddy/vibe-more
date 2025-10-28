"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { ComponentRefinementRequest } from "./types/chat-types"

interface ComponentRefinementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentPath: string
  componentType: string
  onSubmit: (request: ComponentRefinementRequest) => void
}

export function ComponentRefinementDialog({
  open,
  onOpenChange,
  componentPath,
  componentType,
  onSubmit
}: ComponentRefinementDialogProps) {
  const [refinementType, setRefinementType] = React.useState<string>("")
  const [description, setDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const refinementOptions = [
    {
      value: "modify",
      label: "Modify Existing Feature",
      description: "Change how an existing feature works",
      icon: <Icons.edit className="h-4 w-4" />
    },
    {
      value: "add_feature",
      label: "Add New Feature",
      description: "Add new functionality to this component",
      icon: <Icons.plus className="h-4 w-4" />
    },
    {
      value: "fix_issue",
      label: "Fix Issue",
      description: "Fix a bug or problem with this component",
      icon: <Icons.bug className="h-4 w-4" />
    },
    {
      value: "optimize",
      label: "Optimize Performance",
      description: "Improve performance or code quality",
      icon: <Icons.zap className="h-4 w-4" />
    }
  ]

  const getComponentTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <Icons.code className="h-4 w-4 text-blue-500" />
      case 'component':
        return <Icons.component className="h-4 w-4 text-green-500" />
      case 'api':
        return <Icons.server className="h-4 w-4 text-purple-500" />
      case 'config':
        return <Icons.settings className="h-4 w-4 text-orange-500" />
      default:
        return <Icons.file className="h-4 w-4 text-gray-400" />
    }
  }

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'component': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'api': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'config': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const handleSubmit = async () => {
    if (!refinementType || !description.trim()) return

    setIsSubmitting(true)
    
    const request: ComponentRefinementRequest = {
      componentPath,
      componentType: componentType as any,
      refinementType: refinementType as any,
      description: description.trim()
    }

    try {
      await onSubmit(request)
      onOpenChange(false)
      setRefinementType("")
      setDescription("")
    } catch (error) {
      console.error("Failed to submit refinement request:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedOption = refinementOptions.find(opt => opt.value === refinementType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.edit className="h-5 w-5" />
            Refine Component
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Component Info */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
            {getComponentTypeIcon(componentType)}
            <div className="flex-1">
              <p className="font-medium text-sm">{componentPath.split('/').pop()}</p>
              <p className="text-xs text-muted-foreground">{componentPath}</p>
            </div>
            <Badge className={getComponentTypeColor(componentType)}>
              {componentType}
            </Badge>
          </div>

          {/* Refinement Type */}
          <div className="space-y-2">
            <Label htmlFor="refinement-type">What would you like to do?</Label>
            <Select value={refinementType} onValueChange={setRefinementType}>
              <SelectTrigger>
                <SelectValue placeholder="Select refinement type..." />
              </SelectTrigger>
              <SelectContent>
                {refinementOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Describe your changes
              {selectedOption && (
                <span className="text-muted-foreground ml-1">
                  ({selectedOption.label.toLowerCase()})
                </span>
              )}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                refinementType === "modify" 
                  ? "Describe what you want to change and how..."
                  : refinementType === "add_feature"
                  ? "Describe the new feature you want to add..."
                  : refinementType === "fix_issue"
                  ? "Describe the issue and how you want it fixed..."
                  : refinementType === "optimize"
                  ? "Describe what you want to optimize..."
                  : "Describe what you want to do with this component..."
              }
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you want to change. The AI will modify this component and any related files.
            </p>
          </div>

          {/* Warning */}
          {refinementType && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
              <Icons.alertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">This will modify your project</p>
                <p className="text-xs mt-1">
                  The AI will update this component and any related files to implement your changes. 
                  Make sure to review the changes before deploying.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!refinementType || !description.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Icons.loader className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icons.sparkles className="h-4 w-4 mr-2" />
                Refine Component
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}