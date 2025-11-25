"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Map Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log to monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'map_error', {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack
      })
    }
  }

  handleRetry = () => {
    const maxRetries = 3
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-black/40 border border-red-400/30 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-red-400">
                {this.getErrorMessage()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-white/70">
                {this.getErrorDescription()}
              </div>
              
              {this.state.error && (
                <div className="bg-black/60 border border-red-400/20 rounded-lg p-3">
                  <div className="text-xs text-red-400 font-mono break-all">
                    {this.state.error.message}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleRetry}
                  disabled={this.state.retryCount >= 3}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {this.state.retryCount >= 3 
                    ? "Max retries reached" 
                    : `Retry (${this.state.retryCount}/3)`
                  }
                </Button>
                
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  className="w-full border-red-400/30 text-red-400 hover:bg-red-500/10"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Reset Map
                </Button>
              </div>

              {this.state.retryCount >= 3 && (
                <div className="text-center text-xs text-white/50">
                  Try refreshing the page or check your internet connection
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }

  private getErrorMessage(): string {
    const error = this.state.error
    
    if (error?.message.includes('NetworkError') || error?.message.includes('fetch')) {
      return "Network Connection Error"
    }
    
    if (error?.message.includes('tile') || error?.message.includes('map')) {
      return "Map Loading Error"
    }
    
    if (error?.message.includes('geolocation')) {
      return "Location Access Error"
    }
    
    if (error?.message.includes('API') || error?.message.includes('key')) {
      return "Service Configuration Error"
    }
    
    return "Map Service Unavailable"
  }

  private getErrorDescription(): string {
    const error = this.state.error
    
    if (error?.message.includes('NetworkError') || error?.message.includes('fetch')) {
      return "Unable to load map tiles. Please check your internet connection."
    }
    
    if (error?.message.includes('tile') || error?.message.includes('map')) {
      return "Satellite imagery temporarily unavailable. Please try again in a moment."
    }
    
    if (error?.message.includes('geolocation')) {
      return "Unable to access your location. Please check browser permissions."
    }
    
    if (error?.message.includes('API') || error?.message.includes('key')) {
      return "Map service configuration issue. Please contact support."
    }
    
    return "The map encountered an unexpected error. Our team has been notified."
  }
}

// HOC for easier usage
export function withMapErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <MapErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </MapErrorBoundary>
    )
  }
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('map') || 
        event.reason?.message?.includes('tile') || 
        event.reason?.message?.includes('geolocation')) {
      console.error('Unhandled map promise rejection:', event.reason)
      
      // Track the error
      if ((window as any).gtag) {
        (window as any).gtag('event', 'unhandled_map_error', {
          error_message: event.reason?.message
        })
      }
    }
  })
}

export default MapErrorBoundary
