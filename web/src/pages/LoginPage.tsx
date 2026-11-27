import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Box, Button, Card, CardContent, Divider, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import { supabase } from '../lib/supabase'
import { clearOAuthErrorFromUrl, readOAuthErrorFromUrl, signInWithProvider, type OAuthProvider } from '../auth/oauth'

type Mode = 'signIn' | 'signUp'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null)
  // Shows the reason when Google/LinkedIn sent the user back with an error.
  const [error, setError] = useState<string | null>(readOAuthErrorFromUrl)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    clearOAuthErrorFromUrl()
  }, [])

  async function handleOAuth(provider: OAuthProvider) {
    setOauthBusy(provider)
    setError(null)
    setInfo(null)
    // On success the browser leaves this page, so we only handle the error case here.
    const { error } = await signInWithProvider(provider)
    if (error) {
      setError(error.message)
      setOauthBusy(null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)

    const { data, error } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setBusy(false)
    if (error) {
      setError(error.message)
    } else if (mode === 'signUp' && !data.session) {
      setInfo('Check your email to confirm your account, then sign in.')
    }
  }

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Klarro
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              loading={oauthBusy === 'google'}
              disabled={oauthBusy !== null || busy}
              onClick={() => handleOAuth('google')}
            >
              Continue with Google
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<LinkedInIcon />}
              loading={oauthBusy === 'linkedin_oidc'}
              disabled={oauthBusy !== null || busy}
              onClick={() => handleOAuth('linkedin_oidc')}
            >
              Continue with LinkedIn
            </Button>
          </Stack>
          <Divider sx={{ mb: 1 }}>or use email</Divider>
          <Tabs value={mode} onChange={(_, v: Mode) => setMode(v)} sx={{ mb: 2 }}>
            <Tab value="signIn" label="Sign in" />
            <Tab value="signUp" label="Create account" />
          </Tabs>
          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField
              label="Password"
              type="password"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              required
              slotProps={{ htmlInput: { minLength: 6 } }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <Alert severity="error">{error}</Alert>}
            {info && <Alert severity="info">{info}</Alert>}
            <Button type="submit" variant="contained" size="large" loading={busy} disabled={oauthBusy !== null}>
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
