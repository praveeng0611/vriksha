export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET() {
  await initDB()
  const { rows } = await sql`
    SELECT * FROM plant_wishlist ORDER BY
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      common_name
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await initDB()
  const b = await req.json()
  const { rows } = await sql`
    INSERT INTO plant_wishlist
      (common_name, scientific_name, family, reason, priority, target_quantity,
       acquisition_status, notes)
    VALUES
      (${b.common_name}, ${b.scientific_name||null}, ${b.family||null},
       ${b.reason||null}, ${b.priority||'medium'}, ${b.target_quantity||null},
       ${b.acquisition_status||'wanted'}, ${b.notes||null})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest) {
  const b = await req.json()
  const { rows } = await sql`
    UPDATE plant_wishlist SET
      common_name = ${b.common_name},
      scientific_name = ${b.scientific_name||null},
      family = ${b.family||null},
      reason = ${b.reason||null},
      priority = ${b.priority},
      target_quantity = ${b.target_quantity||null},
      acquisition_status = ${b.acquisition_status},
      notes = ${b.notes||null}
    WHERE id = ${b.id}
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await sql`DELETE FROM plant_wishlist WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
