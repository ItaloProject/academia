import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from './mock'

export function createClient(): ReturnType<typeof createBrowserClient> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createMockClient() as unknown as ReturnType<typeof createBrowserClient>
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
