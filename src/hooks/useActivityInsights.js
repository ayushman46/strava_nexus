import { useQuery } from '@tanstack/react-query'

const fetchInsights = async (activityId) => {
  const params = new URLSearchParams({ activityId })
  const response = await fetch(`/api/activity-insights?${params.toString()}`)
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

