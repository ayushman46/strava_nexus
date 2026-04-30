import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const buildNavItems = () => [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/groups/preview', label: 'Group' },
  { to: '/compare', label: 'Compare' },
  { to: '/profile', label: 'Profile' },
]

const Navbar = () => {
  const navItems = useMemo(() => buildNavItems(), [])
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="navbar-inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">◎</span>
          <span>StrideCircle</span>
        </Link>

        <nav className="nav-desktop" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
          <a className="nav-cta" href="/api/strava">Connect</a>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="nav-toggle-icon" aria-hidden="true" />
        </button>
      </div>

      <div className={`nav-mobile${menuOpen ? ' open' : ''}`} role="dialog" aria-label="Navigation menu">
        <div className="nav-mobile-panel">
          <div className="nav-mobile-header">
            <span className="nav-mobile-title">Navigate</span>
            <button
              type="button"
              className="icon-button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="nav-mobile-links">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) => `nav-mobile-link${isActive ? ' active' : ''}`}
                to={item.to}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-mobile-footer">
            <a className="button" href="/api/strava">Connect Strava</a>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
