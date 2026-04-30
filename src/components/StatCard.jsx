const StatCard = ({ label, value, helper }) => (
  <div className="card stat-card">
    <p className="stat-label">{label}</p>
    <h3 className="stat-value">{value}</h3>
    {helper && <p className="stat-helper">{helper}</p>}
  </div>
)

export default StatCard
