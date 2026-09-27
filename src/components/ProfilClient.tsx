'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

type Couple = {
  id: string
  groom_name: string
  bride_name: string
  groom_full: string
  bride_full: string
  wedding_date: string | null
  total_budget: number
  template_wa: string
  plan: string
}

export default function ProfilClient({
  couple,
  email,
}: {
  couple: Couple
  email: string
}) {
  const [form, setForm] = useState(couple)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [, startTransition] = useTransition()

  function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('couples').update({
        groom_full: form.groom_full,
        bride_full: form.bride_full,
        groom_name: form.groom_name,
        bride_name: form.bride_name,
        wedding_date: form.wedding_date || null,
        total_budget: Number(form.total_budget) || 0,
        template_wa: form.template_wa,
      }).eq('id', form.id)
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function hapusAkun() {
    if (!confirm('Hapus akun ini? Semua data (tamu, vendor, checklist) akan hilang permanen.')) return
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // couple cascade-delete semua data anak; profile+auth user dihapus via service role
      await fetch('/api/hapus-akun', { method: 'DELETE' })
      supabase.auth.signOut()
      window.location.href = '/login'
    })
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="card">
        <p className="text-sm font-semibold mb-1">Data pasangan</p>
        <p className="text-[11px] text-ink-3 mb-3">{email}</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="fl">Nama mempelai pria (lengkap)</label>
            <input className="input" value={form.groom_full}
              onChange={(e) => setForm({ ...form, groom_full: e.target.value })} />
          </div>
          <div>
            <label className="fl">Nama mempelai wanita (lengkap)</label>
            <input className="input" value={form.bride_full}
              onChange={(e) => setForm({ ...form, bride_full: e.target.value })} />
          </div>
          <div>
            <label className="fl">Tanggal akad</label>
            <input className="input" type="date" value={form.wedding_date || ''}
              onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card">
        <label className="fl">Total anggaran (Rupiah)</label>
        <input className="input" type="number" value={form.total_budget}
          onChange={(e) => setForm({ ...form, total_budget: Number(e.target.value) })} />
      </div>

      <div className="card">
        <label className="fl">Template WhatsApp undangan</label>
        <textarea
          className="input" rows={4}
          placeholder="Halo {nama_tamu}, kami mengundang Anda..."
          value={form.template_wa}
          onChange={(e) => setForm({ ...form, template_wa: e.target.value })}
        />
        <p className="text-[10.5px] text-ink-3 mt-2">
          Variabel: <code className="text-brown">{`{nama_tamu}`}</code>, <code className="text-brown">{`{link_rsvp}`}</code>
        </p>
      </div>

      <button className="btn" type="submit" disabled={saving}>
        {saving ? 'Menyimpan...' : 'Simpan perubahan'}
      </button>
      {saved && <p className="text-xs text-green-600 text-center -mt-2">✓ Tersimpan</p>}

      <div className="card border-red-200" style={{ borderColor: '#E5B8B1' }}>
        <p className="text-sm font-semibold text-red-700 mb-1">Zona berbahaya</p>
        <p className="text-[11px] text-ink-3 mb-3">Penghapusan akun bersifat permanen.</p>
        <button type="button" className="btn-danger" onClick={hapusAkun}>Hapus akun</button>
      </div>
    </form>
  )
}
