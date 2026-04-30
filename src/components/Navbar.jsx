import { Link } from 'react-router-dom'

const NavLink = ({ to, children }) => (
  <Link className="nav-link" to={to}>
    {children}
  </Link>
)

const Navbar = () => (
  <header className="navbar">
    <div className="brand">StrideCircle</div>
    <nav>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/groups/preview">Group</NavLink>
      <NavLink to="/compare/preview">Compare</NavLink>
      <NavLink to="/profile">Profile</NavLink>
    </nav>
  </header>
)

export default Navbar
