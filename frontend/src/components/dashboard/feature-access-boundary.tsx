"use client"

import type React from "react"

interface FeatureAccessBoundaryProps {
  children: React.ReactNode
}

export function FeatureAccessBoundary({ children }: FeatureAccessBoundaryProps) {
  return <>{children}</>
}
