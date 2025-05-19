import { serverSupabaseClient } from '#supabase/server'

/**
 * 除雪情報作成APIモジュール
 * @module snowCreateApi
 */

/**
 * 新規除雪情報を作成するイベントハンドラー
 * @async
 * @param {H3Event} event - H3イベントオブジェクト
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} 作成結果
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

    // バリデーション (例)
    if (!body.area || !body.start_time || !body.end_time) {
      throw createError({
        statusCode: 400,
        statusMessage: '入力データが不足しています。地域、開始時間、終了時間は必須です。'
      })
    }

    const { data, error } = await supabase
      .from('snow_reports')
      .insert([{
        area: body.area,
        start_time: body.start_time,
        end_time: body.end_time
      }])
      .select()
      .single() // 成功時は1件のデータを期待

    if (error) {
      console.error('Supabase insert error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'データベースへの登録に失敗しました。',
        data: { details: error.message } // 詳細なエラーをdataに含めることも可能
      })
    }
    // 成功レスポンスを返す (例: 201 Created)
    // setResponseStatus(event, 201) // Nuxt 3. H3の setResponseStatus を使う
    return { success: true, data } // クライアント側がこの形式を期待している場合は維持

  } catch (error: any) {
    // createError で投げられたエラーはそのまま再スローされるか、H3が処理する
    // それ以外の予期せぬエラーをここで捕捉
    console.error('Create API error:', error)
    // 既にH3Errorであればそれを使い、そうでなければ新しいエラーを生成
    if (error.statusCode) { // H3Error (createErrorによって生成されたエラー) かどうかの簡易チェック
        return sendError(event, error) // sendError を使ってエラーレスポンスを返す
    }
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'サーバー内部エラーが発生しました。',
      data: { details: error.message || 'Unknown server error' }
    }))
  }
})