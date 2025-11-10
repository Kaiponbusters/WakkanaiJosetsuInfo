/**
 * 稚内市の除雪エリア定数
 *
 * 通知設定や通知履歴で使用されるエリアの定義です。
 * このリストは稚内市の公式な除雪エリア区分に基づいています。
 */

/**
 * 稚内市の除雪対象エリア一覧
 */
export const WAKKANAI_AREAS = [
  '中央区',
  '港区',
  '朝日区',
  '富岡区',
  '宗谷区',
  '恵北区',
  '声問区',
  '増幌区',
  '沼川区',
  '豊富区',
  '猿払区',
  '浜頓別区'
] as const

/**
 * 稚内エリアの型定義
 * WAKKANAI_AREAS配列の要素型として使用
 */
export type WakkanaiArea = typeof WAKKANAI_AREAS[number]
