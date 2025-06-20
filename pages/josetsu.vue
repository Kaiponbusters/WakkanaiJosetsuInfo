<template>
  <div>
      <div v-if="loading">Loading...</div>
      <div v-else>
        <!-- 日付ごとにグループ化された除雪情報を表示 -->
        <div v-for="(group, index) in groupedReports" :key="index" class="mb-4">
          <div
            @click="toggleGroup(index)"
            class="text-3xl bg-[#578cff] text-white p-4 rounded-t cursor-pointer flex justify-center items-center"
          >
            <span class="font-bold">{{ formatDate(group.date) }}</span>
            <span class="">{{ openGroups.has(index) ? '     ▼' : '     ▶' }}</span>
          </div>

          <div v-if="openGroups.has(index)">
            <div
              v-for="report in group.reports"
              :key="report.id"
              class="border-x border-b p-4 bg-white"
            >
              <AreaNameDisplay :area="report.area" />
              <SnowLocationMap :area="report.area" />
              <div class="mt-2 space-y-1 text-gray-600">
                <p>除雪開始: {{ formatDateTime(report.start_time) }}</p>
                <p>除雪終了: {{ formatDateTime(report.end_time) }}</p>
                <p class="text-sm text-gray-500">登録日時: {{ formatDateTime(report.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

/**
 * @fileoverview 路面除雪情報ページのコンポーネント
 * @description 稚内市の路面除雪状況をリアルタイムで表示するページコンポーネント
 * @module josetsu
 * @vue-component
 */
<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useSupabaseClient } from '#imports'
import SnowLocationMap from '~/components/feature/snow/SnowLocationMap.vue'
import AreaNameDisplay from '~/components/ui/AreaNameDisplay.vue'
import { formatDate, formatDateTime, compareDates } from '~/utils/formatters'
import { useErrorHandler } from '~/composables/useErrorHandler'

/**
 * @interface SnowReport
 * @description 除雪情報のデータ構造を定義するインターフェース
 */
interface SnowReport {
  id: number
  area: string
  start_time: string
  end_time: string
  created_at: string
}

/**
 * @interface GroupedReports
 * @description 日付でグループ化された除雪情報の構造を定義するインターフェース
 */
interface GroupedReports {
  date: string
  reports: SnowReport[]
}

/** @type {Ref<SnowReport[]>} 除雪情報を格納する配列 */
const snowReports = ref<SnowReport[]>([])
/** @type {Ref<boolean>} ローディング状態を管理する変数 */
const loading = ref(true)
/** @type {Ref<Set<number>>} 開いているグループのインデックスを管理するセット */
const openGroups = ref(new Set<number>())

const { handleError } = useErrorHandler()

/**
 * グループの開閉状態を切り替える関数
 * @param {number} index - 切り替えるグループのインデックス
 */
const toggleGroup = (index: number) => {
  if (openGroups.value.has(index)) {
    openGroups.value.delete(index)
  } else {
    openGroups.value.add(index)
  }
}

/**
 * 除雪情報を日付でグループ化するcomputed
 * @returns {GroupedReports[]} グループ化された除雪情報の配列
 */
const groupedReports = computed(() => {
  const groups: GroupedReports[] = []
  const groupMap = new Map<string, SnowReport[]>()

  snowReports.value.forEach(report => {
    const date = report.start_time.split('T')[0]
    if (!groupMap.has(date)) {
      groupMap.set(date, [])
    }
    groupMap.get(date)?.push(report)
  })

  // 日付でソートして配列に変換
  Array.from(groupMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // 日付の降順でソート
    .forEach(([date, reports]) => {
      groups.push({
        date,
        reports: reports.sort((a, b) =>
          -compareDates(a.start_time, b.start_time) // 降順にするため負の値を返す
        )
      })
    })

  return groups
})

/**
 * Supabaseから除雪情報を取得する非同期関数
 * @async
 * @throws {Error} データ取得に失敗した場合
 */
const fetchSnowReports = async () => {
  const supabase = useSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('snow_reports')
      .select('*')
      .order('start_time', { ascending: false })

    if (error) throw error
    snowReports.value = data
  } catch (error) {
    handleError(error, '除雪情報の取得')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSnowReports()
})

</script>
<style scoped>
.map-container {
  margin: 1rem 0;
}
/* Leafletの地図が重なる問題対策としてz-indexを指定 */
.leaflet-container {
  z-index: 1;
}
</style>