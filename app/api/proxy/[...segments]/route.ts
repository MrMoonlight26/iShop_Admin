import { NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/api-config'

export async function POST(req: Request) {
  return await proxy(req)
}
export async function GET(req: Request) {
  return await proxy(req)
}
export async function PUT(req: Request) {
  return await proxy(req)
}
export async function DELETE(req: Request) {
  return await proxy(req)
}
export async function PATCH(req: Request) {
  return await proxy(req)
}

async function proxy(req: Request) {
  try {
    const url = new URL(req.url)
    const prefix = '/api/proxy'
    const suffix = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname
    const target = getApiUrl(`/api/v1${suffix}`) + url.search

    // Build headers: forward incoming headers except host
    const incoming = Object.fromEntries(req.headers.entries())
    const headers: Record<string, string> = {}
    for (const [k, v] of Object.entries(incoming)) {
      if (k.toLowerCase() === 'host') continue
      headers[k] = String(v)
    }

    // Attach Authorization header from HttpOnly cookie if present
    const cookieHeader = req.headers.get('cookie') || ''
    // eslint-disable-next-line no-console
    console.debug('[proxy] incoming cookie header:', cookieHeader)
    const accessMatch = cookieHeader.match('(?:^|; )ACCESS_TOKEN=([^;]*)')
    if (accessMatch && accessMatch[1]) {
      headers['Authorization'] = `Bearer ${decodeURIComponent(accessMatch[1])}`
    }

    // Ensure content-type is forwarded when body present
    const method = req.method.toUpperCase()
    let body: any = undefined
    if (method !== 'GET' && method !== 'HEAD') {
      body = await req.text()
    }

    const externalRes = await fetch(target, { method, headers, body })
    // eslint-disable-next-line no-console
    console.debug('[proxy] target:', target, 'attached Authorization?', !!headers['Authorization'])
    const resBody = await externalRes.arrayBuffer()
    // eslint-disable-next-line no-console
    console.debug('[proxy] external response status', externalRes.status)

    const res = new NextResponse(resBody, { status: externalRes.status })
    // copy content-type
    const ct = externalRes.headers.get('content-type')
    if (ct) res.headers.set('content-type', ct)

    return res
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 })
  }
}
