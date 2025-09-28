"use client"

import { ReactNode } from "react"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useAuth } from '@clerk/nextjs'

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

  if (process.env.NODE_ENV === 'development') {
    if (!process.env.CLERK_JWT_ISSUER) {
      console.warn('[convex] Missing CLERK_JWT_ISSUER env var. Add it so convex/auth.config.ts can register your Clerk issuer.');
    }
  }
  
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}