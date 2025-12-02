/**
 * API Retry Utility
 * Handles transient failures with exponential backoff
 */

interface RetryOptions {
    retries?: number
    backoff?: number
    maxBackoff?: number
}

export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryOptions: RetryOptions = {}
): Promise<Response> {
    const {
        retries = 3,
        backoff = 1000,
        maxBackoff = 5000
    } = retryOptions

    let attempt = 0

    while (attempt < retries) {
        try {
            const response = await fetch(url, options)

            // If successful or client error (4xx), return immediately
            // We only retry on server errors (5xx) or network failures
            if (response.ok || (response.status >= 400 && response.status < 500)) {
                return response
            }

            throw new Error(`Server error: ${response.status}`)
        } catch (error) {
            attempt++

            if (attempt >= retries) {
                throw error
            }

            // Calculate delay with exponential backoff and jitter
            const delay = Math.min(
                backoff * Math.pow(2, attempt - 1) + Math.random() * 100,
                maxBackoff
            )

            console.warn(`API call failed, retrying in ${delay}ms... (Attempt ${attempt}/${retries})`)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    throw new Error('Max retries exceeded')
}
