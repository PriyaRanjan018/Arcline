import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore – cookieStore.set is available in Server Actions/Route Handlers
            cookieStore.set({ name, value, ...options })
          } catch {
            // set() is not available in Server Components (read-only context) — ignore
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore – cookieStore.set is available in Server Actions/Route Handlers
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // remove() is not available in Server Components — ignore
          }
        },
      },
    }
  )
}
