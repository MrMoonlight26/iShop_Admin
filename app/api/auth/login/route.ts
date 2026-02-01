import { NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/api-config'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Ensure clientId is present in the JSON body as required by the backend
    try {
      if (!body || typeof body !== 'object') {
        // ensure body is an object
      }
      if (body && !body.clientId) body.clientId = 'ADMIN_APP'
    } catch (e) {}

    const externalRes = await fetch(getApiUrl('/api/v1/auth/login/email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await externalRes.json()
    if (!externalRes.ok) return NextResponse.json({ error: 'Login failed' }, { status: externalRes.status })

    // Log external response headers and body for debugging
    try {
      // eslint-disable-next-line no-console
      console.debug('[auth/login] external response status', externalRes.status)
      const setCookie = externalRes.headers.get('set-cookie')
      // eslint-disable-next-line no-console
      console.debug('[auth/login] external set-cookie header', setCookie)
      // eslint-disable-next-line no-console
      console.debug('[auth/login] external response body', JSON.stringify(data))
    } catch (e) {}

    // Detect tokens either returned in JSON or provided via Set-Cookie header
    let forwarded = ''
    try {
      forwarded = externalRes.headers.get('set-cookie') || ''
    } catch (e) { forwarded = '' }

    let parsedAccess: string | null = null
    let parsedRefresh: string | null = null
    // try to parse accessToken and refreshToken values from the header
    try {
      if (forwarded) {
        const mAccess = forwarded.match(/accessToken=([^;\s,]+)/)
        const mRefresh = forwarded.match(/refreshToken=([^;\s,]+)/)
        if (mAccess) parsedAccess = decodeURIComponent(mAccess[1])
        if (mRefresh) parsedRefresh = decodeURIComponent(mRefresh[1])
      }
    } catch (e) {}

    const cookiesSet = { access: !!(data.accessToken || parsedAccess), refresh: !!(data.refreshToken || parsedRefresh) }
    const res = NextResponse.json({ isProfileComplete: data.isProfileComplete, cookiesSet })

    const secure = (process.env.NODE_ENV === 'production')

    // Prefer explicit token values from JSON, fallback to parsed cookie header values
    try {
      const accessVal = data.accessToken || parsedAccess
      const refreshVal = data.refreshToken || parsedRefresh
      if (accessVal) {
        res.cookies.set({ name: 'ACCESS_TOKEN', value: accessVal, httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 60 * 60 })
      }
      if (refreshVal) {
        res.cookies.set({ name: 'REFRESH_TOKEN', value: refreshVal, httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 7 * 24 * 60 * 60 })
      }
    } catch (e) {}

    // Also forward raw Set-Cookie header(s) if present (best-effort)
    try {
      if (forwarded) res.headers.append('set-cookie', forwarded)
    } catch (e) {}

    return res
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
