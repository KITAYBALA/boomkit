import { isIP } from 'node:net'

export function escapeLikeLiteral(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

export function getClientIp(request: Request): string {
  // Only trust a proxy that overwrites forwarded headers.
  const header = process.env.VERCEL ? 'x-vercel-forwarded-for' :
    process.env.TRUST_PROXY === 'true' ? 'x-forwarded-for' : null
  const value = header ? request.headers.get(header)?.split(',')[0]?.trim() : null
  return value && isIP(value) ? value : 'unknown'
}

export function validUsername(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_]{3,20}$/.test(value)
}
