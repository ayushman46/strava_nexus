StrideCircle

A Strava-integrated group challenge application for recreational runners. StrideCircle
pulls run data from Strava, converts activities into a points-based scoring system, organises
runners into invite-only groups with weekly, monthly, and all-time leaderboards, and generates
personalised coaching advice powered by a large language model.


Table of Contents

  1. Project overview
  2. Features
  3. Tech stack
  4. Prerequisites
  5. Installation
  6. Environment configuration
  7. Running locally
  8. Build and deployment
  9. Folder structure
 10. Key modules
 11. Usage guide
 12. Troubleshooting
 13. Contributing
 14. License
 15. Acknowledgements


1. Project overview

StrideCircle connects to a runner's Strava account through OAuth 2.0 and imports their
running activities (Run, TrailRun, VirtualRun) into a Supabase PostgreSQL database. Each
activity receives a calculated score based on distance, pace, and elevation gain. Runners
can create or join groups using a six-character invite code, then view ranked leaderboards
filtered by time range. The AI coach endpoint compares the current seven-day training block
against the previous seven days and returns a structured summary, three actionable
suggestions, a risk warning, and a goal for the next week.

The production deployment target is Vercel. The api/ directory is treated as a set of
serverless functions. A lightweight Express server in server/dev-server.js mirrors all API
routes for local development and is started automatically alongside Vite by the dev script.


2. Features

   Strava OAuth 2.0 login with token exchange and automatic refresh
   Activity sync pulling up to six pages of 50 activities each (last 120 days) per sync
   Run scoring: distance points, pace multiplier, elevation bonus
   Group creation with auto-generated six-character invite codes
   Group leaderboards in weekly, monthly, and all-time views
   Dashboard showing eight stat cards for the last seven days with period-over-period deltas
   Weekly distance bar chart and pace trend line chart spanning 12 rolling weeks
   AI coaching card powered by Groq (llama-3.1-8b-instant) with 24-hour response caching
   Radar comparison chart (currently uses static demo data, wired for future live data)
   Session management using HMAC-SHA-256-signed HTTP-only cookies with a seven-day expiry
   Row-level security policies on all Supabase tables


3. Tech stack

   Component          Technology
   Frontend           React 19, React Router v6, TanStack Query v5, Recharts
   Build tool         Vite 8 with @vitejs/plugin-react
   API layer          Vercel serverless functions (production), Express 4 (local dev)
   Database           Supabase (PostgreSQL)
   Supabase client    @supabase/supabase-js v2 (service role on server, anon key on client)
   External APIs      Strava API v3 (OAuth 2.0, activity:read_all scope)
                      Groq chat completions API (llama-3.1-8b-instant)
   Linting            ESLint 10, eslint-plugin-react-hooks, eslint-plugin-react-refresh
   Node utilities     concurrently (run Vite + API server together), dotenv


4. Prerequisites

   Node.js 20 or later (the project uses ES module syntax throughout)
   npm 10 or later
   A Supabase project (free tier is sufficient)
   A Strava developer application (https://www.strava.com/settings/api)
   A Groq API key (https://console.groq.com)


5. Installation

   Clone the repository and install dependencies:

       git clone https://github.com/ayushman46/StrideCircle.git
       cd StrideCircle
       npm install

   Run the database migrations in your Supabase SQL editor in this exact order:

       1. sql/schema.sql   -- creates all tables and indexes
       2. sql/views.sql    -- creates the three leaderboard views
       3. sql/policies.sql -- enables row-level security and creates access policies

   sql/seed.sql exists but contains only a comment placeholder and can be skipped.


6. Environment configuration

   Create a file named .env.local in the project root (this filename is listed in
   .gitignore and will not be committed). Set all of the following values:

       # Exposed to the Vite frontend bundle (VITE_ prefix required)
       VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
       VITE_SUPABASE_ANON_KEY=<your-supabase-anon-public-key>

       # Server-side only -- never expose these to the browser
       STRAVA_CLIENT_ID=<your-strava-app-client-id>
       STRAVA_CLIENT_SECRET=<your-strava-app-client-secret>
       SUPABASE_URL=https://<your-project-ref>.supabase.co
       SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
       GROQ_API_KEY=<your-groq-api-key>
       SESSION_SECRET=<a-random-string-of-at-least-32-characters>
       APP_BASE_URL=http://localhost:5173

   Variable notes:

   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
       Read by src/lib/supabase.js to create a client-side Supabase instance. These are
       safe to expose because row-level security policies enforce data access.

   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
       Used exclusively by api/_lib/supabase.js on the server. The service role key
       bypasses row-level security, so it must never appear in browser bundles.

   SESSION_SECRET
       Used by api/_lib/session.js to sign and verify the sg_session HTTP-only cookie
       with HMAC-SHA-256. Use a cryptographically random value.

   APP_BASE_URL
       Used when building the Strava OAuth redirect URI. Set to your public domain on
       production (e.g. https://stridecircle.vercel.app).

   Strava developer app setup:
       Create an app at https://www.strava.com/settings/api.
       Set "Authorization Callback Domain" to localhost for local development.
       On Vercel set this to your deployment domain.
       The required OAuth scope is read,activity:read_all (configured in
       api/_lib/strava.js line 14).


7. Running locally

   Start both the Vite development server and the local Express API server with a single
   command:

       npm run dev

   This uses concurrently to run two processes in parallel:
     - node server/dev-server.js  (Express API server on port 8787 by default)
     - vite                       (Vite dev server on port 5173 by default)

   Vite is configured in vite.config.js to proxy all /api/* requests to
   http://localhost:8787, so the frontend and API are reachable from the same origin
   during development.

   The API port can be overridden via the API_PORT environment variable
   (see server/dev-server.js line 4).

   To verify authentication is working, open:
       http://localhost:5173/api/strava-auth

   This redirects to Strava's authorisation page. After authorising, Strava redirects
   back to /api/strava-callback, which sets the session cookie and redirects to
   /dashboard.

   Available npm scripts:

       npm run dev       Start Vite + Express API server concurrently
       npm run build     Compile frontend for production (output to dist/)
       npm run preview   Serve the production build locally for inspection
       npm run lint      Run ESLint across src/ and api/


8. Build and deployment

   Build the frontend:

       npm run build

   Vite outputs to dist/. This directory is committed to .gitignore.

   Vercel deployment:

   Vercel detects the api/ directory automatically and deploys each file as a serverless
   function. No special configuration file is required beyond setting the environment
   variables in the Vercel project dashboard. The build command is npm run build and the
   output directory is dist.

   Before deploying:
     - Set all environment variables listed in section 6 in the Vercel project settings.
     - Update APP_BASE_URL to your Vercel deployment URL.
     - Update the Strava app's "Authorization Callback Domain" to your deployment domain.

   The project has no automated test suite, so there is no test step in the build
   pipeline.


9. Folder structure

   StrideCircle/
   |-- api/                    Serverless API route handlers (one file per route)
   |   |-- _lib/               Shared server-side utilities
   |   |   |-- points.js       Activity scoring logic (server copy)
   |   |   |-- session.js      HMAC cookie sign/verify, cookie parser
   |   |   |-- stats.js        Activity aggregation, trend building, date slicing
   |   |   `-- strava.js       Strava auth URL, token exchange, token refresh, paged fetch
   |   |   `-- supabase.js     Service-role Supabase client factory
   |   |-- activities.js       GET  /api/activities
   |   |-- ai-coach.js         POST /api/ai-coach
   |   |-- create-group.js     POST /api/create-group
   |   |-- groups.js           GET  /api/groups
   |   |-- join-group.js       POST /api/join-group
   |   |-- leaderboard.js      GET  /api/leaderboard
   |   |-- me.js               GET  /api/me
   |   |-- refresh-token.js    POST /api/refresh-token
   |   |-- stats.js            GET  /api/stats
   |   |-- strava-auth.js      GET  /api/strava-auth
   |   |-- strava-callback.js  GET  /api/strava-callback
   |   `-- sync-activities.js  POST /api/sync-activities
   |-- public/                 Static assets (favicon, SVG icon sprite, PNG icon)
   |-- server/
   |   `-- dev-server.js       Express wrapper that mounts all API handlers for local dev
   |-- sql/
   |   |-- schema.sql          Table and index definitions
   |   |-- views.sql           Three leaderboard views (weekly, monthly, all-time)
   |   |-- policies.sql        Row-level security policies
   |   `-- seed.sql            Optional seed data placeholder
   |-- src/
   |   |-- assets/             Build-time images (hero.png)
   |   |-- components/         Reusable React components
   |   |   |-- charts/         Recharts wrappers (DistanceChart, PaceTrendChart, CompareChart)
   |   |   |-- AIAdviceCard.jsx
   |   |   |-- ActivityTable.jsx
   |   |   |-- EmptyState.jsx
   |   |   |-- ErrorState.jsx
   |   |   |-- GroupCard.jsx
   |   |   |-- LeaderboardTable.jsx
   |   |   |-- LoadingSpinner.jsx
   |   |   |-- Navbar.jsx
   |   |   |-- PaceBadge.jsx
   |   |   |-- StatCard.jsx
   |   |   `-- SyncButton.jsx
   |   |-- hooks/              TanStack Query hooks
   |   |   |-- useActivities.js  (useActivities, useSyncActivities)
   |   |   |-- useAuth.js        (useAuth)
   |   |   |-- useGroups.js      (useGroups, useCreateGroup, useJoinGroup)
   |   |   `-- useStats.js       (useStats)
   |   |-- lib/                Client-side utility modules
   |   |   |-- date.js           startOfWeek, startOfMonth helpers
   |   |   |-- points.js         Client-side points calculation (mirrors api/_lib/points.js)
   |   |   |-- supabase.js       Anon-key Supabase client (currently reserved for future use)
   |   |   `-- utils.js          metersToKm, secondsToHms, formatPace, formatPaceDelta, formatDate
   |   |-- pages/
   |   |   |-- ComparePage.jsx   Radar comparison chart (static demo data in current build)
   |   |   |-- Dashboard.jsx     Main authenticated view
   |   |   |-- GroupPage.jsx     Per-group leaderboard with range selector
   |   |   |-- Landing.jsx       Public marketing page
   |   |   |-- Login.jsx         Unauthenticated prompt page
   |   |   `-- ProfilePage.jsx   Placeholder profile page
   |   |-- App.jsx               Route definitions
   |   |-- App.css               Component and page styles
   |   |-- index.css             Global reset and design tokens
   |   `-- main.jsx              React root with QueryClientProvider and BrowserRouter
   |-- eslint.config.js          ESLint flat config (separate rule sets for src/ and api/)
   |-- index.html                Vite HTML entry (mounts #root, loads /src/main.jsx)
   |-- package.json
   |-- vite.config.js
   `-- README.md


10. Key modules

   api/_lib/session.js
       Implements a custom cookie-based session without any third-party session library.
       signSession encodes a JSON payload as base64url and appends an HMAC-SHA-256
       signature. verifySession reverses the process using timing-safe comparison.
       Sessions expire after seven days. The cookie name is sg_session (HttpOnly, Path=/,
       SameSite=Lax).

   api/_lib/points.js
       calculateActivityPoints accepts distance_m, average_speed, and total_elevation_gain
       and returns an object with distance_points, pace_points, elevation_points,
       bonus_points, and total_points.

       Scoring rules (referenced at api/_lib/points.js lines 1-28):
         distance points = (distance_m / 1000) * 10
         pace multiplier applies only when distance >= 2 km:
           pace < 4:30 /km  ->  1.6x
           pace < 5:00 /km  ->  1.4x
           pace < 6:00 /km  ->  1.25x
           pace < 7:00 /km  ->  1.1x
           pace >= 7:00 /km ->  1.0x
         elevation bonus = floor(total_elevation_gain / 20)
         total = round(distance_points * multiplier + elevation_bonus)

       An equivalent implementation exists in src/lib/points.js for any future
       client-side scoring preview.

   api/_lib/stats.js
       summarizeActivities aggregates an array of activity rows into totals and derives
       a distance-weighted average heart rate. buildRollingWeekTrend produces a
       week-by-week array suitable for the Recharts charts.

   api/_lib/strava.js
       buildAuthUrl, exchangeToken, refreshToken, and fetchActivitiesPaged. The paged
       fetch supports after/before Unix epoch parameters and stops when a page returns
       fewer results than requested.

   api/ai-coach.js
       Compares the last seven days against the previous seven days, builds a structured
       summary, hashes it with SHA-256, and checks the ai_coach_reports table for a
       cached report created within the last 24 hours with the same hash. On a cache miss
       it calls the Groq chat completions API with the llama-3.1-8b-instant model at
       temperature 0.4 and stores the result.

   api/leaderboard.js
       Maps the range query parameter (weekly, monthly, all-time) to one of the three
       Supabase views and orders by total_points descending. Appends a rank field and a
       human-readable avg_pace_label field before returning.

   src/hooks/
       All data fetching is centralised in custom hooks built on TanStack Query.
       useActivities and useStats use a 30-second staleTime. useAuth uses 60 seconds.
       Mutations (useSyncActivities, useCreateGroup, useJoinGroup) do not auto-invalidate
       their related queries in the current build.


11. Usage guide

   First-time sign-in:
       Navigate to the landing page or /login and click "Connect Strava". After
       authorising on Strava's website you are redirected to /dashboard. The callback
       handler upserts your profile and stores your tokens in Supabase.

   Syncing activities:
       Click "Sync now" on the dashboard. This posts to /api/sync-activities which
       fetches up to 300 activities from the last 120 days, filters for Run / TrailRun /
       VirtualRun types, upserts them into the activities table, and recalculates scores.

   Creating a group:
       From the dashboard groups panel click "Create group". Post a name and optional
       description to /api/create-group. A six-character invite code is generated. Share
       this code with teammates.

   Joining a group:
       Use /api/join-group with the invite code. The current build does not expose a form
       for this in the UI; it can be invoked directly or via a future UI element.

   Viewing leaderboards:
       Click a group card on the dashboard to go to /groups/:groupId. Use the
       weekly / monthly / all-time buttons to switch between the three leaderboard views.

   AI coaching:
       Click "Refresh advice" on the AI coach card. The card is empty until at least one
       sync has been performed. The cached report persists for 24 hours as long as the
       activity data has not changed.

   Compare page:
       /compare/:groupId renders a radar chart. In the current build this page uses
       hardcoded placeholder data and is intended as a layout preview.

   Profile page:
       /profile renders static placeholder stat cards and is intended for future
       implementation.


12. Troubleshooting

   "Missing Strava environment variables" on redirect to /api/strava-auth
       STRAVA_CLIENT_ID or APP_BASE_URL is not set. Verify .env.local and restart the
       dev server.

   "Missing env vars: ..." after Strava authorises
       One or more of STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, APP_BASE_URL, SUPABASE_URL,
       SUPABASE_SERVICE_ROLE_KEY, or SESSION_SECRET is absent. The callback route lists
       the missing names in the response body (api/strava-callback.js lines 11-22).

   401 from any /api/* route other than strava-auth
       The sg_session cookie is absent or expired, or SESSION_SECRET changed between
       cookie issuance and verification. Clear cookies and sign in again.

   Groups or activities not appearing after sync
       Check that the SQL migrations ran in order (schema, then views, then policies).
       Also confirm SUPABASE_SERVICE_ROLE_KEY is the service role key, not the anon key.

   AI coach returns "Failed to generate AI advice"
       GROQ_API_KEY is missing or invalid. The endpoint logs the raw Groq error to
       console.error before returning 500.

   Strava returns an error on the callback redirect
       The "Authorization Callback Domain" in your Strava app settings does not match the
       host in APP_BASE_URL. For local development this must be set to localhost.

   API proxy not working (404 on /api/* in the browser)
       The Express dev server is not running. Run npm run dev rather than vite directly.
       The Vite proxy target is http://localhost:8787 (vite.config.js lines 8-11).

   ESLint reports errors
       Run npm run lint. The eslint.config.js applies separate rule sets to src/ and api/
       (browser globals for src/, Node globals for api/).


13. Contributing

   1. Fork the repository and create a feature branch from the default branch.
   2. Follow the existing code style. Run npm run lint before committing and fix all
      reported issues.
   3. Keep API handlers stateless and self-contained. Session verification and
      environment-variable checks follow the pattern established in existing handlers.
   4. Database changes require corresponding updates to sql/schema.sql, sql/views.sql,
      and sql/policies.sql. Do not commit migration scripts that alter existing columns
      without a documented upgrade path.
   5. There is currently no automated test suite. Manual verification against a local
      Supabase instance and a Strava developer app is the expected workflow.
   6. Open a pull request with a description of the change and the motivation.


14. License

   No license file is present in the repository. All rights are reserved by the author
   unless a license is added.


15. Acknowledgements

   Strava (https://www.strava.com) for the activity and athlete data API.
   Supabase (https://supabase.com) for the hosted PostgreSQL database and client library.
   Groq (https://groq.com) for the low-latency LLM inference API.
   Recharts (https://recharts.org) for the SVG charting components.
   TanStack Query (https://tanstack.com/query) for server-state management in React.
   Vite (https://vitejs.dev) for the frontend build tooling.
