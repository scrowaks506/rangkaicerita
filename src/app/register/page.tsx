'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const router = useRouter()
  const [groom, setGroom] = useState('')
  const [bride, setBride] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    // 1. daftar akun (trigger bikin row profiles)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { groom_name: groom, bride_name: bride } },
    })
    if (error) { setError(error.message); setLoading(false); return }

    const user = data.user
    if (user) {
      // 2. init couple + copy 112 task template
      await supabase.from('couples').insert({
        owner_id: user.id, groom_name: groom, bride_name: bride,
        groom_full: groom, bride_full: bride,
        status: 'active', plan: 'gratis',
      })
    }
    setLoading(false)
    router.push('/beranda')
    router.refresh()
  }

  return (
    <div className="app-shell flex flex-col justify-center px-6">
      <div className="text-center mb-7">
        <div className="text-4xl mb-3">💍</div>
        <h1 className="font-serif text-2xl">Daftar akun baru</h1>
        <p className="text-sm text-ink-3 mt-1">Gratis — 112 task checklist siap pakai</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="fl">Nama mempelai pria</label>
          <input className="input" required placeholder="Budi Santoso"
            value={groom} onChange={(e) => setGroom(e.target.value)} />
        </div>
        <div>
          <label className="fl">Nama mempelai wanita</label>
          <input className="input" required placeholder="Sari Dewi"
            value={bride} onChange={(e) => setBride(e.target.value)} />
        </div>
        <div>
          <label className="fl">Email</label>
          <input className="input" type="email" required placeholder="nama@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="fl">Kata Sandi</label>
          <input className="input" type="password" required minLength={6} placeholder="min. 6 karakter"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Memuat...' : 'Daftar sekarang'}
        </button>
      </form>
      <p className="text-center text-sm text-ink-3 mt-5">
        Sudah punya akun? <a href="/login" className="text-brown font-semibold">Masuk</a>
      </p>
    </div>
  )
}
