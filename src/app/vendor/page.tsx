import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function rupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default async function VendorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id,name,category,contact,phone,pricing,note,status')
    .eq('couple_id', couple?.id ?? '')
    .order('category', { ascending: true })

  return (
    <div className="app-shell px-5 pt-7">
      <h1 className="font-serif text-xl mb-1">Vendor</h1>
      <p className="text-xs text-ink-3 mb-5">Daftar vendor pernikahanmu</p>

      <Link href="/vendor/katalog" className="card mb-5 flex items-center gap-3 no-underline">
        <span className="text-2xl">🤝</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Katalog vendor</p>
          <p className="text-[11px] text-ink-3">Vendor rekomendasi dari RangkaiCerita</p>
        </div>
        <span className="text-ink-3">›</span>
      </Link>

      <div className="card mb-4">
        <span className="text-sm font-semibold">Vendor kamu</span>
        {(!vendors || vendors.length === 0) && (
          <p className="text-xs text-ink-3 py-5 text-center">Belum ada vendor. Tambah dari katalog atau input manual.</p>
        )}
        {(vendors ?? []).map((v) => (
          <div key={v.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0">
            <div className="w-10 h-10 flex-none rounded-xl bg-cream-2 flex items-center justify-center text-lg">
              {v.category === 'Foto/Video' ? '📸' : v.category === 'Catering' ? '🍽️' : v.category === 'Dekorasi' ? '🌸' : v.category === 'MC' ? '🎙️' : '🤝'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{v.name}</p>
              <p className="text-[11px] text-ink-3">{v.category}{v.pricing ? ` · ${rupiah(v.pricing)}` : ''}</p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
