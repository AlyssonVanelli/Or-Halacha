function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function getParashaSemanal() {
  const res = await fetch(`${getBaseUrl()}/api/shabbat`)
  return res.json()
}
