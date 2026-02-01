"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '../lib/frontendAuth'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    async function check() {
      // First, ask NextAuth session endpoint (server-side cookie will be used)
      try {
        const sres = await fetch('/api/auth/session', { credentials: 'include' })
        if (sres.ok) {
          const body = await sres.json().catch(() => ({}))
          if (body && body.user) {
            if (mounted) setReady(true)
            return
          }
        }
      } catch (e) {}

      // Fallback: try refresh flow which uses HttpOnly refresh cookie server-side
      const refreshed = await authService.refresh()
      if (!refreshed) {
        const { signinPath } = await import('../lib/appPaths')
        router.push(signinPath())
        return
      }
      if (mounted) setReady(true)
    }
    check()
    return () => {
      mounted = false
    }
  }, [router])

  if (!ready) return null
  return <>{children}</>
}
