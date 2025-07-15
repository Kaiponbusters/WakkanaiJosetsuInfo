import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGeocodingCache } from './useGeocodingCache.new'

// fetchをモック化
global.fetch = vi.fn()

describe('useGeocodingCache (New Implementation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should maintain backward compatibility with existing interface', async () => {
    const { getCoordinates, clearCache, getStats } = useGeocodingCache()

    // 既存インターフェースが存在することを確認
    expect(typeof getCoordinates).toBe('function')
    expect(typeof clearCache).toBe('function')
    expect(typeof getStats).toBe('function')
  })

  it('should return coordinates in the same format', async () => {
    const mockResponse = [{
      lat: '45.4064',
      lon: '141.6731',
      display_name: '稚内市, 北海道, 日本'
    }]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    const { getCoordinates } = useGeocodingCache()
    const result = await getCoordinates('稚内市')

    // 既存と同じフォーマットで結果を返す
    expect(result).toEqual({
      lat: 45.4064,
      lng: 141.6731
    })
  })

  it('should respect rate limiting (new behavior)', async () => {
    const { getCoordinates } = useGeocodingCache()

    const mockResponse = [{
      lat: '45.4064',
      lon: '141.6731'
    }]

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    // 2回連続でリクエスト
    await getCoordinates('稚内市')
    
    // 2回目は即座に呼ぶとレート制限にかかるはず
    await expect(getCoordinates('小樽市'))
      .rejects.toThrow('Rate limit exceeded')
  })

  it('should maintain cache functionality', async () => {
    const { getCoordinates } = useGeocodingCache()

    const mockResponse = [{
      lat: '45.4064',
      lon: '141.6731'
    }]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    // 1回目の呼び出し
    const result1 = await getCoordinates('稚内市')
    
    // 2回目の呼び出し（キャッシュから取得されるべき）
    const result2 = await getCoordinates('稚内市')

    expect(result1).toEqual(result2)
    expect(fetch).toHaveBeenCalledTimes(1) // 1回のみ呼ばれる
  })

  it('should provide stats in expected format', async () => {
    const { getStats } = useGeocodingCache()
    const stats = getStats()

    expect(stats).toMatchObject({
      hits: expect.any(Number),
      misses: expect.any(Number),
      size: expect.any(Number),
      hitRate: expect.any(Number)
    })
  })

  it('should clear cache correctly', async () => {
    const { getCoordinates, clearCache, getStats } = useGeocodingCache()

    const mockResponse = [{
      lat: '45.4064',
      lon: '141.6731'
    }]

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    // キャッシュに値を設定
    await getCoordinates('稚内市')
    expect(getStats().size).toBeGreaterThan(0)

    // キャッシュクリア
    clearCache()
    expect(getStats().size).toBe(0)
  })
})