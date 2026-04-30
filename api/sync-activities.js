import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'
import { fetchActivities, refreshToken } from './_lib/strava.js'
import { calculateActivityPoints } from './_lib/points.js'

const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun'])

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

  let accessToken = tokenRow.access_token
  if (tokenRow.expires_at * 1000 < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshToken(tokenRow.refresh_token)
    accessToken = refreshed.access_token
    await supabase
      .from('strava_tokens')
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: refreshed.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', session.profileId)
  }

  try {
    const activities = await fetchActivities(accessToken)
    const runActivities = activities.filter((activity) => RUN_TYPES.has(activity.type))

    const rows = runActivities.map((activity) => ({
      profile_id: session.profileId,
      strava_activity_id: activity.id,
      name: activity.name,
      type: activity.type,
      distance_m: activity.distance,
      moving_time_sec: activity.moving_time,
      elapsed_time_sec: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      start_date: activity.start_date,
      timezone: activity.timezone,
      kudos_count: activity.kudos_count,
      achievement_count: activity.achievement_count,
      synced_at: new Date().toISOString(),
    }))

    const { data: stored, error: upsertError } = await supabase
      .from('activities')
      .upsert(rows, { onConflict: 'strava_activity_id' })
      .select('id, distance_m, average_speed, total_elevation_gain')

    if (upsertError) throw upsertError

    const scoreRows = stored.map((activity) => {
      const score = calculateActivityPoints(activity)
      return {
        activity_id: activity.id,
        ...score,
        calculated_at: new Date().toISOString(),
      }
    })

    await supabase
      .from('activity_scores')
      .upsert(scoreRows, { onConflict: 'activity_id' })

    res.status(200).json({ ok: true, imported: runActivities.length })
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync activities' })
  }
}
