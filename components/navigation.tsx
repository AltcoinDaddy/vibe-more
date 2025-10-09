"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navigation() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          VibeMore
        </Link>

        <div className="flex items-center gap-8">
          <Link href="/templates" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Templates
          </Link>
          <Link href="/modernizer" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Modernizer
          </Link>
          <Link href="/docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Docs
          </Link>
          <Link href="/playground" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Playground
          </Link>
        </div>

        <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
          Get Started
        </Button>
      </div>
    </nav>
  )
}
