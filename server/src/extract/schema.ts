import { z } from 'zod'

/**
 * The fields Claude must return for one job ad.
 * It mirrors the extracted columns of `public.job_ads` (see supabase/migrations).
 * When you change it, also change the migration and web/src/lib/types.ts.
 *
 * Every field is required but nullable: "not in the ad" is `null` (or `[]`),
 * so Claude never has to guess a value.
 */
export const JobAdExtractionSchema = z.object({
  title: z.string().nullable().describe('Job title, as written in the ad'),
  company: z.string().nullable().describe('Hiring company name'),
  location: z.string().nullable().describe('City (and country if given), e.g. "Warszawa, Poland"'),
  work_mode: z
    .enum(['remote', 'hybrid', 'onsite', 'unknown'])
    .describe('remote = fully remote, hybrid = some office days, onsite = office only'),
  contract_types: z
    .array(z.string())
    .describe('Contract types, short form, e.g. "UoP", "B2B", "UZ", "UoD"'),
  seniority: z.string().nullable().describe('e.g. "junior", "mid", "senior", "lead"'),
  salary_min: z.number().nullable().describe('Lower end of the salary range, a plain number'),
  salary_max: z.number().nullable().describe('Upper end of the salary range, a plain number'),
  salary_currency: z.string().nullable().describe('ISO code, e.g. "PLN", "EUR", "USD"'),
  salary_period: z
    .enum(['hour', 'day', 'month', 'year'])
    .nullable()
    .describe('What the salary numbers are per'),
  benefits: z.array(z.string()).describe('Benefits, short phrases'),
  tech_requirements: z
    .array(z.string())
    .describe('Required technical skills, one skill per item, e.g. "React", "TypeScript"'),
  nice_to_have: z.array(z.string()).describe('Optional technical skills, one skill per item'),
})

export type JobAdExtraction = z.infer<typeof JobAdExtractionSchema>

/** Body of POST /api/ads/extract: exactly one of `text` or `url`. */
export const ExtractRequestSchema = z.union([
  z.object({ text: z.string().trim().min(50).max(50_000) }).strict(),
  z.object({ url: z.url({ protocol: /^https?$/ }) }).strict(),
])
