import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import ProfilClient from '@/components/ProfilClient'

export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: couple } = await supabase
    .from('couples')
    .select('id,groom_name,bride_name,groom_full,bride_full,wedding_date,total_budget,template_wa,plan')
    .eq('owner_id', user.id)
    .single()

  return (
    <div className="app-shell px-5 pt-7">
      <h1 className="font-serif text-xl mb-1">Profil</h1>
      <p className="text-xs text-ink-3 mb-5">
        {couple ? `${couple.groom_name} & ${couple.bride_name}` : 'Lengkapi data pasangan'}
        {couple?.plan === 'premium' ? ' · 💎 Premium' : ''}
      </p>

      {couple ? (
        <ProfilClient couple={couple} email={user.email!} />
      ) : (
        <div className="card text-center py-8">
          <p className="text-sm text-ink-3 mb-4">Data pasangan belum ada.</p>
          <a href="/register" className="btn inline-block w-auto px-6">Lengkapi sekarang</a>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
