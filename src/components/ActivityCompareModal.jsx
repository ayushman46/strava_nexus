import { formatDate, formatPace, metersToKm, secondsToHms } from '../lib/utils'
import ActivityCompareRadar from './charts/ActivityCompareRadar'

const MetricRow = ({ label, values }) => (
  <div className="compare-row">
    <div className="compare-metric">{label}</div>
    {values.map((value, index) => (
      <div key={`${label}-${index}`} className="compare-value">
        {value}
      </div>
    ))}
  </div>
)

const ActivityCompareModal = ({ activities, onClose, onOpenRunDNA }) => {
  if (!activities?.length) return null

  const safe = activities.slice(0, 3)
  const columns = safe.map((activity, i) => ({
    key: activity.id,
    title: `Run ${i + 1}`,
    subtitle: `${formatDate(activity.start_date)} · ${metersToKm(activity.distance_m)} km`,
  }))

  return (
    <div className="modal-overlay" role="dialog" aria-label="Compare runs" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>Compare runs</h3>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              Side-by-side comparison of your selected activities.
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="card glass">
          <div className="panel-title">
            <h3>Fingerprint</h3>
            <span className="badge">Normalized</span>
          </div>
          <ActivityCompareRadar activities={safe} />
        </div>

        <div className="compare-grid card" style={{ '--compare-cols': safe.length }}>
          <div className="compare-row compare-head">
            <div />
            {columns.map((col) => (
              <div key={col.key} className="compare-colhead">
                <div className="compare-title">{col.title}</div>
                <div className="muted">{col.subtitle}</div>
                <button type="button" className="chip-button" onClick={() => onOpenRunDNA?.(col.key)}>
                  RunDNA
                </button>
              </div>
            ))}
          </div>

          <MetricRow label="Time" values={safe.map((a) => secondsToHms(a.moving_time_sec) ?? '—')} />
          <MetricRow label="Pace" values={safe.map((a) => formatPace(a.pace))} />
          <MetricRow label="Elevation" values={safe.map((a) => `${Math.round(a.total_elevation_gain ?? 0)} m`)} />
          <MetricRow label="Avg HR" values={safe.map((a) => (a.average_heartrate ? `${Math.round(a.average_heartrate)} bpm` : '—'))} />
          <MetricRow label="Points" values={safe.map((a) => Math.round(a.total_points ?? 0))} />
          <MetricRow label="Kudos" values={safe.map((a) => a.kudos_count ?? 0)} />
          <MetricRow label="Achievements" values={safe.map((a) => a.achievement_count ?? 0)} />
        </div>
      </div>
    </div>
  )
}

export default ActivityCompareModal
