import { useQuery } from '@tanstack/react-query'

const fetchProfile = async () => {
  const [meRes, statsRes] = await Promise.all([
    fetch('/api/user'),
    fetch('/api/user?action=stats&days=30&weeks=24'),
  ])
  if (!meRes.ok) throw new Error('Failed to load profile')
  const meData = await meRes.json()
  const statsData = statsRes.ok ? await statsRes.json() : null
  return { profile: meData.profile, stats: statsData }
}

export const useProfile = () =>
  useQuery({
    queryKey: ['profile-full'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60,
  })
