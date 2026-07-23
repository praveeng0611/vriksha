'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Tree, HealthStatus } from '@/types'

const HEALTH_OPTS: HealthStatus[] = ['excellent','good','average','poor','dead']

function HealthBadge({ s }: { s: string }) {
  return <span className={`health-badge health-${s}`}>{s}</span>
}

export default function TreesClient({ user, role }: { user: string; role: string }) {
  const sp = useSearchParams()
  const [trees, setTrees]     = useState<Tree[]>([])
  const [q, setQ]             = useState('')
  const [filterH, setFilterH] = useState('')
  const [filterP, setFilterP] = useState(sp.get('project_id') || '')
  const [projects, setProjects] = useState<{id:number;name:string}[]>([])
  const [toast, setToast]     = useState<{ msg: string; type: string } | null>(null)

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  function load() {
    const params = new URLSearchParams()
    if (q)       params.set('q', q)
    if (filterH) params.set('health', filterH)
    if (filterP) params.set('project_id', filterP)
    fetch(`/api/trees?${params}`).then(r => r.json()).then(setTrees)
  }

  useEffect(() => { fetch('/api/projects').then(r => r.json()).then(setProjects) }, [])
  useEffect(() => { load() }, [q, filterH, filterP])

  async function del(id: number) {
    if (!confirm('Delete this tree? This also deletes all maintenance logs and expenses.')) return
    await fetch('/api/trees', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    showToast('Tree deleted'); load()
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <input className="form-input" style={{ maxWidth: 260 }} placeholder="Search tree code or species…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="form-input" style={{ maxWidth: 200 }} value={filterH} onChange={e => setFilterH(e.target.value)}>
          <option value="">All health</option>
          {HEALTH_OPTS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <select className="form-input" style={{ maxWidth: 220 }} value={filterP} onChange={e => setFilterP(e.target.value)}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 'auto' }}>{trees.length} trees</span>
        {(role === 'admin' || role === 'volunteer') && (
          <Link href="/trees/new" className="btn btn-primary">+ Register Tree</Link>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tree ID</th>
                <th>Species</th>
                <th>Project</th>
                <th>Health</th>
                <th>Score</th>
                <th>Caretaker</th>
                <th>Planted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {trees.map(t => (
                <tr key={t.id}>
                  <td data-label="Tree ID"><Link href={`/trees/${t.id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{t.tree_code}</Link></td>
                  <td data-label="Species">{t.species_local || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td data-label="Project" style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{t.project_name || '—'}</td>
                  <td data-label="Health"><HealthBadge s={t.health_status} /></td>
                  <td data-label="Score">
                    {t.health_score != null ? (
                      <span style={{ fontWeight: 700, color: t.health_score >= 70 ? '#059669' : t.health_score >= 40 ? '#d97706' : '#dc2626' }}>{t.health_score}</span>
                    ) : '—'}
                  </td>
                  <td data-label="Caretaker" style={{ fontSize: '0.83rem' }}>{t.caretaker_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                  <td data-label="Planted" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.plantation_date ? new Date(t.plantation_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Link href={`/trees/${t.id}`} className="btn btn-ghost btn-sm">View</Link>
                      {(role === 'admin' || role === 'volunteer') && <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => del(t.id)}>🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trees.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No trees found.</div>}
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
