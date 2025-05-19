import { serverSupabaseClient } from '#supabase/server'

/**
 * 除雪情報更新APIモジュール
 * @module snowUpdateApi
 */

/**
 * 除雪情報の型定義
 * @interface SnowReport
 */
interface SnowReport {
  /** 除雪情報の一意のID */
  id: number
  /** 除雪作業が行われた地域名 */
  area: string
  /** 除雪作業の開始時間 */
  start_time: string
  /** 除雪作業の終了時間 */
  end_time: string
}

/**
 * API応答の型定義
 * @interface ApiResponse
 */
interface ApiResponse {
  success: boolean
  data?: SnowReport[] | null
  error?: string
}

/**
 * 除雪情報を更新するイベントハンドラー
 * @async
 * @param {H3Event} event - H3イベントオブジェクト
 * @returns {Promise<ApiResponse>} 更新結果
 */
export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SnowReport>(event)
    
    if (!body.id) {
      throw new Error('ID is required')
    }

    const { data, error } = await supabase
      .from('snow_reports')
      .update({
        area: body.area,
        start_time: body.start_time,
        end_time: body.end_time
      })
      .eq('id', body.id)
      .select('*') // 更新後のデータを取得

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: error.message }
  }
})