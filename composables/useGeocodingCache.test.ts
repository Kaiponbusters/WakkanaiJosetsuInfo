import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

/**
 * TDD専用：テスト用の座標インターフェース
 */
interface Coordinates {
  lat: number
  lng: number
}

/**
 * TDD専用：座標取得の結果とメタデータ（テスト対象）
 */
interface CoordinateResult {
  coordinates: Coordinates
  isFromCache: boolean
  isFromFallback: boolean
  isFallbackUsed: boolean
  errorMessage?: string
  warningMessage?: string
}

// TDD専用のテスト対象実装
function createGeocodingCache(mockFetchWithRateLimit: any) {
  const WAKKANAI_DEFAULT_COORDINATES: Coordinates = {
    lat: 45.4093,
    lng: 141.6739
  }

  const FALLBACK_COORDINATES: Record<string, Coordinates> = {
    '稚内市': { lat: 45.4093, lng: 141.6739 },
    '稚内駅': { lat: 45.4086, lng: 141.6739 },
    'テスト地域': { lat: 45.4000, lng: 141.6700 }
  }

  const getFallbackCoordinates = (area: string): Coordinates | null => {
    return FALLBACK_COORDINATES[area] || null
  }

  const getCoordinates = async (area: string): Promise<CoordinateResult> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(area)}`
      const data = await mockFetchWithRateLimit(url, area)
      
      if (data && data[0]) {
        return {
          coordinates: {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          },
          isFromCache: false,
          isFromFallback: false,
          isFallbackUsed: false
        }
      } else {
        throw new Error(`No coordinates found for ${area}`)
      }
    } catch (error) {
      // フォールバック機能
      const fallbackCoords = getFallbackCoordinates(area)
      if (fallbackCoords) {
        return {
          coordinates: fallbackCoords,
          isFromCache: false,
          isFromFallback: true,
          isFallbackUsed: true,
          warningMessage: `位置情報サービスが利用できないため、${area}の概算位置を表示しています`,
          errorMessage: error instanceof Error ? error.message : 'API接続エラー'
        }
      }
      
      // デフォルトフォールバック
      return {
        coordinates: WAKKANAI_DEFAULT_COORDINATES,
        isFromCache: false,
        isFromFallback: true,
        isFallbackUsed: true,
        warningMessage: `${area}の位置情報が取得できないため、稚内市の中心部を表示しています`,
        errorMessage: error instanceof Error ? error.message : 'API接続エラー'
      }
    }
  }

  return { getCoordinates }
}

describe('useGeocodingCache - TDD実装テスト', () => {
  let mockFetchWithRateLimit: any

  beforeEach(() => {
    mockFetchWithRateLimit = vi.fn()
  })

  it('【Red → Green】API障害時にCoordinateResultでエラー情報を返すべき', async () => {
    // arrange: APIが失敗するようにモック
    mockFetchWithRateLimit.mockRejectedValue(
      new Error('Failed to fetch')
    )

    const cache = createGeocodingCache(mockFetchWithRateLimit)

    // act
    const result = await cache.getCoordinates('テスト地域')
    
    // assert: フォールバック情報付きで返される
    expect(result).toEqual({
      coordinates: expect.objectContaining({
        lat: expect.any(Number),
        lng: expect.any(Number)
      }),
      isFromCache: false,
      isFromFallback: true,
      isFallbackUsed: true,
      warningMessage: expect.stringContaining('位置情報サービスが利用できない'),
      errorMessage: 'Failed to fetch'
    })
  })

  it('【Red → Green】フォールバック座標が見つからない場合は稚内市デフォルトを返すべき', async () => {
    // arrange
    mockFetchWithRateLimit.mockRejectedValue(
      new Error('Connection timeout')
    )

    const cache = createGeocodingCache(mockFetchWithRateLimit)

    // act
    const result = await cache.getCoordinates('存在しない地域名xyz')
    
    // assert: 稚内市のデフォルト座標を返す
    expect(result).toEqual({
      coordinates: {
        lat: 45.4093,
        lng: 141.6739
      },
      isFromCache: false,
      isFromFallback: true,
      isFallbackUsed: true,
      warningMessage: expect.stringContaining('稚内市の中心部を表示'),
      errorMessage: 'Connection timeout'
    })
  })

  it('【Red → Green】API成功時は通常のCoordinateResultを返すべき', async () => {
    // arrange
    const mockApiResponse = [{
      lat: '45.1234',
      lon: '141.5678'
    }]
    
    mockFetchWithRateLimit.mockResolvedValue(mockApiResponse)

    const cache = createGeocodingCache(mockFetchWithRateLimit)

    // act
    const result = await cache.getCoordinates('稚内市')
    
    // assert: エラー情報は含まない
    expect(result).toEqual({
      coordinates: {
        lat: 45.1234,
        lng: 141.5678
      },
      isFromCache: false,
      isFromFallback: false,
      isFallbackUsed: false
    })
    
    // warningMessageとerrorMessageは定義されていない
    expect(result.warningMessage).toBeUndefined()
    expect(result.errorMessage).toBeUndefined()
  })
}) 