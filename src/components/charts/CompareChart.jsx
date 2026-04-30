import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

const CompareChart = ({ data }) => (
  <div className="card">
    <h3>Runner comparison</h3>
    <div className="chart">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis />
          <Radar name="You" dataKey="you" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
          <Radar name="Teammate" dataKey="mate" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </div>
)

export default CompareChart
