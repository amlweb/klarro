import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { JobAdExtractionSchema, type JobAdExtraction } from './schema.js'

/** An error whose message is safe to show to the user. */
export class ExtractionError extends Error {}

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-5-5'

// Reads ANTHROPIC_API_KEY from the environment (server/.env). Never in the browser.
const client = new Anthropic()

const SYSTEM_PROMPT = `You extract structured data from job ads for a job-search app.
The ad can be in Polish or English. It may be raw text copied from a web page, with menus,
cookie banners or other ads mixed in: use only the main job ad.

Rules:
- Use only what the ad says. If a field is not in the ad, return null (or an empty list). Do not guess.
- Keep the title, company and skill names in the language of the ad.
- contract_types: use short Polish forms when they fit: "UoP" (umowa o pracę), "B2B",
  "UZ" (umowa zlecenie), "UoD" (umowa o dzieło). Otherwise the ad's own words.
- Salary: plain numbers (e.g. "15 000 - 20 000 PLN" -> 15000 and 20000). One number only -> use it for both.
  If there are different ranges per contract type, use the first one given.
- work_mode: "unknown" if the ad does not say.
- tech_requirements vs nice_to_have: "nice to have", "mile widziane", "a plus" -> nice_to_have.
- Skills: one technology per item, normal spelling ("TypeScript", not "typescript / TS").`

/** Sends the ad text to Claude and returns the validated fields. */
export async function extractJobAd(adText: string): Promise<JobAdExtraction> {
  let response
  try {
    response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // On a safety refusal, the API retries the same request on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(JobAdExtractionSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `<job_ad>\n${adText}\n</job_ad>` }],
    })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('Claude API: invalid ANTHROPIC_API_KEY')
    } else if (err instanceof Anthropic.RateLimitError) {
      throw new ExtractionError('The AI service is busy. Please try again in a minute.')
    } else {
      console.error('Claude API error:', err)
    }
    throw new ExtractionError('The AI service is not available right now.')
  }

  if (response.stop_reason === 'refusal') {
    throw new ExtractionError('The AI could not process this ad.')
  }
  if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
    throw new ExtractionError('The AI returned an incomplete answer. Please try again.')
  }
  return response.parsed_output
}
