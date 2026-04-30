import { formatDate, formatPace, metersToKm, secondsToHms } from '../lib/utils'

const ActivityTable = ({
  activities = [],
  onOpenRunDNA,
  selectedIds = [],
  onToggleSelect,
  maxSelect = 3,
}) => (
  <div className="card">
    <div className="card-header">
      <h3 style={{ margin: 0 }}>Runs</h3>
      <p className="muted" style={{ margin: 0 }}>
        Select up to {maxSelect} to compare · Tap row for RunDNA
      </p>
    </div>
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 44 }} />
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
              <td colSpan="10">No activities yet.</td>
            </tr>
          ) : (
            activities.map((activity) => (
              <tr
                key={activity.id}
                className={onOpenRunDNA ? 'clickable-row' : undefined}
                onClick={() => onOpenRunDNA?.(activity.id)}
              >
                <td>
                  {onToggleSelect ? (
                    <input
                      className="row-check"
                      type="checkbox"
                      checked={selectedIds.includes(activity.id)}
                      onChange={(event) => onToggleSelect(activity.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label="Select for comparison"
                    />
                  ) : null}
                </td>
                <td>{formatDate(activity.start_date)}</td>
                <td className="hide-sm">{activity.name || 'Run'}</td>
                <td>{metersToKm(activity.distance_m)} km</td>
                <td className="hide-sm">{secondsToHms(activity.elapsed_time_sec || activity.moving_time_sec) ?? '—'}</td>
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
  </div>
)

export default ActivityTable
