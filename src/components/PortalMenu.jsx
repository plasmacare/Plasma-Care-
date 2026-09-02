import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './PortalMenu.css'

export default function PortalMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('touchstart', onClickOutside)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('touchstart', onClickOutside)
    }
  }, [])

  return (
    <div className="portal-menu" ref={ref}>
      <button className="portal-menu__trigger" onClick={() => setOpen((o) => !o)} type="button">
        <UserIcon />
        <span>Portal Login</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="portal-menu__drawer">
          <Link to="/portal/login" className="portal-menu__item" onClick={() => setOpen(false)}>
            <BriefcaseIcon />
            <div>
              <strong>B2B Partner Login</strong>
              <span>Corporate bulk bookings &amp; reports</span>
            </div>
          </Link>

          <Link to="/portal/request-access" className="portal-menu__item" onClick={() => setOpen(false)}>
            <PlusIcon />
            <div>
              <strong>New B2B partner?</strong>
              <span>Request access</span>
            </div>
          </Link>

          <div className="portal-menu__divider" />

          <Link to="/portal/login" className="portal-menu__item" onClick={() => setOpen(false)}>
            <ShieldIcon />
            <div>
              <strong>Staff / Admin Login</strong>
              <span>Internal team only</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

function UserIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
}
function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
function BriefcaseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
}
function ShieldIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /></svg>
}
function PlusIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
}
