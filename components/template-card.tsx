"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DownloadIcon, EyeIcon, SparklesIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/icons"
import type { Template } from "@/lib/templates"
import { getTemplateMigrationInfo, validateTemplateCompatibility } from "@/lib/templates"

interface TemplateCardProps {
  template: Template
  onUse: (template: Template) => void
  onPreview: (template: Template) => void
}

export function TemplateCard({ template, onUse, onPreview }: TemplateCardProps) {
  const categoryColors = {
    nft: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    defi: "bg-green-500/10 text-green-500 border-green-500/20",
    dao: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    marketplace: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    token: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    utility: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
      {template.featured && (
        <div className="absolute right-3 top-3 z-10">
          <Badge className="bg-primary/20 text-primary">
            <SparklesIcon className="mr-1 h-3 w-3" />
            Featured
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <Badge className={categoryColors[template.category]}>{template.category.toUpperCase()}</Badge>
        </div>
        <CardTitle className="text-xl">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>by {template.author}</span>
          <div className="flex items-center gap-1">
            <DownloadIcon className="h-3.5 w-3.5" />
            <span>{template.downloads.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" onClick={() => onPreview(template)} className="flex-1">
          <EyeIcon className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button size="sm" onClick={() => onUse(template)} className="flex-1">
          Use Template
        </Button>
      </CardFooter>
    </Card>
  )
}
