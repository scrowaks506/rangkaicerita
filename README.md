# RangkaiCerita

Wedding planner Indonesia — perencanaan pernikahan all-in-one: checklist milestone, anggaran & dana nikah, daftar tamu dengan RSVP + QR check-in, vendor, dan admin panel.

## Stack
- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Supabase** — Auth, Postgres, Realtime, Storage
- **Midtrans SNAP** — pembayaran premium
- **Fonnte/Wablas** — WA blast undangan
- **qrcode** — QR check-in tamu

## Fitur

**Aplikasi pengantin (mobile-first)**
- Beranda — ringkasan anggaran, progress checklist, quick menu
- Checklist — 10 milestone, 112 task, pilih/sendiri milestone
- Anggaran — Budgeting / Pengeluaran / Dana Nikah (3 tab)
- Daftar Tamu — RSVP, QR check-in, kirim undangan WhatsApp
- Vendor — daftar vendor + katalog
- Profil — data pasangan, anggaran, template WA, hapus akun

**Admin panel (desktop)**
- Dashboard — statistik, pasangan terbaru
- Manajemen User — undang/approve/suspend/restore/hapus akun
- Copy otomatis 112 task template ke setiap pasangan baru

## Struktur
```
src/app/
  beranda/ checklist/ anggaran/ undangan/ vendor/ profil/
  admin/          dashboard, users + server actions
  api/            hapus-akun, midtrans-webhook, log-error, rsvp
src/lib/supabase/ client (anon+RLS), server (session), admin (service_role)
src/middleware.ts gate: /admin role=admin, /app wajib login
supabase/
  schema.sql              12 tabel + RLS + trigger
  seed_milestones.sql     10 milestone standar
  seed_tasks.sql          112 task standar
```

## Setup
```bash
cp .env.example .env.local      # isi key Supabase + Midtrans + Fonnte
npm install
# jalankan di Supabase SQL editor, berurutan:
#   1. supabase/schema.sql
#   2. supabase/seed_milestones.sql
#   3. supabase/seed_tasks.sql
npm run dev
```

Buat admin pertama: set `role='admin'` di tabel `profiles` melalui Supabase SQL editor.

## Keamanan
- RLS di setiap tabel — user hanya akses `couple_id` miliknya
- Admin bypass via `service_role` (server-side only, tidak pernah ke browser)
- Undangan user: `supabase.auth.admin.createUser()` + email invitation
- Audit log untuk semua aksi admin

## Deploy
Vercel (gratis) + Supabase free tier. Build standalone:
```bash
npm run build && node .next/standalone/server.js   # ~10MB RAM
```

## Mockup / Tampilan
Lihat `docs/mockups/` — preview admin panel (dashboard & manajemen user) + tema desain.
