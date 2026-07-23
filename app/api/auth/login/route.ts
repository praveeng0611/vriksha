import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'
import { signToken, COOKIE } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  await initDB()
  const { username, password } = await req.json()
  const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`
  if (!rows[0]) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const ok = await bcrypt.compare(password, rows[0].password_hash)
  if (!ok)  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const token = await signToken({ username: rows[0].username, role: rows[0].role })
  const res = NextResponse.json({ ok: true, role: rows[0].role })
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  return res
}
