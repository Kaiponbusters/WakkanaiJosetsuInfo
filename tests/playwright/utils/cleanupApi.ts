export async function cleanupSnowReports() {
  const res = await fetch('http://localhost:3000/api/test/cleanup', {
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error(`DB cleanup failed: ${res.status} ${await res.text()}`)
  }
  return true
} 