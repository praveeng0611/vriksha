export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  await initDB()
  const { searchParams } = new URL(req.url)
  const condition = searchParams.get('condition')
  const project_id = searchParams.get('project_id')

  let rows
  if (condition) {
    ;({ rows } = await sql`
      SELECT n.*, p.name AS project_name
      FROM nursery_inventory n
      LEFT JOIN projects p ON p.id = n.project_id
      WHERE n.condition = ${condition}
      ORDER BY n.updated_at DESC
    `)
  } else if (project_id) {
    ;({ rows } = await sql`
      SELECT n.*, p.name AS project_name
      FROM nursery_inventory n
      LEFT JOIN projects p ON p.id = n.project_id
      WHERE n.project_id = ${Number(project_id)}
      ORDER BY n.updated_at DESC
    `)
  } else {
    ;({ rows } = await sql`
      SELECT n.*, p.name AS project_name
      FROM nursery_inventory n
      LEFT JOIN projects p ON p.id = n.project_id
      ORDER BY n.updated_at DESC
    `)
  }
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await initDB()
  const user = req.headers.get('x-user') || 'system'
  const b = await req.json()
  const { rows } = await sql`
    INSERT INTO nursery_inventory
      (species_id, common_name, scientific_name, quantity, batch_name, source,
       received_date, condition, project_id, notes, created_by)
    VALUES
      (${b.species_id||null}, ${b.common_name}, ${b.scientific_name||null},
       ${b.quantity||0}, ${b.batch_name||null}, ${b.source||null},
       ${b.received_date||null}, ${b.condition||'healthy'}, ${b.project_id||null},
       ${b.notes||null}, ${user})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest) {
  const b = await req.json()
  const { rows } = await sql`
    UPDATE nursery_inventory SET
      common_name = ${b.common_name},
      scientific_name = ${b.scientific_name||null},
      quantity = ${b.quantity},
      batch_name = ${b.batch_name||null},
      source = ${b.source||null},
      received_date = ${b.received_date||null},
      condition = ${b.condition},
      project_id = ${b.project_id||null},
      notes = ${b.notes||null},
      updated_at = NOW()
    WHERE id = ${b.id}
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await sql`DELETE FROM nursery_inventory WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
