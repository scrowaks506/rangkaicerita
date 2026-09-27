'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Admin: undang pasangan baru.
 * Pakai service_role — bypass RLS. Hanya bisa dipanggil dari /admin.
 */
export async function inviteUser(formData: FormData) {
  const email = String(formData.get('email') || '')
  const groom = String(formData.get('groom') || '')
  const bride = String(formData.get('bride') || '')
  const plan = String(formData.get('plan') || 'gratis')
  const activateMilestones = formData.get('milestones') === 'on'

  if (!email || !groom || !bride) {
    return { error: 'Email, nama pria, dan nama wanita wajib diisi.' }
  }

  const admin = createAdminClient()

  // 1. buat user langsung aktif (Supabase kirim invitation email)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { groom_name: groom, bride_name: bride },
  })
  if (error) return { error: error.message }
  if (!data.user) return { error: 'Gagal membuat user.' }

  // 2. pastikan profile aktif
  await admin.from('profiles')
    .update({ role: 'user', status: 'active' })
    .eq('id', data.user.id)

  // 3. init couple
  const { data: couple } = await admin.from('couples').insert({
    owner_id: data.user.id,
    groom_name: groom, bride_name: bride,
    groom_full: groom, bride_full: bride,
    plan, status: 'active',
  }).select('id').single()

  // 4. copy template milestone + 112 task
  if (couple && activateMilestones) {
    const { data: tpl } = await admin.from('task_templates')
      .select('milestone_slug,title,sort_order')
      .order('sort_order', { ascending: true })

    // milestone default (10 milestone standar)
    const ORDER = ['venue-akad','vendor-utama','busana-penampilan','undangan-tamu',
      'konsep-dekorasi','anggaran-administrasi','dokumen-kua','mahar','hari-h','seserahan']
    const ICON: Record<string,string> = {
      'venue-akad':'🏛️','vendor-utama':'🤝','busana-penampilan':'👗','undangan-tamu':'✉️',
      'konsep-dekorasi':'🌸','anggaran-administrasi':'📊','dokumen-kua':'📋','mahar':'💍',
      'hari-h':'🎊','seserahan':'🎁',
    }
    const NAME: Record<string,string> = {
      'venue-akad':'Venue & Akad','vendor-utama':'Vendor Utama','busana-penampilan':'Busana & Penampilan',
      'undangan-tamu':'Undangan & Tamu','konsep-dekorasi':'Konsep & Dekorasi',
      'anggaran-administrasi':'Anggaran & Administrasi','dokumen-kua':'Dokumen KUA','mahar':'Mahar',
      'hari-h':'Hari-H','seserahan':'Seserahan',
    }

    const msRows = ORDER.map((slug, i) => ({
      couple_id: couple.id, slug, name: NAME[slug], icon: ICON[slug],
      sort_order: i, active: true, is_custom: false,
    }))
    const { data: msInserted } = await admin.from('milestones').insert(msRows).select('id,slug')

    if (msInserted && tpl) {
      const slugToId = new Map(msInserted.map((m) => [m.slug, m.id]))
      const taskRows = tpl
        .filter((t) => slugToId.has(t.milestone_slug))
        .map((t) => ({
          milestone_id: slugToId.get(t.milestone_slug)!,
          couple_id: couple.id,
          title: t.title,
          sort_order: t.sort_order,
        }))
      // insert per batch 40
      for (let i = 0; i < taskRows.length; i += 40) {
        await admin.from('tasks').insert(taskRows.slice(i, i + 40))
      }
    }
  }

  // 5. audit log
  await admin.from('audit_logs').insert({
    action: 'user.invite', target: data.user.id,
    detail: { email, groom, bride, plan, milestones: activateMilestones },
  })

  revalidatePath('/admin/users')
  return { error: null }
}

/** Approve pendaftar (status pending -> active) */
export async function approveUser(profileId: string) {
  const admin = createAdminClient()
  await admin.from('profiles').update({ status: 'active' }).eq('id', profileId)
  await admin.from('couples').update({ status: 'active' }).eq('owner_id', profileId)
  await admin.from('audit_logs').insert({ action: 'user.approve', target: profileId })
  revalidatePath('/admin/users')
}

/** Suspend akun */
export async function suspendUser(profileId: string) {
  const admin = createAdminClient()
  await admin.from('profiles').update({ status: 'suspended' }).eq('id', profileId)
  await admin.from('couples').update({ status: 'suspended' }).eq('owner_id', profileId)
  await admin.from('audit_logs').insert({ action: 'user.suspend', target: profileId })
  revalidatePath('/admin/users')
}

/** Restore akun suspend */
export async function restoreUser(profileId: string) {
  const admin = createAdminClient()
  await admin.from('profiles').update({ status: 'active' }).eq('id', profileId)
  await admin.from('couples').update({ status: 'active' }).eq('owner_id', profileId)
  await admin.from('audit_logs').insert({ action: 'user.restore', target: profileId })
  revalidatePath('/admin/users')
}

/** Hapus akun permanen (auth user + semua data via cascade) */
export async function deleteUser(profileId: string) {
  const admin = createAdminClient()
  await admin.from('audit_logs').insert({ action: 'user.delete', target: profileId })
  await admin.from('profiles').delete().eq('id', profileId)
  await admin.auth.admin.deleteUser(profileId)
  revalidatePath('/admin/users')
}
