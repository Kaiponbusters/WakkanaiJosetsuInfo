import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { formatDateTimeForAPI } from '~/utils/formatters'

export interface SnowReportFormData {
  area: string
  start_time: string
  end_time: string
}

/**
 * 除雪報告フォームの状態とロジックを管理するコンポーザブル
 */
export function useSnowReportForm() {
  const router = useRouter()
  const { handleError } = useErrorHandler()
  
  // フォームデータの初期状態
  const formData = ref<SnowReportFormData>({
    area: '',
    start_time: '',
    end_time: ''
  })
  
  // 送信中の状態
  const isSubmitting = ref(false)
  
  // バリデーションエラー
  const validationErrors = ref<Partial<Record<keyof SnowReportFormData, string>>>({})
  
  /**
   * フォームデータをリセット
   */
  const resetForm = (): void => {
    formData.value = {
      area: '',
      start_time: '',
      end_time: ''
    }
    validationErrors.value = {}
  }
  
  /**
   * フォームのバリデーション
   */
  const validateForm = (): boolean => {
    validationErrors.value = {}
    
    if (!formData.value.area.trim()) {
      validationErrors.value.area = '地域を入力してください'
    }
    
    if (!formData.value.start_time) {
      validationErrors.value.start_time = '開始時間を入力してください'
    }
    
    if (!formData.value.end_time) {
      validationErrors.value.end_time = '終了時間を入力してください'
    }
    
    // 開始時間と終了時間の妥当性チェック
    if (formData.value.start_time && formData.value.end_time) {
      const start = new Date(formData.value.start_time)
      const end = new Date(formData.value.end_time)
      
      if (start >= end) {
        validationErrors.value.end_time = '終了時間は開始時間より後にしてください'
      }
    }
    
    return Object.keys(validationErrors.value).length === 0
  }
  
  /**
   * フォームの有効性
   */
  const isFormValid = computed(() => {
    return !!(
      formData.value.area.trim() &&
      formData.value.start_time &&
      formData.value.end_time &&
      Object.keys(validationErrors.value).length === 0
    )
  })
  
  /**
   * フォームを送信
   */
  const submitForm = async (): Promise<boolean> => {
    if (!validateForm()) {
      return false
    }
    
    isSubmitting.value = true
    
    try {
      // 日時フォーマットを変換
      const submitData = {
        area: formData.value.area.trim(),
        start_time: formatDateTimeForAPI(formData.value.start_time),
        end_time: formatDateTimeForAPI(formData.value.end_time)
      }
      
      const response = await $fetch('/api/snow/create', {
        method: 'POST',
        body: submitData
      })
      
      alert('除雪情報を登録しました')
      resetForm()
      
      // 一覧画面へ遷移
      await router.push('/snowlist')
      return true
      
    } catch (error) {
      handleError(error, '除雪情報の登録')
      return false
    } finally {
      isSubmitting.value = false
    }
  }
  
  /**
   * 管理画面へ戻る
   */
  const navigateToList = async (): Promise<void> => {
    await router.push('/snowlist')
  }
  
  return {
    formData,
    isSubmitting,
    validationErrors,
    isFormValid,
    resetForm,
    validateForm,
    submitForm,
    navigateToList
  }
} 