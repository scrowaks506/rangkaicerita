import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint logging error client.
 * Tidak butuh auth — hanya catat untuk monitoring.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // log ke server stdout (Vercel / platform akan menangkap)
    console.error('[client-error]', JSON.stringify(body).slice(0, 800))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
