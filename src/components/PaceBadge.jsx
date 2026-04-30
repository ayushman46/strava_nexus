import { formatPace } from '../lib/utils'

const PaceBadge = ({ pace }) => <span className="badge">{formatPace(pace)}</span>

export default PaceBadge
