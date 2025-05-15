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