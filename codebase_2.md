#  StrideCircle: A Beginner's Guide to the Codebase

Welcome to StrideCircle! If this is your first time looking at a full-stack web application, it can feel a bit overwhelming. This guide is written specifically for you. It breaks down exactly how this app was built, how the different pieces talk to each other, and where to find everything.

---

## 1. How This App Was Created (The Foundation)

This app is a **Single Page Application (SPA)** built with **React**. To set up the initial folder structure and build tools, we used **Vite** (a modern, lightning-fast alternative to older tools like Create-React-App).

If you were starting this from scratch, the very first command you would have run in your terminal is:
```bash
npm create vite@latest temp-app -- --template react
```
This generates the `src` folder, the `package.json` file (which lists all our dependencies like `react` and `recharts`), and the `vite.config.js` file.

---

## 2. The Tech Stack (What We Are Using)

A "Tech Stack" is just the combination of technologies used to build an app. Here is ours:

* **Frontend (What the user sees):** React.js. We use it to build reusable UI pieces (like Buttons and Charts).
* **Styling:** Plain CSS (`index.css`) utilizing modern CSS variables and glassmorphism (translucency and blur effects) to make it look premium.
* **Backend (The server logic):** Node.js. We use "Serverless Functions" hosted on Vercel.
* **Database:** Supabase (a fantastic, easy-to-use alternative to setting up a complex Postgres database from scratch).
* **External APIs:** 
  * **Strava API:** To fetch the user's running data.
  * **Groq API:** To generate the AI coaching advice using the Llama 3 LLM.

---

## 3. Understanding the Folder Structure

The magic of this codebase is that it contains **both** the Frontend and the Backend in one repository. 

### `src/` (The Frontend)
Everything inside `src` runs in the user's web browser. 
* **`App.jsx` & `main.jsx`:** The entry points. This is where React mounts to the HTML and defines the different web pages (routes).
* **`pages/`:** The main screens of the app (e.g., `Login.jsx`, `Dashboard.jsx`, `Landing.jsx`).
* **`components/`:** Smaller, reusable building blocks (e.g., `ActivityTable.jsx`, `Navbar.jsx`, `MonthCalendar.jsx`).
* **`hooks/`:** We use a library called "TanStack Query" to fetch data from our backend. Files like `useActivities.js` handle asking the server for data and remembering (caching) it so the app feels fast.
* **`index.css`:** The global stylesheet containing all the beautiful colors, fonts, and layout rules.

### `api/` (The Backend)
Everything inside `api` runs on a secure server (Vercel's edge network). The browser *never* sees this code. This is crucial for security because this folder holds our secret passwords (API keys).
* **Serverless Functions:** Every `.js` file in here (like `activities.js` or `ai.js`) automatically becomes a backend "endpoint" (e.g., visiting `/api/activities` runs the `activities.js` file).
* **`_lib/`:** Folders starting with an underscore are ignored by Vercel's routing. We use this folder to store shared helper logic, like how to calculate points (`points.js`) or how to connect to the database (`supabase.js`).

### `server/` (Local Testing)
Because Vercel automatically turns the `api/` folder into a backend in production, we need a way to simulate that on our own computer. `server/dev-server.js` is a tiny "Express" server that mimics Vercel so we can test everything locally.

---

## 4. How the Flow Works (A Real Example)

Let's trace what happens when a user clicks **"Connect with Strava"**:

1. **The Click:** The user clicks the button in `src/pages/Login.jsx` which links to `/api/strava`.
2. **The Backend Auth Route:** The serverless function `api/strava.js` catches this request. It generates a secure Strava login URL and redirects the user's browser to Strava.com.
3. **User Grants Permission:** The user clicks "Authorize" on Strava.
4. **The Callback:** Strava redirects the user back to our app, specifically to `/api/strava?action=callback`, carrying a temporary secret "code".
5. **Token Exchange:** `api/strava.js` takes that "code", securely asks Strava for an "Access Token", and saves it in our Supabase database.
6. **Logging In:** The backend creates an encrypted "Cookie" to remember who the user is, and redirects them to the `/dashboard`.
7. **Fetching Data:** Once on the Dashboard, the frontend's `useActivities` hook asks the backend (`/api/activities`) for the user's runs. The backend uses the saved Strava token, fetches the runs, saves them to the database, calculates the scores, and sends them back to the frontend to display!

---

## 5. How to Run the App Yourself

If you want to spin up this code and see it work:

1. **Open your Terminal** and make sure you are in the project folder (`temp-app`).
2. **Install Dependencies:** Run `npm install` to download all the required libraries.
3. **Set up Environment Variables:** You need a `.env.local` file containing your secret keys for Strava, Supabase, and Groq. (These are never shared or uploaded to GitHub).
4. **Start the Development Server:** Run `npm run dev`.
5. Behind the scenes, this command runs both Vite (for the frontend) and Express (for the backend) simultaneously.
6. Open your browser to `http://localhost:5173`.

---

## Final Thoughts for a Beginner

Building a full-stack app is like building a restaurant. 
* **The Frontend (`src/`)** is the dining room and the menu. It's what the customer interacts with. It needs to look good and be easy to use.
* **The Backend (`api/`)** is the kitchen. It's secure, customers aren't allowed inside, and it handles the heavy lifting (talking to the database, crunching AI logic).
* **The Database (Supabase)** is the pantry where all the ingredients (data) are stored.

Take it one file at a time. Start by looking at `Dashboard.jsx` to see how the UI is laid out, then look at `api/activities.js` to see how the data actually gets fetched. You've got this!
