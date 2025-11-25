"use client"
import React from "react"

type CommonProps = {
  className?: string
  children: React.ReactNode
}

export function Tabs({ children, className, defaultValue, value, onValueChange }: CommonProps & { 
  defaultValue?: string; 
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <div className={className} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "10px" }}>
      {children}
    </div>
  )
}

export function TabsList({ children, className }: CommonProps) {
  return (
    <div className={className} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
      {children}
    </div>
  )
}

export function TabsTrigger({ children, className, value, onClick }: CommonProps & { 
  value?: string;
  onClick?: (value: string) => void;
}) {
  return (
    <button
      className={className}
      style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer" }}
      onClick={() => value && onClick?.(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ children, className }: CommonProps & { value?: string }) {
  return (
    <div className={className} style={{ padding: "10px" }}>
      {children}
    </div>
  )
}

export default Tabs
