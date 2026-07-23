import { sql, initDB } from '@/lib/db'

export default async function ScanPage({ params }: { params: { code: string } }) {
  await initDB()
  const { rows } = await sql`
    SELECT t.*, s.local_name AS species_local, s.scientific_name, p.name AS project_name,
           o.name AS owner_name, ct.name AS caretaker_name
    FROM trees t
    LEFT JOIN species s ON s.id = t.species_id
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN tree_owners tow ON tow.tree_id = t.id
    LEFT JOIN owners o ON o.id = tow.owner_id
    LEFT JOIN tree_caretakers tc ON tc.tree_id = t.id AND tc.is_active = true
    LEFT JOIN caretakers ct ON ct.id = tc.caretaker_id
    WHERE t.tree_code = ${params.code}
  `
  const tree = rows[0]

  if (!tree) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f7f0' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem' }}>❓</div>
        <h1 style={{ fontWeight: 700, marginTop: '1rem' }}>Tree Not Found</h1>
        <p style={{ color: '#5a7a5a', marginTop: '0.5rem' }}>Code: {params.code}</p>
      </div>
    </div>
  )

  const healthColor: Record<string, string> = { excellent: '#15803d', good: '#059669', average: '#d97706', poor: '#dc2626', dead: '#64748b' }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f0', padding: '1.5rem' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        {tree.photo_url && <img src={tree.photo_url} alt="Tree" style={{ width: '100%', height: 220, objectFit: 'cover' }} />}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a4d2a' }}>🌳 {tree.tree_code}</h1>
              {tree.species_local && <p style={{ color: '#5a7a5a', fontSize: '0.9rem' }}>{tree.species_local}{tree.scientific_name ? ` · ${tree.scientific_name}` : ''}</p>}
            </div>
            <span style={{ background: `${healthColor[tree.health_status]}22`, color: healthColor[tree.health_status], fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>{tree.health_status}</span>
          </div>

          {[
            { label: 'Project', value: tree.project_name },
            { label: 'Planted', value: tree.plantation_date ? new Date(tree.plantation_date).toLocaleDateString('en-IN') : null },
            { label: 'Height', value: tree.current_height_cm ? `${tree.current_height_cm} cm` : null },
            { label: 'Owner', value: tree.owner_name },
            { label: 'Caretaker', value: tree.caretaker_name },
            { label: 'Location', value: tree.address },
          ].filter(f => f.value).map(f => (
            <div key={f.label} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f7f0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5a7a5a', textTransform: 'uppercase', letterSpacing: '0.04em', width: 80, flexShrink: 0, paddingTop: 2 }}>{f.label}</span>
              <span style={{ fontWeight: 500 }}>{f.value}</span>
            </div>
          ))}

          {tree.latitude && tree.longitude && (
            <a href={`https://www.openstreetmap.org/?mlat=${tree.latitude}&mlon=${tree.longitude}&zoom=17`} target="_blank" rel="noreferrer"
              style={{ display: 'block', marginTop: '1rem', padding: '0.75rem', background: '#f0f7f0', borderRadius: 10, textAlign: 'center', textDecoration: 'none', color: '#2d7a3a', fontWeight: 700 }}>
              📍 View on Map
            </a>
          )}

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.75rem', color: '#aaa' }}>
            🌳 Vriksha Tree Management System
          </div>
        </div>
      </div>
    </div>
  )
}
