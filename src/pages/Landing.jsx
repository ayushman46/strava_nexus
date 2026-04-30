import DistanceChart from '../components/charts/DistanceChart'

const Landing = () => {
  const chartData = [
    { label: 'Mon', distance: 6 },
    { label: 'Tue', distance: 4 },
    { label: 'Wed', distance: 8 },
    { label: 'Thu', distance: 5 },
    { label: 'Fri', distance: 10 },
    { label: 'Sat', distance: 12 },
    { label: 'Sun', distance: 7 },
  ]

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Group challenges + AI coach</p>
          <h1>Compete with your running crew and grow faster together.</h1>
          <p className="lead">
            StrideCircle syncs Strava runs, turns them into points, and delivers coaching tips based on
            your training history.
          </p>
          <div className="actions">
            <a className="button" href="/api/strava-auth">
              Connect Strava
            </a>
            <a className="button secondary" href="/dashboard">
              View demo
            </a>
          </div>
        </div>
        <div className="hero-card">
          <h3>Weekly leaderboard</h3>
          <p>Track distance, pace, and points across your crew.</p>
          <DistanceChart data={chartData} />
        </div>
      </section>
      <section className="section">
        <div className="grid three-col">
          <div className="card">
            <h3>Group leaderboards</h3>
            <p>Weekly, monthly, and all-time rankings with fair scoring.</p>
          </div>
          <div className="card">
            <h3>Strava sync</h3>
            <p>Pull new activities on login or with a single sync button.</p>
          </div>
          <div className="card">
            <h3>AI coaching</h3>
            <p>Personalized feedback based on your latest training volume and pace.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
