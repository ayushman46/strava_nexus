import { useQuery } from '@tanstack/react-query'

const fetchMe = async () => {
  const response = await fetch('/api/user')
  if (!response.ok) {
    if (response.status === 401) return null
    throw new Error('Failed to fetch session')
  }
  return response.json()
}

export const useAuth = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: 1000 * 60,
  })
