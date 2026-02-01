import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const base = BASE_PATH.endsWith('/') ? BASE_PATH.slice(0, -1) : BASE_PATH
  const adminPrefix = `${base}/admin`
  const dashboardPrefix = `${base}/dashboard`

  const shouldProtect = pathname.startsWith(adminPrefix) || pathname.startsWith(dashboardPrefix)
  if (!shouldProtect) return NextResponse.next()

  const access = req.cookies.get('ACCESS_TOKEN')?.value
  if (!access) {
    const signInUrl = new URL((base || '') + '/signin', req.url)
    signInUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*']
}
