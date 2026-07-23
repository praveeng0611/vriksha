export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

export async function GET() {
  await initDB()
  const { rows } = await sql`SELECT * FROM species ORDER BY local_name`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const b = await req.json()
  const { rows } = await sql`
    INSERT INTO species (local_name, scientific_name, family, typical_height_m, care_notes)
    VALUES (${b.local_name}, ${b.scientific_name||null}, ${b.family||null}, ${b.typical_height_m||null}, ${b.care_notes||null})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}
