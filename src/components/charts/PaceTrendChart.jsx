import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { formatPace } from '../../lib/utils'

const PaceTrendChart = ({ data }) => (
  <div className="card">
    <h3>Pace trend</h3>
    <p className="muted">Distance-weighted avg pace by week.</p>
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="label" />
          <YAxis tickFormatter={(value) => (Number.isFinite(value) ? formatPace(value).replace(' /km', '') : '—')} />
          <Tooltip
            formatter={(value) => (Number.isFinite(value) ? formatPace(value) : '—')}
            labelFormatter={(label) => `Week of ${label}`}
          />
          <Line type="monotone" dataKey="avgPaceMinPerKm" stroke="#4f46e5" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)

export default PaceTrendChart

