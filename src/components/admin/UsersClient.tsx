'use client'

import { useState, useTransition } from 'react'
import { inviteUser, approveUser, suspendUser, restoreUser } from '@/app/admin/actions'

type Row = {
  id: string; groom_name: string; bride_name: string; status: string
  plan: string; wedding_date: string | null; created_at: string; email: string
}

export default function UsersClient({ rows }: { rows: Row[] }) {
  const [show, setShow] = useState(false)
  const [msg, setMsg] = useState('')
  const [, startTransition] = useTransition()

  function act(fn: (id: string) => Promise<void>, id: string) {
    startTransition(async () => { await fn(id) })
  }

  function submitInvite(f: FormData) {
    startTransition(async () => {
      const res = await inviteUser(f)
      if (res.error) setMsg('⚠ ' + res.error)
      else { setMsg('✓ Akun dibuat & invitation email terkirim.'); setShow(false) }
    })
  }

  return (
    <>
      {msg && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm bg-green-50 border border-green-200 text-green-700">
          {msg}
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <div className="flex gap-2">
          {['Semua', 'Aktif', 'Pending', 'Suspend', 'Premium'].map((t, i) => (
            <button
              key={t}
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                i === 0 ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]' : 'bg-white border-line text-ink-2'
              }`}
            >{t}</button>
          ))}
        </div>
        <button
          onClick={() => setShow(true)}
          className="bg-[#8B5E3C] text-white rounded-xl px-5 py-2.5 text-sm font-semibold"
        >＋ Tambah akun</button>
      </div>

      <div className="bg-white border border-line rounded-2xl p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase text-ink-3 border-b border-line">
              <th className="py-2 pr-4">Pasangan</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Paket</th>
              <th className="py-2 pr-4">Tgl akad</th>
              <th className="py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-ink-3">Belum ada pasangan.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="py-3 pr-4">
                  <div className="font-medium">{r.groom_name} & {r.bride_name}</div>
                  <div className="text-[11px] text-ink-3">{r.email}</div>
                </td>
                <td className="py-3 pr-4">
                  <span className={`pill ${r.status === 'active' ? 'p-ok' : r.status === 'pending' ? 'p-warn' : 'p-bad'}`}>
                    {r.status === 'active' ? 'Aktif' : r.status === 'pending' ? 'Pending' : 'Suspend'}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`pill ${r.plan === 'premium' ? 'p-pro' : 'p-idle'}`}>
                    {r.plan === 'premium' ? 'Premium' : 'Gratis'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-ink-3">{r.wedding_date || '-'}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {r.status === 'pending' && (
                      <button
                        onClick={() => act(approveUser, r.id)}
                        className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      >Approve</button>
                    )}
                    {r.status === 'active' && (
                      <button
                        onClick={() => act(suspendUser, r.id)}
                        className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      >Suspend</button>
                    )}
                    {r.status === 'suspended' && (
                      <button
                        onClick={() => act(restoreUser, r.id)}
                        className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      >Restore</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH AKUN */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-cream rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-serif text-lg mb-1">Tambah akun pasangan</h2>
            <p className="text-xs text-ink-3 mb-4">
              User akan terima email invitation untuk setel kata sandi. Status: <b>langsung aktif</b>.
            </p>
            <form action={submitInvite} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fl">Nama mempelai pria</label>
                  <input name="groom" className="input" required placeholder="Muhammad Fathoni" />
                </div>
                <div>
                  <label className="fl">Nama mempelai wanita</label>
                  <input name="bride" className="input" required placeholder="Elvara Putri" />
                </div>
              </div>
              <div>
                <label className="fl">Email</label>
                <input name="email" className="input" type="email" required placeholder="nama@email.com" />
              </div>
              <div>
                <label className="fl">Paket</label>
                <select name="plan" className="input">
                  <option value="gratis">Gratis</option>
                  <option value="premium">Premium (fitur lengkap)</option>
                </select>
              </div>
              <label className="flex items-center gap-2.5 text-sm bg-white border border-line rounded-xl px-3 py-3">
                <input type="checkbox" name="milestones" defaultChecked className="w-4 h-4 accent-[#8B5E3C]" />
                Aktifkan semua template milestone (112 tugas)
              </label>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShow(false)}
                  className="bg-white border border-line text-ink-2 rounded-xl px-5 py-2.5 text-sm font-semibold">Batal</button>
                <button type="submit"
                  className="bg-[#8B5E3C] text-white rounded-xl px-5 py-2.5 text-sm font-semibold">Buat akun &amp; kirim email</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
