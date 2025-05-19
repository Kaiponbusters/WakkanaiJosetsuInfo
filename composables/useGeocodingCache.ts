import { ref } from 'vue'
import { useState } from '#imports'

/**
 * 座標情報の型定義
 */
export interface Coordinates {
  lat: number
  lng: number
}

/**
 * 地名から座標へのキャッシュを管理するコンポーザブル
 */
export function useGeocodingCache() {
  // グローバルステートでキャッシュを管理（アプリケーション全体で共有）
  const cache = useState<Record<string, Coordinates>>('geocoding-cache', () => {
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
    if (cache.value[area]) {
      stats.value.hits++
      console.debug(`[GeoCache] Cache hit for ${area}`)
      return cache.value[area]
    }

    stats.value.misses++
    console.debug(`[GeoCache] Cache miss for ${area}, fetching...`)
    
    // キャッシュにない場合はAPIから取得
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(area)}`)
      const data = await response.json()
      
      if (data && data[0]) {
        const coords: Coordinates = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
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