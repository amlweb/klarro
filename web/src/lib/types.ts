export type WorkMode = 'remote' | 'hybrid' | 'onsite' | 'unknown'

export interface JobAd {
  id: string
  user_id: string
  source_url: string | null
  raw_text: string | null
  extraction_status: 'pending' | 'done' | 'failed'
  title: string | null
  company: string | null
  location: string | null
  work_mode: WorkMode | null
  contract_types: string[]
  seniority: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_period: string | null
  benefits: string[]
  tech_requirements: string[]
  nice_to_have: string[]
  created_at: string
  updated_at: string
}
