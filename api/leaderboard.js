import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'

const VIEW_MAP = {
  weekly: 'group_leaderboard_weekly',
  monthly: 'group_leaderboard_monthly',
  'all-time': 'group_leaderboard_all_time',
}

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

  const { groupId, range = 'weekly' } = req.query
  if (!groupId) {
    res.status(400).json({ error: 'Missing groupId' })
    return
  }

  const viewName = VIEW_MAP[range] || VIEW_MAP.weekly
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(viewName)
    .select('*')
    .eq('group_id', groupId)
    .order('total_points', { ascending: false })

  if (error) {
    res.status(500).json({ error: 'Failed to load leaderboard' })
    return
  }

  const rows = data.map((row, index) => ({
    ...row,
    rank: index + 1,
    total_distance_km: Number((row.total_distance_m / 1000).toFixed(1)),
    avg_pace_label: row.avg_pace ? `${Math.floor(row.avg_pace)}:${String(Math.round((row.avg_pace % 1) * 60)).padStart(2, '0')} /km` : '—',
  }))

  res.status(200).json({ rows })
}
