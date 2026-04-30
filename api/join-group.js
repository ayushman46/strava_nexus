import { getSupabaseAdmin } from './_lib/supabase.js'
import { parseCookies, verifySession, getCookieName } from './_lib/session.js'

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

  const { inviteCode } = req.body || {}
  if (!inviteCode) {
    res.status(400).json({ error: 'Invite code required' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()

  if (error || !group) {
    res.status(404).json({ error: 'Group not found' })
    return
  }

  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: group.id,
    profile_id: session.profileId,
    role: 'member',
  })

  if (memberError) {
    res.status(400).json({ error: 'Already joined' })
    return
  }

  res.status(200).json({ group })
}
