<template>
  <div class="max-w-4xl mx-auto px-4">
    <h1 class="text-black text-[32px] mt-[30px] h-[50px] text-center border-b-4 font-['Noto Sans']">
      除雪情報登録
    </h1>

    <form @submit.prevent="handleSubmit" class="mt-8">
      <div class="w-full h-auto mb-10 bg-[#D9D9D9] flex flex-col items-center p-4 rounded-md">
        <label for="area" class="text-black text-[24px] font-['Noto Sans'] mb-2">・地域を入力</label>
        <input
          id="area"
          v-model="formData.area"
          type="text"
          placeholder="例: 稚内市..."
          class="w-full max-w-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
          required
        />
      </div>

      <div class="mb-6">
        <label class="text-black text-[24px] font-['Noto Sans'] mb-2">除雪時間</label>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="start_time">開始時間</label>
            <input
              id="start_time"
              v-model="formData.start_time"
              type="datetime-local"
              class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
              required
            />
          </div>
          <div>
            <label for="end_time">終了時間</label>
            <input
              id="end_time"
              v-model="formData.end_time"
              type="datetime-local"
              class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
              required
            />
          </div>
        </div>
      </div>

      <div class="flex justify-center space-x-4">
        <button
          type="submit"
          class="bg-gray-500 font-['Noto Sans'] text-black py-3 px-10 rounded hover:bg-gray-600 transition"
        >
          登録
        </button>
        <button
          type="button"
          @click="router.push('/snowlist')"
          class="bg-[#c0c0c0] text-white py-3 px-10 rounded hover:bg-gray-400 transition"
        >
          管理画面へ戻る
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'

interface SnowReport {
  id: number
  area: string
  start_time: string
  end_time: string
  created_at: string
}

const router = useRouter()
const formData = ref({
  area: '',
  start_time: '',
  end_time: ''
})

const editingReport = ref<SnowReport | null>(null)
const showEditModal = ref(false)
const snowReports = ref<SnowReport[]>([])

const supabase = useSupabaseClient()

const handleSubmit = async () => {
  try {
    formData.value.start_time = formData.value.start_time.replace('T', ' ').replace(/-/g, '/')
    formData.value.end_time = formData.value.end_time.replace('T', ' ').replace(/-/g, '/')

    const response = await $fetch('/api/snow/create', {
      method: 'POST',
      body: formData.value
    })

    if (response.success) {
      alert('除雪情報を登録しました')
      // 登録成功後に管理画面へ遷移
      router.push('/snowlist')
    }
  } catch (error) {
    console.error('Error:', error)
    alert('登録に失敗しました')
  }
}

const handleUpdate = async () => {
  if (!editingReport.value) return

  try {
    const { error } = await supabase
      .from('snow_reports')
      .update({
        area: editingReport.value.area,
        start_time: editingReport.value.start_time,
        end_time: editingReport.value.end_time
      })
      .eq('id', editingReport.value.id)

    if (error) throw error

    // 更新が成功したら、ローカルのデータも更新
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
</script>