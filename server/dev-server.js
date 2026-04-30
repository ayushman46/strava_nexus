import 'dotenv/config'
import express from 'express'
import strava from '../api/strava.js'
import user from '../api/user.js'
import activities from '../api/activities.js'
import groups from '../api/groups.js'
import ai from '../api/ai.js'

const app = express()
const port = process.env.API_PORT || 8787

app.use(express.json())

app.all('/api/strava', (req, res) => strava(req, res))
app.all('/api/user', (req, res) => user(req, res))
app.all('/api/activities', (req, res) => activities(req, res))
app.all('/api/groups', (req, res) => groups(req, res))
app.all('/api/ai', (req, res) => ai(req, res))

app.listen(port, () => {
  console.log(`API dev server running on http://localhost:${port}`)
})
