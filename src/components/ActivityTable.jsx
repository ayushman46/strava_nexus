import { formatDate, formatPace, metersToKm, secondsToHms } from '../lib/utils'

const ActivityTable = ({ activities = [] }) => (
  <div className="card">
    <h3>Recent runs</h3>
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th className="hide-sm">Name</th>
          <th>Distance</th>
          <th className="hide-sm">Time</th>
          <th>Pace</th>
          <th className="hide-sm">Elev</th>
          <th className="hide-sm">Kudos</th>
          <th className="hide-sm">Ach</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {activities.length === 0 ? (
          <tr>
            <td colSpan="9">No activities yet.</td>
          </tr>
        ) : (
          activities.map((activity) => (
            <tr key={activity.id}>
              <td>{formatDate(activity.start_date)}</td>
              <td className="hide-sm">{activity.name || 'Run'}</td>
              <td>{metersToKm(activity.distance_m)} km</td>
              <td className="hide-sm">{secondsToHms(activity.moving_time_sec) ?? '—'}</td>
              <td>{formatPace(activity.pace)}</td>
              <td className="hide-sm">{Math.round(activity.total_elevation_gain ?? 0)} m</td>
              <td className="hide-sm">{activity.kudos_count ?? 0}</td>
              <td className="hide-sm">{activity.achievement_count ?? 0}</td>
              <td>{activity.total_points}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

export default ActivityTable
