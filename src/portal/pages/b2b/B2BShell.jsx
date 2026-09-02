import { NavLink, Outlet } from 'react-router-dom'
import { usePortalAuth } from '../../lib/portalAuth.jsx'
import logoIcon from '../../assets/logo-icon.png'
import '../portal.css'

export default function B2BShell() {
  const { b2bAccount, logout } = usePortalAuth()

  return (
    <div className="b2b">
      <div className="b2b-header">
        <div className="b2b-header__brand">
          <img src={logoIcon} alt="" />
          <span>{b2bAccount?.company_name || 'B2B Partner'}</span>
        </div>
        <button className="btn btn--ghost" onClick={logout}>Logout</button>
      </div>

      <nav className="b2b-nav">
        <NavLink to="/portal/b2b" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/portal/b2b/bulk-add" className={({ isActive }) => (isActive ? 'active' : '')}>
          Bulk Add
        </NavLink>
        <NavLink to="/portal/b2b/history" className={({ isActive }) => (isActive ? 'active' : '')}>
          History
        </NavLink>
      </nav>

      <div className="b2b-content">
        <Outlet />
      </div>
    </div>
  )
}
