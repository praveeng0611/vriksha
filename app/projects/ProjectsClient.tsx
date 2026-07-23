'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Project, ProjectStatus } from '@/types'

const STATUSES: ProjectStatus[] = ['planning','active','completed','on_hold']
const EMPTY: Partial<Project> = { name:'', description:'', status:'active', state:'', district:'', village:'', sponsor:'', plantation_date:'', budget:undefined, target_trees:undefined }

export default function ProjectsClient({ role }: { role: string }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Project>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error' } | null>(null)

  const showToast = (msg: string, type: 'success'|'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }
  const load = () => fetch('/api/projects').then(r => r.json()).then(setProjects)
  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(EMPTY); setModal(true) }
  const openEdit = (p: Project) => { setForm(p); setModal(true) }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const method = form.id ? 'PUT' : 'POST'
    const res = await fetch('/api/projects', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { showToast(form.id ? 'Updated!' : 'Created!'); setModal(false); load() }
    else showToast('Error saving', 'error')
  }

  async function del(id: number) {
    if (!confirm('Delete this project?')) return
    await fetch('/api/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    showToast('Deleted'); load()
  }

  const set = (k: keyof Project, v: any) => setForm(f => ({ ...f, [k]: v }))
  const canEdit = role === 'admin' || role === 'volunteer'

  return (
    <div>
      {canEdit && (
        <div className="flex justify-between items-center mb-4">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{projects.length} projects</span>
          <button className="btn btn-primary" onClick={openNew}>+ New Project</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <div key={p.id} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginRight: '0.5rem' }}>{p.name}</h3>
              <span className={`badge badge-${p.status}`}>{p.status.replace('_',' ')}</span>
            </div>
            {p.description && <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: 6 }}>{p.description}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
              {p.state && <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4 }}>📍 {p.state}{p.district ? `, ${p.district}` : ''}</span>}
              {p.target_trees && <span style={{ fontSize: '0.75rem', background: '#f0f7f0', padding: '2px 8px', borderRadius: 4 }}>🌳 {p.target_trees} target</span>}
              {p.budget && <span style={{ fontSize: '0.75rem', background: '#f0f7f0', padding: '2px 8px', borderRadius: 4 }}>₹{Number(p.budget).toLocaleString('en-IN')}</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <Link href={`/trees?project_id=${p.id}`} style={{ color: 'var(--primary)', fontSize: '0.83rem', fontWeight: 600 }}>
                🌳 {p.tree_count || 0} trees →
              </Link>
              {canEdit && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                  <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => del(p.id)}>🗑️</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {projects.length === 0 && <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>No projects yet.</p>}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{form.id ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-group"><label className="form-label">Project Name *</label><input className="form-input" required value={form.name||''} onChange={e => set('name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={form.description||''} onChange={e => set('description', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">Plantation Date</label><input className="form-input" type="date" value={form.plantation_date?.slice(0,10)||''} onChange={e => set('plantation_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-input" value={form.status||'active'} onChange={e => set('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">State</label><input className="form-input" value={form.state||''} onChange={e => set('state', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">District</label><input className="form-input" value={form.district||''} onChange={e => set('district', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Village</label><input className="form-input" value={form.village||''} onChange={e => set('village', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Sponsor</label><input className="form-input" value={form.sponsor||''} onChange={e => set('sponsor', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Budget (₹)</label><input className="form-input" type="number" value={form.budget||''} onChange={e => set('budget', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Target Trees</label><input className="form-input" type="number" value={form.target_trees||''} onChange={e => set('target_trees', e.target.value)} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
