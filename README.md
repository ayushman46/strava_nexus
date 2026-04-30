# StrideCircle — Strava Group Challenge + AI Run Coach

Version date: 2026-04-30

StrideCircle is a Strava-based group challenge app with leaderboards, run scoring, and AI coaching. The stack stays free-tier friendly: React + Vite on Vercel, Supabase for data/auth/RLS, Strava API for activities, and Groq for fast coaching summaries.

## ✅ What’s in this repo

- **Frontend** (Vite + React) in `src/`
- **Serverless API routes** in `api/` (Vercel-compatible)
- **SQL schema + views + policies** in `sql/`

## Architecture overview

```
React (Vite) → Vercel API routes → Supabase (Postgres)
								  ↘ Strava API
								  ↘ Groq API
```

Secrets stay server-side in Vercel environment variables. The frontend only uses `VITE_` keys.

## 🔐 Environment variables

Create `.env.local` with the following values (use real secrets in Vercel later):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
SESSION_SECRET=
APP_BASE_URL=http://localhost:5173
```

## 🗄️ Database setup (Supabase)

1. Create a Supabase project
2. Run the SQL files in order:
	- `sql/schema.sql`
	- `sql/views.sql`
	- `sql/policies.sql`

Tables created:
- `profiles`
- `groups`
- `group_members`
- `activities`
- `activity_scores`
- `strava_tokens`
- `ai_coach_reports`

Views created:
- `group_leaderboard_weekly`
- `group_leaderboard_monthly`
- `group_leaderboard_all_time`

## 🔑 Strava OAuth setup

1. Create a Strava developer app
2. Set callback URL to:

```
https://your-vercel-domain.vercel.app/api/strava-callback
```

3. Store client ID + secret in Vercel env vars

## ✨ Core API routes

| Route | Method | Purpose |
|------|--------|---------|
| `/api/strava-auth` | GET | Redirect to Strava OAuth |
| `/api/strava-callback` | GET | Exchange code, save tokens, create session |
| `/api/me` | GET | Return logged-in user |
| `/api/sync-activities` | POST | Fetch + score recent runs |
| `/api/activities` | GET | Recent runs for dashboard |
| `/api/create-group` | POST | Create group + invite code |
| `/api/join-group` | POST | Join group by invite code |
| `/api/groups` | GET | Groups for current user |
| `/api/leaderboard` | GET | Weekly/monthly/all-time rankings |
| `/api/ai-coach` | POST | AI coaching summary (cached) |
| `/api/refresh-token` | POST | Refresh Strava token |

## 🧮 Points & pace logic

- **Distance points**: `distance_km * 10`
- **Pace multiplier** applied if distance ≥ 2 km
- **Elevation bonus**: `floor(elevation_gain / 20)`

Formula:

$$
	ext{total} = \text{round}((\text{distanceKm} * 10 * \text{multiplier}) + \text{elevationBonus})
$$

See: `src/lib/points.js` and `api/_lib/points.js`.

## 🧪 Local development

Install dependencies and run Vite + local API server:

```bash
npm install
npm run dev
```

This starts two servers:
- Vite on `http://localhost:5173`
- Local API server on `http://localhost:8787` (proxied via `/api`)

If you hit `/api/strava-auth` in the browser, you should now see a redirect to Strava (or a clear env error if keys are missing).

## 🔌 Database connection (Supabase)

1. **Create a Supabase project** → grab the project URL + keys.
2. **Run the SQL** in the Supabase SQL editor in this order:
	- `sql/schema.sql`
	- `sql/views.sql`
	- `sql/policies.sql`
3. **Set env vars** in `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Restart `npm run dev`** so the API server can read env vars.

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` is used only by API routes (never expose it in the frontend).
- The frontend doesn't query Supabase directly in this MVP; it talks to `/api` routes.

## ✅ MVP status checklist

- [x] Strava OAuth flow wired
- [x] Activity sync + scoring
- [x] Group creation / join
- [x] Leaderboards by range
- [x] AI coaching + caching
- [x] Frontend dashboard shell

## Next steps

- Add group admin tools (regenerate invite, remove member)
- Cron-based sync (Vercel cron)
- Notifications + badges
- Better error handling on frontend

---

Built for free-tier hosting and fast iteration. Replace placeholder values and deploy to Vercel to go live.
