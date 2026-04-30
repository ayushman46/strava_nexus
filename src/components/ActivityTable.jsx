import { formatDate, formatPace, metersToKm } from '../lib/utils'

const ActivityTable = ({ activities = [] }) => (
  <div className="card">
    <h3>Recent runs</h3>
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Distance</th>
          <th>Pace</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {activities.length === 0 ? (
          <tr>
            <td colSpan="4">No activities yet.</td>
          </tr>
        ) : (
          activities.map((activity) => (
            <tr key={activity.id}>
              <td>{formatDate(activity.start_date)}</td>
              <td>{metersToKm(activity.distance_m)} km</td>
              <td>{formatPace(activity.pace)}</td>
              <td>{activity.total_points}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

export default ActivityTable
