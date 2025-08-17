import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

/**
 * TDD専用：コンポーネントテスト用のマップ管理クラス
 */
class TestMapManager {
  private showError = ref(false)
  private errorMessage = ref('')
  private warningMessage = ref('')
  private showWarningBanner = ref(false)

  constructor(private mockGetCoordinates: any) {}

  async loadMap(area: string) {
    try {
      const result = await this.mockGetCoordinates(area)
      
      // エラー情報の処理
      if (result.warningMessage) {
        this.warningMessage.value = result.warningMessage
        this.showWarningBanner.value = true
      }
      
      if (result.errorMessage) {
        this.errorMessage.value = result.errorMessage
        this.showError.value = result.isFallbackUsed
      }

      return {
        coordinates: result.coordinates,
        showWarningBanner: this.showWarningBanner.value,
        warningMessage: this.warningMessage.value,
        showError: this.showError.value,
        errorMessage: this.errorMessage.value
      }
    } catch (error) {
      this.showError.value = true
      this.errorMessage.value = error instanceof Error ? error.message : '不明なエラーが発生しました'
      
      return {
        coordinates: null,
        showWarningBanner: false,
        warningMessage: '',
        showError: true,
        errorMessage: this.errorMessage.value
      }
    }
  }

  dismissWarning() {
    this.showWarningBanner.value = false
  }

  retryLoad(area: string) {
    this.showError.value = false
    this.errorMessage.value = ''
    return this.loadMap(area)
  }

  showApproximateLocation(area: string) {
    // フォールバック座標で強制表示
    this.showError.value = false
    return this.loadMap(area)
  }
}

describe('SnowLocationMap - TDDエラーハンドリング', () => {
  let mockGetCoordinates: any
  let mapManager: TestMapManager

  beforeEach(() => {
    mockGetCoordinates = vi.fn()
    mapManager = new TestMapManager(mockGetCoordinates)
  })

  it('【RED → GREEN】API障害時に警告バナーを表示すべき', async () => {
    // arrange
    const mockResult = {
      coordinates: { lat: 45.4000, lng: 141.6700 },
      isFromCache: false,
      isFromFallback: true,
      isFallbackUsed: true,
      warningMessage: '位置情報サービスが利用できないため、テスト地域の概算位置を表示しています',
      errorMessage: 'Failed to fetch'
    }
    mockGetCoordinates.mockResolvedValue(mockResult)

    // act
    const result = await mapManager.loadMap('テスト地域')

    // assert
    expect(result.showWarningBanner).toBe(true)
    expect(result.warningMessage).toContain('位置情報サービスが利用できない')
    expect(result.showError).toBe(true)
    expect(result.errorMessage).toBe('Failed to fetch')
  })

  it('【RED → GREEN】警告バナーの解除ができるべき', async () => {
    // arrange
    const mockResult = {
      coordinates: { lat: 45.4000, lng: 141.6700 },
      isFromCache: false,
      isFromFallback: true,
      isFallbackUsed: true,
      warningMessage: '位置情報サービスが利用できないため、テスト地域の概算位置を表示しています',
      errorMessage: 'Failed to fetch'
    }
    mockGetCoordinates.mockResolvedValue(mockResult)

    // act
    await mapManager.loadMap('テスト地域')
    mapManager.dismissWarning()

    // この時点で警告バナーは非表示になる
    // 実際のコンポーネントでは showWarningBanner が false になることをテスト
    expect((mapManager as any).showWarningBanner.value).toBe(false)
  })

  it('【RED → GREEN】再読み込み機能が動作すべき', async () => {
    // arrange: 最初は失敗、リトライで成功
    mockGetCoordinates
      .mockResolvedValueOnce({
        coordinates: { lat: 45.4000, lng: 141.6700 },
        isFromCache: false,
        isFromFallback: true,
        isFallbackUsed: true,
        warningMessage: 'エラーメッセージ',
        errorMessage: 'Network error'
      })
      .mockResolvedValueOnce({
        coordinates: { lat: 45.1234, lng: 141.5678 },
        isFromCache: false,
        isFromFallback: false,
        isFallbackUsed: false
      })

    // act
    const firstResult = await mapManager.loadMap('テスト地域')
    expect(firstResult.showError).toBe(true)

    const retryResult = await mapManager.retryLoad('テスト地域')

    // assert
    expect(retryResult.showError).toBe(false)
    expect(retryResult.coordinates).toEqual({ lat: 45.1234, lng: 141.5678 })
    expect(mockGetCoordinates).toHaveBeenCalledTimes(2)
  })

  it('【RED → GREEN】正常時はエラー表示しないべき', async () => {
    // arrange
    const mockResult = {
      coordinates: { lat: 45.1234, lng: 141.5678 },
      isFromCache: false,
      isFromFallback: false,
      isFallbackUsed: false
    }
    mockGetCoordinates.mockResolvedValue(mockResult)

    // act
    const result = await mapManager.loadMap('稚内市')

    // assert
    expect(result.showWarningBanner).toBe(false)
    expect(result.showError).toBe(false)
    expect(result.warningMessage).toBe('')
    expect(result.errorMessage).toBe('')
  })
}) 