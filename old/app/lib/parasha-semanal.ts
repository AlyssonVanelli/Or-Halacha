function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function getParashaSemanal() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/shabbat`)
    if (!res.ok) {
      return null
    }
    return res.json()
  } catch (error) {
    // console.warn('Erro ao buscar parashá semanal:', error)
    return null
  }
}
