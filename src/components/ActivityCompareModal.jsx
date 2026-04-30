import { useState } from 'react'
import { formatDate, formatPace, metersToKm, secondsToHms } from '../lib/utils'
import ActivityCompareRadar from './charts/ActivityCompareRadar'

const MetricRow = ({ label, values, unit = '', highlight = false }) => (
  <div className={`compare-row${highlight ? ' compare-row-highlight' : ''}`}>
    <div className="compare-metric">{label}</div>
    {values.map((value, index) => (
      <div key={`${label}-${index}`} className="compare-value">
        {value}{unit && value !== '—' ? ` ${unit}` : ''}
      </div>
    ))}
  </div>
)

const getWinner = (values, { lowerIsBetter = false } = {}) => {
  const nums = values.map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : null))
  const valid = nums.filter((v) => v !== null)
  if (valid.length < 2) return null
  const best = lowerIsBetter ? Math.min(...valid) : Math.max(...valid)
  return nums.indexOf(best)
}

const computeAIScore = (activities) => {
  const scores = activities.map(() => ({ positives: [], score: 0 }))
  const checks = [
    {
      key: 'distance_m',
      label: 'Longer distance',
      lowerIsBetter: false,
      format: (v) => `${metersToKm(v)} km`,
    },
    {
      key: 'pace',
      label: 'Faster pace',
      lowerIsBetter: true,
      format: (v) => formatPace(v),
    },
    {
      key: 'total_elevation_gain',
      label: 'More elevation gain',
      lowerIsBetter: false,
      format: (v) => `${Math.round(v)} m`,
    },
    {
      key: 'total_points',
      label: 'Higher points scored',
      lowerIsBetter: false,
      format: (v) => `${Math.round(v)} pts`,
    },
    {
      key: 'moving_time_sec',
      label: 'Longer effort duration',
      lowerIsBetter: false,
      format: (v) => secondsToHms(v),
    },
    {
      key: 'kudos_count',
      label: 'More kudos received',
      lowerIsBetter: false,
      format: (v) => `${v} kudos`,
    },
    {
      key: 'achievement_count',
      label: 'More achievements unlocked',
      lowerIsBetter: false,
      format: (v) => `${v} achievements`,
    },
    {
      key: 'average_heartrate',
      label: 'Better cardiac efficiency (lower avg HR)',
      lowerIsBetter: true,
      format: (v) => `${Math.round(v)} bpm`,
    },
  ]

  for (const check of checks) {
    const values = activities.map((a) => {
      const v = a?.[check.key]
      return typeof v === 'number' && Number.isFinite(v) ? v : null
    })
    const winner = getWinner(values, { lowerIsBetter: check.lowerIsBetter })
    if (winner !== null) {
      scores[winner].positives.push({
        label: check.label,
        value: check.format(values[winner]),
      })
      scores[winner].score += 1
    }
  }

  // Efficiency check: distance per time
  const efficiencies = activities.map((a) => {
    const d = Number(a?.distance_m)
    const t = Number(a?.moving_time_sec)
    return Number.isFinite(d) && Number.isFinite(t) && t > 0 ? d / t : null
  })
  const effWinner = getWinner(efficiencies)
  if (effWinner !== null) {
    scores[effWinner].positives.push({
      label: 'Higher running efficiency (m/s)',
      value: `${efficiencies[effWinner].toFixed(2)} m/s`,
    })
    scores[effWinner].score += 1
  }

  // Pace multiplier value
  const paceMultipliers = activities.map((a) => {
    const pace = a?.pace
    if (!Number.isFinite(pace)) return null
    if (pace < 4.5) return 1.6
    if (pace < 5) return 1.4
    if (pace < 6) return 1.25
    if (pace < 7) return 1.1
    return 1
  })
  const multWinner = getWinner(paceMultipliers)
  if (multWinner !== null) {
    scores[multWinner].positives.push({
      label: 'Better pace multiplier bonus',
      value: `${paceMultipliers[multWinner]}x`,
    })
    scores[multWinner].score += 1
  }

  const totalChecks = checks.length + 2
  return scores.map((s) => ({
    ...s,
    percentage: Math.round((s.score / totalChecks) * 100),
  }))
}

const ActivityCompareModal = ({ activities, onClose, onOpenRunDNA }) => {
  const [showAI, setShowAI] = useState(true)

  if (!activities?.length) return null

  const safe = activities.slice(0, 3)
  const columns = safe.map((activity, i) => ({
    key: activity.id,
    title: `Run ${i + 1}`,
    subtitle: `${formatDate(activity.start_date)} · ${metersToKm(activity.distance_m)} km`,
    name: activity.name || 'Run',
  }))

  const aiScores = computeAIScore(safe)
  const colors = ['#a78bfa', '#22c55e', '#38bdf8']

  return (
    <div className="modal-overlay" role="dialog" aria-label="Compare runs" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>Compare runs</h3>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              Complete side-by-side analysis of your selected activities.
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* AI Score Section */}
        <div className="card glass ai-score-section">
          <div className="panel-title">
            <h3>AI Analysis Score</h3>
            <button
              type="button"
              className="chip-button"
              onClick={() => setShowAI((v) => !v)}
            >
              {showAI ? 'Hide' : 'Show'}
            </button>
          </div>
          {showAI && (
            <div className="ai-score-grid">
              {aiScores.map((score, idx) => (
                <div key={columns[idx].key} className="ai-score-card" style={{ '--score-color': colors[idx] }}>
                  <div className="ai-score-header">
                    <span className="ai-score-label">{columns[idx].title}</span>
                    <span className="ai-score-name">{columns[idx].name}</span>
                  </div>
                  <div className="ai-score-ring">
                    <svg viewBox="0 0 100 100" className="ai-ring-svg">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke={colors[idx]}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${score.percentage * 2.64} 264`}
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dasharray 600ms ease' }}
                      />
                    </svg>
                    <span className="ai-ring-value">{score.percentage}%</span>
                  </div>
                  <div className="ai-positives">
                    {score.positives.length === 0 ? (
                      <span className="muted" style={{ fontSize: 12 }}>No winning metrics</span>
                    ) : (
                      score.positives.map((p) => (
                        <div key={p.label} className="ai-positive-item">
                          <span className="ai-positive-check" style={{ color: colors[idx] }}>✓</span>
                          <span className="ai-positive-label">{p.label}</span>
                          <span className="ai-positive-value">{p.value}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="card glass">
          <div className="panel-title">
            <h3>Fingerprint</h3>
            <span className="badge">Normalized</span>
          </div>
          <ActivityCompareRadar activities={safe} />
        </div>

        {/* Full Data Grid */}
        <div className="compare-grid card" style={{ '--compare-cols': safe.length }}>
          <div className="compare-row compare-head">
            <div />
            {columns.map((col) => (
              <div key={col.key} className="compare-colhead">
                <div className="compare-title">{col.title}</div>
                <div className="compare-name-sub">{col.name}</div>
                <div className="muted">{col.subtitle}</div>
                <button type="button" className="chip-button" onClick={() => onOpenRunDNA?.(col.key)}>
                  RunDNA
                </button>
              </div>
            ))}
          </div>

          <MetricRow label="Name" values={safe.map((a) => a.name || 'Run')} />
          <MetricRow label="Date" values={safe.map((a) => formatDate(a.start_date))} />
          <MetricRow
            label="Distance"
            values={safe.map((a) => `${metersToKm(a.distance_m)} km`)}
            highlight
          />
          <MetricRow label="Moving Time" values={safe.map((a) => secondsToHms(a.moving_time_sec) ?? '—')} />
          <MetricRow
            label="Elapsed Time"
            values={safe.map((a) => (a.elapsed_time_sec ? secondsToHms(a.elapsed_time_sec) : secondsToHms(a.moving_time_sec)) ?? '—')}
          />
          <MetricRow label="Pace" values={safe.map((a) => formatPace(a.pace))} highlight />
          <MetricRow
            label="Avg Speed"
            values={safe.map((a) =>
              Number.isFinite(a.average_speed) ? `${(a.average_speed * 3.6).toFixed(1)} km/h` : '—'
            )}
          />
          <MetricRow
            label="Max Speed"
            values={safe.map((a) =>
              Number.isFinite(a.max_speed) ? `${(a.max_speed * 3.6).toFixed(1)} km/h` : '—'
            )}
          />
          <MetricRow
            label="Elevation Gain"
            values={safe.map((a) => `${Math.round(a.total_elevation_gain ?? 0)} m`)}
          />
          <MetricRow
            label="Avg HR"
            values={safe.map((a) => (a.average_heartrate ? `${Math.round(a.average_heartrate)} bpm` : '—'))}
            highlight
          />
          <MetricRow
            label="Max HR"
            values={safe.map((a) => (a.max_heartrate ? `${Math.round(a.max_heartrate)} bpm` : '—'))}
          />
          <MetricRow
            label="Calories"
            values={safe.map((a) => (a.calories ? `${Math.round(a.calories)} kcal` : '—'))}
          />
          <MetricRow label="Points" values={safe.map((a) => Math.round(a.total_points ?? 0))} highlight />
          <MetricRow
            label="Pace Multiplier"
            values={safe.map((a) => {
              const p = a.pace
              if (!Number.isFinite(p)) return '—'
              if (p < 4.5) return '1.6x'
              if (p < 5) return '1.4x'
              if (p < 6) return '1.25x'
              if (p < 7) return '1.1x'
              return '1x'
            })}
          />
          <MetricRow label="Kudos" values={safe.map((a) => a.kudos_count ?? 0)} />
          <MetricRow label="Achievements" values={safe.map((a) => a.achievement_count ?? 0)} />
          <MetricRow
            label="Efficiency"
            values={safe.map((a) => {
              const d = Number(a.distance_m)
              const t = Number(a.moving_time_sec)
              return Number.isFinite(d) && Number.isFinite(t) && t > 0
                ? `${(d / t).toFixed(2)} m/s`
                : '—'
            })}
          />
          <MetricRow label="Type" values={safe.map((a) => a.type || 'Run')} />
        </div>
      </div>
    </div>
  )
}

export default ActivityCompareModal
