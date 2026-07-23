'use client'
import { useState, useEffect } from 'react'

type Priority = 'high' | 'medium' | 'low'
type Status   = 'wanted' | 'sourcing' | 'acquired'

const PRIORITY_STYLE: Record<Priority, string> = {
  high:   'background:#fee2e2;color:#b91c1c;',
  medium: 'background:#fef9c3;color:#854d0e;',
  low:    'background:#dcfce7;color:#166534;',
}
const STATUS_STYLE: Record<Status, string> = {
  wanted:   'background:#e0e7ff;color:#3730a3;',
  sourcing: 'background:#ffedd5;color:#c2410c;',
  acquired: 'background:#dcfce7;color:#166534;',
}

const EMPTY = {
  id: 0, common_name: '', scientific_name: '', family: '',
  reason: '', priority: 'medium' as Priority, target_quantity: '' as string|number,
  acquisition_status: 'wanted' as Status, notes: '',
}

export default function PlantWishlistClient({ role }: { role: string }) {
  const [items, setItems] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const canEdit = role === 'admin' || role === 'volunteer'

  async function load() {
    setLoading(true)
    const data = await fetch('/api/plant-wishlist').then(r => r.json())
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = items.filter(i => {
    if (filterStatus !== 'all' && i.acquisition_status !== filterStatus) return false
    if (filterPriority !== 'all' && i.priority !== filterPriority) return false
    return true
  })

  function openAdd() {
    setForm({ ...EMPTY })
    setEditing(false)
    setModal(true)
  }
  function openEdit(item: any) {
    setForm({
      id: item.id, common_name: item.common_name, scientific_name: item.scientific_name||'',
      family: item.family||'', reason: item.reason||'', priority: item.priority,
      target_quantity: item.target_quantity||'', acquisition_status: item.acquisition_status,
      notes: item.notes||''
    })
    setEditing(true)
    setModal(true)
  }
  async function save() {
    const body = {
      ...form,
      target_quantity: form.target_quantity ? Number(form.target_quantity) : null
    }
    await fetch('/api/plant-wishlist', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setModal(false)
    load()
  }
  async function del(id: number) {
    if (!confirm('Remove from wishlist?')) return
    await fetch('/api/plant-wishlist', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    load()
  }
  async function markAcquired(item: any) {
    await fetch('/api/plant-wishlist', {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ...item, acquisition_status: 'acquired' })
    })
    load()
  }

  const counts = { wanted: 0, sourcing: 0, acquired: 0 }
  items.forEach(i => { if (counts[i.acquisition_status as Status] !== undefined) counts[i.acquisition_status as Status]++ })

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Wanted', value: counts.wanted, icon: '🌿', color: '#3730a3' },
          { label: 'Sourcing', value: counts.sourcing, icon: '🔍', color: '#c2410c' },
          { label: 'Acquired', value: counts.acquired, icon: '✅', color: '#166534' },
        ].map(c => (
          <div key={c.label} className="card" style={{textAlign:'center',padding:'1rem'}}>
            <div style={{fontSize:'1.8rem'}}>{c.icon}</div>
            <div style={{fontSize:'1.6rem',fontWeight:700,color:c.color}}>{c.value}</div>
            <div style={{fontSize:'0.78rem',color:'#666'}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['all','wanted','sourcing','acquired'] as const).map(s => (
            <button key={s} className={`filter-chip ${filterStatus===s?'active':''}`} onClick={()=>setFilterStatus(s)}>
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
          <span style={{margin:'0 4px',color:'#ccc'}}>|</span>
          {(['all','high','medium','low'] as const).map(p => (
            <button key={p} className={`filter-chip ${filterPriority===p?'active':''}`} onClick={()=>setFilterPriority(p)}>
              {p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}
        </div>
        {canEdit && <button className="btn-primary" onClick={openAdd}>+ Add Plant</button>}
      </div>

      {/* Cards */}
      {loading ? <p style={{color:'#666'}}>Loading…</p> : filtered.length === 0 ? (
        <div className="card" style={{textAlign:'center',padding:'3rem',color:'#666'}}>
          <div style={{fontSize:'2.5rem'}}>🌿</div>
          <p>No plants in wishlist yet. Start building your preferred plant catalog!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="card" style={{position:'relative'}}>
              {/* Priority badge */}
              <div style={{position:'absolute',top:'1rem',right:'1rem'}}>
                <span style={{padding:'2px 10px',borderRadius:'999px',fontSize:'0.72rem',fontWeight:700,
                  ...(Object.fromEntries(PRIORITY_STYLE[item.priority as Priority].split(';').filter(Boolean).map(s => {
                    const [k,v]=s.split(':'); return [k.trim().replace(/-([a-z])/g,(_:string,l:string)=>l.toUpperCase()), v.trim()]
                  })))
                }}>{item.priority.toUpperCase()}</span>
              </div>

              <h3 style={{marginBottom:'0.25rem',paddingRight:'5rem'}}>{item.common_name}</h3>
              {item.scientific_name && <p style={{fontSize:'0.82rem',fontStyle:'italic',color:'#666',marginBottom:'0.5rem'}}>{item.scientific_name}</p>}
              {item.family && <p style={{fontSize:'0.78rem',color:'#888',marginBottom:'0.5rem'}}>Family: {item.family}</p>}

              <div style={{marginBottom:'0.75rem'}}>
                <span style={{padding:'3px 12px',borderRadius:'999px',fontSize:'0.76rem',fontWeight:600,
                  ...(Object.fromEntries(STATUS_STYLE[item.acquisition_status as Status].split(';').filter(Boolean).map(s => {
                    const [k,v]=s.split(':'); return [k.trim().replace(/-([a-z])/g,(_:string,l:string)=>l.toUpperCase()), v.trim()]
                  })))
                }}>{item.acquisition_status}</span>
                {item.target_quantity && <span style={{marginLeft:'0.5rem',fontSize:'0.78rem',color:'#666'}}>Target: {item.target_quantity} saplings</span>}
              </div>

              {item.reason && <p style={{fontSize:'0.82rem',color:'#555',marginBottom:'0.75rem'}}>💡 {item.reason}</p>}
              {item.notes && <p style={{fontSize:'0.78rem',color:'#777',marginBottom:'0.75rem'}}>{item.notes}</p>}

              {canEdit && (
                <div className="flex gap-2 mt-auto" style={{paddingTop:'0.5rem',borderTop:'1px solid #eee'}}>
                  {item.acquisition_status !== 'acquired' && (
                    <button className="btn-secondary" style={{fontSize:'0.78rem',padding:'4px 10px'}} onClick={()=>markAcquired(item)}>✅ Acquired</button>
                  )}
                  <button className="btn-secondary" style={{fontSize:'0.78rem',padding:'4px 10px'}} onClick={()=>openEdit(item)}>Edit</button>
                  <button className="btn-danger" style={{fontSize:'0.78rem',padding:'4px 10px'}} onClick={()=>del(item.id)}>Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:'500px'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{margin:0}}>{editing ? 'Edit Plant' : 'Add to Wishlist'}</h2>
              <button onClick={()=>setModal(false)} style={{fontSize:'1.4rem',background:'none',border:'none',cursor:'pointer'}}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Common Name *</label>
                <input className="form-input" value={form.common_name} onChange={e=>setForm(f=>({...f,common_name:e.target.value}))} placeholder="e.g. Neem, Mango, Teak" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Scientific Name</label>
                  <input className="form-input" value={form.scientific_name} onChange={e=>setForm(f=>({...f,scientific_name:e.target.value}))} placeholder="e.g. Mangifera indica" />
                </div>
                <div>
                  <label className="form-label">Family</label>
                  <input className="form-input" value={form.family} onChange={e=>setForm(f=>({...f,family:e.target.value}))} placeholder="e.g. Fabaceae" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value as Priority}))}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Target Quantity</label>
                  <input type="number" min="1" className="form-input" value={form.target_quantity} onChange={e=>setForm(f=>({...f,target_quantity:e.target.value}))} placeholder="How many saplings" />
                </div>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={form.acquisition_status} onChange={e=>setForm(f=>({...f,acquisition_status:e.target.value as Status}))}>
                  <option value="wanted">Wanted</option>
                  <option value="sourcing">Sourcing</option>
                  <option value="acquired">Acquired</option>
                </select>
              </div>
              <div>
                <label className="form-label">Why Preferred</label>
                <textarea className="form-input" rows={2} value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} placeholder="e.g. Native species, medicinal value, fast growing..." />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
              </div>
              <div className="flex gap-3" style={{justifyContent:'flex-end'}}>
                <button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={save} disabled={!form.common_name}>
                  {editing ? 'Update' : 'Add to Wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
