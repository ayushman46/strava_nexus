import { buildAuthUrl } from './_lib/strava.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const url = buildAuthUrl()
    res.writeHead(302, { Location: url })
    res.end()
  } catch (error) {
    res.status(500).json({ error: 'Missing Strava environment variables' })
  }
}
