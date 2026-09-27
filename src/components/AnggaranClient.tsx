'use client'

import { useState, useTransition } from 'react'

type Expense = { id: string; category: string; title: string; amount: number; spent_at: string | null }
type Saving = { id: string; title: string; amount: number; saved_at: string | null }

function rupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function AnggaranClient({
  tab,
  expenses,
  savings,
  coupleId,
}: {
  tab: 'budgeting' | 'pengeluaran' | 'tabungan'
  expenses: Expense[]
  savings: Saving[]
  coupleId: string
}) {
  const [cur, setCur] = useState(tab)
  const [exp, setExp] = useState(expenses)
  const [sav, setSav] = useState(savings)
  const [, startTransition] = useTransition()

  const TABS = [
    { k: 'budgeting', l: 'Budgeting' },
    { k: 'pengeluaran', l: 'Pengeluaran' },
    { k: 'tabungan', l: 'Dana Nikah' },
  ] as const

  const totalExp = exp.reduce((a, e) => a + e.amount, 0)
  const totalSav = sav.reduce((a, s) => a + s.amount, 0)

  // grouped by category (Budgeting view)
  const byCat = exp.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  async function delExpense(id: string) {
    setExp((p) => p.filter((e) => e.id !== id))
    startTransition(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      await createClient().from('expenses').delete().eq('id', id)
    })
  }
  async function delSaving(id: string) {
    setSav((p) => p.filter((s) => s.id !== id))
    startTransition(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      await createClient().from('savings').delete().eq('id', id)
    })
  }

  function addExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const category = String(f.get('category') || 'Lainnya')
    const title = String(f.get('title') || '')
    const amount = Number(f.get('amount') || 0)
    if (!title || !amount) return
    startTransition(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const { data } = await createClient()
        .from('expenses')
        .insert({ couple_id: coupleId, category, title, amount })
        .select('id,category,title,amount,spent_at')
        .single()
      if (data) setExp((p) => [data, ...p])
    })
    e.currentTarget.reset()
  }

  function addSaving(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const title = String(f.get('title') || 'Setoran Dana Nikah')
    const amount = Number(f.get('amount') || 0)
    if (!amount) return
    startTransition(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const { data } = await createClient()
        .from('savings')
        .insert({ couple_id: coupleId, title, amount })
        .select('id,title,amount,saved_at')
        .single()
      if (data) setSav((p) => [data, ...p])
    })
    e.currentTarget.reset()
  }

  return (
    <>
      {/* Tabs: Budgeting / Pengeluaran / Dana Nikah */}
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setCur(t.k)}
            className={`flex-1 py-2.5 rounded-full text-xs font-semibold ${cur === t.k ? 'bg-brown text-white' : 'bg-white border border-line text-ink-2'}`}
          >{t.l}</button>
        ))}
      </div>

      {cur === 'budgeting' && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold">Estimasi per kategori</span>
            <span className="text-xs text-ink-3">{rupiah(totalExp)}</span>
          </div>
          {Object.keys(byCat).length === 0 && (
            <p className="text-xs text-ink-3 py-4 text-center">Belum ada pengeluaran. Pindah ke tab Pengeluaran untuk menambah.</p>
          )}
          {Object.entries(byCat).map(([cat, amt]) => (
            <div key={cat} className="py-2.5 border-b border-line last:border-0">
              <div className="flex justify-between text-[13px]">
                <span className="font-medium">{cat}</span>
                <span>{rupiah(amt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {cur === 'pengeluaran' && (
        <div className="flex flex-col gap-4">
          <form onSubmit={addExpense} className="card flex flex-col gap-3">
            <span className="text-sm font-semibold">Tambah Pengeluaran</span>
            <div className="flex gap-3">
              <select name="category" className="input flex-1" defaultValue="Venue">
                {['Venue','Catering','Busana','Dekorasi','Foto/Video','MC','Undangan','Mahar','Seserahan','Lainnya'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input name="amount" type="number" className="input flex-1" placeholder="Jumlah (Rp)" required />
            </div>
            <input name="title" className="input" placeholder="cth: DP venue" required />
            <button className="btn" type="submit">Tambah</button>
          </form>
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold">Riwayat</span>
              <span className="text-xs text-ink-3">{rupiah(totalExp)}</span>
            </div>
            {exp.length === 0 && <p className="text-xs text-ink-3 py-4 text-center">Belum ada pengeluaran.</p>}
            {exp.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{e.title}</p>
                  <p className="text-[11px] text-ink-3">{e.category}{e.spent_at ? ` · ${e.spent_at}` : ''}</p>
                </div>
                <span className="text-[13px] font-semibold">{rupiah(e.amount)}</span>
                <button onClick={() => delExpense(e.id)} className="text-ink-3 text-base px-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {cur === 'tabungan' && (
        <div className="flex flex-col gap-4">
          <form onSubmit={addSaving} className="card flex flex-col gap-3">
            <span className="text-sm font-semibold">Catat Setoran</span>
            <input name="title" className="input" placeholder="Setoran Dana Nikah" />
            <input name="amount" type="number" className="input" placeholder="Jumlah (Rp)" required />
            <button className="btn" type="submit">Catat setoran</button>
          </form>
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold">Terkumpul</span>
              <span className="text-xs font-semibold text-brown">{rupiah(totalSav)}</span>
            </div>
            {sav.length === 0 && <p className="text-xs text-ink-3 py-4 text-center">Belum ada setoran.</p>}
            {sav.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{s.title}</p>
                  <p className="text-[11px] text-ink-3">{s.saved_at}</p>
                </div>
                <span className="text-[13px] font-semibold">{rupiah(s.amount)}</span>
                <button onClick={() => delSaving(s.id)} className="text-ink-3 text-base px-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
