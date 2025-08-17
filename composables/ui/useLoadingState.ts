import { ref, computed } from 'vue'

export interface LoadingStateOptions {
  initialLoading?: boolean
  errorMessage?: string
}

/**
 * ローディング状態とエラー状態を管理するコンポーザブル
 */
export function useLoadingState(options: LoadingStateOptions = {}) {
  const isLoading = ref(options.initialLoading ?? false)
  const error = ref<Error | null>(null)
  const errorMessage = ref(options.errorMessage ?? '')

  // エラーが存在するかどうか
  const hasError = computed(() => !!error.value || !!errorMessage.value)

  /**
   * ローディング状態を開始
   */
  const startLoading = (): void => {
    isLoading.value = true
    error.value = null
    errorMessage.value = ''
  }

  /**
   * ローディング状態を終了
   */
  const stopLoading = (): void => {
    isLoading.value = false
  }

  /**
   * エラーを設定
   */
  const setError = (err: unknown, defaultMessage: string = 'エラーが発生しました'): void => {
    isLoading.value = false
    
    if (err instanceof Error) {
      error.value = err
      errorMessage.value = err.message
    } else if (typeof err === 'string') {
      error.value = new Error(err)
      errorMessage.value = err
    } else {
      error.value = new Error(defaultMessage)
      errorMessage.value = defaultMessage
    }
  }

  /**
   * エラー状態をクリア
   */
  const clearError = (): void => {
    error.value = null
    errorMessage.value = ''
  }

  /**
   * 非同期処理をラップしてローディング状態を管理
   */
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    errorHandler?: (error: unknown) => void
  ): Promise<T | null> => {
    startLoading()
    
    try {
      const result = await asyncFn()
      stopLoading()
      return result
    } catch (err) {
      if (errorHandler) {
        errorHandler(err)
      } else {
        setError(err)
      }
      return null
    }
  }

  return {
    isLoading,
    hasError,
    error,
    errorMessage,
    startLoading,
    stopLoading,
    setError,
    clearError,
    withLoading
  }
} 