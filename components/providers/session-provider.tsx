"use client"

import React from 'react'
import { SessionProvider } from 'next-auth/react'

export default function NextSessionProvider({ children }: { children: React.ReactNode }) {
  // Optional dev mock: set NEXT_PUBLIC_MOCK_ADMIN=true to enable a fake ADMIN session for local dev
  const enableMock = process.env.NEXT_PUBLIC_MOCK_ADMIN === 'true'

  const mockSession = enableMock
    ? {
        user: { name: 'Dev Admin', email: 'admin@example.com', role: 'ADMIN', id: 'dev' },
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
      }
    : undefined

  return <SessionProvider session={mockSession as unknown}>{children}</SessionProvider>
}
