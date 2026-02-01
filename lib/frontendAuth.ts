type LoginRequest = {
  email: string
  password: string
  clientId: 'ADMIN_APP'
  appInstanceId: string
  deviceToken: string
}

type LoginResponse = {
  // accessToken can't be read from HttpOnly cookie on client; indicate success via this flag
  success: boolean
  refreshToken?: string
  isProfileComplete: boolean
  profile?: any
}

type RefreshRequest = { refreshToken: string; appInstanceId?: string }
type RefreshResponse = { accessToken: string; refreshToken?: string; isProfileComplete?: boolean }

const REFRESH_COOKIE = 'REFRESH_TOKEN'
const ACCESS_COOKIE = 'ACCESS_TOKEN'
const APP_INSTANCE_KEY = 'APP_INSTANCE_ID'

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const v = document.cookie.match('(?:^|; )' + name + '=([^;]*)')
  return v ? decodeURIComponent(v[1]) : null
}

function setCookie(name: string, value: string, opts: { maxAge?: number } = {}) {
  if (typeof document === 'undefined') return
  const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'SameSite=Strict']
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') parts.push('Secure')
  document.cookie = parts.join('; ')
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Strict`
}

let accessToken: string | null = null
let refreshingPromise: Promise<string | null> | null = null

export const authService = {
  getAppInstanceId(): string {
    if (typeof window === 'undefined') return 'server'
    let id = localStorage.getItem(APP_INSTANCE_KEY) as string | null
    if (!id) {
      if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        id = (crypto as any).randomUUID()
      } else {
        id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      }
      localStorage.setItem(APP_INSTANCE_KEY, id!)
    }
    return id!
  },

  getAccessToken() {
    if (accessToken) return accessToken
    const fromCookie = getCookie(ACCESS_COOKIE)
    if (fromCookie) accessToken = fromCookie
    return accessToken
  },

  getRefreshToken() {
    return getCookie(REFRESH_COOKIE)
  },

  async login(payload: LoginRequest): Promise<LoginResponse> {
    // Call internal Next.js route which will forward to external backend and set HttpOnly cookies
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
    // helpful logging for diagnostics
    console.debug('[authService] login response status', res.status)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[authService] login failed response:', text)
      throw new Error('Login failed')
    }
    const data = await res.json()
    console.debug('[authService] login response body', data)

    // Server sets HttpOnly cookies; client cannot read access token directly.
    // Rely on server-reported `cookiesSet.access` when present, otherwise
    // treat a 200 response as success (best-effort) because tokens may be set via Set-Cookie only.
    const success = !!data?.cookiesSet?.access || res.status === 200
    // helpful cookie debug (will not show HttpOnly cookies, but helps detect non-HttpOnly traces)
    try {
      // eslint-disable-next-line no-console
      console.debug('[authService] document.cookie', typeof document !== 'undefined' ? document.cookie : null)
    } catch (e) {}

    return { success, refreshToken: getCookie(REFRESH_COOKIE) || undefined, isProfileComplete: !!data.isProfileComplete, profile: data.profile }
  },

  async refresh(): Promise<string | null> {
    const existing = refreshingPromise
    if (existing) return existing

    const promise = (async () => {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) return null
      // Call internal refresh route; server will read REFRESH_TOKEN cookie and forward to backend
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appInstanceId: this.getAppInstanceId() })
      })
      if (!res.ok) {
        this.clear()
        return null
      }
      const data: any = await res.json()
      accessToken = getCookie(ACCESS_COOKIE)
      return accessToken
    })()

    refreshingPromise = promise
    try {
      const t = await promise
      return t
    } finally {
      refreshingPromise = null
    }
  },

  clear() {
    accessToken = null
    if (typeof window !== 'undefined') {
      // Try to clear HttpOnly cookies via server route, then remove any non-HttpOnly traces
      try { fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {}) } catch (e) {}
      deleteCookie(ACCESS_COOKIE)
      deleteCookie(REFRESH_COOKIE)
    }
  }
}

export type { LoginRequest, LoginResponse, RefreshRequest, RefreshResponse }
