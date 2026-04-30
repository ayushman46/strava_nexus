import crypto from 'crypto'

const COOKIE_NAME = 'sg_session'

export const getCookieName = () => COOKIE_NAME

const base64Url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

const fromBase64Url = (input) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(normalized, 'base64').toString('utf8')
}

export const signSession = (payload, secret) => {
  const encoded = base64Url(JSON.stringify(payload))
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('hex')
  return `${encoded}.${signature}`
}

export const verifySession = (token, secret) => {
  if (!token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('hex')
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  const payload = JSON.parse(fromBase64Url(encoded))
  if (payload.exp && Date.now() > payload.exp) return null
  return payload
}

export const parseCookies = (header = '') =>
  header.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=')
    if (!key) return acc
    acc[key] = decodeURIComponent(rest.join('='))
    return acc
  }, {})

export const buildSessionCookie = ({ profileId }) => {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('Missing SESSION_SECRET')
  const payload = {
    profileId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  }
  const token = signSession(payload, secret)
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${
    60 * 60 * 24 * 7
  }`
}
