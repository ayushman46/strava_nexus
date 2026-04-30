import crypto from 'crypto'
import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'
import { paceMinPerKmFromActivity, sliceByDateRange, summarizeActivities } from './_lib/stats.js'

const buildSummary = ({ currentActivities, previousActivities, days }) => {
  const current = summarizeActivities(currentActivities)
  const previous = summarizeActivities(previousActivities)

  const currentAvgPace = current.avgPaceMinPerKm ? Number(current.avgPaceMinPerKm.toFixed(2)) : null
  const previousAvgPace = previous.avgPaceMinPerKm ? Number(previous.avgPaceMinPerKm.toFixed(2)) : null

  return {
    periodDays: days,
    current: {
      distanceKm: Number((current.totalDistanceM / 1000).toFixed(1)),
      runs: current.totalRuns,
      movingTimeSec: current.totalMovingTimeSec,
      elevationGainM: Number(current.totalElevationGainM.toFixed(0)),
      avgPaceMinPerKm: currentAvgPace,
      fastestPaceMinPerKm: current.fastestPaceMinPerKm ? Number(current.fastestPaceMinPerKm.toFixed(2)) : null,
      longestRunKm: Number((current.longestRunM / 1000).toFixed(1)),
      kudos: current.totalKudos,
      achievements: current.totalAchievements,
      avgHeartRate: current.avgHeartRate ? Number(current.avgHeartRate.toFixed(0)) : null,
    },
    previous: {
      distanceKm: Number((previous.totalDistanceM / 1000).toFixed(1)),
      runs: previous.totalRuns,
      movingTimeSec: previous.totalMovingTimeSec,
      elevationGainM: Number(previous.totalElevationGainM.toFixed(0)),
      avgPaceMinPerKm: previousAvgPace,
      fastestPaceMinPerKm: previous.fastestPaceMinPerKm ? Number(previous.fastestPaceMinPerKm.toFixed(2)) : null,
      longestRunKm: Number((previous.longestRunM / 1000).toFixed(1)),
      kudos: previous.totalKudos,
      achievements: previous.totalAchievements,
      avgHeartRate: previous.avgHeartRate ? Number(previous.avgHeartRate.toFixed(0)) : null,
    },
    recentRuns: currentActivities.slice(0, 8).map((item) => ({
      date: item.start_date,
      distanceKm: Number((Number(item.distance_m) / 1000).toFixed(2)),
      paceMinPerKm: paceMinPerKmFromActivity(item) ? Number(paceMinPerKmFromActivity(item).toFixed(2)) : null,
    })),
  }
}

const hashSummary = (summary) =>
  crypto.createHash('sha256').update(JSON.stringify(summary)).digest('hex')

const handleWeeklyCoach = async (req, res, session, supabase) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const days = 7
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  const prevStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)

  const { data: activities, error } = await supabase
    .from('activities')
    .select('distance_m, moving_time_sec, average_speed, start_date, total_elevation_gain, kudos_count, achievement_count, average_heartrate')
    .eq('profile_id', session.profileId)
    .order('start_date', { ascending: false })
    .gte('start_date', prevStart.toISOString())
    .limit(200)

  if (error) {
    res.status(500).json({ error: 'Failed to load activities' })
    return
  }

  const currentActivities = sliceByDateRange(activities ?? [], start, end)
  const previousActivities = sliceByDateRange(activities ?? [], prevStart, start)

  const summary = buildSummary({ currentActivities, previousActivities, days })
  const summaryHash = hashSummary(summary)

  const { data: cached } = await supabase
    .from('ai_coach_reports')
    .select('*')
    .eq('profile_id', session.profileId)
    .eq('input_summary_hash', summaryHash)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cached && new Date(cached.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
    res.status(200).json({ report: cached })
    return
  }

  try {
    const prompt = `You are a supportive running coach helping recreational runners improve safely.\nUse only the provided data.\nDo not diagnose injuries or provide medical advice.\nKeep the response concise, practical, and personalized.\n\nHere is the runner summary:\n${JSON.stringify(summary, null, 2)}\n\nPlease return:\n1) One performance summary referencing the current vs previous period\n2) Three actionable suggestions\n3) One warning if recovery or pacing pattern looks risky\n4) One realistic goal for the next 7 days\n\nResponse format:\n- Summary:\n- Suggestions:\n- Warning:\n- Next goal:`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a supportive running coach.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(detail)
    }

    const payload = await response.json()
    const aiOutput = payload.choices?.[0]?.message?.content?.trim() || 'No advice generated.'

    const { data: report, error: reportError } = await supabase
      .from('ai_coach_reports')
      .insert({
        profile_id: session.profileId,
        period_label: 'weekly',
        prompt_version: 'v1',
        input_summary: summary,
        input_summary_hash: summaryHash,
        ai_output: aiOutput,
      })
      .select('*')
      .single()

    if (reportError) throw reportError

    res.status(200).json({ report })
  } catch {
    res.status(500).json({ error: 'Failed to generate AI advice' })
  }
}

const handleCompare = async (req, res, session, supabase) => {
  const { activityIds } = req.body || {}
  if (!Array.isArray(activityIds) || activityIds.length < 2) {
    return res.status(400).json({ error: 'Provide at least two activity IDs' })
  }

  const { data: activities, error } = await supabase
    .from('activities')
    .select('id, name, distance_m, moving_time_sec, elapsed_time_sec, average_speed, start_date, total_elevation_gain, average_heartrate, activity_scores(total_points)')
    .in('id', activityIds.slice(0, 5)) // Max 5 to avoid giant prompts
    .eq('profile_id', session.profileId)
    .order('start_date', { ascending: true })

  if (error || !activities?.length) {
    return res.status(500).json({ error: 'Failed to load activities for comparison' })
  }

  const runStats = activities.map(a => ({
    name: a.name || 'Run',
    date: new Date(a.start_date).toLocaleDateString(),
    distanceKm: (a.distance_m / 1000).toFixed(2),
    movingTimeMins: Math.round(a.moving_time_sec / 60),
    elapsedTimeMins: Math.round((a.elapsed_time_sec || a.moving_time_sec) / 60),
    elevationGainM: Math.round(a.total_elevation_gain || 0),
    avgPaceMinKm: paceMinPerKmFromActivity(a) ? paceMinPerKmFromActivity(a).toFixed(2) : 'N/A',
    avgHeartRate: Math.round(a.average_heartrate || 0),
    pointsScored: a.activity_scores?.[0]?.total_points ?? 0
  }))

  try {
    const prompt = `You are an expert running coach. Analyze these specific runs side-by-side and highlight the unique strengths and positive aspects of EACH run. \n\nRuns Data:\n${JSON.stringify(runStats, null, 2)}\n\nPlease provide a concise, encouraging comparison that points out what the runner did best in each specific run (e.g., "Run 1 had amazing pacing, but Run 2 was a fantastic effort on hills"). Keep it under 150 words total and format with bullet points for each run.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an encouraging running coach.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
      }),
    })

    if (!response.ok) throw new Error('Groq API error')

    const payload = await response.json()
    const aiOutput = payload.choices?.[0]?.message?.content?.trim() || 'Great effort on these runs!'

    res.status(200).json({ comparison: aiOutput })
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate comparison score' })
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const cookies = parseCookies(req.headers.cookie)
  const token = cookies[getCookieName()]
  const secret = process.env.SESSION_SECRET
  const session = verifySession(token, secret)

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const supabase = getSupabaseAdmin()

  if (req.query?.action === 'compare') {
    return handleCompare(req, res, session, supabase)
  }

  return handleWeeklyCoach(req, res, session, supabase)
}
