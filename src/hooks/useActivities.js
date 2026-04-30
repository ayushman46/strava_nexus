import { useMutation, useQuery } from '@tanstack/react-query'

const fetchActivities = async () => {
  const response = await fetch('/api/activities?limit=25')
  if (!response.ok) throw new Error('Failed to load activities')
  return response.json()
}

export const useActivities = () =>
  useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    staleTime: 1000 * 30,
  })

export const useSyncActivities = () =>
  useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync-activities', { method: 'POST' })
      if (!response.ok) throw new Error('Sync failed')
      return response.json()
    },
  })
