import StatCard from '../components/StatCard'

const ProfilePage = () => (
  <div className="page">
    <section className="section">
      <h2>Your profile</h2>
      <p className="muted">Strava identity and monthly stats.</p>
      <div className="grid stats-grid">
        <StatCard label="Monthly distance" value="96 km" helper="Last 30 days" />
        <StatCard label="Best pace" value="4:42 /km" helper="Fastest run" />
        <StatCard label="Runs" value="12" helper="This month" />
      </div>
    </section>
  </div>
)

export default ProfilePage
