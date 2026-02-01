import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const res = NextResponse.json({ ok: true })
    const secure = (process.env.NODE_ENV === 'production')

    res.cookies.set({ name: 'ACCESS_TOKEN', value: '', httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 0 })
    res.cookies.set({ name: 'REFRESH_TOKEN', value: '', httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 0 })

    return res
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
