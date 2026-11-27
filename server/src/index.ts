import express from 'express'
import cors from 'cors'
import { requireUser } from './auth.js'

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

/** Who am I? Useful to test that login works end to end. */
app.get('/api/me', requireUser, (req, res) => {
  res.json({ id: req.user!.id, email: req.user!.email })
})

/**
 * Step 2: receive { text } or { url }, ask Claude to extract the fields,
 * and save the result to the job_ads table.
 */
app.post('/api/ads/extract', requireUser, (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet (step 2)' })
})

app.listen(port, () => {
  console.log(`Klarro server listening on http://localhost:${port}`)
})
