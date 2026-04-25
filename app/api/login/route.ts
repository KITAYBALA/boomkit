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

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error during login:', error)
      return NextResponse.json({ success: false, message: error.message }, { status: 401 })
    }

    return NextResponse.json({ success: true, message: 'Login successful' })
  } catch (error) {
    console.error('Unexpected error during login:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
