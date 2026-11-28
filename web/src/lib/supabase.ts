import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local.')
}

export const supabase = createClient(url, key, {
  auth: {
    // PKCE: after Google login, Supabase sends the user back with ?code=...
    // supabase-js sees it on page load (detectSessionInUrl) and swaps it for a session.
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
})
