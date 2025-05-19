import { serverSupabaseClient } from '#supabase/server'

/**
 * 除雪情報削除APIモジュール
 * @module snowDeleteApi
 */

/**
 * API応答の型定義
 * @interface ApiResponse
 */
interface ApiResponse {
  success: boolean
  error?: string
}

/**
 * 除雪情報を削除するイベントハンドラー
 * @async
 * @param {H3Event} event - H3イベントオブジェクト
 * @returns {Promise<ApiResponse>} 削除結果
 */
export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<{ id: number }>(event)
    
    const { error } = await supabase
      .from('snow_reports')
      .delete()
      .eq('id', body.id)

    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: error.message }
  }
})