import { logger } from "../utils/logger"

/**
 * Simple in-memory rate limiter for EOSDA API.
 * Note: In a serverless environment (Vercel), this state is not shared across instances.
 * For production with high traffic, use Redis (Phase 3).
 */
export class EOSDARateLimiter {
    private static instance: EOSDARateLimiter
    private limits: Map<string, { count: number; resetAt: number }> = new Map()

    // Default limits per minute
    private readonly CONFIG = {
        'search': 60,      // 1 request per second avg
        'statistics': 20,  // Heavy computation
        'download': 10,    // Very heavy
        'default': 60
    }

    private constructor() { }

    public static getInstance(): EOSDARateLimiter {
        if (!EOSDARateLimiter.instance) {
            EOSDARateLimiter.instance = new EOSDARateLimiter()
        }
        return EOSDARateLimiter.instance
    }

    /**
     * Check if request is allowed and increment counter
     * @param type API endpoint type
     * @returns true if allowed, false if limit exceeded
     */
    public checkLimit(type: 'search' | 'statistics' | 'download' | 'default'): boolean {
        const now = Date.now()
        const key = type
        const limit = this.CONFIG[type] || this.CONFIG.default

        let usage = this.limits.get(key)

        // Reset if window expired
        if (!usage || now > usage.resetAt) {
            usage = { count: 0, resetAt: now + 60000 } // 1 minute window
            this.limits.set(key, usage)
        }

        if (usage.count >= limit) {
            logger.warn(`EOSDA Rate Limit Exceeded for ${type}: ${usage.count}/${limit}`)
            return false
        }

        usage.count++
        return true
    }

    /**
     * Get remaining quota for a type
     */
    public getRemaining(type: 'search' | 'statistics' | 'download' | 'default'): number {
        const usage = this.limits.get(type)
        const limit = this.CONFIG[type] || this.CONFIG.default

        if (!usage || Date.now() > usage.resetAt) {
            return limit
        }

        return Math.max(0, limit - usage.count)
    }
}

export const eosdaRateLimiter = EOSDARateLimiter.getInstance()
