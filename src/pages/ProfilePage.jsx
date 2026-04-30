import { formatPace, secondsToHms } from '../lib/utils'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import { useProfile } from '../hooks/useProfile'

const ProfilePage = () => {
  const query = useProfile()

  if (query.isLoading) return <LoadingSpinner />
  if (query.isError) return <ErrorState message="Could not load your profile." />

  const { profile, stats } = query.data
  const current = stats?.current

  return (
    <div className="page">
      <section className="section">
        <div className="profile-header card glass" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '32px' }}>
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.full_name || 'Profile'} 
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167, 139, 250, 0.4)' }} 
            />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(167, 139, 250, 0.2)', display: 'grid', placeItems: 'center', fontSize: '32px' }}>
              {(profile?.full_name || profile?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '28px', letterSpacing: '-0.02em' }}>{profile?.full_name || profile?.username || 'Runner'}</h2>
            <p className="muted" style={{ margin: 0, fontSize: '14px' }}>Strava Athlete #{profile?.strava_athlete_id}</p>
          </div>
        </div>

        <div className="section-head">
          <h3>Last 30 Days</h3>
          <p className="muted">Recent activities snapshot.</p>
        </div>
        <div className="grid stats-grid" style={{ marginBottom: '40px' }}>
          <StatCard label="Total Distance" value={`${current?.totalDistanceKm ?? 0} km`} />
          <StatCard label="Total Runs" value={current?.totalRuns ?? 0} />
          <StatCard label="Avg Pace" value={formatPace(current?.avgPaceMinPerKm)} />
          <StatCard label="Total Time" value={secondsToHms(current?.totalElapsedTimeSec) ?? '0m'} helper="Elapsed time" />
        </div>

        <div className="section-head">
          <h3>All-Time Records</h3>
          <p className="muted">Across all your synchronized Strava history.</p>
        </div>
        <div className="grid stats-grid">
          <StatCard label="Total Time" value={secondsToHms(stats?.allTime?.totalElapsedTimeSec) ?? '0m'} helper="Elapsed time" />
          <StatCard label="Total Distance" value={`${stats?.allTime?.totalDistanceKm ?? 0} km`} helper="Lifetime" />
          <StatCard label="Total Runs" value={stats?.allTime?.totalRuns ?? 0} helper="Lifetime" />
          <StatCard label="Avg Pace" value={formatPace(stats?.allTime?.avgPaceMinPerKm)} helper="Overall average" />
          <StatCard label="Fastest Pace" value={formatPace(stats?.allTime?.fastestPaceMinPerKm)} helper="Best run pace" />
          <StatCard label="Longest Run" value={`${stats?.allTime?.longestRunKm ?? 0} km`} helper="Max distance" />
          <StatCard label="Total Elevation" value={`${Math.round(stats?.allTime?.totalElevationGainM ?? 0)} m`} helper="Climb" />
          <StatCard label="Total Points" value={Math.round(stats?.allTime?.totalPoints ?? 0)} helper="Scored points" />
          <StatCard label="Total Kudos" value={Math.round(stats?.allTime?.totalKudos ?? 0)} helper="Received" />
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
