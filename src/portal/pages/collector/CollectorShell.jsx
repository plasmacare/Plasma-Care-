import { NavLink, Outlet } from 'react-router-dom'
import { usePortalAuth } from '../../lib/portalAuth.jsx'
import logoIcon from '../../assets/logo-icon.png'
import '../portal.css'
import './collector.css'

export default function CollectorShell() {
  const { staffProfile, logout } = usePortalAuth()

  return (
    <div className="collector">
      <div className="collector-header">
        <div className="collector-header__brand">
          <img src={logoIcon} alt="" />
          <span>{staffProfile?.full_name || 'Collector'}</span>
        </div>
        <button className="btn btn--ghost" onClick={logout}>Logout</button>
      </div>

      <nav className="collector-nav">
        <NavLink to="/portal/collector" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Jobs
        </NavLink>
        <NavLink to="/portal/collector/history" className={({ isActive }) => (isActive ? 'active' : '')}>
          History
        </NavLink>
      </nav>

      <div className="collector-content">
        <Outlet />
      </div>
    </div>
  )
}
