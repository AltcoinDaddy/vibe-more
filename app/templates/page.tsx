"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { templates, getFeaturedTemplates, searchTemplates, type Template } from "@/lib/templates"
import { TemplateCard } from "@/components/template-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchIcon, SparklesIcon } from "@/components/icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function TemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const filteredTemplates = searchQuery
    ? searchTemplates(searchQuery)
    : selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory)

  const featuredTemplates = getFeaturedTemplates()

  const handleUseTemplate = (template: Template) => {
    // Store template in localStorage and redirect to main editor
    localStorage.setItem("selectedTemplate", JSON.stringify(template))
    router.push("/")
  }

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <SparklesIcon className="h-4 w-4" />
            <span>Community Templates</span>
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">Template Hub</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Jumpstart your Flow development with pre-built Cadence smart contract templates
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Featured Section */}
        {!searchQuery && selectedCategory === "all" && (
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Featured Templates</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="nft">NFT</TabsTrigger>
            <TabsTrigger value="defi">DeFi</TabsTrigger>
            <TabsTrigger value="dao">DAO</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="token">Token</TabsTrigger>
            <TabsTrigger value="utility">Utility</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory}>
            {filteredTemplates.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No templates found matching your criteria</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={handleUseTemplate}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <pre className="rounded-lg bg-muted p-4 font-mono text-sm">
              <code>{previewTemplate?.code}</code>
            </pre>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (previewTemplate) {
                  handleUseTemplate(previewTemplate)
                }
              }}
            >
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
