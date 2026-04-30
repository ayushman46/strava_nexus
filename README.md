# StrideCircle

A Strava-integrated analytics dashboard and group challenge application built for recreational and competitive runners. StrideCircle directly synchronises with your Strava account to pull activity data, parse performance metrics, calculate proprietary scores based on effort and elevation, and provide hyper-personalised coaching feedback via Groq-powered AI inference. 

With a premium glassmorphic interface, detailed performance telemetry, and rolling-week statistical comparisons, StrideCircle elevates the raw data of your training log into actionable, aesthetic insights.

## Table of Contents
1. Project Overview
2. Core Features
3. Technology Stack
4. Architecture & Data Flow
5. Installation & Setup
6. Environment Configuration
7. Local Development Workflow
8. Deployment Guide
9. Acknowledgements

## 1. Project Overview
StrideCircle acts as a dynamic layer over standard Strava activity tracking. By connecting through OAuth 2.0, it securely downloads running activities (Run, TrailRun, VirtualRun) directly into a Supabase PostgreSQL instance. Once synced, a custom scoring engine recalculates your runs to reward not just speed, but distance, elevation, and consistency. 

Runners can create or join exclusive groups via six-character invite codes, fostering competition on weekly, monthly, and all-time leaderboards. Additionally, the application integrates an AI coaching endpoint that cross-references your current seven-day training volume with the prior week, returning a structured breakdown of your strengths, potential injury risks, and forward-looking goals.

## 2. Core Features
* **Strava OAuth 2.0 Integration:** Secure login flow with automatic token exchange and refresh cycling.
* **Intelligent Activity Sync:** Pulls historical run data with logic that adapts to fetch both recent updates and entire lifetime backlogs.
* **Proprietary Run Scoring:** Awards points using a multi-variable algorithm considering total distance, pace multipliers, and elevation gain bonuses.
* **Dynamic Time Processing:** Fully parses and displays true elapsed time alongside moving time for a more realistic view of total workout duration.
* **Interactive Data Visualization:** Features a premium month-calendar widget that locks dashboard stats to specific weekly blocks, alongside Recharts-powered bar and trend line charts.
* **AI Coaching Engine:** Integrates the Llama 3.1 8B model via the Groq API to generate contextual, 24-hour cached coaching reports based strictly on your rolling performance deltas.
* **Head-to-Head Comparison:** Allows users to select multiple specific runs and compare them side-by-side on a dedicated view, complete with AI-generated run specific feedback.
* **Enterprise-grade Security:** Sessions are managed using HMAC-SHA-256-signed HTTP-only cookies, combined with strict Row-Level Security (RLS) policies on the Supabase backend.

## 3. Technology Stack

| Component | Technology |
| --- | --- |
| Frontend Framework | React 19, React Router v6 |
| State Management | TanStack Query v5 |
| Build Tooling | Vite 8 |
| Styling | Custom CSS (Glassmorphism, CSS Variables) |
| API Layer | Express (Local Dev), Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| External Services | Strava API v3, Groq API (LLM Inference) |
| Data Visualization | Recharts |

## 4. Architecture & Data Flow
The application follows a decoupled client-server architecture disguised as a monolith for ease of deployment. 

The frontend (`/src`) is a Single Page Application that handles all routing and state. The backend (`/api`) consists of isolated JavaScript files engineered to be deployed individually as serverless functions on Vercel. During local development, `server/dev-server.js` wraps these functions in an Express server to simulate the production environment perfectly.

All database interactions flow exclusively through the backend functions using the Supabase service-role key, ensuring that the frontend never has direct access to raw database tables or third-party API secrets.

## 5. Installation & Setup

**Prerequisites:**
* Node.js 20 or later
* npm 10 or later
* A Supabase project
* A Strava Developer Application
* A Groq API key

**Clone and Install:**
```bash
git clone https://github.com/ayushman46/StrideCircle.git
cd StrideCircle
npm install
```

**Database Migrations:**
Execute the following SQL scripts in your Supabase SQL editor in order:
1. `sql/schema.sql` (Creates tables and indexes)
2. `sql/views.sql` (Creates leaderboard aggregation views)
3. `sql/policies.sql` (Enables and configures RLS access control)

## 6. Environment Configuration
Create a `.env.local` file in the project root. This file is ignored by Git.

```env
# Frontend Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend Variables (Never expose to browser)
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
SESSION_SECRET=a-secure-random-string-min-32-chars
APP_BASE_URL=http://localhost:5173
```

**Strava Setup Note:**
In your Strava API settings, set the "Authorization Callback Domain" to `localhost` for local development. When deploying to production, this must be updated to match your live domain.

## 7. Local Development Workflow
Start the development environment using the concurrent dev script:

```bash
npm run dev
```

This command launches:
1. The Express API server on port 8787
2. The Vite frontend dev server on port 5173

Vite automatically proxies all `/api/*` network requests to the local Express server, bypassing CORS issues and mirroring the exact behavior of the Vercel production edge network.

## 8. Deployment Guide
StrideCircle is configured for zero-config deployment on Vercel.

1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Add all environment variables from your `.env.local` into the Vercel Project Settings.
4. Update `APP_BASE_URL` to your new `something.vercel.app` domain.
5. Update your Strava API "Authorization Callback Domain" to the new Vercel domain.
6. Deploy.

Vercel will automatically detect the `/api` directory and map them to serverless functions, while building the `/src` directory as a static frontend bundle.

## 9. Acknowledgements
* Strava API for unparalleled activity telemetry.
* Supabase for reliable, performant Postgres hosting.
* Groq for ultra-low latency LLM inference.
* Recharts for seamless React data visualization.