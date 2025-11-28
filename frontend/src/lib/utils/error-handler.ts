/**
 * Unified Error Handler
 * 
 * Provides consistent error handling across the application.
 * Supports both Arabic and English error messages.
 */

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

export interface AppError {
  code: ErrorCode
  message: string
  messageAr?: string
  details?: Record<string, any>
  originalError?: Error
}

export class AppError extends Error implements AppError {
  constructor(
    public code: ErrorCode,
    message: string,
    public messageAr?: string,
    public details?: Record<string, any>,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /**
   * Get localized error message
   */
  getLocalizedMessage(lang: 'ar' | 'en' = 'ar'): string {
    if (lang === 'ar' && this.messageAr) {
      return this.messageAr
    }
    return this.message
  }

  /**
   * Convert to user-friendly format
   */
  toUserFriendly(lang: 'ar' | 'en' = 'ar'): {
    title: string
    message: string
    code?: string
  } {
    const message = this.getLocalizedMessage(lang)
    
    const titles: Record<ErrorCode, { ar: string; en: string }> = {
      NETWORK_ERROR: { ar: 'خطأ في الاتصال', en: 'Network Error' },
      AUTH_ERROR: { ar: 'خطأ في المصادقة', en: 'Authentication Error' },
      VALIDATION_ERROR: { ar: 'خطأ في التحقق', en: 'Validation Error' },
      NOT_FOUND: { ar: 'غير موجود', en: 'Not Found' },
      PERMISSION_DENIED: { ar: 'غير مصرح', en: 'Permission Denied' },
      RATE_LIMIT: { ar: 'تجاوز الحد المسموح', en: 'Rate Limit Exceeded' },
      SERVER_ERROR: { ar: 'خطأ في الخادم', en: 'Server Error' },
      UNKNOWN_ERROR: { ar: 'خطأ غير معروف', en: 'Unknown Error' },
    }

    return {
      title: titles[this.code][lang],
      message,
      code: this.code,
    }
  }
}

/**
 * Create error from unknown error type
 */
export function createAppError(
  error: unknown,
  lang: 'ar' | 'en' = 'ar'
): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return new AppError(
        'NETWORK_ERROR',
        'Network request failed. Please check your connection.',
        'فشل طلب الشبكة. يرجى التحقق من اتصالك.',
        {},
        error
      )
    }

    // Auth errors
    if (message.includes('unauthorized') || message.includes('auth')) {
      return new AppError(
        'AUTH_ERROR',
        'Authentication failed. Please log in again.',
        'فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.',
        {},
        error
      )
    }

    // Rate limit
    if (message.includes('rate limit') || message.includes('429')) {
      return new AppError(
        'RATE_LIMIT',
        'Too many requests. Please wait a moment.',
        'تم تجاوز الحد المسموح. يرجى الانتظار قليلاً.',
        {},
        error
      )
    }

    // Not found
    if (message.includes('not found') || message.includes('404')) {
      return new AppError(
        'NOT_FOUND',
        'Resource not found.',
        'المورد غير موجود.',
        {},
        error
      )
    }

    // Server errors
    if (message.includes('server') || message.includes('500')) {
      return new AppError(
        'SERVER_ERROR',
        'Server error occurred. Please try again later.',
        'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
        {},
        error
      )
    }
  }

  // Unknown error
  return new AppError(
    'UNKNOWN_ERROR',
    'An unexpected error occurred.',
    'حدث خطأ غير متوقع.',
    { original: String(error) },
    error instanceof Error ? error : new Error(String(error))
  )
}

/**
 * Handle API errors
 */
export async function handleApiError(
  response: Response,
  lang: 'ar' | 'en' = 'ar'
): Promise<AppError> {
  let errorData: any = {}
  
  try {
    errorData = await response.json()
  } catch {
    // If response is not JSON, use status text
    errorData = { message: response.statusText }
  }

  const status = response.status
  const message = errorData.message || errorData.error || 'Unknown error'

  switch (status) {
    case 401:
      return new AppError(
        'AUTH_ERROR',
        'Unauthorized. Please log in again.',
        'غير مصرح. يرجى تسجيل الدخول مرة أخرى.',
        errorData
      )
    case 403:
      return new AppError(
        'PERMISSION_DENIED',
        'Permission denied.',
        'غير مصرح.',
        errorData
      )
    case 404:
      return new AppError(
        'NOT_FOUND',
        'Resource not found.',
        'المورد غير موجود.',
        errorData
      )
    case 429:
      return new AppError(
        'RATE_LIMIT',
        'Too many requests. Please wait.',
        'تم تجاوز الحد المسموح. يرجى الانتظار.',
        errorData
      )
    case 400:
      return new AppError(
        'VALIDATION_ERROR',
        message,
        errorData.messageAr || message,
        errorData
      )
    case 500:
    case 502:
    case 503:
      return new AppError(
        'SERVER_ERROR',
        'Server error. Please try again later.',
        'خطأ في الخادم. يرجى المحاولة لاحقاً.',
        errorData
      )
    default:
      return new AppError(
        'UNKNOWN_ERROR',
        message,
        errorData.messageAr || message,
        errorData
      )
  }
}

/**
 * Log error for monitoring
 */
export function logError(error: AppError, context?: Record<string, any>) {
  console.error('[AppError]', {
    code: error.code,
    message: error.message,
    details: error.details,
    context,
    original: error.originalError,
  })

  // TODO: Send to error monitoring service (Sentry, etc.)
}

