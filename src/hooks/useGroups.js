import { useMutation, useQuery } from '@tanstack/react-query'

const fetchGroups = async () => {
  const response = await fetch('/api/groups')
  if (!response.ok) throw new Error('Failed to load groups')
  return response.json()
}

export const useGroups = () =>
  useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    staleTime: 1000 * 30,
  })

export const useCreateGroup = () =>
  useMutation({
    mutationFn: async (payload) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Failed to create group')
      return response.json()
    },
  })

export const useJoinGroup = () =>
  useMutation({
    mutationFn: async (payload) => {
      const response = await fetch('/api/groups?action=join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Failed to join group')
      return response.json()
    },
  })
