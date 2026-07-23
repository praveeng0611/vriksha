import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vriksha-jwt-secret')
const PUBLIC = ['/login', '/scan', '/api/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('vriksha_token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const res = NextResponse.next()
    res.headers.set('x-user', String(payload.username))
    res.headers.set('x-role', String(payload.role))
    return res
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|leaflet).*)'] }
