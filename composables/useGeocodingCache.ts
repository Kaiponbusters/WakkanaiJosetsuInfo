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
    misses: 0
  })

  /**
   * 座標情報をキャッシュから取得、なければAPIから取得してキャッシュする
   * @param area 地域名
   * @returns 座標情報
   */
  const getCoordinates = async (area: string): Promise<Coordinates> => {
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
      console.error(`[GeoCache] Error fetching coordinates for ${area}:`, error)
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
    stats.value = { hits: 0, misses: 0 }
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
        : 0
    }
  }

  return {
    getCoordinates,
    clearCache,
    getStats
  }
}