import { useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { metersToKm } from '../lib/utils'
import StatCard from '../components/StatCard'
import GroupCard from '../components/GroupCard'
import ActivityTable from '../components/ActivityTable'
import AIAdviceCard from '../components/AIAdviceCard'
import SyncButton from '../components/SyncButton'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import { useActivities, useSyncActivities } from '../hooks/useActivities'
import { useGroups } from '../hooks/useGroups'

const Dashboard = () => {
  const activitiesQuery = useActivities()
  const groupsQuery = useGroups()
  const syncMutation = useSyncActivities()
  const aiMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-coach', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to generate AI advice')
      return response.json()
    },
  })

  const stats = useMemo(() => {
    const activities = activitiesQuery.data?.activities ?? []
    const totalDistance = activities.reduce((sum, item) => sum + (item.distance_m || 0), 0)
    const totalPoints = activities.reduce((sum, item) => sum + (item.total_points || 0), 0)
    return {
      totalDistanceKm: metersToKm(totalDistance, 1) ?? 0,
      totalRuns: activities.length,
      totalPoints,
    }
  }, [activitiesQuery.data])

  if (activitiesQuery.isLoading || groupsQuery.isLoading) {
    return <LoadingSpinner />
  }

  if (activitiesQuery.isError || groupsQuery.isError) {
    return <ErrorState message="We couldn't load your dashboard yet." />
  }

  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Dashboard</h2>
            <p className="muted">Your latest training snapshot.</p>
          </div>
          <SyncButton onSync={() => syncMutation.mutate()} isLoading={syncMutation.isLoading} />
        </div>
        <div className="grid stats-grid">
          <StatCard label="Total distance" value={`${stats.totalDistanceKm} km`} helper="Last 30 days" />
          <StatCard label="Runs logged" value={stats.totalRuns} helper="Run count" />
          <StatCard label="Points" value={stats.totalPoints} helper="All-time" />
        </div>
      </section>

      <section className="section">
        <div className="grid two-col">
          <AIAdviceCard
            report={aiMutation.data?.report}
            onRefresh={() => aiMutation.mutate()}
            isLoading={aiMutation.isLoading}
          />
          <div className="card">
            <h3>Your groups</h3>
            <div className="stack">
              {groupsQuery.data?.groups?.length ? (
                groupsQuery.data.groups.map((group) => <GroupCard key={group.id} group={group} />)
              ) : (
                <EmptyState
                  title="No groups yet"
                  description="Create your first group to start competing."
                  action={<a className="button" href="/groups/preview">Create group</a>}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <ActivityTable activities={activitiesQuery.data?.activities ?? []} />
      </section>
    </div>
  )
}

export default Dashboard
