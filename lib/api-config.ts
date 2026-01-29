/**
 * Centralized API configuration management
 * Handles dev/prod environment-based API URLs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

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
  options: RequestInit & { params?: Record<string, string | number | boolean> } = {}
): Promise<Response> {
  const { params, ...fetchOptions } = options
  const url = buildApiUrl(endpoint, params)
  
  return fetch(url, {
    ...fetchOptions,
    credentials: 'same-origin',
  })
}

const apiConfig = {
  getApiUrl,
  getApiBaseUrl,
  buildApiUrl,
  apiFetch,
}

export default apiConfig
