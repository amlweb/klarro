# Social login: Google

The login screen has "Continue with Google".
The code is ready, but Google must be set up once in Google Cloud Console and in Supabase.
**Client secrets go only into the Supabase dashboard. Never put them in this repository.**

Below, `<PROJECT-REF>` is your Supabase project ref (the part before `.supabase.co` in your project URL).

## The callback URL

Google must send the user back to Supabase, not to the app:

```
https://<PROJECT-REF>.supabase.co/auth/v1/callback
```

You can copy it from Supabase: Authentication → Sign In / Providers → Google → "Callback URL (for OAuth)".

## How the flow works

1. The user clicks a button. `supabase.auth.signInWithOAuth()` sends the browser to Google.
2. Google sends the user to the Supabase callback URL.
3. Supabase sends the user back to the app (`redirectTo` = `window.location.origin`) with `?code=...`.
4. On page load, supabase-js (PKCE flow, `detectSessionInUrl`) swaps the code for a session.
   `onAuthStateChange` in `AuthProvider` fires and the app shows the ads page.
5. If the login failed, the URL has `?error=...&error_description=...`. The login page shows the message.

Code: `web/src/auth/oauth.ts`, `web/src/pages/LoginPage.tsx`, `web/src/lib/supabase.ts`.

## 1. Supabase: allowed redirect URLs

Authentication → URL Configuration:

- **Site URL**: your main app URL (for now `http://localhost:5173`).
- **Redirect URLs**: add `http://localhost:5173` (later also your production URL).

If the app URL is not on this list, Supabase sends the user to the Site URL instead.

## 2. Google

1. Open Google Cloud Console → create (or pick) a project.
2. "Google Auth Platform" → **Branding / OAuth consent screen**: app name, support email. Audience: External.
   While the app is in "Testing", only the test users you add can log in.
3. **Clients** → Create client → type **Web application**.
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: the Supabase callback URL above
4. Copy the **Client ID** and **Client secret**.
5. Supabase → Authentication → Sign In / Providers → **Google** → enable, paste both, save.

## Good to know

- The same email from Google and email/password becomes one Supabase user (Supabase links identities with a verified email).
- Mobile (Flutter) will need extra redirect URLs (a deep link) later.
