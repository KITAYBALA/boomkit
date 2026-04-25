import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth-server'
import { createSupabaseRouteClient } from '@/lib/supabase-route-client'

import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const supabase = await createSupabaseRouteClient()

  await supabase.auth.signOut()
  await clearSession()

  return NextResponse.redirect(`${requestUrl.origin}/?view=login`, {
    status: 301,
  })
}
