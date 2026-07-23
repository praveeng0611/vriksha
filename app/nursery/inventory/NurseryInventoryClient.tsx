'use client'
import { useState, useEffect } from 'react'

const CONDITIONS = ['healthy','weak','diseased','dormant'] as const
type Cond = typeof CONDITIONS[number]

const COND_BADGE: Record<Cond, string> = {
  healthy:  'badge-excellent',
  weak:     'badge-average',
  diseased: 'badge-poor',
  dormant:  'badge-good',
}
const COND_LABEL: Record<Cond, string> = {
  healthy: '✅ Healthy', weak: '⚠️ Weak', diseased: '🔴 Diseased', dormant: '💤 Dormant'
}

const EMPTY = {
  id: 0, common_name: '', scientific_name: '', quantity: 1,
  batch_name: '', source: '', received_date: '', condition: 'healthy' as Cond,
  project_id: null as number|null, notes: '',
}

export default function NurseryInventoryClient({ role }: { role: string }) {
  const [items, setItems] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const canEdit = role === 'admin' || role === 'volunteer'

  async function load() {
    setLoading(true)
    const [inv, proj] = await Promise.all([
      fetch('/api/nursery-inventory').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ])
    setItems(Array.isArray(inv) ? inv : [])
    setProjects(Array.isArray(proj) ? proj : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.condition === filter)
  const totalSaplings = items.reduce((s, i) => s + (i.quantity || 0), 0)
  const healthyCount = items.filter(i => i.condition === 'healthy').reduce((s, i) => s + i.quantity, 0)

  function openAdd() {
    setForm({ ...EMPTY })
    setEditing(false)
    setModal(true)
  }
  function openEdit(item: any) {
    setForm({
      id: item.id, common_name: item.common_name, scientific_name: item.scientific_name||'',
      quantity: item.quantity, batch_name: item.batch_name||'', source: item.source||'',
      received_date: item.received_date ? item.received_date.slice(0,10) : '',
      condition: item.condition, project_id: item.project_id, notes: item.notes||''
    })
    setEditing(true)
    setModal(true)
  }
  async function save() {
    const url = '/api/nursery-inventory'
    const method = editing ? 'PUT' : 'POST'
    const body = { ...form, quantity: Number(form.quantity) }
    await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
    setModal(false)
    load()
  }
  async function del(id: number) {
    if (!confirm('Remove this batch?')) return
    await fetch('/api/nursery-inventory', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Saplings', value: totalSaplings, icon: '🌱' },
          { label: 'Healthy', value: healthyCount, icon: '✅' },
          { label: 'Batches', value: items.length, icon: '📦' },
          { label: 'Projects Allocated', value: new Set(items.filter(i=>i.project_id).map(i=>i.project_id)).size, icon: '📋' },
        ].map(c => (
          <div key={c.label} className="card" style={{ textAlign:'center', padding:'1rem' }}>
            <div style={{ fontSize:'1.8rem' }}>{c.icon}</div>
            <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--primary)' }}>{c.value}</div>
            <div style={{ fontSize:'0.78rem', color:'#666' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filter + Add */}
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['all', ...CONDITIONS] as const).map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`filter-chip ${filter===c ? 'active':''}`}>
              {c === 'all' ? 'All' : COND_LABEL[c as Cond]}
            </button>
          ))}
        </div>
        {canEdit && <button className="btn-primary" onClick={openAdd}>+ Add Batch</button>}
      </div>

      {/* Table */}
      {loading ? <p style={{color:'#666'}}>Loading…</p> : filtered.length === 0 ? (
        <div className="card" style={{textAlign:'center',padding:'3rem',color:'#666'}}>
          <div style={{fontSize:'2.5rem'}}>🌱</div>
          <p>No sapling batches yet. Add your first batch!</p>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead><tr>
              <th>Plant Name</th><th>Scientific Name</th><th>Qty</th>
              <th>Condition</th><th>Batch</th><th>Source</th>
              <th>Received</th><th>Project</th><th>Notes</th>
              {canEdit && <th>Actions</th>}
            </tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.common_name}</strong></td>
                  <td style={{fontStyle:'italic',color:'#666'}}>{item.scientific_name||'—'}</td>
                  <td><strong style={{color:'var(--primary)',fontSize:'1.1rem'}}>{item.quantity}</strong></td>
                  <td><span className={`health-badge ${COND_BADGE[item.condition as Cond]}`}>{item.condition}</span></td>
                  <td>{item.batch_name||'—'}</td>
                  <td>{item.source||'—'}</td>
                  <td>{item.received_date ? item.received_date.slice(0,10) : '—'}</td>
                  <td>{item.project_name||'—'}</td>
                  <td style={{maxWidth:'180px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.notes||'—'}</td>
                  {canEdit && <td>
                    <button className="btn-secondary" style={{marginRight:'0.4rem'}} onClick={()=>openEdit(item)}>Edit</button>
                    <button className="btn-danger" onClick={()=>del(item.id)}>Del</button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:'520px'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{margin:0}}>{editing ? 'Edit Batch' : 'Add Sapling Batch'}</h2>
              <button onClick={()=>setModal(false)} style={{fontSize:'1.4rem',background:'none',border:'none',cursor:'pointer'}}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Plant Name *</label>
                <input className="form-input" value={form.common_name} onChange={e=>setForm(f=>({...f,common_name:e.target.value}))} placeholder="e.g. Neem, Peepal, Banyan" />
              </div>
              <div>
                <label className="form-label">Scientific Name</label>
                <input className="form-input" value={form.scientific_name} onChange={e=>setForm(f=>({...f,scientific_name:e.target.value}))} placeholder="e.g. Azadirachta indica" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Quantity *</label>
                  <input type="number" min="0" className="form-input" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:Number(e.target.value)}))} />
                </div>
                <div>
                  <label className="form-label">Condition</label>
                  <select className="form-input" value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value as Cond}))}>
                    {CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Batch Name / ID</label>
                  <input className="form-input" value={form.batch_name} onChange={e=>setForm(f=>({...f,batch_name:e.target.value}))} placeholder="e.g. June-2026-A" />
                </div>
                <div>
                  <label className="form-label">Received Date</label>
                  <input type="date" className="form-input" value={form.received_date} onChange={e=>setForm(f=>({...f,received_date:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="form-label">Source / Supplier</label>
                <input className="form-input" value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} placeholder="e.g. Forest Dept, Local Nursery" />
              </div>
              <div>
                <label className="form-label">Allocated to Project</label>
                <select className="form-input" value={form.project_id||''} onChange={e=>setForm(f=>({...f,project_id:e.target.value?Number(e.target.value):null}))}>
                  <option value="">— Not allocated —</option>
                  {projects.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
              </div>
              <div className="flex gap-3" style={{justifyContent:'flex-end'}}>
                <button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={save} disabled={!form.common_name}>
                  {editing ? 'Update' : 'Add Batch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
