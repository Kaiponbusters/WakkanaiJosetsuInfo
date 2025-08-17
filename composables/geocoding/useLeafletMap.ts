import { ref, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import type { Map as LeafletMap, Marker } from 'leaflet'

export interface MapOptions {
  center: [number, number]
  zoom: number
}

export interface MarkerOptions {
  lat: number
  lng: number
  popupText?: string
}

// グローバルにキャッシュされた Leaflet モジュール参照
let cachedLeaflet: typeof import('leaflet') | null = null

/**
 * Leaflet モジュールを動的読み込みしつつキャッシュする
 */
const loadLeaflet = async () => {
  if (cachedLeaflet) return cachedLeaflet
  const L = await import('leaflet').then(m => m.default || m)
  cachedLeaflet = L
  return L
}

/**
 * Leafletマップの操作を管理するコンポーザブル
 */
export function useLeafletMap() {
  const mapInstance = ref<LeafletMap | null>(null)
  const markers = ref<Marker[]>([])
  const isMapReady = ref(false)

  /**
   * マップを初期化
   */
  const initializeMap = async (
    container: HTMLElement,
    options: MapOptions
  ): Promise<void> => {
    try {
      // 既存のマップがあれば破棄
      if (mapInstance.value) {
        await destroyMap()
      }

      // Leafletを動的インポート
      const L = await loadLeaflet()
      
      // マップインスタンスを作成
      mapInstance.value = L.map(container, {
        center: options.center,
        zoom: options.zoom
      })

      // OpenStreetMapタイルレイヤーを追加
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.value as any)

      isMapReady.value = true
    } catch (error) {
      console.error('[useLeafletMap] Error initializing map:', error)
      throw new Error('マップの初期化に失敗しました')
    }
  }

  /**
   * マップにマーカーを追加
   */
  const addMarker = async (options: MarkerOptions): Promise<Marker | null> => {
    if (!mapInstance.value || !isMapReady.value) {
      console.warn('[useLeafletMap] Map is not initialized')
      return null
    }

    try {
      const L = await loadLeaflet()
      
      const marker = L.marker([options.lat, options.lng])
        .addTo(mapInstance.value as any)
      
      if (options.popupText) {
        marker.bindPopup(options.popupText)
      }
      
      markers.value.push(marker)
      return marker
    } catch (error) {
      console.error('[useLeafletMap] Error adding marker:', error)
      return null
    }
  }

  /**
   * すべてのマーカーをクリア
   */
  const clearMarkers = (): void => {
    if (!mapInstance.value) return

    markers.value.forEach(marker => {
      mapInstance.value?.removeLayer(marker as any)
    })
    markers.value = []
  }

  /**
   * マップの中心座標とズームを更新
   */
  const updateView = (center: [number, number], zoom?: number): void => {
    if (!mapInstance.value || !isMapReady.value) return

    if (zoom !== undefined) {
      mapInstance.value.setView(center, zoom)
    } else {
      mapInstance.value.setView(center)
    }
  }

  /**
   * マップを破棄
   */
  const destroyMap = async (): Promise<void> => {
    if (mapInstance.value) {
      clearMarkers()
      mapInstance.value.remove()
      mapInstance.value = null
      isMapReady.value = false
    }
  }

  // コンポーネントのアンマウント時にマップを破棄
  onBeforeUnmount(() => {
    destroyMap()
  })

  return {
    mapInstance: mapInstance as Readonly<Ref<LeafletMap | null>>,
    isMapReady: isMapReady as Readonly<Ref<boolean>>,
    initializeMap,
    addMarker,
    clearMarkers,
    updateView,
    destroyMap
  }
} 