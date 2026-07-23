'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Reminder = { id: number; tree_id: number; tree_code?: string; activity_type: string; frequency_days: number; next_due: string; status: string; channel: string }

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  overdue:   { bg: '#fee2e2', color: '#dc2626' },
  pending:   { bg: '#fef9c3', color: '#92400e' },
  completed: { bg: '#d1fae5', color: '#059669' },
  skipped:   { bg: '#f1f5f9', color: '#64748b' },
}

export default function RemindersClient({ role }: { role: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [filter, setFilter]       = useState('pending')
  const [saving, setSaving]       = useState<number | null>(null)
  const [toast, setToast]         = useState<{ msg: string; type: string } | null>(null)

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  async function load(s?: string) {
    const st = s ?? filter
    const r = await fetch(`/api/reminders?status=${st === 'all' ? '' : st}`)
    setReminders(await r.json())
  }
  useEffect(() => { load() }, [filter])

  async function markDone(rem: Reminder) {
    setSaving(rem.id)
    const nextDue = new Date()
    nextDue.setDate(nextDue.getDate() + rem.frequency_days)
    await fetch('/api/reminders', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rem.id, status: 'completed', next_due: nextDue.toISOString().slice(0,10) })
    })
    setSaving(null); showToast('Marked complete!'); load()
  }

  async function skip(rem: Reminder) {
    await fetch('/api/reminders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: rem.id, status: 'skipped', next_due: rem.next_due }) })
    showToast('Skipped'); load()
  }

  const overdue = reminders.filter(r => r.status === 'overdue').length

  return (
    <div>
      {overdue > 0 && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: '0.75rem 1.25rem', marginBottom: '1rem', color: '#dc2626', fontWeight: 600 }}>
          ⚠️ {overdue} overdue reminder{overdue > 1 ? 's' : ''} require attention!
        </div>
      )}

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all','pending','overdue','completed','skipped'].map(s => (
          <button key={s} onClick={() => { setFilter(s); load(s) }}
            style={{ padding: '0.35rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem',
              background: filter === s ? 'var(--primary)' : 'var(--surface)',
              color: filter === s ? 'white' : 'var(--text-muted)' }}>
            {s === 'overdue' && '⚠️ '}{s}
          </button>
        ))}
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 4, alignSelf: 'center' }}>{reminders.length} reminders</span>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Tree</th><th>Activity</th><th>Next Due</th><th>Frequency</th><th>Status</th><th>Channel</th>{(role === 'admin' || role === 'volunteer' || role === 'caretaker') && <th>Action</th>}</tr>
          </thead>
          <tbody>
            {reminders.map(r => {
              const sc = STATUS_COLORS[r.status] || STATUS_COLORS.pending
              const isOverdue = r.status === 'overdue'
              return (
                <tr key={r.id} style={isOverdue ? { background: '#fff5f5' } : undefined}>
                  <td data-label="Tree"><Link href={`/trees/${r.tree_id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{r.tree_code || r.tree_id}</Link></td>
                  <td data-label="Activity"><span className="activity-pill">{r.activity_type.replace('_',' ')}</span></td>
                  <td data-label="Next Due" style={{ fontWeight: isOverdue ? 700 : 400, color: isOverdue ? '#dc2626' : undefined }}>
                    {new Date(r.next_due).toLocaleDateString('en-IN')}
                    {isOverdue && <span style={{ marginLeft: 6, fontSize: '0.72rem' }}>OVERDUE</span>}
                  </td>
                  <td data-label="Frequency">Every {r.frequency_days}d</td>
                  <td data-label="Status"><span style={{ ...sc, fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{r.status}</span></td>
                  <td data-label="Channel">{r.channel}</td>
                  {(role === 'admin' || role === 'volunteer' || role === 'caretaker') && (
                    <td>
                      {(r.status === 'pending' || r.status === 'overdue') && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-sm" style={{ background: '#d1fae5', color: '#059669' }} onClick={() => markDone(r)} disabled={saving === r.id}>
                            {saving === r.id ? '…' : '✓ Done'}
                          </button>
                          <button className="btn btn-sm" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={() => skip(r)}>Skip</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {reminders.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No reminders for this filter.</div>}
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
