/**
 * Error Logging Service
 * 
 * Centralized error logging and reporting
 */

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  fieldId?: string
  metadata?: Record<string, any>
}

export interface LoggedError {
  message: string
  stack?: string
  context: ErrorContext
  timestamp: string
  userAgent?: string
  url?: string
}

class ErrorLoggingService {
  private errors: LoggedError[] = []
  private maxErrors = 100 // Keep last 100 errors in memory

  /**
   * Log an error with context
   */
  logError(error: Error | string, context: ErrorContext = {}): void {
    const errorMessage = error instanceof Error ? error.message : error
    const errorStack = error instanceof Error ? error.stack : undefined

    const loggedError: LoggedError = {
      message: errorMessage,
      stack: errorStack,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    }

    // Add to in-memory store
    this.errors.unshift(loggedError)
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorLogging]", loggedError)
    }

    // TODO: Send to external service (Sentry, LogRocket, etc.)
    // this.sendToExternalService(loggedError)
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10): LoggedError[] {
    return this.errors.slice(0, limit)
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = []
  }

  /**
   * Send error to external service (e.g., Sentry)
   */
  private async sendToExternalService(error: LoggedError): Promise<void> {
    // TODO: Implement integration with error tracking service
    // Example with Sentry:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(new Error(error.message), {
    //     contexts: {
    //       custom: error.context,
    //     },
    //     tags: {
    //       component: error.context.component,
    //       action: error.context.action,
    //     },
    //   })
    // }

    // Example: Send to API endpoint
    try {
      await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(error),
      })
    } catch (err) {
      // Silently fail - don't break the app if error logging fails
      console.warn("[ErrorLogging] Failed to send error to server:", err)
    }
  }
}

// Singleton instance
export const errorLoggingService = new ErrorLoggingService()

/**
 * Helper function to log errors
 */
export function logError(error: Error | string, context?: ErrorContext): void {
  errorLoggingService.logError(error, context)
}

/**
 * Create error handler for async functions
 */
export function createErrorHandler(context: ErrorContext) {
  return (error: Error | string) => {
    logError(error, context)
    throw error
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), context)
      throw error
    }
  }) as T
}

