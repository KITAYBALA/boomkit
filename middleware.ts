import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname.startsWith('/images') ||
        request.nextUrl.pathname.includes('.')
    ) {
        return NextResponse.next()
    }

    if (request.nextUrl.pathname === '/banned') {
        return NextResponse.next()
    }

    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined

    if (!ip) return response

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        return response
    }

    try {
        const rpcResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/is_ip_blacklisted`, {
            method: 'POST',
            headers: {
                apikey: supabaseAnonKey,
                authorization: `Bearer ${supabaseAnonKey}`,
                'content-type': 'application/json',
            },
            body: JSON.stringify({ check_ip: ip }),
        })

        if (rpcResponse.ok && (await rpcResponse.json()) === true) {
            const url = request.nextUrl.clone()
            url.pathname = '/banned'
            return NextResponse.redirect(url)
        }
    } catch (error) {
        console.error('Middleware blacklist check error:', error)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
