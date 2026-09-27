import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client untuk SERVER (Server Component / Route Handler).
 * Membaca session dari cookies — user tetap dibatasi RLS.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // dipanggil di Server Component (read-only) — aman di-ignore
          }
        },
      },
    }
  )
}

/**
 * Admin client — SERVICE ROLE, bypass RLS.
 * HANYA untuk: admin invite user, approve/tolak, suspend, hapus akun.
 * JANGAN pernah diekspos ke browser / NEXT_PUBLIC_*
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}
