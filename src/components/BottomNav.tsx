'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, Wallet, User } from 'lucide-react'

const MENU = [
  { href: '/beranda', label: 'Beranda', icon: Home },
  { href: '/checklist', label: 'Checklist', icon: CheckSquare },
  { href: '/anggaran', label: 'Anggaran', icon: Wallet },
  { href: '/profil', label: 'Profil', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="bottom-nav">
      {MENU.map(({ href, label, icon: Icon }) => {
        const on = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} href={href} className={on ? 'on' : ''}>
            <Icon />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
