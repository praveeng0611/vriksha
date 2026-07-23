export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  await initDB()
  const { searchParams } = new URL(req.url)
  const project_id = searchParams.get('project_id')
  const health = searchParams.get('health')
  const q = searchParams.get('q')
  const mapOnly = searchParams.get('map') === '1'

  if (mapOnly) {
    const { rows } = await sql`
      SELECT t.id, t.tree_code, t.latitude, t.longitude, t.health_status, t.health_score,
             s.local_name AS species_local
      FROM trees t
      LEFT JOIN species s ON s.id = t.species_id
      WHERE t.latitude IS NOT NULL AND t.longitude IS NOT NULL
    `
    return NextResponse.json(rows)
  }

  let query = `
    SELECT t.*, s.local_name AS species_local, s.scientific_name AS species_scientific,
           p.name AS project_name,
           ct.name AS caretaker_name, ct.mobile AS caretaker_mobile,
           o.name AS owner_name
    FROM trees t
    LEFT JOIN species s ON s.id = t.species_id
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN tree_caretakers tc ON tc.tree_id = t.id AND tc.is_active = true
    LEFT JOIN caretakers ct ON ct.id = tc.caretaker_id
    LEFT JOIN tree_owners tow ON tow.tree_id = t.id
    LEFT JOIN owners o ON o.id = tow.owner_id
    WHERE 1=1
  `
  const params: (string | number)[] = []
  let p = 1
  if (project_id) { query += ` AND t.project_id = $${p++}`; params.push(Number(project_id)) }
  if (health)     { query += ` AND t.health_status = $${p++}`; params.push(health) }
  if (q)          { query += ` AND (t.tree_code ILIKE $${p} OR s.local_name ILIKE $${p})`; params.push(`%${q}%`); p++ }
  query += ' ORDER BY t.created_at DESC LIMIT 200'

  const { rows } = await sql.query(query, params)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await initDB()
  const user = req.headers.get('x-user') || 'system'
  const b = await req.json()

  // Auto-generate tree_code if not provided
  const code = b.tree_code || `TRE-${Date.now().toString(36).toUpperCase()}`

  const { rows } = await sql`
    INSERT INTO trees (tree_code, project_id, species_id, plantation_date, latitude, longitude,
                       gps_accuracy, address, photo_url, current_height_cm, health_status, health_score, created_by)
    VALUES (${code}, ${b.project_id||null}, ${b.species_id||null}, ${b.plantation_date||null},
            ${b.latitude||null}, ${b.longitude||null}, ${b.gps_accuracy||null}, ${b.address||null},
            ${b.photo_url||null}, ${b.current_height_cm||null}, ${b.health_status||'good'},
            ${b.health_score||80}, ${user})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest) {
  const b = await req.json()
  const { rows } = await sql`
    UPDATE trees SET project_id=${b.project_id||null}, species_id=${b.species_id||null},
      plantation_date=${b.plantation_date||null}, latitude=${b.latitude||null}, longitude=${b.longitude||null},
      address=${b.address||null}, photo_url=${b.photo_url||null}, current_height_cm=${b.current_height_cm||null},
      health_status=${b.health_status}, health_score=${b.health_score||null}, updated_at=NOW()
    WHERE id=${b.id} RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await sql`DELETE FROM trees WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
