import { describe, it, expect, vi, beforeEach } from 'vitest'

// テスト用のモック実装
const mockUseState = vi.fn(() => ({
  value: {}
}))

const mockFetchWithRateLimit = vi.fn()

// モジュールのモック設定
vi.mock('#imports', () => ({
  useState: mockUseState
}))

vi.mock('~/composables/useGeocodingApi', () => ({
  useGeocodingApi: () => ({
    fetchWithRateLimit: mockFetchWithRateLimit
  })
}))

// processとlocalStorageのモック
const mockProcess = { client: true }
const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

// グローバルオブジェクトの設定
vi.stubGlobal('process', mockProcess)
vi.stubGlobal('localStorage', mockLocalStorage)

// 動的インポートでテスト対象をロード
const { useGeocodingCache } = await import('./useGeocodingCache')

describe('useGeocodingCache - API障害時エラーハンドリング (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseState.mockReturnValue({ value: {} })
  })

  it('【RED → GREEN】API障害時にCoordinateResultでエラー情報を返すべき', async () => {
    // arrange: APIが失敗するようにモック
    mockFetchWithRateLimit.mockRejectedValue(
      new Error('Failed to fetch')
    )

    const { getCoordinates } = useGeocodingCache()

    // act
    const result = await getCoordinates('テスト地域')
    
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

  it('【RED → GREEN】フォールバック座標が見つからない場合は稚内市デフォルトを返すべき', async () => {
    // arrange
    mockFetchWithRateLimit.mockRejectedValue(
      new Error('Connection timeout')
    )

    const { getCoordinates } = useGeocodingCache()

    // act
    const result = await getCoordinates('存在しない地域名xyz')
    
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

  it('【RED → GREEN】API成功時は通常のCoordinateResultを返すべき', async () => {
    // arrange
    const mockApiResponse = [{
      lat: '45.1234',
      lon: '141.5678'
    }]
    
    mockFetchWithRateLimit.mockResolvedValue(mockApiResponse)

    const { getCoordinates } = useGeocodingCache()

    // act
    const result = await getCoordinates('稚内市')
    
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
    
    // warningMessageとerrorMessageは定義されていない（undefinedではなく存在しない）
    expect(result.warningMessage).toBeUndefined()
    expect(result.errorMessage).toBeUndefined()
  })
}) 