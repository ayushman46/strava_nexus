import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'
import { refreshToken } from './_lib/strava.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const cookies = parseCookies(req.headers.cookie)
  const token = cookies[getCookieName()]
  const secret = process.env.SESSION_SECRET
  const session = verifySession(token, secret)

  if (!session) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data: tokenRow, error: tokenError } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('profile_id', session.profileId)
    .single()

  if (tokenError || !tokenRow) {
    res.status(400).json({ error: 'Missing tokens' })
    return
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

    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh token' })
  }
}
