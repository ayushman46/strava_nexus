import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import ActivityTable from '../components/ActivityTable'
import ActivityCompareRadar from '../components/charts/ActivityCompareRadar'
import { useActivities } from '../hooks/useActivities'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import RunDNAModal from '../components/RunDNAModal'
import { formatDate, formatPace, metersToKm, secondsToHms } from '../lib/utils'

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

const ComparePage = () => {
  const { data, isLoading, isError } = useActivities({ limit: 200 })
  const [compareIds, setCompareIds] = useState([])
  const [runDnaActivityId, setRunDnaActivityId] = useState(null)

  const aiCompareMutation = useMutation({
    mutationFn: async (activityIds) => {
      const response = await fetch('/api/ai?action=compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityIds }),
      })
      if (!response.ok) throw new Error('AI Comparison failed')
      return response.json()
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorState message="Could not load your activities." />

  const allActivities = data?.activities || []
  const selectedActivities = compareIds
    .map((id) => allActivities.find((a) => a.id === id))
    .filter(Boolean)

  const toggleCompare = (id, checked) => {
    setCompareIds((prev) => {
      if (checked && !prev.includes(id)) return [...prev, id]
      if (!checked) return prev.filter((value) => value !== id)
      return prev
    })
  }

  const columns = selectedActivities.map((activity, i) => ({
    key: activity.id,
    title: `Run ${i + 1}`,
    subtitle: `${formatDate(activity.start_date)} · ${metersToKm(activity.distance_m)} km`,
    name: activity.name || 'Run',
  }))

  return (
    <div className="page">
      <RunDNAModal activityId={runDnaActivityId} onClose={() => setRunDnaActivityId(null)} />
      
      <section className="section">
        <div className="section-header">
          <div>
            <h2>Compare Runs</h2>
            <p className="muted">Select any amount of runs to compare side-by-side.</p>
          </div>
        </div>

        <div className="card glass" style={{ marginBottom: '32px' }}>
          <ActivityTable
            activities={allActivities}
            onOpenRunDNA={setRunDnaActivityId}
            selectedIds={compareIds}
            onToggleSelect={toggleCompare}
          />
        </div>

        {selectedActivities.length > 0 && (
          <div className="compare-actions" style={{ marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Comparing {selectedActivities.length} runs</h3>
            <button
              type="button"
              className="button secondary"
              onClick={() => setCompareIds([])}
            >
              Clear Selection
            </button>
            {selectedActivities.length >= 2 && (
              <button
                type="button"
                className="button"
                onClick={() => aiCompareMutation.mutate(compareIds)}
                disabled={aiCompareMutation.isPending}
              >
                {aiCompareMutation.isPending ? 'Generating...' : 'Get AI Comparison Score'}
              </button>
            )}
          </div>
        )}

        {aiCompareMutation.data?.comparison && (
          <div className="card glass ai-score-section" style={{ marginBottom: '32px' }}>
            <div className="panel-title">
              <h3>AI Comparison Score</h3>
            </div>
            <div className="prose">
              {aiCompareMutation.data.comparison.split('\n').map((paragraph, i) => (
                <p key={i} style={{ marginBottom: '8px' }}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {selectedActivities.length > 0 && (
          <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
            <div className="compare-grid card" style={{ '--compare-cols': selectedActivities.length, minWidth: `${selectedActivities.length * 200 + 150}px` }}>
              <div className="compare-row compare-head">
                <div />
                {columns.map((col) => (
                  <div key={col.key} className="compare-colhead">
                    <div className="compare-title">{col.title}</div>
                    <div className="compare-name-sub">{col.name}</div>
                    <div className="muted">{col.subtitle}</div>
                    <button type="button" className="chip-button" onClick={() => setRunDnaActivityId(col.key)}>
                      RunDNA
                    </button>
                  </div>
                ))}
              </div>

              <MetricRow label="Name" values={selectedActivities.map((a) => a.name || 'Run')} />
              <MetricRow label="Date" values={selectedActivities.map((a) => formatDate(a.start_date))} />
              <MetricRow
                label="Distance"
                values={selectedActivities.map((a) => `${metersToKm(a.distance_m)} km`)}
                highlight
              />
              <MetricRow label="Moving Time" values={selectedActivities.map((a) => secondsToHms(a.moving_time_sec) ?? '—')} />
              <MetricRow
                label="Elapsed Time"
                values={selectedActivities.map((a) => (a.elapsed_time_sec ? secondsToHms(a.elapsed_time_sec) : secondsToHms(a.moving_time_sec)) ?? '—')}
              />
              <MetricRow label="Pace" values={selectedActivities.map((a) => formatPace(a.pace))} highlight />
              <MetricRow
                label="Avg Speed"
                values={selectedActivities.map((a) =>
                  Number.isFinite(a.average_speed) ? `${(a.average_speed * 3.6).toFixed(1)} km/h` : '—'
                )}
              />
              <MetricRow
                label="Max Speed"
                values={selectedActivities.map((a) =>
                  Number.isFinite(a.max_speed) ? `${(a.max_speed * 3.6).toFixed(1)} km/h` : '—'
                )}
              />
              <MetricRow
                label="Elevation Gain"
                values={selectedActivities.map((a) => `${Math.round(a.total_elevation_gain ?? 0)} m`)}
              />
              <MetricRow
                label="Avg HR"
                values={selectedActivities.map((a) => (a.average_heartrate ? `${Math.round(a.average_heartrate)} bpm` : '—'))}
                highlight
              />
              <MetricRow
                label="Max HR"
                values={selectedActivities.map((a) => (a.max_heartrate ? `${Math.round(a.max_heartrate)} bpm` : '—'))}
              />
              <MetricRow label="Points" values={selectedActivities.map((a) => Math.round(a.total_points ?? 0))} highlight />
              <MetricRow label="Kudos" values={selectedActivities.map((a) => a.kudos_count ?? 0)} />
              <MetricRow label="Achievements" values={selectedActivities.map((a) => a.achievement_count ?? 0)} />
              <MetricRow
                label="Efficiency"
                values={selectedActivities.map((a) => {
                  const d = Number(a.distance_m)
                  const t = Number(a.moving_time_sec)
                  return Number.isFinite(d) && Number.isFinite(t) && t > 0
                    ? `${(d / t).toFixed(2)} m/s`
                    : '—'
                })}
              />
              <MetricRow label="Type" values={selectedActivities.map((a) => a.type || 'Run')} />
            </div>
            
            {selectedActivities.length >= 3 && (
              <div className="card glass" style={{ marginTop: '32px' }}>
                <div className="panel-title">
                  <h3>Fingerprint Radar</h3>
                </div>
                <ActivityCompareRadar activities={selectedActivities.slice(0, 5)} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default ComparePage
