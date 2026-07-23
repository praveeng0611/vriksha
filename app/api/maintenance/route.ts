export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  await initDB()
  const { searchParams } = new URL(req.url)
  const tree_id = searchParams.get('tree_id')
  if (tree_id) {
    const { rows } = await sql`SELECT * FROM maintenance_logs WHERE tree_id=${Number(tree_id)} ORDER BY date DESC`
    return NextResponse.json(rows)
  }
  const { rows } = await sql`
    SELECT m.*, t.tree_code
    FROM maintenance_logs m
    LEFT JOIN trees t ON t.id = m.tree_id
    ORDER BY m.date DESC LIMIT 100
  `
  return NextResponse.json(rows)
}
export async function POST(req: NextRequest) {
  const user = req.headers.get('x-user') || 'system'
  const b = await req.json()
  const { rows } = await sql`
    INSERT INTO maintenance_logs (tree_id, activity, date, done_by, photo_url, remarks, next_due_date, created_by)
    VALUES (${b.tree_id}, ${b.activity}, ${b.date}, ${b.done_by||null}, ${b.photo_url||null},
            ${b.remarks||null}, ${b.next_due_date||null}, ${user})
    RETURNING *
  `
  // Also update next reminder if exists
  if (b.next_due_date) {
    await sql`
      UPDATE reminders SET next_due=${b.next_due_date}, status='pending', last_sent=NOW()
      WHERE tree_id=${b.tree_id} AND activity_type=${b.activity}
    `
  }
  return NextResponse.json(rows[0])
}
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await sql`DELETE FROM maintenance_logs WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
