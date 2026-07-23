'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Log = { id: number; tree_id: number; tree_code?: string; activity: string; date: string; done_by?: string; remarks?: string; next_due_date?: string }

const ACTIVITIES = ['watering','fertilizer','weeding','pruning','trimming','mulching','pest_control','tree_guard_repair','inspection']

export default function MaintenanceClient({ role }: { role: string }) {
  const [logs, setLogs] = useState<Log[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => { fetch('/api/maintenance').then(r => r.json()).then(setLogs) }, [])

  const filtered = filter ? logs.filter(l => l.activity === filter) : logs

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select className="form-input" style={{ maxWidth: 200 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All activities</option>
          {ACTIVITIES.map(a => <option key={a} value={a}>{a.replace('_',' ')}</option>)}
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{filtered.length} records</span>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Tree</th><th>Date</th><th>Activity</th><th>Done By</th><th>Next Due</th><th>Remarks</th></tr></thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id}>
                <td data-label="Tree"><Link href={`/trees/${l.tree_id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{l.tree_code || l.tree_id}</Link></td>
                <td data-label="Date">{new Date(l.date).toLocaleDateString('en-IN')}</td>
                <td data-label="Activity"><span className="activity-pill">{l.activity.replace('_',' ')}</span></td>
                <td data-label="Done By">{l.done_by || '—'}</td>
                <td data-label="Next Due" style={{ fontSize: '0.83rem' }}>{l.next_due_date ? new Date(l.next_due_date).toLocaleDateString('en-IN') : '—'}</td>
                <td data-label="Remarks" style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{l.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No maintenance logs yet.</div>}
      </div>
    </div>
  )
}
