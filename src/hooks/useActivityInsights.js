import { useQuery } from '@tanstack/react-query'

const fetchInsights = async (activityId) => {
  const params = new URLSearchParams({ action: 'insights', activityId })
  const response = await fetch(`/api/activities?${params.toString()}`)
  if (!response.ok) {
    let detail = ''
    try {
      const payload = await response.json()
      detail = payload?.detail ? `: ${payload.detail}` : ''
    } catch {
      // ignore
    }
    throw new Error(`Failed to load RunDNA${detail}`)
  }
  return response.json()
}

export const useActivityInsights = (activityId, { enabled } = {}) =>
  useQuery({
    queryKey: ['activity-insights', activityId],
    queryFn: () => fetchInsights(activityId),
    enabled: Boolean(activityId) && enabled !== false,
    staleTime: 1000 * 60 * 10,
  })

