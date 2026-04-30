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
          <h3>Your Cumulative Stats</h3>
          <p className="muted">Across all synchronized activities in the last 30 days.</p>
        </div>

        <div className="grid stats-grid">
          <StatCard 
            label="Total Distance" 
            value={`${current?.totalDistanceKm ?? 0} km`} 
            helper="Last 30 days" 
          />
          <StatCard 
            label="Total Runs" 
            value={current?.totalRuns ?? 0} 
            helper="Last 30 days" 
          />
          <StatCard 
            label="Avg Pace" 
            value={formatPace(current?.avgPaceMinPerKm)} 
            helper="Overall average" 
          />
          <StatCard 
            label="Fastest Pace" 
            value={formatPace(current?.fastestPaceMinPerKm)} 
            helper="Best run pace" 
          />
          <StatCard 
            label="Longest Run" 
            value={`${current?.longestRunKm ?? 0} km`} 
            helper="Max distance" 
          />
          <StatCard 
            label="Total Time" 
            value={secondsToHms(current?.totalMovingTimeSec) ?? '0m'} 
            helper="Moving time" 
          />
          <StatCard 
            label="Total Elevation" 
            value={`${Math.round(current?.totalElevationGainM ?? 0)} m`} 
            helper="Climb" 
          />
          <StatCard 
            label="Total Points" 
            value={Math.round(current?.totalPoints ?? 0)} 
            helper="Scored points" 
          />
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
