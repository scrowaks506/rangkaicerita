'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'

type Task = { id: string; title: string; note: string; done: boolean }
type Milestone = {
  id: string; slug: string; name: string; icon: string; active: boolean; is_custom: boolean
  tasks: Task[]
}

export default function ChecklistClient({
  milestones,
  coupleId,
}: {
  milestones: Milestone[]
  coupleId: string
}) {
  const [data, setData] = useState(milestones)
  const [pending, startTransition] = useTransition()
  const [tab, setTab] = useState<'aktif' | 'template'>('aktif')

  const aktif = data.filter((m) => m.active)
  const ms = tab === 'aktif' ? aktif : data
  const allTasks = data.flatMap((m) => m.tasks)
  const done = allTasks.filter((t) => t.done).length
  const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0

  function toggle(mIdx: number, tIdx: number) {
    setData((prev) => {
      const next = prev.map((m) => ({
        ...m,
        tasks: m.tasks.map((t) => ({ ...t })),
      }))
      const t = next[mIdx].tasks[tIdx]
      t.done = !t.done
      persist(t.id, t.done)
      return next
    })
  }

  function persist(taskId: string, done: boolean) {
    startTransition(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('tasks').update({ done }).eq('id', taskId)
    })
  }

  function toggleActive(mIdx: number) {
    setData((prev) => {
      const next = prev.map((m) => ({ ...m, tasks: m.tasks.map((t) => ({ ...t })) }))
      const m = next[mIdx]
      m.active = !m.active
      startTransition(async () => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.from('milestones').update({ active: m.active }).eq('id', m.id)
      })
      return next
    })
  }

  if (!data.length) {
    return (
      <div className="px-6 pt-24 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm text-ink-3">Belum ada milestone. Hubungi admin untuk mengaktifkan template.</p>
      </div>
    )
  }

  return (
    <div className="app-shell px-5 pt-7">
      {/* Header: "X dari Y milestone dipilih" */}
      <div className="mb-5">
        <h1 className="font-serif text-xl mb-1">Checklist</h1>
        <p className="text-xs text-ink-3">{aktif.length} dari {data.length} milestone dipilih</p>
        <div className="bar mt-3"><i style={{ width: `${(aktif.length / data.length) * 100}%` }} /></div>
        <p className="text-xs text-ink-3 mt-3">{done} dari {allTasks.length} tugas selesai ({pct}%)</p>
      </div>

      {/* Tab: milestone aktif / pilih template */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('aktif')}
          className={`flex-1 py-2.5 rounded-full text-xs font-semibold ${tab === 'aktif' ? 'bg-brown text-white' : 'bg-white border border-line text-ink-2'}`}
        >Milestone aktif</button>
        <button
          onClick={() => setTab('template')}
          className={`flex-1 py-2.5 rounded-full text-xs font-semibold ${tab === 'template' ? 'bg-brown text-white' : 'bg-white border border-line text-ink-2'}`}
        >Pilih milestone</button>
      </div>

      {tab === 'template' && (
        <div className="card mb-4 bg-cream-2 border-dashed">
          <p className="text-xs text-ink-2">
            Pilih milestone yang relevan dengan pernikahanmu. Tugas otomatis dimuat saat diaktifkan.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {ms.map((m, mi) => {
          const mDone = m.tasks.filter((t) => t.done).length
          const realIdx = data.findIndex((x) => x.id === m.id)
          return (
            <div key={m.id} className="card">
              {/* Milestone header */}
              <div className="flex items-center gap-3 mb-3">
                {tab === 'template' ? (
                  <button
                    className={`chk ${m.active ? 'on' : ''}`}
                    onClick={() => toggleActive(realIdx)}
                    aria-label="Pilih milestone"
                  >
                    {m.active && <Check />}
                  </button>
                ) : (
                  <span className="text-xl">{m.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{m.name}</p>
                  <p className="text-[11px] text-ink-3">
                    {m.tasks.length} tugas{tab === 'aktif' && m.tasks.length ? ` · ${mDone} selesai` : ''}
                  </p>
                </div>
              </div>

              {/* Task list (hanya milestone aktif di tab "aktif") */}
              {tab === 'aktif' && (
                <div className="flex flex-col">
                  {m.tasks.length === 0 && (
                    <p className="text-[11px] text-ink-3 py-2">Aktifkan milestone ini untuk memuat tugas.</p>
                  )}
                  {m.tasks.map((t, ti) => (
                    <button
                      key={t.id}
                      onClick={() => toggle(realIdx, ti)}
                      className="flex items-start gap-3 py-2.5 w-full text-left"
                    >
                      <span className={`chk mt-0.5 ${t.done ? 'on' : ''}`}>
                        {t.done && <Check />}
                      </span>
                      <span className={`text-[13px] ${t.done ? 'line-through text-ink-3' : 'text-ink'}`}>
                        {t.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
