import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import UndanganClient from '@/components/UndanganClient'

export const dynamic = 'force-dynamic'

export default async function UndanganPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: couple } = await supabase
    .from('couples')
    .select('id, template_wa')
    .eq('owner_id', user.id)
    .single()
  if (!couple) redirect('/register')

  const { data: guests } = await supabase
    .from('guests')
    .select('id,name,phone,group_label,rsvp,guest_count,checkin,qr_token')
    .eq('couple_id', couple.id)
    .order('created_at', { ascending: false })

  return (
    <div className="app-shell px-5 pt-7">
      <h1 className="font-serif text-xl mb-1">Daftar Tamu</h1>
      <p className="text-xs text-ink-3 mb-5">Kelola RSVP, QR check-in, dan undangan WhatsApp</p>

      <UndanganClient
        guests={guests ?? []}
        coupleId={couple.id}
        templateWa={couple.template_wa || ''}
      />

      <BottomNav />
    </div>
  )
}
