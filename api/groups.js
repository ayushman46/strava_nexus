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
    .from('group_members')
    .select('groups(id, name, description, invite_code)')
    .eq('profile_id', session.profileId)

  if (error) {
    res.status(500).json({ error: 'Failed to load groups' })
    return
  }

  const groups = data.map((row) => row.groups)
  res.status(200).json({ groups })
}
