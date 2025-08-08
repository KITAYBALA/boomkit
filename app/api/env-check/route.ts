import { NextResponse } from 'next/server'

export async function GET() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  // Do not return actual values for security
  return NextResponse.json({
    ok: hasUrl && hasAnon,
    details: {
      NEXT_PUBLIC_SUPABASE_URL: hasUrl ? 'present' : 'missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnon ? 'present' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: hasService ? 'present' : 'missing (optional for server-only actions)',
    },
  })
}
