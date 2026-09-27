import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import AnggaranClient from '@/components/AnggaranClient'

export const dynamic = 'force-dynamic'

function rupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default async function AnggaranPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp = await searchParams
  const tab = (sp.tab as 'budgeting' | 'pengeluaran' | 'tabungan') || 'budgeting'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: couple } = await supabase
    .from('couples')
    .select('id, total_budget')
    .eq('owner_id', user.id)
    .single()
  if (!couple) redirect('/register')

  const cid = couple.id
  const [{ data: expenses }, { data: savings }] = await Promise.all([
    supabase.from('expenses').select('id,category,title,amount,spent_at').eq('couple_id', cid).order('spent_at', { ascending: false }),
    supabase.from('savings').select('id,title,amount,saved_at').eq('couple_id', cid).order('saved_at', { ascending: false }),
  ])

  const terpakai = (expenses ?? []).reduce((a, e) => a + e.amount, 0)
  const menabung = (savings ?? []).reduce((a, s) => a + s.amount, 0)

  return (
    <div className="app-shell px-5 pt-7">
      <h1 className="font-serif text-xl mb-1">Anggaran</h1>
      <p className="text-xs text-ink-3 mb-5">{rupiah(couple.total_budget)} Total Budget · <span className="text-brown font-semibold">ubah</span></p>

      <div className="card mb-5">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-ink-3">Terpakai</span>
          <span className="font-semibold">{rupiah(terpakai)}</span>
        </div>
        <div className="bar mb-3">
          <i style={{ width: `${couple.total_budget ? Math.min(100, (terpakai / couple.total_budget) * 100) : 0}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-ink-3">Dana Nikah terkumpul</span>
          <span className="font-semibold text-brown">{rupiah(menabung)}</span>
        </div>
      </div>

      <AnggaranClient
        tab={tab}
        expenses={expenses ?? []}
        savings={savings ?? []}
        coupleId={cid}
      />

      <BottomNav />
    </div>
  )
}
