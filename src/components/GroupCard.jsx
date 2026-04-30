import { Link } from 'react-router-dom'

const GroupCard = ({ group }) => (
  <div className="card group-card">
    <div>
      <h4>{group.name}</h4>
      <p>{group.description || 'No description yet.'}</p>
      <p className="muted">Invite: {group.invite_code}</p>
    </div>
    <Link className="button" to={`/groups/${group.id}`}>
      View group
    </Link>
  </div>
)

export default GroupCard
