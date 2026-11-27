import { useEffect, useState } from 'react'
import { Alert, AppBar, Box, Button, Card, CardContent, Chip, CircularProgress, Container, Stack, Toolbar, Typography } from '@mui/material'
import WorkOutlinedIcon from '@mui/icons-material/WorkOutlined'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import type { JobAd } from '../lib/types'

const workModeLabel: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  unknown: 'Unknown',
}

export default function JobAdsPage() {
  const { session } = useAuth()
  const [ads, setAds] = useState<JobAd[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Row Level Security makes sure this returns only the signed-in user's ads.
    supabase
      .from('job_ads')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setAds((data ?? []) as JobAd[])
        setLoading(false)
      })
  }, [])

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <WorkOutlinedIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Klarro
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            {session?.user.email}
          </Typography>
          <Button color="inherit" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My job ads
        </Typography>

        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && ads.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>No job ads yet.</Typography>
            <Typography variant="body2">In the next step you will be able to paste an ad or a link here.</Typography>
          </Box>
        )}

        <Stack spacing={2}>
          {ads.map((ad) => (
            <Card key={ad.id} variant="outlined">
              <CardContent>
                <Typography variant="h6">{ad.title ?? 'Untitled ad'}</Typography>
                <Typography color="text.secondary" gutterBottom>
                  {[ad.company, ad.location].filter(Boolean).join(' · ')}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {ad.work_mode && <Chip size="small" color="primary" label={workModeLabel[ad.work_mode]} />}
                  {ad.contract_types.map((c) => (
                    <Chip key={c} size="small" variant="outlined" label={c} />
                  ))}
                  {ad.tech_requirements.map((t) => (
                    <Chip key={t} size="small" label={t} />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    </>
  )
}
