export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return ''
  // "YYYY-MM-DDTHH:MM" をローカル表記に変換してからDateを生成
  const localStr = dateStr.replace('T', ' ').replace(/-/g, '/')
  const date = new Date(localStr)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
} 