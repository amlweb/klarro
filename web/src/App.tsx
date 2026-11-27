import { Box, CircularProgress } from '@mui/material'
import { useAuth } from './auth/AuthProvider'
import LoginPage from './pages/LoginPage'
import JobAdsPage from './pages/JobAdsPage'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return session ? <JobAdsPage /> : <LoginPage />
}
