import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // 1. Skip static files and images to improve performance
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname.startsWith('/images') ||
        request.nextUrl.pathname.includes('.') // file extensions
    ) {
        return NextResponse.next()
    }

    // 2. Already on the banned page? Allow access to avoid redirect loop
    if (request.nextUrl.pathname === '/banned') {
        return NextResponse.next()
    }

    // 3. Initialize Response
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 4. Get User IP
    // X-Forwarded-For is usually the best bet in Vercel/proxied environments
    let ip = request.headers.get('x-forwarded-for')?.split(',')[0]
    if (!ip) {
        ip = request.headers.get('x-real-ip') || undefined
    }

    // 5. Create Supabase Client (if IP is present)
    // We strictly need this for auth management and IP checking
    if (ip) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        // 6. Check Blacklist via RPC
        try {
            const { data: isBanned, error } = await supabase.rpc('is_ip_blacklisted', { check_ip: ip })

            if (isBanned === true) {
                const url = request.nextUrl.clone()
                url.pathname = '/banned'
                // Return redirect immediately 
                return NextResponse.redirect(url)
            }
        } catch (e) {
            console.error("Middleware blacklist check error:", e)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
