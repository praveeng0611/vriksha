export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  await initDB()
  const { rows } = await sql`SELECT id, username, email, role, created_at FROM users ORDER BY id`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const role = req.headers.get('x-role')
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await req.json()
  const hash = await bcrypt.hash(b.password, 10)
  const { rows } = await sql`
    INSERT INTO users (username, email, password_hash, role) VALUES (${b.username}, ${b.email||null}, ${hash}, ${b.role||'volunteer'})
    RETURNING id, username, email, role, created_at
  `
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest) {
  const role = req.headers.get('x-role')
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await req.json()
  if (b.password) {
    const hash = await bcrypt.hash(b.password, 10)
    await sql`UPDATE users SET role=${b.role}, password_hash=${hash} WHERE id=${b.id}`
  } else {
    await sql`UPDATE users SET role=${b.role} WHERE id=${b.id}`
  }
  const { rows } = await sql`SELECT id, username, email, role, created_at FROM users WHERE id=${b.id}`
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest) {
  const role = req.headers.get('x-role')
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  await sql`DELETE FROM users WHERE id=${id}`
  return NextResponse.json({ ok: true })
}
