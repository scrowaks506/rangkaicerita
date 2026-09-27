export default function AdminShell({
  active,
  title,
  sub,
  children,
}: {
  active: string
  title: string
  sub: string
  children: React.ReactNode
}) {
  const MENU = [
    { k: 'dashboard', l: 'Dashboard', i: '📊' },
    { k: 'users', l: 'Users', i: '👥' },
    { k: 'approvals', l: 'Approvals', i: '✅' },
    { k: 'milestone', l: 'Milestone & Task', i: '📋' },
    { k: 'vendor', l: 'Vendor', i: '🤝' },
    { k: 'guestbook', l: 'Moderasi Ucapan', i: '💌' },
    { k: 'analytics', l: 'Analytics', i: '📈' },
    { k: 'settings', l: 'Settings', i: '⚙️' },
  ]
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-none bg-[#2B2320] text-[#E7DED4] flex flex-col p-4">
        <div className="flex items-center gap-2 mb-5 px-1">
          <span className="text-xl">💍</span>
          <div>
            <b className="font-serif text-base text-white block">RangkaiCerita</b>
            <small className="text-[9px] uppercase text-[#9A8B82] tracking-widest">Admin Panel</small>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {MENU.map((m) => (
            <a
              key={m.k}
              href={`/admin/${m.k === 'dashboard' ? 'dashboard' : m.k}`}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm no-underline ${
                active === m.k ? 'bg-[#8B5E3C] text-white font-semibold' : 'text-[#CBB9A8] hover:bg-[#3A312C]'
              }`}
            >
              <span>{m.i}</span> {m.l}
            </a>
          ))}
        </nav>
        <a href="/beranda" className="mt-auto pt-4 border-t border-[#4A3F39] text-[#CBB9A8] text-sm no-underline px-1">
          🚪 Keluar
        </a>
      </aside>
      <main className="flex-1 p-8 overflow-x-auto">
        <h1 className="font-serif text-2xl">{title}</h1>
        <p className="text-sm text-ink-3 mb-6">{sub}</p>
        {children}
      </main>
    </div>
  )
}
