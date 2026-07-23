export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET() {
  await initDB()
  const { rows } = await sql`
    SELECT c.*, COUNT(tc.tree_id) AS tree_count
    FROM caretakers c
    LEFT JOIN tree_caretakers tc ON tc.caretaker_id = c.id AND tc.is_active = true
    GROUP BY c.id ORDER BY c.name
  `
  return NextResponse.json(rows)
}
export async function POST(req: NextRequest) {
  const b = await req.json()
  const { rows } = await sql`
    INSERT INTO caretakers (name, mobile, email, address, whatsapp, remarks)
    VALUES (${b.name}, ${b.mobile||null}, ${b.email||null}, ${b.address||null}, ${b.whatsapp||null}, ${b.remarks||null})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}
export async function PUT(req: NextRequest) {
  const b = await req.json()
  const { rows } = await sql`
    UPDATE caretakers SET name=${b.name}, mobile=${b.mobile||null}, email=${b.email||null},
      address=${b.address||null}, whatsapp=${b.whatsapp||null}, remarks=${b.remarks||null}
    WHERE id=${b.id} RETURNING *
  `
  return NextResponse.json(rows[0])
}
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await sql`DELETE FROM caretakers WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
