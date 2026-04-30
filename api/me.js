import { parseCookies, verifySession, getCookieName } from './_lib/session.js'
import { getSupabaseAdmin } from './_lib/supabase.js'

export default async function handler(req, res) {
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
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .eq('id', session.profileId)
    .single()

  if (error) {
    res.status(500).json({ error: 'Failed to load profile' })
    return
  }

  res.status(200).json({ profile: data })
}
