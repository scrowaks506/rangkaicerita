import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminShell from '@/components/admin/AdminShell'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/beranda')

  const [
    { count: totalCouples },
    { count: activeCouples },
    { count: pending },
    { count: premium },
  ] = await Promise.all([
    supabase.from('couples').select('*', { count: 'exact', head: true }),
    supabase.from('couples').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('couples').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('couples').select('*', { count: 'exact', head: true }).eq('plan', 'premium'),
  ])

  const { data: recent } = await supabase
    .from('couples')
    .select('id,groom_name,bride_name,status,plan,wedding_date,created_at')
    .order('created_at', { ascending: false })
    .limit(6)

  const stats = [
    { ic: '💍', n: totalCouples ?? 0, l: 'Total pasangan terdaftar', d: 'bulan ini', c: 'd-up' },
    { ic: '✅', n: activeCouples ?? 0, l: 'Akun aktif', d: '30 hari', c: 'd-ok' },
    { ic: '⏳', n: pending ?? 0, l: 'Menunggu approval', d: 'antrian', c: 'd-warn' },
    { ic: '💎', n: premium ?? 0, l: 'Pengguna premium', d: 'berbayar', c: 'd-pro' },
  ]

  return (
    <AdminShell active="dashboard" title="Dashboard" sub="Ringkasan platform RangkaiCerita">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.l} className="bg-white border border-line rounded-2xl p-5">
            <div className="text-2xl mb-2">{s.ic}</div>
            <div className="font-serif text-3xl">{s.n}</div>
            <div className="text-xs text-ink-3 mt-1">{s.l}</div>
            <span className={`pill ${s.c} mt-3 inline-block`}>{s.d}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-line rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif text-lg">Pasangan terbaru</h3>
          <Link href="/admin/users" className="text-sm text-brown font-semibold">Lihat semua →</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase text-ink-3 border-b border-line">
              <th className="py-2 pr-4">Pasangan</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Paket</th>
              <th className="py-2 pr-4">Tgl akad</th>
              <th className="py-2">Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {(recent ?? []).map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="py-3 pr-4 font-medium">{c.groom_name} & {c.bride_name}</td>
                <td className="py-3 pr-4">
                  <span className={`pill ${c.status === 'active' ? 'p-ok' : c.status === 'pending' ? 'p-warn' : 'p-bad'}`}>
                    {c.status === 'active' ? 'Aktif' : c.status === 'pending' ? 'Pending' : 'Suspend'}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`pill ${c.plan === 'premium' ? 'p-pro' : 'p-idle'}`}>
                    {c.plan === 'premium' ? 'Premium' : 'Gratis'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-ink-3">{c.wedding_date || '-'}</td>
                <td className="py-3 text-ink-3">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}
            {(!recent || recent.length === 0) && (
              <tr><td colSpan={5} className="py-8 text-center text-ink-3">Belum ada pasangan terdaftar.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
