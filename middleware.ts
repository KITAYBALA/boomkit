import { NextRequest, NextResponse } from 'next/server'
import { isAllowedRequestOrigin } from './lib/request-origin'

const ipCache = new Map<string, { blacklisted: boolean; expires: number }>()

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/api/webhooks/') || pathname === '/banned' || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }
  if (pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    if (!isAllowedRequestOrigin(request, process.env.APP_ORIGIN)) {
      return NextResponse.json({ success: false, message: 'Cross-origin request denied.' }, { status: 403 })
    }
  }
  const header = process.env.VERCEL ? 'x-vercel-forwarded-for' : process.env.TRUST_PROXY === 'true' ? 'x-forwarded-for' : null
  const ip = header ? request.headers.get(header)?.split(',')[0]?.trim() : null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (ip && ip.length <= 64 && url && key) {
    let cached = ipCache.get(ip)
    if (!cached || cached.expires <= Date.now()) {
      try {
        const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/is_ip_blacklisted`, {
          method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
          body: JSON.stringify({ check_ip: ip }), signal: AbortSignal.timeout(3000),
        })
        if (response.ok) {
          cached = { blacklisted: (await response.json()) === true, expires: Date.now() + 60000 }
          if (ipCache.size >= 1000) ipCache.clear()
          ipCache.set(ip, cached)
        }
      } catch { /* Login and registration independently enforce the blacklist. */ }
    }
    if (cached?.blacklisted) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 })
      return NextResponse.redirect(new URL('/banned', request.url))
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
