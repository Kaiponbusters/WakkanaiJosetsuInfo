import jwt from 'jsonwebtoken'
import { createHash } from 'crypto'

interface VehicleLocationData {
  device_id: string
  vehicle_type: string
  lat: number
  lng: number
  timestamp?: string
}

// レート制限のための簡易メモリストア（本番環境ではRedisを使用）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export default defineEventHandler(async (event) => {
  try {
    // POST メソッドのみ許可
    assertMethod(event, 'POST')

    // Content-Type チェック
    const contentType = getHeader(event, 'content-type')
    if (!contentType?.includes('application/json')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Content-Type must be application/json'
      })
    }

    // Authorization ヘッダーからJWTを取得
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Missing or invalid Authorization header'
      })
    }

    const token = authHeader.substring(7)

    // JWTの検証
    const runtimeConfig = useRuntimeConfig()
    let payload: any
    try {
      payload = jwt.verify(token, runtimeConfig.jwtSecret || 'your-secret-key')
    } catch (jwtError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid JWT token'
      })
    }

    // 車載端末ロールチェック
    if (payload.role !== 'vehicle') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions'
      })
    }

    // クライアントIPを取得
    const clientIP = getClientIP(event) || '127.0.0.1'

    // レート制限チェック（1分間に60リクエストまで）
    const rateLimitKey = `${payload.sub}:${clientIP}`
    const now = Date.now()
    const rateLimitData = rateLimitStore.get(rateLimitKey)

    if (rateLimitData) {
      if (now < rateLimitData.resetTime) {
        if (rateLimitData.count >= 60) {
          throw createError({
            statusCode: 429,
            statusMessage: 'Rate limit exceeded'
          })
        }
        rateLimitData.count++
      } else {
        // リセット時間が過ぎた場合
        rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + 60000 })
      }
    } else {
      rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + 60000 })
    }

    // リクエストボディの解析
    const body: VehicleLocationData = await readBody(event)

    // バリデーション
    if (!body.device_id || !body.vehicle_type || !body.lat || !body.lng) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: device_id, vehicle_type, lat, lng'
      })
    }

    // 座標の妥当性チェック
    if (body.lat < -90 || body.lat > 90 || body.lng < -180 || body.lng > 180) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid coordinates'
      })
    }

    // デバイスIDのハッシュ化
    const deviceHash = createHash('sha256').update(body.device_id).digest('hex')

    // Supabaseクライアント（サービスロール使用）
    const supabase = createClient(
      runtimeConfig.public.supabaseUrl,
      runtimeConfig.supabaseServiceKey
    )

    // デバイス認証（事前登録されたデバイスかチェック）
    const { data: device, error: deviceError } = await supabase
      .from('vehicle_devices')
      .select('*')
      .eq('device_hash', deviceHash)
      .eq('is_active', true)
      .single()

    if (deviceError || !device) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unregistered device'
      })
    }

    // GeoJSON Point形式に変換
    const geom = {
      type: 'Point',
      coordinates: [body.lng, body.lat]
    }

    // 位置情報をデータベースに保存
    const { error: insertError } = await supabase
      .from('vehicle_locations')
      .insert({
        vehicle_id: payload.sub, // JWTのsubjectを車両IDとして使用
        device_id: body.device_id,
        vehicle_type: body.vehicle_type,
        geom: geom,
        timestamp: body.timestamp || new Date().toISOString()
      })

    if (insertError) {
      console.error('位置情報保存エラー:', insertError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save location data'
      })
    }

    // デバイスの最終確認時刻を更新
    await supabase
      .from('vehicle_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', device.id)

    // 成功レスポンス
    return {
      success: true,
      message: 'Location data saved successfully',
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    // エラーログ記録
    console.error('車載端末API エラー:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
}) 