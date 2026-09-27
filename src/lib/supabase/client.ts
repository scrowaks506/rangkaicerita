import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client untuk BROWSER.
 * Pakai anon key + RLS — user hanya bisa akses data couple miliknya.
 * JANGAN pernah import service_role key di sini.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
