# Klarro

Paste a job ad (text or link) and get the key facts: location, work mode, contract type, benefits and technical requirements.

| Folder | What it is |
|---|---|
| `web/` | Desktop web app: React + Vite + Material UI + TypeScript |
| `server/` | Node.js API (Express). Talks to Claude in step 2. |
| `supabase/migrations/` | Database schema (already applied to the Supabase project "JobApp") |
| `mobile/` | Later: Flutter app |

## Run it locally

You need Node.js 22 or newer.

```bash
# 1. Web app  → http://localhost:5173
cd web
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm install
npm run dev

# 2. Server   → http://localhost:3001/health
cd server
cp .env.example .env         # then fill in the values
npm install
npm run dev
```

## How the pieces talk

```
Browser (React) ──login, read own ads──▶ Supabase (Auth + Postgres with RLS)
      │
      └──"extract this ad" + user token──▶ Node server ──▶ Claude API
                                               └──save result──▶ Supabase
```

- The Supabase **publishable key** is public by design. The data is protected by Row Level Security: each user sees only their own rows.
- The **Claude API key** is secret. It lives only in `server/.env` and never in the web app.

## Roadmap

1. ✅ Foundations: repo, Supabase project, login, `job_ads` table
2. Extraction with Claude (`POST /api/ads/extract`)
3. Desktop UI: add-ad form, detail view, list with filters
4. Flutter mobile app on the same backend
