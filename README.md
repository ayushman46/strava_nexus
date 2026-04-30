StrideCircle Strava Group Challenge and AI Run Coach
Version date 2026 04 30

Overview
StrideCircle is a Strava based group challenge application with leaderboards, run scoring, and AI coaching. The stack uses React and Vite on Vercel, Supabase for data and authentication, the Strava API for activity tracking, and Groq for coaching summaries.

Repository contents
Frontend is in the src directory.
Serverless API routes are in the api directory.
Database SQL assets are in the sql directory.

Architecture overview
The React frontend calls Vercel API routes.
API routes talk to Supabase, Strava, and Groq.
Secrets stay server side and only keys with the VITE prefix are exposed to the frontend.

Environment variables
Create a file named .env.local and set the following values.
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
SESSION_SECRET=
APP_BASE_URL=http://localhost:5173

Database configuration
Create a Supabase project and run the SQL files in this order using the Supabase SQL editor.
sql schema sql
sql views sql
sql policies sql

Database structure
Tables include profiles, groups, group members, activities, activity scores, strava tokens, and ai coach reports.
Views include group leaderboard weekly, monthly, and all time.

Important notes
SUPABASE_SERVICE_ROLE_KEY is used only by backend routes and must not be exposed to the frontend.
The frontend reads data through the api routes and does not query Supabase directly in this MVP.

Strava OAuth setup
Create a Strava developer app.
Set the authorization callback domain to localhost for local development.
Store the Strava client id and client secret in your environment variables.

Core API routes
strava auth for redirecting to Strava
strava callback for token exchange and session creation
me for current user profile
sync activities for pulling and scoring runs
activities for recent runs
create group and join group for group flows
groups for group list
leaderboard for rankings
ai coach for AI coaching summaries
refresh token for Strava refresh

Points and pace logic
Distance points are distance in km times 10.
Pace multiplier applies only when distance is at least 2 km.
Elevation bonus is floor of elevation gain divided by 20.
See src lib points js and api lib points js for the implementation.

Local development
Install dependencies and start the frontend and API server.
npm install
npm run dev

The frontend runs on http://localhost:5173 and the local API server runs on http://localhost:8787 with the api proxy.
To test authentication visit http://localhost:5173/api/strava-auth.

MVP status
Strava OAuth flow
Activity sync and scoring
Group creation and joining
Leaderboards by date range
AI coaching with caching
Dashboard UI

Next steps
Add group admin tools.
Add cron based sync.
Add notifications and badges.
Improve frontend error handling.