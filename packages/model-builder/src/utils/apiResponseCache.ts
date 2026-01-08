/**
 * API Response Cache Utility
 * Caches API responses with TTL (time-to-live) support
 */

interface CachedResponse {
  data: unknown
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class ApiResponseCache {
  private cache = new Map<string, CachedResponse>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes default

  /**
   * Store a response in cache
   */
  set(key: string, data: unknown, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  /**
   * Get a response from cache if it exists and is not expired
   */
  get(key: string): unknown | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Clear a specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Generate cache key from tool ID and parameters
   */
  generateKey(toolId: string, params: Record<string, unknown>): string {
    const paramString = JSON.stringify(params)
    return `${toolId}:${paramString}`
  }
}

export const apiResponseCache = new ApiResponseCache()

// Clean up expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiResponseCache.clearExpired()
  }, 60 * 1000)
}

