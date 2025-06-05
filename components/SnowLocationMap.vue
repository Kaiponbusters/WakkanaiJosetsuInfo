<template>
  <div class="w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden mt-2 mb-4 relative">
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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap, Marker } from 'leaflet'
import { useGeocodingCache } from '~/composables/useGeocodingCache'

// 親から文字列プロパティ "area" を受け取る
const props = defineProps<{
  area: string
}>()

// 座標情報（取得成功時のみ設定）
const coordinates = ref<{ lat: number; lng: number } | null>(null)
let mapInstance: LeafletMap | null = null

// UI状態管理
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

// 座標キャッシュを使用
const { getCoordinates } = useGeocodingCache()

/**
 * 地域名から座標を取得する関数（キャッシュ対応版）
 */
async function fetchCoordinates(area: string) {
  console.log(`[SnowLocationMap] fetchCoordinates called for area: '${area}'`);
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''
  coordinates.value = null
  
  try {
    // キャッシュからの取得を試みる
    const coords = await getCoordinates(area)
    coordinates.value = coords
    console.log(`[SnowLocationMap] Coordinates updated for '${area}':`, coordinates.value);
  } catch (error) {
    console.error(`[SnowLocationMap] Geocoding error for area '${area}':`, error);
    hasError.value = true
    errorMessage.value = error instanceof Error 
      ? `「${area}」の正確な位置情報が取得できませんでした。${error.message}`
      : `「${area}」の位置情報の取得中にエラーが発生しました。`;
    coordinates.value = null
    console.warn(`[SnowLocationMap] Geocoding failed for area: '${area}'. Map will not be displayed.`);
  } finally {
    isLoading.value = false
  }
}

/**
 * マップを生成する処理
 */
async function createMap() {
  if (!mapContainer.value) { 
    console.error("[SnowLocationMap] mapContainer is not available.");
    hasError.value = true
    errorMessage.value = "マップ表示用の要素が見つかりません"
    return;
  }
  
  if (!coordinates.value) {
    console.error("[SnowLocationMap] No coordinates available for map creation.");
    hasError.value = true
    errorMessage.value = "位置情報が取得できないため、地図を表示できません"
    return;
  }
  
  isLoading.value = true
  
  try {
    // すでにマップが存在していれば破棄
    if (mapInstance) {
      mapInstance.remove()
      mapInstance = null
    }

    // →Map container Already initializedに対する修正
    const L = await import('leaflet').then(m => m.default || m)
    mapInstance = L.map(mapContainer.value).setView([coordinates.value.lat, coordinates.value.lng], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance)

    // マーカーを追加
    const marker = L.marker([coordinates.value.lat, coordinates.value.lng])
      .addTo(mapInstance)
      .bindPopup(props.area)
    
    // エラー状態をリセット
    hasError.value = false
    
  } catch (error) {
    console.error("[SnowLocationMap] Error creating map:", error);
    hasError.value = true
    errorMessage.value = error instanceof Error
      ? `地図の表示中にエラーが発生しました: ${error.message}`
      : '地図の表示中に予期せぬエラーが発生しました'
  } finally {
    isLoading.value = false
  }
}

/**
 * 再読み込み処理
 */
async function retryLoading() {
  hasError.value = false
  await fetchCoordinates(props.area)
  if (!hasError.value && coordinates.value) {
    await createMap()
  }
}

/**
 * コンポーネントマウント時に座標を取得してマップを生成
 */
onMounted(async () => {
  await fetchCoordinates(props.area)
  if (!hasError.value && coordinates.value) {
    await createMap()
  }
})

/**
 * 既存のマーカーを更新する
 */
async function updateMarker(areaName: string) {
  if (!mapInstance || !coordinates.value) return;
  
  try {
    const L = await import('leaflet').then(m => m.default || m);
    
    // 既存マーカーを削除
    mapInstance.eachLayer(layer => {
      // @ts-ignore - 型定義の問題を回避
      if (layer instanceof L.Marker) {
        mapInstance?.removeLayer(layer);
      }
    });
    
    // マーカーを再追加
    const marker = L.marker([coordinates.value.lat, coordinates.value.lng])
      .addTo(mapInstance)
      .bindPopup(areaName);
  } catch (error) {
    console.error("[SnowLocationMap] Error updating marker:", error);
  }
}

/**
 * 親から "area" が変わったとき、座標を再取得してマップを再描画
 */
watch(() => props.area, async (newArea) => {
  await fetchCoordinates(newArea)
  if (hasError.value || !coordinates.value) {
    // エラーがある場合や座標が取得できない場合は既存マップを削除
    if (mapInstance) {
      mapInstance.remove()
      mapInstance = null
    }
    return;
  }
  
  if (mapInstance) {
    // 既存のマップがあれば座標だけ更新
    mapInstance.setView([coordinates.value.lat, coordinates.value.lng], 15)
    // マーカーを更新
    await updateMarker(newArea);
  } else {
    // マップがなければ再生成
    await createMap()
  }
})

/**
 * コンポーネント破棄時にマップを破棄
 */
onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})

// マップを挿入する要素への参照
const mapContainer = ref<HTMLElement | null>(null)
</script>

<style scoped>
.leaflet-container {
  z-index: 1;
}
</style>