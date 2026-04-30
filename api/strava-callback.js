import { getSupabaseAdmin } from './_lib/supabase.js'
import { buildSessionCookie } from './_lib/session.js'
import { exchangeToken } from './_lib/strava.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

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
    res.status(500).send(`Missing env vars: ${missing.join(', ')}`)
    return
  }

  const { code, error } = req.query
  if (error) {
    res.status(400).send('Strava authorization was denied.')
    return
  }

  if (!code) {
    res.status(400).send('Missing Strava code.')
    return
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
    res.status(500).send(`Failed to authenticate with Strava.${message}`)
  }
}
