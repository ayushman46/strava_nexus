import { useMutation } from '@tanstack/react-query'
import { formatPace, formatPaceDelta, secondsToHms } from '../lib/utils'
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
import { useStats } from '../hooks/useStats'
import DistanceChart from '../components/charts/DistanceChart'
import PaceTrendChart from '../components/charts/PaceTrendChart'

const Dashboard = () => {
  const activitiesQuery = useActivities()
  const groupsQuery = useGroups()
  const statsQuery = useStats({ days: 7, weeks: 12 })
  const syncMutation = useSyncActivities()
  const aiMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-coach', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to generate AI advice')
      return response.json()
    },
  })

  if (activitiesQuery.isLoading || groupsQuery.isLoading || statsQuery.isLoading) {
    return <LoadingSpinner />
  }

  if (activitiesQuery.isError || groupsQuery.isError || statsQuery.isError) {
    return <ErrorState message="We couldn't load your dashboard yet." />
  }

  const stats = statsQuery.data
  const current = stats?.current
  const previous = stats?.previous

  const distanceDelta = Number.isFinite(current?.totalDistanceKm) && Number.isFinite(previous?.totalDistanceKm)
    ? current.totalDistanceKm - previous.totalDistanceKm
    : null

  const paceDelta =
    Number.isFinite(current?.avgPaceMinPerKm) && Number.isFinite(previous?.avgPaceMinPerKm)
      ? current.avgPaceMinPerKm - previous.avgPaceMinPerKm
      : null

  const trendTone = (value, { betterWhenLower = false } = {}) => {
    if (!Number.isFinite(value) || value === 0) return 'neutral'
    const improved = betterWhenLower ? value < 0 : value > 0
    return improved ? 'good' : 'bad'
  }

  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Dashboard</h2>
            <p className="muted">What you achieved in the last 7 days.</p>
          </div>
          <SyncButton onSync={() => syncMutation.mutate()} isLoading={syncMutation.isLoading} />
        </div>
        <div className="grid stats-grid">
          <StatCard
            label="Distance"
            value={`${current?.totalDistanceKm ?? 0} km`}
            helper="Last 7 days"
            trend={distanceDelta === null ? null : `vs prev: ${distanceDelta >= 0 ? '+' : ''}${distanceDelta.toFixed(1)} km`}
            trendTone={trendTone(distanceDelta)}
          />
          <StatCard
            label="Avg pace"
            value={formatPace(current?.avgPaceMinPerKm)}
            helper="Distance-weighted"
            trend={paceDelta === null ? null : `vs prev: ${formatPaceDelta(paceDelta)}`}
            trendTone={trendTone(paceDelta, { betterWhenLower: true })}
          />
          <StatCard
            label="Time"
            value={secondsToHms(current?.totalMovingTimeSec) ?? '—'}
            helper="Moving time"
          />
          <StatCard label="Runs" value={current?.totalRuns ?? 0} helper="Last 7 days" />
          <StatCard
            label="Elev gain"
            value={`${Math.round(current?.totalElevationGainM ?? 0)} m`}
            helper="Total climb"
          />
          <StatCard
            label="Achievements"
            value={current?.totalAchievements ?? 0}
            helper="Trophies + PRs"
          />
          <StatCard label="Kudos" value={current?.totalKudos ?? 0} helper="From friends" />
          <StatCard label="Points" value={Math.round(current?.totalPoints ?? 0)} helper="Last 7 days" />
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
        <div className="grid two-col">
          <DistanceChart data={stats?.trend ?? []} />
          <PaceTrendChart data={stats?.trend ?? []} />
        </div>
      </section>

      <section className="section">
        <ActivityTable activities={activitiesQuery.data?.activities ?? []} />
      </section>
    </div>
  )
}

export default Dashboard
