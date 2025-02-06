<template>
  <div class="max-w-4xl mx-auto px-4">
    <h1 class="text-black text-[32px] mt-[30px] h-[50px] text-center border-b-4 font-['Noto Sans']">
      除雪情報管理
    </h1>

    <!-- 登録ページへのボタンを追加 -->
    <div class="flex justify-end mt-4 mb-6">
      <button
        @click="router.push('/create')"
        class="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
      >
        新規登録
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">
      Loading...
    </div>

    <div v-else>
      <div v-for="report in snowReports" :key="report.id" class="mb-6 bg-white rounded-lg shadow p-4">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-bold">{{ report.area }}</h3>
            <div class="mt-2 space-y-1 text-gray-600">
              <p>除雪開始: {{ formatDateTime(report.start_time) }}</p>
              <p>除雪終了: {{ formatDateTime(report.end_time) }}</p>
              <p class="text-sm text-gray-500">登録日時: {{ formatDateTime(report.created_at) }}</p>
            </div>
          </div>

          <div class="flex space-x-2">
            <button
              @click="handleEdit(report)"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              編集
            </button>
            <button
              @click="handleDelete(report.id)"
              class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 編集モーダル -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">除雪情報の編集</h2>
        <form @submit.prevent="handleUpdate">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">地域</label>
              <input
                v-model="editingReport.area"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">開始時間</label>
              <input
                v-model="editingReport.start_time"
                type="datetime-local"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">終了時間</label>
              <input
                v-model="editingReport.end_time"
                type="datetime-local"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              @click="showEditModal = false"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              更新
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'false' })
import { ref, onMounted } from 'vue'
import { serverSupabaseClient } from '#supabase/server'
import { useRouter } from 'vue-router' // 追加
import { supabase } from '~/utils/supabaseClient'  // supabaseClientのインポートを追加

interface SnowReport {
  id: number
  area: string
  start_time: string
  end_time: string
  created_at: string
}

const snowReports = ref<SnowReport[]>([])
const loading = ref(true)
const showEditModal = ref(false)
const editingReport = ref<SnowReport | null>(null)
const router = useRouter() // 追加

// 日時フォーマット関数
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  // "YYYY-MM-DDTHH:MM" をローカル表記に変換してからDateを生成
  const localStr = dateStr.replace('T', ' ').replace(/-/g, '/')
  const date = new Date(localStr)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// データ取得
const fetchSnowReports = async () => {
  try {
    const { data, error } = await supabase
      .from('snow_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    snowReports.value = data
  } catch (error) {
    console.error('Error fetching snow reports:', error)
    alert('データの取得に失敗しました')
  } finally {
    loading.value = false
  }
}

// 編集
const handleEdit = (report: SnowReport) => {
  editingReport.value = { ...report }
  showEditModal.value = true
}

// 更新
const handleUpdate = async () => {
  if (!editingReport.value) return

  try {
    // supabaseクライアントを直接使用
    const { data, error } = await supabase
      .from('snow_reports')
      .update({
        area: editingReport.value.area,
        start_time: editingReport.value.start_time,
        end_time: editingReport.value.end_time
      })
      .eq('id', editingReport.value.id)
      .select()

    if (error) throw error

    // ローカルデータの更新
    snowReports.value = snowReports.value.map(report => {
      if (report.id === editingReport.value?.id) {
        return {
          ...report,
          area: editingReport.value.area,
          start_time: editingReport.value.start_time,
          end_time: editingReport.value.end_time
        }
      }
      return report
    })

    showEditModal.value = false
    alert('更新しました')
  } catch (error) {
    console.error('Error updating snow report:', error)
    alert('更新に失敗しました')
  }
}

// 削除
const handleDelete = async (id: number) => {
  if (!confirm('本当に削除しますか？')) return

  try {
    // サーバーサイドのエンドポイントを使用
    const { error } = await $fetch('/api/snow/delete', {
      method: 'POST',
      body: { id }
    })

    if (error) throw error

    // 削除成功時のみローカルのデータを更新
    snowReports.value = snowReports.value.filter(report => report.id !== id)
    alert('削除しました')
  } catch (error) {
    console.error('Error deleting snow report:', error)
    alert('削除に失敗しました')
  }
}

onMounted(() => {
  fetchSnowReports()
})
</script>