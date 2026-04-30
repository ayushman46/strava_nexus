import { useMutation, useQuery } from '@tanstack/react-query'

const fetchActivities = async ({ limit = 25 } = {}) => {
  const response = await fetch(`/api/activities?limit=${limit}`)
  if (!response.ok) throw new Error('Failed to load activities')
  return response.json()
}

export const useActivities = ({ limit = 25 } = {}) =>
  useQuery({
    queryKey: ['activities', limit],
    queryFn: () => fetchActivities({ limit }),
    staleTime: 1000 * 30,
  })

export const useSyncActivities = () =>
  useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/activities?action=sync', { method: 'POST' })
      if (!response.ok) throw new Error('Sync failed')
      return response.json()
    },
  })
