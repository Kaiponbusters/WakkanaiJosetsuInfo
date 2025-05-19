import { serverSupabaseClient } from '#supabase/server'

/**
 * 除雪情報作成APIモジュール
 * @module snowCreateApi
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
  /** 作成日時 */
  created_at?: string
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
 * 新規除雪情報を作成するイベントハンドラー
 * @async
 * @param {H3Event} event - H3イベントオブジェクト
 * @returns {Promise<ApiResponse>} 作成結果
 */
export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    
    // 認証チェックを一時的にコメントアウト
    /*
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return createError({
        statusCode: 401,
        message: '認証が必要です'
      })
    }
    */

    const body = await readBody(event)
    const { data, error } = await supabase
      .from('snow_reports')
      .insert([{
        area: body.area,
        start_time: body.start_time,
        end_time: body.end_time
      }])
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: error.message }
  }
})