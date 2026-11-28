# Klarro – guide for AI agents

This file describes the project for AI coding agents (Claude Code, Codex, Cursor and similar).
`CLAUDE.md` imports this file, so keep the content here.

## What Klarro is

A job-search helper. A user pastes a job ad (text or a link) and Klarro extracts structured data:
title, company, location, work mode (remote / hybrid / on-site), contract types (e.g. UoP, B2B),
seniority, salary, benefits, required and nice-to-have technical skills.
Ads are saved per user so they can be listed, filtered and compared.
It is multi-user and starts as a desktop web app. A mobile app comes later.

## Stack

| Part | Tech |
|---|---|
| `web/` | React 19, Vite, TypeScript, Material UI (MUI) 9, `@supabase/supabase-js` |
| `server/` | Node.js 22+, Express, TypeScript (run with `tsx`) |
| Database and auth | Supabase: Postgres with Row Level Security, email/password Auth |
| AI extraction | Claude API via the official `@anthropic-ai/sdk`, called from `server/` only |
| Mobile (later) | Flutter, using the same Supabase project and server API |

## Folder layout

```
package.json            Root scripts only: `npm run dev` starts all apps (concurrently)
web/                    React app
  src/main.tsx          ThemeProvider + AuthProvider + App
  src/theme.ts          MUI theme (colours, shape). Style through the theme first.
  src/auth/             AuthProvider and useAuth() (Supabase session)
  src/lib/supabase.ts   Browser Supabase client
  src/lib/types.ts      JobAd type (mirrors the job_ads table)
  src/pages/            LoginPage, JobAdsPage
server/
  src/index.ts          Express app and routes
  src/auth.ts           requireUser middleware (checks the Bearer token)
  src/supabase.ts       supabaseForUser(token): acts as the user, so RLS applies
  src/extract/schema.ts     Zod schemas: extraction fields (sent to Claude) and request body
  src/extract/fetchPage.ts  Downloads a URL (SSRF guard, limits) and cleans HTML to text
  src/extract/claude.ts     The Claude call (structured outputs) and the system prompt
supabase/migrations/    SQL schema. Every DB change gets a new migration file here.
mobile/                 (later) Flutter app
```

## How to run

```bash
cd web    && cp .env.example .env.local && npm install && npm run dev   # http://localhost:5173
cd server && cp .env.example .env       && npm install && npm run dev   # http://localhost:3001/health
```

Or from the root: `npm run install:all` once, then `npm run dev` starts web and server together
(`concurrently`, see the root `package.json`). Add a `dev:<app>` script there for new apps.

Checks before you finish a change:

- `cd web && npm run build` (type check and build) and `npm run lint` (oxlint)
- `cd server && npx tsc --noEmit`

## Data model

The `public.job_ads` table has one row per ad, owned by `user_id` (defaults to `auth.uid()`).
Arrays: `contract_types`, `benefits`, `tech_requirements`, `nice_to_have`.
`work_mode` is one of `remote | hybrid | onsite | unknown`.
`extraction_status` is one of `pending | done | failed`.
When you change the schema, update the migration, `web/src/lib/types.ts` and the extraction schema together.

## Rules

1. **This repository is PUBLIC.** Never commit secrets or private values: no `.env` files,
   API keys, passwords, tokens, personal emails, or real Supabase project URLs or keys.
   `.env.example` files use placeholders only.
2. **The Claude API key stays on the server.** It goes in `server/.env` as `ANTHROPIC_API_KEY`.
   Never import the Anthropic SDK in `web/` and never expose the key with a `VITE_` prefix.
3. **Keep Row Level Security.** Every table has RLS on, with owner-only policies.
   The server talks to Supabase *as the user* (`supabaseForUser`). Do not use the
   service-role (secret) key unless there is a clear, reviewed reason.
4. **The browser only gets public values:** the Supabase URL and the publishable key.
5. **UI:** use MUI components and the theme (`sx`, `theme.ts`) instead of custom CSS.
   Keep it accessible: labels on inputs, and keyboard-friendly controls.
6. **TypeScript strict** everywhere. Avoid `any`.
7. **Small, focused commits** with clear messages.

## Roadmap

1. ✅ Foundations: web app with login, server, `job_ads` table with RLS
2. Extraction: `POST /api/ads/extract` takes `{ text }` or `{ url }`, fetches and cleans the page
   for a URL, asks Claude for structured JSON, validates it and saves it to `job_ads`
3. Desktop UI: add-ad form, ad detail view, list with filters (work mode, location, tech)
4. Flutter mobile app; extras such as matching ads to the user's skills and application tracking

## Working with the owner

The owner is an experienced frontend developer who is practising English.
Explain in clear, simple English. Prefer showing the path (steps, hints, where to look)
over only handing over finished answers.
