/**
 * 除雪情報のインターフェース
 * @interface SnowReport
 * @description 除雪作業の詳細情報を表すインターフェース
 */
export interface SnowReport {
  /** 除雪情報の一意のID */
  id: number
  /** 除雪作業が行われた地域名 */
  area: string
  /** 除雪作業の開始時間 */
  start_time: string
  /** 除雪作業の終了時間 */
  end_time: string
  /** レコードの作成日時（オプショナル） */
  created_at?: string
}
