"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService, type LoginRequest, type LoginResponse } from '../../lib/frontendAuth'

type AuthState = { isAuthenticated: boolean; profile?: any }

type AuthContextValue = AuthState & {
  login: (payload: LoginRequest) => Promise<LoginResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    async function init() {
      const token = authService.getAccessToken()
      if (token) {
        if (!mounted) return
        setIsAuthenticated(true)
        return
      }
      const refreshed = await authService.refresh()
      if (refreshed && mounted) setIsAuthenticated(true)
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  const login = async (payload: LoginRequest) => {
    const res = await authService.login(payload)
    // login returned success when server set cookies
    if (res && res.success) setIsAuthenticated(true)
    if (!res.isProfileComplete) router.push('/admin/settings/profile')
    return res
  }

  const logout = () => {
    authService.clear()
    setIsAuthenticated(false)
    const { signinPath } = require('../../lib/appPaths')
    router.push(signinPath())
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
