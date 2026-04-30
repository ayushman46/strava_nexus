import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const generateInviteCode = () =>
  Array.from({ length: 6 }, () => INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)]).join('')

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

  const { name, description, is_public } = req.body || {}
  if (!name || name.trim().length < 2) {
    res.status(400).json({ error: 'Group name is required' })
    return
  }

  const supabase = getSupabaseAdmin()
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
    res.status(500).json({ error: 'Failed to create group' })
    return
  }

  await supabase.from('group_members').insert({
    group_id: group.id,
    profile_id: session.profileId,
    role: 'owner',
  })

  res.status(200).json({ group })
}
