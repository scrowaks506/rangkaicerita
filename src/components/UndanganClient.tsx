'use client'

import { useState, useTransition } from 'react'
import QRCode from 'qrcode'
import { generateQr } from '@/lib/qr'

type Guest = {
  id: string; name: string; phone: string | null; group_label: string | null
  rsvp: 'pending' | 'attending' | 'declined'
  guest_count: number; checkin: boolean; qr_token: string | null
}

const RSVP_LABEL = { pending: 'Belum konfirmasi', attending: 'Hadir', declined: 'Tidak hadir' }
const RSVP_PILL = { pending: 'p-warn', attending: 'p-ok', declined: 'p-bad' }

export default function UndanganClient({
  guests,
  coupleId,
  templateWa,
}: {
  guests: Guest[]
  coupleId: string
  templateWa: string
}) {
  const [list, setList] = useState(guests)
  const [, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)

  const hadir = list.filter((g) => g.rsvp === 'attending')
  const totalKursi = hadir.reduce((a, g) => a + g.guest_count, 0)

  function addGuest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '')
    const phone = String(f.get('phone') || '')
    const group_label = String(f.get('group_label') || '')
    if (!name) return
    startTransition(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const token = generateQr()
      const { data } = await supabase
        .from('guests')
        .insert({ couple_id: coupleId, name, phone: phone || null, group_label: group_label || null, qr_token: token })
        .select('id,name,phone,group_label,rsvp,guest_count,checkin,qr_token')
        .single()
      if (data) setList((p) => [data, ...p])
    })
    e.currentTarget.reset()
    setShowAdd(false)
  }

  function cycleRsvp(id: string) {
    setList((p) =>
      p.map((g) => {
        if (g.id !== id) return g
        const next = g.rsvp === 'pending' ? 'attending' : g.rsvp === 'attending' ? 'declined' : 'pending'
        startTransition(async () => {
          const { createClient } = await import('@/lib/supabase/client')
          await createClient().from('guests').update({ rsvp: next }).eq('id', id)
        })
        return { ...g, rsvp: next }
      })
    )
  }

  function delGuest(id: string) {
    setList((p) => p.filter((g) => g.id !== id))
    startTransition(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      await createClient().from('guests').delete().eq('id', id)
    })
  }

  async function kirimWa(g: Guest) {
    if (!g.phone) return
    const token = g.qr_token || ''
    const link = `${window.location.origin}/rsvp?token=${token}`
    const msg = (templateWa || 'Halo {nama_tamu}, kami mengundang Anda di pernikahan kami.')
      .replaceAll('{nama_tamu}', g.name)
      .replaceAll('{link_rsvp}', link)
    const phone = g.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stat ringkas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <p className="font-serif text-xl">{list.length}</p>
          <p className="text-[10.5px] text-ink-3">Tamu</p>
        </div>
        <div className="card text-center py-4">
          <p className="font-serif text-xl text-brown">{hadir.length}</p>
          <p className="text-[10.5px] text-ink-3">Hadir</p>
        </div>
        <div className="card text-center py-4">
          <p className="font-serif text-xl">{totalKursi}</p>
          <p className="text-[10.5px] text-ink-3">Kursi</p>
          <div className="text-[9px] text-ink-3 mt-0.5">{QRCode ? '' : ''}</div>
        </div>
      </div>

      <button className="btn" onClick={() => setShowAdd((v) => !v)}>
        {showAdd ? 'Tutup' : '＋ Tambah tamu'}
      </button>

      {showAdd && (
        <form onSubmit={addGuest} className="card flex flex-col gap-3">
          <input name="name" className="input" placeholder="Nama tamu" required />
          <div className="flex gap-3">
            <input name="phone" className="input flex-1" placeholder="No. WhatsApp" />
            <select name="group_label" className="input flex-1" defaultValue="">
              <option value="">Kelompok</option>
              <option>Keluarga pria</option>
              <option>Keluarga wanita</option>
              <option>Teman</option>
              <option>Rekan kerja</option>
            </select>
          </div>
          <button className="btn" type="submit">Simpan</button>
        </form>
      )}

      <div className="card">
        {list.length === 0 && (
          <p className="text-xs text-ink-3 py-6 text-center">Belum ada tamu. Klik "Tambah tamu" untuk mulai.</p>
        )}
        {list.map((g) => (
          <div key={g.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{g.name}</p>
              <p className="text-[11px] text-ink-3 truncate">
                {g.group_label ? `${g.group_label} · ` : ''}{g.phone || 'tanpa no. WA'}{g.checkin ? ' · ✓ check-in' : ''}
              </p>
            </div>
            <button
              onClick={() => cycleRsvp(g.id)}
              className={`pill ${RSVP_PILL[g.rsvp]}`}
            >{RSVP_LABEL[g.rsvp]}</button>
            <button onClick={() => kirimWa(g)} className="text-base px-1" title="Kirim undangan WhatsApp">💌</button>
            <button onClick={() => delGuest(g.id)} className="text-ink-3 text-base px-1">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
