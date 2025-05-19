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
    const body = await readBody(event)

    if (!body.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'IDは必須です。'
      })
    }

    const { error } = await supabase
      .from('snow_reports')
      .delete()
      .eq('id', body.id)

    if (error) {
      console.error('Supabase delete error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'データベースからの削除に失敗しました。',
        data: { details: error.message }
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error('Delete API error:', error)
    if (error.statusCode) {
      return sendError(event, error)
    }
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'サーバー内部エラーが発生しました。',
      data: { details: error.message || 'Unknown server error' }
    }))
  }
})