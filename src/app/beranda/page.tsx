import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { Wallet, Users, Store } from 'lucide-react'

export const dynamic = 'force-dynamic'

function rupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default async function BerandaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: couple } = await supabase
    .from('couples')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!couple) redirect('/register')

  const cid = couple.id
  const [{ data: tasks }, { data: guests }, { data: expenses }] = await Promise.all([
    supabase.from('tasks').select('id,done').eq('couple_id', cid),
    supabase.from('guests').select('id').eq('couple_id', cid),
    supabase.from('expenses').select('amount').eq('couple_id', cid),
  ])

  const done = tasks?.filter((t) => t.done).length ?? 0
  const total = tasks?.length ?? 0
  const pct = total ? Math.round((done / total) * 100) : 0
  const terpakai = expenses?.reduce((a, e) => a + e.amount, 0) ?? 0
  const nama = `${couple.groom_name} & ${couple.bride_name}`

  return (
    <div className="app-shell px-5 pt-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-ink-3">Halo, calon pengantin 👋</p>
          <h1 className="font-serif text-xl">{nama}</h1>
        </div>
        <Link href="/profil" className="w-10 h-10 rounded-full bg-cream-2 flex items-center justify-center text-lg">
          💍
        </Link>
      </div>

      {/* Ringkasan anggaran */}
      <div className="card mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-semibold">Anggaran</span>
          <span className="text-xs text-ink-3">{pct}% terpakai</span>
        </div>
        <p className="font-serif text-lg">
          {rupiah(terpakai)} <span className="text-ink-3 text-sm font-sans">terpakai dari {rupiah(couple.total_budget)}</span>
        </p>
        <div className="bar mt-3"><i style={{ width: `${pct}%` }} /></div>
      </div>

      {/* Quick menu */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Link href="/anggaran?tab=tabungan" className="card flex flex-col items-center gap-2 py-4 no-underline">
          <Wallet className="text-brown" />
          <span className="text-xs font-semibold text-ink">Dana Nikah</span>
        </Link>
        <Link href="/vendor" className="card flex flex-col items-center gap-2 py-4 no-underline">
          <Store className="text-brown" />
          <span className="text-xs font-semibold text-ink">Vendor</span>
        </Link>
        <Link href="/undangan" className="card flex flex-col items-center gap-2 py-4 no-underline">
          <Users className="text-ink-3" />
          <span className="text-xs font-semibold text-ink">Daftar Tamu</span>
        </Link>
      </div>

      {/* Progress checklist */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Checklist persiapan</span>
          <Link href="/checklist" className="text-xs text-brown font-semibold">Lihat semua</Link>
        </div>
        <p className="text-xs text-ink-3 mb-3">{done} dari {total} tugas selesai</p>
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      </div>

      {/* Tamu */}
      <div className="card mb-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-semibold">Daftar Tamu</span>
            <p className="text-xs text-ink-3 mt-0.5">{guests?.length ?? 0} tamu terdaftar</p>
          </div>
          <Link href="/undangan" className="text-xs text-brown font-semibold">Kelola</Link>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
