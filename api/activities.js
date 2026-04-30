import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
  const { data, error } = await supabase
    .from('activities')
    .select('id, start_date, distance_m, average_speed, total_elevation_gain, activity_scores(total_points)')
    .eq('profile_id', session.profileId)
    .order('start_date', { ascending: false })
    .limit(10)

  if (error) {
    res.status(500).json({ error: 'Failed to load activities' })
    return
  }

  const activities = data.map((activity) => ({
    ...activity,
    total_points: activity.activity_scores?.[0]?.total_points ?? 0,
    pace: activity.average_speed ? 1000 / activity.average_speed / 60 : null,
  }))

  res.status(200).json({ activities })
}
