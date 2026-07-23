'use client'
import { useEffect, useState } from 'react'
import type { User, Role } from '@/types'

const ROLES: Role[] = ['admin','volunteer','caretaker','viewer']
const EMPTY = { username: '', email: '', password: '', role: 'volunteer' as Role }

export default function SettingsClient() {
  const [users, setUsers]     = useState<User[]>([])
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editId, setEditId]   = useState<number|null>(null)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState<{ msg: string; type: string } | null>(null)

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }
  const load = () => fetch('/api/users').then(r => r.json()).then(setUsers)
  useEffect(() => { load() }, [])

  const openNew = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = (u: User) => { setForm({ username: u.username, email: u.email||'', password: '', role: u.role }); setEditId(u.id); setModal(true) }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = editId
      ? await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...form }) })
      : await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { showToast(editId ? 'Updated!' : 'User created!'); setModal(false); load() }
    else { const d = await res.json(); showToast(d.error || 'Error', 'error') }
  }

  async function del(id: number) {
    if (!confirm('Delete this user?')) return
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    showToast('Deleted'); load()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const ROLE_COLORS: Record<Role, string> = { admin: '#7c3aed', volunteer: '#2563eb', caretaker: '#059669', viewer: '#64748b' }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700 }}>Users ({users.length})</h2>
          <button className="btn btn-primary" onClick={openNew}>+ Add User</button>
        </div>
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td data-label="Username" style={{ fontWeight: 700 }}>{u.username}</td>
                  <td data-label="Email" style={{ fontSize: '0.83rem' }}>{u.email || '—'}</td>
                  <td data-label="Role">
                    <span style={{ background: `${ROLE_COLORS[u.role]}22`, color: ROLE_COLORS[u.role], fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{u.role}</span>
                  </td>
                  <td data-label="Joined" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️ Edit</button>
                      <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => del(u.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role docs */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Role Permissions</div>
        {[
          { role: 'admin', desc: 'Full access: manage users, projects, trees, all data' },
          { role: 'volunteer', desc: 'Add trees, log maintenance, record expenses, view all data' },
          { role: 'caretaker', desc: 'View assigned trees, log maintenance, update reminders' },
          { role: 'viewer', desc: 'Read-only access to all data' },
        ].map(r => (
          <div key={r.role} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ background: `${ROLE_COLORS[r.role as Role]}22`, color: ROLE_COLORS[r.role as Role], fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, width: 80, textAlign: 'center', flexShrink: 0 }}>{r.role}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{r.desc}</span>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700 }}>{editId ? 'Edit User' : 'New User'}</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-group"><label className="form-label">Username *</label><input className="form-input" required value={form.username} disabled={!!editId} onChange={e => set('username', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label><input className="form-input" type="password" required={!editId} value={form.password} onChange={e => set('password', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Role</label>
                <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
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
