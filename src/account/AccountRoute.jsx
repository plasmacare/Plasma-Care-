import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { fetchCustomerAccountsEnabled } from '../lib/customerAccounts'
import AccountPage from './AccountPage'

/** /account is only reachable while the Developer panel switch is ON; otherwise it quietly sends visitors home. */
export default function AccountRoute() {
  const [enabled, setEnabled] = useState(null)
  useEffect(() => {
    fetchCustomerAccountsEnabled().then(setEnabled).catch(() => setEnabled(false))
  }, [])
  if (enabled === null) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>
  if (!enabled) return <Navigate to="/" replace />
  return <AccountPage />
}
