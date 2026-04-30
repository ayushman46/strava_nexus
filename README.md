\StrideCircle: Strava Group Challenge and AI Run Coach
Version date: 2026-04-30
StrideCircle is a Strava-based group challenge application featuring leaderboards, run scoring, and AI-driven coaching. The technology stack is designed to be free-tier friendly, utilizing React and Vite on Vercel, Supabase for data, authentication, and Row Level Security (RLS), the Strava API for activity tracking, and Groq for generating fast coaching summaries.
Repository Contents
•	Frontend: Vite and React components located in the src/ directory.
•	Serverless API Routes: Vercel-compatible endpoints located in the api/ directory.
•	Database Assets: SQL schema, views, and policies located in the sql/ directory.
Architecture Overview
The application follows a streamlined data flow:
	1.	React (Vite) frontend communicates with Vercel API routes.
	2.	Vercel API routes interface with Supabase (PostgreSQL), the Strava API, and the Groq API.
Sensitive credentials remain server-side within Vercel environment variables. The frontend application only has access to keys explicitly prefixed with VITE_.
Environment Variables
Create a .env.local file with the following placeholders. You will need to populate these with your real secret keys in your Vercel project settings prior to deployment:
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
SESSION_SECRET=
APP_BASE_URL=http://localhost:5173

Database Configuration (Supabase)
To set up the backend data layer:
	1.	Create a new Supabase project and locate your project URL and keys.
	2.	Execute the following SQL files in the Supabase SQL editor in this specific sequence:
•	sql/schema.sql
•	sql/views.sql
•	sql/policies.sql
	3.	Configure your environment variables in .env.local with the details from your new project:

	4.	Restart your local development server (npm run dev) to ensure the API server registers the new environment variables.
Database Structure
Tables Created:
•	profiles
•	groups
•	group_members
•	activities
•	activity_scores
•	strava_tokens
•	ai_coach_reports
Views Created:
•	group_leaderboard_weekly
•	group_leaderboard_monthly
•	group_leaderboard_all_time
Important Notes:
•	The SUPABASE_SERVICE_ROLE_KEY is strictly used by the backend API routes to bypass RLS when necessary. It must never be exposed to the frontend.
•	In this MVP, the frontend does not query Supabase directly; all data requests are routed through the /api endpoints.
Strava OAuth Setup
	1.	Create a developer application within your Strava account.
	2.	Set the Authorization Callback Domain to: https://your-vercel-domain.vercel.app/api/strava-callback
	3.	Store your Strava Client ID and Client Secret securely in your Vercel environment variables.
Core API Routes
Route	Method	Purpose
/api/strava-auth	GET	Redirect the user to the Strava OAuth portal
/api/strava-callback	GET	Exchange auth code, save tokens, and initialize a session
/api/me	GET	Return details for the currently logged-in user
/api/sync-activities	POST	Fetch and calculate scores for recent runs
/api/activities	GET	Retrieve recent runs to populate the dashboard
/api/create-group	POST	Create a new group and generate a shareable invite code
/api/join-group	POST	Authenticate and join an existing group using an invite code
/api/groups	GET	List all groups associated with the current user
/api/leaderboard	GET	Fetch rankings filtered by weekly, monthly, or all-time ranges
/api/ai-coach	POST	Generate and cache a personalized AI coaching summary
/api/refresh-token	POST	Refresh an expired Strava access token
Points and Pace Logic
Scores are calculated using the following metrics:
•	Distance points: Calculated as distance_km * 10.
•	Pace multiplier: A bonus applied to the score, provided the total distance is 2 kilometers or greater.
•	Elevation bonus: Calculated as floor(elevation_gain / 20).
Calculation Formula:
$$\text{total} = \text{round}((\text{distanceKm} * 10 * \text{multiplier}) + \text{elevationBonus})$$
Reference: See src/lib/points.js and api/_lib/points.js for exact code implementation.
Local Development
To install the necessary dependencies and initialize both the Vite and local API servers, run the following commands in your terminal:
npm install
npm run dev

This will spin up two parallel servers:
•	The Vite frontend running on http://localhost:5173
•	The local API server running on http://localhost:8787 (which is proxied internally via /api)
To test the authentication flow, navigate to /api/strava-auth in your browser. You should be redirected to Strava automatically. If you receive an environment error, double-check that your keys are correctly placed in the .env.local file.
MVP Status Checklist
Completed Features:
•	Strava OAuth flow integration
•	Activity synchronization and custom scoring logic
•	Group creation and joining functionality
•	Dynamic leaderboards filtered by date ranges
•	AI coaching integration with response caching
•	Frontend user dashboard interface
Next Steps
•	Implement group administrator tools (e.g., the ability to regenerate invite codes or remove specific members).
•	Establish cron-based background activity synchronization using Vercel Cron Jobs.
•	Integrate push notifications and visual achievement badges.
•	Improve error handling and user feedback across the frontend application.
Built for free-tier hosting and rapid iteration. Ensure all local placeholder values are updated with production credentials before deploying to Vercel.