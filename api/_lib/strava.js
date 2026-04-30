const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize'
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const STRAVA_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities'

export const buildAuthUrl = () => {
  const clientId = process.env.STRAVA_CLIENT_ID
  const appBaseUrl = process.env.APP_BASE_URL
  if (!clientId || !appBaseUrl) {
    throw new Error('Missing STRAVA_CLIENT_ID or APP_BASE_URL')
  }
  const redirectUri = `${appBaseUrl}/api/strava-callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'force',
    scope: 'read,activity:read_all',
  })
  return `${STRAVA_AUTH_URL}?${params.toString()}`
}

export const exchangeToken = async (code) => {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail)
  }
  return response.json()
}

export const refreshToken = async (refreshTokenValue) => {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
    }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail)
  }
  return response.json()
}

export const fetchActivities = async (accessToken) => {
  const response = await fetch(`${STRAVA_ACTIVITIES_URL}?per_page=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail)
  }
  return response.json()
}
