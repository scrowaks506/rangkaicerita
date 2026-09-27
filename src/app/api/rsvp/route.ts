import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Public RSVP endpoint (anon, tamu belum punya akun).
 * Tamu update kehadiran via qr_token — tidak butuh login.
 *
 * Header khusus untuk RLS anon:
 *   x-couple-id  → set request.couple.value
 */
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const { rsvp, name } = await req.json()

  if (!token || !['attending', 'declined'].includes(rsvp)) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: guest, error } = await supabase
    .from('guests')
    .select('id,couple_id,name')
    .eq('qr_token', token)
    .single()

  if (error || !guest) {
    return NextResponse.json({ error: 'undangan tidak ditemukan' }, { status: 404 })
  }

  // service role: update langsung (RLS anon tidak membolehkan tanpa token setting)
  const { error: updErr } = await supabase
    .from('guests')
    .update({ rsvp, guest_count: rsvp === 'attending' ? 1 : 0 })
    .eq('id', guest.id)

  if (updErr) return NextResponse.json({ error: 'gagal menyimpan' }, { status: 500 })

  return NextResponse.json({
    ok: true,
    guest: { name: guest.name, rsvp },
  })
}
