<template>
  <div class="w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden mt-2 mb-4 relative">
    <!-- 遅延読み込み中のプレースホルダー -->
    <div v-if="!isMapInitialized && !autoLoad" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
      <div class="text-center p-4">
        <div class="text-blue-500 text-4xl mb-2">
          <span>🗺️</span>
        </div>
        <h3 class="text-lg font-bold text-blue-600">地図を表示</h3>
        <p class="text-gray-600 mt-1">クリックして地図を読み込みます</p>
        <button 
          @click="loadMap"
          class="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          地図を読み込む
        </button>
      </div>
    </div>
    
    <!-- ローディングインジケーター -->
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        <p class="mt-2 text-gray-600">地図を読み込み中...</p>
      </div>
    </div>
    
    <!-- エラー表示 -->
    <div v-if="hasError" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
      <div class="text-center p-4">
        <div class="text-red-500 text-4xl mb-2">
          <span>⚠️</span>
        </div>
        <h3 class="text-lg font-bold text-red-600">地図の表示に失敗しました</h3>
        <p class="text-gray-600 mt-1">{{ errorMessage }}</p>
        <button 
          @click="retryLoading"
          class="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          再読み込み
        </button>
      </div>
    </div>
    
    <!-- マップコンテナ -->
    <div ref="mapContainer" class="w-full h-full"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import 'leaflet/dist/leaflet.css'
import { useGeocodingCache } from '~/composables/useGeocodingCache'
import { useLeafletMap } from '~/composables/useLeafletMap'
import { useLoadingState } from '~/composables/useLoadingState'

// Props定義
const props = defineProps<{
  area: string
  autoLoad?: boolean  // 自動読み込みを制御
}>()

// Composablesを使用
const { getCoordinates } = useGeocodingCache()
const { initializeMap, addMarker, updateView, clearMarkers } = useLeafletMap()
const { isLoading, hasError, errorMessage, withLoading, setError } = useLoadingState()

// テンプレート参照
const mapContainer = ref<HTMLElement | null>(null)

// 座標情報
const coordinates = ref<{ lat: number; lng: number } | null>(null)

// 地図初期化状態
const isMapInitialized = ref(false)

/**
 * 地域名から座標を取得してマップを表示
 */
async function loadMapForArea(area: string) {
  await withLoading(
    async () => {
      // 座標を取得
      coordinates.value = await getCoordinates(area)
      
      // マップコンテナが利用可能か確認
      if (!mapContainer.value) {
        throw new Error('マップ表示用の要素が見つかりません')
      }
      
      // マップが初期化されていない場合は初期化
      try {
        await initializeMap(mapContainer.value, {
          center: [coordinates.value.lat, coordinates.value.lng],
          zoom: 15
        })
        isMapInitialized.value = true
      } catch (error) {
        // 既にマップが初期化されている場合は、ビューを更新
        updateView([coordinates.value.lat, coordinates.value.lng], 15)
      }
      
      // マーカーをクリアして新しいマーカーを追加
      clearMarkers()
      await addMarker({
        lat: coordinates.value.lat,
        lng: coordinates.value.lng,
        popupText: area
      })
    },
    (error) => {
      console.error(`[SnowLocationMap] Error loading map for area '${area}':`, error)
      setError(
        error,
        `「${area}」の位置情報の取得中にエラーが発生しました`
      )
    }
  )
}

/**
 * 手動で地図を読み込む
 */
async function loadMap() {
  await loadMapForArea(props.area)
}

/**
 * 再読み込み処理
 */
async function retryLoading() {
  await loadMapForArea(props.area)
}

// 初期読み込み（autoLoadがtrueの場合のみ）
onMounted(async () => {
  if (props.autoLoad !== false) {  // autoLoadが明示的にfalseでなければ自動読み込み
    await loadMapForArea(props.area)
  }
})

// エリア変更の監視（初期化済みの場合のみ）
watch(() => props.area, async (newArea) => {
  if (isMapInitialized.value) {
    await loadMapForArea(newArea)
  }
})
</script>

<style scoped>
.leaflet-container {
  z-index: 1;
}
</style>