"use client"

import { ReactNode } from "react"
import { ConvexProvider, ConvexReactClient } from "convex/react"

// Initialize the Convex client only if URL is provided
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

interface ConvexClientProviderProps {
  children: ReactNode
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  // If no Convex URL is configured, just render children without ConvexProvider
  if (!convex) {
    return <>{children}</>
  }
  
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}