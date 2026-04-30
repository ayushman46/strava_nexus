import { useEffect } from 'react'
import { formatDate, formatPace, formatPaceDelta, metersToKm, secondsToHms } from '../lib/utils'
import { useActivityInsights } from '../hooks/useActivityInsights'
import LoadingSpinner from './LoadingSpinner'
import RunDNAChart from './charts/RunDNAChart'

const Metric = ({ label, value, helper }) => (
  <div className="metric">
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
    {helper && <div className="metric-helper">{helper}</div>}
  </div>
)

const RunDNAModal = ({ activityId, onClose }) => {
  const query = useActivityInsights(activityId, { enabled: Boolean(activityId) })

  useEffect(() => {
    if (!activityId) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activityId, onClose])

  if (!activityId) return null

  return (
    <div className="modal-overlay" role="dialog" aria-label="RunDNA insights" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>RunDNA</h3>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              Pace stability + heart-rate drift (from Strava streams).
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {query.isLoading ? (
          <LoadingSpinner />
        ) : query.isError ? (
          <div className="card error-state">
            <p style={{ marginTop: 0 }}>Unable to load RunDNA for this activity.</p>
            <p className="muted" style={{ marginBottom: 0 }}>
              {query.error?.message || 'Try reconnecting Strava, then re-sync.'}
            </p>
            <div className="actions" style={{ marginTop: 14 }}>
              <a className="button" href="/api/strava">Reconnect Strava</a>
            </div>
          </div>
        ) : (
          (() => {
            const payload = query.data
            const activity = payload.activity
            const insights = payload.insights
            return (
              <>
                <div className="run-head">
                  <div className="run-title">
                    <div className="run-name">{activity?.name || 'Run'}</div>
                    <div className="muted">
                      {formatDate(activity?.start_date)} · {metersToKm(activity?.distance_m)} km ·{' '}
                      {secondsToHms(activity?.moving_time_sec) ?? '—'}
                    </div>
                  </div>
                  <div className="run-type">
                    <span className="badge">{insights?.runType?.label ?? 'Unknown'}</span>
                    <span className="muted">
                      {insights?.runType?.confidence ? `${Math.round(insights.runType.confidence * 100)}%` : ''}
                    </span>
                  </div>
                </div>

                <div className="metrics-grid">
                  <Metric
                    label="Stability"
                    value={insights.stabilityScore !== null ? `${insights.stabilityScore}/100` : '—'}
                    helper="Lower pace volatility → higher score"
                  />
                  <Metric label="Avg pace" value={formatPace(insights.avgPaceMinPerKm)} helper="From streams" />
                  <Metric
                    label="Volatility"
                    value={insights.paceVolatility !== null ? `${insights.paceVolatility.toFixed(2)} min/km` : '—'}
                    helper="Std dev of pace"
                  />
                  <Metric
                    label="Split"
                    value={insights.splitDeltaMinPerKm !== null ? formatPaceDelta(insights.splitDeltaMinPerKm) : '—'}
                    helper="2nd half − 1st half"
                  />
                  <Metric
                    label="HR drift"
                    value={insights.hrDrift !== null ? `${insights.hrDrift >= 0 ? '+' : ''}${insights.hrDrift} bpm` : '—'}
                    helper="2nd half − 1st half"
                  />
                </div>

                <div className="card glass">
                  <div className="panel-title">
                    <h3>Pace & HR</h3>
                    <span className="badge">Streams</span>
                  </div>
                  <RunDNAChart pace={payload.series?.pace ?? []} hr={payload.series?.hr ?? []} />
                </div>
              </>
            )
          })()
        )}
      </div>
    </div>
  )
}

export default RunDNAModal

