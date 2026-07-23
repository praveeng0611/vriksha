'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { HealthStatus, MaintenanceActivity, ExpenseCategory } from '@/types'

declare global { interface Window { L: any; QRCode: any } }

const HEALTH: HealthStatus[] = ['excellent','good','average','poor','dead']
const ACTIVITIES: MaintenanceActivity[] = ['watering','fertilizer','weeding','pruning','trimming','mulching','pest_control','tree_guard_repair','inspection']
const EXPENSE_CATS: ExpenseCategory[] = ['plant','transport','pit_digging','labour','water','fertilizer','tree_guard','maintenance','miscellaneous']

function HealthBadge({ s }: { s: string }) {
  return <span className={`health-badge health-${s}`}>{s}</span>
}

export default function TreeDetailClient({ id, user, role }: { id: string; user: string; role: string }) {
  const [tree, setTree]         = useState<any>(null)
  const [tab, setTab]           = useState<'info'|'maintenance'|'expenses'|'reminders'>('info')
  const [maintForm, setMaintForm] = useState({ activity: 'watering', date: new Date().toISOString().slice(0,10), done_by: '', remarks: '', next_due_date: '' })
  const [expForm, setExpForm]   = useState({ category: 'plant', date: new Date().toISOString().slice(0,10), amount: '', vendor: '', payment_mode: '', remarks: '' })
  const [remForm, setRemForm]   = useState({ activity_type: 'watering', frequency_days: '3', next_due: '', channel: 'whatsapp' })
  const [showMaint, setShowMaint] = useState(false)
  const [showExp, setShowExp]   = useState(false)
  const [showRem, setShowRem]   = useState(false)
  const [toast, setToast]       = useState<{ msg: string; type: string } | null>(null)
  const [editHealth, setEditHealth] = useState(false)
  const [newHealth, setNewHealth]   = useState<HealthStatus>('good')
  const mapRef = useRef<any>(null)

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  async function load() {
    const r = await fetch(`/api/trees/${id}`)
    const d = await r.json()
    setTree(d); setNewHealth(d.health_status)
  }
  useEffect(() => { load() }, [id])

  // Map
  useEffect(() => {
    if (!tree?.latitude || !tree?.longitude || mapRef.current) return
    const initMap = () => {
      const L = window.L
      const map = L.map('detail-map').setView([tree.latitude, tree.longitude], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)
      L.marker([tree.latitude, tree.longitude], {
        icon: L.divIcon({ className: '', html: '<div style="font-size:28px;transform:translateY(-50%)">🌳</div>', iconSize: [30,30], iconAnchor: [15,30] })
      }).addTo(map).bindPopup(`<b>${tree.tree_code}</b><br>${tree.species_local || ''}`)
      mapRef.current = map
    }
    if (window.L) { initMap(); return }
    const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = initMap; document.head.appendChild(s)
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(l)
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [tree])

  async function saveMaint(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...maintForm, tree_id: Number(id) }) })
    if (res.ok) { showToast('Maintenance logged!'); setShowMaint(false); load() }
    else showToast('Error', 'error')
  }

  async function saveExp(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...expForm, amount: Number(expForm.amount), tree_id: Number(id) }) })
    if (res.ok) { showToast('Expense recorded!'); setShowExp(false); load() }
    else showToast('Error', 'error')
  }

  async function saveRem(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...remForm, frequency_days: Number(remForm.frequency_days), tree_id: Number(id) }) })
    if (res.ok) { showToast('Reminder set!'); setShowRem(false); load() }
    else showToast('Error', 'error')
  }

  async function updateHealth() {
    await fetch('/api/trees', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...tree, health_status: newHealth }) })
    showToast('Health updated!'); setEditHealth(false); load()
  }

  async function delMaint(logId: number) {
    await fetch('/api/maintenance', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: logId }) })
    showToast('Deleted'); load()
  }

  async function delExp(expId: number) {
    await fetch('/api/expenses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: expId }) })
    showToast('Deleted'); load()
  }

  async function delRem(remId: number) {
    await fetch('/api/reminders', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: remId }) })
    showToast('Deleted'); load()
  }

  if (!tree) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading…</div>

  const canEdit = role === 'admin' || role === 'volunteer' || role === 'caretaker'
  const totalExp = tree.expenses?.reduce((s: number, e: any) => s + Number(e.amount), 0) || 0

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>🌳 {tree.tree_code}</h1>
            <HealthBadge s={tree.health_status} />
            {tree.health_score != null && (
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: tree.health_score >= 70 ? '#059669' : '#d97706' }}>
                Score: {tree.health_score}/100
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            {tree.species_local && <span>🍃 {tree.species_local}{tree.species_scientific ? ` (${tree.species_scientific})` : ''} · </span>}
            {tree.project_name && <span>📋 {tree.project_name}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/trees" className="btn btn-ghost btn-sm">← All Trees</Link>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => setEditHealth(true)}>Update Health</button>
          )}
        </div>
      </div>

      {/* Health update modal */}
      {editHealth && (
        <div className="modal-overlay" onClick={() => setEditHealth(false)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Update Health Status</h3>
            <select className="form-input" value={newHealth} onChange={e => setNewHealth(e.target.value as HealthStatus)}>
              {HEALTH.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setEditHealth(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={updateHealth}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Info cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Planted', value: tree.plantation_date ? new Date(tree.plantation_date).toLocaleDateString('en-IN') : '—' },
          { label: 'Height', value: tree.current_height_cm ? `${tree.current_height_cm} cm` : '—' },
          { label: 'Owner', value: tree.owner_name || '—' },
          { label: 'Caretaker', value: tree.caretaker_name || '—' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '0.85rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{c.label}</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Map + Photo */}
      <div style={{ display: 'grid', gridTemplateColumns: tree.latitude ? '2fr 1fr' : '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {tree.latitude && tree.longitude && (
          <div className="card p-0 overflow-hidden">
            <div id="detail-map" style={{ height: 300 }} />
            <div style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
              📍 {Number(tree.latitude).toFixed(5)}, {Number(tree.longitude).toFixed(5)}
              {tree.address && ` · ${tree.address}`}
            </div>
          </div>
        )}
        {tree.photo_url && (
          <div className="card p-0 overflow-hidden">
            <img src={tree.photo_url} alt="Tree" style={{ width: '100%', objectFit: 'cover', height: 300 }} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'info',        label: `ℹ️ Info` },
          { key: 'maintenance', label: `🔧 Maintenance (${tree.maintenance?.length || 0})` },
          { key: 'expenses',    label: `💰 Expenses (₹${totalExp.toLocaleString('en-IN')})` },
          { key: 'reminders',   label: `🔔 Reminders (${tree.reminders?.length || 0})` },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as any)}>{t.label}</button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && (
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Tree Code', value: tree.tree_code },
              { label: 'Species (Local)', value: tree.species_local || '—' },
              { label: 'Scientific Name', value: tree.species_scientific || '—' },
              { label: 'Project', value: tree.project_name || '—' },
              { label: 'Health Status', value: <HealthBadge s={tree.health_status} /> },
              { label: 'Health Score', value: tree.health_score != null ? `${tree.health_score}/100` : '—' },
              { label: 'Height', value: tree.current_height_cm ? `${tree.current_height_cm} cm` : '—' },
              { label: 'Plantation Date', value: tree.plantation_date ? new Date(tree.plantation_date).toLocaleDateString('en-IN') : '—' },
              { label: 'Owner', value: tree.owner_name || 'Unassigned' },
              { label: 'Owner Mobile', value: tree.owner_mobile || '—' },
              { label: 'Caretaker', value: tree.caretaker_name || 'Unassigned' },
              { label: 'Caretaker Mobile', value: tree.caretaker_mobile || '—' },
              { label: 'Address', value: tree.address || '—' },
              { label: 'Registered By', value: tree.created_by || '—' },
            ].map(f => (
              <div key={f.label} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.65rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontWeight: 500 }}>{f.value}</div>
              </div>
            ))}
          </div>
          {tree.care_notes && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--primary-light)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>CARE NOTES</div>
              <p style={{ fontSize: '0.875rem' }}>{tree.care_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Maintenance tab */}
      {tab === 'maintenance' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setShowMaint(true)}>+ Log Maintenance</button>
            </div>
          )}
          {(tree.maintenance || []).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No maintenance logged yet.</div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Activity</th><th>Done By</th><th>Remarks</th><th>Next Due</th><th></th></tr></thead>
                <tbody>
                  {tree.maintenance.map((m: any) => (
                    <tr key={m.id}>
                      <td data-label="Date">{new Date(m.date).toLocaleDateString('en-IN')}</td>
                      <td data-label="Activity"><span className="activity-pill">{m.activity.replace('_',' ')}</span></td>
                      <td data-label="Done By">{m.done_by || '—'}</td>
                      <td data-label="Remarks" style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{m.remarks || '—'}</td>
                      <td data-label="Next Due" style={{ fontSize: '0.83rem' }}>{m.next_due_date ? new Date(m.next_due_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{canEdit && <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => delMaint(m.id)}>🗑️</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setShowExp(true)}>+ Add Expense</button>
            </div>
          )}
          {(tree.expenses || []).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No expenses recorded yet.</div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Vendor</th><th>Mode</th><th>Remarks</th><th></th></tr></thead>
                <tbody>
                  {tree.expenses.map((e: any) => (
                    <tr key={e.id}>
                      <td data-label="Date">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                      <td data-label="Category"><span className="activity-pill">{e.category.replace('_',' ')}</span></td>
                      <td data-label="Amount" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                      <td data-label="Vendor">{e.vendor || '—'}</td>
                      <td data-label="Mode">{e.payment_mode || '—'}</td>
                      <td data-label="Remarks" style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{e.remarks || '—'}</td>
                      <td>{canEdit && <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => delExp(e.id)}>🗑️</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '0.75rem 1rem', borderTop: '2px solid var(--border)', fontWeight: 700, textAlign: 'right', color: 'var(--primary)' }}>
                Total: ₹{totalExp.toLocaleString('en-IN')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reminders tab */}
      {tab === 'reminders' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setShowRem(true)}>+ Set Reminder</button>
            </div>
          )}
          {(tree.reminders || []).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No reminders set yet.</div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="data-table">
                <thead><tr><th>Activity</th><th>Frequency</th><th>Next Due</th><th>Status</th><th>Channel</th><th></th></tr></thead>
                <tbody>
                  {tree.reminders.map((r: any) => (
                    <tr key={r.id}>
                      <td data-label="Activity"><span className="activity-pill">{r.activity_type.replace('_',' ')}</span></td>
                      <td data-label="Frequency">Every {r.frequency_days}d</td>
                      <td data-label="Next Due">{new Date(r.next_due).toLocaleDateString('en-IN')}</td>
                      <td data-label="Status">
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: r.status === 'overdue' ? '#fee2e2' : r.status === 'completed' ? '#d1fae5' : '#fef9c3', color: r.status === 'overdue' ? '#dc2626' : r.status === 'completed' ? '#059669' : '#92400e' }}>{r.status}</span>
                      </td>
                      <td data-label="Channel">{r.channel}</td>
                      <td>{canEdit && <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => delRem(r.id)}>🗑️</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Maintenance modal */}
      {showMaint && (
        <div className="modal-overlay" onClick={() => setShowMaint(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700 }}>Log Maintenance</h3>
              <button onClick={() => setShowMaint(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveMaint}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label className="form-label">Activity</label>
                  <select className="form-input" value={maintForm.activity} onChange={e => setMaintForm(f => ({ ...f, activity: e.target.value }))}>
                    {ACTIVITIES.map(a => <option key={a} value={a}>{a.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Date</label>
                  <input className="form-input" type="date" required value={maintForm.date} onChange={e => setMaintForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group"><label className="form-label">Done By</label>
                  <input className="form-input" value={maintForm.done_by} onChange={e => setMaintForm(f => ({ ...f, done_by: e.target.value }))} />
                </div>
                <div className="form-group"><label className="form-label">Next Due Date</label>
                  <input className="form-input" type="date" value={maintForm.next_due_date} onChange={e => setMaintForm(f => ({ ...f, next_due_date: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Remarks</label>
                  <textarea className="form-input" value={maintForm.remarks} onChange={e => setMaintForm(f => ({ ...f, remarks: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowMaint(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense modal */}
      {showExp && (
        <div className="modal-overlay" onClick={() => setShowExp(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700 }}>Add Expense</h3>
              <button onClick={() => setShowExp(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveExp}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-input" value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}>
                    {EXPENSE_CATS.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Date</label>
                  <input className="form-input" type="date" required value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group"><label className="form-label">Amount (₹) *</label>
                  <input className="form-input" type="number" required value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="form-group"><label className="form-label">Vendor</label>
                  <input className="form-input" value={expForm.vendor} onChange={e => setExpForm(f => ({ ...f, vendor: e.target.value }))} />
                </div>
                <div className="form-group"><label className="form-label">Payment Mode</label>
                  <select className="form-input" value={expForm.payment_mode} onChange={e => setExpForm(f => ({ ...f, payment_mode: e.target.value }))}>
                    <option value="">—</option>
                    {['Cash','UPI','Bank Transfer','Cheque','Card'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Remarks</label>
                  <input className="form-input" value={expForm.remarks} onChange={e => setExpForm(f => ({ ...f, remarks: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowExp(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminder modal */}
      {showRem && (
        <div className="modal-overlay" onClick={() => setShowRem(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700 }}>Set Reminder</h3>
              <button onClick={() => setShowRem(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={saveRem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label className="form-label">Activity</label>
                  <select className="form-input" value={remForm.activity_type} onChange={e => setRemForm(f => ({ ...f, activity_type: e.target.value }))}>
                    {ACTIVITIES.map(a => <option key={a} value={a}>{a.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Frequency (days)</label>
                  <input className="form-input" type="number" min="1" value={remForm.frequency_days} onChange={e => setRemForm(f => ({ ...f, frequency_days: e.target.value }))} />
                </div>
                <div className="form-group"><label className="form-label">First Due Date *</label>
                  <input className="form-input" type="date" required value={remForm.next_due} onChange={e => setRemForm(f => ({ ...f, next_due: e.target.value }))} />
                </div>
                <div className="form-group"><label className="form-label">Channel</label>
                  <select className="form-input" value={remForm.channel} onChange={e => setRemForm(f => ({ ...f, channel: e.target.value }))}>
                    {['whatsapp','sms','email','app'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRem(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
