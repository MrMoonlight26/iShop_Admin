/**
 * Centralized API configuration management
 * Handles dev/prod environment-based API URLs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - API endpoint path (e.g., '/api/v1/admin/business-categories')
 * @returns Full API URL
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = API_BASE_URL.replace(/\/$/, '') // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${path}`
}

/**
 * Get base API URL
 * @returns API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL.replace(/\/$/, '')
}

/**
 * Build query parameters and return full URL
 * @param endpoint - API endpoint path
 * @param params - Query parameters object
 * @returns Full URL with query string
 */
export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string {
  const url = new URL(getApiUrl(endpoint))
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })
  }
  
  return url.toString()
}

/**
 * Fetch from API with automatic base URL handling
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit & { params?: Record<string, string | number | boolean>; headers?: Record<string, string> } = {}
): Promise<Response> {
  const { params, headers, ...fetchOptions } = options
  // If calling an /api/v1 backend endpoint from the client, route through
  // the internal server proxy (`/api/proxy`) so HttpOnly cookies can be
  // attached server-side. Otherwise build a normal URL.
  let url: string
  if (typeof window !== 'undefined' && endpoint.startsWith('/api/v1')) {
    // proxy path expects the suffix after /api/v1
    const suffix = endpoint.replace(/^\/api\/v1/, '')
    url = `/api/proxy${suffix}`
    if (params && Object.keys(params).length) {
      const sp = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => sp.append(k, String(v)))
      url += `?${sp.toString()}`
    }
  } else {
    url = buildApiUrl(endpoint, params)
  }

  // Add dev-only auth header when talking to localhost backend
  const defaultHeaders: Record<string, string> = {}
  try {
    const base = getApiBaseUrl()
    const runningOnLocalhost = base.includes("localhost") || (typeof window !== 'undefined' && window.location?.hostname?.includes('localhost'))
    if (runningOnLocalhost && process.env.NODE_ENV === "development") {
      defaultHeaders["x-dev-secret"] = "dev-secret"
    }
  } catch (e) {
    // ignore
  }

  return fetch(url, {
    ...fetchOptions,
    headers: { ...defaultHeaders, ...(headers || {}) },
    // include cookies for same-origin requests to allow HttpOnly cookies
    // to be sent to our Next.js server (proxy/routes/auth) when needed
    credentials: 'include',
  })
}

const apiConfig = {
  getApiUrl,
  getApiBaseUrl,
  buildApiUrl,
  apiFetch,
}

export default apiConfig
