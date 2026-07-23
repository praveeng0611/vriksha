'use client'
import { useEffect, useState } from 'react'

type Person = { id: number; name: string; mobile?: string; email?: string; address?: string; whatsapp?: string; remarks?: string; tree_count?: number }
const EMPTY: Partial<Person> = { name: '', mobile: '', email: '', address: '', whatsapp: '', remarks: '' }

export default function OwnersClient({ role, endpoint, label, showTreeCount }: { role: string; endpoint: string; label: string; showTreeCount?: boolean }) {
  const [list, setList]     = useState<Person[]>([])
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState<Partial<Person>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch] = useState('')

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }
  const load = () => fetch(endpoint).then(r => r.json()).then(setList)
  useEffect(() => { load() }, [endpoint])

  const openNew  = () => { setForm(EMPTY); setModal(true) }
  const openEdit = (p: Person) => { setForm(p); setModal(true) }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const method = form.id ? 'PUT' : 'POST'
    const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { showToast(form.id ? 'Updated!' : `${label} added!`); setModal(false); load() }
    else showToast('Error', 'error')
  }

  async function del(id: number) {
    if (!confirm(`Delete this ${label.toLowerCase()}?`)) return
    await fetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    showToast('Deleted'); load()
  }

  const set = (k: keyof Person, v: string) => setForm(f => ({ ...f, [k]: v }))
  const canEdit = role === 'admin' || role === 'volunteer'
  const filtered = list.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.mobile||'').includes(search))

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder={`Search ${label.toLowerCase()}s…`} value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{filtered.length} {label.toLowerCase()}s</span>
        {canEdit && <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openNew}>+ Add {label}</button>}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>WhatsApp</th>
              <th>Email</th>
              {showTreeCount && <th>Trees</th>}
              <th>Remarks</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td data-label="Name" style={{ fontWeight: 600 }}>{p.name}</td>
                <td data-label="Mobile">{p.mobile || '—'}</td>
                <td data-label="WhatsApp">
                  {p.whatsapp
                    ? <a href={`https://wa.me/${p.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ color: '#25d366' }}>📱 {p.whatsapp}</a>
                    : '—'}
                </td>
                <td data-label="Email" style={{ fontSize: '0.83rem' }}>{p.email || '—'}</td>
                {showTreeCount && <td data-label="Trees" style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.tree_count || 0}</td>}
                <td data-label="Remarks" style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{p.remarks || '—'}</td>
                {canEdit && (
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️</button>
                      <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => del(p.id)}>🗑️</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No {label.toLowerCase()}s yet.</div>}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700 }}>{form.id ? `Edit ${label}` : `Add ${label}`}</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={save}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Name *</label><input className="form-input" required value={form.name||''} onChange={e => set('name', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Mobile</label><input className="form-input" value={form.mobile||''} onChange={e => set('mobile', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-input" value={form.whatsapp||''} onChange={e => set('whatsapp', e.target.value)} /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Email</label><input className="form-input" type="email" value={form.email||''} onChange={e => set('email', e.target.value)} /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Address</label><textarea className="form-input" value={form.address||''} onChange={e => set('address', e.target.value)} /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Remarks</label><input className="form-input" value={form.remarks||''} onChange={e => set('remarks', e.target.value)} /></div>
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
