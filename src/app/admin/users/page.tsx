import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminShell from '@/components/admin/AdminShell'
import UsersClient from '@/components/admin/UsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/beranda')

  const { data: couples } = await supabase
    .from('couples')
    .select('id,groom_name,bride_name,status,plan,wedding_date,created_at,owner_id')
    .order('created_at', { ascending: false })
    .limit(50)

  const ownerIds = (couples ?? []).map((c) => c.owner_id).filter(Boolean)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id,email,status')
    .in('id', ownerIds.length ? ownerIds : ['00000000-0000-0000-0000-000000000000'])

  const emailMap = new Map((profiles ?? []).map((p) => [p.id, p.email]))

  const rows = (couples ?? []).map((c) => ({
    ...c,
    email: emailMap.get(c.owner_id) || '-',
  }))

  return (
    <AdminShell active="users" title="Manajemen User" sub={`${rows.length} pasangan ditampilkan (maks 50)`}>
      <UsersClient rows={rows} />
    </AdminShell>
  )
}
