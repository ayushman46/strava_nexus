import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { formatPace } from '../../lib/utils'

const PaceTrendChart = ({ data, variant = 'card' }) => {
  const chart = (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(226,232,240,0.7)' }}
            axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
            tickLine={{ stroke: 'rgba(148,163,184,0.25)' }}
          />
          <YAxis
            tickFormatter={(value) => (Number.isFinite(value) ? formatPace(value).replace(' /km', '') : '—')}
            tick={{ fill: 'rgba(226,232,240,0.7)' }}
            axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
            tickLine={{ stroke: 'rgba(148,163,184,0.25)' }}
          />
          <Tooltip
            formatter={(value) => (Number.isFinite(value) ? formatPace(value) : '—')}
            labelFormatter={(label) => `Week of ${label}`}
            contentStyle={{
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(148,163,184,0.25)',
              borderRadius: 14,
              color: 'rgba(234,242,255,0.95)',
            }}
          />
          <Line type="monotone" dataKey="avgPaceMinPerKm" stroke="#38bdf8" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  if (variant === 'plain') return chart

  return (
    <div className="card">
      <h3>Pace trend</h3>
      <p className="muted">Distance-weighted avg pace by week.</p>
      {chart}
    </div>
  )
}

export default PaceTrendChart
