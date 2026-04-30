import { getSupabaseAdmin } from './_lib/supabase.js'
import { buildSessionCookie, parseCookies, verifySession, getCookieName } from './_lib/session.js'
import { buildAuthUrl, exchangeToken, refreshToken } from './_lib/strava.js'

const handleAuthUrl = (req, res) => {
  try {
    const url = buildAuthUrl()
    res.writeHead(302, { Location: url })
    res.end()
  } catch {
    return res.status(500).json({ error: 'Missing Strava environment variables' })
  }
}

const handleCallback = async (req, res) => {
  const requiredEnv = [
    'STRAVA_CLIENT_ID',
    'STRAVA_CLIENT_SECRET',
    'APP_BASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SESSION_SECRET',
  ]
  const missing = requiredEnv.filter((key) => !process.env[key])
  if (missing.length) {
    return res.status(500).send(`Missing env vars: ${missing.join(', ')}`)
  }

  const { code, error } = req.query
  if (error) {
    return res.status(400).send('Strava authorization was denied.')
  }

  if (!code) {
    return res.status(400).send('Missing Strava code.')
  }

  try {
    const tokenPayload = await exchangeToken(code)
    const athlete = tokenPayload.athlete
    const supabase = getSupabaseAdmin()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          strava_athlete_id: athlete.id,
          full_name: `${athlete.firstname} ${athlete.lastname}`.trim(),
          username: athlete.username,
          avatar_url: athlete.profile,
          city: athlete.city,
          country: athlete.country,
          sex: athlete.sex,
          weight: athlete.weight,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'strava_athlete_id' },
      )
      .select('id')
      .single()

    if (profileError) throw profileError

    const { error: tokenError } = await supabase
      .from('strava_tokens')
      .upsert(
        {
          profile_id: profile.id,
          access_token: tokenPayload.access_token,
          refresh_token: tokenPayload.refresh_token,
          expires_at: tokenPayload.expires_at,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' },
      )

    if (tokenError) throw tokenError

    const cookie = buildSessionCookie({ profileId: profile.id })
    res.setHeader('Set-Cookie', cookie)
    res.writeHead(302, { Location: '/dashboard' })
    res.end()
  } catch (err) {
    console.error('Strava callback failed', err)
    const message = err?.message ? ` ${err.message}` : ''
    return res.status(500).send(`Failed to authenticate with Strava.${message}`)
  }
}

const handleRefresh = async (req, res, session, supabase) => {
  const { data: tokenRow, error: tokenError } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('profile_id', session.profileId)
    .single()

  if (tokenError || !tokenRow) {
    return res.status(400).json({ error: 'Missing tokens' })
  }

  try {
    const refreshed = await refreshToken(tokenRow.refresh_token)
    await supabase
      .from('strava_tokens')
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: refreshed.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', session.profileId)

    return res.status(200).json({ ok: true })
  } catch {
    return res.status(500).json({ error: 'Failed to refresh token' })
  }
}

export default async function handler(req, res) {
  const action = req.query?.action

  if (req.method === 'GET') {
    if (action === 'callback') {
      return handleCallback(req, res)
    }
    return handleAuthUrl(req, res)
  }

  if (req.method === 'POST') {
    if (action === 'refresh') {
      const cookies = parseCookies(req.headers.cookie)
      const token = cookies[getCookieName()]
      const secret = process.env.SESSION_SECRET
      const session = verifySession(token, secret)

      if (!session) {
        return res.status(401).json({ error: 'Not authenticated' })
      }
      const supabase = getSupabaseAdmin()
      return handleRefresh(req, res, session, supabase)
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
