/**
 * API Helper utilities for consistent error handling and loading states
 */

export interface ApiResponse<T> {
  data?: T
  error?: string
  loading?: boolean
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Fetch with error handling
 */
export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const message = errorData.message || `HTTP Error: ${response.status}`
      throw new ApiError(response.status, message)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'Unknown error occurred'
    )
  }
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 404) return 'Resource not found'
    if (error.statusCode === 403) return 'Access denied'
    if (error.statusCode === 401) return 'Please log in again'
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

/**
 * Retry logic for failed requests
 */
export async function fetchApiWithRetry<T>(
  url: string,
  options?: RequestInit,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchApi<T>(url, options)
    } catch (error) {
      lastError = error
      if (error instanceof ApiError && error.statusCode < 500) {
        // Don't retry client errors
        throw error
      }
      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
  }

  throw lastError
}
