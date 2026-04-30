import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { formatPace } from '../../lib/utils'

const ActiveDaysChart = ({ data, variant = 'card' }) => {
  const tickColor = 'rgba(226,232,240,0.7)'
  const axisColor = 'rgba(148,163,184,0.25)'

  const chart = (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis
            dataKey="label"
            tick={{ fill: tickColor }}
            axisLine={{ stroke: axisColor }}
            tickLine={{ stroke: axisColor }}
          />
          <YAxis tick={{ fill: tickColor }} axisLine={{ stroke: axisColor }} tickLine={{ stroke: axisColor }} />
          <Tooltip
            formatter={(value, key, props) => {
              if (key === 'distanceKm') return [`${value} km`, 'Distance']
              if (key === 'avgPaceMinPerKm') return [formatPace(props?.payload?.avgPaceMinPerKm), 'Avg pace']
              return [value, key]
            }}
            contentStyle={{
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(148,163,184,0.25)',
              borderRadius: 14,
              color: 'rgba(234,242,255,0.95)',
            }}
          />
          <Bar dataKey="distanceKm" fill="#a78bfa" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  if (variant === 'plain') return chart

  return (
    <div className="card">
      <h3>Active days</h3>
      <p className="muted">Only the days you actually ran.</p>
      {chart}
    </div>
  )
}

export default ActiveDaysChart

