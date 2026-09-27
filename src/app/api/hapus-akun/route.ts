import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Hapus akun sendiri (dipanggil dari Profil → Zona berbahaya).
 * User TIDAK bisa hapus auth user sendiri via anon key — harus service role.
 * Server memverifikasi session sebelum menghapus.
 */
export async function DELETE() {
  const supabase = await createAdminClient()

  // verifikasi session user (dari cookie)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  // audit + hapus profile (cascade couple & data anak) + auth user
  await supabase.from('audit_logs').insert({
    action: 'user.self_delete', target: user.id,
  })
  await supabase.from('profiles').delete().eq('id', user.id)
  await supabase.auth.admin.deleteUser(user.id)

  return NextResponse.json({ ok: true })
}
