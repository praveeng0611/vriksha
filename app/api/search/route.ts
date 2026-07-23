export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  if (q.length < 2) return NextResponse.json({ trees: [], projects: [], owners: [] })

  const pattern = `%${q}%`
  const [trees, projects, owners] = await Promise.all([
    sql`
      SELECT t.id, t.tree_code, t.health_status, s.local_name AS species_local, p.name AS project_name
      FROM trees t
      LEFT JOIN species s ON s.id = t.species_id
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.tree_code ILIKE ${pattern} OR s.local_name ILIKE ${pattern} OR t.address ILIKE ${pattern}
      LIMIT 10
    `,
    sql`SELECT id, name, state, district, status FROM projects WHERE name ILIKE ${pattern} OR district ILIKE ${pattern} LIMIT 5`,
    sql`SELECT id, name, mobile FROM owners WHERE name ILIKE ${pattern} OR mobile ILIKE ${pattern} LIMIT 5`,
  ])

  return NextResponse.json({ trees: trees.rows, projects: projects.rows, owners: owners.rows })
}
