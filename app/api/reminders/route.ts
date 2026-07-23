export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  await initDB()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const tree_id = searchParams.get('tree_id')

  let q = `SELECT r.*, t.tree_code FROM reminders r LEFT JOIN trees t ON t.id = r.tree_id WHERE 1=1`
  if (status)  q += ` AND r.status = '${status}'`
  if (tree_id) q += ` AND r.tree_id = ${Number(tree_id)}`
  q += ` ORDER BY r.next_due ASC LIMIT 100`

  const { rows } = await sql.query(q)

  // Auto-mark overdue
  await sql`UPDATE reminders SET status='overdue' WHERE next_due < CURRENT_DATE AND status='pending'`

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const b = await req.json()
  const { rows } = await sql`
    INSERT INTO reminders (tree_id, activity_type, frequency_days, next_due, status, channel)
    VALUES (${b.tree_id}, ${b.activity_type}, ${b.frequency_days||3}, ${b.next_due}, 'pending', ${b.channel||'whatsapp'})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest) {
  const b = await req.json()
  const { rows } = await sql`
    UPDATE reminders SET status=${b.status}, next_due=${b.next_due} WHERE id=${b.id} RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await sql`DELETE FROM reminders WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
