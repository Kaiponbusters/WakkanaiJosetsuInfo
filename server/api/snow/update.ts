import { serverSupabaseClient } from '#supabase/server'
import { defineEventHandler, readBody, createError, sendError } from 'h3'
import type { SnowReport } from '~/types/snow'

/**
 * 除雪情報更新APIモジュール
 * @module snowUpdateApi
 */

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
    const body = await readBody(event)

    if (!body.id || !body.area || !body.start_time || !body.end_time) {
      throw createError({
        statusCode: 400,
        statusMessage: '入力データが不足しています。ID、地域、開始時間、終了時間は必須です。'
      })
    }

    const { data, error } = await supabase
      .from('snow_reports')
      .update({
        area: body.area,
        start_time: body.start_time,
        end_time: body.end_time
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'データベースの更新に失敗しました。',
        data: { details: error.message }
      })
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        statusMessage: '更新対象のデータが見つかりませんでした。'
      })
    }

    return { success: true, data }

  } catch (error: any) {
    console.error('Update API error:', error)
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