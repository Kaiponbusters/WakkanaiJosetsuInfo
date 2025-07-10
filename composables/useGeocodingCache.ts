import { ref } from 'vue'
import { useState } from '#imports'
import { useGeocodingApi } from '~/composables/useGeocodingApi'

/**
 * 座標情報の型定義
 */
export interface Coordinates {
  lat: number
  lng: number
}

/**
 * 座標取得の結果とメタデータ
 */
export interface CoordinateResult {
  coordinates: Coordinates
  isFromCache: boolean
  isFromFallback: boolean
  isFallbackUsed: boolean
  errorMessage?: string
  warningMessage?: string
}

interface CachedCoordinates extends Coordinates {
  timestamp: number // 保存時刻 (ms)
}

// 1 週間 (7 * 24 * 60 * 60 * 1000)
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * 稚内市のデフォルト座標（API障害時のフォールバック用）
 */
const WAKKANAI_DEFAULT_COORDINATES: Coordinates = {
  lat: 45.4093,
  lng: 141.6739
}

/**
 * よく使用される地域の固定座標マップ（フォールバック用）
 */
const FALLBACK_COORDINATES: Record<string, Coordinates> = {
  '稚内市': { lat: 45.4093, lng: 141.6739 },
  '稚内駅': { lat: 45.4086, lng: 141.6739 },
  '稚内港': { lat: 45.4133, lng: 141.6689 },
  '稚内空港': { lat: 45.4040, lng: 141.8000 },
  '宗谷岬': { lat: 45.5200, lng: 141.9419 },
  // 一般的な除雪エリア用デフォルト
  '中央': { lat: 45.4093, lng: 141.6739 },
  '港': { lat: 45.4133, lng: 141.6689 },
  '駅前': { lat: 45.4086, lng: 141.6739 },
  '東': { lat: 45.4093, lng: 141.6839 },
  '西': { lat: 45.4093, lng: 141.6639 },
  '南': { lat: 45.3993, lng: 141.6739 },
  '北': { lat: 45.4193, lng: 141.6739 },
  'テスト地域': { lat: 45.4000, lng: 141.6700 }
}

/**
 * 地名から座標へのキャッシュを管理するコンポーザブル
 */
export function useGeocodingCache() {
  // APIリクエスト管理機能を利用
  const { fetchWithRateLimit } = useGeocodingApi()

  // グローバルステートでキャッシュを管理（アプリケーション全体で共有）
  const cache = useState<Record<string, CachedCoordinates>>('geocoding-cache', () => {
    // 初期化時にローカルストレージから読み込む
    if (process.client) {
      try {
        const stored = localStorage.getItem('geocoding-cache')
        return stored ? JSON.parse(stored) : {}
      } catch (error) {
        console.warn('[GeoCache] Error loading from localStorage:', error)
        return {}
      }
    }
    return {}
  })

  // デバッグ用: キャッシュヒット回数とミス回数を追跡
  const stats = ref({
    hits: 0,
    misses: 0,
    fallbacks: 0,
    apiErrors: 0
  })

  /**
   * Extract Method: キャッシュヒット時の処理
   */
  const handleCacheHit = (area: string, cached: CachedCoordinates): CoordinateResult => {
    stats.value.hits++
    console.debug(`[GeoCache] Cache hit for ${area}`)
    return {
      coordinates: cached,
      isFromCache: true,
      isFromFallback: false,
      isFallbackUsed: false
    }
  }

  /**
   * Extract Method: API成功時の処理
   */
  const handleApiSuccess = async (area: string, data: any[]): Promise<CoordinateResult> => {
    const coords: CachedCoordinates = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      timestamp: Date.now()
    }
    
    // キャッシュに保存
    cache.value[area] = coords
    await saveToLocalStorage()
    
    return {
      coordinates: coords,
      isFromCache: false,
      isFromFallback: false,
      isFallbackUsed: false
    }
  }

  /**
   * Extract Method: フォールバック処理
   */
  const handleFallback = async (area: string, error: unknown): Promise<CoordinateResult> => {
    stats.value.apiErrors++
    console.error(`[GeoCache] Error fetching coordinates for ${area}:`, error)
    
    const fallbackCoords = getFallbackCoordinates(area)
    if (fallbackCoords) {
      return await createFallbackResult(area, fallbackCoords, error)
    }
    
    // デフォルトフォールバック
    console.warn(`[GeoCache] No fallback found for ${area}, using default Wakkanai coordinates`)
    return await createDefaultFallbackResult(area, error)
  }

  /**
   * Extract Method: フォールバック結果の作成
   */
  const createFallbackResult = async (area: string, coordinates: Coordinates, error: unknown): Promise<CoordinateResult> => {
    stats.value.fallbacks++
    console.warn(`[GeoCache] Using fallback coordinates for ${area}:`, coordinates)
    
    await saveFallbackToCache(area, coordinates)
    
    return {
      coordinates,
      isFromCache: false,
      isFromFallback: true,
      isFallbackUsed: true,
      warningMessage: `位置情報サービスが利用できないため、${area}の概算位置を表示しています`,
      errorMessage: error instanceof Error ? error.message : 'API接続エラー'
    }
  }

  /**
   * Extract Method: デフォルトフォールバック結果の作成
   */
  const createDefaultFallbackResult = async (area: string, error: unknown): Promise<CoordinateResult> => {
    stats.value.fallbacks++
    
    return {
      coordinates: WAKKANAI_DEFAULT_COORDINATES,
      isFromCache: false,
      isFromFallback: true,
      isFallbackUsed: true,
      warningMessage: `${area}の位置情報が取得できないため、稚内市の中心部を表示しています`,
      errorMessage: error instanceof Error ? error.message : 'API接続エラー'
    }
  }

  /**
   * Extract Method: フォールバック座標をキャッシュに保存
   */
  const saveFallbackToCache = async (area: string, coordinates: Coordinates): Promise<void> => {
    const fallbackCached: CachedCoordinates = {
      ...coordinates,
      timestamp: Date.now() - (CACHE_TTL_MS * 0.9) // 90%期限切れとして扱う
    }
    cache.value[area] = fallbackCached
    await saveToLocalStorage()
  }

  /**
   * Extract Method: ローカルストレージへの保存
   */
  const saveToLocalStorage = async (): Promise<void> => {
    if (process.client) {
      try {
        localStorage.setItem('geocoding-cache', JSON.stringify(cache.value))
      } catch (error) {
        console.warn('[GeoCache] Error saving to localStorage:', error)
      }
    }
  }

  /**
   * Replace Nested Conditional with Guard Clauses: フォールバック座標を取得
   */
  const getFallbackCoordinates = (area: string): Coordinates | null => {
    // 完全一致
    if (FALLBACK_COORDINATES[area]) {
      console.debug(`[GeoCache] Using exact fallback for ${area}`)
      return FALLBACK_COORDINATES[area]
    }
    
    // 部分一致検索
    const normalizedArea = area.toLowerCase()
    for (const [key, coords] of Object.entries(FALLBACK_COORDINATES)) {
      if (normalizedArea.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedArea)) {
        console.debug(`[GeoCache] Using partial fallback for ${area} -> ${key}`)
        return coords
      }
    }
    
    return null
  }

  /**
   * Decompose Conditional: キャッシュの有効性チェック
   */
  const isCacheValid = (cached: CachedCoordinates): boolean => {
    return Date.now() - cached.timestamp < CACHE_TTL_MS
  }

  /**
   * 座標情報をキャッシュから取得、なければAPIから取得してキャッシュする
   * @param area 地域名
   * @param useStrictFallback フォールバックを使用するかどうか（デフォルト: true）
   * @returns 座標情報と取得状況
   */
  const getCoordinates = async (area: string, useStrictFallback: boolean = true): Promise<CoordinateResult> => {
    // Replace Nested Conditional with Guard Clauses
    const cached = cache.value[area]
    if (cached && isCacheValid(cached)) {
      return handleCacheHit(area, cached)
    }
    
    // キャッシュ期限切れの場合は削除
    if (cached && !isCacheValid(cached)) {
      console.debug(`[GeoCache] Cache expired for ${area}`)
      delete cache.value[area]
    }

    stats.value.misses++
    console.debug(`[GeoCache] Cache miss for ${area}, fetching...`)
    
    // API からの取得を試行
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(area)}`
      const data = await fetchWithRateLimit(url, area)
      
      if (data && data[0]) {
        return await handleApiSuccess(area, data)
      } else {
        throw new Error(`No coordinates found for ${area}`)
      }
    } catch (error) {
      if (useStrictFallback) {
        return await handleFallback(area, error)
      }
      throw error
    }
  }

  /**
   * 従来互換性のためのシンプルなgetCoordinates関数
   * @param area 地域名
   * @returns 座標情報のみ
   */
  const getCoordinatesSimple = async (area: string): Promise<Coordinates> => {
    const result = await getCoordinates(area, true)
    return result.coordinates
  }

  /**
   * キャッシュをクリアする
   */
  const clearCache = () => {
    cache.value = {}
    if (process.client) {
      try {
        localStorage.removeItem('geocoding-cache')
      } catch (error) {
        console.warn('[GeoCache] Error removing from localStorage:', error)
      }
    }
    stats.value = { hits: 0, misses: 0, fallbacks: 0, apiErrors: 0 }
  }

  /**
   * フォールバック座標を手動追加
   * @param area 地域名
   * @param coordinates 座標
   */
  const addFallbackCoordinates = (area: string, coordinates: Coordinates) => {
    FALLBACK_COORDINATES[area] = coordinates
    console.debug(`[GeoCache] Added fallback coordinates for ${area}:`, coordinates)
  }

  /**
   * キャッシュの統計情報を取得
   */
  const getStats = () => {
    return {
      ...stats.value,
      size: Object.keys(cache.value).length,
      hitRate: stats.value.hits + stats.value.misses > 0
        ? (stats.value.hits / (stats.value.hits + stats.value.misses)) * 100
        : 0,
      fallbackRate: stats.value.misses > 0
        ? (stats.value.fallbacks / stats.value.misses) * 100
        : 0,
      errorRate: stats.value.misses > 0
        ? (stats.value.apiErrors / stats.value.misses) * 100
        : 0
    }
  }

  return {
    getCoordinates,
    clearCache,
    addFallbackCoordinates,
    getStats,
    getFallbackCoordinates,
    getCoordinatesSimple
  }
}