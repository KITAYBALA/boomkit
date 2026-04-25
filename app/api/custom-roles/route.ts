import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server-client'
import { verifySession } from '@/lib/auth-server'

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient()
      .from('custom_roles')
      .select('id, name, color, assigned_by, assigned_date')

    if (error) {
      console.error('Error fetching custom roles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Unexpected error fetching custom roles:', error)
    return NextResponse.json({ error: 'Failed to fetch custom roles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseServerClient()
    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id, username, role, is_owner')
      .eq('id', session.userId)
      .single()

    if (actorError || !actor || (!actor.is_owner && !['owner', 'admin'].includes(actor.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, color } = await request.json()
    if (typeof name !== 'string' || !name.trim() || typeof color !== 'string' || !color.trim()) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('custom_roles')
      .insert([{
        name: name.trim().slice(0, 64),
        color: color.trim().slice(0, 64),
        assigned_by: actor.username,
        assigned_date: new Date().toISOString(),
      }])
      .select('id, name, color, assigned_by, assigned_date')

    if (error) {
      console.error('Error posting custom role:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error posting custom role:', error)
    return NextResponse.json({ error: 'Failed to post custom role' }, { status: 500 })
  }
}
