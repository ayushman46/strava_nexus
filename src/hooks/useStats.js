import { useQuery } from '@tanstack/react-query'

const fetchStats = async ({ days = 7, weeks = 12, end } = {}) => {
  const params = new URLSearchParams()
  params.set('action', 'stats')
  params.set('days', String(days))
  params.set('weeks', String(weeks))
  if (end) params.set('end', String(end))
  const response = await fetch(`/api/user?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to load stats')
  return response.json()
}

export const useStats = ({ days = 7, weeks = 12, end } = {}) =>
  useQuery({
    queryKey: ['stats', days, weeks, end ?? null],
    queryFn: () => fetchStats({ days, weeks, end }),
    staleTime: 1000 * 30,
  })
