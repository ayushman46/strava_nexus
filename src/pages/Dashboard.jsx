import { useState } from 'react'
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
import RunDNAModal from '../components/RunDNAModal'
import MonthCalendar from '../components/MonthCalendar'
import ActiveDaysChart from '../components/charts/ActiveDaysChart'
import ActivityCompareModal from '../components/ActivityCompareModal'

const Dashboard = () => {
  const activitiesQuery = useActivities()
  const groupsQuery = useGroups()
  const [selectedWeekEnd, setSelectedWeekEnd] = useState(null)
  const statsQuery = useStats({ days: 7, weeks: 12, end: selectedWeekEnd })
  const syncMutation = useSyncActivities()
  const [runDnaActivityId, setRunDnaActivityId] = useState(null)
  const [compareIds, setCompareIds] = useState([])
  const [compareOpen, setCompareOpen] = useState(false)
  const aiMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai', { method: 'POST' })
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

  const activeDays = stats?.dailyActive ?? []
  const weekActivities = stats?.activities ?? activitiesQuery.data?.activities ?? []

  const toggleCompare = (id, checked) => {
    setCompareIds((prev) => {
      const already = prev.includes(id)
      if (checked && already) return prev
      if (!checked && !already) return prev
      if (checked) {
        if (prev.length >= 3) return prev
        return [...prev, id]
      }
      return prev.filter((value) => value !== id)
    })
  }

  const selectedActivities = compareIds
    .map((id) => weekActivities.find((a) => a.id === id))
    .filter(Boolean)

  return (
    <div className="page">
      <RunDNAModal activityId={runDnaActivityId} onClose={() => setRunDnaActivityId(null)} />
      {compareOpen && selectedActivities.length >= 2 ? (
        <ActivityCompareModal
          activities={selectedActivities}
          onClose={() => setCompareOpen(false)}
          onOpenRunDNA={(id) => {
            setCompareOpen(false)
            setRunDnaActivityId(id)
          }}
        />
      ) : null}
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Dashboard</h2>
            <p className="muted">Pick a week, then drill into your runs.</p>
          </div>
          <div className="header-actions">
            <SyncButton onSync={() => syncMutation.mutate()} isLoading={syncMutation.isLoading} />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div className="card glass">
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Activity Calendar</h3>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Select a day to lock the dashboard to that week.</p>
            </div>
            <MonthCalendar
              activities={activitiesQuery.data?.activities ?? []}
              onSelectDate={(date) => {
                const day = date.getDay()
                const diff = day === 0 ? 0 : 7 - day
                const endOfWeek = new Date(date)
                endOfWeek.setDate(endOfWeek.getDate() + diff)
                endOfWeek.setHours(23, 59, 59, 999)
                setSelectedWeekEnd(endOfWeek.toISOString())
                setCompareIds([])
              }}
            />
          </div>
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
            value={secondsToHms(current?.totalElapsedTimeSec) ?? '—'}
            helper="Elapsed time"
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
          <ActiveDaysChart data={activeDays} />
          <AIAdviceCard report={aiMutation.data?.report} onRefresh={() => aiMutation.mutate()} isLoading={aiMutation.isLoading} />
        </div>
      </section>

      <section className="section">
        <div className="grid two-col">
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
          <div className="stack">
            <DistanceChart data={stats?.trend ?? []} />
            <PaceTrendChart data={stats?.trend ?? []} />
          </div>
        </div>
      </section>

      <section className="section">
        <ActivityTable
          activities={weekActivities}
          onOpenRunDNA={setRunDnaActivityId}
          selectedIds={compareIds}
          onToggleSelect={toggleCompare}
        />
        <div className="compare-bar">
          <div className="muted">
            Selected: <strong>{compareIds.length}</strong>/3
          </div>
          <div className="compare-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setCompareIds([])}
              disabled={compareIds.length === 0}
            >
              Clear
            </button>
            <button
              type="button"
              className="button"
              onClick={() => setCompareOpen(true)}
              disabled={selectedActivities.length < 2}
            >
              Compare
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
