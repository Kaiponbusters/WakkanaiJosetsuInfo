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
  '北': { lat: 45.4193, lng: 141.6739 }
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
   * フォールバック座標を取得
   * @param area 地域名
   * @returns フォールバック座標またはnull
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
   * 座標情報をキャッシュから取得、なければAPIから取得してキャッシュする
   * @param area 地域名
   * @param useStrictFallback フォールバックを使用するかどうか（デフォルト: true）
   * @returns 座標情報
   */
  const getCoordinates = async (area: string, useStrictFallback: boolean = true): Promise<Coordinates> => {
    // キャッシュにあればそれを返す
    const cached = cache.value[area]
    if (cached) {
      // TTL チェック
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        stats.value.hits++
        console.debug(`[GeoCache] Cache hit for ${area}`)
        return cached
      }
      // 期限切れ
      console.debug(`[GeoCache] Cache expired for ${area}`)
      delete cache.value[area]
    }

    stats.value.misses++
    console.debug(`[GeoCache] Cache miss for ${area}, fetching...`)
    
    // キャッシュにない場合はAPIから取得（レート制限付き）
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(area)}`
      // レート制限とリトライ機能を持つfetch関数を使用
      const data = await fetchWithRateLimit(url, area)
      
      if (data && data[0]) {
        const coords: CachedCoordinates = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          timestamp: Date.now()
        }
        
        // キャッシュに保存
        cache.value[area] = coords
        
        // ローカルストレージにも保存
        if (process.client) {
          try {
            localStorage.setItem('geocoding-cache', JSON.stringify(cache.value))
          } catch (error) {
            console.warn('[GeoCache] Error saving to localStorage:', error)
          }
        }
        
        return coords
      } else {
        throw new Error(`No coordinates found for ${area}`)
      }
    } catch (error) {
      stats.value.apiErrors++
      console.error(`[GeoCache] Error fetching coordinates for ${area}:`, error)
      
      // フォールバック機能を使用
      if (useStrictFallback) {
        const fallbackCoords = getFallbackCoordinates(area)
        if (fallbackCoords) {
          stats.value.fallbacks++
          console.warn(`[GeoCache] Using fallback coordinates for ${area}:`, fallbackCoords)
          
          // フォールバック座標をキャッシュに保存（短いTTL）
          const fallbackCached: CachedCoordinates = {
            ...fallbackCoords,
            timestamp: Date.now() - (CACHE_TTL_MS * 0.9) // 90%期限切れとして扱う
          }
          cache.value[area] = fallbackCached
          
          if (process.client) {
            try {
              localStorage.setItem('geocoding-cache', JSON.stringify(cache.value))
            } catch (storageError) {
              console.warn('[GeoCache] Error saving fallback to localStorage:', storageError)
            }
          }
          
          return fallbackCoords
        }
        
        // フォールバックも見つからない場合は稚内市のデフォルト座標を使用
        console.warn(`[GeoCache] No fallback found for ${area}, using default Wakkanai coordinates`)
        stats.value.fallbacks++
        return WAKKANAI_DEFAULT_COORDINATES
      }
      
      // useStrictFallback が false の場合はエラーを再スロー
      throw error
    }
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
    getFallbackCoordinates
  }
}