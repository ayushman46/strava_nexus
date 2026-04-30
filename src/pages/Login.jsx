const Login = () => (
  <div className="page">
    <section className="hero">
      <div>
        <p className="eyebrow">StrideCircle</p>
        <h1>Compete with your running group and get AI coaching after every run.</h1>
        <p className="lead">
          Connect Strava, sync runs, earn points, and share leaderboards with your crew.
        </p>
        <a className="button" href="/api/strava-auth">
          Connect Strava
        </a>
      </div>
      <div className="hero-card">
        <h3>Week at a glance</h3>
        <ul>
          <li>42.3 km total distance</li>
          <li>5:12 /km average pace</li>
          <li>+3 streak days</li>
        </ul>
      </div>
    </section>
  </div>
)

export default Login
