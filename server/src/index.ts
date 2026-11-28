import express from 'express'
import cors from 'cors'
import { requireUser } from './auth.js'
import { ExtractRequestSchema } from './extract/schema.js'
import { fetchAdText, FetchPageError } from './extract/fetchPage.js'
import { extractJobAd, ExtractionError } from './extract/claude.js'

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
 * Receives { text } or { url }, asks Claude to extract the fields,
 * and saves the result to the job_ads table (as the user, so RLS applies).
 *
 * The row is saved first as "pending", then updated to "done" or "failed",
 * so a failed extraction is still visible to the user.
 */
app.post('/api/ads/extract', requireUser, async (req, res) => {
  const body = ExtractRequestSchema.safeParse(req.body)
  if (!body.success) {
    res.status(400).json({
      error: 'Send { "text": "..." } (50 to 50,000 characters) or { "url": "https://..." }.',
    })
    return
  }
  const input = body.data
  const db = req.db!

  const { data: ad, error: insertError } = await db
    .from('job_ads')
    .insert('url' in input ? { source_url: input.url } : { raw_text: input.text })
    .select()
    .single()
  if (insertError) {
    console.error('Insert job_ad failed:', insertError)
    res.status(500).json({ error: 'Could not save the ad.' })
    return
  }

  try {
    const text = 'url' in input ? await fetchAdText(input.url) : input.text
    const fields = await extractJobAd(text)

    const { data: saved, error } = await db
      .from('job_ads')
      .update({ ...fields, raw_text: text, extraction_status: 'done' })
      .eq('id', ad.id)
      .select()
      .single()
    if (error) throw error
    res.status(201).json(saved)
  } catch (err) {
    const known = err instanceof FetchPageError || err instanceof ExtractionError
    if (!known) console.error('Extraction failed:', err)

    await db.from('job_ads').update({ extraction_status: 'failed' }).eq('id', ad.id)
    res.status(known ? 422 : 500).json({
      error: known ? err.message : 'Something went wrong while reading the ad.',
      id: ad.id,
    })
  }
})

app.listen(port, () => {
  console.log(`Klarro server listening on http://localhost:${port}`)
})
