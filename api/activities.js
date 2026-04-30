import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'
import { paceMinPerKmFromActivity } from './_lib/stats.js'
import { fetchActivityStreams, fetchActivitiesPaged, refreshToken } from './_lib/strava.js'
import { calculateActivityPoints } from './_lib/points.js'

const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun'])

const mean = (values) => {
  const numbers = values.filter((value) => Number.isFinite(value))
  if (!numbers.length) return null
  const sum = numbers.reduce((acc, value) => acc + value, 0)
  return sum / numbers.length
}

const stdDev = (values) => {
  const avg = mean(values)
  if (!Number.isFinite(avg)) return null
  const numbers = values.filter((value) => Number.isFinite(value))
  if (numbers.length < 2) return 0
  const variance = numbers.reduce((acc, value) => acc + (value - avg) ** 2, 0) / (numbers.length - 1)
  return Math.sqrt(variance)
}

const decimate = (array, maxPoints) => {
  if (!Array.isArray(array)) return []
  if (array.length <= maxPoints) return array
  const step = Math.ceil(array.length / maxPoints)
  const out = []
  for (let i = 0; i < array.length; i += step) out.push(array[i])
  return out
}

const paceFromSpeed = (speedMps) => {
  const speed = Number(speedMps)
  if (!Number.isFinite(speed) || speed <= 0) return null
  return 1000 / speed / 60
}

const classifyRun = ({ avgPaceMinPerKm, avgHr, paceStd }) => {
  if (!Number.isFinite(avgPaceMinPerKm)) return { label: 'Unknown', confidence: 0.2 }
  const intensityHint = Number.isFinite(avgHr) ? avgHr : null
  const steadiness = Number.isFinite(paceStd) ? Math.max(0, 1 - paceStd / 1.4) : 0.5

  if (intensityHint !== null && intensityHint < 140 && avgPaceMinPerKm > 5.2) {
    return { label: 'Easy', confidence: 0.6 + steadiness * 0.3 }
  }
  if (paceStd !== null && paceStd < 0.35) {
    return { label: 'Steady', confidence: 0.65 + steadiness * 0.25 }
  }
  if (intensityHint !== null && intensityHint > 160) {
    return { label: 'Hard', confidence: 0.6 + (1 - steadiness) * 0.25 }
  }
  return { label: 'Mixed', confidence: 0.55 }
}

const handleGetActivities = async (req, res, session, supabase) => {
  const limit = Math.max(1, Math.min(200, Number.parseInt(String(req.query?.limit ?? '20'), 10) || 20))
  const { data, error } = await supabase
    .from('activities')
    .select(
      'id, name, start_date, distance_m, moving_time_sec, elapsed_time_sec, average_speed, total_elevation_gain, kudos_count, achievement_count, average_heartrate, activity_scores(total_points)',
    )
    .eq('profile_id', session.profileId)
    .order('start_date', { ascending: false })
    .limit(limit)

  if (error) {
    return res.status(500).json({ error: 'Failed to load activities' })
  }

  const activities = data.map((activity) => ({
    ...activity,
    total_points: activity.activity_scores?.[0]?.total_points ?? 0,
    pace: paceMinPerKmFromActivity(activity),
  }))

  return res.status(200).json({ activities })
}

const handleActivityInsights = async (req, res, session, supabase) => {
  const activityId = req.query?.activityId
  if (!activityId) {
    return res.status(400).json({ error: 'Missing activityId' })
  }

  const { data: activityRow, error: activityError } = await supabase
    .from('activities')
    .select('id, strava_activity_id, name, start_date, distance_m, moving_time_sec, average_speed, average_heartrate')
    .eq('id', activityId)
    .eq('profile_id', session.profileId)
    .single()

  if (activityError || !activityRow) {
    return res.status(404).json({ error: 'Activity not found' })
  }

  const { data: tokenRow, error: tokenError } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('profile_id', session.profileId)
    .single()

  if (tokenError || !tokenRow) {
    return res.status(400).json({ error: 'Missing tokens' })
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
    let streams
    try {
      streams = await fetchActivityStreams(accessToken, activityRow.strava_activity_id)
    } catch (err) {
      if (err?.status === 401) {
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
        streams = await fetchActivityStreams(accessToken, activityRow.strava_activity_id)
      } else {
        throw err
      }
    }

    const time = streams?.time?.data ?? []
    const velocity = streams?.velocity_smooth?.data ?? []
    const heartrate = streams?.heartrate?.data ?? []

    const n = Math.min(time.length, velocity.length)
    const paceSeries = []
    const hrSeries = []
    const paceValues = []
    const hrValues = []

    for (let i = 0; i < n; i += 1) {
      const t = Number(time[i])
      const pace = paceFromSpeed(velocity[i])
      if (Number.isFinite(t) && Number.isFinite(pace)) {
        paceSeries.push({ t, pace })
        paceValues.push(pace)
      }
    }

    const hrN = Math.min(time.length, heartrate.length)
    for (let i = 0; i < hrN; i += 1) {
      const t = Number(time[i])
      const hr = Number(heartrate[i])
      if (Number.isFinite(t) && Number.isFinite(hr)) {
        hrSeries.push({ t, hr })
        hrValues.push(hr)
      }
    }

    const paceAvg = mean(paceValues)
    const paceSd = stdDev(paceValues)
    const hrAvg = mean(hrValues)

    const mid = Math.floor(paceValues.length / 2)
    const paceFirst = mean(paceValues.slice(0, mid))
    const paceSecond = mean(paceValues.slice(mid))
    const splitDelta = Number.isFinite(paceFirst) && Number.isFinite(paceSecond) ? paceSecond - paceFirst : null

    const hrMid = Math.floor(hrValues.length / 2)
    const hrFirst = mean(hrValues.slice(0, hrMid))
    const hrSecond = mean(hrValues.slice(hrMid))
    const hrDrift = Number.isFinite(hrFirst) && Number.isFinite(hrSecond) ? hrSecond - hrFirst : null

    const stability = Number.isFinite(paceSd) ? Math.max(0, Math.min(100, 100 - (paceSd / 1.5) * 100)) : null

    const runType = classifyRun({
      avgPaceMinPerKm: paceAvg,
      avgHr: hrAvg,
      paceStd: paceSd,
    })

    const maxPoints = 120
    const paceOut = decimate(paceSeries, maxPoints).map((point) => ({
      t: point.t,
      pace: Number(point.pace.toFixed(2)),
    }))
    const hrOut = decimate(hrSeries, maxPoints).map((point) => ({
      t: point.t,
      hr: Math.round(point.hr),
    }))

    return res.status(200).json({
      activity: {
        id: activityRow.id,
        name: activityRow.name,
        start_date: activityRow.start_date,
        distance_m: activityRow.distance_m,
        moving_time_sec: activityRow.moving_time_sec,
        average_speed: activityRow.average_speed,
        average_heartrate: activityRow.average_heartrate,
      },
      insights: {
        stabilityScore: stability ? Math.round(stability) : null,
        avgPaceMinPerKm: paceAvg ? Number(paceAvg.toFixed(2)) : null,
        paceVolatility: paceSd ? Number(paceSd.toFixed(2)) : null,
        splitDeltaMinPerKm: splitDelta ? Number(splitDelta.toFixed(2)) : null,
        hrDrift: hrDrift ? Number(hrDrift.toFixed(0)) : null,
        runType,
      },
      series: {
        pace: paceOut,
        hr: hrOut,
      },
    })
  } catch (err) {
    const detail = err?.message ? String(err.message).slice(0, 220) : null
    return res.status(500).json({ error: 'Failed to load activity insights', detail })
  }
}

const handleSyncActivities = async (req, res, session, supabase) => {
  const { data: tokenRow, error: tokenError } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('profile_id', session.profileId)
    .single()

  if (tokenError || !tokenRow) {
    return res.status(400).json({ error: 'Missing tokens' })
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
    const after = Math.floor((Date.now() - 3650 * 24 * 60 * 60 * 1000) / 1000) // 10 years
    const activities = await fetchActivitiesPaged(accessToken, { after, perPage: 50, maxPages: 10 })
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

    return res.status(200).json({ ok: true, imported: runActivities.length })
  } catch {
    return res.status(500).json({ error: 'Failed to sync activities' })
  }
}

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie)
  const token = cookies[getCookieName()]
  const secret = process.env.SESSION_SECRET
  const session = verifySession(token, secret)

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const supabase = getSupabaseAdmin()

  if (req.method === 'GET') {
    if (req.query?.action === 'insights') {
      return handleActivityInsights(req, res, session, supabase)
    }
    return handleGetActivities(req, res, session, supabase)
  }

  if (req.method === 'POST') {
    if (req.query?.action === 'sync') {
      return handleSyncActivities(req, res, session, supabase)
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
