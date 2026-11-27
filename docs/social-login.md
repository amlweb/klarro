# Social login: Google and LinkedIn

The login screen has "Continue with Google" and "Continue with LinkedIn".
The code is ready, but each provider must be set up once in its own console and in Supabase.
**Client secrets go only into the Supabase dashboard. Never put them in this repository.**

Below, `<PROJECT-REF>` is your Supabase project ref (the part before `.supabase.co` in your project URL).

## The callback URL

Both Google and LinkedIn must send the user back to Supabase, not to the app:

```
https://<PROJECT-REF>.supabase.co/auth/v1/callback
```

You can copy it from Supabase: Authentication → Sign In / Providers → Google (or LinkedIn (OIDC)) → "Callback URL (for OAuth)".

## How the flow works

1. The user clicks a button. `supabase.auth.signInWithOAuth()` sends the browser to Google or LinkedIn.
2. The provider sends the user to the Supabase callback URL.
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

## 3. LinkedIn

1. Open the LinkedIn Developer portal → **Create app**. It needs a LinkedIn company page (you can create a simple one).
2. **Products** tab → request **Sign In with LinkedIn using OpenID Connect**.
3. **Auth** tab → Authorized redirect URLs → add the Supabase callback URL above.
4. Copy the **Client ID** and **Primary Client Secret**.
5. Supabase → Authentication → Sign In / Providers → **LinkedIn (OIDC)** → enable, paste both, save.

## Good to know

- The same email from different providers becomes one Supabase user (Supabase links identities with a verified email).
- Mobile (Flutter) will need extra redirect URLs (a deep link) later.
