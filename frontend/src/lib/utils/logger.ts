/**
 * Centralized Logging Utility
 * 
 * Provides consistent logging across the application with:
 * - Environment-based logging (dev vs production)
 * - Structured logging with context
 * - Log levels (debug, info, warn, error)
 * - Support for Arabic and English
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

/**
 * Logger utility with environment-aware logging
 */
export const logger = {
  /**
   * Debug logs - only in development
   */
  debug: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, context || '')
    }
  },

  /**
   * Info logs - only in development
   */
  info: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, context || '')
    }
  },

  /**
   * Warning logs - always logged
   */
  warn: (message: string, context?: LogContext) => {
    console.warn(`[WARN] ${message}`, context || '')
  },

  /**
   * Error logs - always logged with full context
   */
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorContext: LogContext = {
      timestamp: new Date().toISOString(),
      ...context,
    }

    if (error instanceof Error) {
      errorContext.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      }
    } else if (error) {
      errorContext.error = String(error)
    }

    console.error(`[ERROR] ${message}`, errorContext)

    // TODO: Send to error monitoring service (Sentry, etc.) in production
    if (isProd && error) {
      // Example: Sentry.captureException(error, { extra: errorContext })
    }
  },

  /**
   * API request logging
   */
  api: {
    request: (method: string, url: string, context?: LogContext) => {
      if (isDev) {
        console.log(`[API] ${method} ${url}`, context || '')
      }
    },
    response: (method: string, url: string, status: number, context?: LogContext) => {
      if (isDev) {
        const emoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️'
        console.log(`[API] ${emoji} ${method} ${url} → ${status}`, context || '')
      }
    },
    error: (method: string, url: string, error: Error | unknown, context?: LogContext) => {
      logger.error(`[API] ${method} ${url} failed`, error, context)
    },
  },

  /**
   * Service-specific logging
   */
  service: {
    eosda: (message: string, context?: LogContext) => {
      logger.info(`[EOSDA] ${message}`, context)
    },
    supabase: (message: string, context?: LogContext) => {
      logger.info(`[Supabase] ${message}`, context)
    },
    ai: (message: string, context?: LogContext) => {
      logger.info(`[AI] ${message}`, context)
    },
  },
}

/**
 * Create a scoped logger for a specific module
 */
export function createScopedLogger(scope: string) {
  return {
    debug: (message: string, context?: LogContext) => logger.debug(`[${scope}] ${message}`, context),
    info: (message: string, context?: LogContext) => logger.info(`[${scope}] ${message}`, context),
    warn: (message: string, context?: LogContext) => logger.warn(`[${scope}] ${message}`, context),
    error: (message: string, error?: Error | unknown, context?: LogContext) =>
      logger.error(`[${scope}] ${message}`, error, context),
  }
}

export default logger



