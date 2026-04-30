import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

const normalize = (values, { invert = false } = {}) => {
  const numbers = values.map((value) => (Number.isFinite(value) ? value : null))
  const present = numbers.filter((value) => value !== null)
  if (!present.length) return numbers.map(() => null)

  if (invert) {
    const min = Math.min(...present)
    return numbers.map((value) => (value === null ? null : (min / value) * 100))
  }

  const max = Math.max(...present)
  return numbers.map((value) => (value === null ? null : (value / (max || 1)) * 100))
}

const ActivityCompareRadar = ({ activities }) => {
  const distances = activities.map((a) => (Number.isFinite(a?.distance_m) ? Number(a.distance_m) / 1000 : null))
  const paces = activities.map((a) => (Number.isFinite(a?.pace) ? a.pace : null))
  const elevations = activities.map((a) =>
    Number.isFinite(a?.total_elevation_gain) ? Number(a.total_elevation_gain) : null,
  )
  const points = activities.map((a) => (Number.isFinite(a?.total_points) ? Number(a.total_points) : null))
  const hrs = activities.map((a) => (Number.isFinite(a?.average_heartrate) ? Number(a.average_heartrate) : null))

  const distN = normalize(distances)
  const paceN = normalize(paces, { invert: true })
  const elevN = normalize(elevations)
  const ptsN = normalize(points)
  const hrN = normalize(hrs, { invert: true })

  const chartData = [
    { metric: 'Distance', one: distN[0], two: distN[1], three: distN[2] },
    { metric: 'Pace', one: paceN[0], two: paceN[1], three: paceN[2] },
    { metric: 'Elevation', one: elevN[0], two: elevN[1], three: elevN[2] },
    { metric: 'Points', one: ptsN[0], two: ptsN[1], three: ptsN[2] },
    { metric: 'HR', one: hrN[0], two: hrN[1], three: hrN[2] },
  ]

  const tickColor = 'rgba(226,232,240,0.72)'
  const axisColor = 'rgba(148,163,184,0.25)'

  return (
    <div className="chart chart-tall">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid stroke={axisColor} />
          <PolarAngleAxis dataKey="metric" tick={{ fill: tickColor, fontSize: 12 }} />
          <PolarRadiusAxis tick={false} axisLine={{ stroke: axisColor }} />
          {activities[0] && <Radar name="Run 1" dataKey="one" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.25} />}
          {activities[1] && <Radar name="Run 2" dataKey="two" stroke="#22c55e" fill="#22c55e" fillOpacity={0.18} />}
          {activities[2] && <Radar name="Run 3" dataKey="three" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.18} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ActivityCompareRadar
