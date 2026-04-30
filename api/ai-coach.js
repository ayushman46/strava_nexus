import crypto from 'crypto'
import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'

const buildSummary = (activities) => {
  const totalDistance = activities.reduce((sum, item) => sum + item.distance_m, 0)
  const avgPace =
    activities.reduce((sum, item) => sum + (item.average_speed ? 1000 / item.average_speed / 60 : 0), 0) /
    (activities.length || 1)
  const longest = Math.max(...activities.map((item) => item.distance_m), 0)

  return {
    weekDistanceKm: Number((totalDistance / 1000).toFixed(1)),
    avgPaceWeek: Number(avgPace.toFixed(2)),
    longestRunKm: Number((longest / 1000).toFixed(1)),
    totalRunsWeek: activities.length,
    recentRuns: activities.map((item) => ({
      date: item.start_date,
      distanceKm: Number((item.distance_m / 1000).toFixed(2)),
      pace: item.average_speed ? Number((1000 / item.average_speed / 60).toFixed(2)) : null,
    })),
  }
}

const hashSummary = (summary) =>
  crypto.createHash('sha256').update(JSON.stringify(summary)).digest('hex')

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
  const { data: activities, error } = await supabase
    .from('activities')
    .select('distance_m, average_speed, start_date')
    .eq('profile_id', session.profileId)
    .order('start_date', { ascending: false })
    .limit(7)

  if (error) {
    res.status(500).json({ error: 'Failed to load activities' })
    return
  }

  const summary = buildSummary(activities)
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
    const prompt = `You are a supportive running coach helping recreational runners improve safely.\nUse only the provided data.\nDo not diagnose injuries or provide medical advice.\nKeep the response concise, practical, and personalized.\n\nHere is the runner summary:\n${JSON.stringify(summary, null, 2)}\n\nPlease return:\n1. One detailed performance summary\n2. Three actionable suggestions\n3. One warning if recovery or pacing pattern looks risky\n4. One realistic goal for the next 7 days\n\nResponse format:\n- Summary:\n- Suggestions:\n- Warning:\n- Next goal:`

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
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate AI advice' })
  }
}
