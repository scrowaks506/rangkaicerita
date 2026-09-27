import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChecklistClient from '@/components/ChecklistClient'

export const dynamic = 'force-dynamic'

export default async function ChecklistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!couple) redirect('/register')

  // milestones + tasks terurut
  const { data: ms } = await supabase
    .from('milestones')
    .select('id, slug, name, icon, active, is_custom, sort_order')
    .eq('couple_id', couple.id)
    .order('sort_order', { ascending: true })

  const ids = (ms ?? []).map((m) => m.id)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, milestone_id, title, note, done, sort_order')
    .in('milestone_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    .order('sort_order', { ascending: true })

  const milestones = (ms ?? []).map((m) => ({
    ...m,
    tasks: (tasks ?? []).filter((t) => t.milestone_id === m.id),
  }))

  return <ChecklistClient milestones={milestones} coupleId={couple.id} />
}
