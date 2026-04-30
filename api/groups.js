import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'
import { sliceByDateRange, summarizeActivities } from './_lib/stats.js'

const VIEW_MAP = {
  weekly: 'group_leaderboard_weekly',
  monthly: 'group_leaderboard_monthly',
  'all-time': 'group_leaderboard_all_time',
}

const formatPaceLabel = (pace) => {
  if (!Number.isFinite(pace)) return '—'
  const minutes = Math.floor(pace)
  const seconds = Math.round((pace - minutes) * 60)
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const computeConsistency = (activities, start, end) => {
  const days = 7
  const seen = new Set()
  for (const activity of activities) {
    const t = activity?.start_date ? new Date(activity.start_date).getTime() : NaN
    if (!Number.isFinite(t)) continue
    if (t < start.getTime() || t >= end.getTime()) continue
    const dayIndex = Math.floor((t - start.getTime()) / (24 * 60 * 60 * 1000))
    if (dayIndex >= 0 && dayIndex < days) seen.add(dayIndex)
  }
  return seen.size / days
}

const computeFairPlayScore = ({ current, baseline, consistency }) => {
  const baselineDistanceWeeklyKm = baseline.totalDistanceM > 0 ? (baseline.totalDistanceM / 1000) / 8 : null
  const baselinePace = baseline.avgPaceMinPerKm
  const currentDistanceKm = current.totalDistanceM > 0 ? current.totalDistanceM / 1000 : 0
  const currentPace = current.avgPaceMinPerKm

  const paceImpPct =
    Number.isFinite(baselinePace) && Number.isFinite(currentPace)
      ? ((baselinePace - currentPace) / baselinePace) * 100
      : 0
  const distImpPct =
    Number.isFinite(baselineDistanceWeeklyKm) && baselineDistanceWeeklyKm > 0
      ? ((currentDistanceKm - baselineDistanceWeeklyKm) / baselineDistanceWeeklyKm) * 100
      : 0

  const raw = 50 + 1.2 * paceImpPct + 0.5 * distImpPct + 12 * clamp(consistency, 0, 1)
  const score = clamp(raw, 0, 100)

  return {
    score: Math.round(score),
    paceImpPct: Number.isFinite(paceImpPct) ? Number(paceImpPct.toFixed(1)) : 0,
    distImpPct: Number.isFinite(distImpPct) ? Number(distImpPct.toFixed(1)) : 0,
  }
}

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const generateInviteCode = () =>
  Array.from({ length: 6 }, () => INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)]).join('')

const handleCreateGroup = async (req, res, session, supabase) => {
  const { name, description, is_public } = req.body || {}
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Group name is required' })
  }

  const inviteCode = generateInviteCode()
  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      invite_code: inviteCode,
      owner_id: session.profileId,
      is_public: Boolean(is_public),
    })
    .select('*')
    .single()

  if (error) {
    return res.status(500).json({ error: 'Failed to create group' })
  }

  await supabase.from('group_members').insert({
    group_id: group.id,
    profile_id: session.profileId,
    role: 'owner',
  })

  return res.status(200).json({ group })
}

const handleJoinGroup = async (req, res, session, supabase) => {
  const { inviteCode } = req.body || {}
  if (!inviteCode) {
    return res.status(400).json({ error: 'Invite code required' })
  }

  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()

  if (error || !group) {
    return res.status(404).json({ error: 'Group not found' })
  }

  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: group.id,
    profile_id: session.profileId,
    role: 'member',
  })

  if (memberError) {
    return res.status(400).json({ error: 'Already joined' })
  }

  return res.status(200).json({ group })
}

const handleLeaderboard = async (req, res, session, supabase) => {
  const { groupId, range = 'weekly' } = req.query
  const mode = String(req.query?.mode ?? 'classic')
  if (!groupId) {
    return res.status(400).json({ error: 'Missing groupId' })
  }

  if (range === 'weekly' && mode === 'fairplay') {
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('profile_id, profiles(full_name, avatar_url)')
      .eq('group_id', groupId)

    if (membersError) {
      return res.status(500).json({ error: 'Failed to load group members' })
    }

    const profileIds = (members ?? []).map((member) => member.profile_id).filter(Boolean)
    if (!profileIds.length) {
      return res.status(200).json({ rows: [] })
    }

    const end = new Date()
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
    const baselineStart = new Date(start.getTime() - 56 * 24 * 60 * 60 * 1000)

    const { data: activities, error: activityError } = await supabase
      .from('activities')
      .select('profile_id, start_date, distance_m, moving_time_sec, average_speed')
      .in('profile_id', profileIds)
      .gte('start_date', baselineStart.toISOString())
      .order('start_date', { ascending: false })
      .limit(8000)

    if (activityError) {
      return res.status(500).json({ error: 'Failed to load activities' })
    }

    const byProfile = new Map()
    for (const activity of activities ?? []) {
      const id = activity.profile_id
      if (!byProfile.has(id)) byProfile.set(id, [])
      byProfile.get(id).push(activity)
    }

    const rows = (members ?? []).map((member) => {
      const profileId = member.profile_id
      const list = byProfile.get(profileId) ?? []
      const currentActivities = sliceByDateRange(list, start, end)
      const baselineActivities = sliceByDateRange(list, baselineStart, start)
      const current = summarizeActivities(currentActivities)
      const baseline = summarizeActivities(baselineActivities)
      const consistency = computeConsistency(list, start, end)
      const fair = computeFairPlayScore({ current, baseline, consistency })

      return {
        profile_id: profileId,
        full_name: member.profiles?.full_name ?? 'Runner',
        avatar_url: member.profiles?.avatar_url ?? null,
        total_distance_km: Number((current.totalDistanceM / 1000).toFixed(1)),
        avg_pace_label: formatPaceLabel(current.avgPaceMinPerKm),
        fairplay_score: fair.score,
        pace_improvement_pct: fair.paceImpPct,
        distance_improvement_pct: fair.distImpPct,
      }
    })

    const sorted = rows
      .slice()
      .sort((a, b) => (b.fairplay_score ?? 0) - (a.fairplay_score ?? 0))
      .map((row, index) => ({ ...row, rank: index + 1 }))

    return res.status(200).json({ rows: sorted })
  }

  const viewName = VIEW_MAP[range] || VIEW_MAP.weekly
  const { data, error } = await supabase
    .from(viewName)
    .select('*')
    .eq('group_id', groupId)
    .order('total_points', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Failed to load leaderboard' })
  }

  const rows = data.map((row, index) => ({
    ...row,
    rank: index + 1,
    total_distance_km: Number((row.total_distance_m / 1000).toFixed(1)),
    avg_pace_label: formatPaceLabel(row.avg_pace),
  }))

  return res.status(200).json({ rows })
}

const handleGetGroups = async (req, res, session, supabase) => {
  const { data, error } = await supabase
    .from('group_members')
    .select('groups(id, name, description, invite_code)')
    .eq('profile_id', session.profileId)

  if (error) {
    return res.status(500).json({ error: 'Failed to load groups' })
  }

  const groups = data.map((row) => row.groups)
  return res.status(200).json({ groups })
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
    if (req.query?.action === 'leaderboard') {
      return handleLeaderboard(req, res, session, supabase)
    }
    return handleGetGroups(req, res, session, supabase)
  }

  if (req.method === 'POST') {
    if (req.query?.action === 'join') {
      return handleJoinGroup(req, res, session, supabase)
    }
    return handleCreateGroup(req, res, session, supabase)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
