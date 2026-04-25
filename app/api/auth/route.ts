import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabase-route-client'

import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const supabase = await createSupabaseRouteClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${requestUrl.origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=Could not authenticate user`,
      {
        status: 301,
      }
    )
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/login?message=Check email to complete sign up`,
    {
      status: 301,
    }
  )
}
