const EmptyState = ({ title, description, action }) => (
  <div className="card empty-state">
    <h3>{title}</h3>
    <p className="muted">{description}</p>
    {action}
  </div>
)

export default EmptyState
