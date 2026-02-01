"use client"

import React from 'react'
import { useAuth } from './providers/auth-provider'

export default function AuthControls() {
  const { isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => logout()}
        className="rounded px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  )
}
