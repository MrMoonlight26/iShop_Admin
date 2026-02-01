import { NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/api-config'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    // read refresh token from cookies on the server-side request
    const refreshToken = req.headers.get('cookie')?.match('(?:^|; )REFRESH_TOKEN=([^;]*)')?.[1]
    const appInstanceId = (body && body.appInstanceId) || ''

    if (!refreshToken) return NextResponse.json({ error: 'No refresh token' }, { status: 401 })

    const externalRes = await fetch(getApiUrl('/api/v1/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: decodeURIComponent(refreshToken), appInstanceId })
    })

    const data = await externalRes.json()
    if (!externalRes.ok) return NextResponse.json({ error: 'Refresh failed' }, { status: externalRes.status })

    const res = NextResponse.json({ ok: true })
    const secure = (process.env.NODE_ENV === 'production')

    if (data.accessToken) {
      res.cookies.set({ name: 'ACCESS_TOKEN', value: data.accessToken, httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 60 * 60 })
    }
    if (data.refreshToken) {
      res.cookies.set({ name: 'REFRESH_TOKEN', value: data.refreshToken, httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 7 * 24 * 60 * 60 })
    }

    return res
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
