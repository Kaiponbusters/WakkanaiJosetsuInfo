import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { formatDateTimeForAPI } from '~/utils/formatters'
import { 
  validateRequired, 
  validateTimeRange, 
  validateStringLength,
  type ValidationResult 
} from '~/utils/validators'

export interface SnowReportFormData {
  area: string
  start_time: string
  end_time: string
}

/**
 * フォームフィールドごとのバリデーションエラー
 */
export interface FormValidationErrors {
  area?: string
  start_time?: string
  end_time?: string
  time_range?: string
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
  
  /**
   * 地域名のバリデーション（リアクティブ）
   */
  const areaValidation = computed((): ValidationResult => {
    const requiredResult = validateRequired(formData.value.area)
    if (!requiredResult.isValid) return requiredResult
    
    return validateStringLength(formData.value.area.trim(), { 
      min: 1, 
      max: 100 
    })
  })
  
  /**
   * 開始時間のバリデーション（リアクティブ）
   */
  const startTimeValidation = computed((): ValidationResult => {
    return validateRequired(formData.value.start_time)
  })
  
  /**
   * 終了時間のバリデーション（リアクティブ）
   */
  const endTimeValidation = computed((): ValidationResult => {
    return validateRequired(formData.value.end_time)
  })
  
  /**
   * 時間範囲のバリデーション（リアクティブ）
   */
  const timeRangeValidation = computed((): ValidationResult => {
    // Guard Clause: 個別フィールドが無効な場合はスキップ
    if (!startTimeValidation.value.isValid || !endTimeValidation.value.isValid) {
      return { isValid: true, message: '' }
    }
    
    return validateTimeRange(formData.value.start_time, formData.value.end_time)
  })
  
  /**
   * 全てのバリデーションエラー（リアクティブ）
   */
  const validationErrors = computed((): FormValidationErrors => {
    const errors: FormValidationErrors = {}
    
    if (!areaValidation.value.isValid) {
      errors.area = areaValidation.value.message
    }
    
    if (!startTimeValidation.value.isValid) {
      errors.start_time = startTimeValidation.value.message
    }
    
    if (!endTimeValidation.value.isValid) {
      errors.end_time = endTimeValidation.value.message
    }
    
    if (!timeRangeValidation.value.isValid) {
      errors.time_range = timeRangeValidation.value.message
    }
    
    return errors
  })
  
  /**
   * フォームの有効性（リアクティブ）
   */
  const isFormValid = computed((): boolean => {
    return areaValidation.value.isValid &&
           startTimeValidation.value.isValid &&
           endTimeValidation.value.isValid &&
           timeRangeValidation.value.isValid
  })
  
  /**
   * フォームデータをリセット
   */
  const resetForm = (): void => {
    formData.value = {
      area: '',
      start_time: '',
      end_time: ''
    }
  }
  
  /**
   * 手動バリデーション実行（送信時の最終チェック用）
   */
  const validateForm = (): boolean => {
    return isFormValid.value
  }
  
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
    navigateToList,
    // 個別バリデーション結果（デバッグ・テスト用）
    areaValidation,
    startTimeValidation,
    endTimeValidation,
    timeRangeValidation
  }
} 