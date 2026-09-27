-- Seed template milestone standar RangkaiCerita
-- Dipakai saat pasangan baru mendaftar / admin invite user (10 milestone)
insert into public.milestones (slug, name, icon, sort_order, active, is_custom)
values
  ('venue-akad', 'Venue & Akad', '🏛️', 0, true, false),
  ('vendor-utama', 'Vendor Utama', '🤝', 1, true, false),
  ('busana-penampilan', 'Busana & Penampilan', '👗', 2, true, false),
  ('undangan-tamu', 'Undangan & Tamu', '✉️', 3, true, false),
  ('konsep-dekorasi', 'Konsep & Dekorasi', '🌸', 4, true, false),
  ('anggaran-administrasi', 'Anggaran & Administrasi', '📊', 5, true, false),
  ('dokumen-kua', 'Dokumen KUA', '📋', 6, true, false),
  ('mahar', 'Mahar', '💍', 7, true, false),
  ('hari-h', 'Hari-H', '🎊', 8, true, false),
  ('seserahan', 'Seserahan', '🎁', 9, true, false);