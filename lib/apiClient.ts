import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import { authService } from './frontendAuth'

// Proxy all API calls through the internal proxy so HttpOnly cookies are used server-side
const api: AxiosInstance = axios.create({ baseURL: '/api/proxy', withCredentials: true })

let isRefreshing = false
let failedQueue: Array<{ resolve: (val?: any) => void; reject: (err: any) => void; config: AxiosRequestConfig }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error)
    else {
      if (token && p.config.headers) p.config.headers.Authorization = `Bearer ${token}`
      p.resolve(api(p.config))
    }
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  // Do not attach Authorization here; proxy route will read HttpOnly cookie and set it server-side.
  config.headers = { ...(config.headers as any), 'X-Client-Id': 'ADMIN_APP', 'X-App-Instance-Id': authService.getAppInstanceId() }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError & { config?: AxiosRequestConfig }) => {
    const originalConfig = error.config

    if (error.response?.status === 401 && originalConfig && !(originalConfig as any)._retry) {
        // Log the 401 and the request URL for debugging
        try {
          console.error('API 401 on:', originalConfig?.url, 'response:', error.response?.data)
        } catch (e) {}

        // Only trigger auth clear/redirect for API requests (avoid logging out on unrelated 401s)
        const reqUrl = String(originalConfig?.url || '')
        const isApiRequest = reqUrl.includes('/api') || (originalConfig?.baseURL && String(originalConfig.baseURL).includes('/api'))
        if (!isApiRequest) {
          console.warn('Received 401 from non-API request, skipping auth clear/redirect:', reqUrl)
          return Promise.reject(error)
        }

        if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalConfig })
        })
      }

      ;(originalConfig as any)._retry = true
      isRefreshing = true

      try {
        const newToken = await authService.refresh()
        processQueue(null, newToken)
        return api({ ...originalConfig, headers: { ...(originalConfig.headers || {}), Authorization: `Bearer ${newToken}` } })
      } catch (err) {
        processQueue(err, null)
        authService.clear()
        if (typeof window !== 'undefined') {
          const { signinPath } = await import('./appPaths')
          window.location.href = signinPath()
        }
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export { api }
