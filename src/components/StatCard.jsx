const StatCard = ({ label, value, helper, trend, trendTone = 'neutral' }) => (
  <div className="card stat-card">
    <p className="stat-label">{label}</p>
    <h3 className="stat-value">{value}</h3>
    {helper && <p className="stat-helper">{helper}</p>}
    {trend && <p className={`stat-trend ${trendTone}`}>{trend}</p>}
  </div>
)

export default StatCard
