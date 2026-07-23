export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET() {
  await initDB()
  const { rows } = await sql`
    SELECT p.*, COUNT(t.id) AS tree_count
    FROM projects p
    LEFT JOIN trees t ON t.project_id = p.id
    GROUP BY p.id ORDER BY p.created_at DESC
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await initDB()
  const b = await req.json()
  const { rows } = await sql`
    INSERT INTO projects (name, description, plantation_date, state, district, village, sponsor, budget, target_trees, status)
    VALUES (${b.name}, ${b.description||null}, ${b.plantation_date||null}, ${b.state||null},
            ${b.district||null}, ${b.village||null}, ${b.sponsor||null},
            ${b.budget||null}, ${b.target_trees||null}, ${b.status||'active'})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest) {
  const b = await req.json()
  const { rows } = await sql`
    UPDATE projects SET name=${b.name}, description=${b.description||null}, plantation_date=${b.plantation_date||null},
      state=${b.state||null}, district=${b.district||null}, village=${b.village||null},
      sponsor=${b.sponsor||null}, budget=${b.budget||null}, target_trees=${b.target_trees||null}, status=${b.status}
    WHERE id=${b.id} RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await sql`DELETE FROM projects WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
