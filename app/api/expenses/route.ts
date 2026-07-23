export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  await initDB()
  const { searchParams } = new URL(req.url)
  const tree_id = searchParams.get('tree_id')
  const project_id = searchParams.get('project_id')

  if (tree_id) {
    const { rows } = await sql`SELECT * FROM expenses WHERE tree_id=${Number(tree_id)} ORDER BY date DESC`
    return NextResponse.json(rows)
  }
  if (project_id) {
    const { rows } = await sql`SELECT * FROM expenses WHERE project_id=${Number(project_id)} ORDER BY date DESC`
    return NextResponse.json(rows)
  }
  const { rows } = await sql`
    SELECT e.*, t.tree_code, p.name AS project_name
    FROM expenses e
    LEFT JOIN trees t ON t.id = e.tree_id
    LEFT JOIN projects p ON p.id = e.project_id
    ORDER BY e.date DESC LIMIT 100
  `
  return NextResponse.json(rows)
}
export async function POST(req: NextRequest) {
  const user = req.headers.get('x-user') || 'system'
  const b = await req.json()
  const { rows } = await sql`
    INSERT INTO expenses (tree_id, project_id, category, date, amount, vendor, payment_mode, remarks, created_by)
    VALUES (${b.tree_id||null}, ${b.project_id||null}, ${b.category}, ${b.date},
            ${b.amount}, ${b.vendor||null}, ${b.payment_mode||null}, ${b.remarks||null}, ${user})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await sql`DELETE FROM expenses WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
