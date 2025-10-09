import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Navigation } from "@/components/navigation"

export const metadata: Metadata = {
  title: "VibeMore - AI-Powered Flow Smart Contract Studio",
  description: "Build and deploy Flow blockchain smart contracts using natural language",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Navigation />
        {children}
      </body>
    </html>
  )
}
