/**
 * APIリクエストのモニタリング用ユーティリティ
 * 開発環境で使用することを想定
 */

/**
 * APIリクエストをデバッグコンソールに整形して表示
 * @param method リクエストメソッド
 * @param url リクエストURL
 * @param status ステータスコード
 * @param duration リクエストにかかった時間（ms）
 */
export function logApiRequest(
  method: string, 
  url: string, 
  status: number | string, 
  duration: number
): void {
  // 本番環境では何もしない
  if (process.env.NODE_ENV === 'production') return

  const timestamp = new Date().toISOString()
  const urlObj = new URL(url)
  const path = urlObj.pathname
  const params = urlObj.search

  // ステータスに基づいて色を決定
  let statusStyle = ''
  if (typeof status === 'number') {
    if (status >= 200 && status < 300) {
      statusStyle = 'color: #4caf50;font-weight:bold' // 成功は緑
    } else if (status >= 400) {
      statusStyle = 'color: #f44336;font-weight:bold' // エラーは赤
    } else {
      statusStyle = 'color: #ff9800;font-weight:bold' // その他は黄色
    }
  } else {
    statusStyle = 'color: #f44336;font-weight:bold' // エラー文字列は赤
  }

  // パフォーマンス表示
  let performanceStyle = 'color: #2196f3' // 基本は青
  if (duration > 1000) {
    performanceStyle = 'color: #f44336' // 1秒以上は赤
  } else if (duration > 500) {
    performanceStyle = 'color: #ff9800' // 500ms以上は黄色
  }

  console.groupCollapsed(
    `%c${method}%c ${path}${params ? '...' : ''} %c${status}%c ${duration.toFixed(0)}ms`,
    'color: #7986cb;font-weight:bold',
    'color: #333',
    statusStyle,
    performanceStyle
  )
  console.log('Full URL:', url)
  console.log('Timestamp:', timestamp)
  console.log('Duration:', `${duration.toFixed(2)}ms`)
  if (params) console.log('Parameters:', params)
  console.groupEnd()
}

/**
 * APIリクエスト結果をモニタリングして自動ログ出力
 * @param url リクエストURL
 * @param options fetchオプション
 * @returns fetch結果
 */
export async function monitoredFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method || 'GET'
  const startTime = performance.now()
  
  try {
    const response = await fetch(url, options)
    const duration = performance.now() - startTime
    logApiRequest(method, url, response.status, duration)
    return response
  } catch (error) {
    const duration = performance.now() - startTime
    logApiRequest(method, url, error instanceof Error ? error.message : 'Unknown error', duration)
    throw error
  }
}

/**
 * APIリクエスト状況のサマリーを表示（複数リクエストの集約表示用）
 * @param requests リクエスト情報の配列 [{url, status, duration}]
 */
export function logApiSummary(
  requests: Array<{url: string, status: number | string, duration: number}>
): void {
  // 本番環境では何もしない
  if (process.env.NODE_ENV === 'production') return

  const totalRequests = requests.length
  const successRequests = requests.filter(r => typeof r.status === 'number' && r.status >= 200 && r.status < 300).length
  const failedRequests = totalRequests - successRequests
  const totalDuration = requests.reduce((sum, r) => sum + r.duration, 0)
  const avgDuration = totalDuration / totalRequests || 0

  console.group(`API Summary: ${totalRequests} requests (${successRequests} success, ${failedRequests} failed)`)
  console.log(`Total duration: ${totalDuration.toFixed(2)}ms, Average: ${avgDuration.toFixed(2)}ms`)
  
  if (failedRequests > 0) {
    console.group('Failed requests:')
    requests
      .filter(r => typeof r.status === 'number' ? r.status >= 400 : true)
      .forEach(r => console.log(`${r.url}: ${r.status}, ${r.duration.toFixed(2)}ms`))
    console.groupEnd()
  }
  
  console.groupEnd()
}
