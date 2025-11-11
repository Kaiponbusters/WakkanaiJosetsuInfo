/**
 * Geocoding Service with Rate Limiting and Caching
 * ジオコーディングサービス - レート制限とキャッシュ機能付き
 */

import type { NominatimProvider, Coordinates } from './NominatimProvider'
import type { TokenBucketRateLimiter } from '../../utils/TokenBucketRateLimiter'

export interface GeocodingResult {
  coordinates: Coordinates
  source: 'cache' | 'provider'
  provider: string
  responseTime: number
}

export interface GeocodingMetrics {
  requests: {
    total: number
    successful: number
    failed: number
    rateLimited: number
    cached: number
  }
  performance: {
    averageResponseTime: number
    cacheHitRate: number
  }
  rateLimiter: {
    tokensRemaining: number
    nextRefillTime: number
  }
  provider: {
    name: string
    lastResponse: number
    errorCount: number
  }
}

interface CacheEntry {
  coordinates: Coordinates
  timestamp: number
}

interface ServiceMetrics {
  requests: {
    total: number
    successful: number
    failed: number
    rateLimited: number
    cached: number
  }
  performance: {
    averageResponseTime: number
    cacheHitRate: number
  }
  provider: {
    name: string
    lastResponse: number
    errorCount: number
  }
}

export function useGeocodingService(
  provider: NominatimProvider,
  rateLimiter: TokenBucketRateLimiter
) {
  const cache = new Map<string, CacheEntry>()
  const metrics: ServiceMetrics = {
    requests: { total: 0, successful: 0, failed: 0, rateLimited: 0, cached: 0 },
    performance: { averageResponseTime: 0, cacheHitRate: 0 },
    provider: { name: provider.name, lastResponse: 0, errorCount: 0 }
  }
  const responseTimes: number[] = []

  const geocode = async (query: string): Promise<GeocodingResult> => {
    validateQuery(query)
    
    const startTime = performance.now()
    metrics.requests.total++

    // キャッシュチェック
    const cachedResult = checkCache(query)
    if (cachedResult) {
      return createResult(cachedResult.coordinates, 'cache', startTime)
    }

    // レート制限チェック
    await enforceRateLimit()

    try {
      const coordinates = await fetchFromProvider(query)
      storeInCache(query, coordinates)
      recordSuccess(startTime)
      
      return createResult(coordinates, 'provider', startTime)
    } catch (error) {
      recordFailure()
      throw error
    }
  }

  const validateQuery = (query: string): void => {
    if (!query || query.trim() === '') {
      throw new Error('Query cannot be empty')
    }
  }

  const checkCache = (query: string): CacheEntry | null => {
    const cached = cache.get(query)
    if (cached) {
      metrics.requests.cached++
      return cached
    }
    return null
  }

  const enforceRateLimit = async (): Promise<void> => {
    const canProceed = await rateLimiter.canProceed()
    if (!canProceed) {
      metrics.requests.rateLimited++
      throw new Error('Rate limit exceeded')
    }
  }

  const fetchFromProvider = async (query: string): Promise<Coordinates> => {
    return await provider.geocode(query)
  }

  const storeInCache = (query: string, coordinates: Coordinates): void => {
    cache.set(query, { coordinates, timestamp: Date.now() })
  }

  const recordSuccess = (startTime: number): void => {
    metrics.requests.successful++
    metrics.provider.lastResponse = Date.now()
    recordResponseTime(startTime)
  }

  const recordFailure = (): void => {
    metrics.requests.failed++
    metrics.provider.errorCount++
  }

  const recordResponseTime = (startTime: number): void => {
    const responseTime = performance.now() - startTime
    responseTimes.push(responseTime)
    
    // 直近100件のレスポンス時間のみ保持
    if (responseTimes.length > 100) {
      responseTimes.shift()
    }
    
    metrics.performance.averageResponseTime = calculateAverageResponseTime()
  }

  const calculateAverageResponseTime = (): number => {
    if (responseTimes.length === 0) return 0
    const sum = responseTimes.reduce((acc, time) => acc + time, 0)
    return sum / responseTimes.length
  }

  const createResult = (
    coordinates: Coordinates,
    source: 'cache' | 'provider',
    startTime: number
  ): GeocodingResult => {
    return {
      coordinates,
      source,
      provider: provider.name,
      responseTime: performance.now() - startTime
    }
  }

  const getMetrics = (): GeocodingMetrics => {
    const rateLimiterStatus = rateLimiter.getStatus()
    
    return {
      ...metrics,
      performance: {
        ...metrics.performance,
        cacheHitRate: calculateCacheHitRate()
      },
      rateLimiter: {
        tokensRemaining: rateLimiterStatus.tokensRemaining,
        nextRefillTime: rateLimiterStatus.nextRefillTime
      }
    }
  }

  const calculateCacheHitRate = (): number => {
    if (metrics.requests.total === 0) return 0
    return (metrics.requests.cached / metrics.requests.total) * 100
  }

  const clearCache = (): void => {
    cache.clear()
  }

  const resetMetrics = (): void => {
    metrics.requests = { total: 0, successful: 0, failed: 0, rateLimited: 0, cached: 0 }
    metrics.performance = { averageResponseTime: 0, cacheHitRate: 0 }
    metrics.provider = { name: provider.name, lastResponse: 0, errorCount: 0 }
    responseTimes.length = 0
  }

  return {
    geocode,
    getMetrics,
    clearCache,
    resetMetrics
  }
}