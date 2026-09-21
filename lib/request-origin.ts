export function isAllowedRequestOrigin(request: { url: string; headers: Headers }, configuredOrigin?: string): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    const url = new URL(request.url)
    // Next.js can normalize loopback URLs internally; Host retains the browser's authority.
    const authority = request.headers.get('host') || url.host
    const expected = new URL(configuredOrigin || `${url.protocol}//${authority}`).origin
    return origin === expected
  } catch {
    return false
  }
}
