import { useEffect, useState } from 'react'
import { fetchStaffProfiles, updateStaffProfile } from '../../lib/staffAccess'
import { ALL_TABS } from '../../lib/portalAuth.jsx'
import { logEvent } from '../../../lib/telemetry'
import { supabase } from '../../../lib/supabase'

// b2b-requests isn't assignable here — it's admin-only (the approval
// action itself is also gated server-side in the edge function).
const ASSIGNABLE_TABS = ALL_TABS.filter((t) => t !== 'b2b-requests')

const TAB_LABELS = {
  bookings: 'Bookings',
  catalog: 'Catalog',
  pages: 'Pages',
  announcements: 'Announcements',
  payments: 'Payments',
  collections: 'Collections (home-collection dispatch)',
  views: 'Views',
}

export default function StaffAccessTab() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [resettingId, setResettingId] = useState(null)
  const [notice, setNotice] = useState('')

  async function load() {
    try {
      setRows(await fetchStaffProfiles())
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function updateLocal(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function save(row) {
    setSavingId(row.id)
    setError('')
    try {
      await updateStaffProfile(row.id, {
        role: row.role,
        allowed_tabs: row.allowed_tabs,
        is_active: row.is_active,
        full_name: row.full_name,
      })
      logEvent({ type: 'staff_role_updated', source: 'admin', message: `Updated ${row.email}`, metadata: { target: row.email, role: row.role, allowed_tabs: row.allowed_tabs, is_active: row.is_active } })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  function toggleTab(row, tabKey) {
    const has = row.allowed_tabs.includes(tabKey)
    const next = has ? row.allowed_tabs.filter((t) => t !== tabKey) : [...row.allowed_tabs, tabKey]
    updateLocal(row.id, { allowed_tabs: next })
  }

  // Sends a reset-password email — admin never sees or sets the actual
  // password themselves, they just trigger the link to be sent, same
  // pattern already used for B2B "Resend invite".
  async function sendPasswordReset(row) {
    setResettingId(row.id)
    setError('')
    setNotice('')
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(row.email, {
        redirectTo: `${window.location.origin}/portal/login`,
      })
      if (err) throw err
      logEvent({ type: 'staff_password_reset_sent', source: 'admin', message: `Password reset sent to ${row.email}`, metadata: { target: row.email } })
      setNotice(`Reset link sent to ${row.email}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setResettingId(null)
    }
  }

  if (rows === null) return <div className="tab-panel">Loading…</div>

  return (
    <div className="tab-panel">
      <p style={{ marginBottom: 16, color: '#666' }}>
        To create a new login, first add a user in Supabase Dashboard → Authentication → Users
        (email + password). They'll automatically show up here as a row — set their role and tabs from this screen.
      </p>
      {error && <p className="login-error">{error}</p>}
      {notice && <p className="portal-form__hint" style={{ color: '#1B8A5A' }}>{notice}</p>}

      <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Visible tabs</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.email}</td>
              <td>
                <input
                  value={row.full_name || ''}
                  onChange={(e) => updateLocal(row.id, { full_name: e.target.value })}
                  placeholder="Full name"
                />
              </td>
              <td>
                <input
                  value={row.role}
                  onChange={(e) => updateLocal(row.id, { role: e.target.value })}
                  placeholder="admin / staff / custom label"
                  style={{ width: 140 }}
                />
              </td>
              <td>
                {row.role === 'admin' ? (
                  <span style={{ color: '#666' }}>All tabs (admin)</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ASSIGNABLE_TABS.map((t) => (
                      <label key={t} style={{ fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={row.allowed_tabs.includes(t)}
                          onChange={() => toggleTab(row, t)}
                        />{' '}
                        {TAB_LABELS[t]}
                      </label>
                    ))}
                  </div>
                )}
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={row.is_active}
                  onChange={(e) => updateLocal(row.id, { is_active: e.target.checked })}
                />
              </td>
              <td>
                <button
                  className="btn btn--primary"
                  disabled={savingId === row.id}
                  onClick={() => save(row)}
                >
                  {savingId === row.id ? 'Saving…' : 'Save'}
                </button>
                <button
                  className="btn btn--ghost"
                  style={{ marginTop: 6 }}
                  disabled={resettingId === row.id}
                  onClick={() => sendPasswordReset(row)}
                >
                  {resettingId === row.id ? '…' : 'Send password reset'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
