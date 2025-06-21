export default defineEventHandler(async (event) => {
  // 様々なヘッダーからクライアントIPを取得
  const ip = 
    getClientIP(event) ||
    getHeader(event, 'x-forwarded-for') ||
    getHeader(event, 'x-real-ip') ||
    getHeader(event, 'cf-connecting-ip') ||
    event.node.req.socket?.remoteAddress ||
    '127.0.0.1'

  return {
    ip: Array.isArray(ip) ? ip[0] : ip
  }
}) 