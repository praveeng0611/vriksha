export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const [tree, maintenance, expenses, photos, reminders] = await Promise.all([
    sql`
      SELECT t.*, s.local_name AS species_local, s.scientific_name AS species_scientific,
             s.care_notes, p.name AS project_name,
             ct.name AS caretaker_name, ct.mobile AS caretaker_mobile, ct.whatsapp AS caretaker_wa,
             o.name AS owner_name, o.mobile AS owner_mobile
      FROM trees t
      LEFT JOIN species s ON s.id = t.species_id
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN tree_caretakers tc ON tc.tree_id = t.id AND tc.is_active = true
      LEFT JOIN caretakers ct ON ct.id = tc.caretaker_id
      LEFT JOIN tree_owners tow ON tow.tree_id = t.id
      LEFT JOIN owners o ON o.id = tow.owner_id
      WHERE t.id = ${id}
    `,
    sql`SELECT * FROM maintenance_logs WHERE tree_id=${id} ORDER BY date DESC LIMIT 20`,
    sql`SELECT * FROM expenses WHERE tree_id=${id} ORDER BY date DESC LIMIT 20`,
    sql`SELECT * FROM photos WHERE tree_id=${id} ORDER BY taken_at DESC`,
    sql`SELECT * FROM reminders WHERE tree_id=${id} ORDER BY next_due ASC`,
  ])

  if (!tree.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...tree.rows[0], maintenance: maintenance.rows, expenses: expenses.rows, photos: photos.rows, reminders: reminders.rows })
}
