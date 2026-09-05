import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { logEvent } from '../../../lib/telemetry'
import { fetchAllBulkRequests, updateBulkRequestStatus } from '../../lib/b2bData'
import './collectionsTab.css'

const BULK_STATUSES = ['submitted', 'processing', 'completed', 'cancelled']

export default function B2BRequestsTab() {
  const [subTab, setSubTab] = useState('access')

  return (
    <div className="tab-panel">
      <div className="collections-subnav">
        <button className={subTab === 'access' ? 'active' : ''} onClick={() => setSubTab('access')} type="button">
          Access Requests
        </button>
        <button className={subTab === 'orders' ? 'active' : ''} onClick={() => setSubTab('orders')} type="button">
          Bulk Orders
        </button>
      </div>
      {subTab === 'access' ? <AccessRequestsPanel /> : <BulkOrdersPanel />}
    </div>
  )
}

function AccessRequestsPanel() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function load() {
    const { data, error } = await supabase
      .from('b2b_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setRows(data)
  }

  useEffect(() => {
    load()
  }, [])

  async function invite(row, { isResend } = {}) {
    setBusyId(row.id)
    setError('')
    try {
      if (isResend) {
        const siteUrl = window.location.origin + import.meta.env.BASE_URL
        const { error: resendErr } = await supabase.auth.resetPasswordForEmail(row.email, {
          redirectTo: siteUrl,
        })
        if (resendErr) throw resendErr
      } else {
        const { data: sessionData } = await supabase.auth.getSession()
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-b2b-request`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify({ request_id: row.id }),
          },
        )
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Failed to send invite')
      }
      logEvent({
        type: isResend ? 'b2b_invite_resent' : 'b2b_request_approved',
        source: 'admin',
        message: `${isResend ? 'Resent invite to' : 'Approved'} B2B request: ${row.company_name}`,
        metadata: { request_id: row.id },
      })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function reject(row) {
    setBusyId(row.id)
    setError('')
    try {
      const { error } = await supabase
        .from('b2b_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', row.id)
      if (error) throw error
      logEvent({ type: 'b2b_request_rejected', source: 'admin', message: `Rejected B2B request: ${row.company_name}`, metadata: { request_id: row.id } })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (rows === null) return <p>Loading…</p>

  const pending = rows.filter((r) => r.status === 'pending')
  const resolved = rows.filter((r) => r.status !== 'pending')

  return (
    <div>
      {error && <p className="login-error">{error}</p>}

      <h3 style={{ marginBottom: 12 }}>Pending ({pending.length})</h3>
      {pending.length === 0 && <p style={{ color: '#666' }}>No pending requests.</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Phone</th>
            <th>GSTIN</th>
            <th>Message</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pending.map((row) => (
            <tr key={row.id}>
              <td>{row.company_name}</td>
              <td>{row.contact_name}</td>
              <td>{row.email}</td>
              <td>{row.phone}</td>
              <td>{row.gstin || '—'}</td>
              <td style={{ maxWidth: 200 }}>{row.message || '—'}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--primary" disabled={busyId === row.id} onClick={() => invite(row)}>
                  {busyId === row.id ? '…' : 'Approve'}
                </button>
                <button className="btn btn--ghost" disabled={busyId === row.id} onClick={() => reject(row)}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {resolved.length > 0 && (
        <>
          <h3 style={{ margin: '24px 0 12px' }}>Past requests</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Email</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resolved.map((row) => (
                <tr key={row.id}>
                  <td>{row.company_name}</td>
                  <td>{row.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{row.status}</td>
                  <td>
                    {row.status === 'approved' && (
                      <button className="btn btn--ghost" disabled={busyId === row.id} onClick={() => invite(row, { isResend: true })}>
                        {busyId === row.id ? '…' : 'Resend invite'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

function BulkOrdersPanel() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [savingId, setSavingId] = useState(null)

  async function load() {
    try {
      setOrders(await fetchAllBulkRequests())
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function changeStatus(order, status) {
    setSavingId(order.id)
    setError('')
    try {
      await updateBulkRequestStatus(order.id, status)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  if (orders === null) return <p>Loading…</p>

  return (
    <div>
      {error && <p className="login-error">{error}</p>}
      {orders.length === 0 ? (
        <p style={{ color: '#666' }}>No bulk orders submitted yet.</p>
      ) : (
        <div className="collections-jobs">
          {orders.map((order) => {
            const isOpen = expandedId === order.id
            const company = order.b2b_accounts
            return (
              <div key={order.id} className="job-card">
                <button
                  type="button"
                  className="job-card__top"
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                >
                  <span className={`badge badge--${order.status}`}>{order.status}</span>
                  <span className="job-card__time">{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                </button>
                <div className="job-card__name">{company?.company_name || 'Unknown company'}</div>
                <div className="job-card__items">
                  {order.patients?.length || 0} patient(s)
                  {order.preferred_date ? ` — preferred ${order.preferred_date}` : ''}
                  {company?.phone ? ` — ${company.phone}` : ''}
                </div>

                {isOpen && (
                  <>
                    {order.notes && <p style={{ fontSize: 13 }}><strong>Notes:</strong> {order.notes}</p>}
                    <div className="b2b-table-wrap">
                      <table className="b2b-table">
                        <thead>
                          <tr><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Test / Package</th></tr>
                        </thead>
                        <tbody>
                          {(order.patients || []).map((p, i) => (
                            <tr key={i}>
                              <td>{p.name}</td><td>{p.age}</td><td>{p.gender}</td><td>{p.phone}</td><td>{p.test_label || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div className="job-card__primary-actions">
                  <select
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={(e) => changeStatus(order, e.target.value)}
                  >
                    {BULK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
