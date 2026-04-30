const LeaderboardTable = ({ rows = [] }) => (
  <div className="card">
    <h3>Leaderboard</h3>
    <table className="table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Runner</th>
          <th>Distance</th>
          <th>Avg Pace</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan="5">No leaderboard data yet.</td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.profile_id}>
              <td>{row.rank}</td>
              <td>{row.full_name}</td>
              <td>{row.total_distance_km} km</td>
              <td>{row.avg_pace_label}</td>
              <td>{row.total_points}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

export default LeaderboardTable
