const LeaderboardTable = ({ rows = [], mode = 'classic' }) => (
  <div className="card">
    <h3>{mode === 'fairplay' ? 'FairPlay leaderboard' : 'Leaderboard'}</h3>
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Runner</th>
            <th>Distance</th>
            <th className="hide-sm">Avg Pace</th>
            {mode === 'fairplay' ? (
              <>
                <th>FairPlay</th>
                <th className="hide-sm">Pace Δ</th>
                <th className="hide-sm">Dist Δ</th>
              </>
            ) : (
              <th>Points</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={mode === 'fairplay' ? 7 : 5}>No leaderboard data yet.</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.profile_id}>
                <td>{row.rank}</td>
                <td>{row.full_name}</td>
                <td>{row.total_distance_km} km</td>
                <td className="hide-sm">{row.avg_pace_label}</td>
                {mode === 'fairplay' ? (
                  <>
                    <td>{row.fairplay_score}</td>
                    <td className="hide-sm">{row.pace_improvement_pct >= 0 ? '+' : ''}{row.pace_improvement_pct}%</td>
                    <td className="hide-sm">{row.distance_improvement_pct >= 0 ? '+' : ''}{row.distance_improvement_pct}%</td>
                  </>
                ) : (
                  <td>{row.total_points}</td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)

export default LeaderboardTable
