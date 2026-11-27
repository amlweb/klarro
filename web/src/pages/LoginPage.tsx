import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, Card, CardContent, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { supabase } from '../lib/supabase'

type Mode = 'signIn' | 'signUp'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

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
            <Button type="submit" variant="contained" size="large" loading={busy}>
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
