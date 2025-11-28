"use client"

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  lang?: "ar" | "en"
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error("[ErrorBoundary] Caught error:", error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // TODO: Send to error logging service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: errorInfo } })
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      const lang = this.props.lang || "ar"
      const isDevelopment = process.env.NODE_ENV === "development"

      return (
        <Card className="p-8 m-4 border-destructive/50 bg-destructive/5">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">
                {lang === "ar" ? "حدث خطأ" : "Something went wrong"}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {lang === "ar"
                  ? "نعتذر، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية."
                  : "We're sorry, an unexpected error occurred. Please try again or return to the home page."}
              </p>
            </div>

            {isDevelopment && this.state.error && (
              <Card className="p-4 mt-4 bg-black/40 border-destructive/30 max-w-2xl w-full text-left">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-destructive">
                    {lang === "ar" ? "تفاصيل الخطأ (وضع التطوير):" : "Error Details (Development Mode):"}
                  </p>
                  <pre className="text-xs text-muted-foreground overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {"\n\n"}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              </Card>
            )}

            <div className="flex gap-3 mt-6">
              <Button onClick={this.handleReset} variant="default" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {lang === "ar" ? "إعادة المحاولة" : "Try Again"}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  {lang === "ar" ? "الصفحة الرئيسية" : "Home"}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based Error Boundary (for functional components)
 * Note: React doesn't support hooks for error boundaries yet,
 * but this provides a wrapper component
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

