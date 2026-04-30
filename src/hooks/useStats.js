import { useQuery } from '@tanstack/react-query'

const fetchStats = async ({ days = 7, weeks = 12 } = {}) => {
  const params = new URLSearchParams()
  params.set('days', String(days))
  params.set('weeks', String(weeks))
  const response = await fetch(`/api/stats?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to load stats')
  return response.json()
}

export const useStats = ({ days = 7, weeks = 12 } = {}) =>
  useQuery({
    queryKey: ['stats', days, weeks],
    queryFn: () => fetchStats({ days, weeks }),
    staleTime: 1000 * 30,
  })

