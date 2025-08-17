/**
 * 日付と時間関連のフォーマット関数
 */

/**
 * 日付文字列をDate型に変換する
 * @param dateStr - ISO形式の日付文字列（例: '2023-01-01T12:30:00'）または通常の日付文字列
 * @returns Date型のオブジェクト
 */
export const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(0); // 空文字列の場合は1970-01-01を返す
  
  // "YYYY-MM-DDTHH:MM" をローカル表記に変換してからDateを生成
  const localStr = dateStr.replace('T', ' ').replace(/-/g, '/');
  return new Date(localStr);
};

/**
 * 日付と時間を指定された形式でフォーマットする
 * @param dateStr - ISO形式の日付文字列または通常の日付文字列
 * @param includeTime - 時間を含めるかどうか（デフォルト: true）
 * @returns フォーマットされた日付文字列
 */
export const formatDateTime = (dateStr: string, includeTime = true): string => {
  if (!dateStr) return '';
  
  const date = parseDate(dateStr);
  
  if (includeTime) {
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * 日付のみをフォーマットする（時間は含まない）
 * @param dateStr - ISO形式の日付文字列または通常の日付文字列
 * @returns フォーマットされた日付文字列（時間なし）
 */
export const formatDate = (dateStr: string): string => {
  return formatDateTime(dateStr, false);
};

/**
 * 2つの日付を比較する
 * @param dateStrA - 比較する1つ目の日付文字列
 * @param dateStrB - 比較する2つ目の日付文字列
 * @returns 負の値: aがbより前、0: 同じ日時、正の値: aがbより後
 */
export const compareDates = (dateStrA: string, dateStrB: string): number => {
  const dateA = parseDate(dateStrA).getTime();
  const dateB = parseDate(dateStrB).getTime();
  return dateA - dateB;
}; 

/**
 * APIに送信するための日時フォーマットに変換
 * @param datetime - HTML datetime-local形式の文字列 (例: "2024-01-01T12:00")
 * @returns API形式の日時文字列 (例: "2024/01/01 12:00")
 */
export function formatDateTimeForAPI(datetime: string): string {
  if (!datetime) return ''
  
  // "T"を半角スペースに、"-"を"/"に置換
  return datetime.replace('T', ' ').replace(/-/g, '/')
}

/**
 * APIから受け取った日時をHTML datetime-local形式に変換
 * @param apiDateTime - API形式の日時文字列 (例: "2024/01/01 12:00")
 * @returns HTML datetime-local形式の文字列 (例: "2024-01-01T12:00")
 */
export function formatDateTimeForInput(apiDateTime: string): string {
  if (!apiDateTime) return ''
  
  // "/"を"-"に置換し、スペースを"T"に置換
  return apiDateTime.replace(/\//g, '-').replace(' ', 'T')
}

/**
 * 日時を表示用フォーマットに変換
 * @param datetime - 日時文字列またはDateオブジェクト
 * @param format - 出力フォーマット ('short' | 'long' | 'date-only' | 'time-only')
 * @returns フォーマットされた日時文字列
 */
export function formatDateTimeForDisplay(
  datetime: string | Date,
  format: 'short' | 'long' | 'date-only' | 'time-only' = 'short'
): string {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime
  
  if (isNaN(date.getTime())) {
    return '無効な日時'
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  switch (format) {
    case 'short':
      return `${month}/${day} ${hours}:${minutes}`
    case 'long':
      return `${year}年${month}月${day}日 ${hours}時${minutes}分`
    case 'date-only':
      return `${year}/${month}/${day}`
    case 'time-only':
      return `${hours}:${minutes}`
    default:
      return `${year}/${month}/${day} ${hours}:${minutes}`
  }
} 