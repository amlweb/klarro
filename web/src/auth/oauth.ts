import type { Provider } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/** Providers shown on the login screen. LinkedIn uses Supabase's OpenID Connect provider. */
export type OAuthProvider = Extract<Provider, 'google' | 'linkedin_oidc'>

/**
 * Sends the browser to the provider's login page.
 * After login, the provider returns to Supabase, and Supabase returns to `redirectTo`.
 * `redirectTo` must be listed in Supabase: Authentication → URL Configuration → Redirect URLs.
 */
export async function signInWithProvider(provider: OAuthProvider) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  })
}

/** OAuth error params that Supabase adds to the URL when a login fails. */
const ERROR_PARAMS = ['error', 'error_code', 'error_description']

/**
 * If the OAuth login failed (for example, the user pressed "Cancel"),
 * Supabase sends the user back with `error` and `error_description` in the query or the hash.
 * Returns that message, or null. Does not change the URL.
 */
export function readOAuthErrorFromUrl(): string | null {
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.slice(1))
  const error = url.searchParams.get('error') ?? hash.get('error')
  if (!error) return null
  return url.searchParams.get('error_description') ?? hash.get('error_description') ?? error
}

/** Removes the OAuth error params, so a page refresh does not show the error again. */
export function clearOAuthErrorFromUrl() {
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.slice(1))
  if (!url.searchParams.has('error') && !hash.has('error')) return

  for (const name of ERROR_PARAMS) url.searchParams.delete(name)
  const cleanHash = hash.has('error') ? '' : url.hash
  window.history.replaceState(window.history.state, '', url.pathname + url.search + cleanHash)
}
