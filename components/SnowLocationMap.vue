<template>
  <div class="w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden mt-2 mb-4">
    <!-- 同じIDが複数箇所で再利用されないように注意 -->
    <div ref="mapContainer" class="w-full h-full"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import 'leaflet/dist/leaflet.css'

// 親から文字列プロパティ "area" を受け取る
const props = defineProps<{
  area: string
}>()

// 座標の初期値を任意で設定
const coordinates = ref({ lat: 45.4161, lng: 141.6739 })
let mapInstance: any = null

/**
 * 地域名から座標を取得する関数
 */
async function getCoordinates(area: string) {
  console.log(`[SnowLocationMap] getCoordinates called for area: '${area}'`);
  try {
    const query = `${area}、稚内市、北海道`
    console.log(`[SnowLocationMap] Nominatim query: '${query}'`);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    const data = await response.json()
    console.log(`[SnowLocationMap] Nominatim response for '${area}':`, JSON.stringify(data, null, 2));

    if (data && data[0]) {
      coordinates.value = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
      console.log(`[SnowLocationMap] Coordinates updated for '${area}':`, coordinates.value);
    } else {
      console.warn(`[SnowLocationMap] No coordinates found for area: '${area}'. Using initial coordinates.`);
      // オプション: 座標が見つからない場合、初期値やエラー状態に戻すことを検討
      // coordinates.value = { lat: 45.4161, lng: 141.6739 }; // 例えば初期値に戻すか、あるいはnullなど
    }
  } catch (error) {
    console.error(`[SnowLocationMap] Geocoding error for area '${area}':`, error);
    console.warn(`[SnowLocationMap] Geocoding failed for area: '${area}'. Using initial coordinates.`);
  }
}

/**
 * マップを生成する処理
 */
async function createMap() {
  // すでにマップが存在していれば破棄
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }

  // 既存mapのremoveを実装していなかったため、DOMコンテナに同一IDが複数存在する可能性があった。
  // このため、mapInstanceが存在している場合はremove()を実行してマップを破棄するように修正しました。
  // →Map container Already initializedに対する修正
  const L = await import('leaflet').then(m => m.default || m)
  mapInstance = L.map(mapContainer.value).setView([coordinates.value.lat, coordinates.value.lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance)

  // マーカーを追加
  L.marker([coordinates.value.lat, coordinates.value.lng])
    .addTo(mapInstance)
    .bindPopup(props.area)
}

/**
 * コンポーネントマウント時に座標を取得してマップを生成
 */
onMounted(async () => {
  await getCoordinates(props.area)
  await createMap()
})

/**
 * 親から "area" が変わったとき、座標を再取得してマップを再描画
 */
watch(() => props.area, async (newArea) => {
  await getCoordinates(newArea)
  if (mapInstance) {
    // 既存のマップがあれば座標だけ更新
    mapInstance.setView([coordinates.value.lat, coordinates.value.lng], 15)
    // マーカーを再生成したい場合は一度 remove() → add() する
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