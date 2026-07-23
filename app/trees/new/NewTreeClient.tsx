'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { HealthStatus } from '@/types'

declare global {
  interface Window { L: any }
}

const HEALTH: HealthStatus[] = ['excellent','good','average','poor','dead']

export default function NewTreeClient({ user }: { user: string }) {
  const router = useRouter()
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [species, setSpecies]   = useState<any[]>([])
  const [saving, setSaving]     = useState(false)
  const [locating, setLocating] = useState(false)
  const [form, setForm]         = useState({
    tree_code: '', project_id: '', species_id: '', plantation_date: '',
    latitude: '', longitude: '', address: '',
    current_height_cm: '', health_status: 'good' as HealthStatus, health_score: '80',
    photo_url: '', gps_accuracy: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/species').then(r => r.json()),
    ]).then(([p, s]) => { setProjects(p); setSpecies(s) })
  }, [])

  // Load Leaflet map
  useEffect(() => {
    if (mapRef.current) return
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => initMap()
    document.head.appendChild(script)
    const link = document.createElement('link')
    link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  function initMap() {
    const L = window.L
    const map = L.map('tree-map').setView([20.5937, 78.9629], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)
    map.on('click', (e: any) => placeMarker(e.latlng.lat, e.latlng.lng, map))
    mapRef.current = map
  }

  function placeMarker(lat: number, lng: number, map?: any) {
    const L = window.L
    const m = map || mapRef.current
    if (!m) return
    if (markerRef.current) markerRef.current.remove()
    markerRef.current = L.marker([lat, lng], {
      icon: L.divIcon({ className: '', html: '<div style="font-size:28px;transform:translateY(-50%)">🌱</div>', iconSize: [30,30], iconAnchor: [15,30] })
    }).addTo(m)
    setForm(f => ({ ...f, latitude: lat.toFixed(7), longitude: lng.toFixed(7) }))
  }

  function getGPS() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords
        setForm(f => ({ ...f, latitude: latitude.toFixed(7), longitude: longitude.toFixed(7), gps_accuracy: accuracy.toFixed(1) }))
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 17)
          placeMarker(latitude, longitude)
        }
        setLocating(false)
      },
      () => { alert('Could not get GPS location. Please click on map or enter coordinates.'); setLocating(false) }
    )
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const body = {
      ...form,
      project_id: form.project_id ? Number(form.project_id) : null,
      species_id: form.species_id ? Number(form.species_id) : null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      current_height_cm: form.current_height_cm ? Number(form.current_height_cm) : null,
      health_score: form.health_score ? Number(form.health_score) : 80,
      gps_accuracy: form.gps_accuracy ? Number(form.gps_accuracy) : null,
    }
    const res = await fetch('/api/trees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const tree = await res.json()
      router.push(`/trees/${tree.id}`)
    } else {
      alert('Error registering tree'); setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <form onSubmit={handleSubmit}>
        {/* Map */}
        <div className="card mb-4">
          <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>📍 GPS Location</div>
          <div id="tree-map" className="map-container" style={{ height: 320, marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={getGPS} disabled={locating}>
              {locating ? '⏳ Locating…' : '📡 Use My GPS'}
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>or click on the map</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              <input className="form-input" style={{ width: 140 }} placeholder="Latitude" value={form.latitude} onChange={e => set('latitude', e.target.value)} />
              <input className="form-input" style={{ width: 140 }} placeholder="Longitude" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div style={{ fontWeight: 700, marginBottom: '1rem' }}>🌳 Tree Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tree Code (auto if blank)</label>
              <input className="form-input" placeholder="e.g. TRE-001" value={form.tree_code} onChange={e => set('tree_code', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Plantation Date</label>
              <input className="form-input" type="date" value={form.plantation_date} onChange={e => set('plantation_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Project</label>
              <select className="form-input" value={form.project_id} onChange={e => set('project_id', e.target.value)}>
                <option value="">— No project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Species</label>
              <select className="form-input" value={form.species_id} onChange={e => set('species_id', e.target.value)}>
                <option value="">— Unknown —</option>
                {species.map(s => <option key={s.id} value={s.id}>{s.local_name}{s.scientific_name ? ` (${s.scientific_name})` : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Health Status</label>
              <select className="form-input" value={form.health_status} onChange={e => set('health_status', e.target.value)}>
                {HEALTH.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Health Score (0–100)</label>
              <input className="form-input" type="number" min="0" max="100" value={form.health_score} onChange={e => set('health_score', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input className="form-input" type="number" value={form.current_height_cm} onChange={e => set('current_height_cm', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Address / Location Note</label>
              <input className="form-input" placeholder="Near village well, Plot 5, etc." value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Photo URL (optional)</label>
              <input className="form-input" type="url" placeholder="https://…" value={form.photo_url} onChange={e => set('photo_url', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Registering…' : '🌱 Register Tree'}</button>
        </div>
      </form>
    </div>
  )
}
