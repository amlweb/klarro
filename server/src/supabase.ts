import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.')
}

/**
 * A Supabase client that acts as the signed-in user.
 * We pass the user's own token, so Row Level Security still applies on the server.
 */
export function supabaseForUser(accessToken: string) {
  return createClient(url!, key!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
