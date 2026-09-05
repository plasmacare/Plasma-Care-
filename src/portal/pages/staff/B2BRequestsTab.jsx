import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { logEvent } from '../../../lib/telemetry'

export default function B2BRequestsTab() {
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

  if (rows === null) return <div className="tab-panel">Loading…</div>

  const pending = rows.filter((r) => r.status === 'pending')
  const resolved = rows.filter((r) => r.status !== 'pending')

  return (
    <div className="tab-panel">
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
