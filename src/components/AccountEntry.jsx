import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCustomerAccountsEnabled } from '../lib/customerAccounts'

/** Homepage "My Account" button — rendered only while the Developer panel switch for customer accounts is ON. */
export default function AccountEntry() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    fetchCustomerAccountsEnabled().then(setEnabled).catch(() => {})
  }, [])
  if (!enabled) return null
  return (
    <Link to="/account" className="account-entry">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
      <span>My Account</span>
    </Link>
  )
}
