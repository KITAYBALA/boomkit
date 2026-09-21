import { NextResponse } from 'next/server'

// Simulated payments must never grant items in a shared database.
export async function POST() {
  return NextResponse.json({ success: false, message: 'Sandbox purchases are disabled.' }, { status: 404 })
}
