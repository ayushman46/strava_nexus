import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'
import { buildRollingWeekTrend, paceMinPerKmFromActivity, sliceByDateRange, summarizeActivities } from './_lib/stats.js'

const clampInt = (value, { min, max, fallback }) => {
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

const parseEndDate = (value) => {
  if (!value) return null
  const parsed = new Date(String(value))
  const time = parsed.getTime()
  if (!Number.isFinite(time)) return null
  return parsed
}

const buildDailyBreakdown = ({ activities, start, days }) => {
  const buckets = Array.from({ length: days }, (_, index) => ({
    index,
    start: new Date(start.getTime() + index * 24 * 60 * 60 * 1000),
    distanceM: 0,
    movingTimeSec: 0,
    runs: 0,
  }))

  for (const activity of activities) {
    const dateMs = activity?.start_date ? new Date(activity.start_date).getTime() : NaN
    if (!Number.isFinite(dateMs)) continue
    const dayIndex = Math.floor((dateMs - start.getTime()) / (24 * 60 * 60 * 1000))
    if (dayIndex < 0 || dayIndex >= days) continue
    const distance = Number(activity?.distance_m ?? 0)
    const movingTime = Number(activity?.moving_time_sec ?? 0)
    if (Number.isFinite(distance)) buckets[dayIndex].distanceM += distance
    if (Number.isFinite(movingTime)) buckets[dayIndex].movingTimeSec += movingTime
    buckets[dayIndex].runs += 1
  }

  return buckets.map((bucket) => {
    const pace =
      bucket.distanceM > 0 && bucket.movingTimeSec > 0
        ? (bucket.movingTimeSec * 1000) / bucket.distanceM / 60
        : null
    return {
      date: bucket.start.toISOString(),
      label: bucket.start.toLocaleDateString(undefined, { weekday: 'short' }),
      distanceKm: Number((bucket.distanceM / 1000).toFixed(1)),
      avgPaceMinPerKm: pace ? Number(pace.toFixed(2)) : null,
      runs: bucket.runs,
    }
  })
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

  const days = clampInt(req.query?.days, { min: 3, max: 30, fallback: 7 })
  const trendWeeks = clampInt(req.query?.weeks, { min: 4, max: 24, fallback: 12 })

  const now = new Date()
  const requestedEnd = parseEndDate(req.query?.end)
  const end = requestedEnd && requestedEnd.getTime() <= now.getTime() ? requestedEnd : now
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  const prevStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)

  const earliestNeeded = new Date(end.getTime() - (trendWeeks * 7 + days * 2) * 24 * 60 * 60 * 1000)

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('activities')
    .select(
      'id, name, type, start_date, distance_m, moving_time_sec, total_elevation_gain, kudos_count, achievement_count, average_heartrate, average_speed, activity_scores(total_points)',
    )
    .eq('profile_id', session.profileId)
    .gte('start_date', earliestNeeded.toISOString())
    .order('start_date', { ascending: false })
    .limit(1000)

  if (error) {
    res.status(500).json({ error: 'Failed to load stats' })
    return
  }

  const activities = (data ?? []).map((activity) => ({
    ...activity,
    total_points: activity.activity_scores?.[0]?.total_points ?? 0,
  }))

  const currentActivities = sliceByDateRange(activities, start, end)
  const previousActivities = sliceByDateRange(activities, prevStart, start)

  const current = summarizeActivities(currentActivities)
  const previous = summarizeActivities(previousActivities)

  const trend = buildRollingWeekTrend({ activities, end, weeks: trendWeeks })
  const daily = buildDailyBreakdown({ activities: currentActivities, start, days })
  const dailyActive = daily.filter((item) => (item.runs ?? 0) > 0)

  const weekActivities = currentActivities
    .slice()
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    .slice(0, 50)
    .map((activity) => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      start_date: activity.start_date,
      distance_m: activity.distance_m,
      moving_time_sec: activity.moving_time_sec,
      total_elevation_gain: activity.total_elevation_gain,
      kudos_count: activity.kudos_count,
      achievement_count: activity.achievement_count,
      average_heartrate: activity.average_heartrate,
      average_speed: activity.average_speed,
      total_points: activity.total_points ?? 0,
      pace: paceMinPerKmFromActivity(activity),
    }))

  res.status(200).json({
    range: { start: start.toISOString(), end: end.toISOString(), days },
    current: {
      ...current,
      totalDistanceKm: Number((current.totalDistanceM / 1000).toFixed(1)),
      longestRunKm: Number((current.longestRunM / 1000).toFixed(1)),
      avgPaceMinPerKm: current.avgPaceMinPerKm ? Number(current.avgPaceMinPerKm.toFixed(2)) : null,
      fastestPaceMinPerKm: current.fastestPaceMinPerKm
        ? Number(current.fastestPaceMinPerKm.toFixed(2))
        : null,
      avgHeartRate: current.avgHeartRate ? Number(current.avgHeartRate.toFixed(0)) : null,
    },
    previous: {
      ...previous,
      totalDistanceKm: Number((previous.totalDistanceM / 1000).toFixed(1)),
      longestRunKm: Number((previous.longestRunM / 1000).toFixed(1)),
      avgPaceMinPerKm: previous.avgPaceMinPerKm ? Number(previous.avgPaceMinPerKm.toFixed(2)) : null,
      fastestPaceMinPerKm: previous.fastestPaceMinPerKm
        ? Number(previous.fastestPaceMinPerKm.toFixed(2))
        : null,
      avgHeartRate: previous.avgHeartRate ? Number(previous.avgHeartRate.toFixed(0)) : null,
    },
    trend,
    daily,
    dailyActive,
    activities: weekActivities,
  })
}
