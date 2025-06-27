export async function getParashaSemanal() {
  const res = await fetch(`/api/shabbat`)
  return res.json()
}
