import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGeocodingService } from './useGeocodingService'
import type { NominatimProvider } from '../providers/NominatimProvider'
import type { TokenBucketRateLimiter } from '../utils/TokenBucketRateLimiter'

// モックオブジェクトの型定義
const mockProvider = {
  name: 'nominatim',
  rateLimit: { requestsPerSecond: 1 },
  geocode: vi.fn()
} as unknown as NominatimProvider

const mockRateLimiter = {
  canProceed: vi.fn(),
  getStatus: vi.fn(),
  reset: vi.fn()
} as unknown as TokenBucketRateLimiter

describe('useGeocodingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should geocode successfully when rate limit allows', async () => {
    const service = useGeocodingService(mockProvider, mockRateLimiter)
    
    // レート制限OK、プロバイダ成功のモック
    vi.mocked(mockRateLimiter.canProceed).mockResolvedValue(true)
    vi.mocked(mockProvider.geocode).mockResolvedValue({
      lat: 45.4064,
      lng: 141.6731
    })

    const result = await service.geocode('稚内市')
    
    expect(result).toEqual({
      coordinates: { lat: 45.4064, lng: 141.6731 },
      source: 'provider',
      provider: 'nominatim',
      responseTime: expect.any(Number)
    })
    expect(mockRateLimiter.canProceed).toHaveBeenCalled()
    expect(mockProvider.geocode).toHaveBeenCalledWith('稚内市')
  })

  it('should throw error when rate limited', async () => {
    const service = useGeocodingService(mockProvider, mockRateLimiter)
    
    vi.mocked(mockRateLimiter.canProceed).mockResolvedValue(false)

    await expect(service.geocode('稚内市'))
      .rejects.toThrow('Rate limit exceeded')
    
    expect(mockProvider.geocode).not.toHaveBeenCalled()
  })

  it('should return cached result when available', async () => {
    const service = useGeocodingService(mockProvider, mockRateLimiter)
    
    // 最初のリクエスト
    vi.mocked(mockRateLimiter.canProceed).mockResolvedValue(true)
    vi.mocked(mockProvider.geocode).mockResolvedValue({
      lat: 45.4064,
      lng: 141.6731
    })

    await service.geocode('稚内市')
    
    // 2回目のリクエスト - キャッシュから取得
    const cachedResult = await service.geocode('稚内市')
    
    expect(cachedResult.source).toBe('cache')
    expect(mockProvider.geocode).toHaveBeenCalledTimes(1) // 1回のみ呼ばれる
  })

  it('should provide metrics', () => {
    const service = useGeocodingService(mockProvider, mockRateLimiter)
    
    vi.mocked(mockRateLimiter.getStatus).mockReturnValue({
      tokensRemaining: 1,
      nextRefillTime: Date.now() + 1000
    })

    const metrics = service.getMetrics()
    
    expect(metrics).toMatchObject({
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        rateLimited: 0,
        cached: 0
      },
      performance: {
        averageResponseTime: 0,
        cacheHitRate: 0
      },
      rateLimiter: {
        tokensRemaining: 1,
        nextRefillTime: expect.any(Number)
      },
      provider: {
        name: 'nominatim',
        lastResponse: 0,
        errorCount: 0
      }
    })
  })

  it('should clear cache', async () => {
    const service = useGeocodingService(mockProvider, mockRateLimiter)
    
    // キャッシュに値を設定
    vi.mocked(mockRateLimiter.canProceed).mockResolvedValue(true)
    vi.mocked(mockProvider.geocode).mockResolvedValue({
      lat: 45.4064,
      lng: 141.6731
    })
    
    await service.geocode('稚内市')
    
    // キャッシュクリア
    service.clearCache()
    
    // 再度リクエスト - プロバイダが呼ばれるべき
    await service.geocode('稚内市')
    
    expect(mockProvider.geocode).toHaveBeenCalledTimes(2)
  })

  it('should calculate cache hit rate correctly', async () => {
    const service = useGeocodingService(mockProvider, mockRateLimiter)
    
    vi.mocked(mockRateLimiter.canProceed).mockResolvedValue(true)
    vi.mocked(mockProvider.geocode).mockResolvedValue({
      lat: 45.4064,
      lng: 141.6731
    })

    // 1回目: プロバイダ呼び出し
    await service.geocode('稚内市')
    // 2回目: キャッシュヒット
    await service.geocode('稚内市')
    
    const metrics = service.getMetrics()
    expect(metrics.performance.cacheHitRate).toBe(50) // 1/2 = 50%
  })

  it('should handle provider errors correctly', async () => {
    const service = useGeocodingService(mockProvider, mockRateLimiter)
    
    vi.mocked(mockRateLimiter.canProceed).mockResolvedValue(true)
    vi.mocked(mockProvider.geocode).mockRejectedValue(new Error('API Error'))

    await expect(service.geocode('稚内市'))
      .rejects.toThrow('API Error')
    
    const metrics = service.getMetrics()
    expect(metrics.requests.failed).toBe(1)
    expect(metrics.provider.errorCount).toBe(1)
  })
})