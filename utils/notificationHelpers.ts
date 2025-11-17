/**
 * 通知関連の共通ヘルパー関数
 *
 * NotificationHistory, NotificationToast などで使用される
 * 通知の表示に関するユーティリティ関数を提供します。
 */

/**
 * 通知タイプのラベルを取得
 * @param type - 通知タイプ ('start' | 'end')
 * @returns 日本語のラベル
 */
export const getTypeLabel = (type: string): string => {
  return type === 'start' ? '開始' : '完了'
}

/**
 * 重要度のラベルを取得
 * @param severity - 重要度 ('low' | 'medium' | 'high')
 * @returns 日本語のラベル
 */
export const getSeverityLabel = (severity: string): string => {
  const labels = {
    low: '軽微',
    medium: '通常',
    high: '重要'
  }
  return labels[severity as keyof typeof labels] || severity
}

/**
 * 重要度に対応するTailwind CSSクラスを取得
 * @param severity - 重要度 ('low' | 'medium' | 'high')
 * @returns Tailwindのテキストカラークラス
 */
export const getSeverityClass = (severity: string): string => {
  const classes = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600'
  }
  return classes[severity as keyof typeof classes] || 'text-gray-600'
}
