-- RangkaiCerita — Skema database (Supabase / Postgres)
-- Design: 1 couple = 1 pasangan. Semua data child punya couple_id.
-- RLS: user hanya bisa akses couple miliknya. Admin bypass via service_role.

create extension if not exists "uuid-ossp";

-- ============ AUTH LINK ============
-- Trigger Supabase standar: auth.users -> profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  role        text not null default 'user' check (role in ('user','admin')),
  status      text not null default 'active' check (status in ('active','pending','suspended')),
  created_at  timestamptz not null default now(),
  last_seen   timestamptz
);

alter table public.profiles enable row level security;
create policy "profile self read"  on public.profiles for select using (auth.uid() = id);
create policy "profile self update" on public.profiles for update using (auth.uid() = id);
-- admin: select all (di-handle oleh policy terpisah)
create policy "profile admin all"  on public.profiles for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ COUPLE ============
create table public.couples (
  id            uuid primary key default uuid_generate_v4(),
  -- relasi ke profile pembuat (admin yg invite / user pertama)
  owner_id      uuid references public.profiles(id) on delete set null,
  groom_name    text not null default '',
  bride_name    text not null default '',
  groom_full    text not null default '',
  bride_full    text not null default '',
  wedding_date  date,
  total_budget  bigint not null default 0,   -- dalam Rupiah penuh
  template_wa   text not null default '',
  plan          text not null default 'gratis' check (plan in ('gratis','premium')),
  status        text not null default 'pending' check (status in ('pending','active','suspended')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.couples (owner_id);

alter table public.couples enable row level security;
create policy "couple owner crud" on public.couples for all
  using (auth.uid() = owner_id);
create policy "couple admin all"  on public.couples for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ MILESTONE ============
-- active: apakah milestone dipilih pasangan ini (field "Pilih Milestone")
create table public.milestones (
  id          uuid primary key default uuid_generate_v4(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  slug        text not null,         -- 'venue-akad','seserahan', dst
  name        text not null,
  icon        text not null default '📋',
  sort_order  int  not null default 0,
  active      boolean not null default false,
  is_custom   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.milestones (couple_id, sort_order);

alter table public.milestones enable row level security;
create policy "milestone couple crud" on public.milestones for all
  using (couple_id in (select id from public.couples where owner_id = auth.uid()));
create policy "milestone admin all" on public.milestones for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ TASK ============
create table public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  couple_id   uuid not null references public.couples(id) on delete cascade,
  title       text not null,
  note        text not null default '',
  done        boolean not null default false,
  due_date    date,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index on public.tasks (couple_id);
create index on public.tasks (milestone_id);

alter table public.tasks enable row level security;
create policy "task couple crud" on public.tasks for all
  using (couple_id in (select id from public.couples where owner_id = auth.uid()));
create policy "task admin all" on public.tasks for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ GUEST ============
create type guest_rsvp as enum ('pending','attending','declined');
create type guest_type  as enum ('keluarga','teman','rekan_kerja','tamu_lain');

create table public.guests (
  id          uuid primary key default uuid_generate_v4(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  group_label text,                  -- keluarga pria / wanita
  rsvp        guest_rsvp not null default 'pending',
  guest_count int not null default 1,
  checkin     boolean not null default false,
  checkin_at  timestamptz,
  seat_table  text,                  -- denah: "Meja 3"
  qr_token    text unique,           -- untuk QR check-in tamu
  note        text not null default '',
  created_at  timestamptz not null default now()
);
create index on public.guests (couple_id);

alter table public.guests enable row level security;
create policy "guest couple crud" on public.guests for all
  using (couple_id in (select id from public.couples where owner_id = auth.uid()));
create policy "guest admin all" on public.guests for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));
-- tamu undangan publik bisa update RSVP sendiri via qr_token (anon)
create policy "guest public rsvp" on public.guests for update
  using (qr_token is not null and qr_token = current_setting('request.token.value', true));

-- ============ VENDOR ============
create type vendor_status as enum ('pending','verified','rejected');

create table public.vendors (
  id          uuid primary key default uuid_generate_v4(),
  couple_id   uuid references public.couples(id) on delete cascade,  -- null = vendor katalog publik
  name        text not null,
  category    text not null,          -- Foto/Video, Catering, Dekorasi, MC, dll
  contact     text,
  phone       text,
  pricing     bigint,
  note        text not null default '',
  status      vendor_status not null default 'verified',
  created_at  timestamptz not null default now()
);
create index on public.vendors (couple_id);

alter table public.vendors enable row level security;
create policy "vendor couple crud" on public.vendors for all
  using (couple_id in (select id from public.couples where owner_id = auth.uid()));
create policy "vendor admin all" on public.vendors for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ BOOKING (vendor yg dibooking pasangan) ============
create table public.bookings (
  id          uuid primary key default uuid_generate_v4(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  vendor_name text not null,
  category    text not null,
  dp_amount   bigint not null default 0,
  paid_amount bigint not null default 0,
  total       bigint not null default 0,
  due_date    date,
  status      text not null default 'dp' check (status in ('dp','lunas','batal')),
  created_at  timestamptz not null default now()
);
create index on public.bookings (couple_id);

alter table public.bookings enable row level security;
create policy "booking couple crud" on public.bookings for all
  using (couple_id in (select id from public.couples where owner_id = auth.uid()));
create policy "booking admin all" on public.bookings for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ EXPENSE (Pengeluaran) ============
create table public.expenses (
  id          uuid primary key default uuid_generate_v4(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  category    text not null,          -- Venue, Catering, Busana, dll
  title       text not null,
  amount      bigint not null default 0,
  spent_at    date,
  created_at  timestamptz not null default now()
);
create index on public.expenses (couple_id);

alter table public.expenses enable row level security;
create policy "expense couple crud" on public.expenses for all
  using (couple_id in (select id from public.couples where owner_id = auth.uid()));
create policy "expense admin all" on public.expenses for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ SAVING (Dana Nikah — tabungan cicilan) ============
create table public.savings (
  id          uuid primary key default uuid_generate_v4(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  title       text not null default 'Setoran Dana Nikah',
  amount      bigint not null default 0,
  saved_at    date not null default current_date,
  created_at  timestamptz not null default now()
);
create index on public.savings (couple_id);

alter table public.savings enable row level security;
create policy "saving couple crud" on public.savings for all
  using (couple_id in (select id from public.couples where owner_id = auth.uid()));
create policy "saving admin all" on public.savings for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ PAYMENT (premium user) ============
create table public.payments (
  id              uuid primary key default uuid_generate_v4(),
  couple_id       uuid not null references public.couples(id) on delete cascade,
  order_id        text unique not null,
  amount          bigint not null,
  status          text not null default 'pending' check (status in ('pending','success','failed','expired')),
  midtrans_token  text,
  created_at      timestamptz not null default now()
);
create index on public.payments (couple_id);

alter table public.payments enable row level security;
create policy "payment couple read" on public.payments for select
  using (couple_id in (select id from public.couples where owner_id = auth.uid()));
create policy "payment admin all" on public.payments for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ GUESTBOOK (buku tamu digital) ============
create table public.guestbook (
  id          uuid primary key default uuid_generate_v4(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  name        text not null,
  message     text not null,
  is_hidden   boolean not null default false,   -- moderasi admin
  created_at  timestamptz not null default now()
);
create index on public.guestbook (couple_id, created_at desc);

alter table public.guestbook enable row level security;
create policy "guestbook couple all" on public.guestbook for all
  using (couple_id in (select id from public.couples where owner_id = auth.uid()));
create policy "guestbook public insert" on public.guestbook for insert
  with check (couple_id = current_setting('request.couple.value', true)::uuid);
create policy "guestbook public read" on public.guestbook for select
  using (couple_id = current_setting('request.couple.value', true)::uuid and not is_hidden);

-- ============ AUDIT LOG (aksi admin) ============
create table public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  admin_id    uuid references public.profiles(id),
  action      text not null,          -- 'user.suspend','user.approve','content.edit'
  target      text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;
create policy "audit admin read" on public.audit_logs for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));
create policy "audit admin insert" on public.audit_logs for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ============ TRIGGER: auth.users -> profiles ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, status)
  values (new.id, new.email, 'user', 'active')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ updated_at auto ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists couples_updated on public.couples;
create trigger couples_updated before update on public.couples
  for each row execute function public.set_updated_at();
