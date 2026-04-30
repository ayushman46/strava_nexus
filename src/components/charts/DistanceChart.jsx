import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const DistanceChart = ({ data, variant = 'card' }) => {
  const chart = (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(226,232,240,0.7)' }}
            axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
            tickLine={{ stroke: 'rgba(148,163,184,0.25)' }}
          />
          <YAxis
            tick={{ fill: 'rgba(226,232,240,0.7)' }}
            axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
            tickLine={{ stroke: 'rgba(148,163,184,0.25)' }}
          />
          <Tooltip
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
      <h3>Weekly distance</h3>
      <p className="muted">Total distance by week.</p>
      {chart}
    </div>
  )
}

export default DistanceChart
