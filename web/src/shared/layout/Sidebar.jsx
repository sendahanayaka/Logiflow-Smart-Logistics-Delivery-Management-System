import { Link, NavLink } from 'react-router-dom'
import { getNavigationItems } from '../../app/navigation'
import useAuth from '../hooks/useAuth'

export default function Sidebar({ id, isOpen, onClose }) {
  const { user } = useAuth()
  const items = getNavigationItems(user?.role)
  const implementedItems = items.filter((item) => item.implemented)
  const futureItems = items.filter((item) => !item.implemented)

  return (
    <aside
      id={id}
      className={`sidebar ${isOpen ? 'is-open' : ''}`}
      aria-label="Application navigation"
    >
      <Link className="brand-lockup" to="/app" onClick={onClose}>
        <img src="/logo.png" alt="" className="brand-lockup__logo" />
        <div>
          <span className="brand-lockup__name">LogiFlow</span>
          <span className="brand-lockup__tagline">Smart logistics</span>
        </div>
      </Link>

      <nav className="sidebar__nav" aria-label="Primary navigation">
        <span className="sidebar__section-label">Platform</span>
        {implementedItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.route}
            end={item.route === '/app'}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'is-active' : ''}`
            }
          >
            <span className="sidebar__link-mark" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}

        {futureItems.length > 0 && (
          <span className="sidebar__section-label sidebar__section-label--spaced">
            Coming later
          </span>
        )}
        {futureItems.map((item) => (
          <span
            className="sidebar__link sidebar__link--disabled"
            key={item.label}
            aria-disabled="true"
          >
            <span className="sidebar__link-mark" aria-hidden="true" />
            {item.label}
            <span className="sidebar__ready">Coming later</span>
          </span>
        ))}
      </nav>

      <div className="sidebar__footer-note">
        <span>LF</span>
        <p>{user?.fullName}</p>
      </div>
    </aside>
  )
}
