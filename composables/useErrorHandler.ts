import { FetchError } from 'ofetch'

/**
 * エラーハンドリングに関する共通処理を提供するコンポーザブル
 */
export const useErrorHandler = () => {
  /**
   * エラーを処理し、ログ出力とユーザーへの通知を行う
   * @param error - 発生したエラーオブジェクト
   * @param userMessagePrefix - ユーザーに表示するメッセージの接頭辞（例: 「データの取得」）
   */
  const handleError = (error: unknown, userMessagePrefix: string = '処理中に') => {
    let detailedMessage = '不明なエラーが発生しました。'
    let statusCode: number | undefined

    if (error instanceof FetchError) {
      statusCode = error.statusCode
      detailedMessage = error.data?.message || error.statusMessage || error.message
      console.error(`[Fetch Error ${statusCode}] ${userMessagePrefix}に失敗しました:`, error.data || error)
    } else if (error instanceof Error) {
      detailedMessage = error.message
      console.error(`${userMessagePrefix}でエラーが発生しました:`, error)
    } else {
      console.error(`${userMessagePrefix}で不明なエラーが発生しました:`, error)
    }

    // XSS を防ぐため、詳細メッセージをエスケープ
    const sanitize = (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    const alertMessage = `${userMessagePrefix}に失敗しました。(${sanitize(detailedMessage)})`
    
    // ブラウザ環境でのみalertを表示（SSR時などを考慮）
    if (typeof window !== 'undefined') {
      alert(alertMessage)
    }
  }

  return {
    handleError
  }
} 