import DistanceChart from '../components/charts/DistanceChart'
import PaceTrendChart from '../components/charts/PaceTrendChart'

const Landing = () => {
  const mockTrend = [
    { label: 'Mar 3', distanceKm: 18.2, avgPaceMinPerKm: 5.9 },
    { label: 'Mar 10', distanceKm: 22.5, avgPaceMinPerKm: 5.7 },
    { label: 'Mar 17', distanceKm: 26.4, avgPaceMinPerKm: 5.55 },
    { label: 'Mar 24', distanceKm: 30.2, avgPaceMinPerKm: 5.38 },
    { label: 'Mar 31', distanceKm: 34.1, avgPaceMinPerKm: 5.3 },
    { label: 'Apr 7', distanceKm: 28.9, avgPaceMinPerKm: 5.25 },
  ]

  return (
    <div className="page landing">
      <section className="landing-hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Run. Rival. Repeat.</p>
            <h1>
              The <span className="text-grad">sporty</span> Strava dashboard your crew will actually open.
            </h1>
            <p className="lead">
              StrideCircle turns your runs into weekly recaps, points, and truly useful coaching — with
              RunDNA analysis for pacing and heart-rate control.
            </p>
            <div className="actions">
              <a className="button" href="/api/strava">Connect Strava</a>
              <a className="button secondary" href="/dashboard">Open dashboard</a>
            </div>
            <div className="hero-badges">
              <span className="pill">RunDNA</span>
              <span className="pill">FairPlay leaderboard</span>
              <span className="pill">Compare runs</span>
            </div>
          </div>

          <div className="hero-panels">
            <div className="card glass panel">
              <div className="panel-title">
                <h3>Weekly distance</h3>
                <span className="badge">12 weeks</span>
              </div>
              <DistanceChart data={mockTrend} variant="plain" />
            </div>
            <div className="card glass panel">
              <div className="panel-title">
                <h3>Pace trend</h3>
                <span className="badge">Weighted</span>
              </div>
              <PaceTrendChart data={mockTrend} variant="plain" />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>What makes it different</h2>
          <p className="muted">A product you can sell: measurable improvement + fair competition.</p>
        </div>
        <div className="grid three-col">
          <div className="card feature-card">
            <p className="feature-icon" aria-hidden="true">🧬</p>
            <h3>RunDNA</h3>
            <p className="muted">
              Pace stability, split delta, and heart-rate drift from Strava streams — per run.
            </p>
          </div>
          <div className="card feature-card">
            <p className="feature-icon" aria-hidden="true">⚖️</p>
            <h3>FairPlay</h3>
            <p className="muted">
              A leaderboard that rewards improvement vs your baseline — not just who runs the most.
            </p>
          </div>
          <div className="card feature-card">
            <p className="feature-icon" aria-hidden="true">🆚</p>
            <h3>Run compare</h3>
            <p className="muted">
              Select 2–3 runs and compare everything at once (pace, HR, elevation, points, kudos, achievements).
            </p>
          </div>
        </div>
      </section>

      <footer className="section footer">
        <div className="footer-inner">
          <p className="muted">© {new Date().getFullYear()} StrideCircle</p>
          <div className="footer-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/profile">Profile</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
