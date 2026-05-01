# StrideCircle: Complete Codebase Walkthrough

This document serves as an exhaustive, deep-dive technical manual for the StrideCircle application. It breaks down the architecture, data flow, external API integrations, and the specific responsibilities of every major file in the repository.

---

## 1. Application Architecture

StrideCircle is built as a **decoupled monolith** using Vite and React for the frontend, and Node.js Serverless Functions for the backend. 

* **Frontend:** A React Single Page Application (SPA). React Router handles client-side navigation. TanStack Query manages data fetching and caching.
* **Backend:** Serverless JavaScript functions located in the `api/` directory. Vercel naturally hosts these. Locally, we simulate Vercel using an Express server (`server/dev-server.js`).
* **Database:** Supabase (PostgreSQL). We use Row Level Security (RLS) policies to ensure data is secure. The frontend uses an "Anon Key", while the backend uses a "Service Role Key" to bypass RLS securely.

---

## 2. Directory Structure Deep Dive

### `/src` (The React Frontend)
This directory contains everything that runs in the user's web browser.

#### `src/pages/`
These are the top-level views mapped to routes in `App.jsx`.
* **`Login.jsx` & `Landing.jsx`:** Unauthenticated marketing and login pages. The "Connect with Strava" button directly links to `/api/strava`, kicking off the OAuth flow.
* **`Dashboard.jsx`:** The main authenticated view. It fetches the user's synced activities, displays top-level statistics, renders the interactive `MonthCalendar`, and houses the AI Coaching component.
* **`ProfilePage.jsx`:** Queries the Supabase `profiles` table to show lifetime running statistics.

#### `src/components/`
Reusable UI building blocks.
* **`MonthCalendar.jsx`:** A highly customized, glassmorphic calendar. When a user clicks a day, it calculates the "end of that week" (Sunday) and filters the dashboard to show only runs from that specific 7-day window.
* **`ActivityTable.jsx`:** Renders the list of fetched runs. It dynamically displays True Elapsed Time and calculated Points.
* **`AIAdviceCard.jsx`:** Contains the UI for displaying the Groq-generated LLM coaching feedback.
* **`RunDNAModal.jsx`:** Fetches minute-by-minute Strava telemetry (heart rate, pace) via `useActivityInsights.js` to calculate pace stability and heart-rate drift.

#### `src/hooks/`
We use TanStack Query (React Query) to manage API requests. These hooks handle loading states, error handling, and caching automatically.
* **`useActivities.js`:** Contains `useActivities` (fetches from `/api/activities`) and `useSyncActivities` (triggers a POST to sync new Strava data).
* **`useStats.js`:** Fetches aggregated timeline data for the Recharts graphs.
* **`useAuth.js`:** Checks `/api/user` to verify if the user's secure cookie is valid.

#### `src/lib/`
* **`utils.js`:** Pure helper functions for formatting dates, converting meters to kilometers, and calculating minutes-per-kilometer pace.

---

### `/api` (The Serverless Backend)
Every JavaScript file in the root of this folder becomes an independent API endpoint in production.

#### Endpoint Files
* **`strava.js`:** Handles the entire OAuth flow. `GET /api/strava` generates the Strava redirect URL. `GET /api/strava?action=callback` catches the Strava callback, exchanges the temporary code for access tokens, upserts the user into the Supabase database, creates an encrypted Session Cookie, and redirects to `/dashboard`.
* **`user.js`:** `GET /api/user` validates the session cookie. If valid, it fetches the user's profile and lifetime aggregated stats from Supabase.
* **`activities.js`:** 
  * `GET /api/activities`: Fetches the user's parsed runs from the database.
  * `POST /api/activities?action=sync`: Fetches the raw activity data from the Strava API using the user's access token, runs them through the Points Calculator, and upserts them into the database.
* **`ai.js`:** Contains two endpoints powered by Groq's Llama 3 API:
  * `POST /api/ai`: Compares the user's current 7-day rolling window against the previous 7 days and asks the LLM to generate targeted coaching advice. It securely caches the output in the database for 24 hours to save API costs.
  * `POST /api/ai?action=compare`: Takes an array of specific Activity IDs, pulls their data, and asks the LLM to generate a head-to-head comparison summary.

#### `api/_lib/` (Backend Helpers)
Folders prefixed with an underscore `_` are completely ignored by Vercel's router. This is where we safely put shared backend code.
* **`session.js`:** Generates and verifies HMAC-SHA-256 signed JSON Web Tokens stored securely in HTTP-only cookies.
* **`points.js`:** The proprietary algorithm that converts distance, elevation, and pace into the application's competitive scoring metric.
* **`strava.js`:** Helper functions to perform token exchanges and pagination against the Strava API.

---

### `/sql` (Database Migrations)
The raw SQL commands used to generate the Supabase database.
* **`schema.sql`:** Creates the `profiles`, `strava_tokens`, `activities`, and `ai_coach_reports` tables.
* **`views.sql`:** Contains complex SQL logic to dynamically aggregate user points into Weekly, Monthly, and All-Time leaderboards without duplicating data.

---

## 3. The Core Data Flows

### A. The Authentication Flow
1. User clicks "Connect with Strava".
2. Browser hits `/api/strava`.
3. Backend redirects to `https://www.strava.com/oauth/authorize`.
4. User logs in to Strava and approves the app.
5. Strava redirects back to `/api/strava?action=callback&code=xyz`.
6. Backend takes `xyz` and POSTs it to Strava's `oauth/token` endpoint.
7. Strava returns an `access_token` and `refresh_token`.
8. Backend saves tokens to Supabase `strava_tokens` table.
9. Backend creates an encrypted HTTP-only cookie to identify the user.
10. Backend redirects the user to `/dashboard`.

### B. The Synchronization Flow
1. User clicks "Sync Now" on the Dashboard.
2. Frontend calls `useSyncActivities` which POSTs to `/api/activities?action=sync`.
3. Backend looks up the user's `access_token`.
4. Backend fetches paginated lists of activities from Strava's API.
5. Backend filters for running activities (Run, TrailRun).
6. Backend calculates Points for every run using `api/_lib/points.js`.
7. Backend performs an `UPSERT` into the Supabase `activities` table.
8. Frontend detects the sync finished and automatically re-fetches the Dashboard charts!

### C. The AI Coaching Flow
1. User clicks "Refresh advice".
2. Backend `/api/ai` grabs the user's runs from Supabase.
3. It slices the runs into two arrays: `last 7 days` and `previous 7 days`.
4. It compiles a "Summary JSON" comparing the total distances, pace, and elevation of the two periods.
5. It generates a SHA-256 hash of this Summary JSON.
6. It checks the `ai_coach_reports` table. If an entry with this exact hash was created in the last 24 hours, it returns the cached response instantly.
7. If no cached response exists, it sends the Summary JSON to the Groq API (Llama 3).
8. Groq returns the coach text. Backend saves it to the database, then sends it to the frontend.

---

## 4. Local Development vs. Production

### Local Development (`npm run dev`)
When you run `npm run dev`, you are using `concurrently` to run two completely separate servers side-by-side:
1. **Vite Server (`localhost:5173`)**: Compiles React and serves your frontend.
2. **Express Server (`localhost:8787`)**: Hosted in `server/dev-server.js`. This script manually reads every file in your `api/` directory and creates local Express routes for them to simulate Vercel's serverless environment.

To prevent CORS errors, the Vite Server is configured (`vite.config.js`) to seamlessly proxy any request starting with `/api` over to the Express Server at port 8787.

### Production (Vercel)
When deployed to Vercel, the Express server is completely thrown away. 
1. Vercel automatically builds the frontend using `vite build` and serves the static HTML/JS files from its global Edge Network.
2. Vercel automatically packages every `.js` file in the `/api` directory into isolated AWS Lambda functions. 
3. **`vercel.json`**: This file is critical in production. It tells Vercel that if a user visits a deep link (like `/dashboard`), Vercel shouldn't throw a 404 error looking for `dashboard.html`. Instead, it rewrites the request to serve `index.html`, allowing React Router to take over and render the correct page.
