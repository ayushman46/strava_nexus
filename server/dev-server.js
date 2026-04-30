import 'dotenv/config'
import express from 'express'
import stravaAuth from '../api/strava-auth.js'
import stravaCallback from '../api/strava-callback.js'
import syncActivities from '../api/sync-activities.js'
import refreshToken from '../api/refresh-token.js'
import me from '../api/me.js'
import activities from '../api/activities.js'
import stats from '../api/stats.js'
import createGroup from '../api/create-group.js'
import joinGroup from '../api/join-group.js'
import groups from '../api/groups.js'
import leaderboard from '../api/leaderboard.js'
import aiCoach from '../api/ai-coach.js'

const app = express()
const port = process.env.API_PORT || 8787

app.use(express.json())

app.get('/api/strava-auth', (req, res) => stravaAuth(req, res))
app.get('/api/strava-callback', (req, res) => stravaCallback(req, res))
app.get('/api/me', (req, res) => me(req, res))
app.get('/api/activities', (req, res) => activities(req, res))
app.get('/api/stats', (req, res) => stats(req, res))
app.get('/api/groups', (req, res) => groups(req, res))
app.get('/api/leaderboard', (req, res) => leaderboard(req, res))

app.post('/api/sync-activities', (req, res) => syncActivities(req, res))
app.post('/api/refresh-token', (req, res) => refreshToken(req, res))
app.post('/api/create-group', (req, res) => createGroup(req, res))
app.post('/api/join-group', (req, res) => joinGroup(req, res))
app.post('/api/ai-coach', (req, res) => aiCoach(req, res))

app.listen(port, () => {
  console.log(`API dev server running on http://localhost:${port}`)
})
