'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function SearchClient() {
  const [q, setQ]       = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function search(query: string) {
    setQ(query)
    if (query.length < 2) { setResults(null); return }
    setLoading(true)
    const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    setResults(await r.json())
    setLoading(false)
  }

  const total = results ? (results.trees?.length || 0) + (results.projects?.length || 0) + (results.owners?.length || 0) : 0

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <input
          className="form-input"
          style={{ fontSize: '1.1rem', padding: '0.85rem 1.25rem', paddingLeft: '3rem' }}
          placeholder="Search tree code, species, project, owner…"
          value={q}
          onChange={e => search(e.target.value)}
          autoFocus
        />
        <span style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>🔍</span>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Searching…</p>}

      {results && !loading && (
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{total} results for "{q}"</p>

          {results.trees?.length > 0 && (
            <div className="card mb-4">
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🌳 Trees ({results.trees.length})</div>
              {results.trees.map((t: any) => (
                <Link key={t.id} href={`/trees/${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.tree_code}</span>
                  <span style={{ fontSize: '0.875rem' }}>{t.species_local || '—'}</span>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{t.project_name || ''}</span>
                  <span className={`health-badge health-${t.health_status}`}>{t.health_status}</span>
                </Link>
              ))}
            </div>
          )}

          {results.projects?.length > 0 && (
            <div className="card mb-4">
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>📋 Projects ({results.projects.length})</div>
              {results.projects.map((p: any) => (
                <Link key={p.id} href={`/trees?project_id=${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{p.state} · {p.district}</span>
                  <span className={`badge badge-${p.status}`} style={{ marginLeft: 'auto' }}>{p.status}</span>
                </Link>
              ))}
            </div>
          )}

          {results.owners?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>👤 Owners ({results.owners.length})</div>
              {results.owners.map((o: any) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700 }}>{o.name}</span>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{o.mobile || ''}</span>
                </div>
              ))}
            </div>
          )}

          {total === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No results found for "{q}".</p>}
        </div>
      )}
    </div>
  )
}
