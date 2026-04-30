import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'
import { fetchActivityStreams, refreshToken } from './_lib/strava.js'

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
  const variance =
    numbers.reduce((acc, value) => acc + (value - avg) ** 2, 0) / (numbers.length - 1)
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

  const activityId = req.query?.activityId
  if (!activityId) {
    res.status(400).json({ error: 'Missing activityId' })
    return
  }

  const supabase = getSupabaseAdmin()

  const { data: activityRow, error: activityError } = await supabase
    .from('activities')
    .select('id, strava_activity_id, name, start_date, distance_m, moving_time_sec, average_speed, average_heartrate')
    .eq('id', activityId)
    .eq('profile_id', session.profileId)
    .single()

  if (activityError || !activityRow) {
    res.status(404).json({ error: 'Activity not found' })
    return
  }

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

    res.status(200).json({
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
    res.status(500).json({ error: 'Failed to load activity insights', detail })
  }
}

